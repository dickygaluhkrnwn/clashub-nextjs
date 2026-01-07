'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';
import { StarIcon } from '@/app/components/icons';

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
  const { getAssetUrl, getAssetType } = useGameAssets();

  // Logika Data: Mengambil `heroEquipment` dari root object API
  const rawData = (fullPlayerData as any)?.heroEquipment ?? [];

  // Filter Dinamis
  const equipment = rawData.filter((item: any) => {
      const type = getAssetType(item.name);
      return type === 'equipment';
  });

  const showLoading = isLoading && !fullPlayerData;

  // --- LOGIC GROUPING BY HERO ---
  // Helper sederhana untuk menebak hero berdasarkan nama equipment
  const getHeroForEquipment = (equipName: string): string => {
      const name = equipName.toLowerCase();
      if (name.includes('barbarian') || name.includes('king') || name.includes('gauntlet') || name.includes('earthquake') || name.includes('vampstache') || name.includes('spiky') || name.includes('rage vial')) return 'Barbarian King';
      if (name.includes('archer') || name.includes('queen') || name.includes('arrow') || name.includes('invisibility') || name.includes('healer') || name.includes('frozen') || name.includes('clone')) return 'Archer Queen';
      if (name.includes('warden') || name.includes('tome') || name.includes('gem') || name.includes('aura') || name.includes('fireball')) return 'Grand Warden';
      if (name.includes('royal') || name.includes('champion') || name.includes('spear') || name.includes('shield') || name.includes('vial') || name.includes('rocket') || name.includes('haste')) return 'Royal Champion';
      if (name.includes('minion') || name.includes('prince') || name.includes('henchman')) return 'Minion Prince';
      return 'Others';
  };

  // Grouping equipment
  const groupedEquipment: Record<string, any[]> = {};
  const heroOrder = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion', 'Minion Prince', 'Others'];

  equipment.forEach((item: any) => {
      const hero = getHeroForEquipment(item.name);
      if (!groupedEquipment[hero]) groupedEquipment[hero] = [];
      groupedEquipment[hero].push(item);
  });

  // Jika tidak ada equipment sama sekali, kita tetap render container kosong/loading agar tidak hilang misterius
  if (!showLoading && equipment.length === 0) {
      // Opsi: Return null jika benar-benar ingin hide, atau return message "No Equipment Found"
      // return null; 
      // Kita render message empty state agar user tau fitur ini ada tapi datanya kosong
  }

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Ambient Orange/Blacksmith Glow */}
      <div className="absolute top-0 left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />

      {/* Header - White Text + Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <HammerIcon className="h-5 w-5 text-orange-400" /> 
        </div>
        <span>
            {(t.profileArmy as any)?.equipmentTitle || "Hero Equipment"}
        </span>
      </h2>

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {showLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : equipment.length > 0 ? (
          <div className="space-y-6">
             {heroOrder.map((heroName) => {
                 const heroEquips = groupedEquipment[heroName];
                 if (!heroEquips || heroEquips.length === 0) return null;

                 return (
                     <div key={heroName} className="space-y-3">
                         {/* Hero Subheader */}
                         <div className="flex items-center gap-2 px-1">
                             <div className="h-4 w-1 bg-orange-500 rounded-full" />
                             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">{heroName}</h3>
                         </div>

                         {/* Equipment Grid */}
                         <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {heroEquips.map((equip: any) => {
                                const isMax = equip.level === equip.maxLevel;
                                return (
                                    <div
                                        key={equip.name}
                                        className={`relative bg-[#0f1115] border ${isMax ? 'border-orange-400/30' : 'border-white/5'} rounded-xl p-2 flex flex-col items-center justify-center hover:bg-orange-900/10 hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300 group/item shadow-sm`}
                                        title={equip.name}
                                    >
                                        {/* Glow effect for Max Level */}
                                        {isMax && <div className="absolute inset-0 bg-orange-400/5 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity" />}

                                        <div className="w-12 h-12 relative mb-1 z-10">
                                            <img 
                                                src={getAssetUrl(equip.name)} 
                                                alt={equip.name}
                                                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(249,115,22,0.3)] group-hover/item:scale-110 transition-transform duration-300"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                        </div>
                                        
                                        {/* Level Badge */}
                                        <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold px-1 rounded shadow-sm border z-20 ${
                                            isMax 
                                            ? 'bg-orange-500 text-black border-orange-300 shadow-orange-500/20' 
                                            : 'bg-[#1a1a1a] text-white border-white/20'
                                        }`}>
                                            {equip.level}
                                        </div>

                                        {/* Max Star Indicator */}
                                        {isMax && (
                                            <div className="absolute -bottom-1 -right-1">
                                                <StarIcon className="w-3 h-3 text-orange-400 fill-current drop-shadow-sm" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                     </div>
                 );
             })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
            <HammerIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No Equipment Data Available</p>
            <p className="text-xs opacity-60">Make sure to sync your latest player data.</p>
          </div>
        )}
      </div>
    </div>
  );
};