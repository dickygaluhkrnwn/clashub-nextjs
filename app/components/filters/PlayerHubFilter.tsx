'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UserSearchIcon } from '@/app/components/icons';
import { Player } from '@/lib/types';

// Tipe PlayerFilters
export type PlayerFilters = {
  searchTerm: string;
  role: Player['role'] | 'all';
  reputation: number;
  thLevel: number;
};

// Opsi untuk dropdown role
const roleOptions: (Player['role'] | 'all')[] = [
  'all',
  'Free Agent',
  'Leader',
  'Co-Leader',
  'Elder',
  'Member',
];

// Definisikan props untuk komponen
type PlayerHubFilterProps = {
  filters: PlayerFilters;
  onFilterChange: (newFilters: PlayerFilters) => void;
};

const PlayerHubFilter = ({ filters, onFilterChange }: PlayerHubFilterProps) => {
  // State internal untuk sinkronisasi <select> TH
  const [internalThLevel, setInternalThLevel] = useState(filters.thLevel);

  // Efek ini akan menyinkronkan state internal <select> JIKA props dari parent berubah
  useEffect(() => {
    setInternalThLevel(filters.thLevel);
  }, [filters.thLevel]);

  const handleFilterChange = (key: keyof PlayerFilters, value: string) => {
    let processedValue: string | number = value;

    if (key === 'reputation') {
      processedValue = parseFloat(value);
    } else if (key === 'thLevel') {
      processedValue = parseInt(value, 10);
      setInternalThLevel(processedValue);
    }

    onFilterChange({ ...filters, [key]: processedValue as any });
  };

  const handleReset = () => {
    const defaultFilters: PlayerFilters = {
      searchTerm: '',
      role: 'all',
      reputation: 3.0,
      thLevel: 0,
    };
    onFilterChange(defaultFilters);
    setInternalThLevel(defaultFilters.thLevel);
  };

  return (
    // [PERBAIKAN FASE 3: MOBILE RESPONSIVE]
    // - Ubah 'sticky' jadi 'static lg:sticky' agar tidak menimpa konten di HP
    // - Ubah padding 'p-6' jadi 'p-4 lg:p-6' agar lebih hemat tempat di HP
    <aside className="card-stone p-4 lg:p-6 h-fit static lg:sticky lg:top-28 rounded-lg w-full">
      <h2 className="text-xl lg:text-2xl font-clash text-white border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <UserSearchIcon className="h-6 w-6 text-coc-gold-dark" />
        Filter Pemain
      </h2>

      <div className="space-y-4 lg:space-y-6">
        {/* Search Input */}
        <div className="filter-group">
          <label
            htmlFor="player-search-input"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Nama Pemain / Tag
          </label>
          <input
            type="text"
            id="player-search-input"
            placeholder="Cari berdasarkan nama/tag..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          />
        </div>

        {/* Role Filter (Dropdown) */}
        <div className="filter-group">
          <label
            htmlFor="role-filter"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Role Dicari
          </label>
          <select
            id="role-filter"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans text-sm lg:text-base"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role} className="font-sans text-coc-stone bg-white">
                {role === 'all' ? 'Semua Role' : role}
              </option>
            ))}
          </select>
        </div>

        {/* Reputation Filter */}
        <div className="filter-group">
          <label
            htmlFor="player-rating-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Minimum Reputasi
          </label>
          <select
            id="player-rating-filter"
            value={filters.reputation}
            onChange={(e) => handleFilterChange('reputation', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold text-sm lg:text-base"
          >
            <option value="3.0" className="text-coc-stone bg-white">Semua Reputasi (3.0+ ★)</option>
            <option value="4.0" className="text-coc-stone bg-white">4.0+ ★</option>
            <option value="4.5" className="text-coc-stone bg-white">4.5+ ★</option>
            <option value="5.0" className="text-coc-stone bg-white">5.0 ★ (Sempurna)</option>
          </select>
        </div>

        {/* TH Level Filter */}
        <div className="filter-group">
          <label
            htmlFor="player-th-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Level TH
          </label>
          <select
            id="player-th-filter"
            value={internalThLevel}
            onChange={(e) => handleFilterChange('thLevel', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold text-sm lg:text-base"
          >
            <option value="0" className="text-coc-stone bg-white">Semua Level TH</option>
            <option value="9" className="text-coc-stone bg-white">Minimum TH 9</option>
            <option value="10" className="text-coc-stone bg-white">Minimum TH 10</option>
            <option value="11" className="text-coc-stone bg-white">Minimum TH 11</option>
            <option value="12" className="text-coc-stone bg-white">Minimum TH 12</option>
            <option value="13" className="text-coc-stone bg-white">Minimum TH 13</option>
            <option value="14" className="text-coc-stone bg-white">Minimum TH 14</option>
            <option value="15" className="text-coc-stone bg-white">Minimum TH 15</option>
            <option value="16" className="text-coc-stone bg-white">Minimum TH 16</option>
            <option value="17" className="text-coc-stone bg-white">Minimum TH 17</option>
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

export default PlayerHubFilter;