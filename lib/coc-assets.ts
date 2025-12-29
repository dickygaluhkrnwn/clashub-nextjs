// File: lib/coc-assets.ts
// Deskripsi: Utility untuk mapping nama aset CoC (Troops, Heroes, Spells, Pets) ke path gambar lokal.
// Digunakan karena API resmi tidak menyediakan URL gambar untuk item-item ini.

const ASSET_BASE_PATH = '/images/coc';

/**
 * Mengubah nama aset menjadi format slug (huruf kecil, spasi jadi dash).
 * Contoh: 
 * "Barbarian King" -> "barbarian-king"
 * "L.A.S.S.I" -> "lassi"
 * "Builder's Hut" -> "builders-hut"
 */
const toSlug = (name: string): string => {
  if (!name) return 'unknown';
  return name
    .toLowerCase()
    .replace(/\./g, '') // Hapus titik (L.A.S.S.I -> lassi)
    .replace(/'/g, '')  // Hapus petik (Builder's -> builders)
    .replace(/\s+/g, '-') // Spasi jadi dash
    .trim();
};

/**
 * Mendapatkan URL gambar Pasukan (Troops & Super Troops)
 */
export const getTroopImage = (name: string): string => {
  // Bisa ditambahkan mapping manual jika ada nama file yang tidak standar
  return `${ASSET_BASE_PATH}/troops/${toSlug(name)}.png`;
};

/**
 * Mendapatkan URL gambar Pahlawan (Heroes & Builder Base Machines)
 */
export const getHeroImage = (name: string): string => {
  return `${ASSET_BASE_PATH}/heroes/${toSlug(name)}.png`;
};

/**
 * Mendapatkan URL gambar Mantra (Spells)
 */
export const getSpellImage = (name: string): string => {
  return `${ASSET_BASE_PATH}/spells/${toSlug(name)}.png`;
};

/**
 * Mendapatkan URL gambar Peralatan Hero (Hero Equipment)
 */
export const getEquipmentImage = (name: string): string => {
  return `${ASSET_BASE_PATH}/equipment/${toSlug(name)}.png`;
};

/**
 * Mendapatkan URL gambar Hewan Peliharaan (Pets)
 */
export const getPetImage = (name: string): string => {
  return `${ASSET_BASE_PATH}/pets/${toSlug(name)}.png`;
};

/**
 * Mendapatkan URL gambar Liga (Fallback jika API null)
 */
export const getLeagueImage = (leagueName: string): string => {
  return `${ASSET_BASE_PATH}/leagues/${toSlug(leagueName)}.png`;
};

// URL Placeholder standar jika gambar gagal dimuat
export const PLACEHOLDER_ASSET = '/images/placeholder-coc.png';