// File: lib/coc-api.ts (MODIFIED - Enhanced Error Handling)
// Deskripsi: Service layer khusus server untuk berinteraksi dengan API resmi Clash of Clans.
// Semua fungsi di sini harus dipanggil dari Server Components, Server Actions, atau API Routes.

import { CocClan, CocMember, CocPlayer, CocWarLog } from './types';

// =========================================================================
// KONFIGURASI API
// =========================================================================

// Menggunakan URL proxy untuk mencocokkan konfigurasi API Key
const COC_API_URL = 'https://cocproxy.royaleapi.dev/v1';

/**
 * Mengambil API Key dari Environment Variables.
 * Ini HANYA boleh dipanggil di lingkungan server (Next.js API Routes / Server Components).
 * @returns {string} API Key Clash of Clans.
 * @throws {Error} Jika COC_API_KEY tidak ditemukan.
 */
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
 * @param endpoint Endpoint API (misal: '/players/%23PLAYERTAG')
 * @returns {Promise<T>} Data JSON yang di-parse.
 * @throws {Error} Melempar error spesifik berdasarkan status response (404, 403, 429, 5xx, dll).
 */
async function fetchCocApi<T>(endpoint: string): Promise<T> {
    const apiKey = getCocApiKey();
    const url = `${COC_API_URL}${endpoint}`;

    // Exponential Backoff implementation
    for (let attempt = 0; attempt < 5; attempt++) {
        let response: Response | null = null; // Declare response here
        try {
            response = await fetch(url, { // Assign response here
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                },
                next: { revalidate: 60 } // Revalidate setelah 60 detik
            });

            // --- PERBAIKAN: Penanganan Error Lebih Spesifik ---
            if (response.status === 404) {
                // Spesifik untuk Not Found
                throw new Error(`notFound: Resource at ${endpoint} not found.`);
            }
            if (response.status === 403) {
                 // Spesifik untuk Forbidden (biasanya masalah API Key/IP)
                 // Coba baca body untuk detail, fallback jika tidak ada
                 let errorBodyText = 'Forbidden access.';
                 try {
                     const errorBody = await response.json();
                     if (errorBody && errorBody.reason) {
                         errorBodyText = `Forbidden: ${errorBody.reason}. Check API Key IP whitelist.`;
                     }
                 } catch (e) { /* ignore json parse error */ }
                 throw new Error(errorBodyText);
            }
            if (response.status === 429) {
                 // Rate Limit - akan ditangani oleh retry logic
                 console.warn(`CoC API Rate Limit hit for ${endpoint}. Retrying...`);
                 // Tidak throw error, biarkan retry logic berjalan
            } else if (response.status >= 500) {
                 // Server Error - akan ditangani oleh retry logic
                 console.warn(`CoC API Server Error (${response.status}) for ${endpoint}. Retrying...`);
                 // Tidak throw error, biarkan retry logic berjalan
            } else if (!response.ok) {
                 // Error klien lainnya (misal 400 Bad Request)
                 let errorBodyText = `HTTP error ${response.status}`;
                 try {
                     const errorBody = await response.json();
                      if (errorBody && errorBody.reason) {
                         errorBodyText = `Error ${response.status}: ${errorBody.reason}. ${errorBody.message || ''}`;
                     } else if (errorBody && errorBody.message) {
                         errorBodyText = `Error ${response.status}: ${errorBody.message}`;
                     }
                 } catch (e) {
                      // Jika body bukan JSON, coba ambil teks
                      try {
                          errorBodyText = await response.text();
                      } catch (textError) { /* ignore text parse error */ }
                 }
                 throw new Error(`CoC API request failed: ${errorBodyText}`);
            }
            // --- AKHIR PERBAIKAN ---


            // Jika response OK atau 429/5xx (akan retry), coba parse JSON
             if (response.ok) {
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
            // Jika error adalah error fetch network ATAU jika ini percobaan terakhir, throw error
            if (attempt === 4 || !(response)) { // Jika response null (network error) atau attempt terakhir
                 // Tambahkan konteks endpoint ke pesan error jika belum ada
                 if (error instanceof Error && !error.message.includes(endpoint)) {
                      throw new Error(`Failed fetching ${endpoint}: ${error.message}`);
                 }
                throw error; // Lempar error asli (dari throw new Error di atas atau network error)
            }
             // Jika error dilempar dari status check (404, 403, 400) dan bukan attempt terakhir, coba lagi
             if (response && (response.status === 404 || response.status === 403 || response.status === 400)) {
                  // Error 404/403/400 biasanya tidak perlu retry, langsung throw saja
                  throw error;
             }
             // Jika error tapi BUKAN 404/403/400/429/5xx, dan bukan attempt terakhir, coba lagi (mungkin error parsing JSON sementara?)
              const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
              console.warn(`Unexpected error during fetch for ${endpoint}. Retrying in ${Math.round(delay / 1000)}s... Error:`, error);
              await new Promise(res => setTimeout(res, delay));
              continue;
        }
    }
    // Seharusnya tidak pernah mencapai sini karena retry logic atau throw error
    throw new Error(`Failed to fetch CoC API endpoint ${endpoint} after multiple retries.`);
}


