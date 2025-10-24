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
    // --- DEBUG LOGGING ---
    console.log(`[fetchAndUpdatePublicIndex] Started for tag: ${clanTag}, forceUpdate: ${forceUpdate}`);
    // --- END DEBUG LOGGING ---

    // 1. Cek Cache Firestore (Hanya jika tidak dipaksa update)
    let cachedData: PublicClanIndex | null = null; // Tipe eksplisit
    if (!forceUpdate) {
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Checking Firestore cache for ${clanTag}...`);
        // --- END DEBUG LOGGING ---
        try {
            cachedData = await getPublicClanIndex(clanTag); // getPublicClanIndex pakai Client SDK (aman)
             // --- DEBUG LOGGING ---
             console.log(`[fetchAndUpdatePublicIndex] Firestore cache result for ${clanTag}: ${cachedData ? 'Found' : 'Not Found'}`);
             // --- END DEBUG LOGGING ---

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
                    } else {
                         console.log(`[fetchAndUpdatePublicIndex] Cache for ${clanTag} is stale.`);
                    }
                } else {
                     console.warn(`[PUBLIC INDEX] Invalid lastUpdated timestamp found for ${clanTag}, forcing refresh.`);
                }
            }
        } catch (cacheError) {
            console.error(`[fetchAndUpdatePublicIndex] Error checking Firestore cache for ${clanTag}:`, cacheError);
            // Lanjutkan untuk fetch dari API jika cache error
        }
    } else {
         console.log(`[fetchAndUpdatePublicIndex] Force update enabled, skipping cache check for ${clanTag}.`);
    }

    // 2. Cache stale, tidak ada, atau dipaksa update: Fetch dari API CoC
    console.log(`[PUBLIC INDEX] Fetching live data for ${clanTag} (Force: ${forceUpdate})`);

    let apiData: CocClan;
    try {
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Calling cocApi.getClanData with tag: ${clanTag}`);
        // --- END DEBUG LOGGING ---
        apiData = await cocApi.getClanData(clanTag);
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Successfully fetched API data for ${clanTag}. Clan Name: ${apiData.name}`);
        // --- END DEBUG LOGGING ---
    } catch (apiError) {
        // --- DEBUG LOGGING ---
        console.error(`[fetchAndUpdatePublicIndex] Error calling cocApi.getClanData for ${clanTag}:`, apiError);
        // --- END DEBUG LOGGING ---
        // Lempar ulang error agar bisa ditangkap oleh GET handler
        throw apiError;
    }


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
    try {
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Updating Firestore cache (publicClanIndex) for ${apiData.tag}...`);
        // --- END DEBUG LOGGING ---
        await updatePublicClanIndex(apiData.tag, newIndexData); // <<<--- Memanggil fungsi dari firestore-admin.ts
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Firestore cache updated for ${apiData.tag}.`);
        // --- END DEBUG LOGGING ---
    } catch (updateError) {
        console.error(`[fetchAndUpdatePublicIndex] Error updating Firestore cache for ${apiData.tag}:`, updateError);
        // Pertimbangkan: apakah harus throw error atau mengembalikan data API meskipun cache gagal?
        // Untuk sekarang, kita log error tapi tetap coba kembalikan data baru
    }


    // Dapatkan data yang diperbarui (dengan timestamp baru) - pakai Client SDK (aman)
    // --- DEBUG LOGGING ---
    console.log(`[fetchAndUpdatePublicIndex] Retrieving updated cache for ${apiData.tag} after update...`);
    // --- END DEBUG LOGGING ---
    const updatedCache = await getPublicClanIndex(apiData.tag);
    if (!updatedCache) {
         console.error(`[PUBLIC INDEX] Failed to retrieve cache immediately after update for ${clanTag}`);
         // Fallback: kembalikan data API yang baru diambil dengan timestamp saat ini
         return { ...newIndexData, lastUpdated: new Date() } as PublicClanIndex;
    }
     // --- DEBUG LOGGING ---
     console.log(`[fetchAndUpdatePublicIndex] Returning updated cache for ${apiData.tag}.`);
     // --- END DEBUG LOGGING ---
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
    // --- DEBUG LOGGING ---
    console.log(`[API GET /search-clan] Received request. clanTagParam: ${clanTagParam}`);
    // --- END DEBUG LOGGING ---

    if (!clanTagParam) {
        // --- DEBUG LOGGING ---
        console.log("[API GET /search-clan] Error: Missing clanTag parameter.");
        // --- END DEBUG LOGGING ---
        return NextResponse.json({ error: 'Missing clanTag parameter.' }, { status: 400 });
    }
     const clanTag = clanTagParam.trim().toUpperCase();
     // --- DEBUG LOGGING ---
     console.log(`[API GET /search-clan] Cleaned clanTag: ${clanTag}`);
     // --- END DEBUG LOGGING ---
     const encodedTag = encodeURIComponent(clanTag.startsWith('#') ? clanTag : `#${clanTag}`);
     // --- DEBUG LOGGING ---
     console.log(`[API GET /search-clan] Encoded tag for processing: ${encodedTag}`);
     // --- END DEBUG LOGGING ---

    try {
        // --- DEBUG LOGGING ---
        console.log(`[API GET /search-clan] Calling fetchAndUpdatePublicIndex for encoded tag: ${encodedTag}`);
        // --- END DEBUG LOGGING ---
        const clanData = await fetchAndUpdatePublicIndex(encodedTag, false);
         // --- DEBUG LOGGING ---
         console.log(`[API GET /search-clan] fetchAndUpdatePublicIndex succeeded for ${encodedTag}. Returning data.`);
         // --- END DEBUG LOGGING ---
        return NextResponse.json({
            clan: clanData,
            source: clanData.lastUpdated && (Date.now() - new Date(clanData.lastUpdated).getTime()) < 10000 ? 'live' : 'cache'
        }, { status: 200 });

    } catch (error) {
        // --- DEBUG LOGGING ---
        console.error(`[API GET /search-clan] Caught error for ${clanTag} (encoded: ${encodedTag}):`, error);
        // --- END DEBUG LOGGING ---
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
         if (errorMessage.startsWith('notFound')) {
             return NextResponse.json({ error: `Clan with tag ${clanTag} not found.` }, { status: 404 });
         }
         if (errorMessage.includes('Forbidden')) {
              return NextResponse.json({ error: `Access denied (403). Check API Key/IP. Detail: ${errorMessage}` }, { status: 403 });
         }
        // Log error umum yang tidak tertangkap secara spesifik
        console.error(`[API GET /search-clan] Unhandled error during public clan search for ${clanTag}:`, error);
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
                // --- DEBUG LOGGING (Cron) ---
                console.log(`[CRON JOB] Updating tag: ${tag} (encoded: ${encodedTag})`);
                // --- END DEBUG LOGGING ---
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
