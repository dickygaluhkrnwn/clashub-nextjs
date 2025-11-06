// File: app/knowledge-hub/components/form/form.utils.ts
// Deskripsi: Berisi utilitas, konstanta, dan helper untuk PostForm refactor.

import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { PostCategory } from '@/lib/types'; // Menggunakan barrel file (lib/types.ts) sesuai struktur

/**
 * Opsi kategori yang tersedia di form (difilter agar tidak termasuk 'Semua Diskusi')
 * (Dipindahkan dari PostForm.tsx)
 */
export const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(
  (c) => c !== 'Semua Diskusi'
) as PostCategory[];

/**
 * Helper untuk styling input form yang konsisten
 * (Dipindahkan dari PostForm.tsx)
 * @param hasError Apakah field dalam status error
 * @returns string kelas Tailwind CSS
 */
export const inputClasses = (hasError: boolean) =>
  `w-full bg-coc-stone/50 border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
   font-sans disabled:opacity-50 disabled:cursor-not-allowed
   hover:border-coc-gold/70
   focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
   ${
     hasError
       ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Error state
       : 'border-coc-gold-dark/50' // Default state
   }`;