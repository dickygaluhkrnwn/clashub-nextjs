'use client';

import React, { useState } from 'react';
import TeamHubFilter, { ManagedClanFilters } from '@/app/components/filters/TeamHubFilter'; // [PERBAIKAN] Import tipe dari sumber aslinya
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { Button } from '@/app/components/ui/Button';

// Impor tipe PlayerFilters dari TeamHubClient (karena masih didefinisikan di sana)
import { PlayerFilters } from '../TeamHubClient';

// Definisikan tipe ActiveTab di sini
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
 * [MODIFIKASI FASE 3] Menambahkan fitur collapse/expand untuk mobile.
 */
export const TeamHubFilterBar = ({
  activeTab,
  clanFilters,
  onClanFilterChange,
  playerFilters,
  onPlayerFilterChange,
}: TeamHubFilterBarProps) => {
  // State untuk mengontrol visibilitas filter di mobile
  const [isOpen, setIsOpen] = useState(false);

  // Tidak ada filter bar untuk tab "Pencarian Klan"
  if (activeTab === 'publicClans') {
    return null;
  }

  return (
    <div className="lg:col-span-1 lg:self-start space-y-4">
      {/* [Fase 3] Tombol Toggle Filter (Hanya Mobile) */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          className="w-full flex justify-between items-center py-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            {/* Icon Filter Inline */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            {isOpen ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </span>
          {/* Icon Chevron Inline */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>

      {/* [Fase 3] Container Filter
          - Hidden di mobile kecuali isOpen === true
          - Always Block di desktop (lg:block)
      */}
      <div className={`${isOpen ? 'block animate-fade-in' : 'hidden'} lg:block`}>
        {activeTab === 'clashubTeams' && (
          <TeamHubFilter
            filters={clanFilters}
            // [PERBAIKAN UTAMA] Menghapus 'as any' karena tipe data sekarang sudah sinkron total!
            // Ini membuktikan bahwa error build sebelumnya sudah teratasi secara logic.
            onFilterChange={onClanFilterChange} 
          />
        )}
        {activeTab === 'players' && (
          <PlayerHubFilter
            filters={playerFilters}
            onFilterChange={onPlayerFilterChange as any} // Biarkan as any untuk player dulu
          />
        )}
      </div>
    </div>
  );
};