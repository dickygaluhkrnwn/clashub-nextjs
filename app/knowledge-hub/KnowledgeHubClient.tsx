'use client';

// Impor React (diperlukan untuk useState)
import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { PostCard } from '@/app/components/cards';
import { Post } from '@/lib/types';
// Impor ikon untuk loading (opsional)
import { BookOpenIcon, EditIcon, StarIcon, SortAscIcon, FilterIcon, CogsIcon } from '@/app/components/icons';
import { POST_CATEGORIES, sortPosts, SortOption } from '@/lib/knowledge-hub-utils';

interface KnowledgeHubClientProps {
  initialPosts: Post[];
  initialCategory: string;
  initialSortBy: SortOption;
  error: string | null;
}

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD_POSTS = 5; // Tampilkan 5 postingan per load

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State untuk loading filter
  const [isFiltering, setIsFiltering] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  // displayedPosts sekarang menyimpan *semua* postingan awal
  const [allPosts] = useState<Post[]>(initialPosts);

  // --- State Pagination ---
  const [visiblePostsCount, setVisiblePostsCount] = useState(ITEMS_PER_LOAD_POSTS);
  // --- End State Pagination ---

  const updateUrl = (newCategory: string, newSortBy: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory && newCategory !== 'Semua Diskusi') {
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

  // Logika filter dan sort (tidak berubah)
  const filteredAndSortedPosts = useMemo(() => {
    // Filter berdasarkan kategori AKTIF
    const filtered = allPosts.filter(post =>
      activeCategory === 'Semua Diskusi' || post.category === activeCategory
    );
    // Urutkan hasil filter berdasarkan sort AKTIF
    return sortPosts(filtered, activeSort);
  }, [allPosts, activeCategory, activeSort]); // Dependencies: allPosts, activeCategory, activeSort


  // Handler filter diperbarui untuk mereset pagination
  const handleCategoryChange = (category: string) => {
    setIsFiltering(true);
    setVisiblePostsCount(ITEMS_PER_LOAD_POSTS); // Reset pagination
    setTimeout(() => {
        setActiveCategory(category);
        updateUrl(category, activeSort);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
  };

  const handleSortChange = (sortBy: SortOption) => {
    setIsFiltering(true);
    setVisiblePostsCount(ITEMS_PER_LOAD_POSTS); // Reset pagination
    setTimeout(() => {
        setActiveSort(sortBy);
        updateUrl(activeCategory, sortBy);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
  };

  // --- Fungsi Load More Posts ---
  const handleLoadMorePosts = () => {
        setVisiblePostsCount(prevCount => prevCount + ITEMS_PER_LOAD_POSTS);
  };
  // --- End Fungsi Load More ---

  // --- Logika Slice & Show Button Posts ---
  const postsToShow = useMemo(() => filteredAndSortedPosts.slice(0, visiblePostsCount), [filteredAndSortedPosts, visiblePostsCount]);
  const showLoadMorePosts = visiblePostsCount < filteredAndSortedPosts.length;
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
          {POST_CATEGORIES.map(category => (
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
              {category}
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
      <section className="lg:col-span-2">
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
        ) : postsToShow.length === 0 ? ( // Cek postsToShow
          <div className="text-center py-20 card-stone p-6 rounded-lg">
             {/* Menggunakan font-clash untuk judul */}
            <h2 className="text-2xl font-clash text-gray-400">Tidak ada postingan di kategori ini.</h2>
            <p className="text-gray-500 mt-2">Coba ubah kriteria filter Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {/* Render postsToShow */}
            {postsToShow.map(post => (
              <PostCard
                key={post.id}
                href={`/knowledge-hub/${post.id}`}
                category={post.category as string}
                tag={post.tags.join(', ')}
                title={post.title}
                author={post.authorName}
                stats={`${post.replies} Balasan | ${post.likes} Likes`}
              />
            ))}
          </div>
        )}

         {/* Tombol Load More Posts */}
         {showLoadMorePosts && (
            <div className="text-center mt-8">
                <Button variant="secondary" size="lg" onClick={handleLoadMorePosts} disabled={isFiltering}>
                    Muat Lebih Banyak Diskusi
                </Button>
            </div>
         )}
      </section>

      {/* Kolom Kanan: Trending Sidebar (Menggunakan allPosts untuk simulasi) */}
      <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
         {/* Judul akan otomatis font-clash */}
        <h2 className="text-xl border-l-4 border-coc-red pl-3 flex items-center gap-2">
            <StarIcon className="h-5 w-5"/> Trending Sekarang
        </h2>
        <div className="space-y-4 text-sm">
            {/* Menggunakan allPosts untuk menampilkan top 5 trending keseluruhan */}
            {sortPosts(allPosts, 'trending').slice(0, 5).map((post, index) => (
                <Link key={index} href={`/knowledge-hub/${post.id}`} className="block p-2 rounded-md hover:bg-coc-stone/50 transition-colors border-b border-coc-gold-dark/10">
                    <p className="font-bold text-white truncate">{post.title}</p>
                    <span className="text-xs text-gray-400">
                        {post.likes + post.replies} Total Interaksi
                    </span>
                </Link>
            ))}
        </div>

        <div className="pt-4 border-t border-coc-gold-dark/20">
             {/* Judul akan otomatis font-clash */}
            <h3 className="text-lg font-clash text-coc-green mb-2">Verified Strategist</h3>
            <p className="text-sm text-gray-400">Temukan tips terpercaya dari kontributor terbaik komunitas.</p>
            <Button href="/strategists" variant="secondary" className="w-full mt-4">
                Lihat Daftar Strategist
            </Button>
        </div>
      </aside>
    </div>
  );
};

export default KnowledgeHubClient;
