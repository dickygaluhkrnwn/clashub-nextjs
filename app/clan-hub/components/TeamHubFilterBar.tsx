'use client';

import React from 'react';
import TeamHubFilter, { ManagedClanFilters } from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { PlayerFilters } from '../TeamHubClient';

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TeamHubFilterBarProps {
  activeTab: ActiveTab;
  clanFilters: ManagedClanFilters;
  onClanFilterChange: (filters: ManagedClanFilters) => void;
  playerFilters: PlayerFilters;
  onPlayerFilterChange: (filters: PlayerFilters) => void;
}

/**
 * Komponen Wrapper untuk Filter di bagian Header.
 */
export const TeamHubFilterBar = ({
  activeTab,
  clanFilters,
  onClanFilterChange,
  playerFilters,
  onPlayerFilterChange,
}: TeamHubFilterBarProps) => {

  // Tidak ada filter bar untuk tab "Pencarian Klan" (Search bar ada di dalam tabnya sendiri)
  if (activeTab === 'publicClans') {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300 z-20">
        {activeTab === 'clashubTeams' && (
          <TeamHubFilter
            filters={clanFilters}
            onFilterChange={onClanFilterChange} 
          />
        )}
        {activeTab === 'players' && (
          <PlayerHubFilter
            filters={playerFilters}
            onFilterChange={onPlayerFilterChange as any} 
          />
        )}
    </div>
  );
};