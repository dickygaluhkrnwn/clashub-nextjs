// File: app/api/posts/[postId]/like/route.ts
// Deskripsi: API endpoint untuk menangani like/unlike (toggle) pada sebuah postingan.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // Menggunakan auth simulasi kita
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Post } from '@/lib/clashub.types'; // Menggunakan tipe Post yang sudah diupdate

/**
 * @handler POST
 * @route POST /api/posts/[postId]/like
 * @deskripsi Menangani aksi like/unlike (toggle) pada sebuah postingan.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } },
) {
  // 1. Otentikasi Pengguna
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { uid } = user;

  // 2. Validasi Parameter
  const { postId } = params;
  if (!postId) {
    return NextResponse.json(
      { error: 'Post ID tidak ditemukan di URL' },
      { status: 400 },
    );
  }

  try {
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);

    // 3. Gunakan Transaction untuk operasi 'toggle' yang aman
    const newLikeStatus = await adminFirestore.runTransaction(
      async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists) {
          throw new Error('Postingan tidak ditemukan');
        }

        const post = postDoc.data() as Post;
        // Pastikan 'likes' adalah array, default ke array kosong jika belum ada
        const currentLikes = post.likes || [];
        const isLiked = currentLikes.includes(uid);

        let newStatus: boolean;

        // 4. Logika Toggle Like/Unlike
        if (isLiked) {
          // Pengguna sudah like, jadi unlike
          transaction.update(postRef, {
            likes: FieldValue.arrayRemove(uid),
          });
          newStatus = false; // Status like yang baru adalah false
        } else {
          // Pengguna belum like, jadi like
          transaction.update(postRef, {
            likes: FieldValue.arrayUnion(uid),
          });
          newStatus = true; // Status like yang baru adalah true
        }

        return newStatus;
      },
    );

    // 5. Kembalikan respons sukses
    return NextResponse.json({
      success: true,
      newLikeStatus: newLikeStatus, // Mengirim status like yang baru ke client
    });
  } catch (error) {
    console.error(
      `Firestore Error [POST /api/posts/${postId}/like]:`,
      error,
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Gagal memproses like';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}