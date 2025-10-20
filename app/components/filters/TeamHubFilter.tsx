'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UsersCogIcon } from '@/app/components/icons';

const TeamHubFilter = () => {
  const [vision, setVision] = useState<'competitive' | 'casual' | 'all'>('competitive');
  const [reputation, setReputation] = useState(4.0);
  const [thLevel, setThLevel] = useState(13);

  const handleReset = () => {
    setVision('competitive');
    setReputation(4.0);
    setThLevel(13);
    // Juga reset input teks jika ada state untuk itu
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
  };

  return (
    <aside className="card-stone p-6 h-fit sticky top-28">
      <h2 className="text-2xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <UsersCogIcon className="h-6 w-6 text-coc-gold-dark" />
        Cari Tim
      </h2>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="search-input" className="block text-sm font-bold text-gray-300 mb-2">Nama Tim / Tag</label>
          <input type="text" id="search-input" placeholder="Cari berdasarkan nama..." className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold" />
        </div>

        {/* Vision Toggle */}
        <div className="filter-group">
          <h3 className="text-sm font-bold text-gray-300 mb-2">Kriteria Visi</h3>
          <div className="grid grid-cols-2 bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md p-1">
            <button
              onClick={() => setVision('competitive')}
              className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${vision === 'competitive' ? 'bg-coc-red text-white' : 'text-gray-400 hover:bg-white/10'}`}>
              Kompetitif
            </button>
            <button
              onClick={() => setVision('casual')}
              className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${vision === 'casual' ? 'bg-coc-green text-coc-stone' : 'text-gray-400 hover:bg-white/10'}`}>
              Kasual
            </button>
          </div>
        </div>
        
        {/* Reputation Slider */}
        <div className="filter-group">
            <label htmlFor="rating-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1">
                <span>Minimum Reputasi</span>
                <span className="font-bold text-coc-gold">{reputation.toFixed(1)} ★</span>
            </label>
            <input type="range" id="rating-input" min="3.0" max="5.0" step="0.1" value={reputation} onChange={(e) => setReputation(parseFloat(e.target.value))} className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"/>
        </div>

        {/* TH Level Slider */}
        <div className="filter-group">
            <label htmlFor="th-level-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1">
                <span>Level Town Hall Minimum</span>
                <span className="font-bold text-coc-gold">TH {thLevel}</span>
            </label>
            <input type="range" id="th-level-input" min="10" max="16" step="1" value={thLevel} onChange={(e) => setThLevel(parseInt(e.target.value))} className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"/>
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

export default TeamHubFilter;
