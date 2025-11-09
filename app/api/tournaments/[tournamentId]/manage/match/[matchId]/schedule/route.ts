// File: app/api/tournaments/[tournamentId]/manage/match/[matchId]/schedule/route.ts
// Deskripsi: [BARU - FASE 5] API route (PUT) untuk mengatur jadwal (scheduledTime)
// untuk sebuah match.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, TournamentMatch } from '@/lib/clashub.types';
import { Timestamp } from 'firebase-admin/firestore'; // Diperlukan untuk konversi Date
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

/**
 * @handler PUT
 * @description Mengatur atau memperbarui scheduledTime untuk satu match.
 * Hanya bisa diakses oleh Panitia (Organizer atau Committee).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { tournamentId: string; matchId: string } }, // <-- Mengambil kedua ID
) {
  const { tournamentId, matchId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Panitia)
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
    // Bisa diakses oleh Organizer ATAU Committee
    const isOrganizer = tournament.organizerUid === sessionUser.uid;
    const isCommittee = tournament.committeeUids.includes(sessionUser.uid);

    if (!isOrganizer && !isCommittee) {
      return NextResponse.json(
        { error: 'Hanya panitia yang dapat melakukan aksi ini.' },
        { status: 403 },
      );
    }

    // 4. Validasi Input Body
    const body = await request.json();
    const { scheduledTime } = body; // Ini akan berupa ISO string dari new Date(schedule)

    if (!scheduledTime) {
      return NextResponse.json(
        { error: 'Waktu jadwal (scheduledTime) diperlukan.' },
        { status: 400 },
      );
    }

    // Konversi string ISO kembali ke objek Date
    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Format waktu jadwal tidak valid.' },
        { status: 400 },
      );
    }

    // 5. Update Dokumen Match
    const matchRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches')
      .doc(matchId);

    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      return NextResponse.json(
        { error: 'Match tidak ditemukan.' },
        { status: 404 },
      );
    }

    const matchData = matchSnap.data() as TournamentMatch;

    // 6. Validasi Status Match
    // Kita hanya bisa mengatur jadwal untuk match yang 'pending'
    if (matchData.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Tidak dapat mengatur jadwal. Status match saat ini adalah "${matchData.status}".`,
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // 7. Lakukan Update
    // Konversi JavaScript Date ke Firestore Timestamp
    await matchRef.update({
      scheduledTime: Timestamp.fromDate(scheduledDate),
      status: 'scheduled', // Ubah status dari 'pending' ke 'scheduled'
    });

    // 8. Sukses
    return NextResponse.json(
      {
        message: `Jadwal untuk match ${matchId} berhasil disimpan!`,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[PUT /api/tournaments/.../schedule] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}