'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UsersCogIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

// [PERBAIKAN LANGKAH 1] Menambahkan 'minMembers' agar sinkron dengan TeamHubClient
export type ManagedClanFilters = {
  searchTerm: string;
  vision: 'Kompetitif' | 'Kasual' | 'all';
  reputation: number;
  thLevel: number;
  minMembers: number; // <-- Property baru ditambahkan
};

// Definisikan props untuk komponen
type TeamHubFilterProps = {
  filters: ManagedClanFilters;
  onFilterChange: (newFilters: ManagedClanFilters) => void;
};

const TeamHubFilter = ({ filters, onFilterChange }: TeamHubFilterProps) => {
  const { t } = useLanguage(); // [BARU]
  // State internal untuk slider agar responsif (instant UI feedback)
  const [internalThLevel, setInternalThLevel] = useState(filters.thLevel);
  const [internalMinMembers, setInternalMinMembers] = useState(filters.minMembers);

  // Efek sinkronisasi props -> state internal
  useEffect(() => {
    setInternalThLevel(filters.thLevel);
  }, [filters.thLevel]);

  useEffect(() => {
    setInternalMinMembers(filters.minMembers);
  }, [filters.minMembers]);

  // Fungsi generik untuk menangani perubahan
  const handleFilterChange = <K extends keyof ManagedClanFilters>(
    key: K,
    value: ManagedClanFilters[K],
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    const defaultFilters: ManagedClanFilters = {
      searchTerm: '',
      vision: 'all',
      reputation: 0,
      thLevel: 0,
      minMembers: 0,
    };
    onFilterChange(defaultFilters);
    
    // Reset state internal juga
    setInternalThLevel(0);
    setInternalMinMembers(0);
  };

  return (
    <aside className="card-stone p-6 h-fit sticky top-28 rounded-lg">
      <h2 className="text-2xl font-clash text-white border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <UsersCogIcon className="h-6 w-6 text-coc-gold-dark" />
        {t.clanHub.filterTitle}
      </h2>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="filter-group">
          <label
            htmlFor="search-input"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            {t.clanHub.filterSearchLabel}
          </label>
          <input
            type="text"
            id="search-input"
            placeholder={t.clanHub.filterSearchPlaceholder}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold font-sans"
          />
        </div>

        {/* Visi Clan */}
        <div className="filter-group">
          <label
            htmlFor="vision-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            {t.clanHub.filterVisionLabel}
          </label>
          <select
            id="vision-filter"
            value={filters.vision}
            onChange={(e) =>
              handleFilterChange(
                'vision',
                e.target.value as ManagedClanFilters['vision'],
              )
            }
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
            <option value="all">{t.clanHub.visionAll}</option>
            <option value="Kompetitif">{t.clanHub.visionCompetitive}</option>
            <option value="Kasual">{t.clanHub.visionCasual}</option>
          </select>
        </div>

        {/* Reputation Slider */}
        <div className="filter-group">
          <label
            htmlFor="rating-input"
            className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans"
          >
            <span>{t.clanHub.filterReputationLabel}</span>
            <span className="font-bold text-coc-gold">
              {filters.reputation.toFixed(1)} ★
            </span>
          </label>
          <input
            type="range"
            id="rating-input"
            min="0"
            max="5.0"
            step="0.1"
            value={filters.reputation}
            onChange={(e) =>
              handleFilterChange('reputation', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
          />
        </div>

        {/* TH Level Slider */}
        <div className="filter-group">
          <label
            htmlFor="th-level-input"
            className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans"
          >
            <span>{t.clanHub.filterThLabel}</span>
            <span className="font-bold text-coc-gold">
              {internalThLevel === 0 ? t.clanHub.filterAllTh : `TH ${internalThLevel}`}
            </span>
          </label>
          <input
            type="range"
            id="th-level-input"
            min="0"
            max="17"
            step="1"
            value={internalThLevel}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setInternalThLevel(val); // Update UI instan
              handleFilterChange('thLevel', val); // Update parent
            }}
            className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
          />
        </div>

        {/* [BARU] Min Members Slider */}
        <div className="filter-group">
          <label
            htmlFor="min-members-input"
            className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans"
          >
            <span>{t.clanHub.filterMinMembersLabel}</span>
            <span className="font-bold text-coc-gold">
              {internalMinMembers} {t.clanHub.membersUnit}
            </span>
          </label>
          <input
            type="range"
            id="min-members-input"
            min="0"
            max="50"
            step="1"
            value={internalMinMembers}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setInternalMinMembers(val); // Update UI instan
              handleFilterChange('minMembers', val); // Update parent
            }}
            className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
          />
        </div>

        {/* Action Buttons */}
        <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            {t.clanHub.resetFilter}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default TeamHubFilter;