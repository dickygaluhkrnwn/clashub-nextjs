// File: lib/th-utils.ts
// Deskripsi: Utilitas untuk memetakan level Town Hall (TH) ke URL gambar yang sesuai 
// (memanfaatkan aset gambar TH yang ada di proyek prototipe) dan utilitas format angka.

/**
 * Mendapatkan URL gambar Town Hall berdasarkan level TH.
 * @param thLevel Level Town Hall (misalnya, 15).
 * @returns URL gambar yang sesuai, atau placeholder jika tidak ditemukan.
 */
export const getThImage = (thLevel: number): string => {
    // Asumsi gambar TH berada di public/images/thXX.png
    const baseDir = '/images'; 
    // Kita hanya memiliki aset untuk TH9 hingga TH17 (dari prototipe lama)
    if (thLevel >= 9 && thLevel <= 17) {
        return `${baseDir}/th${thLevel}.png`; 
    }
    // Fallback atau placeholder
    return `${baseDir}/th9.png`; 
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
        const isoStr = `${cocDateStr.substring(0, 4)}-${cocDateStr.substring(4, 6)}-${cocDateStr.substring(6, 8)}T${cocDateStr.substring(9, 11)}:${cocDateStr.substring(11, 13)}:${cocDateStr.substring(13, 15)}${cocDateStr.substring(15)}`;
        
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

