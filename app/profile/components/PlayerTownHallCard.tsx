'use client';

import React from 'react';
import { HomeIcon, StarIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { formatNumber } from '@/lib/th-utils'; 
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets'; 

interface PlayerTownHallCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
}

export const PlayerTownHallCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
}: PlayerTownHallCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();
  
  // Logika Data
  const liveTh = fullPlayerData?.townHallLevel;
  const cachedTh = userProfile.thLevel;
  const thLevel = liveTh ?? (cachedTh && cachedTh > 0 ? cachedTh : 1);
  const weaponLevel = (fullPlayerData as any)?.townHallWeaponLevel; 
  const assetName = `Town Hall ${thLevel}`;
  const thImageUrl = getAssetUrl(assetName);
  const expLevel = fullPlayerData?.expLevel ?? userProfile?.expLevel ?? 0;
  const showLoading = isLoading && !fullPlayerData && !userProfile.thLevel;

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex flex-col h-full relative overflow-hidden group shadow-2xl transition-all duration-300 hover:border-coc-gold/30 hover:shadow-coc-gold/5">
      <div className="bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-xl p-5 flex flex-col items-center text-center h-full w-full relative z-10">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-coc-gold/5 blur-[60px] rounded-full pointer-events-none" />

        {/* REVISI HEADER: PUTIH SOLID + SHADOW */}
        <h2 className="mb-2 flex items-center gap-2 font-clash text-lg text-white self-start z-10 tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <HomeIcon className="h-5 w-5 text-coc-gold drop-shadow-sm" /> 
          <span>
            {t.profileCards.townHall}
          </span>
        </h2>

        {showLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow gap-4 w-full py-4">
            <div className="w-32 h-32 rounded-full bg-white/5 animate-pulse shadow-inner border border-white/5" />
            <div className="h-6 w-24 bg-white/5 rounded mx-auto animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col items-center w-full z-10 flex-grow justify-between gap-4 mt-2">
            
            <div className="relative w-full flex items-center justify-center py-4 group-hover:scale-105 transition-transform duration-500 ease-out">
              <div className="absolute w-32 h-32 bg-coc-blue/10 rounded-full blur-2xl animate-pulse-slow" />
              <div className="relative w-36 h-36 md:w-44 md:h-44 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                <img
                  src={thImageUrl}
                  alt={assetName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if(fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="fallback-icon absolute inset-0 hidden items-center justify-center -z-10 bg-white/5 rounded-full border border-white/10">
                   <HomeIcon className="w-16 h-16 text-white/10" />
                </div>
                {weaponLevel && weaponLevel > 0 && (
                   <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg z-20">
                       {[...Array(weaponLevel)].map((_, i) => (
                           <StarIcon key={i} className="w-3.5 h-3.5 fill-coc-gold text-coc-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                       ))}
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <div className="bg-[#0a0a0b] border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden group/panel">
                <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover/panel:opacity-100 transition-opacity" />
                {/* REVISI LABEL: TERANG */}
                <span className="text-[9px] md:text-[10px] uppercase text-gray-300 font-bold tracking-widest mb-1 z-10 drop-shadow-md">
                  {t.profileCards.thLevel}
                </span>
                <span className="text-2xl md:text-3xl font-clash text-coc-gold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10">
                  {thLevel}
                </span>
              </div>

              <div className="bg-[#0a0a0b] border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden group/panel">
                <div className="absolute inset-0 bg-coc-blue/5 opacity-0 group-hover/panel:opacity-100 transition-opacity" />
                {/* REVISI LABEL: TERANG */}
                <span className="text-[9px] md:text-[10px] uppercase text-gray-300 font-bold tracking-widest mb-1 z-10 drop-shadow-md">
                  {t.profileCards.xpLevel}
                </span>
                <span className="text-2xl md:text-3xl font-clash text-blue-400 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10">
                  {formatNumber(expLevel)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};