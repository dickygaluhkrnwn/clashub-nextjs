'use client';

// File: app/tournament/[tournamentId]/match/[matchId]/MatchDetailClient.tsx
// Deskripsi: [UPDATE FASE 16.3] Perbaikan typo 'ongoing' menjadi 'live'.
// Logika polling dihapus, check-in diubah jadi display-only (sesuai ide "2 Klan Panitia").

import React, { useState } from 'react';
import Link from 'next/link';
// [FIX 1] Ganti impor dari 'clashub.types' ke 'types' (barrel file)
import {
  FirestoreDocument,
  Tournament,
  // [FASE 15.4] Impor tipe serializable baru dari page.tsx
  // TournamentMatch, // Tipe lama
  TournamentTeam,
  TournamentTeamMember,
  CocCurrentWar,
} from '@/lib/types';
// [FASE 15.4] Impor tipe serializable baru dari page.tsx
import { SerializableFullMatchData } from './page';

import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
// [FASE 15.4] Hapus Input, sudah tidak dipakai
// import { Input } from '@/app/components/ui/Input';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  Loader2Icon,
  ShieldIcon,
  SwordsIcon,
  UserIcon,
  UsersIcon,
  AlertTriangleIcon,
  LinkIcon, // [FASE 15.4] Tambahkan LinkIcon
} from '@/app/components/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
// [TAHAP 6] Impor komponen display war yang baru
import CurrentWarDisplay from '@/app/components/war/CurrentWarDisplay';

// Tipe data gabungan yang diterima dari Server Component
// [FASE 15.4] Gunakan tipe Serializable yang baru
type FullMatchData = SerializableFullMatchData;

// Tipe props untuk Client Component
interface MatchDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
  initialMatchData: FullMatchData;
  // [BARU FASE 15.4] Menerima data war yang sudah di-fetch oleh server
  initialWarData: CocCurrentWar | null;
}

/**
 * @component MatchHeader
 * Menampilkan header pertandingan (Team A vs Team B).
 */
