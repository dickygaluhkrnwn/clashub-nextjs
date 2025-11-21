'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FirestoreDocument,
  Tournament,
  TournamentTeam,
  CocCurrentWar,
} from '@/lib/types';
import { SerializableFullMatchData } from './page'; // Asumsi page.tsx di folder ini mengekspor tipe ini
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import {
  ArrowLeftIcon,
  Loader2Icon,
  ShieldIcon,
  SwordsIcon,
  AlertTriangleIcon,
  LinkIcon,
  ClockIcon, // [PERBAIKAN] Tambahkan ClockIcon di sini
} from '@/app/components/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import CurrentWarDisplay from '@/app/components/war/CurrentWarDisplay';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Tipe data gabungan yang diterima dari Server Component
type FullMatchData = SerializableFullMatchData;

interface MatchDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
  initialMatchData: FullMatchData;
  initialWarData: CocCurrentWar | null;
}

/**
 * @component MatchHeader
 */
const MatchHeader: React.FC<{
  match: FullMatchData;
  tournamentTitle: string;
  t: any;
}> = ({ match, tournamentTitle, t }) => {
  const router = useRouter();
  const { team1, team2, matchId } = match;

  return (
    <div className="mb-6">
      {/* Tombol Kembali */}
      <Button
        variant="secondary"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        {t.tournament.detail.btnBackToBracket}
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
 */
const MatchStatusInfo: React.FC<{ match: FullMatchData, t: any }> = ({ match, t }) => {
  const { status, scheduledTime, round, bracket } = match;

  let statusText = 'Pending';
  let statusColor = 'text-gray-400';
  
  // [i18n] Status terjemahan
  if (status === 'completed' || status === 'reported') {
    statusText = t.tournament.cardStatusCompleted;
    statusColor = 'text-green-400';
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-red-500 animate-pulse';
  } else if (status === 'scheduled') {
    statusText = t.tournament.detail.matchScheduled;
    statusColor = 'text-blue-400';
  } else {
    statusText = t.tournament.match.matchPending || 'Pending';
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.detail.labelStatus}
        </p>
        <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.detail.labelSchedule}
        </p>
        <p className="text-lg font-bold text-coc-font-primary">
          {scheduledTime
            ? format(new Date(scheduledTime), 'dd/MM/yy - HH:mm')
            : t.tournament.detail.matchTbd}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.detail.labelBracket}
        </p>
        <p className="text-lg font-bold capitalize text-coc-font-primary">
          {bracket}
        </p>
      </div>
      <div className="rounded-lg bg-white/5 p-4">
        <p className="text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.detail.labelRound}
        </p>
        <p className="text-lg font-bold text-coc-font-primary">{round}</p>
      </div>
    </div>
  );
};

/**
 * @component TeamCheckInCard
 */
const TeamCheckInCard: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  assignedClanTag: string | null;
  t: any;
}> = ({ team, assignedClanTag, t }) => {
  if (!team) {
    return (
      <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6">
        <h3 className="mb-4 font-clash text-xl font-bold text-white">
          {t.tournament.match.byeTitle}
        </h3>
        <p className="text-coc-font-secondary">{t.tournament.match.byeDesc}</p>
      </div>
    );
  }

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
            {t.clanEsports.leaderLabel} {team.leaderUid.substring(0, 6)}...
          </p>
        </div>
      </div>

      {/* Daftar Anggota Tim */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.match.membersTitle}
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

      {/* Panel Penugasan Klan */}
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase text-coc-font-secondary">
          {t.tournament.match.assignmentTitle}
        </h4>
        {assignedClanTag ? (
          <div className="flex flex-col gap-3 rounded-lg border border-blue-700 bg-blue-900/30 p-4">
            <p className="text-sm text-blue-200">
              {t.tournament.match.assignmentDesc}
            </p>
            <p className="font-mono text-xl font-bold text-white">
              {assignedClanTag}
            </p>
            <Button
              href={clanLink}
              variant="secondary"
              size="sm"
              target="_blank"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {t.tournament.match.btnOpenClan}
            </Button>
            <p className="text-xs text-blue-300">
              {t.tournament.match.assignmentNote}
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 rounded-lg border border-yellow-700 bg-yellow-900/30 p-4">
            <AlertTriangleIcon className="h-6 w-6 flex-shrink-0 text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-300">
              {t.tournament.match.assignmentWaiting}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @component LiveWarTracker
 */
const LiveWarTracker: React.FC<{
  match: FullMatchData;
  initialWarData: CocCurrentWar | null;
  t: any;
}> = ({ match, initialWarData, t }) => {
  const [warData] = useState(initialWarData);
  const [isLoading] = useState(false);
  const [error] = useState(
    !initialWarData && match.status !== 'pending' && match.status !== 'scheduled'
      ? t.tournament.match.waitingLive
      : null,
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
        <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold" />
        <p className="mt-2 text-coc-font-secondary">{t.tournament.match.loadingLive}</p>
      </div>
    );
  }

  if (error && !warData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-yellow-700 bg-yellow-900/30 p-8 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-yellow-400" />
        <p className="mt-2 font-semibold text-yellow-300">{error}</p>
        <p className="text-sm text-yellow-500">
          {t.tournament.match.waitingDesc}
        </p>
      </div>
    );
  }

  if (warData && match.team1AssignedClanTag) {
    return (
      <CurrentWarDisplay
        currentWar={warData}
        ourClanTag={match.team1AssignedClanTag}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-8 text-center">
      <ClockIcon className="h-10 w-10 text-coc-font-secondary" />
      <p className="mt-2 text-lg text-coc-font-primary">
        {t.tournament.match.notStartedTitle}
      </p>
      <p className="text-sm text-coc-font-secondary">
        {t.tournament.match.notStartedDesc}
      </p>
    </div>
  );
};

/**
 * @component MatchDetailClient
 */
const MatchDetailClient: React.FC<MatchDetailClientProps> = ({
  tournament,
  initialMatchData,
  initialWarData,
}) => {
  const { t } = useLanguage(); // Init Hook
  const [matchData] = useState<FullMatchData>(initialMatchData);

  const isLiveOrScheduled =
    matchData.status === 'live' ||
    matchData.status === 'scheduled' ||
    matchData.status === 'reported' ||
    matchData.status === 'completed';

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <MatchHeader match={matchData} tournamentTitle={tournament.title} t={t} />

      {/* 2. Info Status */}
      <MatchStatusInfo match={matchData} t={t} />

      {/* 3. Panel Live War */}
      {isLiveOrScheduled ? (
        <section className="rounded-lg border-2 border-coc-gold/50 bg-coc-dark-blue p-6 shadow-lg">
          <h2 className="mb-4 font-clash text-3xl font-bold text-coc-gold">
            {t.tournament.match.liveWarTitle}
          </h2>
          <LiveWarTracker
            match={matchData}
            initialWarData={initialWarData}
            t={t}
          />
        </section>
      ) : null}

      {/* 4. Panel Penugasan Klan */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TeamCheckInCard
          team={matchData.team1}
          assignedClanTag={matchData.team1AssignedClanTag}
          t={t}
        />
        <TeamCheckInCard
          team={matchData.team2}
          assignedClanTag={matchData.team2AssignedClanTag}
          t={t}
        />
      </section>
    </div>
  );
};

export default MatchDetailClient;