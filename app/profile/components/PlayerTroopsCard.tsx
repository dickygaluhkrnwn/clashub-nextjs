'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon, StarIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

interface PlayerTroopsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Pasukan Reguler".
 * Desain: Gaming Grid dengan kartu unit individual.
 */
export const PlayerTroopsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl, getAssetType } = useGameAssets();

  const troopsData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Filter Logic:
  const regularTroops = troopsData.filter((t) => {
     const type = getAssetType(t.name);
     const isPet = type === 'pet';
     const isSuperActive = t.superTroopIsActive;
     
     const isSuperType = type === 'super-troop' || t.name.startsWith('Super ') || t.name === 'Ice Hound' || t.name === 'Rocket Balloon' || t.name === 'Inferno Dragon';

     return t.village === 'home' && !isPet && !isSuperActive && !isSuperType;
  });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Background */}
      <div className="absolute top-20 -right-20 w-64 h-64 bg-coc-red/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-red/10 transition-all duration-700" />

      {/* Header - FIXED: White Text with Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-red/10 rounded-lg border border-coc-red/20 shadow-[0_0_10px_rgba(248,113,113,0.3)]">
            <SwordsIcon className="h-5 w-5 text-coc-red" /> 
        </div>
        <span>
            {t.profileArmy.troopsTitle}
        </span>
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.troopsError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10 space-y-8">
        {showLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Regular Troops Grid */}
            {regularTroops.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {regularTroops.map((troop) => {
                    const isMax = troop.level === troop.maxLevel;
                    
                    return (
                    <div
                      key={troop.name}
                      className={`relative bg-[#0f1115] border ${isMax ? 'border-coc-gold/30' : 'border-white/5'} rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/5 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 group/item shadow-sm`}
                      title={troop.name}
                    >
                      {/* Glow effect for Max Level */}
                      {isMax && <div className="absolute inset-0 bg-coc-gold/5 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />}

                      <div className="w-12 h-12 relative mb-1 z-10">
                          <img 
                            src={getAssetUrl(troop.name)} 
                            alt={troop.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                          />
                      </div>
                      
                      {/* Level Badge */}
                      <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold px-1 rounded shadow-sm border z-20 ${
                          isMax 
                            ? 'bg-coc-gold text-black border-yellow-200 shadow-coc-gold/20' 
                            : 'bg-[#1a1a1a] text-white border-white/20'
                      }`}>
                        {troop.level}
                      </div>

                      {/* Max Star Indicator */}
                      {isMax && (
                          <div className="absolute -bottom-1 -right-1">
                              <StarIcon className="w-3 h-3 text-coc-gold fill-current drop-shadow-sm" />
                          </div>
                      )}
                    </div>
                  )})}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
                <SwordsIcon className="w-10 h-10 opacity-20" />
                <p className="text-sm font-medium">{t.profileArmy.troopsEmpty}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};