const MatchHeader: React.FC<{
  match: FullMatchData;
  tournamentTitle: string;
}> = ({ match, tournamentTitle }) => {
  const router = useRouter();
  const { team1, team2, matchId } = match;

  return (
    <div className="mb-6">
      {/* Tombol Kembali */}
      <Button
        variant="secondary" // [FIX 2] Ganti "outline" menjadi "secondary"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Kembali ke Bracket
      </Button>

      {/* Info Match */}
      <p className="text-sm font-semibold uppercase tracking-wider text-coc-gold">
        {tournamentTitle}
      </p>
      <h1 className="mb-2 font-clash text-4xl font-bold text-white md:text-5xl">
        Match: {matchId}
      </h1>

      {/* Tim vs Tim */}
      <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:flex-row md:space-x-8 md:space-y-0">
        {/* Tim 1 */}
        <div className="flex items-center space-x-3">
          <img
            src={team1?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt={team1?.teamName || 'Tim 1'}
            className="h-12 w-12 rounded-md"
          />
          <span className="font-clash text-2xl font-bold text-white">
            {team1?.teamName || 'TBD'}
          </span>
        </div>

        <SwordsIcon className="h-8 w-8 text-coc-font-secondary/50" />

        {/* Tim 2 */}
        <div className="flex items-center space-x-3">
          <img
            src={team2?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt={team2?.teamName || 'Tim 2'}
            className="h-12 w-12 rounded-md"
          />
          <span className="font-clash text-2xl font-bold text-white">
            {team2?.teamName || 'TBD'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * @component MatchStatusInfo
 * Menampilkan info status, jadwal, dan ronde.
 */
const MatchStatusInfo: React.FC<{ match: FullMatchData }> = ({ match }) => {
  const { status, scheduledTime, round, bracket } = match;

  let statusText = 'Pending';
  let statusColor = 'text-gray-400';
  if (status === 'completed' || status === 'reported') {
    statusText = 'Selesai';
    statusColor = 'text-green-400';
  } else if (status === 'live') {
    statusText = 'Live';
    statusColor = 'text-red-500 animate-pulse';
  } else if (status === 'scheduled') {
    statusText = 'Terjadwal';
    statusColor = 'text-blue-400';
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Status
        </p>
        <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Jadwal
        </p>
        <p className="text-lg font-bold text-coc-font-primary">
          {scheduledTime
            ? format(new Date(scheduledTime), 'dd/MM/yy - HH:mm')
            : 'Belum Diatur'}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Bracket
        </p>
        <p className="text-lg font-bold capitalize text-coc-font-primary">
          {bracket}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          Ronde
        </p>
        <p className="text-lg font-bold text-coc-font-primary">{round}</p>
      </div>
    </div>
  );
};

/**
 * @component TeamCheckInCard
 * [UPDATE FASE 15.4] Dirombak total.
 * TIDAK ADA LAGI LOGIKA CHECK-IN.
 * Komponen ini sekarang hanya menampilkan klan panitia (A/B) yang ditugaskan.
 */
const TeamCheckInCard: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  assignedClanTag: string | null; // Menerima tag klan yang ditugaskan
}> = ({ team, assignedClanTag }) => {
  if (!team) {
    return (
      <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
        <h3 className="mb-4 font-clash text-xl font-bold text-white">
          Tim (BYE)
        </h3>
        <p className="text-coc-font-secondary">Slot ini kosong (BYE).</p>
      </div>
    );
  }

  // Helper untuk membuat link 'open in-game'
  const clanLink = assignedClanTag
    ? `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${assignedClanTag.replace(
        '#',
        '',
      )}`
    : '#';

  return (
    <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
      {/* Header Tim */}
      <div className="mb-4 flex items-center space-x-3">
        <img
          src={team.originClanBadgeUrl}
          alt={team.teamName}
          className="h-10 w-10 rounded-md"
        />
        <div>
          <h3 className="font-clash text-xl font-bold text-white">
            {team.teamName}
          </h3>
          <p className="text-sm text-coc-font-secondary">
            Leader: {team.leaderUid.substring(0, 6)}...
          </p>
        </div>
      </div>

      {/* Daftar Anggota Tim */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          Anggota Tim
        </h4>
        <ul className="space-y-2">
          {team.members.map((member) => (
            <li
              key={member.playerTag}
              className="flex items-center space-x-2 rounded bg-white/5 p-2"
            >
              <ShieldIcon className="h-5 w-5 text-coc-font-secondary" />
              <span className="font-semibold text-coc-font-primary">
                {member.playerName}
              </span>
              <span className="text-sm text-coc-font-secondary">
                (TH{member.townHallLevel})
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* [ROMBAK FASE 15.4] Panel Penugasan Klan (Bukan Check-in) */}
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          Penugasan Klan Tanding
        </h4>
        {assignedClanTag ? (
          // KLAN SUDAH DITUGASKAN
          <div className="flex flex-col gap-3 rounded-lg border border-blue-700 bg-blue-900/30 p-4">
            <p className="text-sm text-blue-200">
              Tim Anda ditugaskan untuk bertanding di klan panitia berikut:
            </p>
            <p className="font-mono text-xl font-bold text-white">
              {assignedClanTag}
            </p>
            <Button
              href={clanLink}
              variant="secondary"
              size="sm"
              target="_blank" // Buka di tab baru
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Buka Profil Klan
            </Button>
            <p className="text-xs text-blue-300">
              Harap segera masuk ke klan tersebut 1 jam sebelum jadwal
              pertandingan.
            </p>
          </div>
        ) : (
          // KLAN BELUM DITUGASKAN (Seharusnya tidak terjadi jika bracket sudah ada)
          <div className="flex items-center space-x-2 rounded-lg border border-yellow-700 bg-yellow-900/30 p-4">
            <AlertTriangleIcon className="h-6 w-6 flex-shrink-0 text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-300">
              Klan tanding belum ditugaskan oleh panitia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- [ROMBAK FASE 15.4] ---
/**
 * @component LiveWarTracker
 * Komponen diubah menjadi "dumb component".
 * TIDAK ADA LAGI POLLING. Hanya menerima data dari server.
 */
const LiveWarTracker: React.FC<{
  match: FullMatchData;
  initialWarData: CocCurrentWar | null; // Menerima data dari server
}> = ({ match, initialWarData }) => {
  // Data war didapat dari props, tidak perlu state polling
  const [warData] = useState(initialWarData);
  // Status loading di-set false karena data sudah ada atau memang null
  const [isLoading] = useState(false);
  // Set error HANYA jika war belum dimulai
  const [error] = useState(
    !initialWarData && match.status !== 'pending' && match.status !== 'scheduled'
      ? 'Menunggu Friendly War dimulai oleh panitia...'
      : null,
  );

  // Tampilan Loading (sekarang tidak terpakai, tapi kita simpan)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
        <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold" />
        <p className="mt-2 text-coc-font-secondary">Memuat Live War...</p>
      </div>
    );
  }

  // Tampilan Error atau Menunggu
  if (error && !warData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-yellow-700 bg-yellow-900/30 p-8 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-yellow-400" />
        <p className="mt-2 font-semibold text-yellow-300">{error}</p>
        <p className="text-sm text-yellow-500">
          Panitia akan memulai war sesuai jadwal.
        </p>
      </div>
    );
  }

  // Tampilan Sukses: Tampilkan Komponen Live War
  if (warData && match.team1AssignedClanTag) {
    return (
      <CurrentWarDisplay
        currentWar={warData}
        // Tampilkan Klan A sebagai "Klan Kita"
        ourClanTag={match.team1AssignedClanTag}
      />
    );
  }

  // Fallback jika match masih 'pending' atau 'scheduled'
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
      <ClockIcon className="h-10 w-10 text-coc-font-secondary" />
      <p className="mt-2 text-lg text-coc-font-primary">
        Pertandingan Belum Dimulai
      </p>
      <p className="text-sm text-coc-font-secondary">
        Live war akan tampil di sini saat panitia telah memulai pertandingan.
      </p>
    </div>
  );
};
// --- [AKHIR ROMBAK FASE 15.4] ---

/**
 * @component MatchDetailClient
 * Komponen Client utama yang menggabungkan semua bagian.
 */
const MatchDetailClient: React.FC<MatchDetailClientProps> = ({
  tournament,
  initialMatchData,
  initialWarData, // [BARU FASE 15.4] Terima data war
}) => {
  // [ROMBAK FASE 15.4] State hanya untuk data match (jika ada update check-in)
  // Data 'liveWar' sekarang statis dari props 'initialWarData'.
  const [matchData, setMatchData] = useState<FullMatchData>(initialMatchData);

  // [ROMBAK FASE 15.4] Fungsi ini tidak lagi relevan karena check-in dihapus
  // const handleCheckInSuccess = (updatedMatch: FullMatchData) => {
  //   setMatchData((prev) => ({ ...prev, ...updatedMatch })); // Gabungkan data
  // };

  // [ROMBAK FASE 15.4] Fungsi ini tidak lagi relevan karena polling dihapus
  // const handleSetLive = (liveWar: CocCurrentWar) => {
  //   setMatchData((prevData) => ({
  //     ...prevData,
  //     status: 'live',
  //     liveWarData: liveWar,
  //   }));
  // };

  // [ROMBAK FASE 15.4] Logika 'allCheckedIn' tidak relevan lagi
  // const allCheckedIn = !!matchData.team1ClanTag && !!matchData.team2ClanTag;
  const isLiveOrScheduled =
    matchData.status === 'live' ||
    matchData.status === 'scheduled' ||
    // [PERBAIKAN FASE 16.3] Ganti 'ongoing' (typo) menjadi 'live'
    // matchData.status === 'ongoing' || // <-- [FIX] Ini adalah typo (Error 1)
    matchData.status === 'reported' ||
    matchData.status === 'completed';

  return (
    <div className="space-y-6">
      {/* 1. Header (Tim vs Tim) */}
      <MatchHeader match={matchData} tournamentTitle={tournament.title} />

      {/* 2. Info Status, Jadwal, Ronde */}
      <MatchStatusInfo match={matchData} />

      {/* 3. Panel Live War (Logika disederhanakan) */}
      {isLiveOrScheduled ? (
        <section className="rounded-lg border-2 border-coc-gold/50 bg-coc-dark-blue p-6 shadow-lg">
          <h2 className="mb-4 font-clash text-3xl font-bold text-coc-gold">
            Live War
          </h2>
          {/* [ROMBAK FASE 15.4] Kirim 'initialWarData' ke tracker "dumb" */}
          <LiveWarTracker
            match={matchData}
            initialWarData={initialWarData}
          />
        </section>
      ) : null}

      {/* 4. Panel Penugasan Klan (Bukan Check-in) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* [ROMBAK FASE 15.4] Kirim prop 'assignedClanTag' */}
        <TeamCheckInCard
          team={matchData.team1}
          assignedClanTag={matchData.team1AssignedClanTag}
        />
        <TeamCheckInCard
          team={matchData.team2}
          assignedClanTag={matchData.team2AssignedClanTag}
        />
      </section>
    </div>
  );
};

export default MatchDetailClient;