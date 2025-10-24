// File: app/api/coc/sync-managed-clan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import cocApi from '@/lib/coc-api';
import { getManagedClanData, updateClanApiCache, getUserProfile } from '@/lib/firestore';
import { ManagedClan, ClanApiCache, CocMember, CocWarLog, UserProfile } from '@/lib/types';
import { getAggregatedParticipationData } from './logic/participationAggregator'; // Akan kita buat

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30; 

/**
 * @function GET
 * Endpoint untuk menyinkronkan data ManagedClan internal dengan API Clash of Clans.
 * Hanya dapat dipanggil oleh pemilik/admin klan, atau secara otomatis melalui cron job.
 * * URL: /api/coc/sync-managed-clan?clanId=CLAN_ID
 * Header: X-Request-UID: USER_UID (untuk otentikasi/otorisasi manual sync)
 */
export async function GET(request: NextRequest) {
    const clanId = request.nextUrl.searchParams.get('clanId');
    const userUid = request.headers.get('X-Request-UID'); // Digunakan untuk otorisasi manual sync

    if (!clanId) {
        return NextResponse.json({ error: 'Missing clanId parameter.' }, { status: 400 });
    }

    try {
        // 1. Otorisasi & Ambil ManagedClan
        const managedClan: ManagedClan | null = await getManagedClanData(clanId);

        if (!managedClan) {
            return NextResponse.json({ error: 'Managed Clan not found.' }, { status: 404 });
        }
        
        // Cek Otorisasi (Hanya pemilik yang dapat memicu sinkronisasi manual)
        if (userUid && managedClan.ownerUid !== userUid) {
             // Cron job tidak akan memiliki X-Request-UID, jadi pengecekan ini hanya untuk manual sync
             const user = await getUserProfile(userUid);
             if (!user || user.clanRole !== 'leader' && user.clanRole !== 'coLeader') {
                return NextResponse.json({ error: 'Unauthorized. Only clan owners/admins can trigger manual sync.' }, { status: 403 });
             }
        }

        // 2. Cek Stale Cache (Jika dipicu oleh cron job, kita bisa lewatkan jika cache masih segar)
        const lastSynced = managedClan.lastSynced.getTime();
        if (!userUid && (Date.now() - lastSynced < CACHE_STALE_MS)) {
            return NextResponse.json({ message: 'Cache is fresh. Skipping full sync.' }, { status: 200 });
        }

        // 3. Ambil Data API Mentah
        console.log(`[SYNC] Fetching API data for clan: ${managedClan.tag}`);
        const [clanData, warLogData, currentWarData] = await Promise.all([
            cocApi.getClanData(managedClan.tag),
            cocApi.getClanWarLog(managedClan.tag),
            cocApi.getClanCurrentWar(managedClan.tag),
            // TODO: Tambahkan cocApi.getClanRaidLog(managedClan.tag) di masa depan
        ]);
        
        // 4. Hitung Metrik Partisipasi (Replikasi Logika Aggregators.js)
        // Kita akan membuat fungsi ini di file terpisah untuk menjaga kebersihan API route
        const participationMembers: ClanApiCache['members'] = getAggregatedParticipationData(
             clanData.memberList as CocMember[],
             warLogData as CocWarLog // War log lengkap untuk perhitungan
             // TODO: Tambahkan log Raid/CWL log spesifik lainnya di sini
        );
        
        // 5. Buat Payload Cache
        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            currentWar: currentWarData as CocWarLog | undefined, // Simpan War Aktif
            currentRaid: undefined, // PLACEHOLDER
            members: participationMembers,
        };

        // 6. Buat Payload ManagedClan Metadata (Untuk dokumen utama)
        const totalThLevel = clanData.memberList?.reduce((sum, member) => sum + member.townHallLevel, 0) || 0;
        const avgTh = clanData.memberList && clanData.memberList.length > 0
            ? Math.round(totalThLevel / clanData.memberList.length)
            : 0;

        const updatedManagedClanFields: Partial<ManagedClan> = {
            logoUrl: clanData.badgeUrls.large,
            avgTh: avgTh,
            clanLevel: clanData.clanLevel,
            memberCount: clanData.memberCount,
            // lastSynced akan di-update di fungsi updateClanApiCache
        };
        
        // 7. Simpan ke Firestore
        await updateClanApiCache(clanId, newCacheData, updatedManagedClanFields);

        return NextResponse.json({ 
            message: `Managed Clan ${managedClan.name} synced successfully.`,
            syncedAt: new Date(),
            memberCount: clanData.memberCount
        }, { status: 200 });

    } catch (error) {
        console.error('Error during clan sync:', error);
        return NextResponse.json({ error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}