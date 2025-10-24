// File: app/api/coc/search-clan/route.ts
// Deskripsi: API Route untuk mencari dan meng-cache data klan publik.
// Dapat dipanggil untuk pencarian single tag (GET) atau untuk cron job update massal (POST).

import { NextRequest, NextResponse } from 'next/server';
import cocApi from '@/lib/coc-api';
import { updatePublicClanIndex, getPublicClanIndex } from '@/lib/firestore';
import { PublicClanIndex, CocClan } from '@/lib/types';
import { getClanTagsToMonitor } from '@/lib/server-utils'; // BARU: Fungsi untuk mendapatkan daftar klan

// Cache dianggap 'stale' (kadaluarsa) jika lebih dari 6 jam (6 * 60 * 60 * 1000 ms)
const CACHE_STALE_MS = 1000 * 60 * 60 * 6; 

/**
 * Fungsi utilitas internal untuk mengambil data API dan mengupdate cache.
 * @param clanTag Tag Klan yang sudah di-encode.
 * @param forceUpdate Lewati pemeriksaan cache jika true.
 * @returns {Promise<PublicClanIndex | null>} Data klan yang sudah di-cache.
 */
async function fetchAndUpdatePublicIndex(clanTag: string, forceUpdate: boolean = false): Promise<PublicClanIndex> {
    
    // 1. Cek Cache Firestore (Hanya jika tidak dipaksa update)
    let cachedData = null;
    if (!forceUpdate) {
        cachedData = await getPublicClanIndex(clanTag);
        
        if (cachedData) {
            const isFresh = (Date.now() - cachedData.lastUpdated.getTime()) < CACHE_STALE_MS;
            if (isFresh) {
                console.log(`[PUBLIC INDEX] Returning fresh cache for ${clanTag}`);
                return cachedData;
            }
        }
    }
    
    // 2. Cache stale, tidak ada, atau dipaksa update: Fetch dari API CoC
    console.log(`[PUBLIC INDEX] Fetching live data for ${clanTag} (Force: ${forceUpdate})`);
    
    // getClanData akan melempar error 404 jika tidak ditemukan
    const apiData: CocClan = await cocApi.getClanData(clanTag);
    
    // 3. Transformasi dan Update Cache
    // Buat payload PublicClanIndex
    const newIndexData: Omit<PublicClanIndex, 'lastUpdated'> = {
        tag: apiData.tag,
        name: apiData.name,
        clanLevel: apiData.clanLevel,
        memberCount: apiData.memberCount,
        clanPoints: apiData.clanPoints,
        badgeUrls: apiData.badgeUrls,
        // Menyalin field tambahan dari CocClan untuk tampilan profil publik
        requiredTrophies: apiData.requiredTrophies,
        warFrequency: apiData.warFrequency,
        warWinStreak: apiData.warWinStreak,
        type: apiData.type,
        description: apiData.description,
        location: apiData.location
    };

    // Update/set dokumen di koleksi publicClanIndex
    await updatePublicClanIndex(apiData.tag, newIndexData);

    // Dapatkan data yang diperbarui (dengan timestamp baru)
    return await getPublicClanIndex(apiData.tag) as PublicClanIndex;
}


// =========================================================================
// ENDPOINT PUBLIK (SEARCH)
// =========================================================================

/**
 * @function GET
 * Endpoint untuk mencari klan publik (Single Tag Search).
 * URL: /api/coc/search-clan?clanTag=%23CLANTAG
 */
export async function GET(request: NextRequest) {
    const clanTag = request.nextUrl.searchParams.get('clanTag');

    if (!clanTag) {
        return NextResponse.json({ error: 'Missing clanTag parameter.' }, { status: 400 });
    }

    try {
        const clanData = await fetchAndUpdatePublicIndex(clanTag, false); // Cek cache
        
        return NextResponse.json({ 
            clan: clanData, 
            source: 'cache' 
        }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
             return NextResponse.json({ error: `Clan with tag ${clanTag} not found.` }, { status: 404 });
        }
        
        console.error('Error during public clan search:', error);
        return NextResponse.json({ error: `Search failed: ${errorMessage}` }, { status: 500 });
    }
}

// =========================================================================
// ENDPOINT CRON JOB (MASS UPDATE - Tugas 5.2)
// =========================================================================

/**
 * @function POST
 * Endpoint yang hanya dipanggil oleh Cron Job untuk memperbarui PublicClanIndex 
 * secara massal (Update Cache Top Clans).
 */
export async function POST(request: NextRequest) {
    // Cron job harus dapat melakukan POST tanpa otorisasi pengguna spesifik
    // Jika Anda ingin mengamankan ini, tambahkan pengecekan rahasia (misal: Header X-CRON-SECRET)

    console.log('[CRON JOB] Starting mass update for Public Clan Index...');
    const startTime = Date.now();
    let updatedCount = 0;
    
    try {
        // Ambil daftar Clan Tags yang ingin dimonitor (dari konfigurasi/database)
        const tagsToUpdate: string[] = getClanTagsToMonitor(); // Menetapkan tipe string[]
        
        if (tagsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No clan tags configured for public index update.' }, { status: 200 });
        }

        const updatePromises = tagsToUpdate.map(async (tag: string) => { // Perbaikan: Menetapkan tipe string untuk 'tag'
            try {
                // Panggil fungsi utilitas dengan forceUpdate=true untuk melewati cache check
                await fetchAndUpdatePublicIndex(tag, true);
                updatedCount++;
                return { tag, status: 'Success' };
            } catch (error) {
                console.error(`Failed to update public index for ${tag}:`, error);
                return { tag, status: 'Failed', error: error instanceof Error ? error.message : 'Unknown error' };
            }
        });
        
        const results = await Promise.all(updatePromises);
        const duration = Date.now() - startTime;

        console.log(`[CRON JOB] Finished Public Index Update. Updated: ${updatedCount}/${tagsToUpdate.length} clans.`, { durationMs: duration });
        
        return NextResponse.json({ 
            message: `Public Clan Index update complete. Updated ${updatedCount}/${tagsToUpdate.length} clans.`,
            results: results,
            durationMs: duration
        }, { status: 200 });

    } catch (error) {
        console.error('[CRON JOB] Fatal error during mass update:', error);
        return NextResponse.json({ error: `Mass update failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}
