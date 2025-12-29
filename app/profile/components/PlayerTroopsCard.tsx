'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

interface PlayerTroopsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Pasukan (Home Village)".
 * Desain: Visual Grid dengan Dynamic Assets.
 */
export const PlayerTroopsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();

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
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Red Glow */}
      <div className="absolute top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-all duration-700" />

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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
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
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {activeSuperTroops.map((troop) => (
                    <div
                      key={troop.name}
                      className="relative bg-coc-gold/10 border border-coc-gold/30 rounded-xl p-2 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] group/item"
                      title={troop.name}
                    >
                      <div className="w-12 h-12 relative mb-1">
                         <img 
                            src={getAssetUrl(troop.name, 'troop')} 
                            alt={troop.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                         />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-coc-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/20 shadow-sm">
                        Lvl {troop.level}
                      </div>
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
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {regularTroops.map((troop) => (
                    <div
                      key={troop.name}
                      className="relative bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 group/item"
                      title={troop.name}
                    >
                      <div className="w-10 h-10 relative mb-1">
                         <img 
                            src={getAssetUrl(troop.name, 'troop')} 
                            alt={troop.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform filter grayscale-[0.3] group-hover/item:grayscale-0"
                            onError={(e) => {
                                // Fallback jika gambar rusak: Tampilkan inisial/kotak kosong
                                e.currentTarget.style.display = 'none';
                            }}
                         />
                      </div>
                      
                      {/* Level Badge */}
                      <div className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${
                          troop.level === troop.maxLevel 
                            ? 'bg-coc-gold text-black border-coc-gold' 
                            : 'bg-black/60 text-white border-white/20'
                      }`}>
                        {troop.level}
                      </div>
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