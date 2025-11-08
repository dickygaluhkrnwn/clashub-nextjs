'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { FilterIcon } from '@/app/components/icons';
import { Tournament } from '@/lib/types'; // Import Tournament untuk tipe status

// --- [BARU] Tipe untuk status UI (Bahasa Indonesia) ---
type TournamentStatusUI = 'Akan Datang' | 'Live' | 'Selesai';

// --- DEFINISI TIPE BARU UNTUK FILTER TURNAMEN ---
// Kita ekspor tipe ini agar bisa digunakan oleh TournamentClient.tsx
export interface TournamentFilters {
  // Status turnamen. 'Semua Status' adalah opsi default.
  // [PERBAIKAN] Mengganti Tournament['status'] (Inggris) dengan tipe UI (Indonesia)
  status: TournamentStatusUI | 'Semua Status';
  // Persyaratan TH. Harus sesuai dengan format string di data Tournament.
  // [PERBAIKAN] Menambahkan 'TH 10 - 12' agar sinkron dengan <option> di bawah
  thLevel: 'Semua Level' | 'TH 15 - 16' | 'TH 13 - 14' | 'TH 10 - 12';
  // Hadiah. Menggunakan nilai value dari <option>
  prize: 'all' | 'cash' | 'item';
}

// Definisikan props untuk komponen, kini menerima state dan handler dari parent
type TournamentFilterProps = {
  filters: TournamentFilters;
  onFilterChange: (newFilters: TournamentFilters) => void;
};

const TournamentFilter = ({ filters, onFilterChange }: TournamentFilterProps) => {
  // Fungsi generik untuk menangani semua perubahan filter
  const handleFilterChange = (key: keyof TournamentFilters, value: string) => {
    // Pastikan nilai dikonversi ke tipe yang benar jika diperlukan
    onFilterChange({ ...filters, [key]: value as any });
  };

  const handleReset = () => {
    // Reset state kembali ke nilai default
    onFilterChange({
      status: 'Semua Status',
      thLevel: 'Semua Level',
      prize: 'all',
    });
  };

  // Tombol "Terapkan Filter" dihapus karena perubahan sekarang terjadi real-time di parent.

  return (
    <aside className="card-stone p-6 h-fit sticky top-28">
      <h2 className="text-2xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-3">
        <FilterIcon className="h-6 w-6 text-coc-gold-dark" />
        Filter Turnamen
      </h2>

      <div className="space-y-6">
        {/* Status Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="status-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
            <option>Semua Status</option>
            <option>Akan Datang</option>
            <option>Live</option>
            <option>Selesai</option>
          </select>
        </div>

        {/* TH Level Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="th-level-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Level TH
          </label>
          <select
            id="th-level-filter"
            value={filters.thLevel}
            onChange={(e) => handleFilterChange('thLevel', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
            <option>Semua Level</option>
            <option>TH 15 - 16</option>
            <option>TH 13 - 14</option>
            <option>TH 10 - 12</option> {/* Tambahkan opsi umum */}
          </select>
        </div>

        {/* Prize Filter (CONTROLLED) */}
        <div className="filter-group">
          <label
            htmlFor="prize-filter"
            className="block text-sm font-bold text-gray-300 mb-2"
          >
            Hadiah
          </label>
          <select
            id="prize-filter"
            value={filters.prize}
            onChange={(e) => handleFilterChange('prize', e.target.value)}
            className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
          >
            <option value="all">Semua Hadiah</option>
            <option value="cash">Uang Tunai</option>
            <option value="item">In-Game Item</option>
          </select>
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

export default TournamentFilter;