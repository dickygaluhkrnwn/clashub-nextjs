import React from 'react';
import { Player } from '@/lib/types';
import { PlayerCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { RefreshCwIcon } from '@/app/components/icons';

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
  if (isFiltering) {
    return (
      <div className="text-center py-20">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-clash text-white">
        {filteredPlayers.length} Pemain Ditemukan
      </h2>
      {playersToShow.length === 0 ? (
        <p className="text-gray-400 text-center py-10">
          Tidak ada Pemain yang cocok dengan filter Anda.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {playersToShow.map((player: Player) => (
              <PlayerCard
                key={player.id}
                id={player.id}
                name={player.displayName || player.name}
                tag={player.playerTag || player.tag}
                thLevel={player.thLevel}
                reputation={player.reputation || 5.0}
                role={player.role || 'Free Agent'}
                avatarUrl={player.avatarUrl}
              />
            ))}
          </div>
          {showLoadMorePlayers && (
            <div className="text-center pt-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={onLoadMorePlayers}
              >
                Muat Lebih Banyak (
                {filteredPlayers.length - playersToShow.length} Tersisa)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};