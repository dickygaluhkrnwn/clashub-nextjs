'use client';

// File: app/tournament/[tournamentId]/manage/ScheduleManager.tsx
// Deskripsi: [FASE 6 DIEDIT] Komponen untuk mengatur jadwal DAN melaporkan pemenang.

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
  ShieldIcon, // Untuk 'BYE'
  TrophyIcon, // [FASE 6] Ikon untuk tombol lapor pemenang
  CheckCircleIcon, // [FASE 6] Ikon untuk status selesai
} from '@/app/components/icons';
import Image from 'next/image';
import { Input } from '@/app/components/ui/Input'; // Kita pakai input standar

interface ScheduleManagerProps {
  tournament: FirestoreDocument<Tournament>;
}

// Tipe data gabungan untuk menampilkan info tim di match
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
}> = ({ match, tournamentId, onAction, onRefresh }) => {
  const [schedule, setSchedule] = useState<string>(
    match.scheduledTime ? formatDateForInput(new Date(match.scheduledTime)) : '',
  );
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  
  // --- [BARU FASE 6] ---
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  // --- [AKHIR BARU FASE 6] ---

  const handleSaveSchedule = async () => {
    if (!schedule || match.status !== 'pending') return;

    setIsScheduleLoading(true);
    onAction(`Menyimpan jadwal untuk Match ${match.matchId}...`, 'info');

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

      onAction(result.message, 'success');
      onRefresh(); // Refresh daftar match
    } catch (error: any) {
      onAction(error.message, 'error');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  // --- [BARU FASE 6] ---
  /**
   * @function handleReportWinner
   * @description Memanggil API untuk melaporkan pemenang match.
   */
  const handleReportWinner = async (winnerTeamId: string) => {
    setIsReporting(true);
    setReportError(null);
    onAction(`Melaporkan pemenang untuk Match ${match.matchId}...`, 'info');

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
      if (!response.ok) throw new Error(result.error || 'Gagal melaporkan pemenang.');

      onAction(result.message, 'success');
      onRefresh(); // Refresh daftar match untuk update bracket
    } catch (error: any) {
      setReportError(error.message);
      onAction(error.message, 'error');
    } finally {
      setIsReporting(false);
    }
  };
  // --- [AKHIR BARU FASE 6] ---


  // Tampilkan Tim 1
  const TeamDisplay: React.FC<{ team: FirestoreDocument<TournamentTeam> | null }> = ({
    team,
  }) => {
    if (!team) {
      return (
        <div className="flex items-center gap-2 flex-1">
          <ShieldIcon className="h-8 w-8 text-gray-600" />
          <p className="text-sm font-semibold text-gray-500 italic">BYE / TBD</p>
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

  // --- [EDIT FASE 6] ---
  // Menentukan status pemenang untuk tampilan
  const winnerId = match.winnerTeamRef?.id;
  const team1Id = match.team1?.id;
  const team2Id = match.team2?.id;
  const winnerName =
    winnerId === team1Id
      ? match.team1?.teamName
      : winnerId === team2Id
        ? match.team2?.teamName
        : null;
  // --- [AKHIR EDIT FASE 6] ---

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

      {/* --- [ROMBAK TOTAL FASE 6] ---
        Logika Aksi (Input Jadwal ATAU Lapor Pemenang) 
      */}
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
                <span className="ml-2 truncate">Set {match.team1.teamName} Wins</span>
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
                <span className="ml-2 truncate">Set {match.team2.teamName} Wins</span>
              </Button>
            </div>
          )}
        
        {/* 3. Status: COMPLETED atau REPORTED (Tampilkan Pemenang) */}
        {(match.status === 'completed' || match.status === 'reported') && (
           <div className="flex items-center gap-2 text-green-400">
             <CheckCircleIcon className="h-5 w-5" />
             <p className="text-sm font-semibold">
               Pemenang: {winnerName || 'N/A'}
             </p>
           </div>
        )}

        {/* 4. Fallback (Misal: BYE match atau status aneh) */}
        {match.status !== 'pending' &&
         !(match.status === 'scheduled' || match.status === 'live') &&
         !(match.status === 'completed' || match.status === 'reported') &&
         (
          <div className="text-right">
             <p className="text-sm font-semibold text-gray-400 capitalize">
               Status: {match.status}
             </p>
           </div>
         )
        }
        
      </div>
      {/* --- [AKHIR ROMBAK FASE 6] --- */}

    </li>
  );
};

// Komponen Utama
const ScheduleManager: React.FC<ScheduleManagerProps> = ({ tournament }) => {
  const [matches, setMatches] = useState<FullMatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // Fungsi untuk Fetch Daftar Match
  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      // Panggil API route yang sudah kita buat
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/matches`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengambil daftar match.');
      }

      setMatches(result.matches || []);
    } catch (error: any) {
      showNotification(error.message, 'error');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect untuk fetch data saat komponen dimuat
  useEffect(() => {
    // Hanya fetch jika status turnamen sudah 'ongoing'
    if (tournament.status === 'ongoing' || tournament.status === 'completed') {
      fetchMatches();
    } else {
      setIsLoading(false); // Jangan loading jika bracket belum dibuat
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id, tournament.status]);

  // Jangan render apapun jika bracket belum dibuat
  if (
    tournament.status === 'draft' ||
    tournament.status === 'registration_open' ||
    tournament.status === 'registration_closed'
  ) {
    return null; // Komponen ini hanya aktif setelah bracket dibuat
  }

  return (
    <div className="space-y-6 mt-8 pt-6 border-t border-coc-gold-dark/30">
      <Notification notification={notification ?? undefined} />

      <div className="flex items-center gap-3">
        <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
        <h3 className="font-clash text-xl text-white">
          Manajemen Jadwal & Hasil Pertandingan
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
            Data Match Tidak Ditemukan
          </h3>
          <p className="text-gray-400 max-w-md">
            Data match untuk turnamen ini belum ada atau gagal dimuat.
          </p>
          <Button variant="secondary" size="sm" onClick={fetchMatches} className="mt-3">
            Coba Muat Ulang
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
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;