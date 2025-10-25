// File: app/api/coc/search-clan/route.ts
// Deskripsi: API Route untuk mencari dan meng-cache data klan publik.
// Dapat dipanggil untuk pencarian single tag (GET) atau untuk cron job update massal (POST).

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Menggunakan fungsi firestore yang sudah diupdate (Admin SDK untuk write, Client SDK untuk read)
import { getPublicClanIndex } from '@/lib/firestore'; // <<<--- Hanya perlu get (Client SDK)
import { updatePublicClanIndex } from '@/lib/firestore-admin'; // <<<--- Import update dari Admin SDK file
import { PublicClanIndex, CocClan, CocMember } from '@/lib/types';
import { getClanTagsToMonitor } from '@/lib/server-utils'; // Fungsi untuk mendapatkan daftar klan

// Cache dianggap 'stale' (kadaluarsa) jika lebih dari 6 jam (6 * 60 * 60 * 1000 ms)
const CACHE_STALE_MS = 1000 * 60 * 60 * 6;

/**
 * Tipe yang dikembalikan oleh fetchAndUpdatePublicIndex:
 * Menggabungkan PublicClanIndex (untuk cache) dengan CocClan (untuk live data)
 */
type ClanFetchResult = {
    clanData: PublicClanIndex | CocClan;
    source: 'cache' | 'live';
}

/**
 * Fungsi utilitas internal untuk mengambil data API dan mengupdate cache.
 * @param clanTag Tag Klan yang sudah di-encode.
 * @param forceUpdate Lewati pemeriksaan cache jika true.
 * @returns {Promise<ClanFetchResult>} Data klan yang sudah di-cache atau data live.
 * @throws {Error} Jika clan tidak ditemukan atau terjadi error API/Firestore.
 */
async function fetchAndUpdatePublicIndex(clanTag: string, forceUpdate: boolean = false): Promise<ClanFetchResult> {
    // --- DEBUG LOGGING ---
    console.log(`[fetchAndUpdatePublicIndex] Started for tag: ${clanTag}, forceUpdate: ${forceUpdate}`);
    // --- END DEBUG LOGGING ---

    // 1. Cek Cache Firestore (Hanya jika tidak dipaksa update)
    let cachedData: PublicClanIndex | null = null;
    if (!forceUpdate) {
        // --- DEBUG LOGGING ---
        console.log(`[fetchAndUpdatePublicIndex] Checking Firestore cache for ${clanTag}...`);
        // --- END DEBUG LOGGING ---
        try {
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
                        // Mengembalikan data index dari cache (Tanpa MemberList)
                        return { clanData: cachedData, source: 'cache' };
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
        apiData = await cocApi.getClanData(clanTag);
        console.log(`[fetchAndUpdatePublicIndex] Successfully fetched API data for ${clanTag}. Clan Name: ${apiData.name}`);
    } catch (apiError) {
        // Lempar ulang error agar bisa ditangkap oleh GET handler
        console.error(`[fetchAndUpdatePublicIndex] Error calling cocApi.getClanData for ${clanTag}:`, apiError);
        throw apiError;
    }


    // 3. Transformasi dan Update Cache (Hanya untuk Indexing)
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
        await updatePublicClanIndex(apiData.tag, newIndexData);
        console.log(`[fetchAndUpdatePublicIndex] Firestore cache updated for ${apiData.tag}.`);
    } catch (updateError) {
        console.error(`[fetchAndUpdatePublicIndex] Error updating Firestore cache for ${apiData.tag}:`, updateError);
    }

    // 4. Mengembalikan data API secara penuh (CocClan) yang mencakup memberList
    console.log(`[fetchAndUpdatePublicIndex] Returning full live API data for ${apiData.tag}.`);
    return { clanData: apiData, source: 'live' };
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
    console.log(`[API GET /search-clan] Received request. clanTagParam: ${clanTagParam}`);

    if (!clanTagParam) {
        return NextResponse.json({ error: 'Missing clanTag parameter.' }, { status: 400 });
    }
    const clanTag = clanTagParam.trim().toUpperCase();
    const encodedTag = encodeURIComponent(clanTag.startsWith('#') ? clanTag : `#${clanTag}`);

    try {
        // Panggil fungsi yang sudah dimodifikasi
        const { clanData, source } = await fetchAndUpdatePublicIndex(encodedTag, false);
        console.log(`[API GET /search-clan] fetchAndUpdatePublicIndex succeeded for ${encodedTag}. Returning data (Source: ${source}).`);

        // Mengembalikan data penuh (CocClan jika 'live', PublicClanIndex jika 'cache')
        return NextResponse.json({
            clan: clanData,
            source: source,
        }, { status: 200 });

    } catch (error) {
        console.error(`[API GET /search-clan] Caught error for ${clanTag} (encoded: ${encodedTag}):`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
        if (errorMessage.startsWith('notFound')) {
            return NextResponse.json({ error: `Clan with tag ${clanTag} not found.` }, { status: 404 });
        }
        if (errorMessage.includes('Forbidden')) {
            return NextResponse.json({ error: `Access denied (403). Check API Key/IP. Detail: ${errorMessage}` }, { status: 403 });
        }
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
                // Ketika dipanggil dari cron job, kita paksa update dan kita tidak peduli dengan nilai kembali
                // Kita hanya peduli cache index-nya terupdate.
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
