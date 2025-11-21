'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// [PERBAIKAN] Tambahkan import Link
import Link from 'next/link';
import {
  FirestoreDocument,
  Tournament,
  TournamentTeam,
  TournamentMatch,
  ThRequirement,
} from '@/lib/clashub.types';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import {
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  TrophyIcon,
  ShieldIcon, 
  Loader2Icon, 
  SwordsIcon, 
  CogsIcon,
} from '@/app/components/icons';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Tipe untuk props
interface TournamentDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
}

// Tipe data gabungan untuk match + data tim yang sudah dipopulasi
type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

/**
 * @component InfoCard
 */
const InfoCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
}> = ({ icon: Icon, title, value }) => (
  <div className="flex items-start rounded-lg bg-white/5 p-4 backdrop-blur-sm">
    <Icon className="mr-3 h-6 w-6 flex-shrink-0 text-coc-gold" />
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-coc-font-secondary">
        {title}
      </p>
      <p className="text-lg font-bold text-coc-font-primary">{value}</p>
    </div>
  </div>
);

/**
 * @component RegisterButtonLogic
 * Komponen internal untuk menangani logika tombol pendaftaran.
 */
const RegisterButtonLogic: React.FC<{
  tournament: FirestoreDocument<Tournament>;
  t: any;
}> = ({ tournament, t }) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  const handleRegisterClick = () => {
    router.push(`/tournament/${tournament.id}/register`);
  };

  // Cek kepemilikan (organizer) SEBAGAI PRIORITAS PERTAMA.
  if (userProfile && userProfile.uid === tournament.organizerUid) {
    return (
      <Button
        size="lg"
        variant="secondary"
        href={`/tournament/${tournament.id}/manage`}
      >
        <CogsIcon className="mr-2 h-5 w-5" />
        {t.tournament.detail.manageBtn}
      </Button>
    );
  }

  // 1. Saat loading status auth
  if (loading) {
    return (
      <Button size="lg" disabled>
        {t.tournament.detail.loadingBtn}
      </Button>
    );
  }

  // 2. Jika turnamen tidak lagi 'registration_open'
  if (tournament.status !== 'registration_open') {
    let closedMessage = t.tournament.detail.regClosedBtn; // Default
    if (tournament.status === 'scheduled') {
      closedMessage = t.tournament.detail.regNotOpenBtn;
    } else if (
      tournament.status === 'ongoing' ||
      tournament.status === 'completed' ||
      tournament.status === 'cancelled'
    ) {
      closedMessage = t.tournament.detail.endedBtn;
    }

    return (
      <Button size="lg" variant="secondary" disabled>
        {closedMessage}
      </Button>
    );
  }

  // 3. Jika user belum login
  if (!userProfile) {
    return (
      <Button size="lg" variant="primary" href="/auth">
        {t.tournament.detail.loginBtn}
      </Button>
    );
  }

  // 4. Jika user belum verifikasi tag
  if (!userProfile.isVerified) {
    return (
      <Button size="lg" variant="secondary" disabled>
        {t.tournament.detail.verifyBtn}
      </Button>
    );
  }

  // 5. User sudah login dan terverifikasi (dan BUKAN organizer)
  return (
    <Button size="lg" variant="primary" onClick={handleRegisterClick}>
      {t.tournament.detail.registerBtn}
    </Button>
  );
};

/**
 * @component TeamDisplay
 */
const TeamDisplay: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  isWinner: boolean;
}> = ({ team, isWinner }) => {
  if (!team) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-coc-dark-blue/50">
          <span className="text-xs font-semibold text-coc-font-secondary/50">
            -
          </span>
        </div>
        <span className="font-semibold text-coc-font-secondary/60">BYE</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <img
        className="h-8 w-8 rounded-md"
        src={team.originClanBadgeUrl}
        alt={`${team.teamName} badge`}
      />
      <span
        className={`font-semibold ${
          isWinner ? 'text-coc-gold' : 'text-coc-font-primary'
        }`}
      >
        {team.teamName}
      </span>
    </div>
  );
};

/**
 * @component MatchCard
 */
