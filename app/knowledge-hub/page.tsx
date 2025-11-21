import { Metadata } from 'next';
import { getPosts } from '@/lib/firestore';
import { KnowledgeHubItem } from '@/lib/types';
import KnowledgeHubClient from './KnowledgeHubClient';
import { parseSearchParams, KnowledgeHubCategory } from '@/lib/knowledge-hub-utils';

// Metadata (Default English for SEO)
export const metadata: Metadata = {
  title: "Clashub | Knowledge Hub",
  description: "Share and discover the best Clash of Clans strategies, base designs, and team management tips. Filter by category and trending.",
};

// Tipe untuk props yang diterima dari Next.js (URL search params)
interface KnowledgeHubPageProps {
  searchParams: {
    kategori?: string | string[]; // Kategori untuk filter
    sortir?: string | string[]; // Kriteria sorting (terbaru/trending)
  };
}

/**
 * @component KnowledgeHubPage (Server Component)
 * Mengambil data postingan berdasarkan URL Search Params.
 */
const KnowledgeHubPage = async ({ searchParams }: KnowledgeHubPageProps) => {
  let initialPosts: KnowledgeHubItem[] = [];
  let error: string | null = null;

  // 1. Parse URL Search Params
  const { category: activeCategory, sortBy: activeSortBy, queryCategory } = parseSearchParams(searchParams);

  // 2. Tentukan kriteria fetch untuk Firestore
  // Gunakan 'likes' jika itu yang diminta, jika tidak, 'createdAt'
  const firestoreSortBy: 'createdAt' | 'publishedAt' | 'likes' = activeSortBy === 'trending' ? 'likes' : 'createdAt';
  const firestoreSortOrder: 'desc' | 'asc' = 'desc'; // Selalu 'desc' (terbaru/trending dulu)

  // 3. Ambil data gabungan dari sisi Server (SSR)
  try {
    initialPosts = await getPosts(queryCategory, firestoreSortBy, firestoreSortOrder);
  } catch (err) {
    console.error("Error fetching posts on server:", err);
    // Pesan error default (akan ditangani lebih lanjut oleh Client jika perlu terjemahan UI khusus)
    error = "Failed to load posts. Please check your connection or database.";
  }

  // 4. Meneruskan data ke Client Component
  // CATATAN: Kita menghapus blok "if (error)" server-side rendering di sini.
  // Kita serahkan penanganan tampilan error sepenuhnya ke KnowledgeHubClient
  // agar bisa menggunakan fitur multibahasa (useLanguage).
  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      <KnowledgeHubClient
        initialPosts={initialPosts}
        initialCategory={activeCategory as KnowledgeHubCategory}
        initialSortBy={activeSortBy}
        error={error} // Teruskan error apa adanya ke client
      />
    </main>
  );
};

export default KnowledgeHubPage;