'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { FilterIcon, RefreshCwIcon, TrophyIcon, SearchIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

export interface TournamentFilters {
  status: string;
  thLevel: string;
  prize: 'all' | 'cash' | 'item';
}

type TournamentFilterProps = {
  filters: TournamentFilters;
  onFilterChange: (newFilters: TournamentFilters) => void;
};

const TournamentFilter = ({ filters, onFilterChange }: TournamentFilterProps) => {
  const { t } = useLanguage();

  const handleFilterChange = (key: keyof TournamentFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFilterChange({
      status: t.tournament.filterStatusAll,
      thLevel: t.clanHub.filterAllTh,
      prize: 'all',
    });
  };

  // Modern "Control Panel" style
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
       <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
          <FilterIcon className="h-5 w-5 text-coc-gold" />
          <h2 className="font-clash text-lg font-bold text-white uppercase tracking-wider">
             Filter Arena
          </h2>
       </div>

       <div className="space-y-6">
          {/* Status Filter - Radio Style */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {t.tournament.filterStatusLabel}
             </label>
             <div className="grid grid-cols-2 gap-2">
                {[
                  { val: t.tournament.filterStatusAll, label: 'All' },
                  { val: t.tournament.filterStatusUpcoming, label: 'Open' },
                  { val: t.tournament.filterStatusOngoing, label: 'Live' },
                  { val: t.tournament.filterStatusCompleted, label: 'Done' }
                ].map((opt) => (
                   <button
                     key={opt.val}
                     onClick={() => handleFilterChange('status', opt.val)}
                     className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                        filters.status === opt.val
                           ? 'bg-coc-gold text-coc-dark border-coc-gold shadow-lg shadow-coc-gold/20'
                           : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
                     }`}
                   >
                      {opt.label}
                   </button>
                ))}
             </div>
          </div>

          {/* TH Level - Custom Select */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {t.clanHub.filterThLevel}
             </label>
             <div className="relative group">
                <select
                  value={filters.thLevel}
                  onChange={(e) => handleFilterChange('thLevel', e.target.value)}
                  className="w-full appearance-none rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-coc-gold focus:outline-none focus:ring-1 focus:ring-coc-gold hover:border-white/20 transition-colors"
                >
                  <option value={t.clanHub.filterAllTh} className="bg-coc-dark">Semua Town Hall</option>
                  <option value="TH 15 - 16" className="bg-coc-dark">High (TH 15-16)</option>
                  <option value="TH 13 - 14" className="bg-coc-dark">Mid (TH 13-14)</option>
                  <option value="TH 10 - 12" className="bg-coc-dark">Low (TH 10-12)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-coc-gold transition-colors">
                   <TrophyIcon className="h-4 w-4" />
                </div>
             </div>
          </div>

          {/* Prize Pool - Toggle */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {t.tournament.cardPrize}
             </label>
             <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                {[
                   { val: 'all', label: 'Semua' },
                   { val: 'cash', label: 'Uang Tunai' },
                   { val: 'item', label: 'Item' }
                ].map((opt) => (
                   <button
                     key={opt.val}
                     onClick={() => handleFilterChange('prize', opt.val as any)}
                     className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        filters.prize === opt.val
                           ? 'bg-white/10 text-white shadow-sm'
                           : 'text-gray-500 hover:text-gray-300'
                     }`}
                   >
                      {opt.label}
                   </button>
                ))}
             </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2">
             <Button 
               variant="outline" 
               className="w-full border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-500 transition-all"
               onClick={handleReset}
             >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                {t.clanHub.resetFilter}
             </Button>
          </div>
       </div>
    </div>
  );
};

export default TournamentFilter;