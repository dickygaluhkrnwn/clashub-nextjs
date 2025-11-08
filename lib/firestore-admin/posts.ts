// File: lib/firestore-admin/posts.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'posts'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// [UPDATE 4.2] Impor FirestoreDocument
import { Post, FirestoreDocument } from '../types';
// [UPDATE 4.2] Impor docToDataAdmin
import { cleanDataForAdminSDK, docToDataAdmin } from './utils';

// [BARU] Impor untuk logika 24 jam
import { incrementPopularity } from './popularity';

/**
 * [BARU] Helper function untuk menghapus koleksi/sub-koleksi secara rekursif.
 * Ini penting untuk menghapus semua 'replies' saat postingan dihapus.
 */
async function deleteCollectionRecursive(
  collectionRef: FirebaseFirestore.CollectionReference,
  batchSize: number = 50,
) {
  const query = collectionRef.limit(batchSize);
  const snapshot = await query.get();

  if (snapshot.empty) {
    return;
  }

  const batch = adminFirestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Lanjutkan secara rekursif
  await deleteCollectionRecursive(collectionRef, batchSize);
}

/**
 * @function deletePostAdmin
 * [PERBAIKAN] Fungsi ini sekarang menangani logika 24 jam DAN menghapus sub-koleksi.
 * Dipanggil dari API Routes DELETE /api/posts/[postId].
 */
export const deletePostAdmin = async (
  post: Post, // [DIUBAH] Menerima objek Post lengkap, bukan hanya postId
): Promise<void> => {
  try {
    const { id: postId, authorId, createdAt, title } = post;
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);

    // [FITUR BARU] Logika Poin 24 Jam
    // 'createdAt' sudah dikonversi menjadi objek Date oleh getPostById (dari lib/firestore.ts)
    if (createdAt && createdAt instanceof Date) {
      const hoursSinceCreation =
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      // Kurangi poin HANYA jika dihapus kurang dari 24 jam setelah dibuat
      if (hoursSinceCreation < 24) {
        console.log(
          `[Post - Admin] Post ${postId} dihapus dalam < 24 jam. Mengurangi 5 poin dari ${authorId}.`,
        );
        // Panggil incrementPopularity dengan -5
        await incrementPopularity(
          authorId,
          -5,
          `Post deleted < 24h: ${title.substring(0, 20)}`,
        );
      } else {
        console.log(
          `[Post - Admin] Post ${postId} dihapus setelah 24 jam. Poin tidak dikurangi.`,
        );
      }
    } else {
      console.warn(
        `[Post - Admin] Tidak dapat menghitung selisih waktu untuk post ${postId}, 'createdAt' tidak valid. Poin tidak dikurangi.`,
      );
    }

    // [PERBAIKAN] Hapus sub-koleksi 'replies' agar tidak jadi data sampah
    const repliesRef = postRef.collection('replies'); // Asumsi sub-koleksi bernama 'replies'
    await deleteCollectionRecursive(repliesRef);
    console.log(
      `[Post - Admin] Sub-koleksi 'replies' untuk ${postId} berhasil dihapus.`,
    );

    // Hapus dokumen postingan utama
    await postRef.delete();
    console.log(`[Post - Admin] Postingan ${postId} berhasil dihapus.`);
  } catch (error) {
    console.error(
      `Firestore Error [deletePostAdmin - Admin(${post.id})]:`,
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