'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { FilterIcon } from '@/app/components/icons';

// --- [BARU] Tipe untuk status UI (Bahasa Indonesia) ---
type TournamentStatusUI = 'Akan Datang' | 'Live' | 'Selesai';

// --- DEFINISI TIPE BARU UNTUK FILTER TURNAMEN ---
export interface TournamentFilters {
  status: TournamentStatusUI | 'Semua Status';
  thLevel: 'Semua Level' | 'TH 15 - 16' | 'TH 13 - 14' | 'TH 10 - 12';
  prize: 'all' | 'cash' | 'item';
}

// Definisikan props untuk komponen
type TournamentFilterProps = {
  filters: TournamentFilters;
  onFilterChange: (newFilters: TournamentFilters) => void;
};

const TournamentFilter = ({ filters, onFilterChange }: TournamentFilterProps) => {
  const handleFilterChange = (key: keyof TournamentFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value as any });
  };

  const handleReset = () => {
    onFilterChange({
      status: 'Semua Status',
      thLevel: 'Semua Level',
      prize: 'all',
    });
  };

  return (
    // [PERBAIKAN FASE 3 & 7: MOBILE RESPONSIVE]
    <aside className="card-stone p-4 lg:p-6 h-fit static lg:sticky lg:top-28 rounded-lg w-full">
      {/* [PERBAIKAN FONT & WARNA] Mengganti text-white menjadi text-coc-gold agar sinkron dengan KH */}
      <h2 className="text-xl lg:text-2xl font-clash text-coc-gold border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <FilterIcon className="h-6 w-6 text-coc-gold-dark" />
        Filter Turnamen
      </h2>

      <div className="space-y-4 lg:space-y-6">
        {/* Status Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="status-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option className="text-coc-stone bg-white">Semua Status</option>
            <option className="text-coc-stone bg-white">Akan Datang</option>
            <option className="text-coc-stone bg-white">Live</option>
            <option className="text-coc-stone bg-white">Selesai</option>
          </select>
        </div>

        {/* TH Level Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="th-level-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Level TH
          </label>
          <select
            id="th-level-filter"
            value={filters.thLevel}
            onChange={(e) => handleFilterChange('thLevel', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option className="text-coc-stone bg-white">Semua Level</option>
            <option className="text-coc-stone bg-white">TH 15 - 16</option>
            <option className="text-coc-stone bg-white">TH 13 - 14</option>
            <option className="text-coc-stone bg-white">TH 10 - 12</option>
          </select>
        </div>

        {/* Prize Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="prize-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Hadiah
          </label>
          <select
            id="prize-filter"
            value={filters.prize}
            onChange={(e) => handleFilterChange('prize', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option value="all" className="text-coc-stone bg-white">Semua Hadiah</option>
            <option value="cash" className="text-coc-stone bg-white">Uang Tunai</option>
            <option value="item" className="text-coc-stone bg-white">In-Game Item</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            Reset Filter
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default TournamentFilter;