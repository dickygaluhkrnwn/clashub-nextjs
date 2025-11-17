// File: app/profile/components/GameStatusCard.tsx
// [MODIFIKASI FASE 3.5]: Membersihkan card. Logika Hero dipindahkan
// ke PlayerHeroesCard.tsx. Card ini sekarang FOKUS pada status utama.

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
// [MODIFIKASI FASE 2] Impor StarIcon untuk Bintang War
import { TrophyIcon, InfoIcon, StarIcon } from '@/app/components/icons';
// [MODIFIKASI FASE 2] Impor tipe data lengkap
import { UserProfile, CocPlayer } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';

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

  // Tentukan TH Level: Prioritaskan data live, fallback ke cache
  const liveThLevel = fullPlayerData?.townHallLevel;
  const cachedThLevel =
    userProfile.thLevel &&
    !isNaN(userProfile.thLevel) &&
    userProfile.thLevel > 0
      ? userProfile.thLevel
      : 9; // Fallback TH 9 jika cache tidak valid
  const thLevel = liveThLevel || cachedThLevel;
  const thImage = getThImage(thLevel);

  // Tentukan Trofi: Prioritaskan data live, fallback ke cache
  const trophies = fullPlayerData?.trophies ?? userProfile.trophies;

  // [BARU FASE 2] Ambil Bintang War dari data live
  // API CoC menyimpan Bintang War di achievement "War Hero"
  const warStars =
    fullPlayerData?.achievements.find((a) => a.name === 'War Hero')?.value ??
    null;

  // Tentukan Role: Prioritaskan data live, fallback ke cache
  const role = fullPlayerData?.role || inGameRole;

  // Tentukan Info Klan: Prioritaskan data live, fallback ke cache
  const clanTag = fullPlayerData?.clan?.tag || userProfile.clanTag;
  const clanName = fullPlayerData?.clan?.name || userProfile.clanName;

  // --- [MODIFIKASI FASE 3.5] ---
  // Logika 'heroes' Dihapus dari sini.
  // Sudah dipindahkan ke PlayerHeroesCard.tsx
  // --- [AKHIR MODIFIKASI] ---

  // --- 2. Render Komponen ---
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan{' '}
        {/* [MODIFIKASI FASE 2] Tampilkan status loading */}
        {isVerified
          ? isLoading
            ? '(Sinkronisasi...)'
            : '(LIVE dari CoC)'
          : '(Data Tersimpan)'}
      </h2>

      {/* [BARU FASE 2] Tampilkan pesan Error jika fetch gagal */}
      {error && (
        <div className="mb-4 p-4 text-center bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <p className="font-bold">Gagal mengambil data live CoC:</p>
          <p className="text-sm font-sans">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-6">
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
        <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
          {/* Level Town Hall */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {/* [MODIFIKASI FASE 2] Tampilkan '...' saat loading */}
              {isLoading && !liveThLevel ? '...' : thLevel}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Level Town Hall
            </p>
          </div>
          {/* Trofi Saat Ini */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {isLoading && !fullPlayerData
                ? '...'
                : trophies?.toLocaleString('id-ID') || '0'}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Trofi Saat Ini
            </p>
          </div>
          {/* [MODIFIKASI FASE 2] Bintang War (Data Baru) */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {isLoading && !fullPlayerData
                ? '...'
                : warStars?.toLocaleString('id-ID') || 'N/A'}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Bintang War
            </p>
          </div>
          {/* Role CoC */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-lg text-coc-gold font-clash capitalize">
              {isVerified
                ? isLoading && !fullPlayerData
                  ? '...'
                  : role.replace('_', ' ') || 'N/A'
                : 'N/A'}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Role di Klan CoC
            </p>
          </div>
          {/* Clan Tag (jika ada & terverifikasi) */}
          {/* [MODIFIKASI FASE 2] Gunakan data live/cache */}
          {isVerified && (clanTag || (isLoading && !fullPlayerData)) && (
            <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 col-span-2">
              <Link
                href={
                  userProfile.clanId // Link internal (clanId) HANYA dari cache
                    ? `/clan/internal/${userProfile.clanId}`
                    : `/clan/${encodeURIComponent(clanTag!)}` // Fallback ke link publik
                }
                className="hover:opacity-80 transition-opacity block"
              >
                <h4 className="text-lg text-coc-gold font-mono">
                  {isLoading && !fullPlayerData ? '...' : clanTag}
                </h4>
                <p className="text-xs uppercase text-gray-400 font-sans">
                  Klan CoC Saat Ini (
                  {isLoading && !fullPlayerData
                    ? '...'
                    : clanName || 'Nama Tidak Tersedia'}
                  )
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* --- [MODIFIKASI FASE 3.5] --- */}
      {/* Bagian "Level Hero" Dihapus dari sini */}
      {/* --- [AKHIR MODIFIKASI] --- */}

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