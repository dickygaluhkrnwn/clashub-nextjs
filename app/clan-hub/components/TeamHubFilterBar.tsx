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
 * Komponen Wrapper untuk Filter.
 * Sekarang lebih bersih karena hanya merender konten filter tanpa header tambahan.
 */
export const TeamHubFilterBar = ({
  activeTab,
  clanFilters,
  onClanFilterChange,
  playerFilters,
  onPlayerFilterChange,
}: TeamHubFilterBarProps) => {

  if (activeTab === 'publicClans') return null;

  return (
    <div className="w-full">
        {activeTab === 'clashubTeams' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <TeamHubFilter
                    filters={clanFilters}
                    onFilterChange={onClanFilterChange} 
                />
            </div>
        )}
        {activeTab === 'players' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <PlayerHubFilter
                    filters={playerFilters}
                    onFilterChange={onPlayerFilterChange as any} 
                />
            </div>
        )}
    </div>
  );
};