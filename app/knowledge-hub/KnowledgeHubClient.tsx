'use client';

// Impor React (diperlukan untuk useState)
import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
// PERBAIKAN: Impor KnowledgeHubItem dan Video (Post masih diperlukan untuk casting)
import { Post, KnowledgeHubItem, Video } from '@/lib/types';
// Impor ikon untuk loading (opsional)
import { BookOpenIcon, EditIcon, StarIcon, SortAscIcon, FilterIcon, CogsIcon } from '@/app/components/icons';
// PERBAIKAN: Ganti sortPosts -> sortItems, dan impor tipe KNOWLEDGE_HUB_CATEGORIES
import { ALL_CATEGORIES, sortItems, SortOption, KnowledgeHubCategory, getCategoryDisplayName, isVideo } from '@/lib/knowledge-hub-utils';
// --- BARU: Impor komponen FullPostDisplay ---
import FullPostDisplay from './components/FullPostDisplay';

interface KnowledgeHubClientProps {
  // PERBAIKAN: Ubah Post[] -> KnowledgeHubItem[]
  initialPosts: KnowledgeHubItem[];
  // PERBAIKAN: Gunakan tipe yang lebih spesifik
  initialCategory: KnowledgeHubCategory;
  initialSortBy: SortOption;
  error: string | null;
}

