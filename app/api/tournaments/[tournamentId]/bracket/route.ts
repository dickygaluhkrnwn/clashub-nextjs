// File: app/api/tournaments/[tournamentId]/bracket/route.ts
// Deskripsi: [BARU - FASE 6] API route (GET) publik untuk mengambil semua data
// match dan tim terkait untuk ditampilkan di halaman detail turnamen (bracket).

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  TournamentMatch,
  TournamentTeam,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

/**
 * @handler GET
 * @description Mengambil daftar semua match untuk turnamen (publik),
 * dan mengisi (populate) data team1 dan team2 dari referensinya.
 * Ini digunakan untuk merender bracket di halaman detail publik.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  // 1. Validasi dasar
  if (!tournamentId) {
    return NextResponse.json(
      { error: 'Tournament ID tidak valid' },
      { status: 400 },
    );
  }

  try {
    // 2. Ambil Semua Dokumen Match & Tim
    // (Mirip dengan .../manage/matches/route.ts tapi tanpa auth)
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

    // 3. Buat Peta (Map) Tim untuk lookup cepat
    const teamsMap = new Map<string, FirestoreDocument<TournamentTeam>>();
    teamsSnap.docs.forEach((doc) => {
      const teamData = docToDataAdmin<TournamentTeam>(doc);
      if (teamData) {
        teamsMap.set(doc.id, teamData);
      }
    });

    // 4. Proses dan Gabungkan Data Match
    // Tipe ini akan cocok dengan tipe 'FullMatchData' yang akan kita buat di client
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

    // 5. Urutkan berdasarkan matchId (U-R1-M1, U-R1-M2, ...)
    fullMatches.sort((a, b) => a.matchId.localeCompare(b.matchId));

    // 6. Sukses
    return NextResponse.json({ matches: fullMatches }, { status: 200 });
  } catch (error: any) {
    console.error(
      `[GET /api/tournaments/${tournamentId}/bracket] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}