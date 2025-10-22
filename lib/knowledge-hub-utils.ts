import { Post, PostCategory } from "./types"; // Import PostCategory

/**
 * Kategori yang digunakan untuk navigasi di Knowledge Hub.
 */
export const POST_CATEGORIES: PostCategory[] = [ // Gunakan PostCategory[]
    'Semua Diskusi',
    'Strategi Serangan',
    'Base Building',
    'Manajemen Tim',
    'Berita Komunitas',
    'Diskusi Umum',
];

export type SortOption = 'terbaru' | 'trending';

/**
 * Mengurutkan array Postingan di sisi server/klien (terutama untuk "trending").
 * @param posts - Array postingan.
 * @param sortBy - Kriteria pengurutan ('terbaru' atau 'trending').
 * @returns Array Postingan yang sudah diurutkan.
 */
export function sortPosts(posts: Post[], sortBy: SortOption): Post[] {
    // Membuat salinan array untuk menghindari mutasi state React/data fetch
    const sortedPosts = [...posts];

    if (sortBy === 'terbaru') {
        // Urutkan berdasarkan tanggal pembuatan terbaru
        sortedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === 'trending') {
        // Urutkan berdasarkan skor trending (likes + replies)
        sortedPosts.sort((a, b) => {
            const scoreA = (a.likes || 0) + (a.replies || 0);
            const scoreB = (b.likes || 0) + (b.replies || 0);
            return scoreB - scoreA; // Descending (Paling trending di atas)
        });
    }

    return sortedPosts;
}

/**
 * Mengubah objek URLSearchParams menjadi objek filter yang mudah digunakan.
 * @param searchParams - Objek URLSearchParams dari Next.js.
 */
export function parseSearchParams(searchParams: { [key: string]: string | string[] | undefined }): {
    category: PostCategory | 'all';
    sortBy: SortOption;
} {
    const categoryQuery = (searchParams.kategori as PostCategory) || 'Semua Diskusi';
    const sortQuery = (searchParams.sortir as SortOption) || 'terbaru';
    
    // Memastikan nilai kategori valid, jika tidak, default ke 'Semua Diskusi'
    const category = POST_CATEGORIES.includes(categoryQuery) ? categoryQuery : 'Semua Diskusi';
    
    // Memastikan nilai sort valid
    const sortBy = (sortQuery === 'trending' || sortQuery === 'terbaru') ? sortQuery : 'terbaru';

    return { category, sortBy };
}
