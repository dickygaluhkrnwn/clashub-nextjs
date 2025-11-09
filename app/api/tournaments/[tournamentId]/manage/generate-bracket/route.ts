// File: app/api/tournaments/[tournamentId]/manage/generate-bracket/route.ts
// Deskripsi: [BARU - FASE 5] API route (POST) untuk membuat bracket turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentTeam,
  TournamentMatch,
  FirestoreDocument,
} from '@/lib/clashub.types';
// [PERBAIKAN] Tambahkan 'DocumentReference' ke impor
import { FieldValue, DocumentReference } from 'firebase-admin/firestore';
import { docToDataAdmin, cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';

/**
 * @function shuffleArray
 * @description Helper untuk mengacak array (Fisher-Yates shuffle).
 */
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // Selama masih ada elemen untuk diacak
  while (currentIndex !== 0) {
    // Ambil elemen tersisa
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Tukar dengan elemen saat ini
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

/**
 * @handler POST
 * @description Meng-generate bracket (Ronde 1 Upper) untuk turnamen.
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

    // 2. Ambil Data Turnamen (Pre-check)
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

    // 4. Jalankan Transaksi Atomik
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await adminFirestore.runTransaction(async (t) => {
      // 5. Validasi Data di dalam Transaksi (Penting!)
      const tournamentSnap = await t.get(tournamentRef);
      if (!tournamentSnap.exists) {
        throw new Error('Turnamen tidak ditemukan.');
      }
      const tournamentData = tournamentSnap.data() as Tournament;

      // Cek Status (Harus 'registration_closed')
      if (tournamentData.status !== 'registration_closed') {
        throw new Error(
          `Bracket tidak bisa dibuat. Status turnamen saat ini: ${tournamentData.status}.`,
        );
      }

      // Cek Kuota (Harus Penuh)
      if (
        tournamentData.participantCountCurrent !==
        tournamentData.participantCount
      ) {
        throw new Error(
          `Bracket tidak bisa dibuat. Kuota peserta belum penuh (${tournamentData.participantCountCurrent} / ${tournamentData.participantCount}).`,
        );
      }

      // 6. Ambil Semua Tim 'approved' (di dalam Transaksi)
      const teamsRef = tournamentRef.collection('teams');
      const teamsQuery = teamsRef.where('status', '==', 'approved');
      const teamsSnap = await t.get(teamsQuery);
      
      const approvedTeams: FirestoreDocument<TournamentTeam>[] = [];
      teamsSnap.docs.forEach(doc => {
        const teamData = docToDataAdmin<TournamentTeam>(doc);
        if (teamData) {
          // Penting: Simpan referensi dokumen Firestore-nya
          approvedTeams.push({ ...teamData, id: doc.id });
        }
      });

      // Validasi jumlah tim approved HARUS SAMA dengan kuota
      if (approvedTeams.length !== tournamentData.participantCount) {
        throw new Error(
          `Jumlah tim 'approved' (${approvedTeams.length}) tidak sesuai dengan kuota turnamen (${tournamentData.participantCount}).`,
        );
      }

      // 7. Acak (Shuffle) Tim
      const shuffledTeams = shuffleArray(approvedTeams);

      // 8. Buat Dokumen Match (Ronde 1 Upper Bracket)
      const matchesRef = tournamentRef.collection('matches');
      const matchCountR1 = tournamentData.participantCount / 2;

      for (let i = 0; i < matchCountR1; i++) {
        const matchId = `U-R1-M${i + 1}`; // e.g., U-R1-M1, U-R1-M2, ...
        const matchDocRef = matchesRef.doc(matchId);

        const team1 = shuffledTeams[i * 2];
        const team2 = shuffledTeams[i * 2 + 1];

        // Buat referensi dokumen Firestore
        // [PERBAIKAN] Ganti cast ke 'any' untuk mengatasi mismatch tipe DocRef client/admin
        const team1Ref = teamsRef.doc(team1.id) as any;
        const team2Ref = teamsRef.doc(team2.id) as any;

        const newMatch: Omit<TournamentMatch, 'matchId'> = {
          round: 1,
          bracket: 'upper',
          status: 'pending', // Menunggu jadwal
          team1Ref: team1Ref,
          team2Ref: team2Ref,
          team1ClanTag: null,
          team2ClanTag: null,
          team1ClanBadge: null,
          team2ClanBadge: null,
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,
        };

        // Set dokumen match baru di dalam transaksi
        t.set(matchDocRef, cleanDataForAdminSDK(newMatch));
      }

      // 9. Update Status Turnamen Utama
      t.update(tournamentRef, {
        status: 'ongoing',
      });
    });

    // 10. Sukses
    return NextResponse.json(
      {
        message: 'Bracket Ronde 1 Upper berhasil dibuat! Turnamen dimulai.',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/manage/generate-bracket] Error:`,
      error,
    );
    // Kirim pesan error spesifik dari transaksi
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 400 }, // 400 Bad Request (karena validasi gagal)
    );
  }
}