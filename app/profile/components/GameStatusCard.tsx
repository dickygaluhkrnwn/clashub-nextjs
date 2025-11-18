// File: app/profile/components/GameStatusCard.tsx
// [MODIFIKASI FASE 8.3]: Menambahkan 5 statistik baru (XP, Liga,
// Attack/Defense Wins, BB Trophies) dan menerapkan cache-reading.

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
// [MODIFIKASI FASE 8.3] Impor ikon baru dan formatNumber
import {
  TrophyIcon,
  InfoIcon,
  StarIcon,
  SwordsIcon,
  ShieldIcon,
} from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { getThImage, formatNumber } from '@/lib/th-utils';

interface GameStatusCardProps {
  userProfile: UserProfile; // Data cache dari Firebase (fallback)
  isVerified: boolean;
  isClanManager: boolean;
  inGameRole: string; // Role cache dari Firebase
  // [BARU FASE 2] Props untuk data live dari API
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Status Permainan" di halaman profil.
 * Menampilkan TH, Trofi, Bintang War, Role, dan Info Klan.
 * Diprioritaskan data live (fullPlayerData) jika ada.
 */
export const GameStatusCard = ({
  userProfile,
  isVerified,
  isClanManager,
  inGameRole,
  // [BARU FASE 2] Destructure props baru
  fullPlayerData,
  isLoading,
  error,
}: GameStatusCardProps) => {
  // --- 1. Logika Penggabungan Data (Live vs Cache) ---

  // Tentukan TH Level
  const thLevel =
    fullPlayerData?.townHallLevel ??
    (userProfile.thLevel &&
    !isNaN(userProfile.thLevel) &&
    userProfile.thLevel > 0
      ? userProfile.thLevel
      : 9);
  const thImage = getThImage(thLevel);

  // Tentukan Trofi
  const trophies = fullPlayerData?.trophies ?? userProfile.trophies;

  // Tentukan Bintang War
  const warStars =
    fullPlayerData?.achievements.find((a) => a.name === 'War Hero')?.value ??
    userProfile?.cachedAchievements?.find((a) => a.name === 'War Hero')?.value ??
    null;

  // Tentukan Role
  const role = fullPlayerData?.role || inGameRole;

  // Tentukan Info Klan
  const clanTag = fullPlayerData?.clan?.tag || userProfile.clanTag;
  const clanName = fullPlayerData?.clan?.name || userProfile.clanName;

  // --- [BARU FASE 8.3] Logika Statistik Tambahan ---
  const expLevel = fullPlayerData?.expLevel ?? userProfile?.expLevel ?? null;
  const league = fullPlayerData?.league ?? userProfile?.league ?? null;
  const attackWins =
    fullPlayerData?.attackWins ?? userProfile?.attackWins ?? null;
  const defenseWins =
    fullPlayerData?.defenseWins ?? userProfile?.defenseWins ?? null;
  const bbTrophies =
    fullPlayerData?.builderBaseTrophies ??
    userProfile?.builderBaseTrophies ??
    null;
  // --- [AKHIR BARU FASE 8.3] ---

  // --- [MODIFIKASI FASE 8.3] Logika Tampilan Loading ---
  const showTHLoading = isLoading && !fullPlayerData && !userProfile.thLevel;
  const showTrophiesLoading =
    isLoading && !fullPlayerData && !userProfile.trophies;
  const showWarStarsLoading =
    isLoading && !fullPlayerData && !userProfile.cachedAchievements;
  const showStatsLoading =
    isLoading && !fullPlayerData && !userProfile.expLevel; // Cek salah satu stat baru
  const showLeagueLoading =
    isLoading && !fullPlayerData && !userProfile.league;
  const showRoleLoading =
    isLoading && !fullPlayerData && !userProfile.clanRole;
  const showClanLoading =
    isLoading && !fullPlayerData && !userProfile.clanTag;
  // --- [AKHIR MODIFIKASI FASE 8.3] ---

  // --- 2. Render Komponen ---
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan{' '}
        {isVerified
          ? isLoading
            ? '(Sinkronisasi...)'
            : '(LIVE dari CoC)'
          : '(Data Tersimpan)'}
      </h2>

      {/* Tampilkan pesan Error jika fetch gagal */}
      {error && (
        <div className="mb-4 p-4 text-center bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <p className="font-bold">Gagal mengambil data live CoC:</p>
          <p className="text-sm font-sans">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Gambar TH */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <Image
            src={thImage}
            alt={`Town Hall ${thLevel}`}
            width={120}
            height={120}
            sizes="(max-width: 768px) 100px, 120px"
            priority
            className="flex-shrink-0"
          />
        </div>

        {/* [MODIFIKASI FASE 8.3] Grid Statistik diubah ke 3 kolom */}
        <div className="flex-grow grid grid-cols-3 gap-4 text-center w-full">
          {/* Level Town Hall */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {showTHLoading ? '...' : thLevel}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Town Hall
            </p>
          </div>

          {/* [BARU FASE 8.3] Level XP */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <StarIcon className="h-4 w-4 inline-block mr-1" />
              {showStatsLoading ? '...' : formatNumber(expLevel)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Level XP
            </p>
          </div>

          {/* [BARU FASE 8.3] Liga Saat Ini */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 flex flex-col justify-center items-center">
            {showLeagueLoading ? (
              <h4 className="text-3xl text-coc-gold font-clash">...</h4>
            ) : league?.iconUrls?.tiny ? (
              <Image
                src={league.iconUrls.tiny}
                alt={league.name}
                width={36}
                height={36}
                className="mx-auto"
              />
            ) : (
              <h4 className="text-lg text-coc-gold font-clash">N/A</h4>
            )}
            <p className="text-xs uppercase text-gray-400 font-sans truncate mt-1">
              {showLeagueLoading ? 'Liga' : league?.name || 'Unranked'}
            </p>
          </div>

          {/* Trofi Saat Ini */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <TrophyIcon className="h-4 w-4 inline-block mr-1" />
              {showTrophiesLoading ? '...' : formatNumber(trophies)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Trofi Home
            </p>
          </div>

          {/* [BARU FASE 8.3] Trofi Builder Base */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <TrophyIcon className="h-4 w-4 inline-block mr-1" />
              {showStatsLoading ? '...' : formatNumber(bbTrophies)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Trofi Builder
            </p>
          </div>

          {/* Bintang War */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <StarIcon className="h-4 w-4 inline-block mr-1" />
              {showWarStarsLoading ? '...' : formatNumber(warStars)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Bintang War
            </p>
          </div>

          {/* [BARU FASE 8.3] Menang Serangan */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <SwordsIcon className="h-4 w-4 inline-block mr-1" />
              {showStatsLoading ? '...' : formatNumber(attackWins)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Serangan
            </p>
          </div>

          {/* [BARU FASE 8.3] Menang Bertahan */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              <ShieldIcon className="h-4 w-4 inline-block mr-1" />
              {showStatsLoading ? '...' : formatNumber(defenseWins)}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Bertahan
            </p>
          </div>

          {/* Role CoC */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-lg text-coc-gold font-clash capitalize">
              {isVerified
                ? showRoleLoading
                  ? '...'
                  : role.replace('_', ' ') || 'N/A'
                : 'N/A'}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Role di Klan
            </p>
          </div>

          {/* Clan Tag (jika ada & terverifikasi) */}
          {/* [MODIFIKASI FASE 8.3] Ubah ke col-span-3 */}
          {isVerified && (clanTag || showClanLoading) && (
            <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 col-span-3">
              <Link
                href={
                  userProfile.clanId // Link internal (clanId) HANYA dari cache
                    ? `/clan/internal/${userProfile.clanId}`
                    : `/clan/${encodeURIComponent(clanTag!)}` // Fallback ke link publik
                }
                className="hover:opacity-80 transition-opacity block"
              >
                <h4 className="text-lg text-coc-gold font-mono">
                  {showClanLoading ? '...' : clanTag}
                </h4>
                <p className="text-xs uppercase text-gray-400 font-sans">
                  Klan CoC Saat Ini (
                  {showClanLoading
                    ? '...'
                    : clanName || 'Nama Tidak Tersedia'}
                  )
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Info Sinkronisasi (jika manager & terverifikasi) - TIDAK BERUBAH */}
      {isClanManager && isVerified && (
        <div className="mt-6 p-4 bg-coc-stone/30 rounded-lg border border-coc-gold/20">
          <p className="text-sm font-sans text-gray-300 flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-coc-gold" />
            Data Clan Terakhir Disinkronisasi:
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