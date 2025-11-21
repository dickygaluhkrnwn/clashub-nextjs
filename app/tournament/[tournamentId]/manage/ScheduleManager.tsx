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
} from '@/app/components/icons';
import Image from 'next/image';
import { Input } from '@/app/components/ui/Input';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface ScheduleManagerProps {
  tournament: FirestoreDocument<Tournament>;
}

type FullMatchData = FirestoreDocument<TournamentMatch> & {
  team1: FirestoreDocument<TournamentTeam> | null;
  team2: FirestoreDocument<TournamentTeam> | null;
};

// Helper untuk memformat Date ke string datetime-local (YYYY-MM-DDTHH:MM)
const formatDateForInput = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Komponen Baris untuk setiap match
const MatchRow: React.FC<{
  match: FullMatchData;
  tournamentId: string;
  onAction: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh: () => void;
  t: any; // [BARU] Props translation
}> = ({ match, tournamentId, onAction, onRefresh, t }) => {
  const [schedule, setSchedule] = useState<string>(
    match.scheduledTime ? formatDateForInput(new Date(match.scheduledTime)) : '',
  );
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleSaveSchedule = async () => {
    if (!schedule || match.status !== 'pending') return;

    setIsScheduleLoading(true);
    onAction(t.tournamentManage.schedule.toastSaving.replace('{id}', match.matchId), 'info'); // [i18n]

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
    onAction(t.tournamentManage.schedule.toastReporting.replace('{id}', match.matchId), 'info'); // [i18n]

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

  // Tampilkan Tim 1
  const TeamDisplay: React.FC<{ team: FirestoreDocument<TournamentTeam> | null }> = ({
    team,
  }) => {
    if (!team) {
      return (
        <div className="flex items-center gap-2 flex-1">
          <ShieldIcon className="h-8 w-8 text-gray-600" />
          <p className="text-sm font-semibold text-gray-500 italic">
            {t.tournamentManage.schedule.byeTbd} {/* [i18n] */}
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 flex-1">
        <Image
          src={team.originClanBadgeUrl}
          alt="Badge"
          width={32}
          height={32}
          className="rounded-md object-cover"
        />
        <p className="text-sm font-semibold text-white truncate">
          {team.teamName}
        </p>
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
    <li className="flex flex-col md:flex-row items-center p-4 gap-3 bg-coc-dark/40">
      {/* Info Match (Tim vs Tim) */}
      <div className="w-full flex-grow flex items-center gap-2">
        <span className="text-xs font-mono text-gray-400 p-1 bg-coc-stone-dark rounded-md">
          {match.matchId}
        </span>
        <TeamDisplay team={match.team1} />
        <span className="text-sm font-bold text-coc-gold/80 mx-2">VS</span>
        <TeamDisplay team={match.team2} />
      </div>

      {/* Logika Aksi */}
      <div className="w-full md:w-auto flex-shrink-0 flex items-center gap-2 justify-end" style={{minWidth: '220px'}}>
        
        {/* 1. Status: PENDING (Set Jadwal) */}
        {match.status === 'pending' && (
          <>
            <Input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="bg-coc-dark/70 h-9 text-xs w-full md:w-auto"
              disabled={isScheduleLoading}
            />
            <Button
              variant="primary"
              size="sm"
              className="!p-2 h-9 w-9"
              onClick={handleSaveSchedule}
              disabled={isScheduleLoading || !schedule}
            >
              {isScheduleLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* 2. Status: SCHEDULED atau LIVE (Tombol Lapor Pemenang) */}
        {(match.status === 'scheduled' || match.status === 'live') &&
          match.team1 &&
          match.team2 && (
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs justify-center"
                onClick={() => handleReportWinner(match.team1!.id)}
                disabled={isReporting}
              >
                {isReporting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <TrophyIcon className="h-4 w-4 text-coc-gold" />
                )}
                <span className="ml-2 truncate">
                  {t.tournamentManage.schedule.setWinner.replace('{team}', match.team1.teamName)} {/* [i18n] */}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs justify-center"
                onClick={() => handleReportWinner(match.team2!.id)}
                disabled={isReporting}
              >
                {isReporting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <TrophyIcon className="h-4 w-4 text-coc-gold" />
                )}
                <span className="ml-2 truncate">
                  {t.tournamentManage.schedule.setWinner.replace('{team}', match.team2.teamName)} {/* [i18n] */}
                </span>
              </Button>
            </div>
          )}
        
        {/* 3. Status: COMPLETED atau REPORTED (Tampilkan Pemenang) */}
        {(match.status === 'completed' || match.status === 'reported') && (
           <div className="flex items-center gap-2 text-green-400">
             <CheckCircleIcon className="h-5 w-5" />
             <p className="text-sm font-semibold">
               {t.tournamentManage.schedule.winnerLabel.replace('{team}', winnerName || 'N/A')} {/* [i18n] */}
             </p>
           </div>
        )}

        {/* 4. Fallback */}
        {match.status !== 'pending' &&
          !(match.status === 'scheduled' || match.status === 'live') &&
          !(match.status === 'completed' || match.status === 'reported') &&
          (
          <div className="text-right">
             <p className="text-sm font-semibold text-gray-400 capitalize">
               {t.tournamentManage.schedule.statusLabel.replace('{status}', match.status)} {/* [i18n] */}
             </p>
           </div>
          )
        }
        
      </div>
    </li>
  );
};

// Komponen Utama
const ScheduleManager: React.FC<ScheduleManagerProps> = ({ tournament }) => {
  const { t } = useLanguage(); // [BARU] Init Hook
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
    return null;
  }

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-coc-gold-dark/30">
      <Notification notification={notification ?? undefined} />

      <div className="flex items-center gap-3">
        <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
        <h3 className="font-clash text-xl text-white">
          {t.tournamentManage.schedule.title} {/* [i18n] */}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
        </div>
      ) : matches.length === 0 ? (
        <div className="card-stone flex flex-col items-center justify-center gap-4 p-10 text-center rounded-lg border border-coc-gold-dark/20">
          <InfoIcon className="h-12 w-12 text-coc-gold/50" />
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.schedule.emptyTitle} {/* [i18n] */}
          </h3>
          <p className="text-gray-400 max-w-md">
            {t.tournamentManage.schedule.emptyDesc} {/* [i18n] */}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchMatches} className="mt-3">
            {t.tournamentManage.schedule.btnRetry} {/* [i18n] */}
          </Button>
        </div>
      ) : (
        <div className="card-stone rounded-lg overflow-hidden border border-coc-gold-dark/30">
          <ul className="divide-y divide-coc-gold-dark/30">
            {matches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                tournamentId={tournament.id}
                onAction={showNotification}
                onRefresh={fetchMatches}
                t={t} // [BARU]
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;