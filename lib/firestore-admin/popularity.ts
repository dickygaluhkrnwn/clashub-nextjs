// File: lib/firestore-admin/popularity.ts
// Deskripsi: TAHAP 2.1 - Utility Admin SDK untuk mengelola Poin Popularitas ("Banana").

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
import { FieldValue } from 'firebase-admin/firestore'; // <-- Penting untuk increment

/**
 * @function incrementPopularity
 * Menambah (atau mengurangi) poin popularitas untuk seorang pengguna.
 * Menggunakan FieldValue.increment() untuk operasi atomik.
 *
 * @param userId - UID pengguna yang poinnya akan diubah.
 * @param amount - Jumlah poin yang akan ditambahkan (bisa negatif untuk mengurangi).
 * @param reason - Alasan penambahan poin (untuk logging).
 */
export const incrementPopularity = async (
  userId: string,
  amount: number,
  reason: string
): Promise<void> => {
  if (!userId || amount === 0) {
    console.warn(
      `[incrementPopularity] Gagal: userId (${userId}) atau amount (${amount}) tidak valid.`
    );
    return;
  }

  try {
    const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(userId);

    // Gunakan FieldValue.increment() untuk operasi yang aman dari race condition
    await userRef.update({
      popularityPoints: FieldValue.increment(amount),
    });

    console.log(
      `[Popularity] ${amount} poin ditambahkan ke user ${userId}. Alasan: ${reason}`
    );
  } catch (error) {
    console.error(
      `[incrementPopularity Error] Gagal menambah ${amount} poin untuk user ${userId}:`,
      error
    );
    // Tidak melempar error agar proses utama (misal: buat post) tidak gagal
  }
};