import { Metadata } from 'next';
import { getPosts } from '@/lib/firestore';
import { Post, PostCategory } from '@/lib/types';
import KnowledgeHubClient from './KnowledgeHubClient';
// Import utilitas baru untuk parsing URL
import { parseSearchParams, SortOption } from '@/lib/knowledge-hub-utils';

// Metadata
export const metadata: Metadata = {
    title: "Clashub | Knowledge Hub",
    description: "Tempat berbagi strategi serangan, base building, dan tips manajemen tim Clash of Clans. Filter berdasarkan kategori dan trending.",
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
    let initialPosts: Post[] = [];
    let error: string | null = null;
    
    // 1. Parse URL Search Params
    const { category: activeCategory, sortBy: activeSortBy } = parseSearchParams(searchParams);
    
    // 2. Tentukan kriteria fetch untuk Firestore
    // Note: Firestore hanya bisa sort berdasarkan satu field. Kita akan sort by createdAt
    // di Firestore, dan biarkan sorting 'trending' (likes+replies) dilakukan di Client/Utils.
    const firestoreSortBy: 'createdAt' | 'likes' = activeSortBy === 'trending' ? 'likes' : 'createdAt';
    const firestoreSortOrder: 'desc' | 'asc' = 'desc';

    // 3. Ambil data Postingan dari sisi Server (SSR)
    try {
        // PENTING: Kita fetch semua postingan yang cocok dengan kategori di server.
        // Sorting "trending" akan dilakukan di ClientComponent untuk menghindari
        // index query yang kompleks di Firestore.
        initialPosts = await getPosts(activeCategory as PostCategory | 'all', firestoreSortBy, firestoreSortOrder);

        // Jika fetching berdasarkan likes/trending, kita perlu melakukan sorting ulang 
        // di server-utils (sebelum diteruskan ke klien) jika logika sorting kompleks.
        // Untuk saat ini, kita mengandalkan `getPosts` di `firestore.ts` dan client sorting.

    } catch (err) {
        console.error("Error fetching posts on server:", err);
        error = "Gagal memuat postingan. Periksa koneksi atau database.";
    }

    // 4. Meneruskan data ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <KnowledgeHubClient 
                initialPosts={initialPosts} 
                initialCategory={activeCategory} // Nilai kategori dari URL
                initialSortBy={activeSortBy} // Nilai sorting dari URL
                error={error}
            />
        </main>
    );
};

export default KnowledgeHubPage;
