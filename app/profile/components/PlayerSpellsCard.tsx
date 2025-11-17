// File: app/profile/components/PlayerSpellsCard.tsx
// Deskripsi: [BARU FASE 3.5] Komponen Card baru untuk menampilkan
// daftar Spells (Home Village) dari data live API.

'use client';

import React from 'react';
import { CocPlayer } from '@/lib/types';
import { BookOpenIcon } from '@/app/components/icons'; // Menggunakan ikon "Buku" untuk Spells

interface PlayerSpellsCardProps {
  // Props ini akan dikirim dari ProfileClient / PlayerProfileClient
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Spell (Home Village)" di halaman profil.
 */
export const PlayerSpellsCard = ({
  fullPlayerData,
  isLoading,
  error,
}: PlayerSpellsCardProps) => {
  // Hanya ambil spells untuk Home Village dan yang sudah di-unlock (level > 1)
  const homeSpells =
    fullPlayerData?.spells?.filter(
      (s) => s.village === 'home' && s.level > 1,
    ) ?? [];

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <BookOpenIcon className="h-6 w-6 text-coc-gold" /> Spell (Home Village)
      </h2>

      {/* --- Handle Loading --- */}
      {isLoading && (
        <p className="text-sm text-gray-400 font-sans text-center">
          Memuat data spell...
        </p>
      )}

      {/* --- Handle Error --- */}
      {error && !isLoading && (
        <p className="text-sm text-red-400 font-sans text-center">
          Gagal memuat spell: {error}
        </p>
      )}

      {/* --- Tampilkan Data --- */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {homeSpells.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {homeSpells.map((spell) => (
                <div
                  key={spell.name}
                  className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/30 text-center"
                >
                  <h4 className="text-xl text-coc-gold font-clash">
                    Lv {spell.level}
                  </h4>
                  <p className="text-xs uppercase text-gray-400 font-sans truncate">
                    {spell.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            // Tampilkan jika fetch selesai tapi tidak ada spell
            <p className="text-sm text-gray-400 font-sans text-center">
              Data spell tidak ditemukan atau player belum membuka spell.
            </p>
          )}
        </div>
      )}
    </div>
  );
};