// File: lib/firestore-admin/reviews.ts
// Deskripsi: [FIX] Utility Admin SDK untuk membuat dan MENGAMBIL notifikasi.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
import { ClanReview, FirestoreDocument } from '../clashub.types';
import { docToDataAdmin } from './utils';

/**
 * @function getClanReviewsAdmin
 * Mengambil semua ulasan yang ditujukan untuk sebuah ManagedClan (berdasarkan clanId internal).
 *
 * @param clanId - ID internal (Firestore) dari ManagedClan.
 */
export const getClanReviewsAdmin = async (
  clanId: string,
): Promise<FirestoreDocument<ClanReview>[]> => {
  try {
    const reviewsRef = adminFirestore.collection(COLLECTIONS.CLAN_REVIEWS);

    // [PERBAIKAN] Hapus .orderBy('createdAt', 'desc') dari query.
    // Ini menghindari error FAILED_PRECONDITION (membutuhkan index komposit).
    // Kita akan filter berdasarkan targetClanId SAJA.
    const q = reviewsRef.where('targetClanId', '==', clanId);

    const snapshot = await q.get();

    const reviews = snapshot.docs
      .map((doc) => docToDataAdmin<ClanReview>(doc))
      .filter(Boolean) as FirestoreDocument<ClanReview>[];

    // [PERBAIKAN] Lakukan pengurutan (sort) di sisi server (in-memory)
    // setelah data diambil, bukan di query database.
    // Asumsi docToDataAdmin mengubah Timestamp Firestore menjadi objek Date.
    reviews.sort((a, b) => {
      // Pastikan createdAt adalah objek Date yang valid
      const timeA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      return timeB - timeA; // Urutkan descending (terbaru dulu)
    });

    return reviews;
  } catch (error) {
    console.error(
      `Firestore Error [getClanReviewsAdmin - Admin(${clanId})]:`,
      error,
    );
    // Kembalikan array kosong jika terjadi error (misal: index belum ada)
    // agar halaman tidak crash.
    return [];
  }
};