'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronRightIcon,
  AlertTriangleIcon
} from '@/app/components/icons';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface TournamentDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
}

type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

// --- Sub-components (Inline for cleaner file structure) ---

const InfoCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
}> = ({ icon: Icon, title, value }) => (
  <div className="flex items-start rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 p-5 hover:border-coc-gold/30 transition-all duration-300 group">
    <div className="mr-4 p-2 bg-white/5 rounded-full group-hover:bg-coc-gold/20 transition-colors">
       <Icon className="h-6 w-6 flex-shrink-0 text-coc-gold" />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 group-hover:text-coc-gold/70 transition-colors">
        {title}
      </p>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

const RegisterButtonLogic: React.FC<{
  tournament: FirestoreDocument<Tournament>;
  t: any;
}> = ({ tournament, t }) => {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  const handleRegisterClick = () => {
    router.push(`/tournament/${tournament.id}/register`);
  };

  if (userProfile && userProfile.uid === tournament.organizerUid) {
    return (
      <Button
        size="lg"
        variant="secondary"
        href={`/tournament/${tournament.id}/manage`}
        className="shadow-lg shadow-black/40 border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10"
      >
        <CogsIcon className="mr-2 h-5 w-5" />
        {t.tournament.detail.manageBtn}
      </Button>
    );
  }

  if (loading) {
    return (
      <Button size="lg" disabled className="opacity-70">
        <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
        {t.tournament.detail.loadingBtn}
      </Button>
    );
  }

  if (tournament.status !== 'registration_open') {
    let closedMessage = t.tournament.detail.regClosedBtn;
    if (tournament.status === 'scheduled') {
      closedMessage = t.tournament.detail.regNotOpenBtn;
    } else if (['ongoing', 'completed', 'cancelled'].includes(tournament.status)) {
      closedMessage = t.tournament.detail.endedBtn;
    }

    return (
      <Button size="lg" variant="secondary" disabled className="bg-white/5 border-white/10 text-gray-400">
        {closedMessage}
      </Button>
    );
  }

  if (!userProfile) {
    return (
      <Button size="lg" variant="primary" href="/auth" className="shadow-lg shadow-coc-gold/20">
        {t.tournament.detail.loginBtn}
      </Button>
    );
  }

  if (!userProfile.isVerified) {
    return (
      <Button size="lg" variant="secondary" disabled className="opacity-70 cursor-not-allowed">
        {t.tournament.detail.verifyBtn}
      </Button>
    );
  }

  return (
    <Button size="lg" variant="primary" onClick={handleRegisterClick} className="shadow-lg shadow-coc-gold/20 font-bold tracking-wide">
      {t.tournament.detail.registerBtn} <ChevronRightIcon className="ml-2 h-4 w-4" />
    </Button>
  );
};

const TeamDisplay: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  isWinner: boolean;
}> = ({ team, isWinner }) => {
  if (!team) {
    return (
      <div className="flex items-center space-x-3 opacity-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <span className="text-xs font-bold text-gray-500">-</span>
        </div>
        <span className="font-mono text-sm font-semibold text-gray-500">BYE</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 transition-opacity ${isWinner ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
      <div className={`relative h-8 w-8 rounded-full overflow-hidden border ${isWinner ? 'border-coc-gold shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'border-white/10'}`}>
         {/* Fallback image logic can be added here */}
         <img
           className="h-full w-full object-cover"
           src={team.originClanBadgeUrl}
           alt={`${team.teamName} badge`}
         />
      </div>
      <span
        className={`font-clash text-sm md:text-base ${
          isWinner ? 'text-coc-gold font-bold' : 'text-gray-300 font-medium'
        }`}
      >
        {team.teamName}
      </span>
      {isWinner && <TrophyIcon className="h-4 w-4 text-coc-gold animate-pulse" />}
    </div>
  );
};

const MatchCard: React.FC<{
  match: FullMatchData;
  tournamentId: string;
  t: any;
}> = ({ match, tournamentId, t }) => {
  const { team1, team2, winnerTeamRef, matchId, status } = match;

  const isTeam1Winner = winnerTeamRef?.path === team1?.id;
  const isTeam2Winner = winnerTeamRef?.path === team2?.id;

  let statusText = 'Pending';
  let statusColor = 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  
  if (status === 'completed' || status === 'reported') {
    statusText = t.tournament.cardStatusCompleted; 
    statusColor = 'text-green-400 bg-green-400/10 border-green-400/20';
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-red-400 bg-red-400/10 border-red-400/20 animate-pulse';
  } else if (status === 'scheduled' && match.scheduledTime) {
    const scheduleDate = new Date(match.scheduledTime);
    if (!isNaN(scheduleDate.getTime())) {
      statusText = format(scheduleDate, 'dd/MM HH:mm');
      statusColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    } else {
      statusText = t.tournament.detail.matchScheduled;
      statusColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  }

  return (
    <Link
      href={`/tournament/${tournamentId}/match/${match.id}`}
      className="block rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 transition-all hover:-translate-y-1 hover:border-coc-gold/30 hover:bg-black/40 hover:shadow-lg group"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          MATCH #{matchId}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
           {statusText}
        </span>
      </div>
      
      <div className="space-y-4">
        <TeamDisplay team={team1} isWinner={isTeam1Winner} />

        <div className="flex items-center pl-4 opacity-50">
          <div className="h-px w-full bg-white/10" />
          <span className="mx-2 text-xs font-bold text-gray-600">VS</span>
          <div className="h-px w-full bg-white/10" />
        </div>

        <TeamDisplay team={team2} isWinner={isTeam2Winner} />
      </div>
    </Link>
  );
};

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
    <div className="w-full">
      <h3 className="mb-6 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
         <SwordsIcon className="h-6 w-6 text-coc-gold" /> {title}
      </h3>
      <div className="space-y-8 relative">
        {/* Connector Line Logic could be added here for visualization */}
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <div key={round} className="relative">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-coc-gold/70 pl-2 border-l-2 border-coc-gold/30">
              {t.tournament.detail.roundPrefix} {round}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

const BracketDisplay: React.FC<{
  tournamentId: string;
  matches: FullMatchData[];
  isLoading: boolean;
  error: string | null;
  t: any;
}> = ({ tournamentId, matches, isLoading, error, t }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-16 text-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold mb-4" />
        <p className="text-lg text-gray-400 font-clash tracking-wide">
          {t.tournament.detail.bracketLoading}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-red-500/30 bg-red-900/10 p-12 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-lg font-bold text-red-400">{t.tournament.detail.bracketError}</p>
        <p className="text-sm text-red-300/70 mt-1">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-16 text-center">
        <TrophyIcon className="h-12 w-12 text-gray-600 mx-auto mb-4 opacity-50" />
        <p className="text-lg text-gray-400 font-clash">
          {t.tournament.detail.bracketEmpty}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {t.tournament.detail.bracketEmptyDesc}
        </p>
      </div>
    );
  }

  const upperBracketMatches = matches.filter((m) => m.bracket === 'upper');
  const lowerBracketMatches = matches.filter((m) => m.bracket === 'lower');

  return (
    <section className="space-y-12 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md p-6 md:p-10 shadow-2xl">
      <BracketColumn
        title={t.tournament.detail.bracketUpper}
        matches={upperBracketMatches}
        tournamentId={tournamentId}
        t={t}
      />
      {lowerBracketMatches.length > 0 && (
        <>
          <div className="border-t border-white/10" />
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

// --- Main Component ---

const TournamentDetailClient: React.FC<TournamentDetailClientProps> = ({
  tournament,
}) => {
  const { t } = useLanguage(); 
  
  const [matches, setMatches] = useState<FullMatchData[]>([]);
  const [isLoadingBracket, setIsLoadingBracket] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const formatThRequirement = useCallback((th: ThRequirement): string => {
    if (th.type === 'any') return `TH ${th.minLevel} - ${th.maxLevel}`;
    if (th.type === 'uniform') return `${t.tournament.detail.thUniform} ${th.allowedLevels[0]}`;
    if (th.type === 'mixed') return `${t.tournament.detail.thMixed} ${th.allowedLevels.join(', ')}`;
    return 'N/A';
  }, [t]);

  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setIsLoadingBracket(true);
        setFetchError(null);
        const response = await fetch(`/api/tournaments/${tournament.id}/bracket`);
        if (!response.ok) throw new Error('Failed to fetch bracket data.');
        const data: { matches: FullMatchData[] } = await response.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        console.error('Error fetching bracket:', err);
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

  const formattedDate = format(new Date(tournament.tournamentStartsAt), 'dd MMM yyyy - HH:mm');
  const regStartDate = format(new Date(tournament.registrationStartsAt), 'dd MMM - HH:mm');
  const regEndDate = format(new Date(tournament.registrationEndsAt), 'dd MMM - HH:mm');

  const getStatusClasses = () => {
    switch (tournament.status) {
      case 'registration_open': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'registration_closed': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'ongoing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse';
      case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
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
    <div className="relative min-h-screen text-white font-clash">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 space-y-10 pb-20">
        
        {/* 1. Hero Section (Banner & Header) */}
        <section className="relative">
           {/* Banner Image with Overlay */}
           <div className="relative mb-8 h-56 w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl md:h-80 lg:h-96 group">
             <img
               src={tournament.bannerUrl}
               alt={`Banner ${tournament.title}`}
               className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-coc-dark via-coc-dark/50 to-transparent" />
             
             {/* Floating Badge on Banner */}
             <div className="absolute top-6 right-6">
                <span className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg ${getStatusClasses()}`}>
                   {formatStatusText(tournament.status)}
                </span>
             </div>
           </div>

           {/* Title & Action */}
           <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end px-2">
             <div className="flex-1 space-y-2">
               <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl drop-shadow-xl">
                 {tournament.title}
               </h1>
               <div className="flex items-center gap-2 text-coc-gold font-medium">
                  <UserIcon className="h-5 w-5" /> 
                  <span className="text-gray-300">Organized by</span> {tournament.organizerName}
               </div>
             </div>
             <div className="flex-shrink-0 w-full md:w-auto">
               <RegisterButtonLogic tournament={tournament} t={t} />
             </div>
           </div>
        </section>

        {/* 2. Info Grid (Stats) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
           {/* Combined Reg Dates for cleaner look */}
          <InfoCard
            icon={ClockIcon}
            title="Registration"
            value={`${regStartDate} - ${regEndDate}`}
          />
        </section>

        {/* 3. Detail Content (Desc & Rules) */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Deskripsi */}
          <div className="lg:col-span-2 space-y-6">
             <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md p-8 shadow-xl">
               <h2 className="mb-6 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                  <BookOpenIcon className="h-6 w-6 text-coc-blue" />
                  {t.tournament.detail.descTitle}
               </h2>
               <div className="prose prose-invert max-w-none text-gray-300 font-sans leading-relaxed">
                 <p className="whitespace-pre-line">{tournament.description}</p>
               </div>
             </div>
          </div>

          {/* Aturan */}
          <div className="lg:col-span-1 space-y-6">
             <div className="rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md p-8 shadow-xl h-full">
               <h2 className="mb-6 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                  <ShieldIcon className="h-6 w-6 text-coc-red" />
                  {t.tournament.detail.rulesTitle}
               </h2>
               <div className="prose prose-invert max-w-none text-gray-400 font-sans text-sm">
                 <p className="whitespace-pre-wrap">{tournament.rules}</p>
               </div>
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
    </div>
  );
};

export default TournamentDetailClient;