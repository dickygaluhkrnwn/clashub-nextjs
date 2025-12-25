'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { ShieldIcon } from '@/app/components/icons'; 
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PlayerHeroesCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Hero (Home Village)".
 * Desain: Glassmorphism Grid.
 */
export const PlayerHeroesCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerHeroesCardProps) => {
  const { t } = useLanguage();

  // Logika Data: Live > Cache
  const heroesData = fullPlayerData?.heroes ?? userProfile?.cachedHeroes ?? [];

  // Filter 4 Hero utama & Urutkan
  const heroes = heroesData
    .filter(
      (h) =>
        h.village === 'home' &&
        ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Minion Prince'].includes(h.name)
    )
    .sort((a, b) => {
      const order = [
        'Barbarian King',
        'Archer Queen',
        'Grand Warden',
        'Royal Champion',
        'Minion Prince'
      ];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedHeroes;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Ambient Blue/Purple Glow for Heroes */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <ShieldIcon className="h-5 w-5 text-coc-gold" /> {t.profileArmy.heroTitle}
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.heroError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : heroes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {heroes.map((hero) => (
              <div
                key={hero.name}
                className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div className="mb-2 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold border border-purple-500/30 group-hover:scale-110 transition-transform">
                  {hero.level}
                </div>
                <h4 className="text-sm font-bold font-clash text-white mb-1">
                  {hero.name}
                </h4>
                {hero.maxLevel && (
                   <p className="text-[10px] text-gray-500 font-mono">
                     Max: {hero.maxLevel}
                   </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            <p className="text-sm">{t.profileArmy.heroEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
};