// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route untuk menyinkronkan data ManagedClan internal dengan API CoC.
// Dipanggil secara manual (oleh manager) atau otomatis (oleh Cron Job).

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Import fungsi Client SDK untuk read dan fungsi Admin SDK untuk write
import { getUserProfile, getManagedClanData } from '@/lib/firestore'; // Hanya perlu read
// FIX: Import fungsi read baru dan updateClanApiCache dari lib/firestore-admin.ts
import { updateClanApiCache, RoleChangeLog, getRoleLogsByClanId, getCwlArchivesByClanId } from '@/lib/firestore-admin'; 
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import {
    ManagedClan,
    ClanApiCache,
    CocMember,
    CocWarLog,
    UserProfile,
    ClanRole,
} from '@/lib/types'; // Import ClanRole untuk otorisasi
import { getAggregatedParticipationData } from './logic/participationAggregator';
// Import tipe data dari file lokal yang baru dibuat
import { ClanWarLog, CwlWarLog } from './logic/types'; 

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30;

// =========================================================================
// FUNGSI TEMPORARY FIREBASE READ DIHAPUS - DIGANTIKAN OLEH IMPORT
// =========================================================================

/**
 * @function GET
 * Endpoint untuk menyinkronkan data ManagedClan internal dengan API Clash of Clans.
 */
