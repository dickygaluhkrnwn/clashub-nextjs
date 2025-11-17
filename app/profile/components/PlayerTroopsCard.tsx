// File: app/profile/components/PlayerTroopsCard.tsx
// Deskripsi: [BARU FASE 3.5] Komponen Card baru untuk menampilkan
// daftar Troops (Home Village) dari data live API.

'use client';

import React from 'react';
import { CocPlayer } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons'; // Menggunakan ikon yang relevan

interface PlayerTroopsCardProps {
  // Props ini akan dikirim dari ProfileClient / PlayerProfileClient
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Pasukan (Home Village)" di halaman profil.
 */
export const PlayerTroopsCard = ({
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  // Hanya ambil troops untuk Home Village
  const homeTroops =
    fullPlayerData?.troops?.filter((t) => t.village === 'home') ?? [];

  // Pisahkan Super Troops yang aktif
  const activeSuperTroops = homeTroops.filter((t) => t.superTroopIsActive);
  const regularTroops = homeTroops.filter(
    (t) => !t.superTroopIsActive && t.level > 1, // Filter troops yang belum di-unlock
  );

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <SwordsIcon className="h-6 w-6 text-coc-gold" /> Pasukan (Home Village)
      </h2>

      {/* --- Handle Loading --- */}
      {isLoading && (
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

      {/* --- Tampilkan Data --- */}
      {!isLoading && !error && (
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