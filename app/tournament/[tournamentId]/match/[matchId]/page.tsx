// File: app/tournament/[tournamentId]/match/[matchId]/page.tsx
// Deskripsi: Halaman Detail Pertandingan (Match Room).
// Fitur: Fetch data match, tim, dan live war data (jika ada).

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  TournamentMatch,
  TournamentTeam,
  FirestoreDocument,
  CocCurrentWar,
} from '@/lib/clashub.types';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import {
  AlertTriangleIcon,
  Loader2Icon,
} from '@/app/components/icons';
import cocApi from '@/lib/coc-api';

import MatchDetailClient from './MatchDetailClient';

// Tipe data yang aman untuk dikirim ke Client Component (tanpa Firestore Reference)
export type SerializableFullMatchData = Omit<
  FirestoreDocument<TournamentMatch>,
  'team1Ref' | 'team2Ref' | 'winnerTeamRef' | 'liveWarData'
> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
  team1Ref: string | null;
  team2Ref: string | null;
  winnerTeamRef: string | null;
  liveWarData: CocCurrentWar | null;
};

async function getMatchWithTeamsAdmin(
  tournamentId: string,
  matchId: string,
): Promise<SerializableFullMatchData | null> {
  try {
    const matchRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches')
      .doc(matchId);

    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) return null;

    const matchData = docToDataAdmin<TournamentMatch>(matchSnap);
    if (!matchData) return null;

    const getTeamData = async (teamRef: any): Promise<FirestoreDocument<TournamentTeam> | null> => {
      if (!teamRef) return null;
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

    const [team1, team2] = await Promise.all([
      getTeamData(matchData.team1Ref),
      getTeamData(matchData.team2Ref),
    ]);

    const serializableMatch: SerializableFullMatchData = {
      ...matchData,
      team1: team1,
      team2: team2,
      team1Ref: matchData.team1Ref ? matchData.team1Ref.id : null,
      team2Ref: matchData.team2Ref ? matchData.team2Ref.id : null,
      winnerTeamRef: matchData.winnerTeamRef ? matchData.winnerTeamRef.id : null,
      liveWarData: null,
    };

    return serializableMatch;
  } catch (error) {
    console.error('[getMatchWithTeamsAdmin] Error:', error);
    throw new Error(`Gagal mengambil data match: ${(error as Error).message}`);
  }
}

const LoadingUI: React.FC = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md p-12 text-center">
    <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold" />
    <p className="mt-4 text-lg text-gray-400 font-clash tracking-wide animate-pulse">
      Memuat arena pertandingan...
    </p>
  </div>
);

const ErrorUI: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-red-500/30 bg-black/40 backdrop-blur-md p-12 text-center">
    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
       <AlertTriangleIcon className="h-8 w-8 text-red-500" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h3>
    <p className="text-gray-400 max-w-md">{message}</p>
  </div>
);

async function MatchDetailLoader({
  tournamentId,
  matchId,
}: {
  tournamentId: string;
  matchId: string;
}) {
  let tournament = null;
  let match = null;
  let currentWarData: CocCurrentWar | null = null;
  let fetchError: string | null = null;

  try {
    [tournament, match] = await Promise.all([
      getTournamentByIdAdmin(tournamentId),
      getMatchWithTeamsAdmin(tournamentId, matchId),
    ]);

    if (!tournament) throw new Error(`Turnamen tidak ditemukan.`);
    if (!match) throw new Error(`Match tidak ditemukan.`);

    // Logic Live War Data
    if (
      (match.status === 'live' || match.status === 'reported') &&
      match.team1AssignedClanTag
    ) {
      try {
        currentWarData = await cocApi.getClanCurrentWar(
          encodeURIComponent(match.team1AssignedClanTag),
          match.team1AssignedClanTag,
        );

        if (
          currentWarData &&
          match.team2AssignedClanTag &&
          currentWarData.opponent.tag !== match.team2AssignedClanTag
        ) {
          console.warn(`[MatchDetailLoader] Lawan war tidak cocok.`);
          currentWarData = null;
        }
      } catch (warError: any) {
        console.error(`[MatchDetailLoader] Gagal fetch live war:`, warError.message);
        currentWarData = null;
      }
    }
  } catch (error: any) {
    fetchError = error.message;
  }

  if (fetchError) return <ErrorUI message={fetchError} />;
  if (!tournament || !match) return <ErrorUI message="Data tidak lengkap." />;

  return (
    <MatchDetailClient
      tournament={JSON.parse(JSON.stringify(tournament))}
      initialMatchData={JSON.parse(JSON.stringify(match))}
      initialWarData={currentWarData ? JSON.parse(JSON.stringify(currentWarData)) : null}
    />
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: { tournamentId: string; matchId: string };
}) {
  const { tournamentId, matchId } = params;

  if (!tournamentId || !matchId) notFound();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 mt-4 md:mt-8">
      <Suspense fallback={<LoadingUI />}>
        <MatchDetailLoader tournamentId={tournamentId} matchId={matchId} />
      </Suspense>
    </div>
  );
}