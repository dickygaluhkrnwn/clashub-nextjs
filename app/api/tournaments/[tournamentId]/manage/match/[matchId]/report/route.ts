// File: app/api/tournaments/[tournamentId]/manage/match/[matchId]/report/route.ts
// Deskripsi: [BARU - FASE 6] API route (POST) untuk panitia melaporkan pemenang
// dan memajukan tim di bracket.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore, admin } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentMatch,
  TournamentTeam,
} from '@/lib/types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { DocumentReference } from 'firebase-admin/firestore';

type TeamReference = DocumentReference<TournamentTeam> | null;
type MatchUpdate = { ref: DocumentReference; slot: 'team1Ref' | 'team2Ref' } | null;

/**
 * @function getNextMatchUpdates
 * @description Menghitung match selanjutnya untuk pemenang dan yang kalah
 * berdasarkan logika bracket Double Elimination.
 */
function getNextMatchUpdates(
  currentMatch: TournamentMatch,
  participantCount: number,
  winnerRef: TeamReference,
  loserRef: TeamReference,
  tournamentId: string,
): { winnerUpdate: MatchUpdate; loserUpdate: MatchUpdate } {
  const { matchId } = currentMatch;
  const [bracket, roundStr, matchStr] = matchId.split('-');
  const round = parseInt(roundStr.slice(1));
  const matchNum = parseInt(matchStr.slice(1));

  // Referensi dasar koleksi 'matches'
  const matchesCol = adminFirestore
    .collection(COLLECTIONS.TOURNAMENTS)
    .doc(tournamentId)
    .collection('matches');

  // Hitung total ronde
  const totalUbRounds = Math.log2(participantCount);
  const totalLbRounds = (totalUbRounds - 1) * 2;

  let winnerUpdate: MatchUpdate = null;
  let loserUpdate: MatchUpdate = null;

  if (bracket === 'U') {
    // --- WINNER (UPPER BRACKET) ---
    if (round < totalUbRounds) {
      // Pemenang maju ke ronde Upper Bracket selanjutnya
      const nextWinnerRound = round + 1;
      const nextWinnerMatchNum = Math.ceil(matchNum / 2);
      const nextWinnerSlot = (matchNum % 2 === 1) ? 'team1Ref' : 'team2Ref';
      winnerUpdate = {
        ref: matchesCol.doc(`U-R${nextWinnerRound}-M${nextWinnerMatchNum}`),
        slot: nextWinnerSlot,
      };
    } else if (round === totalUbRounds) {
      // Pemenang UB Final maju ke Grand Final (slot 1)
      winnerUpdate = {
        ref: matchesCol.doc('GF-R1-M1'),
        slot: 'team1Ref',
      };
    }

    // --- LOSER (UPPER BRACKET) ---
    if (loserRef) { // (Jika bukan BYE)
      if (round === 1) {
        // Loser Ronde 1 UB jatuh ke Ronde 1 LB
        const nextLoserRound = 1;
        const nextLoserMatchNum = Math.ceil(matchNum / 2);
        const nextLoserSlot = (matchNum % 2 === 1) ? 'team1Ref' : 'team2Ref';
        loserUpdate = {
          ref: matchesCol.doc(`L-R${nextLoserRound}-M${nextLoserMatchNum}`),
          slot: nextLoserSlot,
        };
      } else if (round > 1 && round < totalUbRounds) {
        // Loser Ronde 2+ UB jatuh ke ronde ganjil LB
        const nextLoserRound = (round * 2) - 1;
        const nextLoserMatchNum = matchNum;
        loserUpdate = {
          ref: matchesCol.doc(`L-R${nextLoserRound}-M${nextLoserMatchNum}`),
          slot: 'team2Ref', // Selalu masuk slot 2 (vs pemenang LB)
        };
      } else if (round === totalUbRounds) {
        // Loser UB Final jatuh ke LB Final (slot 2)
        loserUpdate = {
          ref: matchesCol.doc(`L-R${totalLbRounds}-M1`),
          slot: 'team2Ref',
        };
      }
    }
  } else if (bracket === 'L') {
    // --- WINNER (LOWER BRACKET) ---
    if (round < totalLbRounds) {
      let nextWinnerRound: number;
      let nextWinnerMatchNum: number;
      let nextWinnerSlot: 'team1Ref' | 'team2Ref';

      if (round % 2 === 1) {
        // Ronde Ganjil (L-R1, L-R3, L-R5, ...) -> Pemenang maju ke ronde genap
        nextWinnerRound = round + 1;
        nextWinnerMatchNum = matchNum;
        nextWinnerSlot = 'team1Ref'; // Selalu masuk slot 1 (vs loser UB)
      } else {
        // Ronde Genap (L-R2, L-R4, ...) -> Pemenang maju ke ronde ganjil
        nextWinnerRound = round + 1;
        nextWinnerMatchNum = Math.ceil(matchNum / 2);
        nextWinnerSlot = (matchNum % 2 === 1) ? 'team1Ref' : 'team2Ref';
      }
      winnerUpdate = {
        ref: matchesCol.doc(`L-R${nextWinnerRound}-M${nextWinnerMatchNum}`),
        slot: nextWinnerSlot,
      };
    } else if (round === totalLbRounds) {
      // Pemenang LB Final maju ke Grand Final (slot 2)
      winnerUpdate = {
        ref: matchesCol.doc('GF-R1-M1'),
        slot: 'team2Ref',
      };
    }

    // --- LOSER (LOWER BRACKET) ---
    // Tim yang kalah di Lower Bracket tereliminasi
    loserUpdate = null;
  }
  // Jika bracket === 'GF' (Grand Final), pemenang adalah juara, tidak ada match lanjutan.

  return { winnerUpdate, loserUpdate };
}

