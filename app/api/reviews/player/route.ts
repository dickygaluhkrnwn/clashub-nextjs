// File: app/api/reviews/player/route.ts
// Deskripsi: TAHAP 2.4 - API Endpoint untuk menerima POST ulasan pemain.
// UPDATE:    Sekarang menyertakan validasi Fase 3.2 (Cek ClanHistory bersama).

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { getSessionUser } from '@/lib/server-auth'; // Pola auth server-side
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // Sesuai Roadmap 2.4
import { PlayerReview, FirestoreDocument } from '@/lib/clashub.types';
// [BARU: Fase 3.2] Impor helper untuk validasi riwayat
import {
  getUserProfileAdmin,
  getClanHistoryAdmin,
} from '@/lib/firestore-admin/users';
import { DocumentData } from 'firebase-admin/firestore';

/**
 * @handler POST
 * Menerima kiriman form ulasan baru untuk seorang pemain (User).
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Autentikasi Pengguna (Pola dari server-auth.ts)
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Unauthorized. Anda harus login untuk memberi ulasan.' },
      { status: 401 },
    );
  }

  // [UPDATE: Fase 3.2] Ambil UserProfile lengkap dari author
  const authorProfile = await getUserProfileAdmin(sessionUser.uid);
  if (!authorProfile) {
    return NextResponse.json(
      { error: 'Unauthorized. Profil pengguna Anda tidak ditemukan.' },
      { status: 401 },
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
        { status: 400 },
      );
    }

    if (targetPlayerUid === sessionUser.uid) {
      return NextResponse.json(
        { error: 'Anda tidak dapat memberi ulasan untuk diri sendiri.' },
        { status: 400 },
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus angka antara 1 dan 5.' },
        { status: 400 },
      );
    }

    if (typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Komentar tidak boleh kosong.' },
        { status: 400 },
      );
    }

    if (!['clan', 'esports', 'both'].includes(reviewContext)) {
      return NextResponse.json(
        { error: "reviewContext harus 'clan', 'esports', atau 'both'." },
        { status: 400 },
      );
    }

    // 4. [BARU: Fase 3.2] Validasi Otorisasi (Riwayat Klan Bersama)
    // Cek apakah 'author' dan 'target' pernah berada di klan yang sama.
    // (Kita hanya validasi jika konteksnya 'clan' atau 'both')
    if (reviewContext === 'clan' || reviewContext === 'both') {
      const [authorHistoryDocs, targetHistoryDocs] = await Promise.all([
        getClanHistoryAdmin(authorProfile.uid),
        getClanHistoryAdmin(targetPlayerUid),
      ]);

      // Buat Set berisi semua clanTag yang pernah diikuti author
      const authorClanTags = new Set(
        authorHistoryDocs.map((doc) => doc.clanTag),
      );

      // Cek apakah ada clanTag dari target yang ada di Set milik author
      const hasSharedClan = targetHistoryDocs.some((doc) =>
        authorClanTags.has(doc.clanTag),
      );

      if (!hasSharedClan) {
        return NextResponse.json(
          {
            error:
              'Forbidden: Anda hanya dapat mengulas pemain yang pernah satu klan dengan Anda.',
          },
          { status: 403 },
        );
      }
      // TODO: Validasi 'esports' jika diperlukan
    }

    // 5. Buat objek ulasan baru (Sesuai Tipe PlayerReview)
    const newReviewData: Omit<PlayerReview, 'id'> = {
      authorUid: authorProfile.uid, // UID dari sesi server
      authorName: authorProfile.displayName || 'Clasher Anonim', // Nama dari profil
      targetPlayerUid: targetPlayerUid,
      rating: rating,
      comment: comment.trim(),
      reviewContext: reviewContext,
      createdAt: new Date(), // Timestamp server
    };

    // Tambahkan ID kontekstual jika ada
    if (clanId) newReviewData.clanId = clanId;
    if (esportsTeamId) newReviewData.esportsTeamId = esportsTeamId;

    // 6. Simpan ulasan ke Firestore
    const reviewRef = await adminFirestore
      .collection(COLLECTIONS.PLAYER_REVIEWS)
      .add(newReviewData);

    // 7. TAHAP 2.4 - Integrasi Poin Popularitas (Sesuai Roadmap)
    // Panggil incrementPopularity (10 poin untuk ulasan baru)
    await incrementPopularity(
      authorProfile.uid,
      10,
      `new_player_review:${reviewRef.id}`,
    );

    // 8. Kembalikan respons sukses
    return NextResponse.json(
      { id: reviewRef.id, ...newReviewData },
      { status: 201 }, // 201 Created
    );
  } catch (error) {
    console.error('[API /api/reviews/player POST Error]', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan ulasan ke server.' },
      { status: 500 },
    );
  }
}