// File: app/api/posts/route.ts
// Deskripsi: TAHAP 4.3 - API Endpoint (POST) untuk membuat postingan Knowledge Hub.

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { getSessionUser } from '@/lib/server-auth'; // (1) Otentikasi
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // (4) Poin
import { Post } from '@/lib/clashub.types'; // Tipe data
import { PostCategory } from '@/lib/enums';

// [FIX] Buat array runtime dari tipe PostCategory untuk validasi
// Karena PostCategory adalah 'type' (string union), bukan 'enum'.
const VALID_CATEGORIES: PostCategory[] = [
  'Semua Diskusi',
  'Strategi Serangan',
  'Base Building',
  'Manajemen Tim',
  'Berita Komunitas',
  'Diskusi Umum',
];

// Tipe data payload yang diharapkan dari client (PostForm.tsx)
type CreatePostPayload = Omit<
  Post,
  | 'id'
  | 'authorId'
  | 'authorName'
  | 'authorAvatarUrl'
  | 'createdAt'
  | 'updatedAt'
  | 'likes'
  | 'replies'
>;

/**
 * @handler POST
 * @description Membuat postingan baru di Knowledge Hub.
 * Sesuai TAHAP 4.3:
 * 1. Menyimpan post baru ke koleksi COLLECTIONS.POSTS.
 * 2. Memberikan +5 Poin Popularitas ("banana") kepada penulis.
 */
export async function POST(request: Request) {
  // 1. Verifikasi Sesi Pengguna
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse dan Validasi Body Request
    const body = (await request.json()) as CreatePostPayload;

    const {
      title,
      content,
      category,
      tags = [], // Default ke array kosong jika tidak ada
      troopLink = null,
      videoUrl = null,
      baseImageUrl = null,
      baseLinkUrl = null,
      imageUrl = null,
    } = body;

    // Validasi dasar
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Judul, Konten, dan Kategori wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi Kategori
    // [FIX] Ganti validasi dari Object.values(PostCategory) menjadi VALID_CATEGORIES.includes()
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Kategori tidak valid' },
        { status: 400 }
      );
    }

    // 3. Siapkan Data Postingan Baru
    const postsCol = adminFirestore.collection(COLLECTIONS.POSTS);
    const newPostRef = postsCol.doc(); // Buat ID dokumen baru

    const newPostData: Post = {
      id: newPostRef.id,
      title,
      content,
      category,
      tags,
      troopLink,
      videoUrl,
      baseImageUrl,
      baseLinkUrl,
      imageUrl,

      // Data Author (diambil dari sesi)
      authorId: sessionUser.uid,
      authorName: sessionUser.displayName,
      // authorAvatarUrl: sessionUser.avatarUrl || undefined, // (Jika ada di ServerUser)

      // Data internal
      createdAt: new Date(),
      likes: 0,
      replies: 0,
    };

    // 4. Simpan ke Firestore
    await newPostRef.set(newPostData);

    // 5. TAHAP 4.3 - Tambahkan Poin Popularitas (Jalankan secara asinkron)
    // Kita tidak perlu 'await' ini, biarkan berjalan di background
    incrementPopularity(
      sessionUser.uid,
      5,
      `new_post: ${newPostData.title.substring(0, 20)}`
    ).catch((err) => {
      // Log error jika penambahan poin gagal, tapi jangan gagalkan respons utama
      console.error(
        `[POST /api/posts] Gagal menambah poin untuk user ${sessionUser.uid}:`,
        err
      );
    });

    // 6. Kembalikan data postingan yang baru dibuat
    return NextResponse.json(newPostData, { status: 201 });
  } catch (error) {
    console.error('[POST /api/posts] Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}