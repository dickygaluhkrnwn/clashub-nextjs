'use client';

import React from 'react';
import Image from 'next/image';
import { HomeIcon, StarIcon } from '@/app/components/icons'; // Menggunakan HomeIcon untuk TH
import { UserProfile, CocPlayer } from '@/lib/types';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

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
  const { t } = useLanguage(); // [BARU]
  // --- 1. Logika Penggabungan Data (Live vs Cache) ---
  
  // Ambil TH Level
  const liveTh = fullPlayerData?.townHallLevel;
  const cachedTh = userProfile.thLevel;
  // Prioritaskan live, lalu cache, fallback ke 1 jika tidak ada data
  const thLevel = liveTh ?? (cachedTh && cachedTh > 0 ? cachedTh : 1);
  
  // Ambil URL Gambar TH
  const thImage = getThImage(thLevel);

  // Ambil XP Level (Live atau Cache)
  const expLevel = fullPlayerData?.expLevel ?? userProfile?.expLevel ?? 0;

  // Cek loading state
  // Tampilkan loading HANYA jika data live sedang ditarik DAN tidak ada data cache
  const showLoading = isLoading && !fullPlayerData && !userProfile.thLevel;

  return (
    <div className="card-stone p-6 rounded-lg flex flex-col items-center text-center h-full relative overflow-hidden">
      {/* Efek visual latar belakang */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-coc-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-xl text-white self-start z-10">
        {/* [TERJEMAHAN] */}
        <HomeIcon className="h-5 w-5 text-coc-gold" /> {t.profileCards.townHall}
      </h2>

      {showLoading ? (
        <div className="flex flex-col items-center justify-center flex-grow gap-4 py-4 w-full">
          <div className="w-24 h-24 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-8 w-1/2 bg-white/5 rounded mx-auto animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full z-10">
          {/* Gambar Town Hall Besar */}
          <div className="relative w-36 h-36 filter drop-shadow-2xl transition-transform hover:scale-105 duration-300">
            <Image
              src={thImage}
              alt={`Town Hall Level ${thLevel}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 144px, 144px"
              priority
            />
          </div>

          {/* Grid Statistik (TH & XP) */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Level TH */}
            <div className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/30 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-gray-400 font-sans mb-1 tracking-wider">
                {/* [TERJEMAHAN] */}
                {t.profileCards.thLevel}
              </span>
              <span className="text-3xl font-clash text-white leading-none">
                {thLevel}
              </span>
            </div>

            {/* XP Level */}
            <div className="bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/30 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase text-gray-400 font-sans mb-1 tracking-wider flex items-center gap-1">
                {/* [TERJEMAHAN] */}
                <StarIcon className="h-3 w-3 text-coc-blue-light" /> {t.profileCards.xpLevel}
              </span>
              <span className="text-3xl font-clash text-coc-blue-light leading-none">
                {formatNumber(expLevel)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};