'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { KnowledgeHubItem } from '@/lib/types';
import { SortAscIcon, FilterIcon, CogsIcon, EditIcon } from '@/app/components/icons';
import { ALL_CATEGORIES, sortItems, SortOption, KnowledgeHubCategory, getCategoryDisplayName, isVideo } from '@/lib/knowledge-hub-utils';
import FullPostDisplay from './components/FullPostDisplay';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface KnowledgeHubClientProps {
  initialPosts: KnowledgeHubItem[];
  initialCategory: KnowledgeHubCategory;
  initialSortBy: SortOption;
  error: string | null;
}

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD_POSTS = 3;

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  // State untuk loading filter
  const [isFiltering, setIsFiltering] = useState(false);
  // State untuk toggle filter di mobile
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState<KnowledgeHubCategory>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  const [allItems] = useState<KnowledgeHubItem[]>(initialPosts);

  // --- State Pagination ---
  const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_LOAD_POSTS);

  const updateUrl = (newCategory: KnowledgeHubCategory, newSortBy: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory && newCategory !== 'Semua Konten') {
      params.set('kategori', newCategory);
    } else {
      params.delete('kategori');
    }

    if (newSortBy && newSortBy !== 'terbaru') {
      params.set('sortir', newSortBy);
    } else {
      params.delete('sortir');
    }

    router.push(`/knowledge-hub?${params.toString()}`, { scroll: false });
  };

  const filteredAndSortedItems = useMemo(() => {
    const filtered = allItems.filter(item => {
      if (!item) return false;

      if (activeCategory === 'Semua Konten') return true;
      
      if (activeCategory === 'Semua Diskusi') return !isVideo(item);
      
      if (activeCategory === 'Berita Komunitas') {
          if (isVideo(item)) return true;
          return !isVideo(item) && item.category === 'Berita Komunitas';
      }

      if (isVideo(item)) return false; 
      
      return item.category === activeCategory;
    });
    
    return sortItems(filtered, activeSort);
  }, [allItems, activeCategory, activeSort]); 

  const handleCategoryChange = (category: KnowledgeHubCategory) => {
    setIsFiltering(true);
    setVisibleItemsCount(ITEMS_PER_LOAD_POSTS);
    setIsFilterOpen(false); 
    setTimeout(() => {
        setActiveCategory(category);
        updateUrl(category, activeSort);
        setIsFiltering(false);
    }, 50);
  };

  const handleSortChange = (sortBy: SortOption) => {
    setIsFiltering(true);
    setVisibleItemsCount(ITEMS_PER_LOAD_POSTS);
    setIsFilterOpen(false);
    setTimeout(() => {
        setActiveSort(sortBy);
        updateUrl(activeCategory, sortBy);
        setIsFiltering(false);
    }, 50);
  };

  const handleLoadMoreItems = () => {
        setVisibleItemsCount(prevCount => prevCount + ITEMS_PER_LOAD_POSTS);
  };

  const itemsToShow = useMemo(() => filteredAndSortedItems.slice(0, visibleItemsCount), [filteredAndSortedItems, visibleItemsCount]);
  const showLoadMoreItems = visibleItemsCount < filteredAndSortedItems.length;

  // --- Helpers Translation ---
  const getCategoryLabel = (cat: KnowledgeHubCategory) => {
    if (cat === 'Semua Konten') return t.knowledgeHub.page.filters.all;
    if (cat === 'Base Building') return t.knowledgeHub.page.filters.baseBuilding;
    if (cat === 'Strategi Serangan') return t.knowledgeHub.page.filters.attackStrategy;
    return getCategoryDisplayName(cat);
  };

  // [REVISI] Helper getSortLabel dihapus dan digantikan dengan direct usage dari 't'

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Kolom Kiri: Navigasi Topik (Filter) */}
        <aside className="lg:col-span-1 card-stone p-4 lg:p-6 h-fit static lg:sticky lg:top-28 rounded-lg z-10">
          
          {/* Header Filter dengan Toggle Mobile */}
          <div 
            className="flex items-center justify-between lg:mb-6 cursor-pointer lg:cursor-default"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
              <h2 className="text-xl border-l-4 border-coc-gold-dark pl-3 flex items-center gap-2 font-clash text-coc-gold">
                  <FilterIcon className="h-5 w-5 text-coc-gold-dark"/> 
                  {/* Menggunakan 'Knowledge Hub' (page title) sebagai header kategori agar konsisten dengan dictionary */}
                  {t.knowledgeHub.page.title}
              </h2>
              
              {/* Icon Chevron (Hanya Mobile) */}
              <div className={`lg:hidden text-coc-gold transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
              </div>
          </div>

          {/* Container Filter (Collapsible di Mobile) */}
          <div className={`${isFilterOpen ? 'block mt-6 animate-fade-in' : 'hidden'} lg:block space-y-6`}>
              {/* Filter Kategori */}
              <div className="space-y-1 border-b border-coc-gold-dark/20 pb-4">
                {ALL_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors flex justify-between items-center ${
                      activeCategory === category
                        ? 'bg-coc-gold text-coc-stone shadow-sm'
                        : 'text-gray-300 hover:bg-coc-stone-light/50'
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </button>
                ))}
              </div>

              {/* Filter Sortir */}
              <div>
                <h3 className="text-sm font-clash text-coc-gold-dark mb-3 flex items-center gap-1">
                  <SortAscIcon className="h-4 w-4"/> {t.knowledgeHub.sorting.label}
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleSortChange('terbaru')}
                    className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                      activeSort === 'terbaru'
                        ? 'bg-coc-red text-white'
                        : 'text-gray-300 hover:bg-coc-stone-light/50'
                    }`}
                  >
                    {t.knowledgeHub.sorting.newest}
                  </button>
                  <button
                    onClick={() => handleSortChange('trending')}
                    className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                      activeSort === 'trending'
                        ? 'bg-coc-red text-white'
                        : 'text-gray-300 hover:bg-coc-stone-light/50'
                    }`}
                  >
                    {t.knowledgeHub.sorting.trending}
                  </button>
                </div>
              </div>
          </div>
        </aside>

        {/* Kolom Tengah: Feed Postingan */}
        <section className="lg:col-span-3">
          {/* Tampilkan loading state saat memfilter */}
          {isFiltering ? (
              <div className="text-center py-20 card-stone rounded-lg">
                <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-clash text-coc-gold">
                    {language === 'id' ? 'Memfilter...' : 'Filtering...'}
                </h2>
            </div>
          ) : error ? (
              <div className="text-center py-20 card-stone p-6 rounded-lg">
                  <h2 className="text-2xl font-clash text-coc-red">{error}</h2>
                  <p className="text-gray-400 mt-2">
                      {language === 'id' ? 'Gagal memuat data dari server.' : 'Failed to load data from server.'}
                  </p>
              </div>
          ) : itemsToShow.length === 0 ? ( 
            <div className="text-center py-20 card-stone p-6 rounded-lg">
              <h2 className="text-2xl font-clash text-gray-400">{t.knowledgeHub.page.emptyState}</h2>
              <p className="text-gray-500 mt-2">
                  {language === 'id' ? 'Coba ubah kriteria filter Anda.' : 'Try changing your filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6"> 
              {itemsToShow.map(item => (
                  item ? (
                      <FullPostDisplay key={item.id} item={item} />
                  ) : null
              ))}
            </div>
          )}

          {showLoadMoreItems && (
            <div className="text-center mt-8">
                <Button variant="secondary" size="lg" onClick={handleLoadMoreItems} disabled={isFiltering}>
                    {language === 'id' ? 'Muat Lebih Banyak' : 'Load More'}
                </Button>
            </div>
          )}
        </section>
      </div>

      {/* [MODIFIKASI FAB] Floating Action Button Bulat (Hanya Ikon) */}
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Button
          href="/knowledge-hub/create"
          variant="primary"
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-coc-stone"
          title={t.knowledgeHub.page.createButton}
        >
          <EditIcon className="h-7 w-7 text-coc-gold" />
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeHubClient;