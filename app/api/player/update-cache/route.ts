// File: app/api/player/update-cache/route.ts
// Deskripsi: [BARU FASE 4.3] API route untuk client mem-push
// data cache CocPlayer (heroes, troops, dll) ke Firestore.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // Helper otentikasi
import { updatePlayerCacheAdmin } from '@/lib/firestore-admin/users'; // Fungsi Admin
import { CocPlayer } from '@/lib/types'; // Tipe data

/**
 * @api {post} /api/player/update-cache
 * @description Menerima data CocPlayer lengkap dari client dan
 * menyimpannya ke UserProfile di Firestore untuk caching.
 * Membutuhkan otentikasi (cookie session-token).
 */
export async function POST(request: Request) {
  try {
    // 1. Otentikasi: Pastikan pengguna sudah login
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Otentikasi diperlukan.' },
        { status: 401 }, // 401 Unauthorized
      );
    }

    const { uid } = sessionUser;

    // 2. Baca data player dari body permintaan
    const playerData: CocPlayer = await request.json();

    if (!playerData || !playerData.tag) {
      return NextResponse.json(
        { error: 'Data player tidak valid.' },
        { status: 400 }, // 400 Bad Request
      );
    }

    // 3. Panggil fungsi Admin SDK untuk menyimpan ke Firestore
    // Kita gunakan UID dari sesi (AMAN) dan data dari body
    await updatePlayerCacheAdmin(uid, playerData);

    // 4. Kirim respons sukses
    return NextResponse.json({
      success: true,
      message: 'Cache player berhasil diperbarui.',
    });
  } catch (error) {
    console.error('[API /update-cache] Gagal memperbarui cache:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }, // 500 Internal Server Error
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan tidak diketahui di server.' },
      { status: 500 },
    );
  }
}