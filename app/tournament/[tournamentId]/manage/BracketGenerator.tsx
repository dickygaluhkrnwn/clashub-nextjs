'use client';

// File: app/tournament/[tournamentId]/manage/BracketGenerator.tsx
// Deskripsi: [BARU - FASE 5] Komponen untuk men-generate bracket.

import React, { useState } from 'react';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  AlertTriangleIcon,
  TrophyIcon,
} from '@/app/components/icons';

interface BracketGeneratorProps {
  tournament: FirestoreDocument<Tournament>;
  // Prop untuk memberi tahu parent (ManageTournamentClient) agar me-refresh datanya
  onBracketGenerated: () => void;
}

const BracketGenerator: React.FC<BracketGeneratorProps> = ({
  tournament,
  onBracketGenerated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // --- Validasi Logika (sesuai Roadmap Fase 5) ---
  const isFull =
    tournament.participantCountCurrent === tournament.participantCount;
  const isReadyToStart = tournament.status === 'registration_closed';
  const isOngoing = tournament.status === 'ongoing';
  const isCompleted = tournament.status === 'completed';

  // Tombol dinonaktifkan jika sedang loading, ATAU belum penuh, ATAU pendaftaran belum ditutup
  const isDisabled = isLoading || !isFull || !isReadyToStart;

  // --- Handler untuk Klik Tombol ---
  const handleGenerateBracket = async () => {
    if (isDisabled) return;

    setIsLoading(true);
    showNotification('Sedang mengacak dan membuat bracket...', 'info');

    try {
      // Panggil API route yang akan kita buat selanjutnya
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/generate-bracket`,
        { method: 'POST' },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat bracket.');
      }

      showNotification(result.message, 'success');
      // Beri tahu parent component untuk refresh data (misal: SWR revalidate)
      onBracketGenerated();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---

  // 1. Jika turnamen sudah berjalan atau selesai
  if (isOngoing || isCompleted) {
    return (
      <div>
        <h3 className="font-clash text-xl text-white mb-4">Bracket Turnamen</h3>
        <p className="text-gray-400 font-sans mb-4">
          Bracket turnamen telah dibuat. Status turnamen: <span className="font-bold text-coc-green">{tournament.status}</span>.
        </p>
        {/* Di sini nanti kita akan render <ScheduleManager /> (langkah selanjutnya) */}
      </div>
    );
  }

  // 2. Jika kuota belum penuh
  if (!isFull) {
    return (
      <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
        <h3 className="font-clash text-xl text-white">
          Menunggu Peserta Penuh
        </h3>
        <p className="text-gray-400 font-sans mt-2">
          Bracket baru bisa dibuat setelah semua peserta disetujui dan kuota
          penuh.
        </p>
        <p className="font-clash text-2xl text-white mt-2">
          {tournament.participantCountCurrent} / {tournament.participantCount}
        </p>
      </div>
    );
  }

  // 3. Jika sudah penuh tapi pendaftaran belum ditutup
  if (!isReadyToStart) {
    return (
      <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30 text-center">
        <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
        <h3 className="font-clash text-xl text-white">
          Pendaftaran Belum Ditutup
        </h3>
        <p className="text-gray-400 font-sans mt-2">
          Status turnamen saat ini adalah{' '}
          <span className="font-bold text-coc-yellow">
            {tournament.status}
          </span>
          .
        </p>
        <p className="text-gray-400 font-sans mt-1">
          Harap ubah status turnamen menjadi 'registration_closed' (fitur di
          tab Pengaturan) untuk memulai.
        </p>
      </div>
    );
  }

  // 4. Jika Siap Generate (Penuh dan Pendaftaran Ditutup)
  return (
    <>
      <Notification notification={notification ?? undefined} />
      <div className="card-stone p-6 rounded-lg border border-coc-gold/50 text-center bg-coc-gold/10">
        <TrophyIcon className="h-12 w-12 text-coc-gold mx-auto mb-4" />
        <h3 className="font-clash text-2xl text-white">
          Siap Memulai Turnamen!
        </h3>
        <p className="text-gray-300 font-sans mt-2 max-w-md mx-auto">
          Semua {tournament.participantCount} tim peserta telah disetujui dan
          pendaftaran telah ditutup. Tekan tombol di bawah untuk mengacak dan
          membuat bracket *double elimination*.
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
          disabled={isLoading}
        >
          {isLoading && <Loader2Icon className="h-5 w-5 animate-spin mr-2" />}
          {isLoading ? 'Membuat Bracket...' : 'Generate Bracket Sekarang'}
        </Button>
      </div>
    </>
  );
};

export default BracketGenerator;