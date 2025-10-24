// File: app/api/coc/search-clan/route.ts
// Deskripsi: API Route untuk mencari dan meng-cache data klan publik.
// Dapat dipanggil untuk pencarian single tag (GET) atau untuk cron job update massal (POST).

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Menggunakan fungsi firestore yang sudah diupdate (Admin SDK untuk write, Client SDK untuk read)
import { getPublicClanIndex } from '@/lib/firestore'; // <<<--- Hanya perlu get (Client SDK)
import { updatePublicClanIndex } from '@/lib/firestore-admin'; // <<<--- Import update dari Admin SDK file
import { PublicClanIndex, CocClan } from '@/lib/types';
import { getClanTagsToMonitor } from '@/lib/server-utils'; // Fungsi untuk mendapatkan daftar klan

// Cache dianggap 'stale' (kadaluarsa) jika lebih dari 6 jam (6 * 60 * 60 * 1000 ms)
const CACHE_STALE_MS = 1000 * 60 * 60 * 6;

/**
 * Fungsi utilitas internal untuk mengambil data API dan mengupdate cache.
 * @param clanTag Tag Klan yang sudah di-encode.
 * @param forceUpdate Lewati pemeriksaan cache jika true.
 * @returns {Promise<PublicClanIndex>} Data klan yang sudah di-cache.
 * @throws {Error} Jika clan tidak ditemukan atau terjadi error API/Firestore.
 */
async function fetchAndUpdatePublicIndex(clanTag: string, forceUpdate: boolean = false): Promise<PublicClanIndex> {

    // 1. Cek Cache Firestore (Hanya jika tidak dipaksa update)
    let cachedData: PublicClanIndex | null = null; // Tipe eksplisit
    if (!forceUpdate) {
        cachedData = await getPublicClanIndex(clanTag); // getPublicClanIndex pakai Client SDK (aman)

        if (cachedData) {
            // Pastikan lastUpdated adalah objek Date
            const lastUpdatedDate = cachedData.lastUpdated instanceof Date
                ? cachedData.lastUpdated
                : new Date(cachedData.lastUpdated); // Fallback jika bukan Date

            if (!isNaN(lastUpdatedDate.getTime())) { // Cek apakah tanggal valid
                const isFresh = (Date.now() - lastUpdatedDate.getTime()) < CACHE_STALE_MS;
                if (isFresh) {
                    console.log(`[PUBLIC INDEX] Returning fresh cache for ${clanTag}`);
                    return cachedData;
                }
            } else {
                 console.warn(`[PUBLIC INDEX] Invalid lastUpdated timestamp found for ${clanTag}, forcing refresh.`);
            }
        }
    }

    // 2. Cache stale, tidak ada, atau dipaksa update: Fetch dari API CoC
    console.log(`[PUBLIC INDEX] Fetching live data for ${clanTag} (Force: ${forceUpdate})`);

    const apiData: CocClan = await cocApi.getClanData(clanTag);

    // 3. Transformasi dan Update Cache
    const newIndexData: Omit<PublicClanIndex, 'lastUpdated'> = {
        tag: apiData.tag,
        name: apiData.name,
        clanLevel: apiData.clanLevel,
        memberCount: apiData.memberCount,
        clanPoints: apiData.clanPoints,
        clanCapitalPoints: apiData.clanCapitalPoints || 0,
        clanVersusPoints: apiData.clanVersusPoints || 0,
        badgeUrls: apiData.badgeUrls,
        requiredTrophies: apiData.requiredTrophies,
        warFrequency: apiData.warFrequency,
        warWinStreak: apiData.warWinStreak || 0,
        warWins: apiData.warWins || 0,
        type: apiData.type,
        description: apiData.description,
        location: apiData.location
    };

    // Update/set dokumen di koleksi publicClanIndex (pakai Admin SDK)
    await updatePublicClanIndex(apiData.tag, newIndexData); // <<<--- Memanggil fungsi dari firestore-admin.ts

    // Dapatkan data yang diperbarui (dengan timestamp baru) - pakai Client SDK (aman)
    const updatedCache = await getPublicClanIndex(apiData.tag);
    if (!updatedCache) {
         console.error(`[PUBLIC INDEX] Failed to retrieve cache immediately after update for ${clanTag}`);
         return { ...newIndexData, lastUpdated: new Date() } as PublicClanIndex;
    }
    return updatedCache;
}


