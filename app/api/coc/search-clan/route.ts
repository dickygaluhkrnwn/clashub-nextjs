import { NextRequest, NextResponse } from 'next/server';
import cocApi from '@/lib/coc-api';
import { updatePublicClanIndex, getPublicClanIndex } from '@/lib/firestore';
import { PublicClanIndex, CocClan } from '@/lib/types';

// Cache dianggap 'stale' (kadaluarsa) jika lebih dari 6 jam (6 * 60 * 60 * 1000 ms)
const CACHE_STALE_MS = 1000 * 60 * 60 * 6; 

/**
 * @function GET
 * Endpoint untuk mencari klan publik.
 * 1. Cek cache Firestore (PublicClanIndex)
 * 2. Jika cache fresh, kembalikan data cache.
 * 3. Jika cache stale atau tidak ada, fetch dari API CoC, update cache, lalu kembalikan.
 * URL: /api/coc/search-clan?clanTag=%23CLANTAG
 */
export async function GET(request: NextRequest) {
    // Ambil clanTag dari query parameter. Clan Tag harus di-encodeURIComponent.
    const clanTag = request.nextUrl.searchParams.get('clanTag');

    if (!clanTag) {
        return NextResponse.json({ error: 'Missing clanTag parameter.' }, { status: 400 });
    }

    try {
        // 1. Cek Cache Firestore
        const cachedData = await getPublicClanIndex(clanTag);
        
        // Cek apakah cache fresh
        if (cachedData) {
            const isFresh = (Date.now() - cachedData.lastUpdated.getTime()) < CACHE_STALE_MS;
            if (isFresh) {
                console.log(`[PUBLIC SEARCH] Returning fresh cache for ${clanTag}`);
                return NextResponse.json({ clan: cachedData, source: 'cache' }, { status: 200 });
            }
        }
        
        // 2. Cache stale atau tidak ada, fetch dari API CoC
        console.log(`[PUBLIC SEARCH] Fetching live data for ${clanTag}`);
        const apiData: CocClan = await cocApi.getClanData(clanTag);
        
        if (!apiData) {
             return NextResponse.json({ error: `Clan with tag ${clanTag} not found on CoC API.` }, { status: 404 });
        }

        // 3. Transformasi dan Update Cache
        // Buat payload PublicClanIndex
        const newIndexData: Omit<PublicClanIndex, 'lastUpdated'> = {
            tag: apiData.tag,
            name: apiData.name,
            clanLevel: apiData.clanLevel,
            memberCount: apiData.memberCount,
            clanPoints: apiData.clanPoints,
            badgeUrls: apiData.badgeUrls,
            // lastUpdated diisi oleh firestore.ts
        };

        // Update/set dokumen di koleksi publicClanIndex
        await updatePublicClanIndex(apiData.tag, newIndexData);

        // 4. Kembalikan data baru
        return NextResponse.json({ 
            clan: { ...newIndexData, lastUpdated: new Date() }, // Kembalikan dengan tanggal update
            source: 'live' 
        }, { status: 200 });

    } catch (error) {
        // PERBAIKAN: Menggunakan type guard untuk memastikan 'error' adalah instance dari Error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';

        // Tangani error 404 dari API CoC yang dilempar oleh fetchCocApi
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
             return NextResponse.json({ error: `Clan with tag ${clanTag} not found.` }, { status: 404 });
        }
        
        console.error('Error during public clan search:', error);
        return NextResponse.json({ error: `Search failed: ${errorMessage}` }, { status: 500 });
    }
}
