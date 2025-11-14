'use client';

// [PERBAIKAN BUG TH 0] Impor useEffect dan useState
import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { UsersCogIcon } from '@/app/components/icons';
// PERBAIKAN #1: Import tipe ManagedClanFilters yang sudah diperbarui dari Client Component
// Karena file ini berada di luar folder teamhub, kita tidak bisa mengimpor langsung dari TeamHubClient.tsx.
// Kita akan mendefinisikan ulang typenya untuk memastikan ia sinkron dengan ManagedClan.
// Asumsi: Typenya adalah ManagedClanFilters yang sudah didefinisikan sebelumnya.
// Kita akan menggunakan definisi TeamHubClient.tsx sebagai acuan.

export type ManagedClanFilters = {
  searchTerm: string;
  // [PERBAIKAN] Pastikan tipe 'vision' sinkron dengan <select>
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
  // [PERBAIKAN BUG TH 0]
  // Tambahkan state internal untuk slider agar bisa merespon perubahan props
  const [internalThLevel, setInternalThLevel] = useState(filters.thLevel);

  // Efek ini akan menyinkronkan state internal slider JIKA props dari parent berubah (misal: saat ganti tab)
  useEffect(() => {
    setInternalThLevel(filters.thLevel);
  }, [filters.thLevel]);
  // --- Akhir Perbaikan ---

  // Fungsi generik untuk menangani perubahan pada filter
  const handleFilterChange = <K extends keyof ManagedClanFilters>(
    key: K,
    value: ManagedClanFilters[K],
  ) => {
    // [PERBAIKAN BUG TH 0]
    // Jika yang berubah adalah thLevel, update juga state internal
    if (key === 'thLevel') {
      setInternalThLevel(value as number);
    }
    // --- Akhir Perbaikan ---
    onFilterChange({ ...filters, [key]: value });
  };

  // [PERBAIKAN BUG TH 0]
  // Handler khusus untuk slider agar UI update instan saat digeser
  const handleThSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setInternalThLevel(newValue); // Update UI slider secara instan
    handleFilterChange('thLevel', newValue); // Update state di parent (TeamHubClient)
  };
  // --- Akhir Perbaikan ---

  const handleReset = () => {
    // [PERBAIKAN BUG TH 0] Ubah thLevel dari 9 ke 0
    const defaultFilters: ManagedClanFilters = {
      searchTerm: '',
      vision: 'all',
      reputation: 0, // <-- [PERBAIKAN] BUG DIPERBAIKI DI SINI (dari 3.0 ke 0)
      thLevel: 0,
    };
    onFilterChange(defaultFilters);

    // [PERBAIKAN BUG TH 0] Pastikan state internal slider juga ikut ter-reset
    setInternalThLevel(defaultFilters.thLevel);
    // --- Akhir Perbaikan ---
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
          <label
            htmlFor="search-input"
            className="block text-sm font-bold text-gray-300 mb-2 font-sans"
          >
            Nama Tim / Tag
          </label>
          <input
            type="text"
            id="search-input"
            placeholder="Cari berdasarkan nama/tag..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold font-sans"
          />
        </div>

        {/* [PERBAIKAN UI] Mengganti Tombol Toggle Visi dengan <select> agar konsisten */}
        <div className="filter-group">
          <label
            htmlFor="vision-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Visi Tim
          </label>
          <select
            id="vision-filter"
            value={filters.vision}
            onChange={(e) =>
              handleFilterChange(
                'vision',
                e.target.value as ManagedClanFilters['vision'],
              )
            }
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
            <option value="all">Semua Visi</option>
            <option value="Kompetitif">Kompetitif</option>
            <option value="Kasual">Kasual</option>
          </select>
        </div>

        {/* [DIHAPUS] Blok Tombol Toggle Visi yang lama dihapus */}

        {/* Reputation Slider */}
        <div className="filter-group">
          <label
            htmlFor="rating-input"
            className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans"
          >
            <span>Minimum Reputasi</span>
            <span className="font-bold text-coc-gold">
              {filters.reputation.toFixed(1)} ★
            </span>
          </label>
          <input
            type="range"
            id="rating-input"
            min="0" // <-- [PERBAIKAN] BUG DIPERBAIKI DI SINI (dari 3.0 ke 0)
            max="5.0"
            step="0.1"
            value={filters.reputation}
            onChange={(e) =>
              handleFilterChange('reputation', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
          />
        </div>

        {/* TH Level Slider */}
        <div className="filter-group">
          <label
            htmlFor="th-level-input"
            className="flex justify-between text-sm font-bold text-gray-300 mb-1 font-sans"
          >
            <span>Level Town Hall Minimum</span>
            {/* [PERBAIKAN BUG TH 0] Tampilkan "Semua TH" jika nilainya 0 */}
            <span className="font-bold text-coc-gold">
              {internalThLevel === 0 ? 'Semua TH' : `TH ${internalThLevel}`}
            </span>
          </label>
          <input
            type="range"
            id="th-level-input"
            min="0" // <-- BUG DIPERBAIKI DI SINI (dari 9 ke 0)
            max="17"
            step="1" // MAX TH diubah ke 17 sesuai types.ts
            value={internalThLevel} // <-- BUG DIPERBAIKI DI SINI (gunakan state internal)
            onChange={handleThSliderChange} // <-- BUG DIPERBAIKI DI SINI (gunakan handler baru)
            className="w-full h-2 bg-coc-stone rounded-lg appearance-none cursor-pointer accent-coc-gold"
          />
        </div>

        {/* Action Buttons */}
        <div className="filter-group pt-4 border-t border-coc-gold-dark/20 space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleReset}>
            Reset Filter
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default TeamHubFilter;