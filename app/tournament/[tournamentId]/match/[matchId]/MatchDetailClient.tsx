'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  FirestoreDocument,
  Tournament,
  TournamentTeam,
  CocCurrentWar,
} from '@/lib/clashub.types';
import { SerializableFullMatchData } from './page';
import { Button } from '@/app/components/ui/Button';
import {
  ArrowLeftIcon,
  Loader2Icon,
  ShieldIcon,
  SwordsIcon,
  AlertTriangleIcon,
  LinkIcon,
  ClockIcon,
  TrophyIcon
} from '@/app/components/icons';
import CurrentWarDisplay from '@/app/components/war/CurrentWarDisplay';
import { useLanguage } from '@/lib/hooks/useLanguage';

type FullMatchData = SerializableFullMatchData;

interface MatchDetailClientProps {
  tournament: FirestoreDocument<Tournament>;
  initialMatchData: FullMatchData;
  initialWarData: CocCurrentWar | null;
}

// --- Sub-components ---

const MatchHeader: React.FC<{
  match: FullMatchData;
  tournamentTitle: string;
  t: any;
}> = ({ match, tournamentTitle, t }) => {
  const router = useRouter();
  const { team1, team2, matchId } = match;

  return (
    <div className="mb-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 text-gray-400 hover:text-white pl-0"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        {t.tournament.detail.btnBackToBracket}
      </Button>

      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
         {/* Background Ambience */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
         
         <p className="text-sm font-bold uppercase tracking-widest text-coc-gold mb-2 relative z-10">
           {tournamentTitle} • Match #{matchId}
         </p>

         <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative z-10 mt-6">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-4">
               <div className="relative w-20 h-20 md:w-24 md:h-24">
                  {/* Glow Effect Team 1 */}
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                  <img
                    src={team1?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                    alt={team1?.teamName || 'TBD'}
                    className="relative w-full h-full object-contain drop-shadow-xl"
                  />
               </div>
               <h2 className="text-2xl md:text-3xl font-clash font-bold text-white">
                  {team1?.teamName || 'TBD'}
               </h2>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
               <SwordsIcon className="h-12 w-12 text-gray-600 mb-2" />
               <span className="text-4xl font-clash font-bold text-gray-500/50">VS</span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-4">
               <div className="relative w-20 h-20 md:w-24 md:h-24">
                  {/* Glow Effect Team 2 */}
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                  <img
                    src={team2?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                    alt={team2?.teamName || 'TBD'}
                    className="relative w-full h-full object-contain drop-shadow-xl"
                  />
               </div>
               <h2 className="text-2xl md:text-3xl font-clash font-bold text-white">
                  {team2?.teamName || 'TBD'}
               </h2>
            </div>
         </div>
      </div>
    </div>
  );
};

const MatchStatusInfo: React.FC<{ match: FullMatchData, t: any }> = ({ match, t }) => {
  const { status, scheduledTime, round, bracket } = match;

  let statusText = 'Pending';
  let statusColor = 'text-gray-400 bg-white/5 border-white/5';
  
  if (status === 'completed' || status === 'reported') {
    statusText = t.tournament.cardStatusCompleted; 
    statusColor = 'text-green-400 bg-green-500/10 border-green-500/20';
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse';
  } else if (status === 'scheduled' && scheduledTime) {
    statusText = format(new Date(scheduledTime), 'dd/MM/yy - HH:mm');
    statusColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  } else {
    statusText = t.tournament.match.matchPending;
  }

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className={`rounded-xl p-4 border flex flex-col items-center justify-center text-center ${statusColor}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
          {t.tournament.detail.labelStatus}
        </p>
        <p className="text-lg font-bold font-clash">{statusText}</p>
      </div>
      
      <div className="rounded-xl p-4 border border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelSchedule}
        </p>
        <p className="text-lg font-bold text-white font-clash">
          {scheduledTime ? format(new Date(scheduledTime), 'HH:mm') : '-'}
        </p>
      </div>

      <div className="rounded-xl p-4 border border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelBracket}
        </p>
        <p className="text-lg font-bold text-white font-clash capitalize">
          {bracket}
        </p>
      </div>

      <div className="rounded-xl p-4 border border-white/5 bg-black/20 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelRound}
        </p>
        <p className="text-lg font-bold text-white font-clash">{round}</p>
      </div>
    </div>
  );
};

const TeamCheckInCard: React.FC<{
  team: FirestoreDocument<TournamentTeam> | null;
  assignedClanTag: string | null;
  t: any;
  label: string;
}> = ({ team, assignedClanTag, t, label }) => {
  if (!team) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center flex flex-col items-center justify-center h-full">
        <ShieldIcon className="h-10 w-10 text-gray-600 mb-3" />
        <h3 className="font-clash text-lg font-bold text-gray-500">
          {t.tournament.match.byeTitle}
        </h3>
      </div>
    );
  }

  const clanLink = assignedClanTag
    ? `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${assignedClanTag.replace('#','')}`
    : '#';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="relative w-12 h-12">
            <img
            src={team.originClanBadgeUrl}
            alt={team.teamName}
            className="w-full h-full object-contain drop-shadow-md"
            />
        </div>
        <div>
          <p className="text-xs font-bold text-coc-gold uppercase tracking-wider">{label}</p>
          <h3 className="font-clash text-2xl font-bold text-white leading-none mt-1">
            {team.teamName}
          </h3>
        </div>
      </div>

      <div className="flex-grow space-y-3 mb-6">
        {team.members.map((member) => (
          <div key={member.playerTag} className="flex items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
               <ShieldIcon className="h-4 w-4 text-gray-500" />
               <span className="font-bold text-gray-200 text-sm">{member.playerName}</span>
            </div>
            <span className="text-xs font-mono text-coc-gold font-bold bg-coc-gold/10 px-2 py-0.5 rounded border border-coc-gold/20">
               TH{member.townHallLevel}
            </span>
          </div>
        ))}
      </div>

      {/* Assignment Status */}
      <div className="mt-auto">
         {assignedClanTag ? (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
               <p className="text-xs text-blue-300 font-bold uppercase mb-2">{t.tournament.match.assignmentTitle}</p>
               <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-bold">{assignedClanTag}</span>
                  <a href={clanLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-white transition-colors">
                     <LinkIcon className="h-4 w-4" />
                  </a>
               </div>
            </div>
         ) : (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3">
               <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
               <p className="text-xs text-yellow-200 font-medium leading-tight">
                  {t.tournament.match.assignmentWaiting}
               </p>
            </div>
         )}
      </div>
    </div>
  );
};

const LiveWarTracker: React.FC<{
  match: FullMatchData;
  initialWarData: CocCurrentWar | null;
  t: any;
}> = ({ match, initialWarData, t }) => {
  const [warData] = useState(initialWarData);
  const isPending = !initialWarData && match.status !== 'pending' && match.status !== 'scheduled';

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-yellow-500/30 bg-yellow-900/10 p-10 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-yellow-500 mb-3" />
        <p className="font-bold text-yellow-200 text-lg">{t.tournament.match.waitingLive}</p>
        <p className="text-sm text-yellow-200/70 mt-1">{t.tournament.match.waitingDesc}</p>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
      <ClockIcon className="h-10 w-10 text-gray-600 mb-3" />
      <p className="text-lg font-clash text-white">{t.tournament.match.notStartedTitle}</p>
      <p className="text-sm text-gray-500 mt-1">{t.tournament.match.notStartedDesc}</p>
    </div>
  );
};

// --- Main Component ---

const MatchDetailClient: React.FC<MatchDetailClientProps> = ({
  tournament,
  initialMatchData,
  initialWarData,
}) => {
  const { t } = useLanguage();
  const [matchData] = useState<FullMatchData>(initialMatchData);

  const isLiveOrScheduled = ['live', 'scheduled', 'reported', 'completed'].includes(matchData.status);

  return (
    <div className="relative min-h-screen text-white font-clash">
       {/* Ambient BG */}
       <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />

       <div className="relative z-10 pb-20">
          <MatchHeader match={matchData} tournamentTitle={tournament.title} t={t} />
          
          <MatchStatusInfo match={matchData} t={t} />

          {isLiveOrScheduled && (
             <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-1.5 h-8 bg-coc-gold rounded-full" />
                   <h2 className="text-2xl font-bold text-white">Live War Arena</h2>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-1 shadow-2xl overflow-hidden">
                   <LiveWarTracker match={matchData} initialWarData={initialWarData} t={t} />
                </div>
             </section>
          )}

          <section>
             <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-coc-blue rounded-full" />
                <h2 className="text-2xl font-bold text-white">Lineups & Assignments</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TeamCheckInCard team={matchData.team1} assignedClanTag={matchData.team1AssignedClanTag} t={t} label="TEAM 1" />
                <TeamCheckInCard team={matchData.team2} assignedClanTag={matchData.team2AssignedClanTag} t={t} label="TEAM 2" />
             </div>
          </section>
       </div>
    </div>
  );
};

export default MatchDetailClient;