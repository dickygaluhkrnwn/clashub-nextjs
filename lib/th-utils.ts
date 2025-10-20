// File: lib/th-utils.ts
// Deskripsi: Utilitas untuk memetakan level Town Hall (TH) ke URL gambar yang sesuai 
// (memanfaatkan aset gambar TH yang ada di proyek prototipe).

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
