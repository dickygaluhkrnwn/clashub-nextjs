// File: lib/th-utils.ts
// Deskripsi: Utilitas untuk memetakan level Town Hall (TH) ke URL gambar yang sesuai
// (memanfaatkan aset gambar TH yang ada di proyek prototipe) dan utilitas format angka.

// [BARU DARI FASE 3] Impor tipe ThRequirement dan TournamentTeamMember
import { ThRequirement, TournamentTeamMember } from './clashub.types';

// =========================================================================
// [BARU] KONSTANTA TOWN HALL (SESUAI RENCANA PENGEMBANGAN V2)
// =========================================================================
export const MIN_TH_LEVEL = 1;
export const MAX_TH_LEVEL = 17;

/**
 * Array yang berisi semua level TH yang valid, dari TERTINGGI ke TERENDAH.
 * [17, 16, 15, ..., 1]
 * (Digunakan oleh dropdown agar TH terbaru muncul di atas)
 */
export const AVAILABLE_TH_LEVELS_DESC: number[] = Array.from(
  { length: MAX_TH_LEVEL - MIN_TH_LEVEL + 1 },
  (_, i) => MAX_TH_LEVEL - i,
);

/**
 * Array yang berisi semua level TH yang valid, dari TERENDAH ke TERTINGGI.
 * [1, 2, 3, ..., 17]
 */
export const AVAILABLE_TH_LEVELS_ASC: number[] = Array.from(
  { length: MAX_TH_LEVEL - MIN_TH_LEVEL + 1 },
  (_, i) => i + MIN_TH_LEVEL,
);

/**
 * Mendapatkan URL gambar Town Hall berdasarkan level TH.
 * @param thLevel Level Town Hall (misalnya, 15).
 * @returns URL gambar yang sesuai, atau placeholder jika tidak ditemukan.
 */
export const getThImage = (thLevel: number): string => {
  // Asumsi gambar TH berada di public/images/
  const baseDir = '/images';

  // [PERBAIKAN] Aset TH1-TH8 menggunakan format "TH1.png" (uppercase)
  if (thLevel >= 1 && thLevel <= 8) {
    return `${baseDir}/TH${thLevel}.png`;
  }
  // [PERBAIKAN] Aset TH9-TH17 menggunakan format "th9.png" (lowercase)
  if (thLevel >= 9 && thLevel <= 17) {
    return `${baseDir}/th${thLevel}.png`;
  }
  // Fallback atau placeholder (default ke TH1 jika di luar rentang)
  return `${baseDir}/TH1.png`;
};

/**
 * Memformat angka menjadi string dengan pemisah ribuan (Locale ID).
 * @param value Nilai angka atau null.
 * @returns String terformat atau '0' jika null/undefined.
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  // Gunakan toLocaleString('id-ID') untuk format angka ribuan Indonesia
  return value.toLocaleString('id-ID');
};

/**
 * Mengurai (parse) string tanggal dari format CoC API (YYYYMMDDTHHMMSS.SSSZ)
 * menjadi objek Date JavaScript.
 * @param cocDateStr String tanggal dari CoC API, bisa null atau undefined.
 * @returns Objek Date yang valid, atau null jika format tidak valid atau input null.
 */
export const parseCocDate = (cocDateStr: string | null | undefined): Date | null => {
  // Cek jika input null, undefined, atau string kosong
  if (!cocDateStr) {
    return null;
  }

  try {
    // Format: YYYYMMDDTHHMMSS.SSSZ
    // Ubah ke: YYYY-MM-DDTHH:MM:SS.SSSZ (Format ISO 8601 yang dapat dibaca new Date())

    // Pastikan panjang string cukup (minimal YYYYMMDDTHHMMSS)
    if (cocDateStr.length < 15) {
      console.warn(`Format tanggal CoC terlalu pendek: ${cocDateStr}`);
      return null;
    }

    // Susun ulang string ke format ISO
    const isoStr = `${cocDateStr.substring(0, 4)}-${cocDateStr.substring(
      4,
      6,
    )}-${cocDateStr.substring(6, 8)}T${cocDateStr.substring(
      9,
      11,
    )}:${cocDateStr.substring(11, 13)}:${cocDateStr.substring(13, 15)}${cocDateStr.substring(15)}`;

    const date = new Date(isoStr);

    // Cek apakah hasil parsing tanggal valid
    if (isNaN(date.getTime())) {
      console.warn(`Format tanggal CoC tidak valid setelah diubah: ${isoStr}`);
      return null;
    }

    return date;
  } catch (error) {
    // Tangani jika terjadi error saat substring (misalnya string terlalu pendek)
    console.error(`Gagal mem-parse tanggal CoC: ${cocDateStr}`, error);
    return null;
  }
};

