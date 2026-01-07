'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
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
  const activeSuperTroops = troopsData.filter((t) => t.superTroopIsActive);

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  // Jika tidak ada super troop aktif, jangan render card ini
  if (!showLoading && activeSuperTroops.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-coc-red/10 to-[#15171e] backdrop-blur-xl border border-coc-red/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(220,38,38,0.1)] relative overflow-hidden group">
      {/* Ambient Red/Gold Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-red/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-red/20 transition-all duration-700" />
      
      {/* Header - REVISI: Putih Solid + Shadow Kuat (Hapus Gradient Text) */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-red/20 rounded-lg border border-coc-red/30 shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse-slow">
            <LightningIcon className="h-5 w-5 text-coc-gold" /> 
        </div>
        <span>
            {(t.profileArmy as any)?.superTroops || "Active Super Troops"}
        </span>
      </h2>

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeSuperTroops.map((troop) => (
              <div
                key={troop.name}
                className="relative bg-black/40 border border-coc-gold/40 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:border-coc-gold group/item overflow-hidden"
                title={troop.name}
              >
                {/* Efek Petir/Energi di Background */}
                <div className="absolute inset-0 bg-coc-red/5 animate-pulse-slow pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-coc-red/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />

                <div className="w-16 h-16 relative mb-3 z-10">
                   <img 
                      src={getAssetUrl(troop.name)} 
                      alt={troop.name}
                      className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] group-hover/item:scale-110 transition-transform duration-300"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                
                <h4 className="text-sm font-bold font-clash text-white text-center leading-tight mb-1 z-10 drop-shadow-md group-hover/item:text-coc-gold transition-colors">
                    {troop.name}
                </h4>
                
                {/* Active Indicator */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-coc-green rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" title="Boost Active" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};