// =========================================================================
// FUNGSI-FUNGSI PENGAMBILAN DATA (Tidak berubah signifikan, mengandalkan fetchCocApi)
// =========================================================================

const encodeTag = (tag: string): string => {
    // Pastikan tag dimulai dengan # sebelum di-encode
    const cleanedTag = tag.trim().toUpperCase();
    return encodeURIComponent(cleanedTag.startsWith('#') ? cleanedTag : `#${cleanedTag}`);
};

export async function getPlayerData(playerTag: string): Promise<CocPlayer> {
    const encodedTag = encodeTag(playerTag);
     // fetchCocApi akan melempar Error('notFound: ...') jika 404
    return fetchCocApi<CocPlayer>(`/players/${encodedTag}`);
}

export async function getClanData(clanTag: string): Promise<CocClan> {
    const encodedTag = encodeTag(clanTag);
    // fetchCocApi akan melempar Error('notFound: ...') jika 404
    return fetchCocApi<CocClan>(`/clans/${encodedTag}`);
}

export async function getClanWarLog(clanTag: string): Promise<CocWarLog> {
    const encodedTag = encodeTag(clanTag);
     // fetchCocApi akan melempar Error('notFound: ...') jika 404
    return fetchCocApi<CocWarLog>(`/clans/${encodedTag}/warlog`);
}

export async function getClanCurrentWar(clanTag: string): Promise<CocWarLog | null> {
    const encodedTag = encodeTag(clanTag);

    try {
        // Cek War Classic aktif
        // fetchCocApi akan melempar error 404 jika clan tidak ditemukan
        const warResponse = await fetchCocApi<CocWarLog | { reason: string }>(`/clans/${encodedTag}/currentwar`);

        if ('state' in warResponse && (warResponse.state === 'inWar' || warResponse.state === 'preparation')) {
            return warResponse as CocWarLog;
        }

        // Cek CWL Group jika tidak dalam war classic
        if ('reason' in warResponse && warResponse.reason === 'notInWar') {
            try {
                const cwlGroupResponse = await fetchCocApi<any>(`/clans/${encodedTag}/currentwar/leaguegroup`);
                if ('state' in cwlGroupResponse && cwlGroupResponse.state === 'inWar') {
                    const clanInGroup = cwlGroupResponse.clans.find((c: any) => c.tag === clanTag); // Clan Tag asli, bukan encoded
                    const currentWarTag = clanInGroup?.currentWarTag;
                    if (currentWarTag) {
                        return fetchCocApi<CocWarLog>(`/clanwarleagues/wars/${encodeTag(currentWarTag)}`);
                    }
                }
            } catch (cwlError) {
                // Abaikan error 404 dari leaguegroup (klan mungkin tidak ada di CWL atau di luar musim)
                if (cwlError instanceof Error && cwlError.message.startsWith('notFound')) {
                    console.log(`Clan ${clanTag} not currently in CWL group or CWL endpoint not found.`);
                } else {
                    console.error(`Error fetching CWL group for ${clanTag}:`, cwlError); // Log error CWL lainnya
                }
            }
        }
    } catch (error) {
         // Tangani error jika clan utama tidak ditemukan oleh fetchCocApi
         if (error instanceof Error && error.message.startsWith('notFound')) {
              console.warn(`getClanCurrentWar: Clan ${clanTag} not found.`);
              return null; // Kembalikan null jika klan tidak ditemukan
         }
        console.error(`Error checking current war for ${clanTag}:`, error);
        // Mungkin lempar error lagi atau kembalikan null tergantung kebutuhan
        // throw error;
        return null;
    }

    return null; // Tidak ada War Aktif yang ditemukan.
}


