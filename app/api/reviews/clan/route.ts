// File: app/api/reviews/clan/route.ts
// Deskripsi: TAHAP 2.4 - API Endpoint untuk menerima POST ulasan klan.
// UPDATE:    Sekarang menyertakan validasi Fase 3.2 (Cek ClanHistory).

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { getSessionUser } from '@/lib/server-auth'; // Pola auth server-side
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // Sesuai Roadmap 2.4
import { ClanReview, UserProfile } from '@/lib/clashub.types';
// [BARU: Fase 3.2] Impor helper untuk validasi
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';

/**
 * @handler POST
 * Menerima kiriman form ulasan baru untuk klan (ManagedClan).
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Autentikasi Pengguna (Pola dari server-auth.ts)
  // Kita tidak percaya UID dari body, kita ambil dari sesi server.
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Unauthorized. Anda harus login untuk memberi ulasan.' },
      { status: 401 },
    );
  }

  // [UPDATE: Fase 3.2] Ambil UserProfile lengkap untuk data tambahan
  const userProfile = await getUserProfileAdmin(sessionUser.uid);
  if (!userProfile) {
    return NextResponse.json(
      { error: 'Unauthorized. Profil pengguna tidak ditemukan.' },
      { status: 401 },
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
        {
          error:
            'Data tidak lengkap. (targetClanId, rating, dan comment diperlukan).',
        },
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

    // 4. [BARU: Fase 3.2] Validasi Otorisasi
    // Cek apakah user ini adalah mantan anggota dari klan tersebut.
    // Pertama, dapatkan clanTag dari clanId
    const managedClan = await getManagedClanDataAdmin(targetClanId);
    if (!managedClan || !managedClan.tag) {
      return NextResponse.json(
        { error: 'Klan yang dituju tidak ditemukan.' },
        { status: 404 },
      );
    }
    const clanTag = managedClan.tag;

    // Kedua, cek riwayat klan user
    const historyRef = adminFirestore
      .collection(COLLECTIONS.USERS)
      .doc(userProfile.uid)
      .collection(COLLECTIONS.CLAN_HISTORY)
      .doc(clanTag); // Targetkan dokumen riwayat klan spesifik

    const historySnap = await historyRef.get();

    if (!historySnap.exists || !historySnap.data()?.hasLeft) {
      // Jika dokumen tidak ada, ATAU ada tapi 'hasLeft' false
      return NextResponse.json(
        {
          error:
            'Forbidden: Hanya mantan anggota yang dapat mengulas klan ini.',
        },
        { status: 403 },
      );
    }
    
    // [OPSIONAL] TODO: Cek apakah user sudah pernah submit ulasan untuk klan ini
    // (Bisa ditambahkan query `CLAN_REVIEWS` di sini jika kita ingin 1 ulasan per user)

    // 5. Buat objek ulasan baru (Sesuai Tipe ClanReview)
    const newReviewData: Omit<ClanReview, 'id'> = {
      authorUid: userProfile.uid, // UID dari sesi server
      authorName: userProfile.displayName || 'Clasher Anonim', // Nama dari profil
      targetClanId: targetClanId,
      rating: rating,
      comment: comment.trim(),
      createdAt: new Date(), // Timestamp server
    };

    // 6. Simpan ulasan ke Firestore
    const reviewRef = await adminFirestore
      .collection(COLLECTIONS.CLAN_REVIEWS)
      .add(newReviewData);

    // 7. TAHAP 2.4 - Integrasi Poin Popularitas (Sesuai Roadmap)
    // Panggil incrementPopularity (10 poin untuk ulasan baru)
    await incrementPopularity(
      userProfile.uid,
      10,
      `new_clan_review:${reviewRef.id}`,
    );

    // 8. Kembalikan respons sukses
    return NextResponse.json(
      { id: reviewRef.id, ...newReviewData },
      { status: 201 }, // 201 Created
    );
  } catch (error) {
    console.error('[API /api/reviews/clan POST Error]', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan ulasan ke server.' },
      { status: 500 },
    );
  }
}