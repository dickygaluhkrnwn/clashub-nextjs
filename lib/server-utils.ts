// File: lib/server-utils.ts
// Deskripsi: Kumpulan fungsi utilitas yang dijalankan HANYA di sisi server (misal: API Routes).

// [PERBAIKAN] Ganti impor client-side (firestore) dengan admin-side (firestore-admin)
import { getManagedClansAdmin } from '@/lib/firestore-admin/clans';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews'; // [BARU] Impor fungsi ulasan
import { ManagedClan, RecommendedTeam, FirestoreDocument } from '@/lib/types'; // [PERBAIKAN] Impor tipe baru

/**
 * @function getRecommendedTeams
 * Mengambil dan memilih klan secara acak untuk direkomendasikan di halaman utama.
 * Logika ini berjalan di Server Component (SSR).
 * [PERBAIKAN] Fungsi ini sekarang menghitung dan mengembalikan rating asli.
 * @returns Array 5 klan internal terbaik (berdasarkan rating) atau klan acak.
 */
export async function getRecommendedTeams(): Promise<RecommendedTeam[]> {
  try {
    // [PERBAIKAN] Menggunakan getManagedClansAdmin (Admin SDK) bukan getManagedClans (Client SDK)
    const allClans: FirestoreDocument<ManagedClan>[] =
      await getManagedClansAdmin();

    if (allClans.length === 0) {
      return [];
    }

    // [BARU] Hitung averageRating untuk setiap klan
    const clansWithRating: RecommendedTeam[] = await Promise.all(
      allClans.map(async (clan) => {
        // Panggil fungsi admin untuk mengambil ulasan
        const reviews = await getClanReviewsAdmin(clan.id);
        let averageRating = 0;

        if (reviews.length > 0) {
          const totalRating = reviews.reduce(
            (acc, review) => acc + review.rating,
            0,
          );
          averageRating = totalRating / reviews.length;
        }

        // Kembalikan objek baru yang menggabungkan ManagedClan dengan averageRating
        return {
          ...clan,
          averageRating: averageRating,
        };
      }),
    );

    // [PERBAIKAN] Logika sorting sekarang berdasarkan rating, bukan lagi logo/website
    const prioritizedClans = clansWithRating.sort(
      (a, b) => b.averageRating - a.averageRating,
    );

    // 2. Ambil 5 klan teratas berdasarkan rating
    let selectedClans: RecommendedTeam[] = prioritizedClans.slice(0, 5);

    // 3. Jika kurang dari 5, tambahkan klan lain secara acak (logika lama dipertahankan)
    if (selectedClans.length < 5) {
      const remainingNeeded = 5 - selectedClans.length;
      const remainingClans = clansWithRating.filter(
        (clan) => !selectedClans.find((s) => s.id === clan.id),
      );

      // Logika shuffle/acak dasar
      for (
        let i = 0;
        i < remainingNeeded && remainingClans.length > 0;
        i++
      ) {
        const randomIndex = Math.floor(Math.random() * remainingClans.length);
        selectedClans.push(remainingClans.splice(randomIndex, 1)[0]);
      }
    }

    return selectedClans;
  } catch (error) {
    console.error('Failed to fetch recommended clans:', error);
    // Mengembalikan array kosong jika terjadi error agar halaman tidak crash
    return [];
  }
}

/**
 * @function getClanTagsToMonitor
 * Mengambil daftar Clan Tags yang harus dimonitor dan di-cache secara berkala
 * oleh Cron Job (Public Index).
 * @returns {string[]} Array of raw clan tags (termasuk '#').
 */
export function getClanTagsToMonitor(): string[] {
  // Implementasi placeholder menggunakan Tag Klan internal (GBK Crew & GBK Squad)
  // sesuai blueprint Dasboard Clan CoC - Main - Pengaturan.csv.
  return [
    '#2G8PU0GLJ', // GBK Crew
    '#2GQ9R8Y2R', // GBK Squad
    // Daftar ini akan di-update secara otomatis oleh Cron Job.
  ];
}

// [FIX] FUNGSI BARU UNTUK MENGATASI MASALAH TIMESTAMP
/**
 * Mengonversi string tanggal non-standar dari CoC API (YYYYMMDDTHHMMSS.SSSZ)
 * menjadi objek Date yang valid.
 * @param cocDateString String tanggal dari CoC API.
 * @returns {Date} Objek Date yang valid.
 * @throws {Error} Jika format string tidak valid atau gagal parsing.
 */
export function parseCocApiTimestamp(cocDateString: string): Date {
  // --- [MODIFIKASI PEMBERSIHAN LOG] ---
  // 1. Cek 'unknown' (dari arsip ringkasan fallback) atau null/undefined secara diam-diam.
  if (!cocDateString || cocDateString === 'unknown') {
    return new Date(0); // Kembalikan epoch (Jan 1, 1970 UTC)
  }

  // 2. Cek panjang. Jika aneh (tapi bukan 'unknown'), baru tampilkan warn.
  if (cocDateString.length < 15) {
    // Jika tanggal tidak ada atau formatnya aneh, kembalikan Date epoch
    // Ini lebih aman daripada melempar error yang menghentikan seluruh batch
    console.warn(
      `Invalid CoC date string format received: ${cocDateString}. Using epoch.`,
    );
    return new Date(0); // Kembali ke Jan 1, 1970 UTC
  }
  // --- [AKHIR MODIFIKASI] ---

  try {
    // Format: YYYYMMDDTHHMMSS.SSSZ
    // Target: YYYY-MM-DDTHH:MM:SS.SSSZ
    const year = cocDateString.substring(0, 4);
    const month = cocDateString.substring(4, 6);
    const day = cocDateString.substring(6, 8);
    const hour = cocDateString.substring(9, 11);
    const minute = cocDateString.substring(11, 13);
    const second = cocDateString.substring(13, 15);
    const milliseconds = cocDateString.substring(15); // .SSSZ

    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${milliseconds}`;

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      // Jika parsing gagal (misal tanggal invalid)
      console.warn(
        `Failed to parse date string: ${cocDateString} (ISO: ${isoString}). Using epoch.`,
      );
      return new Date(0);
    }
    return date;
  } catch (error) {
    console.error(
      `Exception during date parsing for: ${cocDateString}`,
      error,
    );
    return new Date(0); // Fallback jika terjadi exception
  }
}