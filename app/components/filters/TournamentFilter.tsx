'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { FilterIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

// --- DEFINISI TIPE (DILONGGARKAN UNTUK i18n) ---
export interface TournamentFilters {
  status: string;
  thLevel: string;
  prize: 'all' | 'cash' | 'item';
}

// Definisikan props untuk komponen
type TournamentFilterProps = {
  filters: TournamentFilters;
  onFilterChange: (newFilters: TournamentFilters) => void;
};

const TournamentFilter = ({ filters, onFilterChange }: TournamentFilterProps) => {
  const { t } = useLanguage(); // [BARU]

  const handleFilterChange = (key: keyof TournamentFilters, value: string) => {
    // Casting aman karena kita mengontrol value dari <option>
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFilterChange({
      status: t.tournament.filterStatusAll,
      thLevel: t.clanHub.filterAllTh,
      prize: 'all',
    });
  };

  return (
    // [MOBILE RESPONSIVE]
    <aside className="card-stone p-4 lg:p-6 h-fit static lg:sticky lg:top-28 rounded-lg w-full">
      <h2 className="text-xl lg:text-2xl font-clash text-coc-gold border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <FilterIcon className="h-6 w-6 text-coc-gold-dark" />
        {t.clanHub.filterTitle} {/* [i18n] */}
      </h2>

      <div className="space-y-4 lg:space-y-6">
        {/* Status Filter */}
        <div className="filter-group">
          <label
            htmlFor="status-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            {t.tournament.filterStatusLabel} {/* [i18n] */}
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option value={t.tournament.filterStatusAll} className="text-coc-stone bg-white">
              {t.tournament.filterStatusAll}
            </option>
            <option value={t.tournament.filterStatusUpcoming} className="text-coc-stone bg-white">
              {t.tournament.filterStatusUpcoming}
            </option>
            <option value={t.tournament.filterStatusOngoing} className="text-coc-stone bg-white">
              {t.tournament.filterStatusOngoing}
            </option>
            <option value={t.tournament.filterStatusCompleted} className="text-coc-stone bg-white">
              {t.tournament.filterStatusCompleted}
            </option>
          </select>
        </div>

        {/* TH Level Filter */}
        <div className="filter-group">
          <label
            htmlFor="th-level-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            {t.clanHub.filterThLevel} {/* [i18n] */}
          </label>
          <select
            id="th-level-filter"
            value={filters.thLevel}
            onChange={(e) => handleFilterChange('thLevel', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option value={t.clanHub.filterAllTh} className="text-coc-stone bg-white">
              {t.clanHub.filterAllTh}
            </option>
            {/* Opsi statis tetap string agar logic parsing di Client jalan */}
            <option value="TH 15 - 16" className="text-coc-stone bg-white">
              TH 15 - 16
            </option>
            <option value="TH 13 - 14" className="text-coc-stone bg-white">
              TH 13 - 14
            </option>
            <option value="TH 10 - 12" className="text-coc-stone bg-white">
              TH 10 - 12
            </option>
          </select>
        </div>

        {/* Prize Filter */}
        <div className="filter-group">
          <label
            htmlFor="prize-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            {t.tournament.cardPrize} {/* [i18n] */}
          </label>
          <select
            id="prize-filter"
            value={filters.prize}
            onChange={(e) => handleFilterChange('prize', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            <option value="all" className="text-coc-stone bg-white">
              All
            </option>
            <option value="cash" className="text-coc-stone bg-white">
              Cash (Rp/$)
            </option>
            <option value="item" className="text-coc-stone bg-white">
              In-Game Item
            </option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            {t.clanHub.resetFilter} {/* [i18n] */}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default TournamentFilter;