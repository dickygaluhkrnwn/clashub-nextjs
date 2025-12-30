'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

// Ikon Petir (Lightning) Khusus untuk Super Troops
const LightningIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
  </svg>
);

interface PlayerSuperTroopsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

export const PlayerSuperTroopsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerSuperTroopsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();

  // Logika Data
  const troopsData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Filter HANYA Super Troops yang AKTIF (Sedang di-boost)
  // API CoC memberikan properti `superTroopIsActive: true` untuk troop yang sedang aktif.
  const activeSuperTroops = troopsData.filter((t) => t.superTroopIsActive);

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  // Jika tidak ada super troop aktif, jangan render card ini
  if (!showLoading && activeSuperTroops.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-coc-red/10 to-black/40 backdrop-blur-md border border-coc-red/20 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Red/Gold Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-red/10 rounded-full blur-3xl pointer-events-none group-hover:bg-coc-red/20 transition-all duration-700" />
      
      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <LightningIcon className="h-5 w-5 text-coc-gold animate-pulse-slow" /> 
        <span className="text-coc-gold text-shadow-sm">{t.profileArmy?.superTroops || "Active Super Troops"}</span>
      </h2>

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeSuperTroops.map((troop) => (
              <div
                key={troop.name}
                className="relative bg-black/40 border border-coc-gold/40 rounded-xl p-4 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] group/item"
                title={troop.name}
              >
                {/* Efek Petir di Background */}
                <div className="absolute inset-0 bg-coc-red/5 rounded-xl animate-pulse-slow pointer-events-none" />

                <div className="w-16 h-16 relative mb-2">
                   <img 
                      src={getAssetUrl(troop.name)} 
                      alt={troop.name}
                      className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] group-hover/item:scale-110 transition-transform"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                
                <h4 className="text-sm font-bold font-clash text-white text-center leading-tight mb-1">
                    {troop.name}
                </h4>

                <div className="bg-coc-gold text-black text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 shadow-sm mt-1">
                  Lvl {troop.level}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};