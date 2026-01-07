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
  SearchIcon,
  BookOpenIcon, // Added for header icon
  AlertTriangleIcon
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

const ITEMS_PER_LOAD_POSTS = 5;

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const [isFiltering, setIsFiltering] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      // [REMOVED] Kategori "Semua Diskusi" dihapus sesuai permintaan
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
    }, 300);
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
    <div className="relative min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1625] via-[#0f1115] to-transparent pointer-events-none z-0 opacity-60" />
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {/* === LEFT SIDEBAR: FILTERS === */}
        <aside className="lg:col-span-1 h-fit lg:sticky lg:top-24 space-y-6 z-20">
          
          {/* Header Mobile Filter Toggle */}
          <div 
            className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between lg:hidden cursor-pointer active:scale-95 transition-transform shadow-lg"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
             <div className="flex items-center gap-3 text-coc-gold font-clash text-lg uppercase tracking-wide">
                <div className="p-1.5 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
                   <FilterIcon className="h-5 w-5"/> 
                </div>
                {t.knowledgeHub.page.title}
             </div>
             <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isFilterOpen ? 'rotate-90' : ''}`} />
          </div>

          {/* Filter Container (Collapsible Mobile, Sticky Desktop) */}
          <div className={`${isFilterOpen ? 'block animate-in slide-in-from-top-4 fade-in' : 'hidden'} lg:block space-y-6`}>
              <div className="bg-[#15171e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-8 relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-coc-blue opacity-50" />

                {/* Categories */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FilterIcon className="h-3 w-3 text-purple-400"/> Kategori
                  </h3>
                  <div className="space-y-2">
                    {ALL_CATEGORIES
                      .filter(category => category !== 'Semua Diskusi') // [FILTERED] Hapus opsi "Semua Diskusi" dari UI
                      .map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                            activeCategory === category
                              ? 'bg-gradient-to-r from-purple-600/20 to-purple-900/20 border border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                              : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                          }`}
                        >
                          {activeCategory === category && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                          )}
                          <span className="relative z-10">{getCategoryLabel(category)}</span>
                          {activeCategory === category && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse relative z-10" />}
                        </button>
                    ))}
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <SortAscIcon className="h-3 w-3 text-coc-blue"/> Urutkan
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSortChange('terbaru')}
                      className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border shadow-sm ${
                        activeSort === 'terbaru'
                          ? 'bg-coc-blue/20 border-coc-blue text-coc-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-200'
                      }`}
                    >
                      {t.knowledgeHub.sorting.newest}
                    </button>
                    <button
                      onClick={() => handleSortChange('trending')}
                      className={`px-3 py-2.5 text-xs font-bold rounded-xl transition-all border shadow-sm ${
                        activeSort === 'trending'
                          ? 'bg-coc-red/20 border-coc-red text-coc-red shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-200'
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
        <section className="lg:col-span-3 space-y-8">
          
          {/* Header Banner */}
          <div className="hidden lg:flex items-center justify-between mb-4 pb-4 border-b border-white/5">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <BookOpenIcon className="h-6 w-6 text-purple-400" />
                 </div>
                 <div>
                     <h1 className="text-3xl font-clash text-white tracking-wide uppercase drop-shadow-md">
                       Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Hub</span>
                     </h1>
                     <p className="text-sm text-gray-500 font-sans tracking-wide">Pusat strategi, diskusi, dan berita komunitas.</p>
                 </div>
             </div>
             
             <div className="text-xs text-gray-400 font-mono bg-[#15171e] px-4 py-2 rounded-xl border border-white/10 shadow-inner flex items-center gap-2">
                <span className="w-2 h-2 bg-coc-green rounded-full animate-pulse" />
                {itemsToShow.length} / {filteredAndSortedItems.length} Active Posts
             </div>
          </div>

          {/* Loading State */}
          {isFiltering ? (
             <div className="flex flex-col items-center justify-center py-40 bg-[#15171e]/50 border border-white/5 rounded-3xl backdrop-blur-sm animate-pulse">
                <div className="relative">
                    <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full" />
                    <CogsIcon className="h-16 w-16 text-coc-gold animate-spin relative z-10" />
                </div>
                <h2 className="text-xl font-clash text-white tracking-[0.2em] mt-6">
                   {language === 'id' ? 'MEMUAT DATA...' : 'LOADING DATA...'}
                </h2>
             </div>
          ) : error ? (
             <div className="text-center py-20 bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-clash text-white mb-2 uppercase tracking-wide">System Error</h2>
                <p className="text-gray-400 max-w-md mx-auto font-mono text-sm">
                   {error || (language === 'id' ? 'Gagal memuat data dari server.' : 'Failed to load data from server.')}
                </p>
             </div>
          ) : itemsToShow.length === 0 ? ( 
             <div className="text-center py-40 bg-[#15171e]/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-24 h-24 bg-[#0a0a0b] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                   <SearchIcon className="h-10 w-10 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
                <h2 className="text-2xl font-clash text-white mb-2 uppercase tracking-wide">{t.knowledgeHub.page.emptyState}</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                   {language === 'id' ? 'Belum ada konten di kategori ini. Jadilah yang pertama memposting!' : 'No content in this category yet. Be the first to post!'}
                </p>
                <Button href="/knowledge-hub/create" variant="primary" className="shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] px-8 font-bold tracking-widest">
                   <EditIcon className="h-4 w-4 mr-2" /> CREATE POST
                </Button>
             </div>
          ) : (
            <div className="space-y-8"> 
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
                 className="group relative px-10 py-4 bg-[#15171e] border border-coc-gold/30 rounded-2xl text-coc-gold font-bold hover:bg-coc-gold hover:text-black transition-all duration-300 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] active:scale-95"
               >
                 <span className="relative z-10 flex items-center gap-3 font-clash tracking-widest uppercase text-sm">
                   {language === 'id' ? 'Muat Lebih Banyak' : 'Load More'}
                   <ChevronRightIcon className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                 </span>
                 {/* Button Glow */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
               </button>
            </div>
          )}
        </section>
        </div>
      </div>

      {/* === Floating Action Button (Create Post) === */}
      <div className="fixed bottom-24 md:bottom-12 right-6 md:right-12 z-40 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <Button
          href="/knowledge-hub/create"
          variant="primary"
          className="rounded-2xl w-14 h-14 md:w-16 md:h-16 p-0 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:shadow-[0_0_50px_rgba(255,215,0,0.6)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-gradient-to-br from-coc-gold to-yellow-600 relative group"
          title={t.knowledgeHub.page.createButton}
        >
          <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
          <EditIcon className="h-7 w-7 md:h-8 md:w-8 text-[#0a0a0b] relative z-10 drop-shadow-sm" />
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeHubClient;