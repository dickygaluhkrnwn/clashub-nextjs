'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

// Ikon Palu (Blacksmith) Khusus Equipment
const HammerIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
     <path d="M16.5375 7.84659L13.8824 10.5017L13.1753 9.79458L10.3469 12.623L15.2966 17.5727L18.125 14.7443L17.4179 14.0372L20.0731 11.3821C20.6588 10.7963 20.6588 9.84655 20.0731 9.26077L18.6589 7.84659C18.0731 7.2608 17.1232 7.2608 16.5375 7.84659ZM11.054 13.3301L3.98297 20.4012L2.56876 18.987L9.63979 11.9159L11.054 13.3301Z" />
     <path d="M12.4678 6.07923L11.0536 7.49345L12.4678 8.90766L13.882 7.49345L15.2962 8.90766L13.882 10.3219L14.5891 11.029L17.4175 8.20055L16.7104 7.49345L18.1247 6.07923L16.7104 4.66502L15.2962 6.07923L13.882 4.66502L12.4678 6.07923Z" />
  </svg>
);

interface PlayerEquipmentCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

export const PlayerEquipmentCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerEquipmentCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();

  // Logika Data:
  // Cek `heroEquipment` di root object (API baru)
  // Jika tidak ada, fallback ke `cachedHeroEquipment` (jika kita tambah nanti) atau kosong
  // Note: Kita perlu memastikan `heroEquipment` ada di tipe CocPlayer
  const equipmentData = (fullPlayerData as any)?.heroEquipment ?? [];

  const showLoading = isLoading && !fullPlayerData;

  // Jika tidak ada equipment (TH rendah), jangan render
  if (!showLoading && equipmentData.length === 0) return null;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Orange Glow (Blacksmith theme) */}
      <div className="absolute top-0 left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        {/* [FIX] Casting ke any untuk bypass error TypeScript pada properti equipmentTitle yang belum ada di tipe */}
        <HammerIcon className="h-5 w-5 text-coc-gold" /> {(t.profileArmy as any)?.equipmentTitle || "Hero Equipment"}
      </h2>

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {equipmentData.map((equip: any) => (
              <div
                key={equip.name}
                className="relative bg-orange-900/20 border border-orange-500/20 rounded-xl p-2 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] group/item"
                title={equip.name}
              >
                <div className="w-10 h-10 relative mb-1">
                   <img 
                      src={getAssetUrl(equip.name, 'equipment')} 
                      alt={equip.name}
                      className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                
                {/* Level Badge */}
                <div className={`absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                    equip.level === equip.maxLevel 
                    ? 'bg-coc-gold text-black border-white/20' 
                    : 'bg-orange-600 text-white border-orange-400'
                }`}>
                  Lvl {equip.level}
                </div>

                {/* Common/Epic Badge (Visual Only, based on assumption or data if avail) */}
                {/* Bisa ditambah logika jika ada data rarity */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};