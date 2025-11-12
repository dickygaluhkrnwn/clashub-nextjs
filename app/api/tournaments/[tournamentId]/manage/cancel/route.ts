// File: app/api/tournaments/[tournamentId]/manage/cancel/route.ts
// Deskripsi: [BARU: Fase 7.6] API route (POST) untuk membatalkan turnamen.
// Ini dipanggil oleh panitia jika pendaftaran ditutup (under quota) dan
// mereka memilih untuk membatalkan turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament } from '@/lib/clashub.types';
import {
  getTournamentByIdAdmin,
  getParticipantsForTournamentAdmin, // Untuk notifikasi
} from '@/lib/firestore-admin/tournaments';
import { createNotification } from '@/lib/firestore-admin/notifications';

/**
 * @handler POST
 * @description Mengubah status turnamen menjadi 'cancelled'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Panitia
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil Data Turnamen
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 3. Cek Otorisasi Panitia
    const isOrganizer = tournament.organizerUid === sessionUser.uid;
    const isCommittee = tournament.committeeUids.includes(sessionUser.uid);
    if (!isOrganizer && !isCommittee) {
      return NextResponse.json(
        { error: 'Forbidden: Anda bukan panitia turnamen ini.' },
        { status: 403 },
      );
    }

    // 4. Validasi Status (Hanya bisa cancel jika pendaftaran ditutup)
    if (tournament.status !== 'registration_closed') {
      return NextResponse.json(
        {
          error: `Hanya turnamen yang pendaftarannya ditutup yang bisa dibatalkan. Status saat ini: ${tournament.status}`,
        },
        { status: 400 },
      );
    }

    // 5. Update Status Turnamen
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await tournamentRef.update({
      status: 'cancelled',
    });

    // 6. [Opsional] Kirim Notifikasi ke Peserta yang Sudah Mendaftar
    try {
      const participants = await getParticipantsForTournamentAdmin(tournamentId);
      const leaderUids = participants.map((team) => team.leaderUid);
      const uniqueLeaderUids = Array.from(new Set(leaderUids));

      const message = `Turnamen "${tournament.title}" telah dibatalkan oleh panitia.`;
      const url = `/tournament/${tournamentId}`;

      const notificationPromises = uniqueLeaderUids.map((uid) =>
        createNotification(uid, message, url, 'generic'),
      );
      
      // Kirim notifikasi tanpa menunggu selesai
      Promise.all(notificationPromises).then(() => {
        console.log(`[Cancel] Notifikasi pembatalan dikirim ke ${uniqueLeaderUids.length} leader tim.`);
      }).catch(notifError => {
        console.error(`[Cancel Error] Gagal kirim notifikasi pembatalan:`, notifError);
      });

    } catch (notifError) {
      console.error('[Cancel Error] Gagal mengambil peserta untuk notifikasi:', notifError);
    }

    // 7. Sukses
    return NextResponse.json(
      {
        success: true,
        message: 'Turnamen berhasil dibatalkan.',
        newStatus: 'cancelled',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /.../manage/cancel] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}