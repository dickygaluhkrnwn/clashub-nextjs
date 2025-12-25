'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { KnowledgeHubItem } from '@/lib/types';
import { 
  SortAscIcon, 
  FilterIcon, 
  CogsIcon, 
  EditIcon, 
  ChevronRightIcon,
  SearchIcon 
} from '@/app/components/icons';
import { 
  ALL_CATEGORIES, 
  sortItems, 
  SortOption, 
  KnowledgeHubCategory, 
  getCategoryDisplayName, 
  isVideo 
} from '@/lib/knowledge-hub-utils';
import FullPostDisplay from './components/FullPostDisplay';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface KnowledgeHubClientProps {
  initialPosts: KnowledgeHubItem[];
  initialCategory: KnowledgeHubCategory;
  initialSortBy: SortOption;
  error: string | null;
}

const ITEMS_PER_LOAD_POSTS = 5; // Naikkan sedikit agar lebih penuh

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const [isFiltering, setIsFiltering] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Mobile Toggle

  const [activeCategory, setActiveCategory] = useState<KnowledgeHubCategory>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  const [allItems] = useState<KnowledgeHubItem[]>(initialPosts);
  
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
    }, 300); // Sedikit delay untuk efek transisi
  };

  const handleSortChange = (sortBy: SortOption) => {
    setIsFiltering(true);
    setVisibleItemsCount(ITEMS_PER_LOAD_POSTS);
    setIsFilterOpen(false);
    setTimeout(() => {
        setActiveSort(sortBy);
        updateUrl(activeCategory, sortBy);
        setIsFiltering(false);
    }, 300);
  };

  const handleLoadMoreItems = () => {
    setVisibleItemsCount(prevCount => prevCount + ITEMS_PER_LOAD_POSTS);
  };

  const itemsToShow = useMemo(() => filteredAndSortedItems.slice(0, visibleItemsCount), [filteredAndSortedItems, visibleItemsCount]);
  const showLoadMoreItems = visibleItemsCount < filteredAndSortedItems.length;

  const getCategoryLabel = (cat: KnowledgeHubCategory) => {
    if (cat === 'Semua Konten') return t.knowledgeHub.page.filters.all;
    if (cat === 'Base Building') return t.knowledgeHub.page.filters.baseBuilding;
    if (cat === 'Strategi Serangan') return t.knowledgeHub.page.filters.attackStrategy;
    return getCategoryDisplayName(cat);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
        
        {/* === LEFT SIDEBAR: FILTERS === */}
        <aside className="lg:col-span-1 h-fit lg:sticky lg:top-24 space-y-6">
          
          {/* Header Mobile Filter Toggle */}
          <div 
            className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-xl flex items-center justify-between lg:hidden cursor-pointer active:scale-95 transition-transform"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
             <div className="flex items-center gap-2 text-coc-gold font-clash text-lg">
                <FilterIcon className="h-5 w-5"/> 
                {t.knowledgeHub.page.title}
             </div>
             <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-90' : ''}`} />
          </div>

          {/* Filter Container (Collapsible Mobile, Sticky Desktop) */}
          <div className={`${isFilterOpen ? 'block animate-in slide-in-from-top-2 fade-in' : 'hidden'} lg:block space-y-6`}>
             <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl space-y-8">
                
                {/* Categories */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FilterIcon className="h-3 w-3"/> Kategori
                  </h3>
                  <div className="space-y-2">
                    {ALL_CATEGORIES.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-between group ${
                          activeCategory === category
                            ? 'bg-coc-gold text-coc-dark shadow-[0_0_15px_rgba(255,215,0,0.2)] font-bold scale-105'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {getCategoryLabel(category)}
                        {activeCategory === category && <div className="w-1.5 h-1.5 rounded-full bg-coc-dark animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <SortAscIcon className="h-3 w-3"/> Urutkan
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSortChange('terbaru')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all border ${
                        activeSort === 'terbaru'
                          ? 'bg-coc-blue/20 border-coc-blue text-coc-blue'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {t.knowledgeHub.sorting.newest}
                    </button>
                    <button
                      onClick={() => handleSortChange('trending')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all border ${
                        activeSort === 'trending'
                          ? 'bg-coc-red/20 border-coc-red text-coc-red'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {t.knowledgeHub.sorting.trending}
                    </button>
                  </div>
                </div>

             </div>
          </div>
        </aside>

        {/* === CENTER: FEED === */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Header Banner (Optional, bisa untuk Search nanti) */}
          <div className="hidden lg:flex items-center justify-between mb-2">
             <h1 className="text-3xl font-clash text-white tracking-wide">
               Feed <span className="text-coc-gold">Strategi</span>
             </h1>
             <div className="text-sm text-gray-400 font-mono bg-black/20 px-3 py-1 rounded-full border border-white/5">
                {itemsToShow.length} / {filteredAndSortedItems.length} Post
             </div>
          </div>

          {/* Loading State */}
          {isFiltering ? (
             <div className="flex flex-col items-center justify-center py-32 bg-black/20 border border-white/5 rounded-2xl backdrop-blur-sm animate-pulse">
                <CogsIcon className="h-12 w-12 text-coc-gold animate-spin mb-4" />
                <h2 className="text-xl font-clash text-white tracking-widest">
                    {language === 'id' ? 'MEMUAT DATA...' : 'LOADING DATA...'}
                </h2>
             </div>
          ) : error ? (
             <div className="text-center py-20 bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-clash text-coc-red mb-2">{error}</h2>
                <p className="text-gray-400">
                    {language === 'id' ? 'Gagal memuat data dari server.' : 'Failed to load data from server.'}
                </p>
             </div>
          ) : itemsToShow.length === 0 ? ( 
             <div className="text-center py-32 bg-black/20 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                   <SearchIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h2 className="text-2xl font-clash text-white mb-2">{t.knowledgeHub.page.emptyState}</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                    {language === 'id' ? 'Belum ada konten di kategori ini. Jadilah yang pertama memposting!' : 'No content in this category yet. Be the first to post!'}
                </p>
                <Button href="/knowledge-hub/create" variant="outline" className="mt-6 border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10">
                   <EditIcon className="h-4 w-4 mr-2" /> Buat Postingan
                </Button>
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

          {/* Load More Button */}
          {showLoadMoreItems && !isFiltering && !error && (
            <div className="text-center pt-8 pb-12">
               <button 
                 onClick={handleLoadMoreItems} 
                 className="group relative px-8 py-3 bg-black/40 border border-white/10 rounded-full text-white font-bold hover:bg-white/5 hover:border-coc-gold/50 transition-all duration-300"
               >
                 <span className="relative z-10 flex items-center gap-2">
                   {language === 'id' ? 'Muat Lebih Banyak' : 'Load More'}
                   <ChevronRightIcon className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                 </span>
                 {/* Button Glow */}
                 <div className="absolute inset-0 rounded-full bg-coc-gold/20 blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
               </button>
            </div>
          )}
        </section>
      </div>

      {/* === Floating Action Button (Create Post) === */}
      <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <Button
          href="/knowledge-hub/create"
          variant="primary"
          className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-coc-stone relative group"
          title={t.knowledgeHub.page.createButton}
        >
          <div className="absolute inset-0 bg-coc-gold/20 rounded-full animate-ping opacity-75 group-hover:opacity-100" />
          <EditIcon className="h-8 w-8 text-coc-gold relative z-10" />
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeHubClient;