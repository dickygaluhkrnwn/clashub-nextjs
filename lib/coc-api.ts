// File: lib/coc-api.ts
// Deskripsi: Service layer khusus server untuk berinteraksi dengan API resmi Clash of Clans.

import {
  CocClan,
  CocMember,
  CocPlayer,
  CocWarLog,
  CocCurrentWar,
  CocLeagueGroup,
  CocRaidSeasons,
  CocWarMember, // <-- [PERBAIKAN] Impor CocWarMember secara eksplisit
} from './types'; // Tipe data tidak perlu diubah

// =========================================================================
// KONFIGURASI API
// =========================================================================

const COC_API_URL = 'https://cocproxy.royaleapi.dev/v1';

const getCocApiKey = (): string => {
  const apiKey = process.env.COC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'COC_API_KEY is not defined in environment variables. Cannot connect to CoC API.'
    );
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
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        // Memaksa Next.js untuk selalu mengambil data baru (fresh) dari API CoC
        cache: 'no-store',
      });

      if (response.status === 404) {
        throw new Error(`notFound: Resource at ${url} not found.`);
      }
      if (response.status === 403) {
        let errorBodyText = 'Forbidden access.';
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.reason) {
            errorBodyText = `Forbidden: ${
              errorBody.reason
            }. Check API Key IP whitelist. URL: ${url}`;
          }
        } catch (e) {
          /* ignore */
        }
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
            errorBodyText = `Error ${response.status}: ${errorBody.reason}. ${
              errorBody.message || ''
            }`;
          } else if (errorBody && errorBody.message) {
            errorBodyText = `Error ${response.status}: ${errorBody.message}`;
          }
        } catch (e) {
          try {
            errorBodyText = await response.text();
          } catch (textError) {
            /* ignore text parse error */
          }
        }
        throw new Error(
          `CoC API request failed: ${errorBodyText} at URL: ${url}`
        );
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
        await new Promise((res) => setTimeout(res, delay));
        continue; // Lanjut ke iterasi loop berikutnya (coba lagi)
      }
    } catch (error) {
      if (attempt === 4 || !response) {
        if (error instanceof Error && !error.message.includes(endpoint)) {
          throw new Error(`Failed fetching ${url}: ${error.message}`);
        }
        throw error;
      }
      if (response && response.status < 500 && response.status !== 429) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.warn(
        `Unexpected error during fetch for ${url}. Retrying in ${Math.round(
          delay / 1000
        )}s... Error:`,
        error
      );
      await new Promise((res) => setTimeout(res, delay));
      continue;
    }
  }
  throw new Error(
    `Failed to fetch CoC API endpoint ${url} after multiple retries.`
  );
}

// =========================================================================
// FUNGSI-FUNGSI PENGAMBILAN DATA
// =========================================================================

export async function getPlayerData(
  encodedPlayerTag: string
): Promise<CocPlayer> {
  return fetchCocApi<CocPlayer>(`/players/${encodedPlayerTag}`);
}

export async function getClanData(encodedClanTag: string): Promise<CocClan> {
  return fetchCocApi<CocClan>(`/clans/${encodedClanTag}`);
}

export async function getClanWarLog(encodedClanTag: string): Promise<CocWarLog> {
  return fetchCocApi<CocWarLog>(`/clans/${encodedClanTag}/warlog`);
}

/**
 * Mengambil data CWL League Group saat ini untuk sebuah klan.
 * @param encodedClanTag Tag klan yang sudah di-encode.
 * @returns {Promise<CocLeagueGroup>} Data league group.
 */
export async function getClanLeagueGroup(
  encodedClanTag: string
): Promise<CocLeagueGroup> {
  return fetchCocApi<CocLeagueGroup>(
    `/clans/${encodedClanTag}/currentwar/leaguegroup`
  );
}

/**
 * Mengambil data detail dari satu perang CWL spesifik berdasarkan War Tag.
 * @param encodedWarTag Tag perang CWL yang sudah di-encode.
 * @returns {Promise<CocCurrentWar>} Data detail perang.
 */
export async function getLeagueWarDetails(
  encodedWarTag: string
): Promise<CocCurrentWar> {
  return fetchCocApi<CocCurrentWar>(`/clanwarleagues/wars/${encodedWarTag}`);
}

