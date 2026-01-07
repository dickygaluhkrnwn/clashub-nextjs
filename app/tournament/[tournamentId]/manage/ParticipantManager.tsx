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
            border: 'border-coc-green/30'
        };
      case 'rejected':
        return { 
            text: t.tournamentManage.partStatusRejected, 
            color: 'text-coc-red', 
            bg: 'bg-coc-red/10',
            border: 'border-coc-red/30'
        };
      case 'pending':
      default:
        return { 
            text: t.tournamentManage.partStatusPending, 
            color: 'text-yellow-400', 
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30'
        };
    }
  };

  const statusInfo = getStatusInfo(team.status);

  const handleUpdateStatus = async (
    teamId: string,
    newStatus: 'approved' | 'rejected',
  ) => {
    setIsLoading(true);

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
    <div className="rounded-2xl border border-white/5 bg-[#0f1115] overflow-hidden hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-md group/card">
      {/* Baris Utama (Ringkasan Tim) */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center p-5 gap-5 cursor-pointer sm:cursor-default relative"
        onClick={() => window.innerWidth < 640 && setIsExpanded(!isExpanded)} 
      >
        {/* Active Status Accent Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${team.status === 'approved' ? 'bg-coc-green' : team.status === 'rejected' ? 'bg-coc-red' : 'bg-yellow-500'} opacity-50`} />

        {/* Info Tim */}
        <div className="flex items-center gap-4 flex-grow min-w-0 pl-2">
           <div className="relative w-14 h-14 flex-shrink-0 bg-[#0a0a0b] rounded-xl border border-white/5 p-1 shadow-inner">
              <Image
                src={team.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
                alt="Badge"
                fill
                className="object-contain drop-shadow-md"
              />
           </div>
           <div className="min-w-0">
              <h4 className="text-lg font-bold text-white truncate font-clash tracking-wide group-hover/card:text-coc-gold transition-colors">
                {team.teamName}
              </h4>
              <p className="text-xs text-gray-500 font-mono truncate flex items-center gap-1 mt-0.5">
                 <ShieldIcon className="w-3 h-3" />
                 {team.originClanTag}
              </p>
           </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-none border-white/5 pt-4 sm:pt-0">
          
          <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${statusInfo.color} ${statusInfo.bg} ${statusInfo.border}`}>
             {statusInfo.text}
          </div>

          {team.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="!p-2 h-10 w-10 !bg-coc-green hover:!bg-coc-green/80 shadow-lg shadow-coc-green/20 border-coc-green/50"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(team.id, 'approved'); }}
                disabled={isLoading}
                title={t.clanRequests.actionAccept}
              >
                {isLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <CheckIcon className="h-5 w-5 stroke-[3px]" />}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="!p-2 h-10 w-10 shadow-lg shadow-coc-red/20 border-coc-red/50"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(team.id, 'rejected'); }}
                disabled={isLoading}
                title={t.clanRequests.actionReject}
              >
                {isLoading ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <XIcon className="h-5 w-5 stroke-[3px]" />}
              </Button>
            </div>
          )}

          {/* Toggle Expand (Desktop mostly) */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
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
        <div className="bg-[#0a0a0b]/50 p-6 border-t border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
          <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <UsersIcon className="h-3 w-3" />
             {t.tournamentManage.partMembers} <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{team.members.length}</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.members.map((member) => (
              <div
                key={member.playerTag}
                className="flex items-center gap-3 p-3 bg-[#15171e] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={getThImage(member.townHallLevel)}
                    alt={`TH ${member.townHallLevel}`}
                    fill
                    className="object-contain drop-shadow"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-200 truncate font-clash">
                    {member.playerName}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-500 font-mono truncate">
                        {member.playerTag}
                    </p>
                    <span className="text-[9px] bg-coc-gold/10 text-coc-gold px-1.5 rounded border border-coc-gold/20 font-bold">
                        TH{member.townHallLevel}
                    </span>
                  </div>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <Notification notification={notification ?? undefined} />

      {/* Header & Statistik */}
      <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
         {/* Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-coc-gold/5 rounded-full blur-[60px] pointer-events-none" />
         
         <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
            <div>
               <h3 className="font-clash text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                 <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    <UsersIcon className="h-6 w-6 text-coc-gold" />
                 </div>
                 {t.tournamentManage.partTitle}
               </h3>
               <p className="text-gray-400 text-sm mt-2 font-sans max-w-md leading-relaxed">
                  Kelola pendaftaran tim. Setujui tim yang memenuhi syarat dan tolak yang tidak sesuai.
               </p>
            </div>
            
            <div className="flex gap-3">
               <div className="bg-coc-green/10 border border-coc-green/20 px-5 py-3 rounded-xl text-center min-w-[110px] shadow-lg">
                  <p className="text-3xl font-clash font-bold text-white leading-none">
                     {approvedCount} <span className='text-sm text-gray-400 font-sans font-normal opacity-70'>/ {tournament.participantCount}</span>
                  </p>
                  <p className="text-[10px] font-bold text-coc-green uppercase tracking-widest mt-1.5">{t.tournamentManage.partApproved}</p>
               </div>
               <div className="bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-xl text-center min-w-[110px] shadow-lg">
                  <p className="text-3xl font-clash font-bold text-white leading-none">{pendingCount}</p>
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-1.5">{t.tournamentManage.partPending}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Daftar Peserta */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-60 bg-[#15171e]/50 rounded-3xl border border-white/5">
           <Loader2Icon className="h-12 w-12 animate-spin text-coc-gold mb-4 opacity-50" />
           <p className="text-gray-500 text-sm font-clash tracking-widest uppercase">Syncing Squad Data...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-16 text-center bg-[#15171e]/50 rounded-3xl border border-white/5 border-dashed">
          <div className="w-20 h-20 bg-[#0a0a0b] rounded-full flex items-center justify-center mb-2 border border-white/5 shadow-inner">
             <InfoIcon className="h-10 w-10 text-gray-600 opacity-50" />
          </div>
          <h3 className="font-clash text-xl text-white font-bold tracking-wide">
            {t.tournamentManage.partEmptyTitle}
          </h3>
          <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
            {t.tournamentManage.partEmptyDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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