/**
 * 5. Memverifikasi Player dengan Token API In-Game (verifyPlayerToken).
 * Endpoint ini hanya memverifikasi token.
 * @param playerTag Tag Pemain.
 * @param apiToken Token API yang diperoleh pemain di game.
 * @returns {Promise<boolean>} True jika verifikasi berhasil.
 * @throws {Error} Jika verifikasi gagal (misal: 404 Player Not Found, 400 Invalid Token, 403 IP/Key problem).
 */
export async function verifyPlayerToken(playerTag: string, apiToken: string): Promise<boolean> {
    const encodedTag = encodeTag(playerTag);
    const url = `${COC_API_URL}/players/${encodedTag}/verifytoken`;
    const apiKey = getCocApiKey();

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

        if (response.ok) {
            // Status 200 OK berarti verifikasi sukses.
            return true;
        }

        // --- PERBAIKAN: Penanganan Error Lebih Spesifik untuk Verify ---
        let errorBody: any = null;
        try {
            errorBody = await response.json();
        } catch (e) {
             try {
                  errorBody = await response.text(); // Fallback ke teks jika bukan JSON
             } catch (textError) { /* ignore text parse error */ }
        }

        console.error('Verify Token Error:', response.status, errorBody);

        if (response.status === 404) {
             // Langsung throw error spesifik untuk Not Found
            throw new Error('Pemain tidak ditemukan. Pastikan Player Tag benar.');
        }

        if (response.status === 400 && errorBody?.reason === 'invalidToken') {
             // Spesifik untuk token tidak valid (API V1 mungkin mengembalikan ini)
              throw new Error('Token API tidak valid. Periksa kembali token dari pengaturan game.');
        }
         // Cek reason 'forbidden' (mungkin karena token salah ATAU player tag salah di API v1/v2?)
         // Kita beri pesan yang lebih umum mencakup keduanya
         if (response.status === 400 && errorBody?.reason === 'forbidden') {
            throw new Error('Token tidak valid atau Player Tag salah. Pastikan keduanya benar.');
        }

        if (response.status === 403) {
            // Spesifik untuk masalah IP/API Key
            throw new Error('Akses API ditolak (403). Cek pengaturan IP whitelist pada API Key CoC Anda.');
        }
        // Error lainnya
        throw new Error(`Gagal memverifikasi token: Status ${response.status}. Detail: ${typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody}`);
        // --- AKHIR PERBAIKAN ---

    } catch (error) {
         // Jika error sudah dilempar dari atas, lempar lagi
         if (error instanceof Error) {
            throw error;
         }
        // Handle network errors
        console.error('Network error during verifyPlayerToken:', error);
        throw new Error('Gagal menghubungi API CoC untuk verifikasi. Periksa koneksi internet.');
    }
}

// Ekspor semua fungsi yang akan digunakan di API Routes atau Server Components
export default {
    getPlayerData,
    getClanData,
    getClanWarLog,
    getClanCurrentWar,
    verifyPlayerToken,
};
