'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { ShieldIcon } from '@/app/components/icons'; 
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

interface PlayerHeroesCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Hero (Home Village)".
 * Desain: Hero Cards dengan Equipment.
 */
export const PlayerHeroesCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerHeroesCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();

  // Logika Data
  const heroesData = fullPlayerData?.heroes ?? userProfile?.cachedHeroes ?? [];

  // [UPDATE] Filter Dinamis: Hapus hardcoded list nama hero.
  // Cukup filter berdasarkan village 'home'.
  // Urutan default tetap kita jaga untuk hero-hero utama, hero baru akan muncul di belakang.
  const heroes = heroesData
    .filter((h) => h.village === 'home')
    .sort((a, b) => {
      const order = [
        'Barbarian King',
        'Archer Queen',
        'Grand Warden',
        'Royal Champion',
        'Minion Prince' // Hero baru bisa ditambahkan di sini untuk urutan, atau biarkan di akhir
      ];
      let idxA = order.indexOf(a.name);
      let idxB = order.indexOf(b.name);
      
      // Jika hero tidak ada di list prioritas, taruh di belakang berdasarkan level atau nama
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      
      return idxA - idxB;
    });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedHeroes;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Blue/Purple Glow */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <ShieldIcon className="h-5 w-5 text-coc-gold" /> {t.profileArmy.heroTitle}
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.heroError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        ) : heroes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {heroes.map((hero) => (
              <div
                key={hero.name}
                className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group/item"
              >
                {/* Hero Image & Level Badge */}
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-black/30 flex items-center justify-center border border-white/10 overflow-hidden">
                       <img 
                          src={getAssetUrl(hero.name)} 
                          alt={hero.name}
                          className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                       />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#1a1a1a] shadow-md z-10">
                        {hero.level}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-bold font-clash text-white truncate">
                      {hero.name}
                   </h4>
                   
                   {/* Equipment Row */}
                   {hero.equipment && hero.equipment.length > 0 ? (
                       <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                           {hero.equipment.map((equip) => (
                               <div key={equip.name} className="relative group/equip" title={`${equip.name} (Lv ${equip.level})`}>
                                   <div className="w-7 h-7 bg-black/40 rounded border border-white/10 p-0.5">
                                       <img 
                                          src={getAssetUrl(equip.name)} 
                                          alt={equip.name}
                                          className="w-full h-full object-contain"
                                          onError={(e) => e.currentTarget.style.display = 'none'}
                                       />
                                   </div>
                                   {/* Equipment Level dot */}
                                   <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-black flex items-center justify-center">
                                       <span className="text-[6px] text-white font-bold">{equip.level}</span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="text-[10px] text-gray-500 mt-1 italic">No equipment</p>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            <p className="text-sm">{t.profileArmy.heroEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
};