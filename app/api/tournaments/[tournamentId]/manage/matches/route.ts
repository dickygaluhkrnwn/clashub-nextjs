// File: app/api/tournaments/[tournamentId]/manage/matches/route.ts
// Deskripsi: [BARU - FASE 5] API route (GET) untuk mengambil semua data match
// beserta data tim yang terkait (team1 & team2).

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentMatch,
  TournamentTeam,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { DocumentReference } from 'firebase-admin/firestore';

/**
 * @handler GET
 * @description Mengambil daftar semua match untuk turnamen,
 * dan mengisi (populate) data team1 dan team2 dari referensinya.
 * Hanya bisa diakses oleh Panitia (Organizer atau Committee).
 */
export async function GET(
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
        { status: 403 },
      );
    }

    // 4. Ambil Semua Dokumen Match & Tim
    const teamsRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('teams');
    const matchesRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches');

    const [teamsSnap, matchesSnap] = await Promise.all([
      teamsRef.get(),
      matchesRef.get(),
    ]);

    // 5. Buat Peta (Map) Tim untuk lookup cepat
    const teamsMap = new Map<string, FirestoreDocument<TournamentTeam>>();
    teamsSnap.docs.forEach((doc) => {
      const teamData = docToDataAdmin<TournamentTeam>(doc);
      if (teamData) {
        teamsMap.set(doc.id, teamData);
      }
    });

    // 6. Proses dan Gabungkan Data Match
    // Tipe ini sesuai dengan 'FullMatchData' di ScheduleManager.tsx
    const fullMatches: any[] = [];

    matchesSnap.docs.forEach((doc) => {
      const matchData = docToDataAdmin<TournamentMatch>(doc);
      if (!matchData) return;

      // Ambil referensi admin (tipe 'any' untuk mengatasi mismatch client/admin)
      const adminTeam1Ref = matchData.team1Ref as any;
      const adminTeam2Ref = matchData.team2Ref as any;

      // Cari data tim dari Map menggunakan ID referensi
      const team1 = adminTeam1Ref ? teamsMap.get(adminTeam1Ref.id) || null : null;
      const team2 = adminTeam2Ref ? teamsMap.get(adminTeam2Ref.id) || null : null;

      fullMatches.push({
        ...matchData,
        team1: team1, // Mengisi data tim 1 (atau null jika 'BYE')
        team2: team2, // Mengisi data tim 2 (atau null jika 'BYE')
      });
    });

    // 7. Urutkan berdasarkan matchId (U-R1-M1, U-R1-M2, ...)
    fullMatches.sort((a, b) => a.matchId.localeCompare(b.matchId));

    // 8. Sukses
    return NextResponse.json({ matches: fullMatches }, { status: 200 });
  } catch (error: any) {
    console.error(
      `[GET /api/tournaments/${tournamentId}/manage/matches] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}