// File: lib/firestore-admin/posts.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'posts'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
import { Post } from '../types';
import { cleanDataForAdminSDK } from './utils';

/**
 * @function deletePostAdmin
 * Menghapus postingan dari koleksi 'posts'.
 * Dipanggil dari API Routes DELETE /api/posts/[postId].
 */
export const deletePostAdmin = async (
  postId: string
): Promise<void> => {
  try {
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
    await postRef.delete();
    console.log(`[Post - Admin] Postingan ${postId} berhasil dihapus.`);
  } catch (error) {
    console.error(
      `Firestore Error [deletePostAdmin - Admin(${postId})]:`,
      error
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
  data: Partial<Post> // Gunakan tipe Post yang sudah diimpor
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
      console.warn(`[updatePostAdmin - Admin] No valid data provided for update for Post ID: ${postId}`);
    }
  } catch (error) {
    console.error(
      `Firestore Error [updatePostAdmin - Admin(${postId})]:`,
      error
    );
    throw new Error('Gagal memperbarui postingan (Admin SDK).');
  }
};
