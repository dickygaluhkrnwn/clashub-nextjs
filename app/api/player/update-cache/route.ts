// File: app/api/player/update-cache/route.ts
// Deskripsi: [PERBAIKAN BUG FASE 4.3] API route untuk client mem-push
// data cache CocPlayer (heroes, troops, dll) ke Firestore.
// LOGIC FIX: Update data pemilik tag, BUKAN user yang sedang login.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // Helper otentikasi
// [PERBAIKAN] Impor getUserProfileByPlayerTagAdmin untuk mencari pemilik tag
import { updatePlayerCacheAdmin, getUserProfileByPlayerTagAdmin } from '@/lib/firestore-admin/users'; 
import { CocPlayer } from '@/lib/types'; // Tipe data

/**
 * @api {post} /api/player/update-cache
 * @description Menerima data CocPlayer lengkap dari client dan
 * menyimpannya ke UserProfile di Firestore untuk caching.
 * Membutuhkan otentikasi (cookie session-token).
 */
export async function POST(request: Request) {
  try {
    // 1. Otentikasi: Pastikan pengguna sudah login (untuk mencegah spammer anonim)
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Otentikasi diperlukan.' },
        { status: 401 }, // 401 Unauthorized
      );
    }

    // const { uid } = sessionUser; // [HAPUS] Jangan gunakan UID login sebagai target update

    // 2. Baca data player dari body permintaan
    const playerData: CocPlayer = await request.json();

    if (!playerData || !playerData.tag) {
      return NextResponse.json(
        { error: 'Data player tidak valid.' },
        { status: 400 }, // 400 Bad Request
      );
    }

    // [PERBAIKAN KRITIS]
    // Cari UserProfile yang memiliki tag ini di database.
    // Kita tidak boleh mengasumsikan user yang login adalah pemilik data yang dikirim.
    // Tag dari API CoC biasanya raw (misal #ABC), pastikan formatnya sesuai dengan di DB.
    const userProfileSnap = await getUserProfileByPlayerTagAdmin(playerData.tag);

    if (!userProfileSnap) {
        // Jika tidak ada user di database dengan tag ini, kita tidak perlu update cache 
        // (karena cache UserProfile hanya untuk user yang terdaftar di Clashub).
        // Kita return success: true agar client tidak retry atau error, tapi beri info di message.
        return NextResponse.json({
            success: true, 
            message: 'User dengan tag tersebut tidak ditemukan di database. Cache diabaikan.',
        });
    }

    // 3. Panggil fungsi Admin SDK untuk menyimpan ke Firestore
    // Gunakan UID (id) dari userProfileSnap yang ditemukan, BUKAN sessionUser
    await updatePlayerCacheAdmin(userProfileSnap.id, playerData);

    // 4. Kirim respons sukses
    return NextResponse.json({
      success: true,
      message: `Cache player untuk ${playerData.name} (${userProfileSnap.id}) berhasil diperbarui.`,
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