// =========================================================================
// ENDPOINT PUBLIK (SEARCH - GET)
// =========================================================================

/**
 * @function GET
 * Endpoint untuk mencari klan publik (Single Tag Search).
 */
export async function GET(request: NextRequest) {
    const clanTagParam = request.nextUrl.searchParams.get('clanTag');

    if (!clanTagParam) {
        return NextResponse.json({ error: 'Missing clanTag parameter.' }, { status: 400 });
    }
     const clanTag = clanTagParam.trim().toUpperCase();
     const encodedTag = encodeURIComponent(clanTag.startsWith('#') ? clanTag : `#${clanTag}`);

    try {
        const clanData = await fetchAndUpdatePublicIndex(encodedTag, false);
        return NextResponse.json({
            clan: clanData,
            source: clanData.lastUpdated && (Date.now() - new Date(clanData.lastUpdated).getTime()) < 10000 ? 'live' : 'cache'
        }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
         if (errorMessage.startsWith('notFound')) {
             return NextResponse.json({ error: `Clan with tag ${clanTag} not found.` }, { status: 404 });
         }
         if (errorMessage.includes('Forbidden')) {
              return NextResponse.json({ error: `Access denied (403). Check API Key/IP. Detail: ${errorMessage}` }, { status: 403 });
         }
        console.error(`Error during public clan search for ${clanTag}:`, error);
        return NextResponse.json({ error: `Search failed: ${errorMessage}` }, { status: 500 });
    }
}

// =========================================================================
// ENDPOINT CRON JOB (MASS UPDATE - POST)
// =========================================================================

/**
 * @function POST
 * Endpoint yang hanya dipanggil oleh Cron Job untuk memperbarui PublicClanIndex.
 */
export async function POST(request: NextRequest) {
    // TODO: Add Cron Job authentication

    console.log('[CRON JOB] Starting mass update for Public Clan Index...');
    const startTime = Date.now();
    let updatedCount = 0;
    let failedCount = 0;

    try {
        const tagsToUpdate: string[] = getClanTagsToMonitor();

        if (tagsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No clan tags configured for public index update.' }, { status: 200 });
        }

        const updatePromises = tagsToUpdate.map(async (tag: string) => {
             const encodedTag = encodeURIComponent(tag.startsWith('#') ? tag : `#${tag}`);
            try {
                await fetchAndUpdatePublicIndex(encodedTag, true); // forceUpdate=true
                updatedCount++;
                return { tag, status: 'Success' };
            } catch (error) {
                 failedCount++;
                 const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                 if (errorMsg.startsWith('notFound')) {
                     console.warn(`[CRON JOB] Clan ${tag} not found during mass update.`);
                     return { tag, status: 'Not Found' };
                 } else {
                     console.error(`[CRON JOB] Failed to update public index for ${tag}:`, errorMsg);
                     return { tag, status: 'Failed', error: errorMsg };
                 }
            }
        });

        const results = await Promise.all(updatePromises);
        const duration = Date.now() - startTime;

        console.log(`[CRON JOB] Finished Public Index Update. Success: ${updatedCount}, Not Found: ${results.filter(r=>r.status === 'Not Found').length}, Failed: ${failedCount}. Total: ${tagsToUpdate.length}. Duration: ${duration}ms`);

        return NextResponse.json({
            message: `Public Clan Index update complete. Updated ${updatedCount}/${tagsToUpdate.length} clans.`,
            results: results,
            durationMs: duration
        }, { status: 200 });

    } catch (error) {
        console.error('[CRON JOB] Fatal error during mass update setup:', error);
        return NextResponse.json({ error: `Mass update failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}

