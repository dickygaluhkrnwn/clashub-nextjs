// File: app/profile/components/PlayerSpellsCard.tsx
// Deskripsi: [MODIFIKASI FASE 6.4] Memperbarui card untuk
// membaca dari cache 'userProfile.cachedSpells'.

'use client';

import React from 'react';
// [MODIFIKASI 6.4] Impor UserProfile
import { CocPlayer, UserProfile } from '@/lib/types';
import { BookOpenIcon } from '@/app/components/icons'; // Menggunakan ikon "Buku" untuk Spells

interface PlayerSpellsCardProps {
  // [MODIFIKASI 6.4] Tambahkan userProfile
  userProfile: UserProfile; // Data cache dari Firebase
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card untuk menampilkan "Spell (Home Village)" di halaman profil.
 */
export const PlayerSpellsCard = ({
  // [MODIFIKASI 6.4] Destructure userProfile
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerSpellsCardProps) => {
  // --- [MODIFIKASI FASE 6.4] ---
  // Logika Penggabungan Data:
  // 1. Coba 'fullPlayerData.spells' (live)
  // 2. Fallback ke 'userProfile.cachedSpells' (cache)
  const spellsData =
    fullPlayerData?.spells ?? userProfile?.cachedSpells ?? [];
  // --- [AKHIR MODIFIKASI] ---

  // Hanya ambil spells untuk Home Village dan yang sudah di-unlock (level > 1)
  const homeSpells =
    spellsData.filter(
      (s) => s.village === 'home' && s.level > 1,
    ) ?? [];

  // --- [MODIFIKASI FASE 6.4] Logika Tampilan ---
  // Tampilkan loading HANYA jika data live sedang loading
  // DAN kita tidak punya data cache untuk ditampilkan.
  const showLoading =
    isLoading && !fullPlayerData && !userProfile.cachedSpells;
  // --- [AKHIR MODIFIKASI] ---

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <BookOpenIcon className="h-6 w-6 text-coc-gold" /> Spell (Home Village)
      </h2>

      {/* --- Handle Loading [MODIFIKASI 6.4] --- */}
      {showLoading && (
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

      {/* --- Tampilkan Data [MODIFIKASI 6.4] --- */}
      {!showLoading && !error && (
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