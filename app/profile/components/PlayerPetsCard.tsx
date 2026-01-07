'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';
import { StarIcon } from '@/app/components/icons';

// Ikon Paw Print (Telapak Kaki) Khusus untuk Pet
const PawIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2ZM6 7C4.34315 7 3 8.34315 3 10C3 11.6569 4.34315 13 6 13C7.65685 13 9 11.6569 9 10C9 8.34315 7.65685 7 6 7ZM18 7C16.3431 7 15 8.34315 15 10C15 11.6569 16.3431 13 18 13C19.6569 13 21 11.6569 21 10C21 8.34315 19.6569 7 18 7ZM6.6099 15.6521C5.5539 16.2951 5 17.5 5 18.5C5 20.433 6.567 22 8.5 22C9.75543 22 10.8524 21.3326 11.4583 20.3162C11.6111 20.0598 11.9566 20.0617 12.1107 20.3188C12.723 21.3409 13.8296 22 15.0991 22C17.2536 22 19 20.2536 19 18.0991C19 17.0676 18.3533 15.8202 17.1517 15.1979C16.4802 14.8501 15.6888 14.7571 14.949 14.8722C14.0042 15.0193 13.0135 15.0134 12.0831 14.8697C11.1644 14.7278 10.2223 14.8659 9.39082 15.3129C8.42391 15.8327 7.42065 15.1583 6.6099 15.6521Z" />
  </svg>
);

interface PlayerPetsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

export const PlayerPetsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerPetsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl, getAssetType } = useGameAssets(); 

  // Ambil data Troops (API CoC menggabungkan Pet di dalam array Troops)
  const rawData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Filter Dinamis berdasarkan Asset Manager
  const pets = rawData.filter(item => {
      const type = getAssetType(item.name);
      return type === 'pet';
  });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  // Jika tidak ada pet sama sekali, jangan render
  if (!showLoading && pets.length === 0) return null;

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Ambient Green Glow */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

      {/* Header - White Text + Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <PawIcon className="h-5 w-5 text-emerald-400" /> 
        </div>
        <span>
            {(t.profileArmy as any)?.petsTitle || "Hero Pets"}
        </span>
      </h2>

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {pets.map((pet) => {
              const isMax = pet.level === pet.maxLevel;
              
              return (
              <div
                key={pet.name}
                className={`relative bg-[#0f1115] border ${isMax ? 'border-emerald-400/30' : 'border-white/5'} rounded-xl p-2 flex flex-col items-center justify-center hover:bg-emerald-900/10 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 group/item shadow-sm`}
                title={pet.name}
              >
                {/* Glow effect for Max Level */}
                {isMax && <div className="absolute inset-0 bg-emerald-400/5 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />}

                <div className="w-12 h-12 relative mb-1 z-10">
                   <img 
                      src={getAssetUrl(pet.name)} 
                      alt={pet.name}
                      className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover/item:scale-110 transition-transform duration-300"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                
                {/* Level Badge */}
                <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold px-1 rounded shadow-sm border z-20 ${
                    isMax 
                      ? 'bg-emerald-500 text-black border-emerald-300 shadow-emerald-500/20' 
                      : 'bg-[#1a1a1a] text-white border-white/20'
                }`}>
                  {pet.level}
                </div>

                {/* Max Star Indicator */}
                {isMax && (
                    <div className="absolute -bottom-1 -right-1">
                        <StarIcon className="w-3 h-3 text-emerald-400 fill-current drop-shadow-sm" />
                    </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};