const MatchCard: React.FC<{
  match: FullMatchData;
  tournamentId: string;
  t: any;
}> = ({ match, tournamentId, t }) => {
  const { team1, team2, winnerTeamRef, matchId, status } = match;

  const isTeam1Winner = winnerTeamRef?.path === team1?.id;
  const isTeam2Winner = winnerTeamRef?.path === team2?.id;

  // Tentukan status untuk styling
  let statusText = 'Pending';
  let statusColor = 'text-coc-font-secondary/70';
  
  // [i18n] Terjemahkan status match sederhana
  if (status === 'completed' || status === 'reported') {
    statusText = t.tournament.cardStatusCompleted; 
    statusColor = 'text-green-400';
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-red-500 animate-pulse';
  } else if (status === 'scheduled' && match.scheduledTime) {
    const scheduleDate = new Date(match.scheduledTime);
    if (!isNaN(scheduleDate.getTime())) {
      statusText = format(scheduleDate, 'dd/MM HH:mm');
      statusColor = 'text-blue-400';
    } else {
      statusText = t.tournament.detail.matchScheduled;
      statusColor = 'text-blue-400';
    }
  }

  return (
    <Link
      href={`/tournament/${tournamentId}/match/${match.id}`}
      className="block rounded-lg border border-coc-border bg-coc-dark-blue/60 p-4 transition-all hover:border-coc-gold/50 hover:bg-coc-dark-blue"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-coc-font-secondary">
          {matchId}
        </span>
        <span className={`text-xs font-bold ${statusColor}`}>{statusText}</span>
      </div>
      <div className="space-y-3">
        {/* Tim 1 */}
        <TeamDisplay team={team1} isWinner={isTeam1Winner} />

        {/* VS Separator */}
        <div className="flex items-center pl-10">
          <SwordsIcon className="h-4 w-4 text-coc-font-secondary/50" />
          <hr className="ml-2 w-full border-t border-coc-border/30" />
        </div>

        {/* Tim 2 */}
        <TeamDisplay team={team2} isWinner={isTeam2Winner} />
      </div>
    </Link>
  );
};

/**
 * @component BracketColumn
 */
