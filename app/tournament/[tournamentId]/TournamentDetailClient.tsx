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
  <div className="flex items-start rounded-2xl bg-[#15171e]/80 backdrop-blur-md border border-white/10 p-5 hover:border-coc-gold/30 transition-all duration-300 group shadow-lg hover:-translate-y-1">
    <div className="mr-4 p-3 bg-[#0a0a0b] rounded-xl border border-white/5 group-hover:border-coc-gold/20 transition-colors shadow-inner">
       <Icon className="h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-coc-gold transition-colors" />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 group-hover:text-gray-400 transition-colors">
        {title}
      </p>
      <p className="text-lg font-bold text-white leading-tight font-clash tracking-wide">{value}</p>
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
        className="shadow-[0_0_20px_rgba(255,215,0,0.1)] border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10 w-full md:w-auto font-bold tracking-wide"
      >
        <CogsIcon className="mr-2 h-5 w-5" />
        {t.tournament.detail.manageBtn}
      </Button>
    );
  }

  if (loading) {
    return (
      <Button size="lg" disabled className="opacity-70 w-full md:w-auto">
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
      <Button size="lg" variant="secondary" disabled className="bg-white/5 border-white/10 text-gray-500 w-full md:w-auto cursor-not-allowed">
        {closedMessage}
      </Button>
    );
  }

  if (!userProfile) {
    return (
      <Button size="lg" variant="primary" href="/auth" className="shadow-[0_0_20px_rgba(255,215,0,0.3)] w-full md:w-auto font-bold tracking-wide">
        {t.tournament.detail.loginBtn}
      </Button>
    );
  }

  if (!userProfile.isVerified) {
    return (
      <Button size="lg" variant="secondary" disabled className="opacity-70 cursor-not-allowed w-full md:w-auto border-coc-red/30 text-coc-red bg-coc-red/10">
        <AlertTriangleIcon className="mr-2 h-5 w-5" />
        {t.tournament.detail.verifyBtn}
      </Button>
    );
  }

  return (
    <Button size="lg" variant="primary" onClick={handleRegisterClick} className="shadow-[0_0_30px_rgba(74,222,128,0.3)] bg-gradient-to-b from-coc-green to-green-700 border-green-800 hover:from-green-500 hover:to-coc-green font-bold tracking-wide w-full md:w-auto transform hover:-translate-y-1 transition-all">
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
      <div className="flex items-center space-x-3 opacity-40">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs font-bold text-gray-500">-</span>
        </div>
        <span className="font-mono text-sm font-bold text-gray-500 tracking-widest">BYE</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 transition-all p-2 rounded-xl ${isWinner ? 'bg-coc-gold/10 border border-coc-gold/20' : 'hover:bg-white/5 border border-transparent'}`}>
      <div className={`relative h-10 w-10 rounded-xl overflow-hidden border-2 shadow-md ${isWinner ? 'border-coc-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-[#1a1d26]'}`}>
         {/* Fallback image logic */}
         <img
           className="h-full w-full object-cover bg-[#0a0a0b]"
           src={team.originClanBadgeUrl}
           alt={`${team.teamName} badge`}
           onError={(e) => { e.currentTarget.style.display = 'none'; }}
         />
      </div>
      <div className="flex-1 min-w-0">
          <span
            className={`font-clash text-sm md:text-base truncate block leading-tight ${
              isWinner ? 'text-coc-gold font-bold' : 'text-gray-200 font-medium'
            }`}
          >
            {team.teamName}
          </span>
          {isWinner && <p className="text-[9px] text-coc-gold/70 uppercase font-bold tracking-wider">Winner</p>}
      </div>
      {isWinner && <TrophyIcon className="h-5 w-5 text-coc-gold animate-bounce drop-shadow-md" />}
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
    statusColor = 'text-coc-green bg-coc-green/10 border-coc-green/20';
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-coc-red bg-coc-red/10 border-coc-red/20 animate-pulse';
  } else if (status === 'scheduled' && match.scheduledTime) {
    const scheduleDate = new Date(match.scheduledTime);
    if (!isNaN(scheduleDate.getTime())) {
      statusText = format(scheduleDate, 'dd/MM HH:mm');
      statusColor = 'text-coc-blue bg-coc-blue/10 border-coc-blue/20';
    } else {
      statusText = t.tournament.detail.matchScheduled;
      statusColor = 'text-coc-blue bg-coc-blue/10 border-coc-blue/20';
    }
  }

  return (
    <Link
      href={`/tournament/${tournamentId}/match/${match.id}`}
      className="block rounded-2xl border border-white/5 bg-[#0f1115] p-5 transition-all hover:-translate-y-1 hover:border-coc-gold/30 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-coc-gold transition-colors" />
      
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-coc-gold transition-colors">
          MATCH #{matchId}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
           {statusText}
        </span>
      </div>
      
      <div className="space-y-3 relative z-10">
        <TeamDisplay team={team1} isWinner={isTeam1Winner} />

        <div className="flex items-center pl-4 py-1 opacity-40">
          <div className="h-px w-full bg-white/20" />
          <span className="mx-3 text-[10px] font-bold text-gray-400 font-mono">VS</span>
          <div className="h-px w-full bg-white/20" />
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
      <h3 className="mb-8 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-wider">
          <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
             <SwordsIcon className="h-6 w-6 text-coc-gold" />
          </div>
          {title}
      </h3>
      
      {/* Scrollable Container for Rounds */}
      <div className="overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-8 min-w-max">
            {Object.entries(groupedMatches).map(([round, roundMatches]) => (
              <div key={round} className="w-[300px] flex-shrink-0">
                <div className="mb-6 flex items-center gap-2">
                    <span className="h-px w-8 bg-coc-gold/50" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-coc-gold">
                      {t.tournament.detail.roundPrefix} {round}
                    </h4>
                    <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-col gap-4">
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
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#15171e]/50 p-20 text-center animate-pulse">
        <Loader2Icon className="h-16 w-16 animate-spin text-coc-gold mb-6 opacity-50" />
        <p className="text-xl text-white font-clash tracking-widest uppercase">
          {t.tournament.detail.bracketLoading}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-900/10 p-16 text-center">
        <AlertTriangleIcon className="h-16 w-16 text-coc-red mx-auto mb-6 opacity-80" />
        <p className="text-xl font-bold text-white font-clash mb-2">{t.tournament.detail.bracketError}</p>
        <p className="text-sm text-gray-400 font-mono">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-[#15171e]/50 p-20 text-center flex flex-col items-center">
        <div className="p-6 bg-[#0a0a0b] rounded-full border border-white/5 mb-6 shadow-inner">
           <TrophyIcon className="h-16 w-16 text-gray-600 opacity-30" />
        </div>
        <p className="text-2xl text-white font-clash font-bold tracking-wide mb-2">
          {t.tournament.detail.bracketEmpty}
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          {t.tournament.detail.bracketEmptyDesc}
        </p>
      </div>
    );
  }

  const upperBracketMatches = matches.filter((m) => m.bracket === 'upper');
  const lowerBracketMatches = matches.filter((m) => m.bracket === 'lower');

  return (
    <section className="space-y-12 rounded-3xl border border-white/10 bg-[#15171e]/90 backdrop-blur-xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-coc-gold via-coc-red to-transparent opacity-30" />
      
      <BracketColumn
        title={t.tournament.detail.bracketUpper}
        matches={upperBracketMatches}
        tournamentId={tournamentId}
        t={t}
      />
      {lowerBracketMatches.length > 0 && (
        <>
          <div className="border-t border-white/5" />
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
      case 'registration_open': return 'bg-coc-green/20 text-coc-green border-coc-green/40 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
      case 'scheduled': return 'bg-coc-blue/20 text-coc-blue border-coc-blue/40';
      case 'registration_closed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'ongoing': return 'bg-coc-red/20 text-coc-red border-coc-red/40 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
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
    <div className="relative min-h-screen bg-[#0a0a0b] text-white font-clash overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[400px] h-[400px] bg-coc-gold/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-12">
        
        {/* 1. Hero Section (Banner & Header) */}
        <section className="relative">
            {/* Banner Image with Overlay */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden border-b-4 border-coc-gold/50 shadow-2xl group">
              <img
                src={tournament.bannerUrl}
                alt={`Banner ${tournament.title}`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-transparent to-transparent opacity-80" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-16">
                  <div className="container mx-auto px-4 md:px-8">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg mb-6 ${getStatusClasses()}`}>
                        <TrophyIcon className="h-4 w-4 fill-current" />
                        {formatStatusText(tournament.status)}
                      </span>

                      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
                          <div className="max-w-3xl space-y-4">
                              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-none text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight">
                                {tournament.title}
                              </h1>
                              
                              <div className="flex items-center gap-3 text-sm md:text-base font-sans font-medium">
                                <div className="flex items-center gap-2 bg-[#0a0a0b]/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-gray-300">
                                   <UserIcon className="h-4 w-4 text-coc-gold" /> 
                                   <span>Organized by <span className="text-white font-bold">{tournament.organizerName}</span></span>
                                </div>
                              </div>
                          </div>

                          <div className="w-full lg:w-auto flex-shrink-0">
                              <RegisterButtonLogic tournament={tournament} t={t} />
                          </div>
                      </div>
                  </div>
              </div>
            </div>
        </section>

        <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-12 -mt-10 relative z-20">
            {/* 2. Info Grid (Stats) - Floating Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
                  <div className="rounded-3xl border border-white/10 bg-[#15171e]/90 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-coc-blue" />
                    <h2 className="mb-6 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-wide">
                      <div className="p-2 bg-coc-blue/10 rounded-lg border border-coc-blue/20">
                          <BookOpenIcon className="h-6 w-6 text-coc-blue" />
                      </div>
                      {t.tournament.detail.descTitle}
                    </h2>
                    <div className="prose prose-invert max-w-none text-gray-300 font-sans leading-relaxed tracking-wide">
                      <p className="whitespace-pre-line">{tournament.description}</p>
                    </div>
                  </div>
              </div>

              {/* Aturan */}
              <div className="lg:col-span-1 space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[#15171e]/90 backdrop-blur-xl p-8 shadow-2xl h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-coc-red" />
                    <h2 className="mb-6 font-clash text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4 uppercase tracking-wide">
                      <div className="p-2 bg-coc-red/10 rounded-lg border border-coc-red/20">
                         <ShieldIcon className="h-6 w-6 text-coc-red" />
                      </div>
                      {t.tournament.detail.rulesTitle}
                    </h2>
                    <div className="prose prose-invert max-w-none text-gray-400 font-sans text-sm leading-relaxed">
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
    </div>
  );
};

export default TournamentDetailClient;