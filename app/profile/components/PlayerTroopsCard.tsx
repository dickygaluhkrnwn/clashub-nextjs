'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PlayerTroopsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Pasukan (Home Village)".
 * Desain: Glassmorphism Grid.
 */
export const PlayerTroopsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  const { t } = useLanguage();

  // Logika Data: Live > Cache
  const troopsData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Filter Troops Home Village
  const homeTroops = troopsData.filter((t) => t.village === 'home');

  // Pisahkan Super vs Regular
  const activeSuperTroops = homeTroops.filter((t) => t.superTroopIsActive);
  const regularTroops = homeTroops.filter(
    (t) => !t.superTroopIsActive && t.level > 1 // Tampilkan yang sudah di-unlock saja
  );

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Ambient Red Glow for Troops */}
      <div className="absolute top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <SwordsIcon className="h-5 w-5 text-coc-gold" /> {t.profileArmy.troopsTitle}
      </h2>

      {/* Error Message */}
      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.troopsError.replace('{error}', error)}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 space-y-8">
        {showLoading ? (
          // Loading Skeletons
          <div className="space-y-6">
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Super Troops Section */}
            {activeSuperTroops.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-bold text-coc-gold uppercase tracking-widest border-b border-coc-gold/20 pb-2 inline-block">
                  {t.profileArmy.superTroops}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {activeSuperTroops.map((troop) => (
                    <div
                      key={troop.name}
                      className="bg-coc-gold/10 border border-coc-gold/30 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:scale-105 transition-transform duration-300"
                    >
                      <h4 className="text-xl font-bold font-clash text-coc-gold mb-1">
                        Lv {troop.level}
                      </h4>
                      <p className="text-[10px] uppercase font-bold text-coc-gold/80 truncate w-full">
                        {troop.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Troops Section */}
            {regularTroops.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 inline-block">
                  {t.profileArmy.regularTroops}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {regularTroops.map((troop) => (
                    <div
                      key={troop.name}
                      className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-red-500/30 transition-all duration-300 group"
                    >
                      <div className="text-xl font-bold font-clash text-white mb-1 group-hover:text-coc-red transition-colors">
                        Lv {troop.level}
                      </div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 truncate w-full group-hover:text-gray-300">
                        {troop.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {homeTroops.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm">{t.profileArmy.troopsEmpty}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};