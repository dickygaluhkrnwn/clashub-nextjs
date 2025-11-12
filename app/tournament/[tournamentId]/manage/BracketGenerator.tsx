'use client';

// File: app/tournament/[tournamentId]/manage/BracketGenerator.tsx
// Deskripsi: [PERBAIKAN ERROR] Memperbaiki semua error impor dan asumsi.

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
  TrophyIcon,
} from '@/app/components/icons/ui-feedback';
// [PERBAIKAN ERROR] Impor PlayIcon dan XIcon dari barrel file
import { PlayIcon, XIcon } from '@/app/components/icons';
// [PERBAIKAN ERROR] Impor komponen AlertDialog yang baru (multi-bagian)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/AlertDialog';

// [PERBAIKAN ERROR] Definisikan helper function yang hilang
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

const BracketGenerator: React.FC<BracketGeneratorProps> = ({
  tournament,
  onBracketGenerated,
  onTournamentCancelled,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

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
            result.error || 'Gagal mengambil data tim peserta.',
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
    showNotification('Sedang mengacak dan membuat bracket...', 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/generate-bracket`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat bracket.');
      }

      showNotification(result.message, 'success');
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
    showNotification(`Memulai turnamen dengan ${approvedCount} tim...`, 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/start-under-quota`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal memulai turnamen.');
      }

      showNotification(result.message, 'success');
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
    showNotification(`Membatalkan turnamen...`, 'info');

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/cancel`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membatalkan turnamen.');
      }

      showNotification(result.message, 'success');
      onTournamentCancelled();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingTeams) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
      </div>
    );
  }

  if (isOngoing || isCompleted || isCancelled) {
    let statusText = 'Bracket turnamen telah dibuat.';
    let statusColor = 'text-coc-green';

    if (isCompleted) {
      statusText = 'Turnamen telah selesai.';
      statusColor = 'text-gray-400';
    } else if (isCancelled) {
      statusText = 'Turnamen ini telah dibatalkan.';
      statusColor = 'text-coc-red';
    }

    return (
      <div>
        <h3 className="font-clash text-xl text-white mb-4">Bracket Turnamen</h3>
        <p className="text-gray-400 font-sans mb-4">
          Status turnamen:{' '}
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
          Pendaftaran Belum Ditutup
        </h3>
        <p className="text-gray-400 font-sans mt-2">
          Status turnamen saat ini adalah{' '}
          <span className="font-bold text-coc-yellow">
            {tournament.status === 'scheduled'
              ? 'Terjadwal'
              : 'Pendaftaran Dibuka'}
          </span>
          .
        </p>
        <p className="text-gray-400 font-sans mt-1">
          Bracket baru dapat dibuat setelah pendaftaran ditutup secara otomatis
          (pada{' '}
          {new Date(tournament.registrationEndsAt).toLocaleString('id-ID')}).
        </p>
      </div>
    );
  }

  if (isIdeal) {
    return (
      <>
        <Notification notification={notification ?? undefined} />
        <div className="card-stone p-6 rounded-lg border border-coc-gold/50 text-center bg-coc-gold/10">
          <TrophyIcon className="h-12 w-12 text-coc-gold mx-auto mb-4" />
          <h3 className="font-clash text-2xl text-white">
            Siap Memulai Turnamen!
          </h3>
          <p className="text-gray-300 font-sans mt-2 max-w-md mx-auto">
            Semua {approvedCount} tim peserta telah disetujui dan pendaftaran
            telah ditutup. Tekan tombol di bawah untuk mengacak dan membuat
            bracket *double elimination*.
          </p>
          <p className="text-sm text-coc-yellow/80 font-sans mt-3">
            <span className="font-bold">PERHATIAN:</span> Aksi ini tidak dapat
            dibatalkan.
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
            {isActionLoading ? 'Membuat Bracket...' : 'Generate Bracket Sekarang'}
          </Button>
        </div>
      </>
    );
  }

  if (isUnderQuota) {
    return (
      <>
        <Notification notification={notification ?? undefined} />
        <div className="card-stone p-5 rounded-lg border border-coc-red/50 text-center bg-coc-red/10">
          <AlertTriangleIcon className="h-10 w-10 text-coc-red/70 mx-auto mb-3" />
          <h3 className="font-clash text-xl text-white">
            Pendaftaran Ditutup (Kuota Tidak Penuh)
          </h3>
          <p className="text-gray-400 font-sans mt-2">
            Pendaftaran telah ditutup, namun kuota turnamen tidak terpenuhi.
          </p>
          <p className="font-clash text-2xl text-white mt-2">
            {approvedCount} / {tournament.participantCount}
            <span className="text-sm text-gray-400 font-sans ml-2">
              (Disetujui)
            </span>
          </p>
          <p className="text-gray-300 font-sans mt-4 max-w-md mx-auto">
            Anda memiliki 2 pilihan:
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            {/* Tombol A: Mulai Paksa */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="primary" disabled={isActionLoading}>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Mulai dengan {approvedCount} Tim
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Mulai Turnamen (Under Quota)?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Aksi ini akan membuat bracket{' '}
                    {getNextPowerOfTwo(approvedCount)} tim, menambahkan "BYE"
                    (Lolos Otomatis) untuk mengisi slot kosong, dan mengubah
                    status turnamen menjadi 'ongoing'.
                    <br />
                    <br />
                    <span className="font-bold text-coc-yellow">
                      Aksi ini tidak dapat dibatalkan.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isActionLoading}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleStartUnderQuota}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Ya, Mulai Turnamen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Tombol B: Batalkan */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  // [PERBAIKAN ERROR] Mengganti "destructive" dengan "danger"
                  variant="danger"
                  disabled={isActionLoading}
                >
                  <XIcon className="h-5 w-5 mr-2" />
                  Batalkan Turnamen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Batalkan Turnamen Ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Aksi ini akan mengubah status turnamen menjadi 'cancelled'.
                    Semua tim yang terdaftar akan diberi notifikasi (jika ada).
                    <br />
                    <br />
                    <span className="font-bold text-coc-yellow">
                      Aksi ini tidak dapat dibatalkan.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isActionLoading}>
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    // [PERBAIKAN ERROR] Mengganti "destructive" dengan "danger"
                    variant="danger"
                    onClick={handleCancelTournament}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Ya, Batalkan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </>
    );
  }

  if (isEmpty) {
    return (
      <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
        <h3 className="font-clash text-xl text-white">
          Pendaftaran Ditutup (Tidak Ada Peserta)
        </h3>
        <p className="text-gray-400 font-sans mt-2">
          Pendaftaran telah ditutup dan tidak ada tim yang disetujui.
        </p>
        <p className="font-clash text-2xl text-white mt-2">
          0 / {tournament.participantCount}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              // [PERBAIKAN ERROR] Mengganti "destructive" dengan "danger"
              variant="danger"
              className="mt-6"
              disabled={isActionLoading}
            >
              <XIcon className="h-5 w-5 mr-2" />
              Batalkan Turnamen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batalkan Turnamen Ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Aksi ini akan mengubah status turnamen menjadi 'cancelled'. Aksi
                ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActionLoading}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                // [PERBAIKAN ERROR] Mengganti "destructive" dengan "danger"
                variant="danger"
                onClick={handleCancelTournament}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Ya, Batalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Fallback (seharusnya tidak pernah terjangkau)
  return (
    <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
      <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
      <h3 className="font-clash text-xl text-white">
        Status Tidak Diketahui
      </h3>
      <p className="text-gray-400 font-sans mt-2">
        Silakan periksa kembali pengaturan turnamen.
      </p>
    </div>
  );
};

export default BracketGenerator;