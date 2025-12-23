'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UserSearchIcon, SearchIcon, StarIcon, HomeIcon } from '@/app/components/icons';
import { Player } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

export type PlayerFilters = {
  searchTerm: string;
  role: Player['role'] | 'all';
  reputation: number;
  thLevel: number;
};

const roleOptions: (Player['role'] | 'all')[] = [
  'all', 'Leader', 'Co-Leader', 'Elder', 'Member', 'Free Agent',
];

type PlayerHubFilterProps = {
  filters: PlayerFilters;
  onFilterChange: (newFilters: PlayerFilters) => void;
};

const PlayerHubFilter = ({ filters, onFilterChange }: PlayerHubFilterProps) => {
  const { t } = useLanguage();
  
  const [internalThLevel, setInternalThLevel] = useState(filters.thLevel);
  const [internalReputation, setInternalReputation] = useState(filters.reputation);

  useEffect(() => { setInternalThLevel(filters.thLevel); }, [filters.thLevel]);
  useEffect(() => { setInternalReputation(filters.reputation); }, [filters.reputation]);

  const handleFilterChange = (key: keyof PlayerFilters, value: string | number) => {
    let processedValue: string | number = value;
    if (key === 'reputation') {
      processedValue = typeof value === 'string' ? parseFloat(value) : value;
      setInternalReputation(processedValue as number);
    } else if (key === 'thLevel') {
      processedValue = typeof value === 'string' ? parseInt(value, 10) : value;
      setInternalThLevel(processedValue as number);
    }
    onFilterChange({ ...filters, [key]: processedValue as any });
  };

  const handleReset = () => {
    const defaultFilters: PlayerFilters = {
      searchTerm: '',
      role: 'all',
      reputation: 0,
      thLevel: 0,
    };
    onFilterChange(defaultFilters);
    setInternalThLevel(0);
    setInternalReputation(0);
  };

  return (
    <div className="bg-[#1a1a1a] border-b border-white/10 p-4 md:p-6 shadow-sm relative">
      <div className="flex flex-col xl:flex-row gap-6 xl:items-end">
        
        {/* Kolom 1: Search */}
        <div className="flex-grow space-y-4 xl:w-1/3">
            <div className="relative group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-coc-gold transition-colors"/>
                <input
                type="text"
                placeholder="Cari pemain (Nama/Tag)..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50 transition-all font-sans"
                />
            </div>
            
            {/* Role Filter (Dropdown/Select for compact header) */}
            <div>
               <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs font-bold text-gray-300 focus:ring-coc-gold focus:border-coc-gold"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role} className="bg-[#2a2a2a] text-white">
                      {role === 'all' ? 'Semua Role' : role}
                    </option>
                  ))}
                </select>
            </div>
        </div>

        {/* Kolom 2: Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow xl:w-1/3">
            {/* Reputation */}
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 font-sans uppercase">
                    <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-coc-gold"/> Min Rep</span>
                    <span className="text-coc-gold">{internalReputation.toFixed(1)}+</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.1"
                    value={internalReputation}
                    onChange={(e) => handleFilterChange('reputation', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-coc-gold"
                />
            </div>

            {/* TH Level */}
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 font-sans uppercase">
                    <span className="flex items-center gap-1"><HomeIcon className="w-3 h-3 text-coc-blue"/> Min TH</span>
                    <span className="text-coc-blue">{internalThLevel === 0 ? 'All' : `TH ${internalThLevel}+`}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="17"
                    step="1"
                    value={internalThLevel}
                    onChange={(e) => handleFilterChange('thLevel', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-coc-blue"
                />
            </div>
        </div>

        {/* Reset Button */}
        <div className="xl:self-center">
             <Button variant="ghost" onClick={handleReset} className="text-xs text-gray-500 hover:text-red-400 whitespace-nowrap">
                Reset
             </Button>
        </div>

      </div>
    </div>
  );
};

export default PlayerHubFilter;