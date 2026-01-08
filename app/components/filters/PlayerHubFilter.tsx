'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { SearchIcon, StarIcon, HomeIcon, UserSearchIcon } from '@/app/components/icons';
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
    <div className="bg-[#15171e]/90 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
      {/* Decoration */}
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-green/30 to-transparent opacity-50" />

      <div className="flex flex-col xl:flex-row gap-8 xl:items-end relative z-10">
        
        {/* Kolom 1: Search & Role */}
        <div className="flex-grow space-y-5 xl:w-1/3">
            {/* Search Input */}
            <div className="relative group/search">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within/search:text-coc-green transition-colors"/>
                <input
                type="text"
                placeholder="Cari pemain (Nama/Tag)..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coc-green/50 focus:ring-1 focus:ring-coc-green/50 transition-all font-sans shadow-inner"
                />
            </div>
            
            {/* Role Filter (Pill Selection Scrollable) */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {roleOptions.map((role) => (
                    <button
                        key={role}
                        onClick={() => handleFilterChange('role', role)}
                        className={`
                            whitespace-nowrap py-2 px-3 rounded-lg text-xs font-bold transition-all border flex-shrink-0
                            ${filters.role === role 
                                ? 'bg-coc-green/10 text-coc-green border-coc-green/30 shadow-[0_0_10px_rgba(74,222,128,0.1)]' 
                                : 'bg-[#0a0a0b] text-gray-500 border-white/5 hover:text-white hover:border-white/10'
                            }
                        `}
                    >
                        {role === 'all' ? 'Semua Role' : role}
                    </button>
                ))}
            </div>
        </div>

        {/* Kolom 2: Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow xl:w-1/3">
            {/* Reputation Slider */}
            <div className="bg-[#0a0a0b] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 font-sans uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><StarIcon className="w-3 h-3 text-coc-gold"/> Min Rep</span>
                    <span className="text-coc-gold bg-coc-gold/10 px-1.5 py-0.5 rounded">{internalReputation.toFixed(1)}+</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.1"
                    value={internalReputation}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setInternalReputation(val);
                        handleFilterChange('reputation', val);
                    }}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-coc-gold"
                />
            </div>

            {/* TH Level Slider */}
            <div className="bg-[#0a0a0b] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 font-sans uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><HomeIcon className="w-3 h-3 text-coc-blue"/> Min TH</span>
                    <span className="text-coc-blue bg-coc-blue/10 px-1.5 py-0.5 rounded">{internalThLevel === 0 ? 'All' : `TH ${internalThLevel}+`}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="17"
                    step="1"
                    value={internalThLevel}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInternalThLevel(val);
                        handleFilterChange('thLevel', val);
                    }}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-coc-blue"
                />
            </div>
        </div>

        {/* Reset Button */}
        <div className="xl:self-center">
             <Button variant="ghost" onClick={handleReset} className="text-xs text-gray-500 hover:text-red-400 whitespace-nowrap px-4 hover:bg-red-500/10 rounded-lg h-10 w-full xl:w-auto">
                Reset Filter
             </Button>
        </div>

      </div>
    </div>
  );
};

export default PlayerHubFilter;