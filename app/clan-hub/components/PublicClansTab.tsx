'use client';

import React from 'react';
import { PublicClanIndex } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  SearchIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  ClockIcon,
} from '@/app/components/icons';
import { PublicClanCard } from './PublicClanCard';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface PublicClansTabProps {
  // State dan handler untuk search form
  publicClanTag: string;
  onPublicClanTagChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  isSearching: boolean;
  searchError: string | null;

  // Data untuk ditampilkan
  clansToDisplay: PublicClanIndex[];
  isSearchResult: boolean; // Menandakan jika ini hasil search by tag
  totalCacheCount: number;

  // Pagination untuk cache
  showLoadMore: boolean;
  onLoadMore: () => void;
  visibleCount: number;
}

/**
 * Komponen untuk me-render konten tab "Pencarian Klan Publik".
 * Diekstrak dari TeamHubClient.tsx (fungsi renderPublicClansContent).
 * [PERBAIKAN] Menghapus wrapper card-stone agar tidak double background.
 */
export const PublicClansTab = ({
  publicClanTag,
  onPublicClanTagChange,
  onSearchSubmit,
  isSearching,
  searchError,
  clansToDisplay,
  isSearchResult,
  totalCacheCount,
  showLoadMore,
  onLoadMore,
  visibleCount,
}: PublicClansTabProps) => {
  const { t } = useLanguage(); // [BARU]

  return (
    <section className="space-y-8">
      {/* Search Form by Tag */}
      {/* [MODIFIKASI] Hapus 'card-stone p-6 rounded-lg', ganti dengan border bawah */}
      <div className="pb-8 border-b border-coc-gold-dark/20">
        <h2 className="text-3xl font-clash text-white mb-4">
          {t.clanHub.publicClansSearchTitle}
        </h2>
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-grow w-full">
            <label
              htmlFor="public-clan-tag-search"
              className="block text-sm font-bold text-gray-300 mb-2 font-sans"
            >
              {t.clanHub.searchByTagLabel}
            </label>
            <input
              id="public-clan-tag-search"
              type="text"
              placeholder={t.clanHub.searchTagPlaceholder}
              value={publicClanTag}
              onChange={(e) => onPublicClanTagChange(e.target.value)}
              className="w-full p-3 bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md text-white placeholder-gray-500 font-sans focus:outline-none focus:border-coc-gold focus:ring-1 focus:ring-coc-gold transition-all"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isSearching}
            className={`w-full sm:w-auto flex-shrink-0 h-[50px] ${
              isSearching ? 'animate-pulse' : ''
            }`}
          >
            <SearchIcon
              className={`h-5 w-5 mr-2 ${isSearching ? 'hidden' : 'inline'}`}
            />
            {isSearching ? t.clanHub.searching : t.clanHub.searchButton}
          </Button>
        </form>
      </div>

      {/* Area Hasil & Cache */}
      {/* [MODIFIKASI] Hapus 'card-stone p-6' */}
      <div className="min-h-[40vh] space-y-6">
        {isSearching && (
          <div className="text-center py-20">
            <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-clash text-coc-gold">
              {t.clanHub.searchingByTag}
            </h2>
          </div>
        )}

        {searchError && !isSearching && publicClanTag.trim() && (
          <div className="p-4 bg-coc-red/10 border border-coc-red/50 text-coc-red rounded-lg flex items-center gap-3">
            <AlertTriangleIcon className="h-6 w-6" />
            <span className="font-sans">{searchError}</span>
          </div>
        )}

        {!isSearching && clansToDisplay.length > 0 && (
          <>
            <h3 className="text-2xl font-clash text-white pb-2">
              {isSearchResult
                ? t.clanHub.searchTagResult
                : t.clanHub.publicClansCache.replace('{total}', totalCacheCount.toString())}
            </h3>
            <div
              className={`grid gap-6 ${
                isSearchResult
                  ? 'grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {clansToDisplay.map((clan: PublicClanIndex) => (
                <PublicClanCard key={clan.tag} clan={clan} />
              ))}
            </div>
            {showLoadMore && (
              <div className="text-center pt-6">
                <Button variant="secondary" size="lg" onClick={onLoadMore}>
                  {t.common.loadMore} ({totalCacheCount - visibleCount} {t.common.remaining})
                </Button>
              </div>
            )}
          </>
        )}

        {!isSearching && clansToDisplay.length === 0 && !searchError && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-lg mb-2">
              {publicClanTag.trim()
                ? t.clanHub.noClanFoundForTag
                : t.clanHub.noPublicClansCache}
            </p>
            <p className="text-sm text-gray-500">
              {t.clanHub.trySearchValidTag}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50 mt-8">
          <ClockIcon className="h-3 w-3 inline mr-1" /> {t.clanHub.publicClansDisclaimer}
        </div>
      </div>
    </section>
  );
};