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
} from '@/app/components/icons/ui-feedback';
import { PlayIcon } from '@/app/components/icons/ui-actions';
import { XIcon } from '@/app/components/icons/ui-general';
import { TrophyIcon } from '@/app/components/icons/clash';
import AlertDialog from '@/app/components/ui/AlertDialog';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

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
  const { t, language } = useLanguage(); // [BARU] Init Hook
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
            result.error || t.clanEsports.toastFetchError, // [i18n]
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
    showNotification(t.tournamentManage.bracketGen.toastGenerating, 'info'); // [i18n]

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
    showNotification(t.tournamentManage.bracketGen.toastStarting.replace('{count}', approvedCount.toString()), 'info'); // [i18n]

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
    showNotification(t.tournamentManage.bracketGen.toastCancelling, 'info'); // [i18n]

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
      title: t.tournamentManage.bracketGen.modalStartTitle, // [i18n]
      message: t.tournamentManage.bracketGen.modalStartDesc.replace('{size}', bracketSize.toString()), // [i18n]
    });
  };

  const openCancelModal = () => {
    setModalState({
      type: 'cancel',
      title: t.tournamentManage.bracketGen.modalCancelTitle, // [i18n]
      message: t.tournamentManage.bracketGen.modalCancelDesc, // [i18n]
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
      <div className="flex justify-center items-center h-40">
        <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
      </div>
    );
  }

  if (isOngoing || isCompleted || isCancelled) {
    let statusText = t.tournamentManage.bracketGen.statusBracketCreated; // [i18n]
    let statusColor = 'text-coc-green';

    if (isCompleted) {
      statusText = t.tournamentManage.bracketGen.statusCompleted; // [i18n]
      statusColor = 'text-gray-400';
    } else if (isCancelled) {
      statusText = t.tournamentManage.bracketGen.statusCancelled; // [i18n]
      statusColor = 'text-coc-red';
    }

    return (
      <div>
        <h3 className="font-clash text-xl text-white mb-4">{t.tournamentManage.tabBracket}</h3>
        <p className="text-gray-400 font-sans mb-4">
          {t.tournament.filterStatusLabel}:{' '}
          <span className={`font-bold ${statusColor}`}>{statusText}</span>
        </p>
      </div>
    );
  }

  if (isScheduled || isRegistrationOpen) {
    return (
      <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
        <h3 className="font-clash text-xl text-white">
          {t.tournamentManage.bracketGen.statusRegNotClosed} {/* [i18n] */}
        </h3>
        <p className="text-gray-400 font-sans mt-2">
          {t.tournamentManage.bracketGen.descRegNotClosed}{' '}
          <span className="font-bold text-coc-yellow">
            {tournament.status === 'scheduled'
              ? t.tournament.cardStatusDraft
              : t.tournament.cardStatusRegistering}
          </span>
          .
        </p>
        <p className="text-gray-400 font-sans mt-1">
          {t.tournamentManage.bracketGen.descRegNotClosedAuto.replace('{date}', new Date(tournament.registrationEndsAt).toLocaleString(locale))} {/* [i18n] */}
        </p>
      </div>
    );
  }

  return (
    <>
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
            ? t.tournamentManage.bracketGen.modalStartConfirm // [i18n]
            : t.tournamentManage.bracketGen.modalCancelConfirm // [i18n]
        }
        type={modalState?.type === 'cancel' ? 'danger' : 'info'}
      />

      {isIdeal && (
        <div className="card-stone p-6 rounded-lg border border-coc-gold/50 text-center bg-coc-gold/10">
          <TrophyIcon className="h-12 w-12 text-coc-gold mx-auto mb-4" />
          <h3 className="font-clash text-2xl text-white">
            {t.tournamentManage.bracketGen.titleReady} {/* [i18n] */}
          </h3>
          <p className="text-gray-300 font-sans mt-2 max-w-md mx-auto">
            {t.tournamentManage.bracketGen.descReady.replace('{count}', approvedCount.toString())} {/* [i18n] */}
          </p>
          <p className="text-sm text-coc-yellow/80 font-sans mt-3">
            <span className="font-bold">{t.tournamentManage.bracketGen.attention}</span> {/* [i18n] */}
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-6"
            onClick={handleGenerateBracket}
            disabled={isActionLoading}
          >
            {isActionLoading && (
              <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
            )}
            {isActionLoading ? t.tournamentManage.bracketGen.btnGenerating : t.tournamentManage.bracketGen.btnGenerate} {/* [i18n] */}
          </Button>
        </div>
      )}

      {isUnderQuota && (
        <div className="card-stone p-5 rounded-lg border border-coc-red/50 text-center bg-coc-red/10">
          <AlertTriangleIcon className="h-10 w-10 text-coc-red/70 mx-auto mb-3" />
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.bracketGen.titleUnderQuota} {/* [i18n] */}
          </h3>
          <p className="text-gray-400 font-sans mt-2">
            {t.tournamentManage.bracketGen.descUnderQuota} {/* [i18n] */}
          </p>
          <p className="font-clash text-2xl text-white mt-2">
            {approvedCount} / {tournament.participantCount}
            <span className="text-sm text-gray-400 font-sans ml-2">
              ({t.tournamentManage.partApproved})
            </span>
          </p>
          <p className="text-gray-300 font-sans mt-4 max-w-md mx-auto">
            {t.tournamentManage.bracketGen.descOptions} {/* [i18n] */}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button
              variant="primary"
              disabled={isActionLoading}
              onClick={openStartModal}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {t.tournamentManage.bracketGen.btnStartUnderQuota.replace('{count}', approvedCount.toString())} {/* [i18n] */}
            </Button>

            <Button
              variant="danger"
              disabled={isActionLoading}
              onClick={openCancelModal}
            >
              <XIcon className="h-5 w-5 mr-2" />
              {t.tournamentManage.bracketGen.btnCancelTournament} {/* [i18n] */}
            </Button>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
          <AlertTriangleIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <h3 className="font-clash text-xl text-white">
            {t.tournamentManage.bracketGen.titleEmpty} {/* [i18n] */}
          </h3>
          <p className="text-gray-400 font-sans mt-2">
            {t.tournamentManage.bracketGen.descEmpty} {/* [i18n] */}
          </p>
          <p className="font-clash text-2xl text-white mt-2">
            0 / {tournament.participantCount}
          </p>
          <Button
            variant="danger"
            className="mt-6"
            disabled={isActionLoading}
            onClick={openCancelModal}
          >
            <XIcon className="h-5 w-5 mr-2" />
            {t.tournamentManage.bracketGen.btnCancelTournament} {/* [i18n] */}
          </Button>
        </div>
      )}
    </>
  );
};

export default BracketGenerator;