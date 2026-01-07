'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { ShieldIcon, StarIcon } from '@/app/components/icons'; 
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
 * Desain: Hero Cards Mewah dengan fokus pada Equipment dan Level.
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

  // Filter & Sort Hero
  const heroes = heroesData
    .filter((h) => h.village === 'home')
    .sort((a, b) => {
      const order = [
        'Barbarian King',
        'Archer Queen',
        'Grand Warden',
        'Royal Champion',
        'Minion Prince' 
      ];
      let idxA = order.indexOf(a.name);
      let idxB = order.indexOf(b.name);
      
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      
      return idxA - idxB;
    });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedHeroes;

  // Helper function untuk menentukan warna tema hero
  const getHeroTheme = (name: string) => {
    if (name.includes('King')) return 'from-orange-500/20 to-yellow-600/5 border-orange-500/30 text-orange-400';
    if (name.includes('Queen')) return 'from-purple-500/20 to-pink-600/5 border-purple-500/30 text-purple-400';
    if (name.includes('Warden')) return 'from-cyan-500/20 to-blue-600/5 border-cyan-500/30 text-cyan-400';
    if (name.includes('Champion')) return 'from-yellow-600/20 to-red-600/5 border-yellow-600/30 text-yellow-500';
    return 'from-gray-700/20 to-gray-900/5 border-gray-600/30 text-gray-400'; // Default
  };

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Header Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header - FIXED: White Text with Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-blue/10 rounded-lg border border-coc-blue/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
             <ShieldIcon className="h-5 w-5 text-coc-blue" /> 
        </div>
        <span>
            {t.profileArmy.heroTitle}
        </span>
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.heroError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : heroes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6">
            {heroes.map((hero) => {
               const themeClass = getHeroTheme(hero.name);
               const isMax = hero.level === hero.maxLevel;

               return (
                <div
                  key={hero.name}
                  className={`bg-gradient-to-br ${themeClass.split(' ')[0]} ${themeClass.split(' ')[1]} border ${themeClass.split(' ')[2]} rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 hover:bg-opacity-50 transition-all duration-300 group/card relative overflow-hidden`}
                >
                  {/* Background Shine on Hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover/card:bg-white/5 transition-colors duration-500" />
                  
                  {/* --- Hero Image Section --- */}
                  <div className="relative flex-shrink-0">
                      {/* Frame Container */}
                      <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
                          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10`} />
                          <img 
                            src={getAssetUrl(hero.name)} 
                            alt={hero.name}
                            className="w-[110%] h-[110%] object-cover object-top group-hover/card:scale-110 transition-transform duration-500 z-0"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                      </div>

                      {/* Level Badge (Diamond Shape) */}
                      <div className={`absolute -bottom-3 -right-3 z-20 w-10 h-10 flex items-center justify-center rotate-45 border-2 shadow-lg ${isMax ? 'bg-coc-gold border-yellow-200' : 'bg-[#1a1a1a] border-white/20'}`}>
                          <div className="-rotate-45 flex flex-col items-center justify-center">
                              <span className={`text-xs font-bold font-clash leading-none ${isMax ? 'text-black' : 'text-white'}`}>{hero.level}</span>
                              {isMax && <StarIcon className="w-2 h-2 text-black fill-current mt-[1px]" />}
                          </div>
                      </div>
                  </div>

                  {/* --- Info & Equipment Section --- */}
                  <div className="flex-1 w-full sm:w-auto text-center sm:text-left z-10">
                      <h4 className={`text-lg font-bold font-clash uppercase tracking-wide truncate ${themeClass.split(' ').pop()} drop-shadow-md`}>
                        {hero.name}
                      </h4>
                      
                      {/* Equipment List */}
                      {hero.equipment && hero.equipment.length > 0 ? (
                          <div className="mt-3">
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 ml-0.5">Active Equipment</p>
                              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                  {hero.equipment.map((equip) => (
                                      <div key={equip.name} className="relative group/equip">
                                          <div className={`w-10 h-10 bg-[#0f1115] rounded-lg border border-white/10 p-1 flex items-center justify-center transition-transform hover:scale-110 hover:border-white/30 shadow-md`}>
                                              <img 
                                                  src={getAssetUrl(equip.name)} 
                                                  alt={equip.name}
                                                  className="w-full h-full object-contain filter drop-shadow-sm"
                                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                              />
                                          </div>
                                          {/* Equipment Level Pill */}
                                          <div className="absolute -top-1.5 -right-1.5 bg-[#1a1a1a] text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full border border-white/20 shadow-sm">
                                              Lv{equip.level}
                                          </div>
                                          
                                          {/* Tooltip */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/equip:opacity-100 transition-opacity pointer-events-none z-30 border border-white/10">
                                              {equip.name}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="mt-3 py-2 px-3 bg-black/20 rounded-lg border border-white/5 inline-block">
                              <p className="text-[10px] text-gray-500 italic">No equipment active</p>
                          </div>
                      )}
                  </div>
                </div>
               );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
            <ShieldIcon className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">{t.profileArmy.heroEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
};