'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { UserSearchIcon } from '@/app/components/icons';
import { Player } from '@/lib/types';

// PERBAIKAN #1: Definisikan ulang tipe PlayerFilters agar sinkron dengan TeamHubClient.tsx
export type PlayerFilters = {
    searchTerm: string;
    role: Player['role'] | 'all';
    reputation: number;
    thLevel: number;
};

// Opsi untuk dropdown role, agar tidak di-hardcode di JSX
const roleOptions: (Player['role'] | 'all')[] = ['all', 'Free Agent', 'Leader', 'Co-Leader', 'Elder', 'Member'];

// Definisikan props untuk komponen
type PlayerHubFilterProps = {
    filters: PlayerFilters;
    onFilterChange: (newFilters: PlayerFilters) => void;
};

const PlayerHubFilter = ({ filters, onFilterChange }: PlayerHubFilterProps) => {

    // Fungsi generik untuk menangani semua perubahan filter
    const handleFilterChange = <K extends keyof PlayerFilters>(key: K, value: PlayerFilters[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleReset = () => {
        // Reset state kembali ke nilai default
        onFilterChange({
            searchTerm: '',
            role: 'all',
            reputation: 3.0,
            thLevel: 9,
        });
    };

    return (
        <aside className="card-stone p-6 h-fit sticky top-28 rounded-lg">
            <h2 className="text-2xl font-clash text-white border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
                <UserSearchIcon className="h-6 w-6 text-coc-gold-dark" />
                Filter Pemain
            </h2>

            <div className="space-y-6">
                {/* Search Input */}
                <div className="filter-group">
                    <label htmlFor="player-search-input" className="block text-sm font-bold text-gray-300 mb-2 font-sans">Nama Pemain / Tag</label>
                    <input 
                        type="text" 
                        id="player-search-input" 
                        placeholder="Cari berdasarkan nama/tag..." 
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold font-sans" 
                    />
                </div>

                {/* Role Filter */}
                <div className="filter-group">
                    <label htmlFor="role-filter" className="block text-sm font-bold text-gray-300 mb-2 font-sans">Role Dicari</label>
                    <select 
                        id="role-filter" 
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value as PlayerFilters['role'])}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans"
                    >
                        {roleOptions.map(role => (
                            // PERBAIKAN #2: Menambahkan font-sans di opsi
                            <option key={role} value={role} className='font-sans'>{role === 'all' ? 'Semua Role' : role}</option>
                        ))}
                    </select>
                </div>
                
                {/* Reputation Slider */}
                <div className="filter-group">
                    <label htmlFor="player-rating-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans">
                        <span>Minimum Reputasi</span>
                        <span className="font-bold text-coc-gold">{filters.reputation.toFixed(1)} ★</span>
                    </label>
                    <input 
                        type="range" 
                        id="player-rating-input" 
                        min="3.0" max="5.0" step="0.1" 
                        value={filters.reputation} 
                        onChange={(e) => handleFilterChange('reputation', parseFloat(e.target.value))} 
                        className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
                    />
                </div>

                {/* TH Level Slider */}
                <div className="filter-group">
                    <label htmlFor="player-th-level-input" className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans">
                        <span>Level Town Hall Minimum</span>
                        <span className="font-bold text-coc-gold">TH {filters.thLevel}</span>
                    </label>
                    <input 
                        type="range" 
                        id="player-th-level-input" 
                        min="9" max="17" step="1" // PERBAIKAN #3: MAX TH diubah ke 17
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

export default PlayerHubFilter;
