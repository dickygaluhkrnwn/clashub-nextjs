// File: lib/hooks/useGameAssets.ts
// Deskripsi: Hook untuk mengambil dan mengelola URL gambar aset game (Troops, Heroes, dll)
// UPDATE: Mengaktifkan background fetch (Stale-While-Revalidate) agar data baru dari admin langsung muncul meskipun ada cache.

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface GameAssetMap {
  [key: string]: string; // Format Key: "type_slug", Value: "imageUrl"
}

const CACHE_KEY = 'clashub_game_assets_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // Cache berlaku 24 Jam

// Placeholder transparan 1x1 pixel (atau bisa URL icon tanda tanya publik)
// Ini mencegah 404 ke server lokal saat data belum siap
const PLACEHOLDER_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const useGameAssets = () => {
  const [assets, setAssets] = useState<GameAssetMap>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper untuk mengubah nama aset menjadi slug (format URL)
  const toSlug = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\./g, '') // Hapus titik (L.A.S.S.I -> lassi)
      .replace(/'/g, '')  // Hapus petik
      .replace(/%/g, '')  // Hapus persen
      .replace(/\s+/g, '-') // Spasi jadi dash
      .trim();
  };

  useEffect(() => {
    const fetchAssets = async () => {
      // 1. Cek Local Storage (Cache Client)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            // Jika cache masih valid (belum kadaluarsa), pakai cache dulu
            if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
              setAssets(data);
              setIsLoading(false);
              
              // [FIX] Aktifkan Fetch background untuk update cache diam-diam
              // Ini memastikan jika ada gambar baru (seperti Lightning Spell), cache akan diperbarui
              fetchFromFirestore(true); 
              return;
            }
          } catch (e) {
            console.warn("Gagal parse cache assets, mengambil ulang dari server...");
          }
        }
      }

      await fetchFromFirestore();
    };

    const fetchFromFirestore = async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, 'gameAssets'));
        const newAssets: GameAssetMap = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Simpan dengan key unik kombinasi Tipe & Slug
          const key = `${data.type}_${data.slug}`; 
          newAssets[key] = data.imageUrl;
        });

        setAssets(newAssets);
        
        // Simpan ke Cache
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ 
            data: newAssets, 
            timestamp: Date.now() 
          }));
        }
      } catch (error) {
        console.error("Failed to fetch game assets from Firestore:", error);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  /**
   * Fungsi utama untuk mendapatkan URL gambar
   * @param name Nama asli aset (misal: "Electro Dragon")
   * @param type Tipe aset ('troop' | 'hero' | 'spell' | 'pet' | 'equipment')
   */
  const getAssetUrl = useCallback((name: string, type: string) => {
      const slug = toSlug(name);
      const key = `${type}_${slug}`;

      // 1. Prioritas: Cek data dari Admin (Firestore)
      if (assets[key]) {
          return assets[key];
      }

      // 2. Fallback: KOSONGKAN atau Placeholder Aman
      // JANGAN gunakan path lokal (/images/coc/...) karena file sudah dihapus
      // Return placeholder agar img tag tidak error 404, atau string kosong
      // Komponen UI (PlayerTroopsCard dll) sudah punya handler onError
      // yang akan menyembunyikan gambar jika URL invalid/gagal load.
      
      return PLACEHOLDER_URL; 
  }, [assets]);

  return { getAssetUrl, isLoading };
};