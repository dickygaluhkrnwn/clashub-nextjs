// File: lib/coc-api.ts (Kembali ke versi tanpa searchClans)
// Deskripsi: Service layer khusus server untuk berinteraksi dengan API resmi Clash of Clans.

import { CocClan, CocMember, CocPlayer, CocWarLog } from './types';

// =========================================================================
// KONFIGURASI API
// =========================================================================

const COC_API_URL = 'https://cocproxy.royaleapi.dev/v1';

const getCocApiKey = (): string => {
    const apiKey = process.env.COC_API_KEY;
    if (!apiKey) {
        throw new Error('COC_API_KEY is not defined in environment variables. Cannot connect to CoC API.');
    }
    return apiKey;
};

/**
 * Fungsi utilitas untuk memanggil API Clash of Clans dengan header otentikasi.
 * Menerapkan exponential backoff untuk keandalan.
 * @param endpoint Endpoint API (misal: '/players/%23PLAYERTAG') - DIHARAPKAN SUDAH DI-ENCODE JIKA PERLU
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
                next: { revalidate: 60 } // Revalidate setelah 60 detik
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
                 // Rate Limit or Server Error -> Retry logic below
            } else if (!response.ok) {
                 // Other client errors (misal 400 Bad Request)
                 let errorBodyText = `HTTP error ${response.status}`;
                 try {
                     const errorBody = await response.json();
                      if (errorBody && errorBody.reason) {
                          errorBodyText = `Error ${response.status}: ${errorBody.reason}. ${errorBody.message || ''}`;
                      } else if (errorBody && errorBody.message) {
                          errorBodyText = `Error ${response.status}: ${errorBody.message}`;
                      }
                 } catch (e) {
                      try { errorBodyText = await response.text(); } catch (textError) { /* ignore text parse error */ }
                 }
                 throw new Error(`CoC API request failed: ${errorBodyText} at URL: ${url}`);
            }

            if (response.ok) {
                // Check for empty body before parsing JSON, handle 204 No Content
                if (response.status === 204) {
                    return null as T; // Return null if 204 No Content
                }
                return response.json() as T;
            }

            // Jika 429 atau 5xx, siapkan untuk retry
            if (response.status === 429 || response.status >= 500) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`Retrying in ${Math.round(delay / 1000)}s...`);
                await new Promise(res => setTimeout(res, delay));
                continue; // Lanjut ke iterasi loop berikutnya (coba lagi)
            }

        } catch (error) {
            if (attempt === 4 || !(response)) {
                if (error instanceof Error && !error.message.includes(endpoint)) {
                     throw new Error(`Failed fetching ${url}: ${error.message}`);
                }
               throw error;
            }
            if (response && (response.status < 500 && response.status !== 429)) {
                 throw error;
            }
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            console.warn(`Unexpected error during fetch for ${url}. Retrying in ${Math.round(delay / 1000)}s... Error:`, error);
            await new Promise(res => setTimeout(res, delay));
            continue;
        }
    }
    throw new Error(`Failed to fetch CoC API endpoint ${url} after multiple retries.`);
}


// =========================================================================
// FUNGSI-FUNGSI PENGAMBILAN DATA
// =========================================================================

// Fungsi searchClans DIHAPUS

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
            try {
                const cwlGroupResponse = await fetchCocApi<any>(`/clans/${encodedClanTag}/currentwar/leaguegroup`);
                if ('state' in cwlGroupResponse && cwlGroupResponse.state === 'inWar') {
                    const clanInGroup = cwlGroupResponse.clans.find((c: any) => c.tag === rawClanTag);
                    const currentWarTag = clanInGroup?.currentWarTag;
                    if (currentWarTag) {
                        return fetchCocApi<CocWarLog>(`/clanwarleagues/wars/${encodeURIComponent(currentWarTag)}`);
                    }
                }
            } catch (cwlError) {
                 if (cwlError instanceof Error && cwlError.message.startsWith('notFound')) {
                      console.log(`Clan ${rawClanTag} not currently in CWL group or CWL endpoint not found.`);
                 } else {
                      console.error(`Error fetching CWL group for ${rawClanTag}:`, cwlError);
                 }
            }
        }
    } catch (error) {
         if (error instanceof Error && error.message.startsWith('notFound')) {
              console.warn(`getClanCurrentWar: Clan ${rawClanTag} not found.`); return null;
         }
         console.error(`Error checking current war for ${rawClanTag}:`, error); return null;
    }

    return null;
}


export async function verifyPlayerToken(encodedPlayerTag: string, apiToken: string): Promise<boolean> {
    const url = `${COC_API_URL}/players/${encodedPlayerTag}/verifytoken`;
    const apiKey = getCocApiKey();
    console.log(`[verifyPlayerToken] Requesting URL: ${url}`);

    let response: Response | null = null;
    try {
        response = await fetch(url, {
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
    // searchClans DIHAPUS DARI EXPORT
};
