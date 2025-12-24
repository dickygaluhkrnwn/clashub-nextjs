'use client';

import React from 'react';
import { PublicClanIndex } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { SearchIcon, RefreshCwIcon, AlertTriangleIcon, ClockIcon, GlobeIcon, Loader2Icon } from '@/app/components/icons';
import { PublicClanCard } from './PublicClanCard';
import { useLanguage } from '@/lib/hooks/useLanguage';

// --- BAGIAN 1: Filter/Search Bar (Untuk di dalam Unified Card) ---
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
        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-grow group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold text-lg group-focus-within:text-coc-blue transition-colors">#</span>
                </div>
                <input
                    type="text"
                    placeholder={t.clanHub.searchTagPlaceholder}
                    value={publicClanTag}
                    onChange={(e) => onPublicClanTagChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-coc-blue/50 focus:ring-1 focus:ring-coc-blue/50 transition-all font-sans text-sm backdrop-blur-md shadow-inner"
                />
            </div>
            <Button
                type="submit"
                variant="primary" 
                disabled={isSearching}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl bg-coc-blue hover:bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 ${isSearching ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isSearching ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
                <span className="ml-2 font-bold tracking-wide">{t.clanHub.searchButton}</span>
            </Button>
        </form>
        <p className="text-[10px] text-gray-500 mt-1.5 ml-1">
            *Masukkan tag klan tanpa tanda pagar (contoh: 2PP...)
        </p>
    </div>
  );
};

// --- BAGIAN 2: Content List (Untuk Body) ---
interface PublicClansTabProps {
  publicClanTag: string;
  onPublicClanTagChange?: (value: string) => void; 
  onSearchSubmit?: (e: React.FormEvent) => void;
  
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

  // [VISUAL UPDATE] Menyesuaikan spacing agar konsisten dengan tab lain (space-y-8)
  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Status & Errors */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/5 rounded-3xl border border-white/5 border-dashed text-center">
          <div className="p-4 rounded-full bg-coc-blue/10 border border-coc-blue/20 mb-4 animate-pulse">
             <RefreshCwIcon className="h-8 w-8 text-coc-blue animate-spin" />
          </div>
          <h2 className="text-lg font-clash text-white tracking-wide animate-pulse">
            {t.clanHub.searchingByTag}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Sedang mengambil data terbaru...</p>
        </div>
      )}

      {searchError && !isSearching && publicClanTag.trim() && (
        <div className="p-4 bg-coc-red/10 border border-coc-red/30 text-red-200 rounded-2xl flex items-center gap-4 shadow-lg shadow-red-900/10 animate-in shake">
          <div className="p-2 rounded-full bg-coc-red/20">
             <AlertTriangleIcon className="h-5 w-5 text-coc-red" />
          </div>
          <span className="font-sans text-sm font-medium">{searchError}</span>
        </div>
      )}

      {!isSearching && clansToDisplay.length > 0 && (
        <>
          {/* [HEADER STYLE UPDATE] Menyamakan gaya dengan ClashubTeamsTab (h2, size icon, padding) */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-3">
               <div className="p-2 rounded-lg bg-coc-blue/10 border border-coc-blue/20">
                  <GlobeIcon className="w-6 h-6 text-coc-blue" />
               </div>
               <span className="tracking-wide">
                {isSearchResult
                ? t.clanHub.searchTagResult
                : `${totalCacheCount} Klan Publik Ditemukan`}
               </span>
            </h2>
          </div>
          
          <div
            className={`grid gap-6 ${
              isSearchResult
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {clansToDisplay.map((clan: PublicClanIndex, index) => (
              <div 
                key={clan.tag} 
                className="h-full animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  <PublicClanCard clan={clan} />
              </div>
            ))}
          </div>
          
          {showLoadMore && (
            <div className="flex justify-center pt-8 pb-12">
              <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onLoadMore}
                  className="group border-white/10 hover:border-coc-blue/50 text-gray-300 hover:text-white min-w-[200px]"
              >
                {t.common.loadMore} 
                <span className="ml-2 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full group-hover:bg-coc-blue group-hover:text-black transition-colors">
                    {totalCacheCount - visibleCount}
                </span>
              </Button>
            </div>
          )}
        </>
      )}

      {!isSearching && clansToDisplay.length === 0 && !searchError && (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/5 rounded-3xl border border-white/5 border-dashed text-center">
          <div className="p-6 rounded-full bg-white/5 mb-6">
             <SearchIcon className="h-16 w-16 text-gray-500 opacity-50" />
          </div>
          <p className="text-white text-xl font-clash mb-2 tracking-wide">
            {publicClanTag.trim()
              ? t.clanHub.noClanFoundForTag
              : t.clanHub.noPublicClansCache}
          </p>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            {t.clanHub.trySearchValidTag}
          </p>
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="flex items-start md:items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 mt-8 max-w-3xl mx-auto">
        <ClockIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5 md:mt-0" /> 
        <span className="text-xs text-gray-400 leading-relaxed font-sans">{t.clanHub.publicClansDisclaimer}</span>
      </div>
    </section>
  );
};