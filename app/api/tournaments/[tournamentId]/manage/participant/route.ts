// File: app/api/tournaments/[tournamentId]/manage/participant/route.ts
// Deskripsi: [BARU - FASE 5] API route (POST) untuk approve/reject tim peserta.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, TournamentTeam } from '@/lib/clashub.types';
import { FieldValue } from 'firebase-admin/firestore';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

/**
 * @handler POST
 * @description Menyetujui (approve) atau menolak (reject) tim peserta.
 * Hanya bisa dilakukan oleh Panitia (Organizer atau Committee).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

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
        { status: 403 }, // 403 Forbidden
      );
    }

    // 4. Validasi Input Body
    const body = await request.json();
    const { teamId, newStatus } = body;

    if (!teamId || !newStatus) {
      return NextResponse.json(
        { error: 'Team ID dan status baru diperlukan.' },
        { status: 400 },
      );
    }

    if (newStatus !== 'approved' && newStatus !== 'rejected') {
      return NextResponse.json(
        { error: 'Status baru tidak valid.' },
        { status: 400 },
      );
    }

    // 5. Jalankan Transaksi Atomik
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);
    const teamRef = tournamentRef.collection('teams').doc(teamId);

    const resultMessage = await adminFirestore.runTransaction(
      async (t): Promise<string> => {
        // Ambil data terbaru di dalam transaksi
        const tournamentSnap = await t.get(tournamentRef);
        const teamSnap = await t.get(teamRef);

        if (!tournamentSnap.exists) {
          throw new Error('Turnamen tidak ditemukan.');
        }
        if (!teamSnap.exists) {
          throw new Error('Tim peserta tidak ditemukan.');
        }

        const tournamentData = tournamentSnap.data() as Tournament;
        const teamData = teamSnap.data() as TournamentTeam;
        const currentStatus = teamData.status;

        // Jika status sudah sama, tidak perlu update
        if (currentStatus === newStatus) {
          return `Tim "${teamData.teamName}" sudah berstatus "${newStatus}".`;
        }

        let message = '';

        // --- Logika Update ---

        if (newStatus === 'approved') {
          // CEK 5 (Kuota) saat approve
          if (
            tournamentData.participantCountCurrent >=
            tournamentData.participantCount
          ) {
            throw new Error('Kuota turnamen sudah penuh.');
          }

          // Update status tim
          t.update(teamRef, { status: 'approved' });
          message = `Tim "${teamData.teamName}" berhasil disetujui.`;

          // Jika sebelumnya 'pending' atau 'rejected', tambah counter
          if (currentStatus === 'pending' || currentStatus === 'rejected') {
            t.update(tournamentRef, {
              participantCountCurrent: FieldValue.increment(1),
            });
          }
        } else if (newStatus === 'rejected') {
          // Update status tim
          t.update(teamRef, { status: 'rejected' });
          message = `Tim "${teamData.teamName}" berhasil ditolak.`;

          // Jika sebelumnya 'approved', kurangi counter
          if (currentStatus === 'approved') {
            t.update(tournamentRef, {
              participantCountCurrent: FieldValue.increment(-1),
            });
          }
        }

        return message;
      },
    );

    // 6. Sukses
    return NextResponse.json(
      {
        message: resultMessage,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/manage/participant] Error:`,
      error,
    );
    // Kirim pesan error spesifik dari transaksi (cth: "Kuota penuh")
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}