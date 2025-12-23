'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UsersCogIcon, SearchIcon, TrophyIcon, StarIcon, ShieldIcon, HomeIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

export type ManagedClanFilters = {
  searchTerm: string;
  vision: 'Kompetitif' | 'Kasual' | 'all';
  reputation: number;
  thLevel: number;
  minMembers: number;
};

type TeamHubFilterProps = {
  filters: ManagedClanFilters;
  onFilterChange: (newFilters: ManagedClanFilters) => void;
};

const TeamHubFilter = ({ filters, onFilterChange }: TeamHubFilterProps) => {
  const { t } = useLanguage();
  
  const [internalThLevel, setInternalThLevel] = useState(filters.thLevel);
  const [internalMinMembers, setInternalMinMembers] = useState(filters.minMembers);
  const [internalReputation, setInternalReputation] = useState(filters.reputation);

  useEffect(() => { setInternalThLevel(filters.thLevel); }, [filters.thLevel]);
  useEffect(() => { setInternalMinMembers(filters.minMembers); }, [filters.minMembers]);
  useEffect(() => { setInternalReputation(filters.reputation); }, [filters.reputation]);

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
    
    setInternalThLevel(0);
    setInternalMinMembers(0);
    setInternalReputation(0);
  };

  return (
    // [LAYOUT UPDATE] Wrapper menjadi full width dan horizontal oriented
    <div className="bg-[#1a1a1a] border-b border-white/10 p-4 md:p-6 shadow-sm relative">
      <div className="flex flex-col xl:flex-row gap-6 xl:items-end">
        
        {/* Kolom 1: Search & Vision (Penting) */}
        <div className="flex-grow space-y-4 xl:w-1/3">
            {/* Search Input */}
            <div className="relative group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-coc-gold transition-colors"/>
                <input
                type="text"
                placeholder={t.clanHub.filterSearchPlaceholder}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50 transition-all font-sans"
                />
            </div>
            
            {/* Visi Clan (Pill Selection) */}
            <div className="flex gap-2">
                {[
                    { value: 'all', label: t.clanHub.visionAll },
                    { value: 'Kompetitif', label: 'Kompetitif' },
                    { value: 'Kasual', label: 'Kasual' }
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleFilterChange('vision', option.value as any)}
                        className={`
                            py-1.5 px-3 rounded-md text-xs font-bold transition-all border border-transparent
                            ${filters.vision === option.value 
                                ? 'bg-coc-gold/20 text-coc-gold border-coc-gold/50' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Kolom 2: Sliders (Advanced) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow xl:w-2/3">
            {/* Reputation Slider */}
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
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setInternalReputation(val);
                        handleFilterChange('reputation', val);
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-coc-gold"
                />
            </div>

            {/* TH Level Slider */}
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
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInternalThLevel(val);
                        handleFilterChange('thLevel', val);
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-coc-blue"
                />
            </div>

            {/* Min Members Slider */}
            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-2 font-sans uppercase">
                    <span className="flex items-center gap-1"><ShieldIcon className="w-3 h-3 text-gray-300"/> Min Member</span>
                    <span className="text-white">{internalMinMembers}+</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={internalMinMembers}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInternalMinMembers(val);
                        handleFilterChange('minMembers', val);
                    }}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-400"
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

export default TeamHubFilter;