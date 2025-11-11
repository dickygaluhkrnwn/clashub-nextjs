import { Post, Video, KnowledgeHubItem, PostCategory } from './types'; // Impor tipe gabungan

/**
 * Kategori yang MURNI postingan manual (tidak termasuk video).
 */
export const POST_CATEGORIES: PostCategory[] = [
  'Strategi Serangan',
  'Base Building',
  'Manajemen Tim',
  'Diskusi Umum',
  // 'Berita Komunitas' (dihapus sementara dari sini karena akan digabung dengan video)
];

/**
 * Tipe untuk kategori filter di UI, termasuk 'Semua Konten'.
 */
// PERBAIKAN: Pastikan 'Semua Diskusi' ada di tipe utama
export type KnowledgeHubCategory =
  | PostCategory
  | 'Semua Konten'
  | 'Semua Diskusi';

/**
 * Daftar kategori yang ditampilkan di filter UI.
 */
export const ALL_CATEGORIES: KnowledgeHubCategory[] = [
  'Semua Konten', // Opsi baru untuk menampilkan Post + Video
  'Semua Diskusi', // Hanya Post
  'Strategi Serangan',
  'Base Building',
  'Manajemen Tim',
  'Berita Komunitas', // Akan mengambil Post 'Berita Komunitas' + Video
  'Diskusi Umum',
];

export type SortOption = 'terbaru' | 'trending';

/**
 * Helper type guard untuk membedakan Post dan Video.
 * PERBAIKAN: Menggunakan operator 'in' untuk memeriksa keberadaan properti unik 'videoId'
 * yang hanya ada di tipe Video, sehingga aman dari TypeError.
 */
export function isVideo(item: KnowledgeHubItem): item is Video {
  // Kita juga perlu memastikan item tidak null/undefined sebelum pengecekan
  if (!item) return false;

  // Video memiliki properti unik 'videoId' (dan 'source').
  // Kita cek 'videoId' untuk penentuan tipe yang aman.
  return 'videoId' in item;
}

/**
 * Mengurutkan array gabungan (Post atau Video) di sisi klien.
 * @param items - Array item (Post | Video).
 * @param sortBy - Kriteria pengurutan ('terbaru' atau 'trending').
 * @returns Array item yang sudah diurutkan.
 */
// PERBAIKAN: Ganti nama fungsi ke sortItems
export function sortItems(
  items: KnowledgeHubItem[],
  sortBy: SortOption
): KnowledgeHubItem[] {
  const sortedItems = [...items];

  const getItemDate = (item: KnowledgeHubItem): Date => {
    // Video menggunakan publishedAt, Post menggunakan createdAt
    // PERBAIKAN: Pastikan createdAt/publishedAt adalah Date
    const dateValue = isVideo(item)
      ? item.publishedAt
      : (item as Post).createdAt; // Casting di sini aman karena sudah di-narrow
    return dateValue instanceof Date ? dateValue : new Date(dateValue);
  };

  if (sortBy === 'terbaru') {
    // Urutkan berdasarkan tanggal (publishedAt atau createdAt)
    sortedItems.sort(
      (a, b) => getItemDate(b).getTime() - getItemDate(a).getTime()
    );
  } else if (sortBy === 'trending') {
    // Urutkan berdasarkan skor (likes/replies), fallback ke tanggal
    sortedItems.sort((a, b) => {
      // Video (saat ini) tidak memiliki likes/replies, beri skor 0
      // PERBAIKAN: Gunakan type guard 'isVideo'
      // --- [PERBAIKAN ERROR TS2365] ---
      // Mengubah (a as Post).likes menjadi (a as Post).likes.length
      const scoreA = isVideo(a)
        ? 0
        : (a as Post).likes.length + ((a as Post).replies || 0); // Casting di sini aman
      const scoreB = isVideo(b)
        ? 0
        : (b as Post).likes.length + ((b as Post).replies || 0); // Casting di sini aman
      // --- [AKHIR PERBAIKAN] ---

      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Skor tertinggi di atas
      }
      // Jika skor sama (misal, 0 vs 0), urutkan berdasarkan tanggal terbaru
      return getItemDate(b).getTime() - getItemDate(a).getTime();
    });
  }

  return sortedItems;
}

/**
 * Mengubah objek URLSearchParams menjadi objek filter yang mudah digunakan.
 * @param searchParams - Objek URLSearchParams dari Next.js.
 */
export function parseSearchParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): {
  // Menggunakan tipe KnowledgeHubCategory baru
  category: KnowledgeHubCategory;
  sortBy: SortOption;
  // Nilai internal untuk query Firestore
  // ----- PERBAIKAN DI SINI -----
  queryCategory: PostCategory | 'all' | 'all-posts'; // <-- Tambahkan 'all-posts'
  // -----------------------------
} {
  const categoryQuery =
    (searchParams.kategori as KnowledgeHubCategory) || 'Semua Konten';
  const sortQuery = (searchParams.sortir as SortOption) || 'terbaru';

  // Validasi terhadap ALL_CATEGORIES (memperbaiki error TS2367)
  const category = ALL_CATEGORIES.includes(categoryQuery)
    ? categoryQuery
    : 'Semua Konten';

  const sortBy =
    sortQuery === 'trending' || sortQuery === 'terbaru' ? sortQuery : 'terbaru';

  // Tentukan nilai query internal berdasarkan pilihan UI
  let queryCategory: PostCategory | 'all' | 'all-posts'; // <-- Tipe variabel juga diperbarui
  if (category === 'Semua Konten') {
    queryCategory = 'all'; // Ambil Post + Video
  } else if (category === 'Semua Diskusi') {
    queryCategory = 'all-posts'; // Hanya ambil Post (logika ini akan ditangani di lib/firestore.ts)
  } else {
    queryCategory = category; // Ambil kategori spesifik (misal: 'Berita Komunitas')
  }

  return { category, sortBy, queryCategory };
}

/**
 * Mengubah nilai kategori internal (dari URL/state) menjadi teks yang ditampilkan.
 */
export function getCategoryDisplayName(
  category: KnowledgeHubCategory | 'all-posts'
): string {
  if (category === 'all-posts') {
    return 'Semua Diskusi';
  }
  // PERBAIKAN: Handle 'Semua Konten' secara eksplisit
  if (category === 'Semua Konten') {
    return 'Semua Konten';
  }
  return category; // 'Berita Komunitas', dll.
}