// =========================================================================
// [BARU: FASE 3] LOGIKA VALIDASI TH TURNAMEN
// =========================================================================

/**
 * @interface ThValidationResult
 * Tipe kembalian untuk fungsi validasi TH.
 */
export interface ThValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * @function validateTeamThRequirements
 * [BARU: FASE 3] Memvalidasi daftar anggota tim berdasarkan aturan TH (thRequirement) turnamen.
 * Ini mencakup CEK 2 (Aturan Spesifik) dan CEK 3 (Min/Max Level) dari Roadmap.
 *
 * @param members Array dari TournamentTeamMember (playerTag, playerName, townHallLevel).
 * @param thRequirement Objek ThRequirement dari turnamen.
 * @returns ThValidationResult { isValid: boolean, message: string }
 */
export const validateTeamThRequirements = (
  members: TournamentTeamMember[],
  thRequirement: ThRequirement,
): ThValidationResult => {
  const { type, minLevel, maxLevel, allowedLevels } = thRequirement;

  // CEK 3: Validasi Min/Max Level untuk setiap anggota
  for (const member of members) {
    if (
      member.townHallLevel < minLevel ||
      member.townHallLevel > maxLevel
    ) {
      return {
        isValid: false,
        message: `Pemain "${member.playerName}" (TH${member.townHallLevel}) tidak memenuhi syarat. Level TH harus di antara TH${minLevel} dan TH${maxLevel}.`,
      };
    }
  }

  // CEK 2: Validasi berdasarkan Tipe Aturan Spesifik ('uniform' atau 'mixed')
  // 'any' berarti lolos jika sudah lolos CEK 3.
  if (type === 'any') {
    return { isValid: true, message: 'OK' };
  }

  // Tipe: 'uniform' (Seragam)
  // Semua anggota harus memiliki level TH yang sama dengan 'allowedLevels[0]'
  if (type === 'uniform') {
    const requiredTh = allowedLevels[0];
    for (const member of members) {
      if (member.townHallLevel !== requiredTh) {
        return {
          isValid: false,
          message: `Turnamen ini "Seragam" (TH Sama). Semua pemain harus TH${requiredTh}, tetapi "${member.playerName}" adalah TH${member.townHallLevel}.`,
        };
      }
    }
    return { isValid: true, message: 'OK' };
  }

  // Tipe: 'mixed' (Campuran)
  // Daftar TH anggota harus sama persis dengan 'allowedLevels'
  if (type === 'mixed') {
    // 1. Buat "counts" dari aturan yang diizinkan
    //    Contoh: [17, 16, 16, 15, 14] -> { 17: 1, 16: 2, 15: 1, 14: 1 }
    const requiredCounts: { [key: number]: number } = {};
    for (const th of allowedLevels) {
      requiredCounts[th] = (requiredCounts[th] || 0) + 1;
    }

    // 2. Buat "counts" dari TH anggota yang didaftarkan
    const memberCounts: { [key: number]: number } = {};
    for (const member of members) {
      memberCounts[member.townHallLevel] =
        (memberCounts[member.townHallLevel] || 0) + 1;
    }

    // 3. Bandingkan kedua "counts"
    // Cek jika ada TH anggota yang tidak ada di aturan
    for (const th in memberCounts) {
      if (!requiredCounts[th] || memberCounts[th] > requiredCounts[th]) {
        return {
          isValid: false,
          message: `Tim Anda mendaftarkan ${memberCounts[th]} pemain TH${th}, tetapi aturan hanya mengizinkan ${
            requiredCounts[th] || 0
          } pemain TH${th}.`,
        };
      }
    }

    // Cek jika jumlah TH di aturan tidak terpenuhi
    for (const th in requiredCounts) {
      if (!memberCounts[th] || memberCounts[th] < requiredCounts[th]) {
        return {
          isValid: false,
          message: `Aturan turnamen memerlukan ${requiredCounts[th]} pemain TH${th}, tetapi tim Anda hanya mendaftarkan ${
            memberCounts[th] || 0
          }.`,
        };
      }
    }
  }

  // Lolos semua Cek
  return { isValid: true, message: 'OK' };
};