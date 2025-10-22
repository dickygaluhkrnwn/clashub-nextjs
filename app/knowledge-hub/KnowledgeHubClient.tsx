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

const KnowledgeHubClient = ({ initialPosts, initialCategory, initialSortBy, error }: KnowledgeHubClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // BARU: State untuk loading filter
  const [isFiltering, setIsFiltering] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSortBy);
  const [displayedPosts] = useState<Post[]>(initialPosts);

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

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = displayedPosts.filter(post =>
      activeCategory === 'Semua Diskusi' || post.category === activeCategory
    );
    return sortPosts(filtered, activeSort);
  }, [displayedPosts, activeCategory, activeSort]);


  // BARU: Handler yang diperbarui untuk kategori
  const handleCategoryChange = (category: string) => {
    setIsFiltering(true);
    setTimeout(() => {
        setActiveCategory(category);
        updateUrl(category, activeSort);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
  };

  // BARU: Handler yang diperbarui untuk sortir
  const handleSortChange = (sortBy: SortOption) => {
    setIsFiltering(true);
    setTimeout(() => {
        setActiveSort(sortBy);
        updateUrl(activeCategory, sortBy);
        setIsFiltering(false);
    }, 50); // Delay singkat untuk UX
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

        {/* BARU: Tampilkan loading state saat memfilter */}
        {isFiltering ? (
            <div className="text-center py-20">
               <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
               <h2 className="text-xl text-coc-gold">Memfilter...</h2>
           </div>
        ) : error ? (
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
                stats={`${post.replies} Balasan | ${post.likes} Likes`}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
             {/* Tombol Muat Lebih Banyak tetap disabled sementara */}
            <Button variant="secondary" size="lg" disabled={true}>Muat Lebih Banyak Diskusi</Button>
        </div>
      </section>

      {/* Kolom Kanan: Trending Sidebar (Simulasi) */}
      <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
        <h2 className="text-xl border-l-4 border-coc-red pl-3 flex items-center gap-2">
            <StarIcon className="h-5 w-5"/> Trending Sekarang
        </h2>
        <div className="space-y-4 text-sm">
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

