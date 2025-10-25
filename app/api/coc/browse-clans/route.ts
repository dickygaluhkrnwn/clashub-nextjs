    import { NextResponse } from 'next/server';
    // PERBAIKAN: Gunakan default import karena lib/coc-api mengekspor objek default
    import cocApi from '@/lib/coc-api';
    import { PublicClanIndex } from '@/lib/types';

    // Konstanta
    const INDONESIA_LOCATION_ID = 32000107;
    const INITIAL_FETCH_LIMIT = 20; // Ambil 20 klan awal
    const FINAL_LIMIT = 10; // Tampilkan 10 teratas berdasarkan level

    export async function GET() {
        console.log('[API browse-clans] Received request for top Indonesian clans by level');
        try {
            console.log(`[API browse-clans] Fetching top ${INITIAL_FETCH_LIMIT} clans for location ${INDONESIA_LOCATION_ID}`);

            // PERBAIKAN: Panggil fungsi searchClans dari objek default cocApi
            const searchResult = await cocApi.searchClans({ // Memanggil fungsi yang baru ditambahkan
                locationId: INDONESIA_LOCATION_ID,
                limit: INITIAL_FETCH_LIMIT,
            });

            if (!searchResult || !searchResult.items || searchResult.items.length === 0) {
                console.log('[API browse-clans] No clans found from API search.');
                return NextResponse.json({ clans: [] });
            }

            const fetchedClans: PublicClanIndex[] = searchResult.items;
            console.log(`[API browse-clans] Fetched ${fetchedClans.length} clans initially.`);

            // Urutkan berdasarkan level klan (desc), lalu poin klan (desc)
            fetchedClans.sort((a, b) => {
                const levelDiff = (b.clanLevel || 0) - (a.clanLevel || 0);
                if (levelDiff !== 0) return levelDiff;
                return (b.clanPoints || 0) - (a.clanPoints || 0);
            });

            const topClansByLevel = fetchedClans.slice(0, FINAL_LIMIT);
            console.log(`[API browse-clans] Returning top ${topClansByLevel.length} clans sorted by level.`);

            return NextResponse.json({ clans: topClansByLevel });

        } catch (error) {
            console.error('[API browse-clans] General error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[API browse-clans] Detailed Error: ${errorMessage}`);
            return NextResponse.json(
                { error: 'Gagal mengambil daftar klan teratas dari API CoC.' },
                { status: 500 }
            );
        }
    }

    // export const revalidate = 3600; // Cache selama 1 jam
    

