// File: app/api/posts/[postId]/replies/route.ts
// Deskripsi: API endpoint untuk mengambil (GET), membuat (POST), dan menghapus (DELETE) balasan pada postingan.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Reply } from '@/lib/clashub.types';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

/**
 * @handler GET
 * @route GET /api/posts/[postId]/replies
 * @deskripsi Mengambil semua balasan untuk postingan tertentu.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } },
) {
  const { postId } = params;
  if (!postId) {
    return NextResponse.json(
      { error: 'Post ID tidak ditemukan di URL' },
      { status: 400 },
    );
  }

  try {
    const repliesRef = adminFirestore
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection('replies');

    // Mengambil balasan dan mengurutkannya berdasarkan yang terlama (asc)
    const q = repliesRef.orderBy('createdAt', 'asc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // Menggunakan docToDataAdmin untuk serialisasi
    const replies = snapshot.docs
      .map((doc) => docToDataAdmin<Reply>(doc))
      .filter(Boolean) as Reply[];

    return NextResponse.json(replies, { status: 200 });
  } catch (error) {
    console.error(
      `Firestore Error [GET /api/posts/${postId}/replies]:`,
      error,
    );
    return NextResponse.json(
      { error: 'Gagal mengambil balasan' },
      { status: 500 },
    );
  }
}

/**
 * @handler POST
 * @route POST /api/posts/[postId]/replies
 * @deskripsi Membuat balasan baru untuk postingan tertentu.
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

  // 2. Validasi Parameter dan Body
  const { postId } = params;
  if (!postId) {
    return NextResponse.json(
      { error: 'Post ID tidak ditemukan di URL' },
      { status: 400 },
    );
  }

  let content: string;
  try {
    const body = await request.json();
    content = body.content;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Konten balasan tidak boleh kosong' },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // 3. Ambil data profil pengguna
    const userProfile = await getUserProfileAdmin(uid);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profil pengguna tidak ditemukan' },
        { status: 404 },
      );
    }

    // 4. Siapkan data balasan baru
    const adminTimestamp = Timestamp.now();
    const newReplyData = {
      content: content.trim(),
      authorId: uid,
      authorName: userProfile.displayName || 'Clasher',
      authorAvatarUrl: userProfile.avatarUrl || '',
      createdAt: adminTimestamp,
    };

    // 5. Gunakan Batch Write
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
    const newReplyRef = adminFirestore
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection('replies')
      .doc();

    const batch = adminFirestore.batch();

    // Operasi 1: Buat dokumen balasan baru
    batch.set(newReplyRef, newReplyData);

    // Operasi 2: Tambah counter 'replies' di dokumen Post utama
    batch.update(postRef, {
      replies: FieldValue.increment(1),
    });

    await batch.commit();

    // 6. Kembalikan data balasan
    const responseData = {
      id: newReplyRef.id,
      ...newReplyData,
      createdAt: adminTimestamp.toDate().toISOString(),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error(
      `Firestore Error [POST /api/posts/${postId}/replies]:`,
      error,
    );
    return NextResponse.json(
      { error: 'Gagal memposting balasan' },
      { status: 500 },
    );
  }
}

/**
 * @handler DELETE
 * @route DELETE /api/posts/[postId]/replies?replyId=[replyId]
 * @deskripsi Menghapus balasan milik pengguna sendiri.
 */
export async function DELETE(
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
  const { searchParams } = new URL(request.url);
  const replyId = searchParams.get('replyId');

  if (!postId || !replyId) {
    return NextResponse.json(
      { error: 'Post ID atau Reply ID tidak ditemukan' },
      { status: 400 },
    );
  }

  try {
    const replyRef = adminFirestore
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection('replies')
      .doc(replyId);

    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);

    // 3. Cek Kepemilikan (Get dokumen reply dulu)
    const replySnap = await replyRef.get();

    if (!replySnap.exists) {
      return NextResponse.json(
        { error: 'Balasan tidak ditemukan' },
        { status: 404 },
      );
    }

    const replyData = replySnap.data() as Reply;

    // Pastikan user yang login adalah pemilik balasan
    if (replyData.authorId !== uid) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk menghapus balasan ini' },
        { status: 403 },
      );
    }

    // 4. Gunakan Batch Write untuk menghapus dan update counter
    const batch = adminFirestore.batch();

    // Operasi 1: Hapus dokumen balasan
    batch.delete(replyRef);

    // Operasi 2: Kurangi counter 'replies' di dokumen Post utama
    // Gunakan increment(-1)
    batch.update(postRef, {
      replies: FieldValue.increment(-1),
    });

    await batch.commit();

    return NextResponse.json(
      { message: 'Balasan berhasil dihapus' },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      `Firestore Error [DELETE /api/posts/${postId}/replies]:`,
      error,
    );
    return NextResponse.json(
      { error: 'Gagal menghapus balasan' },
      { status: 500 },
    );
  }
}