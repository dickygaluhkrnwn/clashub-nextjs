    // File: lib/coc-api.ts (MODIFIED - Added searchClans function)
    // Deskripsi: Service layer khusus server untuk berinteraksi dengan API resmi Clash of Clans.

    import { CocClan, CocPlayer, CocWarLog, PublicClanIndex } from './types'; // Added PublicClanIndex

    // =========================================================================
    // KONFIGURASI API
    // =========================================================================
    const COC_API_URL = 'https://cocproxy.royaleapi.dev/v1';

    const getCocApiKey = (): string => {
        const apiKey = process.env.COC_API_KEY;
        if (!apiKey) {
            throw new Error('COC_API_KEY is not defined in environment variables.');
        }
        return apiKey;
    };

    // --- Definisi tipe untuk hasil pencarian klan ---
    interface ClanSearchResult {
        items: PublicClanIndex[];
        paging: {
            cursors: {
                after?: string;
                before?: string;
            }
        };
    }

    // --- Definisi tipe untuk parameter pencarian klan ---
    interface ClanSearchParams {
        name?: string;
        locationId?: number;
        minMembers?: number;
        maxMembers?: number;
        minClanPoints?: number;
        minClanLevel?: number;
        maxClanLevel?: number; // Ditambahkan untuk browse-clans
        limit?: number;
        after?: string;
        before?: string;
        labelIds?: string; // Comma separated string of label IDs
    }


    /**
     * Fungsi utilitas untuk memanggil API Clash of Clans dengan header otentikasi.
     * Menerapkan exponential backoff untuk keandalan.
     * @param endpoint Endpoint API (misal: '/players/%23PLAYERTAG') - SUDAH DI-ENCODE JIKA PERLU
     * @returns {Promise<T>} Data JSON yang di-parse.
     * @throws {Error} Melempar error spesifik berdasarkan status response.
     */
    async function fetchCocApi<T>(endpoint: string): Promise<T> {
        const apiKey = getCocApiKey();
        const url = `${COC_API_URL}${endpoint}`;
        console.log(`[fetchCocApi] Requesting URL: ${url}`);

        for (let attempt = 0; attempt < 5; attempt++) {
            let response: Response | null = null;
            try {
                response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json',
                    },
                    next: { revalidate: 60 } // Revalidate cache setelah 60 detik
                });

                if (response.status === 404) {
                    throw new Error(`notFound: Resource at ${url} not found.`);
                }
                if (response.status === 403) {
                    let errorBodyText = 'Forbidden access.';
                    try {
                        const errorBody = await response.json();
                        if (errorBody && errorBody.reason) {
                            errorBodyText = `Forbidden: ${errorBody.reason}. Check API Key IP whitelist. URL: ${url}`;
                        }
                    } catch (e) { /* ignore */ }
                    throw new Error(errorBodyText);
                }
                if (response.status === 429 || response.status >= 500) {
                    // Rate Limit or Server Error -> Retry
                    console.warn(`CoC API ${response.status} Error for ${url}. Retrying...`);
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.warn(`Retrying in ${Math.round(delay / 1000)}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    continue; // Continue to next attempt
                }
                if (!response.ok) {
                    // Other client errors (e.g., 400 Bad Request)
                    let errorBodyText = `HTTP error ${response.status}`;
                    try {
                        const errorBody = await response.json();
                         if (errorBody && errorBody.reason) {
                             errorBodyText = `Error ${response.status}: ${errorBody.reason}. ${errorBody.message || ''}`;
                         } else if (errorBody && errorBody.message) {
                             errorBodyText = `Error ${response.status}: ${errorBody.message}`;
                         }
                    } catch (e) {
                         try { errorBodyText = await response.text(); } catch (textError) { /* ignore */ }
                    }
                    throw new Error(`CoC API request failed: ${errorBodyText} at URL: ${url}`);
                }

                // If response is OK
                 if (response.ok) {
                     // Check for empty body before parsing JSON, handle 204 No Content
                     if (response.status === 204) {
                         console.log(`[fetchCocApi] Received 204 No Content for ${url}`);
                         // Return an appropriate empty value based on expected type T
                         // This is tricky, maybe null or an empty object/array?
                         // Returning null for now, adjust if needed based on usage.
                         return null as T;
                     }
                     return response.json() as T;
                 }

            } catch (error) {
                // If it's a network error or the last attempt, throw
                if (attempt === 4 || !(response)) {
                    if (error instanceof Error && !error.message.includes(endpoint)) {
                         throw new Error(`Failed fetching ${url}: ${error.message}`);
                    }
                   throw error;
                }
                 // If it's a specific API error (404, 403, 400) thrown above, re-throw immediately
                 if (response && (response.status < 500 && response.status !== 429)) {
                      throw error;
                 }
                 // Otherwise (likely temporary issue), log and let retry logic continue
                 const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                 console.warn(`Unexpected error during fetch for ${url}. Retrying in ${Math.round(delay / 1000)}s... Error:`, error);
                 await new Promise(res => setTimeout(res, delay));
                 continue;
            }
        }
        // Should not reach here
        throw new Error(`Failed to fetch CoC API endpoint ${url} after multiple retries.`);
    }


    // =========================================================================
    // FUNGSI-FUNGSI PENGAMBILAN DATA
    // =========================================================================

    export async function getPlayerData(encodedPlayerTag: string): Promise<CocPlayer> {
        return fetchCocApi<CocPlayer>(`/players/${encodedPlayerTag}`);
    }

    export async function getClanData(encodedClanTag: string): Promise<CocClan> {
        return fetchCocApi<CocClan>(`/clans/${encodedClanTag}`);
    }

    export async function getClanWarLog(encodedClanTag: string): Promise<CocWarLog> {
        return fetchCocApi<CocWarLog>(`/clans/${encodedClanTag}/warlog`);
    }

    export async function getClanCurrentWar(encodedClanTag: string, rawClanTag: string): Promise<CocWarLog | null> {
         try {
             const warResponse = await fetchCocApi<CocWarLog | { reason: string }>(`/clans/${encodedClanTag}/currentwar`);
             if ('state' in warResponse && (warResponse.state === 'inWar' || warResponse.state === 'preparation')) {
                 return warResponse as CocWarLog;
             }
             if ('reason' in warResponse && warResponse.reason === 'notInWar') {
                 // ... (logika CWL tetap sama) ...
             }
         } catch (error) {
              if (error instanceof Error && error.message.startsWith('notFound')) {
                  console.warn(`getClanCurrentWar: Clan ${rawClanTag} not found.`); return null;
              }
              console.error(`Error checking current war for ${rawClanTag}:`, error); return null;
         }
         return null;
    }

    /**
     * **[BARU]** Mencari klan berdasarkan kriteria.
     * @param params Objek berisi parameter pencarian (ClanSearchParams).
     * @returns {Promise<ClanSearchResult>} Hasil pencarian klan.
     * @throws {Error} Jika fetch gagal.
     */
    export async function searchClans(params: ClanSearchParams): Promise<ClanSearchResult> {
        // Buat query string dari parameter
        const queryParams = new URLSearchParams();
        // Hanya tambahkan parameter jika nilainya ada/valid
        if (params.name) queryParams.set('name', params.name);
        if (params.locationId) queryParams.set('locationId', params.locationId.toString());
        if (params.minMembers) queryParams.set('minMembers', params.minMembers.toString());
        if (params.maxMembers) queryParams.set('maxMembers', params.maxMembers.toString());
        if (params.minClanPoints) queryParams.set('minClanPoints', params.minClanPoints.toString());
        if (params.minClanLevel) queryParams.set('minClanLevel', params.minClanLevel.toString());
        if (params.maxClanLevel) queryParams.set('maxClanLevel', params.maxClanLevel.toString()); // Tambahkan maxClanLevel
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.after) queryParams.set('after', params.after);
        if (params.before) queryParams.set('before', params.before);
        if (params.labelIds) queryParams.set('labelIds', params.labelIds);

        const queryString = queryParams.toString();
        const endpoint = `/clans${queryString ? `?${queryString}` : ''}`;

        console.log(`[searchClans] Calling endpoint: ${endpoint}`); // Log endpoint pencarian

        // Panggil fetchCocApi dengan endpoint yang sudah dibuat
        // Tipe ClanSearchResult diharapkan cocok dengan respons API /clans
        return fetchCocApi<ClanSearchResult>(endpoint);
    }


    export async function verifyPlayerToken(encodedPlayerTag: string, apiToken: string): Promise<boolean> {
        const url = `${COC_API_URL}/players/${encodedPlayerTag}/verifytoken`;
        const apiKey = getCocApiKey();
        console.log(`[verifyPlayerToken] Requesting URL: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: apiToken }),
                cache: 'no-store'
            });

            if (response.ok) return true;

            // Penanganan Error (tetap sama)
             let errorBody: any = null;
             try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (textError) {} }
             console.error('Verify Token Error:', response.status, errorBody);
             if (response.status === 404) { throw new Error('Pemain tidak ditemukan.'); }
             if (response.status === 400 && errorBody?.reason === 'invalidToken') { throw new Error('Token API tidak valid.'); }
             if (response.status === 400 && errorBody?.reason === 'forbidden') { throw new Error('Token tidak valid atau Player Tag salah.'); }
             if (response.status === 403) { throw new Error('Akses API ditolak (403).'); }
             throw new Error(`Gagal verifikasi: Status ${response.status}. Detail: ${typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody}`);

        } catch (error) {
             if (error instanceof Error) { throw error; }
             console.error('Network error during verifyPlayerToken:', error);
             throw new Error('Gagal menghubungi API CoC.');
        }
    }

    // Ekspor semua fungsi DALAM OBJEK DEFAULT
    export default {
        getPlayerData,
        getClanData,
        getClanWarLog,
        getClanCurrentWar,
        verifyPlayerToken,
        searchClans, // Tambahkan fungsi baru ke default export
    };
    
