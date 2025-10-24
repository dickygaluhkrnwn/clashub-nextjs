// File: lib/coc-api.ts
// Deskripsi: Service layer khusus server untuk berinteraksi dengan API resmi Clash of Clans.
// Semua fungsi di sini harus dipanggil dari Server Components, Server Actions, atau API Routes.

import { CocClan, CocMember, CocPlayer, CocWarLog } from './types';

// =========================================================================
// KONFIGURASI API
// =========================================================================

const COC_API_URL = 'https://api.clashofclans.com/v1';

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
 */
async function fetchCocApi<T>(endpoint: string): Promise<T> {
	const apiKey = getCocApiKey();
	const url = `${COC_API_URL}${endpoint}`;
	
	// Exponential Backoff implementation
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json',
				},
				// Cache control: Data CoC adalah data yang sering berubah, 
				// kita akan melakukan cache manual di Firestore, jadi fetch ini 
				// harus bersifat dinamis (no-cache atau revalidate rendah).
				next: { revalidate: 60 } // Revalidate setelah 60 detik
			});

			if (response.status === 404) {
				throw new Error('Data not found. Invalid tag or resource not public.');
			}
			
			if (!response.ok) {
				// Log status error, terutama 429 (Rate Limit)
				console.error(`CoC API Error: ${response.status} for ${endpoint}`);
				// Jika Rate Limit atau Server Error, coba lagi
				if (response.status === 429 || response.status >= 500) {
					const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
					console.warn(`Retrying in ${Math.round(delay / 1000)}s...`);
					await new Promise(res => setTimeout(res, delay));
					continue; // Lanjut ke iterasi loop berikutnya (coba lagi)
				}
				
				// Untuk error lain, throw
				const errorBody = await response.text();
				throw new Error(`CoC API request failed: ${response.status} - ${errorBody}`);
			}

			return response.json() as T;

		} catch (error) {
			// Jika ini adalah percobaan terakhir, throw error
			if (attempt === 4) {
				throw error;
			}
		}
	}
	// Seharusnya tidak pernah mencapai sini
	throw new Error("Failed to fetch CoC API after multiple retries.");
}

// =========================================================================
// FUNGSI-FUNGSI PENGAMBILAN DATA
// =========================================================================

/**
 * Membersihkan dan mengenkode Tag pemain/klan untuk URL API.
 * @param tag Tag (contoh: #P0L9Q8RY)
 * @returns {string} Tag yang dienkode (contoh: %23P0L9Q8RY)
 */
const encodeTag = (tag: string): string => {
	return encodeURIComponent(tag.toUpperCase().trim());
};

/**
 * 1. Mendapatkan data Player (CocPlayer) dari API.
 * Digunakan untuk: Verifikasi Player, Profil Player Publik.
 * @param playerTag Tag Pemain.
 * @returns {Promise<CocPlayer>} Data pemain mentah.
 */
export async function getPlayerData(playerTag: string): Promise<CocPlayer> {
	const encodedTag = encodeTag(playerTag);
	return fetchCocApi<CocPlayer>(`/players/${encodedTag}`);
}

/**
 * 2. Mendapatkan data Clan (CocClan) dari API.
 * Digunakan untuk: Sinkronisasi Klan Internal, Indeks Klan Publik.
 * @param clanTag Tag Klan.
 * @returns {Promise<CocClan>} Data klan mentah.
 */
export async function getClanData(clanTag: string): Promise<CocClan> {
	const encodedTag = encodeTag(clanTag);
	return fetchCocApi<CocClan>(`/clans/${encodedTag}`);
}

/**
 * 3. Mendapatkan Log Perang Klan (CocWarLog) dari API.
 * Digunakan untuk: Sinkronisasi Klan Internal.
 * @param clanTag Tag Klan.
 * @returns {Promise<CocWarLog>} Log perang klan.
 */
export async function getClanWarLog(clanTag: string): Promise<CocWarLog> {
	const encodedTag = encodeTag(clanTag);
	return fetchCocApi<CocWarLog>(`/clans/${encodedTag}/warlog`);
}

/**
 * 4. Mendapatkan War Aktif Klan (CocWarLog) dari API.
 * Mengimplementasikan logika cek War Classic & CWL Group dari Blueprint Apps Script.
 * @param clanTag Tag Klan.
 * @returns {Promise<CocWarLog>} Data War Aktif mentah.
 */
export async function getClanCurrentWar(clanTag: string): Promise<CocWarLog | null> {
	const encodedTag = encodeTag(clanTag);
	
	// 1. Cek War Classic aktif
	const warResponse = await fetchCocApi<CocWarLog | { reason: string }>(`/clans/${encodedTag}/currentwar`);
	
	// Jika War Classic aktif, kembalikan
	if ('state' in warResponse && (warResponse.state === 'inWar' || warResponse.state === 'preparation')) {
		return warResponse as CocWarLog;
	}
	
	// Jika "notInWar" atau error lain, coba cek CWL Group (sesuai logika Apps Script)
	if ('reason' in warResponse && warResponse.reason === 'notInWar') {
		// 2. Cek CWL Group
		const cwlGroupResponse = await fetchCocApi<any>(`/clans/${encodedTag}/currentwar/leaguegroup`);
		
		if ('state' in cwlGroupResponse && cwlGroupResponse.state === 'inWar') {
			// CWL Group aktif, kita perlu menemukan warTag yang benar untuk klan kita.
			const clanInGroup = cwlGroupResponse.clans.find((c: any) => c.tag === clanTag);
			const currentWarTag = clanInGroup?.currentWarTag;
			
			if (currentWarTag) {
				// Ambil War spesifik dengan War Tag CWL
				return fetchCocApi<CocWarLog>(`/clanwarleagues/wars/${encodeTag(currentWarTag)}`);
			}
		}
	}

	return null; // Tidak ada War Aktif yang ditemukan.
}


/**
 * 5. Memverifikasi Player dengan Token API In-Game (verifyPlayerToken).
 * Endpoint ini membutuhkan API key klan, jadi kita akan membuat API route di Next.js
 * untuk menjalankan logika ini. Untuk saat ini, kita akan membuat fungsi pembantu
 * yang memanggil endpoint API Clash of Clans.
 * @param playerTag Tag Pemain.
 * @param apiToken Token API yang diperoleh pemain di game.
 * @returns {Promise<CocPlayer>} Data pemain jika verifikasi berhasil.
 */
export async function verifyPlayerToken(playerTag: string, apiToken: string): Promise<CocPlayer> {
	const encodedTag = encodeTag(playerTag);
	const url = `${COC_API_URL}/players/${encodedTag}/verifytoken`;

	const apiKey = getCocApiKey();
	
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ token: apiToken }),
		// Matikan cache karena ini adalah POST request
		cache: 'no-store'
	});

	if (!response.ok) {
		const errorBody = await response.json();
		console.error('Verify Token Error:', errorBody);
		// Contoh penanganan error spesifik dari Clash of Clans API
		if (response.status === 400 && errorBody.reason === 'forbidden') {
			throw new Error('Token tidak valid atau pemain tidak ditemukan.');
		}
		throw new Error(`Gagal memverifikasi token: ${response.status}`);
	}

	// Perbaikan: Tambahkan 'await' di sini untuk menyelesaikan Promise dari response.json()
	const playerData = await response.json(); 
	return playerData as CocPlayer;
}

// Ekspor semua fungsi yang akan digunakan di API Routes atau Server Components
export default {
	getPlayerData,
	getClanData,
	getClanWarLog,
	getClanCurrentWar,
	verifyPlayerToken,
};