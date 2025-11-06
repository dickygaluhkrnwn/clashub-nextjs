// File: app/api/reviews/clan/route.ts
// Deskripsi: TAHAP 2.4 - API Endpoint untuk menerima POST ulasan klan.

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { getSessionUser } from '@/lib/server-auth'; // Pola auth server-side
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // Sesuai Roadmap 2.4
import { ClanReview } from '@/lib/clashub.types';

/**
 * @handler POST
 * Menerima kiriman form ulasan baru untuk klan (ManagedClan).
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Autentikasi Pengguna (Pola dari server-auth.ts)
  // Kita tidak percaya UID dari body, kita ambil dari sesi server.
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Anda harus login untuk memberi ulasan.' },
      { status: 401 }
    );
  }

  try {
    // 2. Parse body dari request
    const body = await request.json();
    const {
      targetClanId, // ID ManagedClan yang diulas
      rating,
      comment,
      // 'authorUid' dan 'authorName' dari body akan kita abaikan
      // dan gunakan data dari 'user' sesi server untuk keamanan.
    } = body;

    // 3. Validasi Data Input
    if (!targetClanId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. (targetClanId, rating, dan comment diperlukan).' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus angka antara 1 dan 5.' },
        { status: 400 }
      );
    }

    if (typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Komentar tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // 4. Buat objek ulasan baru (Sesuai Tipe ClanReview)
    const newReviewData: Omit<ClanReview, 'id'> = {
      authorUid: user.uid, // UID dari sesi server
      authorName: user.displayName || 'Clasher Anonim', // Nama dari sesi server
      targetClanId: targetClanId,
      rating: rating,
      comment: comment.trim(),
      createdAt: new Date(), // Timestamp server
    };

    // 5. Simpan ulasan ke Firestore
    const reviewRef = await adminFirestore
      .collection(COLLECTIONS.CLAN_REVIEWS)
      .add(newReviewData);

    // 6. TAHAP 2.4 - Integrasi Poin Popularitas (Sesuai Roadmap)
    // Panggil incrementPopularity (10 poin untuk ulasan baru)
    await incrementPopularity(
      user.uid,
      10,
      `new_clan_review:${reviewRef.id}`
    );

    // 7. Kembalikan respons sukses
    return NextResponse.json(
      { id: reviewRef.id, ...newReviewData },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    console.error('[API /api/reviews/clan POST Error]', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan ulasan ke server.' },
      { status: 500 }
    );
  }
}