'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { BookOpenIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

interface PlayerSpellsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Spell (Home Village)".
 * Desain: Visual Grid dengan Botol Spell.
 */
export const PlayerSpellsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerSpellsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl } = useGameAssets();

  // Logika Data: Live > Cache
  const spellsData = fullPlayerData?.spells ?? userProfile?.cachedSpells ?? [];

  // Filter Spell Home Village & Level > 1
  const homeSpells = spellsData.filter(
    (s) => s.village === 'home' && s.level >= 1
  );

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedSpells;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Cyan Glow */}
      <div className="absolute -bottom-10 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <BookOpenIcon className="h-5 w-5 text-coc-gold" /> {t.profileArmy.spellsTitle}
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.spellsError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : homeSpells.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {homeSpells.map((spell) => (
              <div
                key={spell.name}
                className="relative bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 group/item"
                title={spell.name}
              >
                <div className="w-10 h-10 relative mb-1">
                   <img 
                      src={getAssetUrl(spell.name, 'spell')} 
                      alt={spell.name}
                      className="w-full h-full object-contain drop-shadow-lg group-hover/item:-translate-y-1 transition-transform duration-300"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                
                {/* Level Badge */}
                <span className="absolute -bottom-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                  Lv {spell.level}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
            <p className="text-sm">{t.profileArmy.spellsEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
};