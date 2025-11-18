// File: app/profile/components/PlayerAchievementsCard.tsx
// Deskripsi: [MODIFIKASI FASE 6.5] Memperbarui card untuk
// membaca dari cache 'userProfile.cachedAchievements'.

'use client';

import React from 'react';
// [MODIFIKASI 6.5] Impor UserProfile
import { CocPlayer, UserProfile } from '@/lib/types';
import { TrophyIcon } from '@/app/components/icons'; // Menggunakan ikon Trofi
import { formatNumber } from '@/lib/th-utils'; // Util format angka

interface PlayerAchievementsCardProps {
  // [MODIFIKASI 6.5] Tambahkan userProfile
  userProfile: UserProfile; // Data cache dari Firebase
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

// [FASE 5] Daftar pencapaian yang ingin kita tampilkan.
// Kita tidak menampilkan SEMUA, hanya yang relevan.
// "War Hero" (Bintang War) sengaja di-skip karena sudah ada di GameStatusCard.
const RELEVANT_ACHIEVEMENTS: Set<string> = new Set([
  'Friend in Need', // Donasi
  'Gold Grab', // Rampasan Gold
  'Elixir Escapade', // Rampasan Elixir
  'Heroic Heist', // Rampasan Dark Elixir
  'Conqueror', // Serangan Menang
  'Unbreakable', // Defense Menang
  'Games Champion', // Poin Clan Games
  'War League Legend', // Bintang CWL
  'Aggressive Approach', // Rampasan Capital
  'Most Valuable Clanmate', // Mata Uang Capital
]);

/**
 * Komponen Card untuk menampilkan "Pencapaian" di halaman profil.
 */
export const PlayerAchievementsCard = ({
  // [MODIFIKASI 6.5] Destructure userProfile
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerAchievementsCardProps) => {
  // --- [MODIFIKASI FASE 6.5] ---
  // Logika Penggabungan Data:
  // 1. Coba 'fullPlayerData.achievements' (live)
  // 2. Fallback ke 'userProfile.cachedAchievements' (cache)
  const achievementsData =
    fullPlayerData?.achievements ?? userProfile?.cachedAchievements ?? [];
  // --- [AKHIR MODIFIKASI] ---

  // Filter hanya achievements yang relevan dan dari Home Village
  const filteredAchievements =
    achievementsData?.filter(
      (ach) =>
        ach.village === 'home' && RELEVANT_ACHIEVEMENTS.has(ach.name),
    ) ?? [];

  // --- [MODIFIKASI FASE 6.5] Logika Tampilan ---
  // Tampilkan loading HANYA jika data live sedang loading
  // DAN kita tidak punya data cache untuk ditampilkan.
  const showLoading =
    isLoading && !fullPlayerData && !userProfile.cachedAchievements;
  // --- [AKHIR MODIFIKASI] ---

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <TrophyIcon className="h-6 w-6 text-coc-gold" /> Pencapaian
      </h2>

      {/* --- Handle Loading [MODIFIKASI 6.5] --- */}
      {showLoading && (
        <p className="text-sm text-gray-400 font-sans text-center">
          Memuat data pencapaian...
        </p>
      )}

      {/* --- Handle Error --- */}
      {error && !isLoading && (
        <p className="text-sm text-red-400 font-sans text-center">
          Gagal memuat pencapaian: {error}
        </p>
      )}

      {/* --- Tampilkan Data [MODIFIKASI 6.5] --- */}
      {!showLoading && !error && (
        <div className="space-y-6">
          {filteredAchievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAchievements.map((ach) => (
                <div
                  key={ach.name}
                  className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/30 text-center"
                >
                  {/* Gunakan formatNumber dari th-utils */}
                  <h4 className="text-xl text-coc-gold font-clash">
                    {formatNumber(ach.value)}
                  </h4>
                  <p className="text-xs uppercase text-gray-400 font-sans truncate">
                    {ach.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Tampilkan jika fetch selesai tapi tidak ada data
            <p className="text-sm text-gray-400 font-sans text-center">
              Data pencapaian tidak ditemukan.
            </p>
          )}
        </div>
      )}
    </div>
  );
};