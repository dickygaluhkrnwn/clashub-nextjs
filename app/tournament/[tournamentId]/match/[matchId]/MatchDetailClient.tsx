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
  TrophyIcon,
  CheckIcon,
  UserIcon,
  UsersIcon
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
      {/* Tombol Kembali ke Bracket dihapus sesuai permintaan */}

      <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden text-center group">
         {/* Background Ambience */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-r from-transparent via-coc-gold/5 to-transparent pointer-events-none" />
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50" />
         
         <p className="text-xs font-bold uppercase tracking-[0.2em] text-coc-gold mb-8 relative z-10 drop-shadow-md">
           {tournamentTitle} • Match #{matchId}
         </p>

         <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative z-10">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-6 group/team1">
               <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-500 group-hover/team1:scale-110">
                 {/* Glow Effect Team 1 */}
                 <div className="absolute inset-0 bg-coc-blue/20 rounded-full blur-2xl animate-pulse-slow" />
                 <img
                   src={team1?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                   alt={team1?.teamName || 'TBD'}
                   className="relative w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                 />
               </div>
               <h2 className="text-2xl md:text-3xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-md">
                  {team1?.teamName || 'TBD'}
               </h2>
               {team1 && (
                  <div className="px-3 py-1 bg-coc-blue/10 border border-coc-blue/20 rounded-lg text-coc-blue text-[10px] font-bold uppercase tracking-wider">
                     Team 1
                  </div>
               )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center">
               <div className="relative">
                   <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                   <SwordsIcon className="h-16 w-16 text-gray-500 mb-2 relative z-10" />
               </div>
               <span className="text-4xl md:text-5xl font-clash font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-700 drop-shadow-sm">VS</span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-6 group/team2">
               <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-500 group-hover/team2:scale-110">
                 {/* Glow Effect Team 2 */}
                 <div className="absolute inset-0 bg-coc-red/20 rounded-full blur-2xl animate-pulse-slow" />
                 <img
                   src={team2?.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                   alt={team2?.teamName || 'TBD'}
                   className="relative w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                 />
               </div>
               <h2 className="text-2xl md:text-3xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-md">
                  {team2?.teamName || 'TBD'}
               </h2>
               {team2 && (
                  <div className="px-3 py-1 bg-coc-red/10 border border-coc-red/20 rounded-lg text-coc-red text-[10px] font-bold uppercase tracking-wider">
                     Team 2
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

const MatchStatusInfo: React.FC<{ match: FullMatchData, t: any }> = ({ match, t }) => {
  const { status, scheduledTime, round, bracket } = match;

  let statusText = 'Pending';
  let statusColor = 'text-gray-400 bg-white/5 border-white/10';
  let statusIcon = <ClockIcon className="h-5 w-5" />;
  
  if (status === 'completed' || status === 'reported') {
    statusText = t.tournament.cardStatusCompleted; 
    statusColor = 'text-coc-green bg-coc-green/10 border-coc-green/30 shadow-[0_0_15px_rgba(74,222,128,0.1)]';
    statusIcon = <CheckIcon className="h-5 w-5 stroke-[3px]" />;
  } else if (status === 'live') {
    statusText = t.tournament.cardStatusOngoing;
    statusColor = 'text-coc-red bg-coc-red/10 border-coc-red/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    statusIcon = <SwordsIcon className="h-5 w-5" />;
  } else if (status === 'scheduled' && scheduledTime) {
    const scheduleDate = new Date(scheduledTime);
    if (!isNaN(scheduleDate.getTime())) {
      statusText = format(scheduleDate, 'dd/MM - HH:mm');
      statusColor = 'text-coc-blue bg-coc-blue/10 border-coc-blue/30';
    } else {
      statusText = t.tournament.detail.matchScheduled;
      statusColor = 'text-coc-blue bg-coc-blue/10 border-coc-blue/30';
    }
  } else {
    statusText = t.tournament.match.matchPending;
  }

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center transition-all ${statusColor}`}>
        <div className="mb-2 opacity-80">{statusIcon}</div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
          {t.tournament.detail.labelStatus}
        </p>
        <p className="text-lg font-bold font-clash tracking-wide uppercase">{statusText}</p>
      </div>
      
      <div className="rounded-2xl p-4 border border-white/10 bg-[#0f1115] text-center hover:bg-[#15171e] transition-colors">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelSchedule}
        </p>
        <p className="text-lg font-bold text-white font-clash tracking-wide">
          {scheduledTime ? format(new Date(scheduledTime), 'HH:mm') : '-'}
        </p>
      </div>

      <div className="rounded-2xl p-4 border border-white/10 bg-[#0f1115] text-center hover:bg-[#15171e] transition-colors">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelBracket}
        </p>
        <p className="text-lg font-bold text-white font-clash capitalize tracking-wide text-coc-gold">
          {bracket}
        </p>
      </div>

      <div className="rounded-2xl p-4 border border-white/10 bg-[#0f1115] text-center hover:bg-[#15171e] transition-colors">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
          {t.tournament.detail.labelRound}
        </p>
        <p className="text-lg font-bold text-white font-clash tracking-wide">{round}</p>
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
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center flex flex-col items-center justify-center h-full min-h-[250px]">
        <ShieldIcon className="h-12 w-12 text-gray-600 mb-4 opacity-50" />
        <h3 className="font-clash text-lg font-bold text-gray-500 uppercase tracking-widest">
          {t.tournament.match.byeTitle}
        </h3>
      </div>
    );
  }

  const clanLink = assignedClanTag
    ? `https://link.clashofclans.com/en?action=OpenClanProfile&tag=${assignedClanTag.replace('#','')}`
    : '#';

  return (
    <div className="rounded-3xl border border-white/10 bg-[#15171e]/80 backdrop-blur-md p-6 h-full flex flex-col shadow-xl relative overflow-hidden group">
      {/* Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${label === 'TEAM 1' ? 'bg-coc-blue' : 'bg-coc-red'} opacity-50`} />
      
      <div className="mb-6 flex items-center gap-5 border-b border-white/10 pb-6">
        <div className="relative w-14 h-14 bg-[#0a0a0b] rounded-xl border border-white/5 p-1 shadow-inner">
            <img
            src={team.originClanBadgeUrl}
            alt={team.teamName}
            className="w-full h-full object-contain drop-shadow-md"
            />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${label === 'TEAM 1' ? 'text-coc-blue' : 'text-coc-red'}`}>
              {label}
          </p>
          <h3 className="font-clash text-2xl font-bold text-white leading-none tracking-wide">
            {team.teamName}
          </h3>
        </div>
      </div>

      <div className="flex-grow space-y-3 mb-8">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Squad Roster</p>
        <div className="space-y-2">
            {team.members.map((member) => (
            <div key={member.playerTag} className="flex items-center justify-between rounded-xl bg-[#0a0a0b] p-3 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/5 rounded-lg">
                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <span className="font-bold text-gray-200 text-sm">{member.playerName}</span>
                </div>
                <span className="text-[10px] font-mono text-coc-gold font-bold bg-coc-gold/10 px-2 py-1 rounded border border-coc-gold/20">
                TH {member.townHallLevel}
                </span>
            </div>
            ))}
        </div>
      </div>

      {/* Assignment Status */}
      <div className="mt-auto pt-4 border-t border-white/10">
         {assignedClanTag ? (
            <div className="rounded-xl bg-coc-blue/10 border border-coc-blue/30 p-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
               <div className="flex items-center justify-between mb-1">
                   <p className="text-[10px] text-coc-blue font-bold uppercase tracking-widest">Clan Assigned</p>
                   <LinkIcon className="h-3 w-3 text-coc-blue" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="font-mono text-white font-bold text-sm tracking-wide">{assignedClanTag}</span>
                  <a href={clanLink} target="_blank" rel="noopener noreferrer" className="text-xs text-coc-blue hover:text-white transition-colors underline underline-offset-2">
                      Open In-Game
                  </a>
               </div>
            </div>
         ) : (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3">
               <AlertTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 animate-pulse" />
               <div>
                  <p className="text-xs text-yellow-200 font-bold uppercase tracking-wide mb-0.5">Waiting for Clan</p>
                  <p className="text-[10px] text-yellow-200/70 leading-tight">Admin will assign a clan tag soon.</p>
               </div>
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
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-yellow-500/30 bg-yellow-900/10 p-12 text-center">
        <div className="p-4 bg-yellow-500/10 rounded-full mb-4 animate-pulse">
            <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="font-bold text-yellow-200 text-xl font-clash uppercase tracking-wide mb-2">{t.tournament.match.waitingLive}</p>
        <p className="text-sm text-yellow-200/70 max-w-md mx-auto">{t.tournament.match.waitingDesc}</p>
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
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0a0a0b]/50 p-16 text-center">
      <ClockIcon className="h-12 w-12 text-gray-600 mb-4 opacity-50" />
      <p className="text-xl font-clash text-white font-bold uppercase tracking-wide">{t.tournament.match.notStartedTitle}</p>
      <p className="text-sm text-gray-500 mt-2">{t.tournament.match.notStartedDesc}</p>
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
       <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
       <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-coc-red/5 rounded-full blur-[120px] pointer-events-none z-0" />

       <div className="relative z-10 pb-20 container mx-auto px-4 md:px-8 max-w-7xl pt-6">
          <MatchHeader match={matchData} tournamentTitle={tournament.title} t={t} />
          
          <MatchStatusInfo match={matchData} t={t} />

          {isLiveOrScheduled && (
             <section className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                      <TrophyIcon className="h-6 w-6 text-coc-gold" />
                   </div>
                   <h2 className="text-2xl md:text-3xl font-bold text-white font-clash uppercase tracking-wide">Live War Arena</h2>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#15171e]/90 backdrop-blur-xl p-1 shadow-2xl overflow-hidden relative">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-red via-coc-gold to-coc-blue opacity-50 z-10" />
                   <LiveWarTracker match={matchData} initialWarData={initialWarData} t={t} />
                </div>
             </section>
          )}

          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-coc-blue/10 rounded-lg border border-coc-blue/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                   <UsersIcon className="h-6 w-6 text-coc-blue" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white font-clash uppercase tracking-wide">Lineups & Assignments</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TeamCheckInCard team={matchData.team1} assignedClanTag={matchData.team1AssignedClanTag} t={t} label="TEAM 1" />
                <TeamCheckInCard team={matchData.team2} assignedClanTag={matchData.team2AssignedClanTag} t={t} label="TEAM 2" />
             </div>
          </section>
       </div>
    </div>
  );
};

export default MatchDetailClient;