'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { UserSearchIcon } from '@/app/components/icons';
import { Player } from '@/lib/types';

// Tipe PlayerFilters (tetap sama, parent component mengharapkan number)
export type PlayerFilters = {
    searchTerm: string;
    role: Player['role'] | 'all';
    reputation: number;
    thLevel: number;
};

// Opsi untuk dropdown role
const roleOptions: (Player['role'] | 'all')[] = ['all', 'Free Agent', 'Leader', 'Co-Leader', 'Elder', 'Member'];

// Definisikan props untuk komponen
type PlayerHubFilterProps = {
    filters: PlayerFilters;
    onFilterChange: (newFilters: PlayerFilters) => void;
};

const PlayerHubFilter = ({ filters, onFilterChange }: PlayerHubFilterProps) => {

    // [PERBAIKAN] Handler ini sekarang mem-parsing value string dari <select> menjadi number jika perlu
    const handleFilterChange = (key: keyof PlayerFilters, value: string) => {
        let processedValue: string | number = value;

        if (key === 'reputation') {
            processedValue = parseFloat(value);
        } else if (key === 'thLevel') {
            processedValue = parseInt(value, 10);
        }

        onFilterChange({ ...filters, [key]: processedValue as any });
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

                {/* Role Filter (Dropdown) */}
                <div className="filter-group">
                    <label htmlFor="role-filter" className="block text-sm font-bold text-gray-300 mb-2 font-sans">Role Dicari</label>
                    <select 
                        id="role-filter" 
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold font-sans"
                    >
                        {roleOptions.map(role => (
                            <option key={role} value={role} className='font-sans'>{role === 'all' ? 'Semua Role' : role}</option>
                        ))}
                    </select>
                </div>
                
                {/* [PERBAIKAN UI] Mengganti Reputation Slider dengan <select> */}
                <div className="filter-group">
                    <label
                        htmlFor="player-rating-filter"
                        className="block text-sm font-bold text-gray-300 mb-2"
                    >
                        Minimum Reputasi
                    </label>
                    <select
                        id="player-rating-filter"
                        value={filters.reputation}
                        onChange={(e) => handleFilterChange('reputation', e.target.value)}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                    >
                        <option value="3.0">Semua Reputasi (3.0+ ★)</option>
                        <option value="4.0">4.0+ ★</option>
                        <option value="4.5">4.5+ ★</option>
                        <option value="5.0">5.0 ★ (Sempurna)</option>
                    </select>
                </div>

                {/* [PERBAIKAN UI] Mengganti TH Level Slider dengan <select> */}
                <div className="filter-group">
                    <label
                        htmlFor="player-th-filter"
                        className="block text-sm font-bold text-gray-300 mb-2"
                    >
                        Level TH
                    </label>
                    <select
                        id="player-th-filter"
                        value={filters.thLevel}
                        onChange={(e) => handleFilterChange('thLevel', e.target.value)}
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                    >
                        <option value="9">Semua Level (TH 9+)</option>
                        <option value="17">TH 17</option>
                        <option value="15">TH 15 - 16</option>
                        <option value="13">TH 13 - 14</option>
                        <option value="10">TH 10 - 12</option>
                    </select>
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