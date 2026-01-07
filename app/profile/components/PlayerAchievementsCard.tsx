'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { TrophyIcon, StarIcon } from '@/app/components/icons';
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
 * Desain: Gaming Grid dengan Star Rating & Progress Visuals.
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
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-gold/10 transition-all duration-700" />

      {/* Header - Putih Solid + Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.3)]">
            <TrophyIcon className="h-5 w-5 text-coc-gold" /> 
        </div>
        <span>
            {t.profileAchievements.title}
        </span>
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
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 h-24 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredAchievements.map((ach) => {
              // Asumsi: achievements dari API memiliki properti 'stars' (0-3). 
              // Jika cachedAchievements tidak menyimpan stars, kita default ke 0 atau logika lain.
              // Di sini kita cek keberadaan properti stars.
              const stars = (ach as any).stars ?? 0;
              const isCompleted = stars === 3;

              return (
                <div
                  key={ach.name}
                  className={`
                    relative rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 group/item overflow-hidden border
                    ${isCompleted 
                        ? 'bg-gradient-to-br from-[#2a2510] to-[#15171e] border-coc-gold/30 hover:border-coc-gold/50 shadow-[0_4px_20px_-10px_rgba(255,215,0,0.2)]' 
                        : 'bg-[#0f1115] border-white/5 hover:bg-white/5 hover:border-white/20'
                    }
                  `}
                >
                  {/* Background Shine for completed */}
                  {isCompleted && (
                      <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
                  )}

                  {/* Stars Indicator */}
                  <div className="flex gap-0.5 mb-2 opacity-80">
                      {[...Array(3)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`w-3 h-3 drop-shadow-sm ${i < stars ? 'text-coc-gold fill-current' : 'text-gray-700 fill-current'}`} 
                          />
                      ))}
                  </div>

                  {/* Value */}
                  <h4 className={`text-xl md:text-2xl font-bold font-clash mb-1 transition-transform group-hover/item:scale-110 drop-shadow-md ${isCompleted ? 'text-coc-gold' : 'text-white'}`}>
                    {formatNumber(ach.value)}
                  </h4>

                  {/* Label Name */}
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 group-hover/item:text-gray-300 font-bold line-clamp-2 leading-tight transition-colors">
                    {ach.name}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
            <TrophyIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">{t.profileAchievements.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
};