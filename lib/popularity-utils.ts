// File: lib/popularity-utils.ts
// Deskripsi: Logika terpusat untuk Poin Popularitas (Banana Points)

/**
 * Tipe untuk tingkatan (tier) badge
 */
export interface PopularityTier {
  name: string;
  minPoints: number;
  colorClass: string; // Warna Tailwind
}

/**
 * Sistem Tier (Sesuai proposal kita)
 * Diekspor agar bisa diakses di mana saja.
 */
export const TIERS: PopularityTier[] = [
  {
    name: 'Clasher Baru',
    minPoints: 0,
    colorClass: 'text-gray-400',
  },
  {
    name: 'Banana Perunggu',
    minPoints: 50,
    colorClass: 'text-yellow-600', // Warna Perunggu
  },
  {
    name: 'Banana Perak',
    minPoints: 150,
    colorClass: 'text-gray-300', // Warna Perak
  },
  {
    name: 'Banana Emas',
    minPoints: 300,
    colorClass: 'text-coc-gold', // Warna Emas Clashub
  },
  {
    name: 'Banana Berlian',
    minPoints: 500,
    colorClass: 'text-blue-300', // Warna Berlian
  },
];

/**
 * Helper function untuk mendapatkan tier berdasarkan poin
 */
export const getTierForPoints = (points: number): PopularityTier => {
  // Urutkan dari poin tertinggi ke terendah, lalu cari yang pertama cocok
  return [...TIERS]
    .reverse()
    .find((tier) => points >= tier.minPoints) as PopularityTier;
};