const BracketColumn: React.FC<{
  title: string;
  matches: FullMatchData[];
  tournamentId: string;
  t: any;
}> = ({ title, matches, tournamentId, t }) => {
  const groupedMatches = matches.reduce(
    (acc, match) => {
      const round = match.round;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, FullMatchData[]>,
  );

  return (
    <div className="flex-1">
      <h3 className="mb-4 font-clash text-2xl font-bold text-white">{title}</h3>
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <div key={round}>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-coc-font-secondary">
              {t.tournament.detail.roundPrefix} {round}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournamentId={tournamentId}
                  t={t}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * @component BracketDisplay
 */
const BracketDisplay: React.FC<{
  tournamentId: string;
  matches: FullMatchData[];
  isLoading: boolean;
  error: string | null;
  t: any;
}> = ({ tournamentId, matches, isLoading, error, t }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-coc-border p-12 text-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold" />
        <p className="mt-3 text-lg text-coc-font-secondary">
          {t.tournament.detail.bracketLoading}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-red-700 bg-red-900/30 p-12 text-center text-red-300">
        <p className="text-lg font-bold">{t.tournament.detail.bracketError}</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-coc-border p-12 text-center">
        <p className="text-lg text-coc-font-secondary">
          {t.tournament.detail.bracketEmpty}
        </p>
        <p className="text-sm text-coc-font-secondary/70">
          {t.tournament.detail.bracketEmptyDesc}
        </p>
      </div>
    );
  }

  const upperBracketMatches = matches.filter((m) => m.bracket === 'upper');
  const lowerBracketMatches = matches.filter((m) => m.bracket === 'lower');

  return (
    <section className="space-y-8 rounded-lg border border-coc-border bg-coc-dark-blue p-6">
      <BracketColumn
        title={t.tournament.detail.bracketUpper}
        matches={upperBracketMatches}
        tournamentId={tournamentId}
        t={t}
      />
      {lowerBracketMatches.length > 0 && (
        <>
          <hr className="border-t border-coc-border/50" />
          <BracketColumn
            title={t.tournament.detail.bracketLower}
            matches={lowerBracketMatches}
            tournamentId={tournamentId}
            t={t}
          />
        </>
      )}
    </section>
  );
};

/**
 * @component TournamentDetailClient
 */
const TournamentDetailClient: React.FC<TournamentDetailClientProps> = ({
  tournament,
}) => {
  const { t } = useLanguage(); 
  
  const [matches, setMatches] = useState<FullMatchData[]>([]);
  const [isLoadingBracket, setIsLoadingBracket] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Helper format TH dengan i18n
  const formatThRequirement = useCallback((th: ThRequirement): string => {
    if (th.type === 'any') {
      return `TH ${th.minLevel} - ${th.maxLevel}`;
    }
    if (th.type === 'uniform') {
      return `${t.tournament.detail.thUniform} ${th.allowedLevels[0]}`;
    }
    if (th.type === 'mixed') {
      return `${t.tournament.detail.thMixed} ${th.allowedLevels.join(', ')}`;
    }
    return 'N/A';
  }, [t]);

  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setIsLoadingBracket(true);
        setFetchError(null);
        const response = await fetch(
          `/api/tournaments/${tournament.id}/bracket`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch bracket data.');
        }
        const data: { matches: FullMatchData[] } = await response.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        console.error('Error fetching bracket data:', err);
        setFetchError(err.message || 'An error occurred.');
      } finally {
        setIsLoadingBracket(false);
      }
    };

    if (tournament.status === 'ongoing' || tournament.status === 'completed') {
      fetchBracketData();
    } else {
      setIsLoadingBracket(false);
    }
  }, [tournament.id, tournament.status]);

  // Format tanggal dinamis
  const formattedDate = format(
    new Date(tournament.tournamentStartsAt),
    'dd MMMM yyyy - HH:mm',
  );
  const regStartDate = format(
    new Date(tournament.registrationStartsAt),
    'dd MMMM yyyy - HH:mm',
  );
  const regEndDate = format(
    new Date(tournament.registrationEndsAt),
    'dd MMMM yyyy - HH:mm',
  );

  const getStatusClasses = () => {
    switch (tournament.status) {
      case 'registration_open':
        return 'bg-green-600/20 text-green-300 border-green-500';
      case 'scheduled':
        return 'bg-cyan-600/20 text-cyan-300 border-cyan-500';
      case 'registration_closed':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-500';
      case 'ongoing':
        return 'bg-blue-600/20 text-blue-300 border-blue-500';
      case 'completed':
        return 'bg-purple-600/20 text-purple-300 border-purple-500';
      case 'cancelled':
        return 'bg-red-600/20 text-red-300 border-red-500';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-500';
    }
  };

  const formatStatusText = (status: string) => {
    if (status === 'registration_open') return t.tournament.cardStatusRegistering;
    if (status === 'registration_closed') return t.cards.statusRegClosed;
    if (status === 'scheduled') return t.tournament.cardStatusDraft; 
    if (status === 'ongoing') return t.tournament.cardStatusOngoing;
    if (status === 'completed') return t.tournament.cardStatusCompleted;
    if (status === 'cancelled') return t.tournament.cardStatusCancelled;
    return status.replace('_', ' ');
  };

  return (
    <div className="space-y-8 text-coc-font-primary">
      {/* 1. Banner & Header */}
      <section>
        <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl border-2 border-coc-border md:h-64 lg:h-80">
          <img
            src={tournament.bannerUrl}
            alt={`Banner ${tournament.title}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <span
              className={`mb-2 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusClasses()}`}
            >
              {formatStatusText(tournament.status)}
            </span>
            <h1 className="font-clash text-4xl font-bold leading-tight text-white md:text-5xl">
              {tournament.title}
            </h1>
          </div>
          <div className="flex-shrink-0">
            <RegisterButtonLogic tournament={tournament} t={t} />
          </div>
        </div>
      </section>

      {/* 2. Grid Info Detail */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={TrophyIcon}
          title={t.tournament.cardPrize}
          value={tournament.prizePool}
        />
        <InfoCard
          icon={ClockIcon}
          title={t.tournament.detail.infoStarts}
          value={`${formattedDate} WIB`}
        />
        <InfoCard
          icon={UsersIcon}
          title={t.tournament.detail.infoFormat}
          value={`${tournament.format} (${tournament.teamSize}v${tournament.teamSize})`}
        />
        <InfoCard
          icon={ShieldIcon}
          title={t.tournament.detail.infoTh}
          value={formatThRequirement(tournament.thRequirement)}
        />
        <InfoCard
          icon={UsersIcon}
          title={t.tournament.detail.infoParticipants}
          value={`${tournament.participantCountCurrent} / ${tournament.participantCount}`}
        />
        <InfoCard
          icon={UserIcon}
          title={t.tournament.detail.infoOrganizer}
          value={tournament.organizerName}
        />
        <InfoCard
          icon={ClockIcon}
          title={t.tournament.detail.infoRegStart}
          value={`${regStartDate} WIB`}
        />
        <InfoCard
          icon={ClockIcon}
          title={t.tournament.detail.infoRegEnd}
          value={`${regEndDate} WIB`}
        />
      </section>

      {/* 3. Deskripsi & Aturan */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Kolom Deskripsi */}
        <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:col-span-2">
          <h2 className="mb-4 font-clash text-2xl font-bold text-white">
            {t.tournament.detail.descTitle}
          </h2>
          <div className="prose prose-invert max-w-none text-coc-font-secondary">
            <p>{tournament.description}</p>
          </div>
        </div>

        {/* Kolom Aturan */}
        <div className="rounded-lg border border-coc-border bg-coc-dark-blue p-6 md:col-span-1">
          <h2 className="mb-4 flex items-center font-clash text-2xl font-bold text-white">
            <BookOpenIcon className="mr-2 h-6 w-6" />
            {t.tournament.detail.rulesTitle}
          </h2>
          <div className="prose prose-invert max-w-none text-coc-font-secondary">
            <p className="whitespace-pre-wrap">{tournament.rules}</p>
          </div>
        </div>
      </section>

      {/* 4. Bracket Display */}
      <BracketDisplay
        tournamentId={tournament.id}
        matches={matches}
        isLoading={isLoadingBracket}
        error={fetchError}
        t={t}
      />
    </div>
  );
};

export default TournamentDetailClient;