/**
 * Mengambil data Capital Raid Seasons (histori raid) untuk sebuah klan.
 * @param encodedClanTag Tag klan yang sudah di-encode.
 * @returns {Promise<CocRaidSeasons>} Data histori raid seasons.
 */
export async function getClanRaidSeasons(
  encodedClanTag: string
): Promise<CocRaidSeasons> {
  return fetchCocApi<CocRaidSeasons>(
    `/clans/${encodedClanTag}/capitalraidseasons`
  );
}

// --- [FUNGSI YANG DIPERBAIKI] ---
/**
 * Mencoba mengambil perang reguler. 
 * Jika tidak ada, mencoba mengambil perang CWL yang sedang aktif.
 * @param encodedClanTag Tag klan (URL-encoded)
 * @param rawClanTag Tag klan (mentah, misal "#123ABC")
 * @returns {Promise<CocCurrentWar | null>} Data perang aktif atau null
 */
export async function getClanCurrentWar(
  encodedClanTag: string,
  rawClanTag: string
): Promise<CocCurrentWar | null> {
  try {
    // 1. Coba ambil perang reguler terlebih dahulu
    console.log(`[getClanCurrentWar] Checking regular war for ${rawClanTag}...`);
    const warResponse = await fetchCocApi<CocCurrentWar | { reason?: string; state?: string }>(
      `/clans/${encodedClanTag}/currentwar`
    );

    // 2. Jika perang reguler ditemukan dan aktif, kembalikan
    if (
      'state' in warResponse &&
      (warResponse.state === 'inWar' || warResponse.state === 'preparation')
    ) {
      console.log(`[getClanCurrentWar] Found active regular war for ${rawClanTag}.`);
      // Data Perang Klasik sudah konsisten (townhallLevel), bisa langsung return
      return warResponse as CocCurrentWar;
    }

    // 3. Jika "notInWar" (baik dari 'state' atau 'reason'), cek CWL
    if (
      (warResponse.state && warResponse.state === 'notInWar') ||
      (warResponse.reason && warResponse.reason === 'notInWar')
    ) {
      console.log(
        `[getClanCurrentWar] Not in regular war. Checking CWL for ${rawClanTag}...`
      );
      
      try {
        // 4. Ambil data CWL League Group
        const cwlGroup = await getClanLeagueGroup(encodedClanTag);

        // 5. Jika grup CWL tidak sedang 'inWar' atau 'preparation', berarti benar-benar tidak ada perang
        if (cwlGroup.state !== 'inWar' && cwlGroup.state !== 'preparation') {
          console.log(`[getClanCurrentWar] CWL Group is state: ${cwlGroup.state}. Clan not in active war.`);
          return null;
        }

        // 6. Kumpulkan SEMUA war tag dari SEMUA ronde
        const allWarTags = cwlGroup.rounds.flatMap(round => round.warTags);
        if (!allWarTags || allWarTags.length === 0) {
          console.log(`[getClanCurrentWar] CWL group active, but no war tags found.`);
          return null;
        }
        
        // 7. Ambil detail semua perang CWL secara paralel
        console.log(`[getClanCurrentWar] Fetching details for ${allWarTags.length} CWL wars...`);
        const warDetailPromises = allWarTags.map(tag => 
          (tag !== '#0' ? getLeagueWarDetails(encodeURIComponent(tag)) : Promise.resolve(null))
        );
        const results = await Promise.allSettled(warDetailPromises);

        // 8. Cari perang yang aktif dan melibatkan klan kita
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            const warDetail = result.value;

            // Cek apakah klan kita terlibat DALAM perang ini
            const isClanInWar = 
              warDetail.clan.tag === rawClanTag || 
              warDetail.opponent.tag === rawClanTag;

            // Cek apakah perang ini sedang berlangsung
            const isWarActive = 
              warDetail.state === 'inWar' || 
              warDetail.state === 'preparation';

            if (isClanInWar && isWarActive) {
              console.log(`[getClanCurrentWar] Found active CWL war: ${warDetail.clan.name} vs ${warDetail.opponent.name}`);
              
              // --- [PERBAIKAN UI BERANTAKAN] ---
              // Normalisasi data member CWL agar konsisten with tipe CocWarMember
              // API CWL mengembalikan 'townHallLevel' (H besar)
              // Tipe kita (dan API War Klasik) menggunakan 'townhallLevel' (h kecil)
              
              // Tipe 'any' digunakan di sini secara sengaja untuk menangani data mentah
              // dari API yang tidak konsisten
              const normalizeMembers = (member: any): CocWarMember => ({
                ...member,
                // Ambil H besar (dari CWL API), fallback ke h kecil (jika ada), lalu 0
                townhallLevel: member.townHallLevel || member.townhallLevel || 0,
              });
              
              // Buat objek baru yang sudah 'bersih'
              const fixedWarDetail: CocCurrentWar = {
                ...warDetail,
                clan: {
                  ...warDetail.clan,
                  // Map ulang members di klan kita
                  members: warDetail.clan.members.map(normalizeMembers),
                },
                opponent: {
                  ...warDetail.opponent,
                  // Map ulang members di klan lawan
                  members: warDetail.opponent.members.map(normalizeMembers),
                },
              };
        
              return fixedWarDetail;
              // --- [AKHIR PERBAIKAN] ---
            }
          }
        }
        
        // Jika loop selesai dan tidak ada perang aktif yang ditemukan
        console.log(`[getClanCurrentWar] CWL group active, but no matching active war found for clan ${rawClanTag}.`);
        return null;

      } catch (cwlError) {
        if (cwlError instanceof Error && cwlError.message.startsWith('notFound')) {
          // Ini normal jika klan tidak terdaftar di CWL
          console.log(
            `[getClanCurrentWar] Clan ${rawClanTag} not currently in CWL group (404).`
          );
        } else {
          console.error(`[getClanCurrentWar] Error fetching CWL group for ${rawClanTag}:`, cwlError);
        }
        return null; // Gagal mengambil info CWL
      }
    }

    // Alasan lain selain 'notInWar'
    console.warn(`[getClanCurrentWar] Unknown response from /currentwar for ${rawClanTag}:`, warResponse);
    return null;

  } catch (error) {
    // Tangani jika API /currentwar GAGAL (bukan 'notInWar' tapi error 500 dll)
    if (error instanceof Error && error.message.startsWith('notFound')) {
      console.warn(`[getClanCurrentWar] API check failed: Clan ${rawClanTag} not found (404).`);
    } else {
      console.error(`[getClanCurrentWar] Error checking current war for ${rawClanTag}:`, error);
    }
    return null; // Kembalikan null jika ada error saat fetch
  }
}
// --- [AKHIR FUNGSI YANG DIPERBAIKI] ---

