'use client';

import React, { useState, useEffect } from 'react';
import {
  FirestoreDocument,
  Tournament,
  TournamentTeam,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  InfoIcon,
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
  AlertTriangleIcon,
  ShieldIcon
} from '@/app/components/icons';
import Image from 'next/image';
import { getThImage } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ParticipantManagerProps {
  tournament: FirestoreDocument<Tournament>;
}

// Komponen Baris untuk setiap tim
const ParticipantRow: React.FC<{
  team: FirestoreDocument<TournamentTeam>;
  tournamentId: string;
  onAction: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh: () => void;
  t: any;
}> = ({ team, tournamentId, onAction, onRefresh, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusInfo = (
    status: TournamentTeam['status'],
  ): { text: string; color: string; bg: string; border: string } => {
    switch (status) {
      case 'approved':
        return { 
            text: t.tournamentManage.partStatusApproved, 
            color: 'text-coc-green', 
            bg: 'bg-coc-green/10',
            border: 'border-coc-green/20'
        };
      case 'rejected':
        return { 
            text: t.tournamentManage.partStatusRejected, 
            color: 'text-coc-red', 
            bg: 'bg-coc-red/10',
            border: 'border-coc-red/20'
        };
      case 'pending':
      default:
        return { 
            text: t.tournamentManage.partStatusPending, 
            color: 'text-yellow-400', 
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20'
        };
    }
  };

  const statusInfo = getStatusInfo(team.status);

  const handleUpdateStatus = async (
    teamId: string,
    newStatus: 'approved' | 'rejected',
  ) => {
    setIsLoading(true);
    // onAction(`${t.tournamentManage.partToastUpdating} (${team.teamName})`, 'info'); // Optional toast

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/manage/participant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: teamId, newStatus: newStatus }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      onAction(result.message || t.common.success, 'success');
      onRefresh();
    } catch (error: any) {
      onAction(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-black/20 overflow-hidden hover:border-white/10 transition-all duration-200">
      {/* Baris Utama (Ringkasan Tim) */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center p-4 gap-4 cursor-pointer sm:cursor-default"
        onClick={() => window.innerWidth < 640 && setIsExpanded(!isExpanded)} // Mobile toggle on row click
      >
        
        {/* Info Tim */}
        <div className="flex items-center gap-4 flex-grow min-w-0">
           <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={team.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                alt="Badge"
                fill
                className="object-contain drop-shadow-md"
              />
           </div>
           <div className="min-w-0">
              <h4 className="text-base md:text-lg font-bold text-white truncate font-clash">
                {team.teamName}
              </h4>
              <p className="text-xs text-gray-400 font-mono truncate flex items-center gap-1">
                 <ShieldIcon className="w-3 h-3" />
                 {team.originClanTag}
              </p>
           </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-none border-white/5 pt-3 sm:pt-0">
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusInfo.color} ${statusInfo.bg} ${statusInfo.border}`}>
             {statusInfo.text}
          </div>

          {team.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="!p-2 h-9 w-9 !bg-coc-green hover:!bg-coc-green/80 shadow-lg shadow-coc-green/20"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(team.id, 'approved'); }}
                disabled={isLoading}
                title={t.clanRequests.actionAccept}
              >
                {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="!p-2 h-9 w-9 shadow-lg shadow-coc-red/20"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(team.id, 'rejected'); }}
                disabled={isLoading}
                title={t.clanRequests.actionReject}
              >
                {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <XIcon className="h-5 w-5" />}
              </Button>
            </div>
          )}

          {/* Toggle Expand (Desktop mostly) */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Detail Anggota (Dropdown) */}
      {isExpanded && (
        <div className="bg-black/40 p-4 border-t border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <UsersIcon className="h-3 w-3" />
             {t.tournamentManage.partMembers} ({team.members.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.members.map((member) => (
              <div
                key={member.playerTag}
                className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={getThImage(member.townHallLevel)}
                    alt={`TH ${member.townHallLevel}`}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-200 truncate">
                    {member.playerName}
                  </p>
                  <p className="text-[10px] text-coc-gold font-mono truncate">
                    {member.playerTag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen Utama
const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  tournament,
}) => {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<FirestoreDocument<TournamentTeam>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/participants`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.clanEsports.toastFetchError);
      }

      setTeams(result || []);
    } catch (error: any) {
      showNotification(error.message, 'error');
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id]);

  const pendingCount = teams.filter((t) => t.status === 'pending').length;
  const approvedCount = teams.filter((t) => t.status === 'approved').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Notification notification={notification ?? undefined} />

      {/* Header & Statistik */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
           <h3 className="font-clash text-2xl font-bold text-white flex items-center gap-3">
             <UsersIcon className="h-6 w-6 text-coc-gold" />
             {t.tournamentManage.partTitle}
           </h3>
           <p className="text-gray-400 text-sm mt-1 font-sans">Kelola pendaftaran tim untuk turnamen ini.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-coc-green/10 border border-coc-green/20 px-4 py-2 rounded-xl text-center min-w-[100px]">
            <p className="text-2xl font-clash font-bold text-white leading-none">
                {approvedCount} <span className='text-sm text-gray-400 font-sans'>/ {tournament.participantCount}</span>
            </p>
            <p className="text-[10px] font-bold text-coc-green uppercase tracking-wider mt-1">{t.tournamentManage.partApproved}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl text-center min-w-[100px]">
            <p className="text-2xl font-clash font-bold text-white leading-none">{pendingCount}</p>
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mt-1">{t.tournamentManage.partPending}</p>
          </div>
        </div>
      </div>

      {/* Daftar Peserta */}
      {isLoading ? (
        <div className="flex justify-center items-center h-60 bg-white/5 rounded-2xl border border-white/5">
           <div className="text-center">
              <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Mengambil data peserta...</p>
           </div>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
             <InfoIcon className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.partEmptyTitle}
          </h3>
          <p className="text-gray-400 max-w-md text-sm leading-relaxed">
            {t.tournamentManage.partEmptyDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <ParticipantRow
              key={team.id}
              team={team}
              tournamentId={tournament.id}
              onAction={showNotification}
              onRefresh={fetchParticipants}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantManager;