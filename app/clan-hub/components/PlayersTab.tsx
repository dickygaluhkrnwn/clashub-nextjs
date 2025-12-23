'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { PlayerCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { RefreshCwIcon, UserIcon } from '@/app/components/icons';
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
      <div className="text-center py-32 flex flex-col items-center justify-center opacity-70">
        <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-4" />
        <h2 className="text-xl font-clash text-white tracking-wide">{t.common.filtering}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-coc-gold" />
            <span>{t.clanHub.playersFound.replace('{count}', filteredPlayers.length.toString())}</span>
        </h2>
      </div>

      {playersToShow.length === 0 ? (
        <div className="py-20 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <UserIcon className="h-16 w-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg font-medium">
            {t.clanHub.noPlayersMatch}
          </p>
          <p className="text-sm text-gray-500 mt-2">Coba ubah filter pencarian Anda</p>
        </div>
      ) : (
        <>
          {/* [RESPONSIVE GRID] Mobile: 1 kolom, Tablet: 2, Desktop XL: 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {playersToShow.map((player: Player) => (
              <div key={player.id} className="transition-transform duration-200 hover:-translate-y-1">
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
            <div className="text-center pt-8 pb-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={onLoadMorePlayers}
                className="shadow-lg shadow-black/30 border border-white/10"
              >
                {t.common.loadMore} (
                {filteredPlayers.length - playersToShow.length} {t.common.remaining})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};