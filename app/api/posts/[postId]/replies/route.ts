// File: app/api/posts/[postId]/replies/route.ts
// Deskripsi: API endpoint untuk mengambil (GET) dan membuat (POST) balasan pada postingan.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Reply, UserProfile } from '@/lib/clashub.types';
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
      .collection('replies'); // Sesuai Peta Develop (Langkah 3.2)

    // Mengambil balasan dan mengurutkannya berdasarkan yang terlama (asc)
    const q = repliesRef.orderBy('createdAt', 'asc');
    const snapshot = await q.get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 }); // Kembalikan array kosong jika tidak ada balasan
    }

    // Menggunakan docToDataAdmin untuk serialisasi (termasuk konversi Timestamp)
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
    // 3. Ambil data profil pengguna untuk denormalisasi
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
      authorAvatarUrl: userProfile.avatarUrl || '', // Default ke string kosong jika tidak ada
      createdAt: adminTimestamp,
    };

    // 5. Gunakan Batch Write untuk operasi atomik
    const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
    const newReplyRef = adminFirestore
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection('replies')
      .doc(); // Buat referensi dokumen baru dengan ID auto-generated

    const batch = adminFirestore.batch();

    // Operasi 1: Buat dokumen balasan baru
    batch.set(newReplyRef, newReplyData);

    // Operasi 2: Tambah counter 'replies' di dokumen Post utama
    batch.update(postRef, {
      replies: FieldValue.increment(1),
    });

    // Jalankan batch
    await batch.commit();

    // 6. Kembalikan data balasan yang baru dibuat (JSON-safe)
    const responseData = {
      id: newReplyRef.id,
      ...newReplyData,
      // Konversi Admin Timestamp ke ISO string agar aman di-parsing oleh client
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