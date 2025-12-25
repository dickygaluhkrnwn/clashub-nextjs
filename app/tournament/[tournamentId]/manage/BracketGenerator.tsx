'use client';

import React, { useState, useEffect } from 'react';
import {
  Tournament,
  FirestoreDocument,
  TournamentTeam,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  AlertTriangleIcon,
  PlayIcon,
  XIcon,
  TrophyIcon,
  CheckIcon
} from '@/app/components/icons';
import AlertDialog from '@/app/components/ui/AlertDialog';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Helper untuk mendapatkan power of 2 terdekat
function getNextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 16) return 16;
  if (n <= 32) return 32;
  if (n <= 64) return 64;
  return 64;
}

interface BracketGeneratorProps {
  tournament: FirestoreDocument<Tournament>;
  onBracketGenerated: () => void;
  onTournamentCancelled: () => void;
}

type ModalState = {
  type: 'startUnderQuota' | 'cancel';
  title: string;
  message: string;
};

const BracketGenerator: React.FC<BracketGeneratorProps> = ({
  tournament,
  onBracketGenerated,
  onTournamentCancelled,
}) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const [modalState, setModalState] = useState<ModalState | null>(null);

  const [teams, setTeams] = useState<FirestoreDocument<TournamentTeam>[]>([]);
  const [isFetchingTeams, setIsFetchingTeams] = useState(true);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      setIsFetchingTeams(true);
      try {
        const response = await fetch(
          `/api/tournaments/${tournament.id}/participants`,
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.error || t.clanEsports.toastFetchError,
          );
        }
        setTeams(result || []);
      } catch (error: any) {
        showNotification(error.message, 'error');
        setTeams([]);
      } finally {
        setIsFetchingTeams(false);
      }
    };

    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id]);

  const approvedCount = teams.filter((t) => t.status === 'approved').length;

  const isRegistrationClosed = tournament.status === 'registration_closed';
  const isOngoing = tournament.status === 'ongoing';
  const isCompleted = tournament.status === 'completed';
  const isCancelled = tournament.status === 'cancelled';
  const isScheduled = tournament.status === 'scheduled';
  const isRegistrationOpen = tournament.status === 'registration_open';

  const isFull = approvedCount === tournament.participantCount;
  const isUnderQuota = isRegistrationClosed && !isFull && approvedCount > 0;
  const isIdeal = isRegistrationClosed && isFull;
  const isEmpty = isRegistrationClosed && approvedCount === 0;

  const isActionLoading = isLoading;

  const handleGenerateBracket = async () => {
    if (isActionLoading || !isIdeal) return;

    setIsLoading(true);
    showNotification(t.tournamentManage.bracketGen.toastGenerating, 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/generate-bracket`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      showNotification(result.message || t.common.success, 'success');
      onBracketGenerated();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartUnderQuota = async () => {
    if (isActionLoading || !isUnderQuota) return;

    setIsLoading(true);
    showNotification(t.tournamentManage.bracketGen.toastStarting.replace('{count}', approvedCount.toString()), 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/start-under-quota`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      showNotification(result.message || t.common.success, 'success');
      onBracketGenerated();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTournament = async () => {
    if (isActionLoading) return;

    setIsLoading(true);
    showNotification(t.tournamentManage.bracketGen.toastCancelling, 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/cancel`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      showNotification(result.message || t.common.success, 'success');
      onTournamentCancelled();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openStartModal = () => {
    const bracketSize = getNextPowerOfTwo(approvedCount);
    setModalState({
      type: 'startUnderQuota',
      title: t.tournamentManage.bracketGen.modalStartTitle,
      message: t.tournamentManage.bracketGen.modalStartDesc.replace('{size}', bracketSize.toString()),
    });
  };

  const openCancelModal = () => {
    setModalState({
      type: 'cancel',
      title: t.tournamentManage.bracketGen.modalCancelTitle,
      message: t.tournamentManage.bracketGen.modalCancelDesc,
    });
  };

  const onConfirmModal = async () => {
    if (!modalState) return;

    if (modalState.type === 'startUnderQuota') {
      await handleStartUnderQuota();
    } else if (modalState.type === 'cancel') {
      await handleCancelTournament();
    }
    setModalState(null);
  };

  if (isFetchingTeams) {
    return (
      <div className="flex justify-center items-center h-60 bg-white/5 rounded-2xl border border-white/5">
        <div className="text-center">
           <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold mx-auto mb-3" />
           <p className="text-gray-400 text-sm">Memeriksa status pendaftaran...</p>
        </div>
      </div>
    );
  }

  // --- 1. Status: Bracket Sudah Ada / Selesai / Batal ---
  if (isOngoing || isCompleted || isCancelled) {
    let statusText = t.tournamentManage.bracketGen.statusBracketCreated;
    let statusColor = 'text-coc-green bg-coc-green/10 border-coc-green/20';
    let StatusIcon = CheckIcon;

    if (isCompleted) {
      statusText = t.tournamentManage.bracketGen.statusCompleted;
      statusColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      StatusIcon = TrophyIcon;
    } else if (isCancelled) {
      statusText = t.tournamentManage.bracketGen.statusCancelled;
      statusColor = 'text-coc-red bg-coc-red/10 border-coc-red/20';
      StatusIcon = XIcon;
    }

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className={`p-6 rounded-2xl border ${statusColor.split(' ')[2]} ${statusColor.split(' ')[1]} flex items-center gap-4`}>
           <div className={`p-3 rounded-full ${statusColor.split(' ')[1].replace('10', '20')}`}>
              <StatusIcon className={`h-8 w-8 ${statusColor.split(' ')[0]}`} />
           </div>
           <div>
              <h3 className={`text-xl font-bold font-clash ${statusColor.split(' ')[0]}`}>{statusText}</h3>
              <p className="text-gray-300 text-sm mt-1">Bracket turnamen telah dikelola sistem.</p>
           </div>
        </div>
      </div>
    );
  }

  // --- 2. Status: Pendaftaran Masih Buka / Draft ---
  if (isScheduled || isRegistrationOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/5 border-dashed text-center animate-in fade-in">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
           <AlertTriangleIcon className="h-10 w-10 text-yellow-500" />
        </div>
        <h3 className="font-clash text-2xl text-white mb-2">
          {t.tournamentManage.bracketGen.statusRegNotClosed}
        </h3>
        <p className="text-gray-400 font-sans max-w-lg mx-auto mb-4">
          {t.tournamentManage.bracketGen.descRegNotClosed}
        </p>
        <div className="inline-block px-4 py-2 bg-black/40 rounded-lg border border-white/10 text-sm font-mono text-gray-300">
           Tutup pada: {new Date(tournament.registrationEndsAt).toLocaleString(locale)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Notification notification={notification ?? undefined} />

      <AlertDialog
        isOpen={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.title || ''}
        message={modalState?.message || ''}
        onConfirm={onConfirmModal}
        isConfirmLoading={isActionLoading}
        confirmText={
          modalState?.type === 'startUnderQuota'
            ? t.tournamentManage.bracketGen.modalStartConfirm
            : t.tournamentManage.bracketGen.modalCancelConfirm
        }
        type={modalState?.type === 'cancel' ? 'danger' : 'info'}
      />

      {/* --- 3. Kondisi Ideal: Siap Generate --- */}
      {isIdeal && (
        <div className="bg-coc-gold/5 border border-coc-gold/20 p-8 rounded-2xl text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          
          <TrophyIcon className="h-16 w-16 text-coc-gold mx-auto mb-4 drop-shadow-md" />
          <h3 className="font-clash text-3xl text-white mb-2">
            {t.tournamentManage.bracketGen.titleReady}
          </h3>
          <p className="text-gray-300 font-sans text-lg mb-6">
            {t.tournamentManage.bracketGen.descReady.replace('{count}', approvedCount.toString())}
          </p>
          
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8 py-6 text-lg font-bold shadow-xl shadow-coc-gold/20"
            onClick={handleGenerateBracket}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            ) : (
               <TrophyIcon className="h-6 w-6 mr-2" />
            )}
            {isActionLoading ? t.tournamentManage.bracketGen.btnGenerating : t.tournamentManage.bracketGen.btnGenerate}
          </Button>
          
          <p className="text-xs text-yellow-500/80 mt-4 font-bold uppercase tracking-wider">
            {t.tournamentManage.bracketGen.attention}
          </p>
        </div>
      )}

      {/* --- 4. Kondisi Under Quota --- */}
      {isUnderQuota && (
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-2xl text-center shadow-lg relative overflow-hidden">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
             <AlertTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          
          <h3 className="font-clash text-2xl text-white mb-2">
            {t.tournamentManage.bracketGen.titleUnderQuota}
          </h3>
          
          <div className="my-6">
             <span className="text-5xl font-clash text-white font-bold">{approvedCount}</span>
             <span className="text-xl text-gray-500 font-clash"> / {tournament.participantCount}</span>
             <p className="text-sm text-coc-green font-bold uppercase tracking-wider mt-1">{t.tournamentManage.partApproved}</p>
          </div>

          <p className="text-gray-300 font-sans mb-8 max-w-lg mx-auto">
            {t.tournamentManage.bracketGen.descOptions}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              disabled={isActionLoading}
              onClick={openStartModal}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {t.tournamentManage.bracketGen.btnStartUnderQuota.replace('{count}', approvedCount.toString())}
            </Button>

            <Button
              variant="danger"
              size="lg"
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30"
              disabled={isActionLoading}
              onClick={openCancelModal}
            >
              <XIcon className="h-5 w-5 mr-2" />
              {t.tournamentManage.bracketGen.btnCancelTournament}
            </Button>
          </div>
        </div>
      )}

      {/* --- 5. Kondisi Kosong --- */}
      {isEmpty && (
        <div className="bg-white/5 border border-white/5 p-10 rounded-2xl text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <XIcon className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="font-clash text-2xl text-white mb-2">
            {t.tournamentManage.bracketGen.titleEmpty}
          </h3>
          <p className="text-gray-400 font-sans mb-8">
            {t.tournamentManage.bracketGen.descEmpty}
          </p>
          <Button
            variant="danger"
            onClick={openCancelModal}
            disabled={isActionLoading}
            className="w-full sm:w-auto"
          >
            <XIcon className="h-5 w-5 mr-2" />
            {t.tournamentManage.bracketGen.btnCancelTournament}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BracketGenerator;