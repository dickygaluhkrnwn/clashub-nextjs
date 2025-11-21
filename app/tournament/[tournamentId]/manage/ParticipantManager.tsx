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
} from '@/app/components/icons';
import Image from 'next/image';
import { getThImage } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

interface ParticipantManagerProps {
  tournament: FirestoreDocument<Tournament>;
}

// Komponen Baris untuk setiap tim
const ParticipantRow: React.FC<{
  team: FirestoreDocument<TournamentTeam>;
  tournamentId: string;
  onAction: (message: string, type: 'success' | 'error' | 'info') => void;
  onRefresh: () => void;
  t: any; // [BARU] Props translation
}> = ({ team, tournamentId, onAction, onRefresh, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // [i18n] Status helper
  const getStatusInfo = (
    status: TournamentTeam['status'],
  ): { text: string; color: string } => {
    switch (status) {
      case 'approved':
        return { text: t.tournamentManage.partStatusApproved, color: 'text-coc-green' };
      case 'rejected':
        return { text: t.tournamentManage.partStatusRejected, color: 'text-coc-red' };
      case 'pending':
      default:
        return { text: t.tournamentManage.partStatusPending, color: 'text-coc-yellow' };
    }
  };

  const statusInfo = getStatusInfo(team.status);

  // Fungsi untuk Approve / Reject
  const handleUpdateStatus = async (
    teamId: string,
    newStatus: 'approved' | 'rejected',
  ) => {
    setIsLoading(true);
    // [i18n] Toast message
    onAction(`${t.tournamentManage.partToastUpdating} (${team.teamName})`, 'info');

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
    <li className="flex flex-col bg-coc-dark/40 transition-colors hover:bg-coc-dark/80">
      {/* Baris Utama (Ringkasan Tim) */}
      <div className="flex items-center p-4 gap-3">
        {/* Tombol Expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-white"
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>

        {/* Info Tim */}
        <Image
          src={team.originClanBadgeUrl || '/images/clan-badge-placeholder.png'}
          alt="Badge Klan"
          width={40}
          height={40}
          className="rounded-md object-cover"
        />
        <div className="flex-grow">
          <p className="text-base font-semibold text-white truncate">
            {team.teamName}
          </p>
          <p className="text-sm text-gray-400 font-mono truncate">
            {t.tournamentManage.partOrigin}: {team.originClanTag} {/* [i18n] */}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <span
            className={`text-sm font-bold font-sans ${statusInfo.color}`}
          >
            {statusInfo.text}
          </span>

          {/* Tombol Aksi (Hanya untuk 'pending') */}
          {team.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="!p-2 h-8 w-8 !bg-coc-green hover:!bg-coc-green/80"
                onClick={() => handleUpdateStatus(team.id, 'approved')}
                disabled={isLoading}
                title={t.clanRequests.actionAccept}
              >
                <CheckIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="!p-2 h-8 w-8"
                onClick={() => handleUpdateStatus(team.id, 'rejected')}
                disabled={isLoading}
                title={t.clanRequests.actionReject}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
          )}
          {/* Tampilkan loader jika sedang aksi */}
          {isLoading && <Loader2Icon className="h-5 w-5 animate-spin" />}
        </div>
      </div>

      {/* Detail Anggota (Jika di-expand) */}
      {isExpanded && (
        <div className="bg-coc-dark/60 p-4 border-t border-coc-gold-dark/20">
          <h5 className="font-semibold text-gray-300 mb-3 ml-1">
            {t.tournamentManage.partMembers} ({team.members.length}): {/* [i18n] */}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.members.map((member) => (
              <div
                key={member.playerTag}
                className="flex items-center gap-2 p-2 bg-coc-stone-dark rounded-md"
              >
                <Image
                  src={getThImage(member.townHallLevel)}
                  alt={`TH ${member.townHallLevel}`}
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <div>
                  <p className="text-sm font-semibold text-white truncate">
                    {member.playerName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {member.playerTag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

// Komponen Utama
const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  tournament,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook
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
    <div className="space-y-6">
      <Notification notification={notification ?? undefined} />

      {/* Header & Statistik */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="font-clash text-xl text-white">
          {t.tournamentManage.partTitle} {/* [i18n] */}
        </h3>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{approvedCount} <span className='text-sm text-gray-400'>/ {tournament.participantCount}</span></p>
            <p className="text-xs font-semibold text-coc-green uppercase">{t.tournamentManage.partApproved}</p> {/* [i18n] */}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs font-semibold text-coc-yellow uppercase">{t.tournamentManage.partPending}</p> {/* [i18n] */}
          </div>
        </div>
      </div>

      {/* Daftar Peserta */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
        </div>
      ) : teams.length === 0 ? (
        <div className="card-stone flex flex-col items-center justify-center gap-4 p-10 text-center rounded-lg border border-coc-gold-dark/20">
          <InfoIcon className="h-12 w-12 text-coc-gold/50" />
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.partEmptyTitle} {/* [i18n] */}
          </h3>
          <p className="text-gray-400 max-w-md">
            {t.tournamentManage.partEmptyDesc} {/* [i18n] */}
          </p>
        </div>
      ) : (
        <div className="card-stone rounded-lg overflow-hidden border border-coc-gold-dark/30">
          <ul className="divide-y divide-coc-gold-dark/30">
            {teams.map((team) => (
              <ParticipantRow
                key={team.id}
                team={team}
                tournamentId={tournament.id}
                onAction={showNotification}
                onRefresh={fetchParticipants}
                t={t} // [BARU] Pass t helper
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ParticipantManager;