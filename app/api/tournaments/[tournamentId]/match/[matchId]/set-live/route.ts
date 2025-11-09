// File: app/api/tournaments/[tournamentId]/match/[matchId]/set-live/route.ts
// Deskripsi: [BARU - FASE 6 (Tambahan)] API route (POST) untuk client
// melaporkan bahwa match telah 'live' dan menyimpan data war.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { TournamentMatch, CocCurrentWar } from '@/lib/types';
import { cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';

/**
 * @handler POST
 * @description Meng-update status match menjadi 'live' dan menyimpan 'liveWarData'.
 * Ini dipanggil oleh client (LiveWarTracker) HANYA SEKALI saat
 * war yang valid pertama kali ditemukan.
 * Payload: { liveWarData: CocCurrentWar }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string; matchId: string } },
) {
  const { tournamentId, matchId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Cukup login, tidak harus panitia)
    // Ini untuk mencegah panggilan API anonim,
    // karena polling dilakukan oleh client yang sudah login.
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi.' },
        { status: 401 },
      );
    }

    // 2. Validasi Payload Body
    let payload: { liveWarData: CocCurrentWar };
    try {
      payload = await request.json();
      if (!payload.liveWarData || !payload.liveWarData.clan) {
        throw new Error('Payload tidak valid: Wajib ada liveWarData');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Payload tidak valid.' },
        { status: 400 },
      );
    }

    // 3. Ambil Referensi Match
    const matchRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches')
      .doc(matchId);

    // 4. Update Dokumen Match
    // Kita tidak perlu transaksi di sini, cukup update sederhana.
    // Kita gunakan cleanDataForAdminSDK untuk jaga-jaga jika ada
    // field 'undefined' di dalam objek liveWarData.
    await matchRef.update({
      status: 'live',
      liveWarData: cleanDataForAdminSDK(payload.liveWarData),
    });

    // 5. Sukses
    return NextResponse.json(
      { success: true, message: `Match ${matchId} sekarang live.` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(`[POST /api/tournaments/.../set-live] Error:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    );
  }
}