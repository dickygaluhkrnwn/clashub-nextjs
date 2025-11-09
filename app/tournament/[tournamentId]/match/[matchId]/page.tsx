// File: app/tournament/[tournamentId]/match/[matchId]/page.tsx
// Deskripsi: [BARU - FASE 6] Server Component untuk halaman detail match.
// Bertugas mengambil data match & tim, lalu memberikannya ke Client Component.

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentMatch,
  TournamentTeam,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import {
  AlertTriangleIcon,
  Loader2Icon,
  // LockIcon, // [FIX] Hapus impor LockIcon yang tidak terpakai
} from '@/app/components/icons';

// Impor komponen Client (yang akan kita buat setelah ini)
import MatchDetailClient from './MatchDetailClient';

// Tipe data gabungan untuk match + data tim yang sudah dipopulasi
type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

/**
 * @function getMatchWithTeamsAdmin
 * Helper function (khusus untuk halaman ini) untuk mengambil 1 dokumen match
 * dan menggabungkannya dengan data tim dari sub-koleksi 'teams'.
 */
async function getMatchWithTeamsAdmin(
  tournamentId: string,
  matchId: string,
): Promise<FullMatchData | null> {
  try {
    const matchRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches')
      .doc(matchId);

    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      return null;
    }

    const matchData = docToDataAdmin<TournamentMatch>(matchSnap);
    if (!matchData) {
      return null;
    }

    // Helper untuk fetch data tim dari referensinya
    const getTeamData = async (
      teamRef: any,
    ): Promise<FirestoreDocument<TournamentTeam> | null> => {
      if (!teamRef) return null;
      // Referensi dari admin SDK (any) memiliki properti _path
      const teamId = teamRef.id || teamRef._path?.segments?.pop();
      if (!teamId) return null;

      const teamSnap = await adminFirestore
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection('teams')
        .doc(teamId)
        .get();

      return docToDataAdmin<TournamentTeam>(teamSnap);
    };

    // Fetch team1 dan team2 secara paralel
    const [team1, team2] = await Promise.all([
      getTeamData(matchData.team1Ref),
      getTeamData(matchData.team2Ref),
    ]);

    return {
      ...matchData,
      team1: team1,
      team2: team2,
    };
  } catch (error) {
    console.error('[getMatchWithTeamsAdmin] Error fetching match data:', error);
    return null;
  }
}

/**
 * @component LoadingUI
 * Komponen UI untuk ditampilkan saat data sedang di-load.
 */
const LoadingUI: React.FC = () => (
  <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-12 text-center">
    <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold" />
    <p className="mt-3 text-lg text-coc-font-secondary">
      Memuat data pertandingan...
    </p>
  </div>
);

/**
 * @component ErrorUI
 * Komponen UI untuk ditampilkan jika terjadi error.
 */
const ErrorUI: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-red-700 bg-red-900/30 p-12 text-center text-red-300">
    <AlertTriangleIcon className="h-12 w-12" />
    <p className="mt-3 text-lg font-bold">Terjadi Kesalahan</p>
    <p className="text-sm">{message}</p>
  </div>
);

/**
 * @component MatchDetailLoader
 * Komponen Suspense-boundary untuk logic fetch data utama.
 */
async function MatchDetailLoader({
  tournamentId,
  matchId,
}: {
  tournamentId: string;
  matchId: string;
}) {
  // 1. Fetch data turnamen dan match secara paralel
  const [tournament, match] = await Promise.all([
    getTournamentByIdAdmin(tournamentId),
    getMatchWithTeamsAdmin(tournamentId, matchId),
  ]);

  // 2. Handle jika data tidak ditemukan
  if (!tournament) {
    return <ErrorUI message={`Turnamen dengan ID ${tournamentId} tidak ditemukan.`} />;
  }
  if (!match) {
    return <ErrorUI message={`Match dengan ID ${matchId} tidak ditemukan.`} />;
  }

  // 3. Render Client Component dengan data yang sudah di-fetch
  // Kita kirim 'tournament' agar Client punya konteks (misal: teamSize)
  return <MatchDetailClient tournament={tournament} initialMatchData={match} />;
}

/**
 * @page MatchDetailPage
 * Server Component utama untuk /tournament/[tournamentId]/match/[matchId]
 */
export default async function MatchDetailPage({
  params,
}: {
  params: { tournamentId: string; matchId: string };
}) {
  const { tournamentId, matchId } = params;

  // Validasi dasar
  if (!tournamentId || !matchId) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Suspense fallback={<LoadingUI />}>
        <MatchDetailLoader tournamentId={tournamentId} matchId={matchId} />
      </Suspense>
    </div>
  );
}