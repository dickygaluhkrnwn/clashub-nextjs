'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { FilterIcon } from '@/app/components/icons';

const TournamentFilter = () => {

  const handleReset = () => {
    // Fungsi ini akan mereset semua pilihan filter ke nilai default
    const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
    const thFilter = document.getElementById('th-level-filter') as HTMLSelectElement;
    const prizeFilter = document.getElementById('prize-filter') as HTMLSelectElement;
    if (statusFilter) statusFilter.value = 'Akan Datang';
    if (thFilter) thFilter.value = 'Semua Level';
    if (prizeFilter) prizeFilter.value = 'all';
  };

  return (
    <aside className="card-stone p-6 h-fit sticky top-28">
      <h2 className="text-2xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <FilterIcon className="h-6 w-6 text-coc-gold-dark" />
        Filter Turnamen
      </h2>

      <div className="space-y-6">
        {/* Status Filter */}
        <div className="filter-group">
          <label htmlFor="status-filter" className="block text-sm font-bold text-gray-300 mb-2">Status</label>
          <select id="status-filter" className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold">
            <option>Akan Datang</option>
            <option>Sedang Berlangsung</option>
            <option>Selesai</option>
          </select>
        </div>

        {/* TH Level Filter */}
        <div className="filter-group">
          <label htmlFor="th-level-filter" className="block text-sm font-bold text-gray-300 mb-2">Level TH</label>
          <select id="th-level-filter" className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold">
            <option>Semua Level</option>
            <option>TH 15 - 16</option>
            <option>TH 13 - 14</option>
          </select>
        </div>

        {/* Prize Filter */}
        <div className="filter-group">
          <label htmlFor="prize-filter" className="block text-sm font-bold text-gray-300 mb-2">Hadiah</label>
          <select id="prize-filter" className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold">
            <option value="all">Semua Hadiah</option>
            <option value="cash">Uang Tunai</option>
            <option value="item">In-Game Item</option>
          </select>
        </div>
        
        {/* Action Buttons */}
        <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
          <Button variant="primary" className="w-full">Terapkan Filter</Button>
          <Button variant="secondary" className="w-full" onClick={handleReset}>Reset Filter</Button>
        </div>
      </div>
    </aside>
  );
};

export default TournamentFilter;
