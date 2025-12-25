'use client';

import React from 'react';
import Image from 'next/image';
import { HomeIcon, StarIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

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
  
  // Logika Data
  const liveTh = fullPlayerData?.townHallLevel;
  const cachedTh = userProfile.thLevel;
  const thLevel = liveTh ?? (cachedTh && cachedTh > 0 ? cachedTh : 1);
  
  const thImage = getThImage(thLevel);
  const expLevel = fullPlayerData?.expLevel ?? userProfile?.expLevel ?? 0;

  // Loading state yang cerdas: Hanya jika tidak ada data sama sekali
  const showLoading = isLoading && !fullPlayerData && !userProfile.thLevel;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center h-full relative overflow-hidden group shadow-lg hover:border-coc-gold/30 transition-all duration-300 hover:-translate-y-1">
      {/* Ambient Gold Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-coc-gold/10 rounded-full blur-3xl pointer-events-none group-hover:bg-coc-gold/20 transition-colors duration-500" />

      <h2 className="mb-4 flex items-center gap-2 font-clash text-lg text-white self-start z-10">
        <HomeIcon className="h-5 w-5 text-coc-gold" /> {t.profileCards.townHall}
      </h2>

      {showLoading ? (
        <div className="flex flex-col items-center justify-center flex-grow gap-4 w-full py-2">
          <div className="w-24 h-24 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-8 w-1/2 bg-white/5 rounded mx-auto animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full z-10 flex-grow justify-center">
          {/* Gambar Town Hall */}
          <div className="relative w-32 h-32 md:w-36 md:h-36 drop-shadow-2xl transition-transform group-hover:scale-105 duration-500 ease-out">
            <Image
              src={thImage}
              alt={`Town Hall Level ${thLevel}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 144px, 144px"
              priority
            />
          </div>

          {/* Grid Stats Mini */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Level TH */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-0.5">
                {t.profileCards.thLevel}
              </span>
              <span className="text-2xl font-clash text-coc-gold leading-none">
                {thLevel}
              </span>
            </div>

            {/* XP Level */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-0.5 flex items-center gap-1">
                {t.profileCards.xpLevel}
              </span>
              <span className="text-2xl font-clash text-blue-400 leading-none">
                {formatNumber(expLevel)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};