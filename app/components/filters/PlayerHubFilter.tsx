'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UserSearchIcon } from '@/app/components/icons';

const PlayerHubFilter = () => {
  const [reputation, setReputation] = useState(4.0);
  const [thLevel, setThLevel] = useState(13);

  const handleReset = () => {
    setReputation(4.0);
    setThLevel(13);
    const searchInput = document.getElementById('player-search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    // Anda juga bisa mereset pilihan role jika diperlukan
  };

  return (
    <aside className="card-stone p-6 h-fit sticky top-28">
      <h2 className="text-2xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <UserSearchIcon className="h-6 w-6 text-coc-gold-dark" />
        Cari Pemain
      </h2>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="player-search-input" className="block text-sm font-bold text-gray-300 mb-2">Nama Pemain / Tag</label>
          <input type="text" id="player-search-input" placeholder="Cari berdasarkan nama..." className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" />
        </div>

        {/* Role Filter */}
        <div className="filter-group">
          <label htmlFor="role-filter" className="block text-sm font-bold text-gray-300 mb-2">Role Dicari</label>
          <select id="role-filter" className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold">
            <option value="all">Semua Role</option>
            <option value="Free Agent">Free Agent</option>
            <option value="Leader">Leader</option>
            <option value="Co-Leader">Co-Leader</option>
            <option value="Elder">Elder</option>
          </select>
        </div>
        
        {/* Reputation Slider */}
        <div className="filter-group">
            <label htmlFor="player-rating-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1">
                <span>Minimum Reputasi</span>
                <span className="font-bold text-coc-gold">{reputation.toFixed(1)} ★</span>
            </label>
            <input type="range" id="player-rating-input" min="3.0" max="5.0" step="0.1" value={reputation} onChange={(e) => setReputation(parseFloat(e.target.value))} className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"/>
        </div>

        {/* TH Level Slider */}
        <div className="filter-group">
            <label htmlFor="player-th-level-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1">
                <span>Level Town Hall Minimum</span>
                <span className="font-bold text-coc-gold">TH {thLevel}</span>
            </label>
            <input type="range" id="player-th-level-input" min="10" max="16" step="1" value={thLevel} onChange={(e) => setThLevel(parseInt(e.target.value))} className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"/>
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

export default PlayerHubFilter;
