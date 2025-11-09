// File: app/api/tournaments/[tournamentId]/manage/remove/route.ts
// Deskripsi: [BARU - FASE 5] API route (POST) untuk mengeluarkan panitia (committee).

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { FieldValue } from 'firebase-admin/firestore';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';

/**
 * @handler POST
 * @description Mengeluarkan seorang user dari daftar panitia (committee).
 * Hanya bisa dilakukan oleh Organizer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Panitia yang Mengeluarkan)
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi.' },
        { status: 401 },
      );
    }

    // 2. Ambil Data Turnamen
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 3. Validasi Keamanan (ROADMAP FASE 5)
    // Hanya ORGANIZER yang bisa mengeluarkan panitia.
    if (tournament.organizerUid !== sessionUser.uid) {
      return NextResponse.json(
        { error: 'Hanya organizer yang dapat mengeluarkan panitia.' },
        { status: 403 }, // 403 Forbidden
      );
    }

    // 4. Validasi Input Body
    const body = await request.json();
    const { uidToRemove } = body;

    if (!uidToRemove || typeof uidToRemove !== 'string') {
      return NextResponse.json(
        { error: 'UID user yang akan dikeluarkan diperlukan.' },
        { status: 400 },
      );
    }

    // 5. Cek Keamanan Tambahan
    // Organizer tidak bisa mengeluarkan dirinya sendiri.
    if (tournament.organizerUid === uidToRemove) {
      return NextResponse.json(
        { error: 'Organizer tidak dapat mengeluarkan dirinya sendiri.' },
        { status: 400 },
      );
    }

    // Cek apakah UID tersebut memang ada di committeeUids
    if (!tournament.committeeUids.includes(uidToRemove)) {
      return NextResponse.json(
        { error: 'User tersebut tidak ada di dalam daftar panitia.' },
        { status: 404 }, // 404 Not Found
      );
    }

    // 6. Update Dokumen Turnamen (Hapus dari array committeeUids)
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await tournamentRef.update({
      committeeUids: FieldValue.arrayRemove(uidToRemove),
    });

    // 7. Sukses (Ambil nama user untuk pesan yang lebih baik)
    const removedUser = await getUserProfileAdmin(uidToRemove);
    const userName = removedUser?.displayName || 'User';

    return NextResponse.json(
      {
        message: `Berhasil mengeluarkan "${userName}" dari panitia.`,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/manage/remove] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}