/**
 * @handler POST
 * @description Melaporkan pemenang match (Hanya Panitia).
 * Payload: { winnerTeamId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string; matchId: string } },
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

    // 2. Validasi Payload
    let payload: { winnerTeamId: string };
    try {
      payload = await request.json();
      if (!payload.winnerTeamId) {
        throw new Error('Payload tidak valid.');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Payload tidak valid: Wajib ada winnerTeamId' },
        { status: 400 },
      );
    }
    const { winnerTeamId } = payload;

    // 3. Ambil Data Turnamen (Untuk Validasi Panitia & Info Bracket)
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 4. Validasi Keamanan (Hanya Panitia)
    const isOrganizer = tournament.organizerUid === sessionUser.uid;
    const isCommittee = tournament.committeeUids.includes(sessionUser.uid);
    if (!isOrganizer && !isCommittee) {
      return NextResponse.json(
        { error: 'Hanya panitia yang dapat melakukan aksi ini.' },
        { status: 403 },
      );
    }

    // 5. Jalankan Transaksi Atomik
    await adminFirestore.runTransaction(async (t) => {
      const matchRef = adminFirestore
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection('matches')
        .doc(matchId);

      const matchSnap = await t.get(matchRef);
      if (!matchSnap.exists) {
        throw new Error('Match tidak ditemukan.');
      }
      const matchData = matchSnap.data() as TournamentMatch;

      // Cek apakah match sudah selesai
      if (matchData.status === 'completed') {
        // Tidak perlu error, anggap idempotent
        console.warn(`[Report] Match ${matchId} sudah dilaporkan.`);
        return;
      }

      // Validasi winnerTeamId
      const team1Ref = matchData.team1Ref as TeamReference;
      const team2Ref = matchData.team2Ref as TeamReference;

      let winnerRef: TeamReference = null;
      let loserRef: TeamReference = null;

      if (team1Ref && team1Ref.id === winnerTeamId) {
        winnerRef = team1Ref;
        loserRef = team2Ref;
      } else if (team2Ref && team2Ref.id === winnerTeamId) {
        winnerRef = team2Ref;
        loserRef = team1Ref;
      } else {
        throw new Error('winnerTeamId tidak valid untuk match ini.');
      }

      // 6. Hitung Logic Bracket
      const { winnerUpdate, loserUpdate } = getNextMatchUpdates(
        matchData,
        tournament.participantCount,
        winnerRef,
        loserRef,
        tournamentId,
      );

      // 7. Update Dokumen (Current Match + Next Matches)
      // a. Update match saat ini
      t.update(matchRef, {
        status: 'completed',
        winnerTeamRef: winnerRef,
      });

      // b. Update match pemenang
      if (winnerUpdate) {
        t.update(winnerUpdate.ref, { [winnerUpdate.slot]: winnerRef });
      }

      // c. Update match tim yang kalah
      if (loserUpdate) {
        t.update(loserUpdate.ref, { [loserUpdate.slot]: loserRef });
      }
    });

    // 8. Sukses
    return NextResponse.json(
      { success: true, message: `Match ${matchId} telah dilaporkan.` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/.../report] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    );
  }
}