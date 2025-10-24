'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { UsersCogIcon } from '@/app/components/icons';
// PERBAIKAN #1: Import tipe ManagedClanFilters yang sudah diperbarui dari Client Component
// Karena file ini berada di luar folder teamhub, kita tidak bisa mengimpor langsung dari TeamHubClient.tsx.
// Kita akan mendefinisikan ulang typenya untuk memastikan ia sinkron dengan ManagedClan.
// Asumsi: Typenya adalah ManagedClanFilters yang sudah didefinisikan sebelumnya.
// Kita akan menggunakan definisi TeamHubClient.tsx sebagai acuan.

export type ManagedClanFilters = {
    searchTerm: string;
    vision: 'Kompetitif' | 'Kasual' | 'all'; 
    reputation: number;
    thLevel: number;
};

// Definisikan props untuk komponen (menggunakan tipe yang diperbarui)
type TeamHubFilterProps = {
    filters: ManagedClanFilters; // PERBAIKAN #2: Menggunakan ManagedClanFilters
    onFilterChange: (newFilters: ManagedClanFilters) => void;
};

const TeamHubFilter = ({ filters, onFilterChange }: TeamHubFilterProps) => {

    // Fungsi generik untuk menangani perubahan pada filter
    const handleFilterChange = <K extends keyof ManagedClanFilters>(key: K, value: ManagedClanFilters[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleReset = () => {
        // Reset state kembali ke nilai default
        onFilterChange({
            searchTerm: '',
            vision: 'all', // Default reset ke 'all'
            reputation: 3.0,
            thLevel: 9,
        });
    };

    return (
        <aside className="card-stone p-6 h-fit sticky top-28 rounded-lg">
            <h2 className="text-2xl font-clash text-white border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
                <UsersCogIcon className="h-6 w-6 text-coc-gold-dark" />
                Filter Tim Clashub
            </h2>

            <div className="space-y-6">
                {/* Search Input */}
                <div className="filter-group">
                    <label htmlFor="search-input" className="block text-sm font-bold text-gray-300 mb-2 font-sans">Nama Tim / Tag</label>
                    <input 
                        type="text" 
                        id="search-input" 
                        placeholder="Cari berdasarkan nama/tag..." 
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold font-sans" 
                    />
                </div>

                {/* Vision Toggle */}
                <div className="filter-group">
                    <h3 className="text-sm font-bold text-gray-300 mb-2 font-sans">Kriteria Visi</h3>
                    <div className="grid grid-cols-3 bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md p-1">
                        <button
                             onClick={() => handleFilterChange('vision', 'all')}
                             className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filters.vision === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
                             Semua
                        </button>
                        <button
                            onClick={() => handleFilterChange('vision', 'Kompetitif')}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filters.vision === 'Kompetitif' ? 'bg-coc-red text-white' : 'text-gray-400 hover:bg-white/10'}`}>
                            Kompetitif
                        </button>
                        <button
                            onClick={() => handleFilterChange('vision', 'Kasual')}
                            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${filters.vision === 'Kasual' ? 'bg-coc-green text-coc-stone' : 'text-gray-400 hover:bg-white/10'}`}>
                            Kasual
                        </button>
                    </div>
                </div>
                
                {/* Reputation Slider */}
                <div className="filter-group">
                    <label htmlFor="rating-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans">
                        <span>Minimum Reputasi</span>
                        <span className="font-bold text-coc-gold">{filters.reputation.toFixed(1)} ★</span>
                    </label>
                    <input 
                        type="range" 
                        id="rating-input" 
                        min="3.0" max="5.0" step="0.1" 
                        value={filters.reputation} 
                        onChange={(e) => handleFilterChange('reputation', parseFloat(e.target.value))} 
                        className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
                    />
                </div>

                {/* TH Level Slider */}
                <div className="filter-group">
                    <label htmlFor="th-level-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans">
                        <span>Level Town Hall Minimum</span>
                        <span className="font-bold text-coc-gold">TH {filters.thLevel}</span>
                    </label>
                    <input 
                        type="range" 
                        id="th-level-input" 
                        min="9" max="17" step="1" // MAX TH diubah ke 17 sesuai types.ts
                        value={filters.thLevel} 
                        onChange={(e) => handleFilterChange('thLevel', parseInt(e.target.value))} 
                        className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
                    />
                </div>

                {/* Action Buttons */}
                <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
                    <Button variant="secondary" className="w-full" onClick={handleReset}>Reset Filter</Button>
                </div>
            </div>
        </aside>
    );
};

export default TeamHubFilter;
