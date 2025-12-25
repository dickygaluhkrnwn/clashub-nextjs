'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { TrophyIcon } from '@/app/components/icons';
import { formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PlayerAchievementsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

// Daftar pencapaian yang relevan untuk ditampilkan
const RELEVANT_ACHIEVEMENTS: Set<string> = new Set([
  'Friend in Need',       // Donasi
  'Gold Grab',            // Rampasan Gold
  'Elixir Escapade',      // Rampasan Elixir
  'Heroic Heist',         // Rampasan Dark Elixir
  'Conqueror',            // Serangan Menang
  'Unbreakable',          // Defense Menang
  'Games Champion',       // Poin Clan Games
  'War League Legend',    // Bintang CWL
  'Aggressive Approach',  // Rampasan Capital
  'Most Valuable Clanmate', // Mata Uang Capital
]);

/**
 * Komponen Card "Pencapaian".
 * Desain: Glassmorphism Grid.
 */
export const PlayerAchievementsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerAchievementsCardProps) => {
  const { t } = useLanguage();

  // Logika Data: Live > Cache > Empty Array
  const achievementsData = fullPlayerData?.achievements ?? userProfile?.cachedAchievements ?? [];

  const filteredAchievements = achievementsData.filter(
    (ach) => ach.village === 'home' && RELEVANT_ACHIEVEMENTS.has(ach.name)
  );

  // Loading state: Hanya jika sedang fetch live DAN tidak ada cache
  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedAchievements;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-coc-gold/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <TrophyIcon className="h-5 w-5 text-coc-gold" /> {t.profileAchievements.title}
      </h2>

      {/* Error Message */}
      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileAchievements.error.replace('{error}', error)}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.name}
                className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-coc-gold/20 transition-all duration-300 group"
              >
                <h4 className="text-xl font-bold font-clash text-coc-gold mb-1 group-hover:scale-110 transition-transform">
                  {formatNumber(ach.value)}
                </h4>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold line-clamp-2">
                  {ach.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            <p className="text-sm">{t.profileAchievements.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};