export async function verifyPlayerToken(
  encodedPlayerTag: string,
  apiToken: string
): Promise<boolean> {
  const url = `${COC_API_URL}/players/${encodedPlayerTag}/verifytoken`;
  const apiKey = getCocApiKey();
  console.log(`[verifyPlayerToken] Requesting URL: ${url}`);

  let response: Response | null = null;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: apiToken }),
      cache: 'no-store',
    });

    if (response.ok) return true;

    // Penanganan Error (tetap sama)
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch (e) {
      try {
        errorBody = await response.text();
      } catch (textError) {}
    }
    console.error('Verify Token Error:', response.status, errorBody);
    if (response.status === 404) {
      throw new Error('Pemain tidak ditemukan.');
    }
    if (response.status === 400 && errorBody?.reason === 'invalidToken') {
      throw new Error('Token API tidak valid.');
    }
    if (response.status === 400 && errorBody?.reason === 'forbidden') {
      throw new Error('Token tidak valid atau Player Tag salah.');
    }
    if (response.status === 403) {
      throw new Error('Akses API ditolak (403).');
    }
    throw new Error(
      `Gagal verifikasi: Status ${response.status}. Detail: ${
        typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody
      }`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    console.error('Network error during verifyPlayerToken:', error);
    throw new Error('Gagal menghubungi API CoC.');
  }
}

// Ekspor semua fungsi DALAM OBJEK DEFAULT
export default {
  getPlayerData,
  getClanData,
  getClanWarLog,
  getClanLeagueGroup,
  getClanRaidSeasons,
  getClanCurrentWar, // Sekarang menggunakan versi yang sudah diperbaiki
  verifyPlayerToken,
  getLeagueWarDetails,
};


