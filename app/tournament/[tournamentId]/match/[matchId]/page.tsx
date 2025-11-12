// File: app/tournament/[tournamentId]/match/[matchId]/page.tsx
// Deskripsi: [UPDATE FASE 16.2] Perbaikan typo 'ongoing' menjadi 'live'.
// SEKARANG: Meng-fetch data war di server & mengirim data bersih ke client.

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentMatch,
  TournamentTeam,
  FirestoreDocument,
  CocCurrentWar, // [FASE 15.4] Impor tipe CocCurrentWar
} from '@/lib/clashub.types';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import {
  AlertTriangleIcon,
  Loader2Icon,
} from '@/app/components/icons';
// [FASE 15.4] Impor cocApi (server-side)
import cocApi from '@/lib/coc-api';

// Impor komponen Client
import MatchDetailClient from './MatchDetailClient';

// [FASE 15.4] Tipe data BARU yang "aman" untuk dikirim ke client
// Semua DocumentReference diubah menjadi string ID.
export type SerializableFullMatchData = Omit<
  FirestoreDocument<TournamentMatch>,
  'team1Ref' | 'team2Ref' | 'winnerTeamRef' | 'liveWarData'
> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
  // Ubah Ref menjadi string ID
  team1Ref: string | null;
  team2Ref: string | null;
  winnerTeamRef: string | null;
  liveWarData: CocCurrentWar | null; // Data war akan kita fetch di server
};

/**
 * @function getMatchWithTeamsAdmin
 * [UPDATE FASE 15.4] Helper function untuk mengambil 1 match
 * dan mengonversinya menjadi data yang aman (serializable) untuk client.
 */
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

    // [PERBAIKAN FASE 15.4] Konversi Class menjadi object JSON
    const serializableMatch: SerializableFullMatchData = {
      ...matchData,
      team1: team1,
      team2: team2,
      // Ubah DocumentReference (Class) menjadi string (ID)
      team1Ref: matchData.team1Ref ? matchData.team1Ref.id : null,
      team2Ref: matchData.team2Ref ? matchData.team2Ref.id : null,
      winnerTeamRef: matchData.winnerTeamRef
        ? matchData.winnerTeamRef.id
        : null,
      // liveWarData akan di-fetch secara terpisah di MatchDetailLoader
      liveWarData: null,
    };

    return serializableMatch;
  } catch (error) {
    console.error('[getMatchWithTeamsAdmin] Error fetching match data:', error);
    // [FIX FASE 15.4] Jangan return null jika error, lempar error
    // agar Suspense boundary bisa menangkapnya.
    // return null;
    throw new Error(`Gagal mengambil data match: ${(error as Error).message}`);
  }
}

/**
 * @component LoadingUI
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
 * [UPDATE FASE 15.4] Sekarang juga mengambil data live war.
 */
async function MatchDetailLoader({
  tournamentId,
  matchId,
}: {
  tournamentId: string;
  matchId: string;
}) {
  let tournament: FirestoreDocument<Tournament> | null = null;
  let match: SerializableFullMatchData | null = null;
  let currentWarData: CocCurrentWar | null = null;
  let fetchError: string | null = null;

  try {
    // 1. Fetch data turnamen dan match secara paralel
    [tournament, match] = await Promise.all([
      getTournamentByIdAdmin(tournamentId),
      getMatchWithTeamsAdmin(tournamentId, matchId),
    ]);

    // 2. Handle jika data tidak ditemukan
    if (!tournament) {
      throw new Error(`Turnamen dengan ID ${tournamentId} tidak ditemukan.`);
    }
    if (!match) {
      throw new Error(`Match dengan ID ${matchId} tidak ditemukan.`);
    }

    // [BARU FASE 15.4] Implementasi Ide Anda (Ambil Live War)
    // [PERBAIKAN FASE 16.2] Ganti 'ongoing' (typo) menjadi 'live'
    if (
      (match.status === 'live' || // <-- [FIX] Ini adalah typo (Error 3)
        match.status === 'reported') && // 'reported' juga butuh data war
      match.team1AssignedClanTag // Pastikan Klan A sudah ditugaskan
    ) {
      console.log(
        `[MatchDetailLoader] Match ${matchId} aktif. Mengambil war data dari klan panitia: ${match.team1AssignedClanTag}`,
      );
      try {
        // Kita panggil getClanCurrentWar dari coc-api.ts
        // Kita gunakan Klan A (team1AssignedClanTag) sebagai klan utama
        // Ini dijamin berhasil karena IP server adalah panitia (Leader/Co)
        currentWarData = await cocApi.getClanCurrentWar(
          encodeURIComponent(match.team1AssignedClanTag),
          match.team1AssignedClanTag,
        );

        // Jika war ditemukan, tapi lawannya tidak cocok, batalkan
        if (
          currentWarData &&
          match.team2AssignedClanTag && // Pastikan Klan B ada
          currentWarData.opponent.tag !== match.team2AssignedClanTag
        ) {
          console.warn(
            `[MatchDetailLoader] Ditemukan war di ${match.team1AssignedClanTag}, tapi lawannya (${currentWarData.opponent.tag}) bukan Klan B (${match.team2AssignedClanTag}).`,
          );
          currentWarData = null; // Anggap tidak ada war yang cocok
        }
      } catch (warError: any) {
        console.error(
          `[MatchDetailLoader] Gagal mengambil live war data:`,
          warError.message,
        );
        // Jangan gagalkan halaman, anggap saja war belum dimulai
        currentWarData = null;
      }
    }
  } catch (error: any) {
    console.error('[MatchDetailLoader] Gagal fetch data:', error.message);
    fetchError = error.message;
  }

  // 3. Handle Error Global
  if (fetchError) {
    return <ErrorUI message={fetchError} />;
  }
  if (!tournament || !match) {
    return <ErrorUI message="Data turnamen atau match tidak lengkap." />;
  }

  // 4. Render Client Component dengan data yang SUDAH BERSIH dan SUDAH DI-FETCH
  // Ini memperbaiki error "Only plain objects..."
  return (
    <MatchDetailClient
      tournament={JSON.parse(JSON.stringify(tournament))}
      initialMatchData={JSON.parse(JSON.stringify(match))}
      initialWarData={
        currentWarData ? JSON.parse(JSON.stringify(currentWarData)) : null
      }
    />
  );
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