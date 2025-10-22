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

    // 1. Parse URL Search Params (Hanya untuk meneruskan nilai awal ke Client)
    const { category: activeCategory, sortBy: activeSortBy } = parseSearchParams(searchParams);

    // 2. Tentukan kriteria fetch untuk Firestore
    // PERUBAHAN: Selalu urutkan berdasarkan 'createdAt' (terbaru) dari Firestore.
    // Client akan menangani sorting 'trending' jika diperlukan.
    const firestoreSortBy: 'createdAt' = 'createdAt'; // Selalu 'createdAt'
    const firestoreSortOrder: 'desc' = 'desc'; // Selalu 'desc' (terbaru dulu)

    // 3. Ambil data Postingan dari sisi Server (SSR)
    try {
        // Mengambil postingan berdasarkan kategori (jika ada) dan selalu diurutkan berdasarkan createdAt
        initialPosts = await getPosts(activeCategory as PostCategory | 'all', firestoreSortBy, firestoreSortOrder);

    } catch (err) {
        console.error("Error fetching posts on server:", err);
        error = "Gagal memuat postingan. Periksa koneksi atau database.";
    }

     // Jika ada error fatal, tampilkan pesan error yang di-render oleh server
    if (error && initialPosts.length === 0) { // Hanya tampilkan jika tidak ada data sama sekali
        return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                    {/* Menggunakan font-clash untuk judul error */}
                    <h1 className="text-3xl text-coc-red font-clash mb-4">Kesalahan Server</h1>
                    <h2 className="text-xl text-gray-300">{error}</h2>
                    <p className="text-sm text-gray-500 mt-4">Data postingan tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                </div>
            </main>
        );
    }

    // 4. Meneruskan data ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <KnowledgeHubClient
                initialPosts={initialPosts}
                initialCategory={activeCategory} // Nilai kategori dari URL
                initialSortBy={activeSortBy} // Nilai sorting dari URL (untuk UI awal)
                // Berikan error ke client hanya jika ada error TAPI masih ada postingan (misal gagal fetch sebagian)
                error={initialPosts.length > 0 ? error : null}
            />
        </main>
    );
};

export default KnowledgeHubPage;
