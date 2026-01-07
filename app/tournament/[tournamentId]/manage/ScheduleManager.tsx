'use client';

import React, { useState, useEffect } from 'react';
import {
  FirestoreDocument,
  Tournament,
  TournamentMatch,
  TournamentTeam,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  InfoIcon,
  CalendarCheck2Icon,
  SaveIcon,
  ShieldIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon
} from '@/app/components/icons';
import Image from 'next/image';
import { Input } from '@/app/components/ui/Input';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ScheduleManagerProps {
  tournament: FirestoreDocument<Tournament>;
}

type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

// Helper Format Date for Input
const formatDateForInput = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Komponen Baris Match
const MatchRow: React.FC<{
  match: FullMatchData;
  tournamentId: string;
  onAction: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh: () => void;
  t: any;
}> = ({ match, tournamentId, onAction, onRefresh, t }) => {
  const [schedule, setSchedule] = useState<string>(
    match.scheduledTime ? formatDateForInput(new Date(match.scheduledTime)) : '',
  );
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleSaveSchedule = async () => {
    if (!schedule || match.status !== 'pending') return;

    setIsScheduleLoading(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/manage/match/${match.matchId}/schedule`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledTime: new Date(schedule) }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      onAction(result.message || t.common.success, 'success');
      onRefresh();
    } catch (error: any) {
      onAction(error.message, 'error');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleReportWinner = async (winnerTeamId: string) => {
    setIsReporting(true);

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/manage/match/${match.matchId}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winnerTeamId }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t.common.error);

      onAction(result.message || t.common.success, 'success');
      onRefresh();
    } catch (error: any) {
      onAction(error.message, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  const TeamDisplay: React.FC<{ team: FirestoreDocument<TournamentTeam> | null; isWinner?: boolean }> = ({
    team, isWinner
  }) => {
    if (!team) {
      return (
        <div className="flex items-center gap-3 flex-1 min-w-0 opacity-50">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <ShieldIcon className="h-5 w-5 text-gray-500" />
          </div>
          <p className="text-sm font-bold text-gray-500 italic truncate uppercase tracking-wider">
            {t.tournamentManage.schedule.byeTbd}
          </p>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg transition-colors ${isWinner ? 'bg-coc-gold/10 border border-coc-gold/20' : 'hover:bg-white/5 border border-transparent'}`}>
        <div className="relative w-10 h-10 flex-shrink-0 bg-[#0a0a0b] rounded-lg p-0.5 shadow-sm border border-white/5">
           <Image
            src={team.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt="Badge"
            fill
            className="object-contain drop-shadow-md"
           />
        </div>
        <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate font-clash tracking-wide ${isWinner ? 'text-coc-gold' : 'text-white'}`}>
            {team.teamName}
            </p>
            {isWinner && <p className="text-[9px] text-coc-gold/70 uppercase font-bold tracking-widest">Winner</p>}
        </div>
        {isWinner && <TrophyIcon className="h-5 w-5 text-coc-gold drop-shadow-sm" />}
      </div>
    );
  };

  const winnerId = match.winnerTeamRef?.id;
  const team1Id = match.team1?.id;
  const team2Id = match.team2?.id;
  const winnerName =
    winnerId === team1Id
      ? match.team1?.teamName
      : winnerId === team2Id
        ? match.team2?.teamName
        : null;

  return (
    <div className="rounded-2xl bg-[#0f1115] border border-white/5 p-5 hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md group/card relative overflow-hidden">
      {/* Status Bar Accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          match.status === 'completed' ? 'bg-coc-green' : 
          match.status === 'live' ? 'bg-coc-red' : 
          match.status === 'scheduled' ? 'bg-coc-blue' : 
          'bg-gray-600'
      }`} />

      {/* Match Header */}
      <div className="flex items-center justify-between mb-5 pl-3">
         <span className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-widest bg-[#0a0a0b] px-2 py-1 rounded border border-white/5">
            Match #{match.matchId}
         </span>
         <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border shadow-sm ${
            match.status === 'completed' ? 'bg-coc-green/10 text-coc-green border-coc-green/30' :
            match.status === 'live' ? 'bg-coc-red/10 text-coc-red border-coc-red/30 animate-pulse' :
            match.status === 'scheduled' ? 'bg-coc-blue/10 text-coc-blue border-coc-blue/30' :
            'bg-gray-500/10 text-gray-400 border-gray-500/30'
         }`}>
            {match.status}
         </span>
      </div>

      {/* Teams VS */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 bg-[#0a0a0b] rounded-xl p-4 border border-white/5 shadow-inner mx-2">
        <TeamDisplay team={match.team1} isWinner={winnerId === team1Id} />
        
        <div className="flex items-center gap-2 justify-center md:px-2 opacity-50">
           <div className="h-px w-6 bg-white/20 hidden md:block" />
           <span className="text-xs font-bold text-gray-500 font-clash">VS</span>
           <div className="h-px w-6 bg-white/20 hidden md:block" />
        </div>

        <TeamDisplay team={match.team2} isWinner={winnerId === team2Id} />
      </div>

      {/* Actions / Status Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 pl-2">
        
        {/* Case 1: Pending -> Set Schedule */}
        {match.status === 'pending' && (
          <div className="flex items-center gap-3 w-full sm:w-auto bg-[#0a0a0b] p-1 rounded-xl border border-white/5 pr-2">
            <div className="p-2 bg-white/5 rounded-lg text-gray-500">
                <ClockIcon className="h-4 w-4" />
            </div>
            <Input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="bg-transparent border-none h-8 text-xs w-full sm:w-40 p-0 focus:ring-0"
              disabled={isScheduleLoading}
            />
            <Button
              variant="primary"
              size="sm"
              className="h-8 px-3 text-xs bg-coc-blue hover:bg-coc-blue/80 shadow-none border-none"
              onClick={handleSaveSchedule}
              disabled={isScheduleLoading || !schedule}
              title={t.tournamentManage.schedule.btnSaveSchedule || "Save"}
            >
              {isScheduleLoading ? <Loader2Icon className="h-3 w-3 animate-spin" /> : <SaveIcon className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {/* Case 2: Scheduled/Live -> Report Winner */}
        {(match.status === 'scheduled' || match.status === 'live') && match.team1 && match.team2 && (
          <div className="flex flex-wrap gap-3 w-full justify-end items-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block bg-[#0a0a0b] px-2 py-1 rounded">
               {t.tournamentManage.schedule.setWinnerLabel || "Declare Winner"}
            </span>
            <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-coc-gold/10 hover:border-coc-gold/50 hover:text-coc-gold transition-colors text-xs h-8"
                onClick={() => handleReportWinner(match.team1!.id)}
                disabled={isReporting}
                >
                {isReporting ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <TrophyIcon className="h-3 w-3 mr-1" />}
                {match.team1.teamName}
                </Button>
                <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-coc-gold/10 hover:border-coc-gold/50 hover:text-coc-gold transition-colors text-xs h-8"
                onClick={() => handleReportWinner(match.team2!.id)}
                disabled={isReporting}
                >
                {isReporting ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <TrophyIcon className="h-3 w-3 mr-1" />}
                {match.team2.teamName}
                </Button>
            </div>
          </div>
        )}

        {/* Case 3: Completed -> Show Result */}
        {(match.status === 'completed' || match.status === 'reported') && (
           <div className="flex items-center gap-2 text-coc-green bg-[#0a0a0b] px-4 py-2 rounded-xl border border-coc-green/20 w-full justify-center sm:w-auto shadow-sm">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                 Winner: <span className="text-white ml-1">{winnerName || 'N/A'}</span>
              </span>
           </div>
        )}
        
        {/* Default Message if nothing to do */}
        {match.status !== 'pending' && 
         !(match.status === 'scheduled' || match.status === 'live') && 
         !(match.status === 'completed' || match.status === 'reported') && (
           <span className="text-[10px] text-gray-600 italic bg-[#0a0a0b] px-3 py-1 rounded-lg">No actions available</span>
        )}

      </div>
    </div>
  );
};

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ tournament }) => {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<FullMatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/matches`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      setMatches(result.matches || []);
    } catch (error: any) {
      showNotification(error.message, 'error');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tournament.status === 'ongoing' || tournament.status === 'completed') {
      fetchMatches();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id, tournament.status]);

  if (
    tournament.status === 'draft' ||
    tournament.status === 'registration_open' ||
    tournament.status === 'registration_closed'
  ) {
    return null; // Komponen ini hanya muncul saat bracket sudah ada
  }

  return (
    <div className="space-y-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-2">
      <Notification notification={notification ?? undefined} />

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
            <h3 className="font-clash text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
                </div>
                {t.tournamentManage.schedule.title}
            </h3>
            <p className="text-gray-400 text-sm mt-2 font-sans max-w-md">Atur jadwal pertandingan dan laporkan hasil untuk melanjutkan bracket turnamen.</p>
        </div>
        
        <div className="bg-[#15171e] px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Total Matches</p>
            <p className="text-xl font-clash font-bold text-white leading-none">{matches.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-60 bg-[#15171e]/50 rounded-3xl border border-white/5">
           <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold mb-4 opacity-50" />
           <p className="text-gray-500 text-sm font-clash tracking-widest uppercase">Loading Schedule...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-16 text-center bg-[#15171e]/50 rounded-3xl border border-white/5 border-dashed">
          <div className="w-20 h-20 bg-[#0a0a0b] rounded-full flex items-center justify-center mb-2 border border-white/5 shadow-inner">
             <InfoIcon className="h-10 w-10 text-gray-600 opacity-50" />
          </div>
          <h3 className="font-clash text-xl text-white font-bold tracking-wide">
            {t.tournamentManage.schedule.emptyTitle}
          </h3>
          <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
            {t.tournamentManage.schedule.emptyDesc}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchMatches} className="mt-4 shadow-lg">
            {t.tournamentManage.schedule.btnRetry}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 bg-[#15171e]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-coc-blue/5 rounded-full blur-[60px] pointer-events-none" />
           {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              tournamentId={tournament.id}
              onAction={showNotification}
              onRefresh={fetchMatches}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;