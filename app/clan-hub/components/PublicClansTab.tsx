'use client';

import React from 'react';
import { PublicClanIndex } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { SearchIcon, RefreshCwIcon, AlertTriangleIcon, ClockIcon } from '@/app/components/icons';
import { PublicClanCard } from './PublicClanCard';
import { useLanguage } from '@/lib/hooks/useLanguage';

// --- BAGIAN 1: Filter/Search Bar (Untuk Header) ---
// Ini akan dirender di dalam TeamHubTabNavigation
interface PublicClanSearchFilterProps {
  publicClanTag: string;
  onPublicClanTagChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
}

export const PublicClanSearchFilter = ({
  publicClanTag,
  onPublicClanTagChange,
  onSearchSubmit,
  isSearching,
}: PublicClanSearchFilterProps) => {
  const { t } = useLanguage();
  return (
    <div className="w-full">
        <div className="mb-2 hidden xl:block">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">
                Cari Tag
            </label>
        </div>
        <form onSubmit={onSearchSubmit} className="flex gap-3 w-full">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">#</span>
                </div>
                <input
                    type="text"
                    placeholder={t.clanHub.searchTagPlaceholder}
                    value={publicClanTag}
                    onChange={(e) => onPublicClanTagChange(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50 transition-all font-sans text-sm"
                />
            </div>
            <Button
                type="submit"
                variant="primary"
                disabled={isSearching}
                className={`flex-shrink-0 px-6 rounded-xl ${isSearching ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isSearching ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
                <span className="hidden sm:inline ml-2">{t.clanHub.searchButton}</span>
            </Button>
        </form>
    </div>
  );
};

// --- BAGIAN 2: Content List (Untuk Body) ---
interface PublicClansTabProps {
  publicClanTag: string;
  // [FIX] Menambahkan prop yang hilang agar sinkron dengan TeamHubClient
  onPublicClanTagChange?: (value: string) => void; 
  onSearchSubmit?: (e: React.FormEvent) => void; // Opsional jika ingin retry dari body
  
  isSearching: boolean;
  searchError: string | null;
  clansToDisplay: PublicClanIndex[];
  isSearchResult: boolean;
  totalCacheCount: number;
  showLoadMore: boolean;
  onLoadMore: () => void;
  visibleCount: number;
}

export const PublicClansTab = ({
  publicClanTag,
  // onPublicClanTagChange, // Tidak wajib dipakai di render body, tapi wajib di interface agar TS tidak error saat dipassing
  isSearching,
  searchError,
  clansToDisplay,
  isSearchResult,
  totalCacheCount,
  showLoadMore,
  onLoadMore,
  visibleCount,
}: PublicClansTabProps) => {
  const { t } = useLanguage();

  return (
    <section className="space-y-6 animate-in fade-in duration-300 pt-4">
      {/* Search Status & Errors */}
      {isSearching && (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-clash text-coc-gold animate-pulse">
            {t.clanHub.searchingByTag}
          </h2>
        </div>
      )}

      {searchError && !isSearching && publicClanTag.trim() && (
        <div className="p-4 bg-coc-red/10 border border-coc-red/50 text-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangleIcon className="h-6 w-6 text-coc-red flex-shrink-0 mt-0.5" />
          <span className="font-sans text-sm md:text-base leading-snug">{searchError}</span>
        </div>
      )}

      {!isSearching && clansToDisplay.length > 0 && (
        <>
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
            <h3 className="text-xl font-clash text-white flex items-center gap-2">
                {isSearchResult
                ? t.clanHub.searchTagResult
                : t.clanHub.publicClansCache.replace('{total}', totalCacheCount.toString())}
            </h3>
          </div>
          
          <div
            className={`grid gap-4 md:gap-6 ${
              isSearchResult
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {clansToDisplay.map((clan: PublicClanIndex) => (
              <div key={clan.tag} className="transition-transform duration-200 hover:-translate-y-1">
                  <PublicClanCard clan={clan} />
              </div>
            ))}
          </div>
          
          {showLoadMore && (
            <div className="text-center pt-8 pb-4">
              <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={onLoadMore}
                  className="shadow-lg shadow-black/30 border border-white/10"
              >
                {t.common.loadMore} ({totalCacheCount - visibleCount} {t.common.remaining})
              </Button>
            </div>
          )}
        </>
      )}

      {!isSearching && clansToDisplay.length === 0 && !searchError && (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
          <SearchIcon className="h-16 w-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 text-lg mb-2 font-medium">
            {publicClanTag.trim()
              ? t.clanHub.noClanFoundForTag
              : t.clanHub.noPublicClansCache}
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {t.clanHub.trySearchValidTag}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 pt-6 border-t border-white/10 mt-8 justify-center sm:justify-start">
        <ClockIcon className="h-4 w-4" /> 
        <span>{t.clanHub.publicClansDisclaimer}</span>
      </div>
    </section>
  );
};