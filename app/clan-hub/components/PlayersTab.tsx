'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { PlayerCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { Loader2Icon, UserIcon, SearchIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PlayersTabProps {
  isFiltering: boolean;
  filteredPlayers: Player[];
  playersToShow: Player[];
  showLoadMorePlayers: boolean;
  onLoadMorePlayers: () => void;
}

/**
 * Komponen untuk me-render konten tab "Cari Pemain".
 * Diekstrak dari TeamHubClient.tsx (fungsi renderPlayers).
 */
export const PlayersTab = ({
  isFiltering,
  filteredPlayers,
  playersToShow,
  showLoadMorePlayers,
  onLoadMorePlayers,
}: PlayersTabProps) => {
  const { t } = useLanguage();

  if (isFiltering) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-4 rounded-full bg-coc-green/10 border border-coc-green/20 animate-pulse">
            <Loader2Icon className="h-10 w-10 text-coc-green animate-spin" />
        </div>
        <h2 className="text-lg font-clash text-gray-400 tracking-wide animate-pulse uppercase">{t.common.filtering}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-coc-green/10 border border-coc-green/20 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                <UserIcon className="w-6 h-6 text-coc-green" />
            </div>
            <span className="tracking-wide">{t.clanHub.playersFound.replace('{count}', filteredPlayers.length.toString())}</span>
        </h2>
      </div>

      {playersToShow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-[#15171e]/50 rounded-3xl border border-white/5 border-dashed text-center">
          <div className="p-6 rounded-full bg-[#0a0a0b] border border-white/5 mb-6 shadow-inner">
            <SearchIcon className="h-16 w-16 text-gray-600 opacity-50" />
          </div>
          <h3 className="text-xl font-clash text-white mb-2 tracking-wide uppercase">
            {t.clanHub.noPlayersMatch}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed font-sans">
            Coba sesuaikan filter pencarian Anda untuk menemukan pemain yang sesuai.
          </p>
        </div>
      ) : (
        <>
          {/* [RESPONSIVE GRID] Mobile: 1 kolom, Tablet: 2, Desktop XL: 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {playersToShow.map((player: Player, index) => (
              <div 
                key={player.id} 
                className="h-full animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  <PlayerCard
                    id={player.id}
                    name={player.displayName || player.name}
                    tag={player.playerTag || player.tag}
                    thLevel={player.thLevel}
                    reputation={player.reputation || 5.0}
                    role={player.role || 'Free Agent'}
                    avatarUrl={player.avatarUrl}
                  />
              </div>
            ))}
          </div>
          
          {showLoadMorePlayers && (
            <div className="flex justify-center pt-8 pb-12">
              <Button
                variant="outline"
                size="lg"
                onClick={onLoadMorePlayers}
                className="group border-white/10 hover:border-coc-green/50 text-gray-300 hover:text-white min-w-[200px]"
              >
                {t.common.loadMore} 
                <span className="ml-2 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full group-hover:bg-coc-green group-hover:text-black transition-colors">
                    {filteredPlayers.length - playersToShow.length}
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};