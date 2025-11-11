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
  return (
    <section className="space-y-6">
      {/* Search Form by Tag */}
      <div className="card-stone p-6 rounded-lg">
        <h2 className="text-3xl font-clash text-white mb-4">
          Pencarian Klan Publik CoC
        </h2>
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-grow">
            <label
              htmlFor="public-clan-tag-search"
              className="block text-sm font-bold text-gray-300 mb-2 font-sans"
            >
              Cari berdasarkan Tag
            </label>
            <input
              id="public-clan-tag-search"
              type="text"
              placeholder="Masukkan #CLANTAG (cth: #2G8PU0GLJ)"
              value={publicClanTag}
              onChange={(e) => onPublicClanTagChange(e.target.value)}
              className="w-full p-3 bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md text-white placeholder-gray-500 font-sans focus:outline-none focus:border-coc-gold"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isSearching}
            className={`w-full sm:w-auto flex-shrink-0 ${
              isSearching ? 'animate-pulse' : ''
            }`}
          >
            <SearchIcon
              className={`h-5 w-5 mr-2 ${isSearching ? 'hidden' : 'inline'}`}
            />
            {isSearching ? 'Mencari...' : 'Cari Tag'}
          </Button>
        </form>
      </div>

      {/* Area Hasil & Cache */}
      <div className="card-stone p-6 min-h-[40vh] space-y-4 rounded-lg">
        {isSearching && (
          <div className="text-center py-20">
            <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-clash text-coc-gold">
              Mencari klan berdasarkan tag...
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
            <h3 className="text-2xl font-clash text-white pb-2 border-b border-coc-gold-dark/30">
              {isSearchResult
                ? 'Hasil Pencarian Tag'
                : `Daftar Klan Publik (Cache - ${totalCacheCount} total)`}
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
                  Muat Lebih Banyak ({totalCacheCount - visibleCount} Tersisa)
                </Button>
              </div>
            )}
          </>
        )}

        {!isSearching && clansToDisplay.length === 0 && !searchError && (
          <p className="text-gray-400 text-center py-10">
            {publicClanTag.trim()
              ? 'Tidak ada klan ditemukan untuk tag tersebut.'
              : 'Tidak ada klan publik di cache saat ini.'}
          </p>
        )}

        <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50">
          <ClockIcon className="h-3 w-3 inline mr-1" /> Data klan publik
          di-cache dan diperbarui secara berkala.
        </div>
      </div>
    </section>
  );
};