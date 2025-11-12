// File: app/api/tournaments/[tournamentId]/manage/start-under-quota/route.ts
// Deskripsi: [BARU: Fase 7.6] API route (POST) untuk memulai turnamen 'under quota'.
// Ini akan membuat bracket power-of-2 terdekat dan menambahkan 'BYE'.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentTeam,
  TournamentMatch,
  FirestoreDocument,
} from '@/lib/clashub.types';
import {
  getTournamentByIdAdmin,
  getParticipantsForTournamentAdmin,
} from '@/lib/firestore-admin/tournaments';
// [PERBAIKAN ERROR] Tambahkan DocumentReference ke impor
import { FieldValue, DocumentReference } from 'firebase-admin/firestore';
import { cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';

// Helper untuk shuffle array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

// Helper untuk mendapatkan power of 2 terdekat
function getNextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 16) return 16;
  if (n <= 32) return 32;
  if (n <= 64) return 64;
  // Jika lebih, kembali ke 64 (batas maks kita)
  return 64;
}

/**
 * @handler POST
 * @description Memulai turnamen 'under quota' (logika Fase 7.6).
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

    // 4. Validasi Status
    if (tournament.status !== 'registration_closed') {
      return NextResponse.json(
        {
          error: `Hanya turnamen yang pendaftarannya ditutup yang bisa dimulai. Status saat ini: ${tournament.status}`,
        },
        { status: 400 },
      );
    }

    // 5. Ambil Tim yang Disetujui
    const allTeams = await getParticipantsForTournamentAdmin(tournamentId);
    const approvedTeams = allTeams.filter((t) => t.status === 'approved');
    const approvedCount = approvedTeams.length;

    if (approvedCount <= 1) {
      return NextResponse.json(
        {
          error: `Tidak bisa memulai turnamen. Minimal harus ada 2 tim yang disetujui.`,
        },
        { status: 400 },
      );
    }

    if (approvedCount === tournament.participantCount) {
      return NextResponse.json(
        {
          error: `Kuota turnamen sudah penuh. Gunakan tombol 'Generate Bracket' biasa.`,
        },
        { status: 400 },
      );
    }

    // =================================================================
    // LOGIKA INTI: GENERATE BRACKET DENGAN "BYE" (Fase 7.6)
    // =================================================================

    const bracketSize = getNextPowerOfTwo(approvedCount);
    const byeCount = bracketSize - approvedCount;

    // Buat referensi dokumen untuk tim yang disetujui
    const teamRefs: (DocumentReference | null)[] = approvedTeams.map((team) =>
      adminFirestore.doc(`tournaments/${tournamentId}/teams/${team.id}`),
    );

    // Tambahkan 'null' untuk BYE
    for (let i = 0; i < byeCount; i++) {
      teamRefs.push(null);
    }

    // Acak tim (termasuk BYE)
    const shuffledTeamRefs = shuffleArray(teamRefs);

    const batch = adminFirestore.batch();
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);
    const matchesRef = tournamentRef.collection('matches');

    const round1Matches: TournamentMatch[] = [];

    // 6. Buat Match Ronde 1 (Upper)
    for (let i = 0; i < bracketSize; i += 2) {
      const team1Ref = shuffledTeamRefs[i];
      const team2Ref = shuffledTeamRefs[i + 1];

      const matchId = `U-R1-M${i / 2 + 1}`;
      const newMatch: Omit<TournamentMatch, 'matchId'> = {
        round: 1,
        bracket: 'upper',
        status: 'pending', // Status awal
        team1Ref: team1Ref as DocumentReference<TournamentTeam> | null,
        team2Ref: team2Ref as DocumentReference<TournamentTeam> | null,
        team1ClanTag: null,
        team2ClanTag: null,
        team1ClanBadge: null,
        team2ClanBadge: null,
        winnerTeamRef: null,
        scheduledTime: null,
        liveWarData: null,
      };

      round1Matches.push({ ...newMatch, matchId });
    }

    // 7. Buat Placeholder Ronde Selanjutnya (Upper & Lower)
    const totalRounds = Math.log2(bracketSize);
    const lowerBracketRounds = (totalRounds - 1) * 2;
    const allMatchesToCreate = [...round1Matches]; // Mulai dengan ronde 1

    // Buat placeholder Upper Bracket (mulai dari Ronde 2)
    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r);
      for (let m = 1; m <= matchesInRound; m++) {
        const matchId = `U-R${r}-M${m}`;
        allMatchesToCreate.push({
          matchId,
          round: r,
          bracket: 'upper',
          status: 'pending',
          team1Ref: null,
          team2Ref: null,
          team1ClanTag: null,
          team2ClanTag: null,
          team1ClanBadge: null,
          team2ClanBadge: null,
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,
        });
      }
    }
    // Buat placeholder Lower Bracket
    for (let r = 1; r <= lowerBracketRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, Math.ceil(r / 2) + 1);
      for (let m = 1; m <= matchesInRound; m++) {
        const matchId = `L-R${r}-M${m}`;
        allMatchesToCreate.push({
          matchId,
          round: r,
          bracket: 'lower',
          status: 'pending',
          team1Ref: null,
          team2Ref: null,
          team1ClanTag: null,
          team2ClanTag: null,
          team1ClanBadge: null,
          team2ClanBadge: null,
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,
        });
      }
    }

    // 8. Logika Auto-Advance "BYE"
    // Cek Ronde 1 dan majukan pemenang BYE ke Ronde 2
    round1Matches.forEach((match) => {
      const { team1Ref, team2Ref, matchId } = match;
      let winnerRef: DocumentReference<TournamentTeam> | null = null;

      if (team1Ref !== null && team2Ref === null) {
        // Tim 1 vs BYE
        winnerRef = team1Ref;
      } else if (team1Ref === null && team2Ref !== null) {
        // BYE vs Tim 2
        winnerRef = team2Ref;
      }

      if (winnerRef) {
        // Tandai match ronde 1 sebagai selesai
        match.status = 'completed';
        match.winnerTeamRef = winnerRef;

        // Cari match ronde 2 yang sesuai
        const matchIndex = parseInt(matchId.split('M')[1]) - 1; // 0-based index
        const nextRoundMatchIndex = Math.floor(matchIndex / 2) + 1;
        const nextMatchId = `U-R2-M${nextRoundMatchIndex}`;

        const nextMatch = allMatchesToCreate.find(
          (m) => m.matchId === nextMatchId,
        );
        if (nextMatch) {
          // Masukkan pemenang ke slot yang benar (slot 1 jika index genap, slot 2 jika ganjil)
          if (matchIndex % 2 === 0) {
            nextMatch.team1Ref = winnerRef;
          } else {
            nextMatch.team2Ref = winnerRef;
          }
        }
      }
    });

    // 9. Simpan Semua Match ke Batch
    allMatchesToCreate.forEach((match) => {
      const docRef = matchesRef.doc(match.matchId);
      batch.set(docRef, cleanDataForAdminSDK(match));
    });

    // 10. Update Dokumen Turnamen Utama
    batch.update(tournamentRef, {
      status: 'ongoing',
      participantCount: bracketSize, // Update kuota agar sesuai ukuran bracket
    });

    // 11. Commit Transaksi
    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        message: `Turnamen berhasil dimulai dengan ${approvedCount} tim (Bracket ${bracketSize}). BYE otomatis dimajukan.`,
        newStatus: 'ongoing',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(`[POST /.../manage/start-under-quota] Error:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}