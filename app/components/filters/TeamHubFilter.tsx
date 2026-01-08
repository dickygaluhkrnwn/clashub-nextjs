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
    <div className="bg-[#15171e]/90 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
      {/* Decoration */}
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold/30 to-transparent opacity-50" />

      <div className="flex flex-col xl:flex-row gap-8 xl:items-end relative z-10">
        
        {/* Kolom 1: Search & Vision */}
        <div className="flex-grow space-y-5 xl:w-1/3">
            {/* Search Input */}
            <div className="relative group/search">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within/search:text-coc-gold transition-colors"/>
                <input
                type="text"
                placeholder={t.clanHub.filterSearchPlaceholder}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50 transition-all font-sans shadow-inner"
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
                            flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border
                            ${filters.vision === option.value 
                                ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/30 shadow-[0_0_10px_rgba(255,215,0,0.1)]' 
                                : 'bg-[#0a0a0b] text-gray-500 border-white/5 hover:text-white hover:border-white/10'
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

            {/* Min Members Slider */}
            <div className="bg-[#0a0a0b] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 font-sans uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><ShieldIcon className="w-3 h-3 text-gray-500"/> Min Member</span>
                    <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{internalMinMembers}+</span>
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
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-400"
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

export default TeamHubFilter;