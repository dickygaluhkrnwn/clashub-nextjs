'use client';

import React from 'react';
import { HomeIcon, StarIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { formatNumber } from '@/lib/th-utils'; // [UPDATE] Hapus getThImage
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets'; // [BARU] Import hook assets

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
  
  // [FIX] Weapon level untuk TH12+ (biasanya ada di API).
  // Menggunakan casting 'as any' karena properti ini mungkin belum ada di definisi tipe CocPlayer.
  const weaponLevel = (fullPlayerData as any)?.townHallWeaponLevel; 

  // [BARU] Ambil URL gambar dinamis dari Admin Database
  // Nama aset harus sesuai dengan yang diinput di admin, misal "Town Hall 16"
  const assetName = `Town Hall ${thLevel}`;
  const thImageUrl = getAssetUrl(assetName);

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
          <div className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl transition-transform group-hover:scale-105 duration-500 ease-out flex items-center justify-center">
            {/* Menggunakan img tag standar agar support external URL dinamis (GitHub/Imgur) tanpa config */}
            <img
              src={thImageUrl}
              alt={assetName}
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]"
              onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Tampilkan fallback icon jika gambar gagal load
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                  if(fallback) fallback.style.display = 'flex';
              }}
            />
            
            {/* Fallback Icon (Hidden by default) */}
            <div className="fallback-icon absolute inset-0 hidden items-center justify-center -z-10 bg-white/5 rounded-full">
               <HomeIcon className="w-16 h-16 text-white/10" />
            </div>

            {/* Star Rating for TH12+ weapon */}
            {weaponLevel && weaponLevel > 0 && (
               <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 bg-black/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20 shadow-lg z-20">
                   {[...Array(weaponLevel)].map((_, i) => (
                       <StarIcon key={i} className="w-3 h-3 md:w-4 md:h-4 fill-coc-gold text-coc-gold drop-shadow-md" />
                   ))}
               </div>
            )}
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