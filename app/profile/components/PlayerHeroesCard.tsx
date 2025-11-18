// File: app/profile/components/PlayerHeroesCard.tsx
// Deskripsi: [MODIFIKASI FASE 6.2] Memperbarui card untuk
// membaca dari cache 'userProfile.cachedHeroes'.

'use client';

import React from 'react';
// [MODIFIKASI 6.2] Impor UserProfile
import { CocPlayer, UserProfile } from '@/lib/types';
import { ShieldIcon } from '@/app/components/icons'; // Menggunakan ikon yang relevan

interface PlayerHeroesCardProps {
  // [MODIFIKASI 6.2] Tambahkan userProfile
  userProfile: UserProfile; // Data cache dari Firebase
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Hero (Home Village)" di halaman profil.
 */
export const PlayerHeroesCard = ({
  // [MODIFIKASI 6.2] Destructure userProfile
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerHeroesCardProps) => {
  // --- [MODIFIKASI FASE 6.2] ---
  // Logika Penggabungan Data:
  // 1. Coba 'fullPlayerData.heroes' (live)
  // 2. Fallback ke 'userProfile.cachedHeroes' (cache)
  const heroesData =
    fullPlayerData?.heroes ?? userProfile?.cachedHeroes ?? [];
  // --- [AKHIR MODIFIKASI] ---

  // Ambil 4 Hero utama (Home Village) dari data gabungan
  const heroes =
    heroesData
      ?.filter(
        (h) =>
          h.village === 'home' &&
          [
            'Barbarian King',
            'Archer Queen',
            'Grand Warden',
            'Royal Champion',
          ].includes(h.name),
      )
      .sort((a, b) => {
        // Urutkan berdasarkan urutan rilis hero, bukan alfabet
        const order = [
          'Barbarian King',
          'Archer Queen',
          'Grand Warden',
          'Royal Champion',
        ];
        return order.indexOf(a.name) - order.indexOf(b.name);
      }) ?? []; // Default array kosong jika tidak ada

  // --- [MODIFIKASI FASE 6.2] Logika Tampilan ---
  // Tampilkan loading HANYA jika data live sedang loading
  // DAN kita tidak punya data cache untuk ditampilkan.
  const showLoading =
    isLoading && !fullPlayerData && !userProfile.cachedHeroes;
  // --- [AKHIR MODIFIKASI] ---

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <ShieldIcon className="h-6 w-6 text-coc-gold" /> Hero (Home Village)
      </h2>

      {/* --- Handle Loading [MODIFIKASI 6.2] --- */}
      {showLoading && (
        <p className="text-sm text-gray-400 font-sans text-center">
          Memuat data hero...
        </p>
      )}

      {/* --- Handle Error --- */}
      {error && !isLoading && (
        <p className="text-sm text-red-400 font-sans text-center">
          Gagal memuat hero: {error}
        </p>
      )}

      {/* --- Tampilkan Data [MODIFIKASI 6.2] --- */}
      {!showLoading && !error && (
        <div className="space-y-6">
          {heroes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {heroes.map((hero) => (
                <div
                  key={hero.name}
                  className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 text-center"
                >
                  <h4 className="text-xl text-coc-gold font-clash">
                    Lv {hero.level}
                  </h4>
                  <p className="text-xs uppercase text-gray-400 font-sans truncate">
                    {hero.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Tampilkan jika fetch selesai (atau cache kosong)
            <p className="text-sm text-gray-400 font-sans text-center">
              Data hero tidak ditemukan atau player belum memiliki hero.
            </p>
          )}
        </div>
      )}
    </div>
  );
};