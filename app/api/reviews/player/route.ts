// File: app/api/reviews/player/route.ts
// Deskripsi: TAHAP 2.4 - API Endpoint untuk menerima POST ulasan pemain.

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { getSessionUser } from '@/lib/server-auth'; // Pola auth server-side
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // Sesuai Roadmap 2.4
import { PlayerReview } from '@/lib/clashub.types';

/**
 * @handler POST
 * Menerima kiriman form ulasan baru untuk seorang pemain (User).
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Autentikasi Pengguna (Pola dari server-auth.ts)
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
      targetPlayerUid, // UID UserProfile yang diulas
      rating,
      comment,
      reviewContext, // 'clan' atau 'esports' (atau 'both' - 'both' belum ada di form)
      clanId, // Opsional: ID ManagedClan (konteks 'clan')
      esportsTeamId, // Opsional: ID Tim E-Sports (konteks 'esports')
    } = body;

    // 3. Validasi Data Input
    if (
      !targetPlayerUid ||
      !rating ||
      !comment ||
      !reviewContext
    ) {
      return NextResponse.json(
        {
          error:
            'Data tidak lengkap. (targetPlayerUid, rating, comment, dan reviewContext diperlukan).',
        },
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

    if (!['clan', 'esports', 'both'].includes(reviewContext)) {
      return NextResponse.json(
        { error: "reviewContext harus 'clan', 'esports', atau 'both'." },
        { status: 400 }
      );
    }

    // 4. Buat objek ulasan baru (Sesuai Tipe PlayerReview)
    const newReviewData: Omit<PlayerReview, 'id'> = {
      authorUid: user.uid, // UID dari sesi server
      authorName: user.displayName || 'Clasher Anonim', // Nama dari sesi server
      targetPlayerUid: targetPlayerUid,
      rating: rating,
      comment: comment.trim(),
      reviewContext: reviewContext,
      createdAt: new Date(), // Timestamp server
    };

    // Tambahkan ID kontekstual jika ada
    if (clanId) newReviewData.clanId = clanId;
    if (esportsTeamId) newReviewData.esportsTeamId = esportsTeamId;

    // 5. Simpan ulasan ke Firestore
    const reviewRef = await adminFirestore
      .collection(COLLECTIONS.PLAYER_REVIEWS)
      .add(newReviewData);

    // 6. TAHAP 2.4 - Integrasi Poin Popularitas (Sesuai Roadmap)
    // Panggil incrementPopularity (10 poin untuk ulasan baru)
    await incrementPopularity(
      user.uid,
      10,
      `new_player_review:${reviewRef.id}`
    );

    // 7. Kembalikan respons sukses
    return NextResponse.json(
      { id: reviewRef.id, ...newReviewData },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    console.error('[API /api/reviews/player POST Error]', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan ulasan ke server.' },
      { status: 500 }
    );
  }
}