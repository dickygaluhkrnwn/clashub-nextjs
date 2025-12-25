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
    // onAction(t.tournamentManage.schedule.toastSaving.replace('{id}', match.matchId), 'info'); // Optional toast

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
    // onAction(t.tournamentManage.schedule.toastReporting.replace('{id}', match.matchId), 'info');

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
          <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
             <ShieldIcon className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-sm font-semibold text-gray-500 italic truncate">
            {t.tournamentManage.schedule.byeTbd}
          </p>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${isWinner ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
        <div className="relative w-8 h-8 flex-shrink-0">
           <Image
            src={team.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
            alt="Badge"
            fill
            className="object-contain drop-shadow-md"
           />
        </div>
        <p className={`text-sm font-bold truncate ${isWinner ? 'text-coc-gold' : 'text-white'}`}>
          {team.teamName}
        </p>
        {isWinner && <TrophyIcon className="h-4 w-4 text-coc-gold" />}
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
    <div className="rounded-xl bg-black/20 border border-white/5 p-4 hover:border-white/10 transition-colors">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-4">
         <span className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
            Match #{match.matchId}
         </span>
         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
            match.status === 'completed' ? 'bg-coc-green/10 text-coc-green border border-coc-green/20' :
            match.status === 'live' ? 'bg-coc-red/10 text-coc-red border border-coc-red/20 animate-pulse' :
            match.status === 'scheduled' ? 'bg-coc-blue/10 text-coc-blue border border-coc-blue/20' :
            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
         }`}>
            {match.status}
         </span>
      </div>

      {/* Teams VS */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 bg-white/5 rounded-lg p-3">
        <TeamDisplay team={match.team1} isWinner={winnerId === team1Id} />
        
        <div className="flex items-center gap-2 justify-center md:px-4">
           <div className="h-px w-8 bg-white/10 hidden md:block" />
           <span className="text-xs font-bold text-gray-600">VS</span>
           <div className="h-px w-8 bg-white/10 hidden md:block" />
        </div>

        <TeamDisplay team={match.team2} isWinner={winnerId === team2Id} />
      </div>

      {/* Actions / Status Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
        
        {/* Case 1: Pending -> Set Schedule */}
        {match.status === 'pending' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <Input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="bg-black/40 border-white/10 h-9 text-xs w-full sm:w-48"
              disabled={isScheduleLoading}
            />
            <Button
              variant="primary"
              size="sm"
              className="h-9 px-3 bg-coc-blue hover:bg-coc-blue/80"
              onClick={handleSaveSchedule}
              disabled={isScheduleLoading || !schedule}
              title={t.tournamentManage.schedule.btnSaveSchedule || "Save"}
            >
              {isScheduleLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Case 2: Scheduled/Live -> Report Winner */}
        {(match.status === 'scheduled' || match.status === 'live') && match.team1 && match.team2 && (
          <div className="flex flex-wrap gap-2 w-full justify-end">
            <span className="text-xs text-gray-500 font-bold uppercase self-center mr-2 hidden sm:block">
               {t.tournamentManage.schedule.setWinnerLabel || "Set Winner:"}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none border-white/10 hover:bg-coc-gold/10 hover:border-coc-gold/30 hover:text-coc-gold transition-colors text-xs"
              onClick={() => handleReportWinner(match.team1!.id)}
              disabled={isReporting}
            >
              {isReporting ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <TrophyIcon className="h-3 w-3 mr-1" />}
              {match.team1.teamName}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none border-white/10 hover:bg-coc-gold/10 hover:border-coc-gold/30 hover:text-coc-gold transition-colors text-xs"
              onClick={() => handleReportWinner(match.team2!.id)}
              disabled={isReporting}
            >
              {isReporting ? <Loader2Icon className="h-3 w-3 animate-spin mr-1" /> : <TrophyIcon className="h-3 w-3 mr-1" />}
              {match.team2.teamName}
            </Button>
          </div>
        )}

        {/* Case 3: Completed -> Show Result */}
        {(match.status === 'completed' || match.status === 'reported') && (
           <div className="flex items-center gap-2 text-coc-green bg-coc-green/5 px-3 py-1.5 rounded-lg border border-coc-green/10 w-full justify-center sm:w-auto">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm font-bold">
                 {t.tournamentManage.schedule.winnerLabel.replace('{team}', winnerName || 'N/A')}
              </span>
           </div>
        )}
        
        {/* Default Message if nothing to do */}
        {match.status !== 'pending' && 
         !(match.status === 'scheduled' || match.status === 'live') && 
         !(match.status === 'completed' || match.status === 'reported') && (
           <span className="text-xs text-gray-500 italic">No actions available</span>
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

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-coc-gold/10 rounded-lg">
           <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
        </div>
        <div>
           <h3 className="font-clash text-xl text-white">
             {t.tournamentManage.schedule.title}
           </h3>
           <p className="text-sm text-gray-400 font-sans">Atur jadwal dan laporkan hasil pertandingan.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 bg-white/5 rounded-2xl border border-white/5">
           <div className="text-center">
              <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Memuat jadwal pertandingan...</p>
           </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
             <InfoIcon className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.schedule.emptyTitle}
          </h3>
          <p className="text-gray-400 max-w-md text-sm">
            {t.tournamentManage.schedule.emptyDesc}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchMatches} className="mt-2">
            {t.tournamentManage.schedule.btnRetry}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
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