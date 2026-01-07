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
  CheckIcon,
  SwordsIcon
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
    // showNotification(t.tournamentManage.bracketGen.toastGenerating, 'info');

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
    // showNotification(t.tournamentManage.bracketGen.toastStarting.replace('{count}', approvedCount.toString()), 'info');

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
    // showNotification(t.tournamentManage.bracketGen.toastCancelling, 'info');

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
      <div className="flex justify-center items-center h-60 bg-[#15171e]/50 rounded-3xl border border-white/5">
        <div className="text-center">
           <Loader2Icon className="h-10 w-10 animate-spin text-coc-gold mx-auto mb-3 opacity-50" />
           <p className="text-gray-500 text-sm font-clash tracking-widest uppercase">Checking Status...</p>
        </div>
      </div>
    );
  }

  // --- 1. Status: Bracket Sudah Ada / Selesai / Batal ---
  if (isOngoing || isCompleted || isCancelled) {
    let statusText = t.tournamentManage.bracketGen.statusBracketCreated;
    let statusColor = 'text-coc-green bg-coc-green/10 border-coc-green/30 shadow-[0_0_15px_rgba(74,222,128,0.1)]';
    let StatusIcon = CheckIcon;

    if (isCompleted) {
      statusText = t.tournamentManage.bracketGen.statusCompleted;
      statusColor = 'text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
      StatusIcon = TrophyIcon;
    } else if (isCancelled) {
      statusText = t.tournamentManage.bracketGen.statusCancelled;
      statusColor = 'text-coc-red bg-coc-red/10 border-coc-red/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      StatusIcon = XIcon;
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className={`p-8 rounded-3xl border flex items-center gap-6 ${statusColor}`}>
           <div className={`p-4 rounded-full border ${statusColor.split(' ')[2]} bg-black/20`}>
              <StatusIcon className="h-10 w-10" />
           </div>
           <div>
              <h3 className="text-2xl font-bold font-clash uppercase tracking-wide mb-1">{statusText}</h3>
              <p className="text-sm opacity-80 font-sans">
                {isCancelled ? "Tournament has been cancelled." : "Bracket has been generated and managed by the system."}
              </p>
           </div>
        </div>
      </div>
    );
  }

  // --- 2. Status: Pendaftaran Masih Buka / Draft ---
  if (isScheduled || isRegistrationOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-[#15171e]/50 rounded-3xl border border-white/5 border-dashed text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
           <AlertTriangleIcon className="h-10 w-10 text-yellow-500" />
        </div>
        <h3 className="font-clash text-2xl text-white mb-2 uppercase tracking-wide">
          {t.tournamentManage.bracketGen.statusRegNotClosed}
        </h3>
        <p className="text-gray-400 font-sans max-w-lg mx-auto mb-6 leading-relaxed">
          {t.tournamentManage.bracketGen.descRegNotClosed}
        </p>
        <div className="inline-block px-5 py-2.5 bg-[#0a0a0b] rounded-xl border border-white/10 text-sm font-mono text-gray-300 shadow-inner">
           Ends: <span className="text-white font-bold">{new Date(tournament.registrationEndsAt).toLocaleString(locale)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
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
        cancelText={t.common.cancel}
        type={modalState?.type === 'cancel' ? 'danger' : 'info'}
      />

      <div className="flex items-center gap-3 border-b border-white/10 pb-6 mb-6">
         <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <SwordsIcon className="h-6 w-6 text-coc-gold" />
         </div>
         <div>
            {/* [FIXED] Menggunakan tabBracket karena 'title' tidak ada di bracketGen */}
            <h3 className="font-clash text-2xl font-bold text-white uppercase tracking-wide">{t.tournamentManage.tabBracket}</h3>
            <p className="text-sm text-gray-400 font-sans">Generate bracket and start matches.</p>
         </div>
      </div>

      {/* --- 3. Kondisi Ideal: Siap Generate --- */}
      {isIdeal && (
        <div className="bg-gradient-to-br from-coc-gold/10 to-[#15171e] border border-coc-gold/30 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(255,215,0,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-coc-gold/20 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
             <TrophyIcon className="h-20 w-20 text-coc-gold mb-6 drop-shadow-lg animate-pulse-slow" />
             <h3 className="font-clash text-3xl md:text-4xl text-white mb-3 uppercase tracking-wide drop-shadow-md">
               {t.tournamentManage.bracketGen.titleReady}
             </h3>
             <p className="text-gray-300 font-sans text-lg mb-8 max-w-xl leading-relaxed">
               {t.tournamentManage.bracketGen.descReady.replace('{count}', approvedCount.toString())}
             </p>
             
             <Button
               variant="primary"
               size="lg"
               className="w-full sm:w-auto px-10 py-6 text-lg font-bold shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transform hover:-translate-y-1 transition-all"
               onClick={handleGenerateBracket}
               disabled={isActionLoading}
             >
               {isActionLoading ? (
                 <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
               ) : (
                  <PlayIcon className="h-6 w-6 mr-2 fill-current" />
               )}
               {isActionLoading ? t.tournamentManage.bracketGen.btnGenerating : t.tournamentManage.bracketGen.btnGenerate}
             </Button>
             
             <p className="text-xs text-yellow-500/80 mt-6 font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full border border-yellow-500/20">
               {t.tournamentManage.bracketGen.attention}
             </p>
          </div>
        </div>
      )}

      {/* --- 4. Kondisi Under Quota --- */}
      {isUnderQuota && (
        <div className="bg-[#15171e]/80 border border-coc-red/20 p-8 md:p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-coc-red opacity-50" />
          
          <div className="w-20 h-20 bg-coc-red/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-coc-red/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
             <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
          </div>
          
          <h3 className="font-clash text-2xl md:text-3xl text-white mb-2 uppercase tracking-wide">
            {t.tournamentManage.bracketGen.titleUnderQuota}
          </h3>
          
          <div className="my-8 flex items-center justify-center gap-4">
             <div className="text-right">
                <span className="text-5xl font-clash text-white font-bold block leading-none">{approvedCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Approved</span>
             </div>
             <div className="h-10 w-px bg-white/10" />
             <div className="text-left">
                <span className="text-3xl font-clash text-gray-500 font-bold block leading-none">/ {tournament.participantCount}</span>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Target</span>
             </div>
          </div>

          <p className="text-gray-400 font-sans mb-10 max-w-lg mx-auto leading-relaxed border-t border-b border-white/5 py-4">
            {t.tournamentManage.bracketGen.descOptions}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg"
              disabled={isActionLoading}
              onClick={openStartModal}
            >
              <PlayIcon className="h-5 w-5 mr-2 fill-current" />
              {t.tournamentManage.bracketGen.btnStartUnderQuota.replace('{count}', approvedCount.toString())}
            </Button>

            <Button
              variant="danger"
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-red-900/20"
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
        <div className="bg-[#15171e]/50 border border-white/5 p-12 rounded-3xl text-center border-dashed">
          <div className="w-20 h-20 bg-[#0a0a0b] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
             <XIcon className="h-10 w-10 text-gray-600 opacity-50" />
          </div>
          <h3 className="font-clash text-2xl text-white mb-3 uppercase tracking-wide">
            {t.tournamentManage.bracketGen.titleEmpty}
          </h3>
          <p className="text-gray-500 font-sans mb-8 max-w-md mx-auto leading-relaxed">
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