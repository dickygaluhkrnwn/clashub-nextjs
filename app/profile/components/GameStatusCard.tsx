// File: app/profile/components/GameStatusCard.tsx
// [MODIFIKASI FASE 11.3]: Refactor menjadi "Stats Grid".
// Menghapus bagian Klan dan Town Hall (karena sudah ada card sendiri).
// Fokus menampilkan statistik: Liga, Trofi, Bintang War, Serangan, Pertahanan.

'use client';

import React from 'react';
import Image from 'next/image';
import {
  TrophyIcon,
  InfoIcon,
  StarIcon,
  SwordsIcon,
  ShieldIcon,
  BarChart2Icon, // Ikon baru untuk judul card
} from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { formatNumber } from '@/lib/th-utils';

interface GameStatusCardProps {
  userProfile: UserProfile; // Data cache
  isVerified: boolean;
  isClanManager: boolean;
  inGameRole: string; // (Tidak digunakan lagi di UI, tapi biarkan di props agar kompatibel)
  fullPlayerData?: CocPlayer | null; // Data live
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Statistik Musim".
 * Menampilkan statistik performa player (Liga, Trofi, Serangan, dll).
 */
export const GameStatusCard = ({
  userProfile,
  isVerified,
  isClanManager,
  fullPlayerData,
  isLoading,
  error,
}: GameStatusCardProps) => {
  // --- 1. Logika Penggabungan Data (Live vs Cache) ---

  // Tentukan Trofi
  const trophies = fullPlayerData?.trophies ?? userProfile.trophies;

  // Tentukan Bintang War (Cache-aware)
  const warStars =
    fullPlayerData?.achievements.find((a) => a.name === 'War Hero')?.value ??
    userProfile?.cachedAchievements?.find((a) => a.name === 'War Hero')?.value ??
    null;

  // Statistik Tambahan (Cache-aware)
  const league = fullPlayerData?.league ?? userProfile?.league ?? null;
  const attackWins =
    fullPlayerData?.attackWins ?? userProfile?.attackWins ?? null;
  const defenseWins =
    fullPlayerData?.defenseWins ?? userProfile?.defenseWins ?? null;
  const bbTrophies =
    fullPlayerData?.builderBaseTrophies ??
    userProfile?.builderBaseTrophies ??
    null;

  // --- 2. Logika Tampilan Loading ---
  const showTrophiesLoading =
    isLoading && !fullPlayerData && !userProfile.trophies;
  const showWarStarsLoading =
    isLoading && !fullPlayerData && !userProfile.cachedAchievements;
  const showStatsLoading =
    isLoading && !fullPlayerData && !userProfile.attackWins; // Cek salah satu stat
  const showLeagueLoading =
    isLoading && !fullPlayerData && !userProfile.league;

  // --- 3. Render Komponen ---
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-xl text-white">
        <BarChart2Icon className="h-5 w-5 text-coc-gold" /> Statistik Musim
      </h2>

      {/* Tampilkan pesan Error jika fetch gagal */}
      {error && (
        <div className="mb-4 p-4 text-center bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <p className="font-bold">Gagal mengambil data live CoC:</p>
          <p className="text-sm font-sans">{error}</p>
        </div>
      )}

      {/* Grid Statistik: 6 Item (2 baris x 3 kolom di desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        
        {/* 1. Liga Saat Ini */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 flex flex-col justify-center items-center">
          {showLeagueLoading ? (
            <div className="h-8 w-8 bg-white/5 rounded-full animate-pulse mb-1" />
          ) : league?.iconUrls?.tiny ? (
            <Image
              src={league.iconUrls.tiny}
              alt={league.name}
              width={40}
              height={40}
              className="mx-auto"
            />
          ) : (
            <h4 className="text-lg text-coc-gold font-clash">N/A</h4>
          )}
          <p className="text-xs uppercase text-gray-400 font-sans truncate mt-2">
            {showLeagueLoading ? 'Memuat...' : league?.name || 'Unranked'}
          </p>
        </div>

        {/* 2. Trofi Home */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
          <h4 className="text-3xl text-coc-gold font-clash">
            <TrophyIcon className="h-4 w-4 inline-block mr-1 text-yellow-500" />
            {showTrophiesLoading ? '...' : formatNumber(trophies)}
          </h4>
          <p className="text-xs uppercase text-gray-400 font-sans mt-1">
            Trofi Home
          </p>
        </div>

        {/* 3. Trofi Builder */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
          <h4 className="text-3xl text-coc-gold font-clash">
            <TrophyIcon className="h-4 w-4 inline-block mr-1 text-blue-400" />
            {showStatsLoading ? '...' : formatNumber(bbTrophies)}
          </h4>
          <p className="text-xs uppercase text-gray-400 font-sans mt-1">
            Trofi Builder
          </p>
        </div>

        {/* 4. Menang Serangan */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
          <h4 className="text-3xl text-coc-gold font-clash">
            <SwordsIcon className="h-4 w-4 inline-block mr-1" />
            {showStatsLoading ? '...' : formatNumber(attackWins)}
          </h4>
          <p className="text-xs uppercase text-gray-400 font-sans mt-1">
            Menang Serangan
          </p>
        </div>

        {/* 5. Menang Bertahan */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
          <h4 className="text-3xl text-coc-gold font-clash">
            <ShieldIcon className="h-4 w-4 inline-block mr-1" />
            {showStatsLoading ? '...' : formatNumber(defenseWins)}
          </h4>
          <p className="text-xs uppercase text-gray-400 font-sans mt-1">
            Menang Bertahan
          </p>
        </div>

        {/* 6. Bintang War */}
        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
          <h4 className="text-3xl text-coc-gold font-clash">
            <StarIcon className="h-4 w-4 inline-block mr-1" />
            {showWarStarsLoading ? '...' : formatNumber(warStars)}
          </h4>
          <p className="text-xs uppercase text-gray-400 font-sans mt-1">
            Bintang War
          </p>
        </div>

      </div>

      {/* Info Sinkronisasi (Hanya untuk Manajer) */}
      {isClanManager && isVerified && (
        <div className="mt-6 p-4 bg-coc-stone/30 rounded-lg border border-coc-gold/20">
          <p className="text-sm font-sans text-gray-300 flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-coc-gold" />
            Data Terakhir Disinkronisasi:
            <span className="font-bold text-coc-gold">
              {userProfile.lastVerified
                ? new Date(userProfile.lastVerified).toLocaleString('id-ID')
                : 'Belum Pernah'}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Data ini digunakan untuk statistik dan manajemen klan Anda.
          </p>
        </div>
      )}
    </div>
  );
};