export async function GET(request: NextRequest) {
    const clanId = request.nextUrl.searchParams.get('clanId');
    const userUid = request.headers.get('X-Request-UID'); // Untuk otorisasi manual sync

    if (!clanId) {
        return NextResponse.json(
            { error: 'Missing clanId parameter.' },
            { status: 400 }
        );
    }

    let managedClan: ManagedClan | null = null; // Definisikan di scope luar try

    try {
        // 1. Otorisasi & Ambil ManagedClan (Gunakan Client SDK untuk get)
        managedClan = await getManagedClanData(clanId);

        if (!managedClan) {
            return NextResponse.json(
                { error: 'Managed Clan not found.' },
                { status: 404 }
            );
        }

        // Cek Otorisasi
        if (userUid) {
            // Manual sync
            const user = await getUserProfile(userUid); // Client SDK ok
            // Gunakan clanRole dari UserProfile (role CoC), bukan role Clashub ('Leader'/'Co-Leader' string)
            const userClanRole = user?.clanRole?.toLowerCase() as ClanRole | undefined;

            // Izinkan jika UID cocok ATAU jika user adalah Leader/Co-Leader CoC di klan tersebut
            if (
                managedClan.ownerUid !== userUid &&
                userClanRole !== ClanRole.LEADER &&
                userClanRole !== ClanRole.CO_LEADER
            ) {
                return NextResponse.json(
                    {
                        error:
                            'Unauthorized. Only clan managers (Leader/Co-Leader verified) can trigger manual sync.',
                    },
                    { status: 403 }
                );
            }
        }
        // Jika userUid null (Cron Job), lanjutkan

        // 2. Cek Stale Cache
        const lastSyncedDate =
            managedClan.lastSynced instanceof Date
                ? managedClan.lastSynced
                : new Date(managedClan.lastSynced); // Fallback

        if (
            !userUid &&
            !isNaN(lastSyncedDate.getTime()) &&
            Date.now() - lastSyncedDate.getTime() < CACHE_STALE_MS
        ) {
            console.log(`[SYNC SKIP] Clan ${managedClan.tag} cache is fresh.`);
            return NextResponse.json(
                { message: 'Cache is fresh. Skipping full sync.' },
                { status: 200 }
            );
        }

        // 3. Ambil Data API Mentah & Data Internal Firestore
        // Siapkan tag mentah dan tag yang di-encode untuk API call
        const rawClanTag = managedClan.tag;
        // Pastikan tag memiliki '#' sebelum encoding (meskipun seharusnya sudah ada)
        const encodedClanTag = encodeURIComponent(
            rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`
        );

        console.log(`[SYNC START] Fetching API data for clan: ${rawClanTag}`);
        
        // Parallel fetch data dari CoC API dan Firestore
        const [clanData, warLogData, currentWarData, roleLogs, cwlArchives] = await Promise.all([
            cocApi.getClanData(encodedClanTag),
            cocApi.getClanWarLog(encodedClanTag),
            cocApi.getClanCurrentWar(encodedClanTag, rawClanTag), 
            // Ambil Log Perubahan Role dari Firestore (FIXED IMPORT)
            getRoleLogsByClanId(clanId), 
            // Ambil Arsip CWL dari Firestore (FIXED IMPORT)
            getCwlArchivesByClanId(clanId),
            // TODO: Tambahkan cocApi.getClanRaidLog(encodedClanTag)
        ]);

        if (!clanData.memberList || clanData.memberList.length === 0) {
            // Handle case where API returns clan data but no members (e.g., empty clan)
            console.warn(
                `[SYNC WARN] Clan ${managedClan.tag} data retrieved but member list is missing or empty.`
            );
            // Tetap lanjutkan untuk update cache kosong jika perlu
        }

        // 4. Hitung Metrik Partisipasi (Memperbaiki error argumen)
        // WARNLING: warLogData di sini adalah CocWarLog dari lib/types.
        // participationAggregator membutuhkan ClanWarLog dari ./logic/types, yang memiliki struktur berbeda.
        // Kita paksa konversi tipe di sini (karena API response structure sama dengan ClanWarLog interface yang kita buat)
        const participationMembers: ClanApiCache['members'] =
            getAggregatedParticipationData({
                currentMembers: (clanData.memberList || []) as CocMember[],
                warLog: warLogData as ClanWarLog, // FIX: Menggunakan tipe ClanWarLog
                cwlArchives: cwlArchives as CwlWarLog[], // FIX: Meneruskan data CWL dengan konversi
                roleLogs: roleLogs,       // FIX: Meneruskan data Role Logs
            });

        // 5. Buat Payload Cache
        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            currentWar: currentWarData || undefined,
            currentRaid: undefined, // PLACEHOLDER
            members: participationMembers,
        };

        // 6. Buat Payload ManagedClan Metadata
        const totalThLevel = (clanData.memberList || []).reduce(
            (sum, member) => sum + member.townHallLevel,
            0
        );
        const memberCountActual = clanData.memberList?.length || 0;
        const avgTh =
            memberCountActual > 0
                ? Math.round(totalThLevel / memberCountActual) // Gunakan pembagi aktual
                : 0;

        const updatedManagedClanFields: Partial<ManagedClan> = {
            logoUrl: clanData.badgeUrls.large,
            avgTh: avgTh,
            clanLevel: clanData.clanLevel,
            memberCount: memberCountActual, // Gunakan jumlah aktual
            // lastSynced akan di-update di fungsi updateClanApiCache
        };

        // 7. Simpan ke Firestore (Gunakan fungsi Admin SDK)
        await updateClanApiCache(clanId, newCacheData, updatedManagedClanFields); 

        return NextResponse.json(
            {
                message: `Managed Clan ${managedClan.name} synced successfully.`,
                syncedAt: new Date(),
                memberCount: memberCountActual,
            },
            { status: 200 }
        );
    } catch (error) {
        // Logging error yang lebih informatif
        const clanTagForLog = managedClan?.tag || `ID: ${clanId}`;
        console.error(`Error during clan sync for ${clanTagForLog}:`, error);

        // Penanganan error spesifik dari API
        let errorMessage = `Sync failed for clan ${clanTagForLog}: ${
            error instanceof Error ? error.message : 'Unknown error'
        }`;
        let statusCode = 500;
        if (error instanceof Error) {
            if (error.message.startsWith('notFound')) {
                statusCode = 404;
                errorMessage = `Clan ${clanTagForLog} not found in CoC API. Cannot sync.`;
            } else if (error.message.includes('Forbidden')) {
                statusCode = 403;
                errorMessage = `Access denied (403) for clan ${clanTagForLog}. Check API Key/IP.`;
            } else if (error.message.includes('Gagal menyimpan cache')) {
                // Error dari firestore-admin
                errorMessage = `API data fetched for ${clanTagForLog}, but failed to save cache. ${error.message}`;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
