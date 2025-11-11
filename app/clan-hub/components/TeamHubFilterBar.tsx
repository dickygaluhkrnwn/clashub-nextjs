import React from 'react';
import TeamHubFilter from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';

// Impor tipe yang diekspor dari TeamHubClient
import { ManagedClanFilters, PlayerFilters } from '../TeamHubClient';

// Definisikan tipe ActiveTab di sini karena tidak diekspor dari file utama
type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TeamHubFilterBarProps {
  activeTab: ActiveTab;
  clanFilters: ManagedClanFilters;
  onClanFilterChange: (filters: ManagedClanFilters) => void;
  playerFilters: PlayerFilters;
  onPlayerFilterChange: (filters: PlayerFilters) => void;
}

/**
 * Komponen Sidebar untuk menampilkan filter yang sesuai (Tim Clashub atau Pemain).
 * Diekstrak dari TeamHubClient.tsx untuk refactoring.
 */
export const TeamHubFilterBar = ({
  activeTab,
  clanFilters,
  onClanFilterChange,
  playerFilters,
  onPlayerFilterChange,
}: TeamHubFilterBarProps) => {
  // Tidak ada filter bar untuk tab "Pencarian Klan"
  if (activeTab === 'publicClans') {
    return null;
  }

  return (
    // Wrapper ini ada di file asli (renderContent)
    <div className="lg:col-span-1 lg:self-start">
      {activeTab === 'clashubTeams' && (
        <TeamHubFilter
          filters={clanFilters}
          onFilterChange={onClanFilterChange as any} // 'as any' dari file asli
        />
      )}
      {activeTab === 'players' && (
        <PlayerHubFilter
          filters={playerFilters}
          onFilterChange={onPlayerFilterChange as any} // 'as any' dari file asli
        />
      )}
    </div>
  );
};