// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route untuk menyinkronkan data ManagedClan internal dengan API CoC.
// Dipanggil secara manual (oleh manager) atau otomatis (oleh Cron Job).

import { NextRequest, NextResponse } from 'next/server';
import cocApi from '@/lib/coc-api';
import { getManagedClanData, updateClanApiCache, getUserProfile } from '@/lib/firestore';
// Import ClanRole untuk otorisasi, dan tipe data lainnya
import { ManagedClan, ClanApiCache, CocMember, CocWarLog, UserProfile, ClanRole } from '@/lib/types';
import { getAggregatedParticipationData } from './logic/participationAggregator'; 

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30; 

/**
 * @function GET
 * Endpoint untuk menyinkronkan data ManagedClan internal dengan API Clash of Clans.
 * * URL: /api/coc/sync-managed-clan?clanId=CLAN_ID
 * Header: X-Request-UID: USER_UID (untuk otentikasi/otorisasi manual sync)
 */
export async function GET(request: NextRequest) {
    const clanId = request.nextUrl.searchParams.get('clanId');
    // Ambil UID dari header (digunakan untuk otorisasi manual sync)
    const userUid = request.headers.get('X-Request-UID'); 

    if (!clanId) {
        return NextResponse.json({ error: 'Missing clanId parameter.' }, { status: 400 });
    }

    try {
        // 1. Otorisasi & Ambil ManagedClan
        const managedClan: ManagedClan | null = await getManagedClanData(clanId);

        if (!managedClan) {
            return NextResponse.json({ error: 'Managed Clan not found.' }, { status: 404 });
        }
        
        // Cek Otorisasi (Hanya pemilik klan atau cron job yang dapat memicu sinkronisasi)
        if (userUid) {
            // Ini adalah sinkronisasi manual. Cek apakah user adalah owner atau co-leader yang diizinkan.
            const user = await getUserProfile(userUid);
            const userClanRole = user?.clanRole?.toLowerCase() as ClanRole | undefined;

            if (managedClan.ownerUid !== userUid && 
                userClanRole !== ClanRole.LEADER && 
                userClanRole !== ClanRole.CO_LEADER) 
            {
                 return NextResponse.json({ error: 'Unauthorized. Only clan managers can trigger manual sync.' }, { status: 403 });
            }
        }
        // Catatan: Jika userUid null, diasumsikan panggilan berasal dari Cron Job yang terpercaya.

        // 2. Cek Stale Cache (Jika dipicu oleh cron job, kita bisa lewatkan jika cache masih segar)
        const lastSynced = managedClan.lastSynced.getTime();
        // Hanya lewati sync jika BUKAN sync manual (userUid adalah null) DAN cache masih segar
        if (!userUid && (Date.now() - lastSynced < CACHE_STALE_MS)) {
            console.log(`[SYNC SKIP] Clan ${managedClan.tag} cache is fresh.`);
            return NextResponse.json({ message: 'Cache is fresh. Skipping full sync.' }, { status: 200 });
        }

        // 3. Ambil Data API Mentah
        console.log(`[SYNC START] Fetching API data for clan: ${managedClan.tag}`);
        // Memastikan tipe data yang diambil sesuai dengan definisi
        const [clanData, warLogData, currentWarData] = await Promise.all([
            cocApi.getClanData(managedClan.tag),
            cocApi.getClanWarLog(managedClan.tag),
            cocApi.getClanCurrentWar(managedClan.tag),
            // TODO: Tambahkan cocApi.getClanRaidLog(managedClan.tag) di masa depan
        ]);
        
        // Pastikan memberList tersedia untuk agregasi
        if (!clanData.memberList) {
             throw new Error("Clan data retrieved but member list is missing or empty.");
        }

        // 4. Hitung Metrik Partisipasi (Replikasi Logika Aggregators.js)
        const participationMembers: ClanApiCache['members'] = getAggregatedParticipationData(
             clanData.memberList as CocMember[],
             warLogData as CocWarLog // War log lengkap untuk perhitungan
        );
        
        // 5. Buat Payload Cache
        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            currentWar: currentWarData || undefined, // Simpan War Aktif atau undefined
            currentRaid: undefined, // PLACEHOLDER
            members: participationMembers,
        };

        // 6. Buat Payload ManagedClan Metadata (Untuk dokumen utama)
        const totalThLevel = clanData.memberList.reduce((sum, member) => sum + member.townHallLevel, 0);
        const avgTh = clanData.memberList.length > 0
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
        return NextResponse.json({ error: `Sync failed for clan ${clanId}: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}
