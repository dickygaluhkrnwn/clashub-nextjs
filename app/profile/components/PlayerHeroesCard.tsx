// File: app/profile/components/PlayerHeroesCard.tsx
// Deskripsi: [BARU FASE 3.5] Komponen Card baru untuk menampilkan
// daftar Heroes (Home Village) dari data live API.

'use client';

import React from 'react';
import { CocPlayer } from '@/lib/types';
import { ShieldIcon } from '@/app/components/icons'; // Menggunakan ikon yang relevan

interface PlayerHeroesCardProps {
  // Props ini akan dikirim dari ProfileClient / PlayerProfileClient
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Hero (Home Village)" di halaman profil.
 */
export const PlayerHeroesCard = ({
  fullPlayerData,
  isLoading,
  error,
}: PlayerHeroesCardProps) => {
  // Ambil 4 Hero utama (Home Village) dari data live
  const heroes =
    fullPlayerData?.heroes
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

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <ShieldIcon className="h-6 w-6 text-coc-gold" /> Hero (Home Village)
      </h2>

      {/* --- Handle Loading --- */}
      {isLoading && (
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

      {/* --- Tampilkan Data --- */}
      {!isLoading && !error && (
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
            // Tampilkan jika fetch selesai tapi tidak ada hero (atau error)
            <p className="text-sm text-gray-400 font-sans text-center">
              Data hero tidak ditemukan atau player belum memiliki hero.
            </p>
          )}
        </div>
      )}
    </div>
  );
};