// --- Konstanta Pagination ---
// Mengurangi jumlah item per load karena postingan penuh lebih besar
const ITEMS_PER_LOAD_POSTS = 3; // Tampilkan 3 postingan per load

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State untuk loading filter
  const [isFiltering, setIsFiltering] = useState(false);

  // PERBAIKAN: Gunakan tipe KnowledgeHubCategory
  const [activeCategory, setActiveCategory] = useState<KnowledgeHubCategory>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  // PERBAIKAN: Ubah allPosts -> allItems, Post[] -> KnowledgeHubItem[]
  const [allItems] = useState<KnowledgeHubItem[]>(initialPosts);

  // --- State Pagination ---
  // PERBAIKAN: Ubah nama state
  const [visibleItemsCount, setVisibleItemsCount] = useState(ITEMS_PER_LOAD_POSTS);
  // --- End State Pagination ---

  // PERBAIKAN: Gunakan tipe KnowledgeHubCategory
  const updateUrl = (newCategory: KnowledgeHubCategory, newSortBy: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    // PERBAIKAN: Gunakan 'Semua Konten' sebagai default
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

    // Pindah route tanpa scroll ke atas
    router.push(`/knowledge-hub?${params.toString()}`, { scroll: false });
  };

  // Logika filter dan sort (BERUBAH)
  const filteredAndSortedItems = useMemo(() => {
    const filtered = allItems.filter(item => {
        if (activeCategory === 'Semua Konten') return true; // Tampilkan semua
        
        // Logika untuk 'Semua Diskusi' (hanya Post)
        if (activeCategory === 'Semua Diskusi') return !isVideo(item); // Hanya Post
        
        // Logika untuk 'Berita Komunitas' (Post 'Berita Komunitas' + Video)
        if (activeCategory === 'Berita Komunitas') {
            if (isVideo(item)) return true; // Semua video YouTube otomatis masuk
            // Jika post, pastikan kategorinya 'Berita Komunitas'
            return !isVideo(item) && item.category === 'Berita Komunitas';
        }

        // Logika untuk kategori spesifik (hanya Post)
        if (isVideo(item)) return false; 
        
        // Jika item adalah Post, cek kategorinya
        return item.category === activeCategory;
    });
    
    // Urutkan hasil filter berdasarkan sort AKTIF
    return sortItems(filtered, activeSort);
  }, [allItems, activeCategory, activeSort]); 


  // Handler filter diperbarui untuk mereset pagination
  const handleCategoryChange = (category: KnowledgeHubCategory) => { // Gunakan tipe KnowledgeHubCategory
    setIsFiltering(true);
    setVisibleItemsCount(ITEMS_PER_LOAD_POSTS); // Reset pagination
    setTimeout(() => {
        setActiveCategory(category);
        updateUrl(category, activeSort);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
  };

  const handleSortChange = (sortBy: SortOption) => {
    setIsFiltering(true);
    setVisibleItemsCount(ITEMS_PER_LOAD_POSTS); // Reset pagination
    setTimeout(() => {
        setActiveSort(sortBy);
        updateUrl(activeCategory, sortBy);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
  };

  // --- Fungsi Load More Posts ---
  const handleLoadMoreItems = () => { // Ubah nama fungsi
        setVisibleItemsCount(prevCount => prevCount + ITEMS_PER_LOAD_POSTS);
  };
  // --- End Fungsi Load More ---

  // --- Logika Slice & Show Button Posts ---
  const itemsToShow = useMemo(() => filteredAndSortedItems.slice(0, visibleItemsCount), [filteredAndSortedItems, visibleItemsCount]);
  const showLoadMoreItems = visibleItemsCount < filteredAndSortedItems.length;
  // --- End Logika ---


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Kolom Kiri: Navigasi Topik (Filter) */}
      <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28">
         {/* Judul akan otomatis font-clash */}
        <h2 className="text-xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-2">
            <FilterIcon className="h-5 w-5"/> Kategori Forum
        </h2>

        {/* Filter Kategori */}
        <div className="space-y-1 border-b border-coc-gold-dark/20 pb-4">
          {/* PERBAIKAN: Gunakan ALL_CATEGORIES dari utils */}
          {ALL_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)} // Panggil handler baru
              // Font tombol standar (font-sans)
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors flex justify-between items-center ${
                activeCategory === category
                  ? 'bg-coc-gold text-coc-stone shadow-sm'
                  : 'text-gray-300 hover:bg-coc-stone-light/50'
              }`}
            >
              {/* PERBAIKAN: Gunakan getCategoryDisplayName */}
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>

        {/* Filter Sortir */}
        <div className="mt-6">
           {/* Judul akan otomatis font-clash */}
          <h3 className="text-sm font-clash text-coc-gold-dark mb-3 flex items-center gap-1">
            <SortAscIcon className="h-4 w-4"/> Urutkan
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => handleSortChange('terbaru')} // Panggil handler baru
              // Font tombol standar (font-sans)
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                activeSort === 'terbaru'
                  ? 'bg-coc-red text-white' // Gaya aktif berbeda untuk sort
                  : 'text-gray-300 hover:bg-coc-stone-light/50'
              }`}
            >
              Terbaru
            </button>
            <button
              onClick={() => handleSortChange('trending')} // Panggil handler baru
               // Font tombol standar (font-sans)
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                activeSort === 'trending'
                  ? 'bg-coc-red text-white' // Gaya aktif berbeda untuk sort
                  : 'text-gray-300 hover:bg-coc-stone-light/50'
              }`}
            >
              Paling Trending
            </button>
          </div>
        </div>
      </aside>

      {/* Kolom Tengah: Feed Postingan */}
      <section className="lg:col-span-3">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
           {/* Judul akan otomatis font-clash */}
          <h1 className="text-3xl">Knowledge Hub</h1>
          <Button href="/knowledge-hub/create" variant="primary">
            <EditIcon className="h-5 w-5 mr-2"/>
            Buat Postingan
          </Button>
        </div>

        {/* Tampilkan loading state saat memfilter */}
        {isFiltering ? (
            <div className="text-center py-20 card-stone rounded-lg">
               <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                {/* Menggunakan font-clash untuk teks loading */}
               <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
           </div>
        ) : error ? (
            <div className="text-center py-20 card-stone p-6 rounded-lg">
                 {/* Menggunakan font-clash untuk judul error */}
                <h2 className="text-2xl font-clash text-coc-red">{error}</h2>
                <p className="text-gray-400 mt-2">Gagal memuat data dari server.</p>
            </div>
        // PERBAIKAN: Cek itemsToShow
        ) : itemsToShow.length === 0 ? ( 
          <div className="text-center py-20 card-stone p-6 rounded-lg">
             {/* Menggunakan font-clash untuk judul */}
            <h2 className="text-2xl font-clash text-gray-400">Tidak ada konten di kategori ini.</h2>
            <p className="text-gray-500 mt-2">Coba ubah kriteria filter Anda.</p>
          </div>
        ) : (
          // --- PERUBAHAN: Render FullPostDisplay, bukan PostCard ---
          <div className="space-y-6"> {/* Beri jarak antar postingan penuh */}
            {/* PERBAIKAN: Loop 'itemsToShow' dan beri tipe 'item'. Render placeholder untuk Video. */}
            {itemsToShow.map(item => (
                <React.Fragment key={item.id}>
                    {isVideo(item) ? (
                        // Placeholder sementara untuk Video
                        <div className="card-stone p-4 text-coc-gold border-l-4 border-blue-500">
                            <p className="font-bold">VIDEO: {item.title}</p>
                            <p className="text-xs text-gray-400">Oleh: {(item as Video).channelTitle} | {(item as Video).publishedAt.toLocaleDateString('id-ID')}</p>
                            {/* Tambahkan link ke video */}
                            <a href={`https://www.youtube.com/watch?v=${(item as Video).videoId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-coc-gold-dark hover:underline mt-1 block">Tonton di YouTube &rarr;</a>
                        </div>
                    ) : (
                        // Render Post seperti biasa
                        // Pastikan item di-cast sebagai Post sebelum diteruskan ke FullPostDisplay
                        <FullPostDisplay post={item as Post} />
                    )}
                </React.Fragment>
            ))}
          </div>
        )}

         {/* Tombol Load More Posts */}
         {/* PERBAIKAN: Ganti ke variabel baru */}
         {showLoadMoreItems && (
            <div className="text-center mt-8">
                <Button variant="secondary" size="lg" onClick={handleLoadMoreItems} disabled={isFiltering}>
                    Muat Lebih Banyak Konten
                </Button>
            </div>
         )}
      </section>
    </div>
  );
};

export default KnowledgeHubClient;
