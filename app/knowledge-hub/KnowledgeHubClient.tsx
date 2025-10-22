'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // <-- PERBAIKAN: Import Link dari next/link
import { Button } from '@/app/components/ui/Button';
import { PostCard } from '@/app/components/cards';
import { Post } from '@/lib/types';
import { BookOpenIcon, EditIcon, StarIcon, SortAscIcon, FilterIcon } from '@/app/components/icons';
// Impor utilitas baru
import { POST_CATEGORIES, sortPosts, SortOption } from '@/lib/knowledge-hub-utils';

interface KnowledgeHubClientProps {
  initialPosts: Post[];
  initialCategory: string;
  initialSortBy: SortOption;
  error: string | null;
}

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State lokal untuk filter
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  const [displayedPosts] = useState<Post[]>(initialPosts);

  // Fungsi untuk memperbarui URL (dan memicu fetch/render ulang Server Component)
  const updateUrl = (newCategory: string, newSortBy: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Hanya tambahkan parameter jika nilainya bukan default
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

    router.push(`/knowledge-hub?${params.toString()}`);
  };

  // Logika Filter & Sort di sisi klien (menggunakan useMemo untuk performa)
  const filteredAndSortedPosts = useMemo(() => {
    // 1. Filter (hanya diperlukan untuk 'Semua Diskusi' yang diabaikan di server fetch)
    const filtered = displayedPosts.filter(post => 
      activeCategory === 'Semua Diskusi' || post.category === activeCategory
    );
    
    // 2. Sort (menggunakan utilitas yang sudah dibuat)
    return sortPosts(filtered, activeSort);

  }, [displayedPosts, activeCategory, activeSort]);
  
  
  // --- Handler Aksi ---
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Kita panggil updateUrl untuk mencerminkan perubahan di URL
    updateUrl(category, activeSort);
  };
  
  const handleSortChange = (sortBy: SortOption) => {
    setActiveSort(sortBy);
    // Kita panggil updateUrl untuk mencerminkan perubahan di URL
    updateUrl(activeCategory, sortBy);
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Kolom Kiri: Navigasi Topik (Filter) */}
      <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28">
        <h2 className="text-xl border-l-4 border-coc-gold-dark pl-3 mb-6 flex items-center gap-2">
            <FilterIcon className="h-5 w-5"/> Kategori Forum
        </h2>

        {/* Filter Kategori */}
        <div className="space-y-1 border-b border-coc-gold-dark/20 pb-4">
          {POST_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
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
          <h3 className="text-sm font-supercell text-coc-gold-dark mb-3 flex items-center gap-1">
            <SortAscIcon className="h-4 w-4"/> Urutkan
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
              Terbaru
            </button>
            <button
              onClick={() => handleSortChange('trending')}
              className={`w-full text-left px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                activeSort === 'trending'
                  ? 'bg-coc-red text-white'
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl">Knowledge Hub</h1>
          <Button href="/knowledge-hub/create" variant="primary">
            <EditIcon className="h-5 w-5 mr-2"/>
            Buat Postingan
          </Button>
        </div>

        {error ? (
            <div className="text-center py-20 card-stone p-6">
                <h2 className="text-2xl text-coc-red">{error}</h2>
                <p className="text-gray-400 mt-2">Gagal memuat data dari server.</p>
            </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className="text-center py-20 card-stone p-6">
            <h2 className="text-2xl text-gray-400">Tidak ada postingan di kategori ini.</h2>
            <p className="text-gray-500 mt-2">Coba ubah kriteria filter Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPosts.map(post => (
              <PostCard 
                key={post.id} 
                href={`/knowledge-hub/${post.id}`}
                category={post.category as string}
                tag={post.tags.join(', ')}
                title={post.title}
                author={post.authorName}
                // Simulasikan stats dari likes dan replies
                stats={`${post.replies} Balasan | ${post.likes} Likes`} 
              />
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
            <Button variant="secondary" size="lg">Muat Lebih Banyak Diskusi</Button>
        </div>
      </section>

      {/* Kolom Kanan: Trending Sidebar (Simulasi) */}
      <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
        <h2 className="text-xl border-l-4 border-coc-red pl-3 flex items-center gap-2">
            <StarIcon className="h-5 w-5"/> Trending Sekarang
        </h2>
        <div className="space-y-4 text-sm">
            {/* Hanya tampilkan 5 teratas dari hasil yang sudah diurutkan 'trending' */}
            {sortPosts(displayedPosts, 'trending').slice(0, 5).map((post, index) => (
                <Link key={index} href={`/knowledge-hub/${post.id}`} className="block p-2 rounded-md hover:bg-coc-stone/50 transition-colors border-b border-coc-gold-dark/10">
                    <p className="font-bold text-white">{post.title}</p>
                    <span className="text-xs text-gray-400">
                        {post.likes + post.replies} Total Interaksi
                    </span>
                </Link>
            ))}
        </div>
        
        <div className="pt-4 border-t border-coc-gold-dark/20">
            <h3 className="text-lg font-supercell text-coc-green mb-2">Verified Strategist</h3>
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
