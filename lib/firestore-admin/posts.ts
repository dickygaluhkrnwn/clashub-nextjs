// File: lib/firestore-admin/posts.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'posts'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// [UPDATE 4.2] Impor FirestoreDocument
import { Post, FirestoreDocument } from '../types';
// [UPDATE 4.2] Impor docToDataAdmin
import { cleanDataForAdminSDK, docToDataAdmin } from './utils';

/**
 * @function deletePostAdmin
 * Menghapus postingan dari koleksi 'posts'.
 * Dipanggil dari API Routes DELETE /api/posts/[postId].
 */
export const deletePostAdmin = async (
  postId: string,
): Promise<void> => {
  try {
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
    await postRef.delete();
    console.log(`[Post - Admin] Postingan ${postId} berhasil dihapus.`);
  } catch (error) {
    console.error(
      `Firestore Error [deletePostAdmin - Admin(${postId})]:`,
      error,
    );
    throw new Error('Gagal menghapus postingan (Admin SDK).');
  }
};

/**
 * @function updatePostAdmin
 * Memperbarui data postingan di koleksi 'posts'.
 * Dipanggil dari API Routes PUT /api/posts/[postId].
 */
export const updatePostAdmin = async (
  postId: string,
  data: Partial<Post>, // Gunakan tipe Post yang sudah diimpor
): Promise<void> => {
  try {
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);

    // Tambahkan updatedAt manual
    const updateDataWithTimestamp = {
      ...data,
      updatedAt: new Date(),
    };

    const cleanedData = cleanDataForAdminSDK(updateDataWithTimestamp);

    if (Object.keys(cleanedData).length > 0) {
      await postRef.update(cleanedData);
      console.log(`[Post - Admin] Postingan ${postId} berhasil diperbarui.`);
    } else {
      console.warn(
        `[updatePostAdmin - Admin] No valid data provided for update for Post ID: ${postId}`,
      );
    }
  } catch (error) {
    console.error(
      `Firestore Error [updatePostAdmin - Admin(${postId})]:`,
      error,
    );
    throw new Error('Gagal memperbarui postingan (Admin SDK).');
  }
};

// --- [BARU: TAHAP 4.2] ---
/**
 * @function getPostsByAuthorAdmin
 * Mengambil postingan berdasarkan authorId (Admin SDK).
 * Ini adalah versi server-side untuk 'getPostsByAuthor'.
 */
export const getPostsByAuthorAdmin = async (
  authorId: string,
  limitCount: number = 3,
): Promise<FirestoreDocument<Post>[]> => {
  try {
    const postsRef = adminFirestore.collection(COLLECTIONS.POSTS);
    const q = postsRef
      .where('authorId', '==', authorId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);

    const snapshot = await q.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<Post>(doc))
      .filter(Boolean) as FirestoreDocument<Post>[];
  } catch (error) {
    // --- [PERBAIKAN] ---
    // Menambahkan blok catch yang lengkap yang hilang tadi
    console.error(
      `Firestore Error [getPostsByAuthorAdmin - Admin(${authorId})]:`,
      error,
    );
    // Kembalikan array kosong jika terjadi error (misal: index hilang)
    // Ini agar halaman profil tetap bisa render.
    return [];
  }
}; // <-- Menambahkan '}' dan ';' yang hilang