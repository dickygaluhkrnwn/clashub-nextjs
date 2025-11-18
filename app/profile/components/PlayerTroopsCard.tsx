// File: app/profile/components/PlayerTroopsCard.tsx
// Deskripsi: [MODIFIKASI FASE 6.3] Memperbarui card untuk
// membaca dari cache 'userProfile.cachedTroops'.

'use client';

import React from 'react';
// [MODIFIKASI 6.3] Impor UserProfile
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons'; // Menggunakan ikon yang relevan

interface PlayerTroopsCardProps {
  // [MODIFIKASI 6.3] Tambahkan userProfile
  userProfile: UserProfile; // Data cache dari Firebase
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Pasukan (Home Village)" di halaman profil.
 */
export const PlayerTroopsCard = ({
  // [MODIFIKASI 6.3] Destructure userProfile
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  // --- [MODIFIKASI FASE 6.3] ---
  // Logika Penggabungan Data:
  // 1. Coba 'fullPlayerData.troops' (live)
  // 2. Fallback ke 'userProfile.cachedTroops' (cache)
  const troopsData =
    fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Hanya ambil troops untuk Home Village
  const homeTroops = troopsData.filter((t) => t.village === 'home');
  // --- [AKHIR MODIFIKASI] ---

  // Pisahkan Super Troops yang aktif
  const activeSuperTroops = homeTroops.filter((t) => t.superTroopIsActive);
  const regularTroops = homeTroops.filter(
    (t) => !t.superTroopIsActive && t.level > 1, // Filter troops yang belum di-unlock
  );

  // --- [MODIFIKASI FASE 6.3] Logika Tampilan ---
  // Tampilkan loading HANYA jika data live sedang loading
  // DAN kita tidak punya data cache untuk ditampilkan.
  const showLoading =
    isLoading && !fullPlayerData && !userProfile.cachedTroops;
  // --- [AKHIR MODIFIKASI] ---

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <SwordsIcon className="h-6 w-6 text-coc-gold" /> Pasukan (Home Village)
      </h2>

      {/* --- Handle Loading [MODIFIKASI 6.3] --- */}
      {showLoading && (
        <p className="text-sm text-gray-400 font-sans text-center">
          Memuat data pasukan...
        </p>
      )}

      {/* --- Handle Error --- */}
      {error && !isLoading && (
        <p className="text-sm text-red-400 font-sans text-center">
          Gagal memuat pasukan: {error}
        </p>
      )}

      {/* --- Tampilkan Data [MODIFIKASI 6.3] --- */}
      {!showLoading && !error && (
        <div className="space-y-6">
          {/* Bagian Super Troops (jika ada) */}
          {activeSuperTroops.length > 0 && (
            <div>
              <h3 className="mb-3 font-clash text-lg text-coc-gold">
                Super Troops Aktif
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {activeSuperTroops.map((troop) => (
                  <div
                    key={troop.name}
                    className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold text-center"
                  >
                    <h4 className="text-xl text-coc-gold font-clash">
                      Lv {troop.level}
                    </h4>
                    <p className="text-xs uppercase text-coc-gold font-sans truncate">
                      {troop.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bagian Regular Troops */}
          {regularTroops.length > 0 && (
            <div>
              <h3 className="mb-3 font-clash text-lg text-white">
                Pasukan Elixir & Dark Elixir
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {regularTroops.map((troop) => (
                  <div
                    key={troop.name}
                    className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/30 text-center"
                  >
                    <h4 className="text-xl text-coc-gold font-clash">
                      Lv {troop.level}
                    </h4>
                    <p className="text-xs uppercase text-gray-400 font-sans truncate">
                      {troop.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback jika tidak ada troops sama sekali */}
          {/* [MODIFIKASI 6.3] Cek 'homeTroops' (data gabungan) */}
          {homeTroops.length === 0 && (
            <p className="text-sm text-gray-400 font-sans text-center">
              Data pasukan tidak ditemukan.
            </p>
          )}
        </div>
      )}
    </div>
  );
};