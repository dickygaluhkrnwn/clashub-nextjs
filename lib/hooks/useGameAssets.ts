// File: lib/hooks/useGameAssets.ts
// Deskripsi: Hook FINAL untuk manajemen aset dinamis.
// Mendukung lookup gambar (getAssetUrl) dan pengecekan tipe (getAssetType)
// menggunakan data dari Admin Firestore (Stale-While-Revalidate).

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

// Struktur data dalam memori
interface AssetData {
  imageUrl: string;
  type: string; // 'troop', 'hero', 'spell', 'pet', 'equipment', 'town-hall'
}

interface GameAssetMap {
  [slug: string]: AssetData;
}

const CACHE_KEY = 'clashub_game_assets_v4'; // Bump version
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Jam
const PLACEHOLDER_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const useGameAssets = () => {
  const [assets, setAssets] = useState<GameAssetMap>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper Slugify (Konsisten dengan Admin)
  const toSlug = useCallback((name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\./g, '') 
      .replace(/'/g, '')  
      .replace(/%/g, '')  
      .replace(/\s+/g, '-') 
      .trim();
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      let loadedFromCache = false;

      // 1. Cek Local Storage (Cache)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY_MS && Object.keys(data).length > 0) {
              setAssets(data);
              setIsLoading(false);
              loadedFromCache = true;
            }
          } catch (e) {
            console.warn("[Assets] Cache corrupted.");
          }
        }
      }

      // 2. Fetch Firestore (Background jika cache ada, Foreground jika tidak)
      if (loadedFromCache) {
        fetchFromFirestore(true); 
      } else {
        await fetchFromFirestore(false);
      }
    };

    const fetchFromFirestore = async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, 'gameAssets'));
        const newAssets: GameAssetMap = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Gunakan SLUG sebagai key utama agar pencarian cepat
          // Contoh: "barbarian-king" -> { imageUrl: "...", type: "hero" }
          if (data.slug && data.imageUrl) {
             newAssets[data.slug] = {
                 imageUrl: data.imageUrl,
                 type: data.type || 'unknown'
             };
          }
        });

        setAssets(newAssets);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ 
            data: newAssets, 
            timestamp: Date.now() 
          }));
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
             console.error("[Assets] Permission Denied! Cek Firestore Rules.");
        } else {
             console.error("[Assets] Fetch Error:", error);
        }
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  /**
   * Mendapatkan URL gambar.
   * Parameter 'type' bersifat opsional untuk kompatibilitas, tapi logika utama mengandalkan SLUG.
   */
  const getAssetUrl = useCallback((name: string, _type?: string) => {
      const slug = toSlug(name);
      if (assets[slug]) {
          return assets[slug].imageUrl;
      }
      return PLACEHOLDER_URL; 
  }, [assets, toSlug]);

  /**
   * Mendapatkan Tipe Aset ('pet', 'troop', dll).
   * Penting untuk filter dinamis.
   */
  const getAssetType = useCallback((name: string): string | undefined => {
      const slug = toSlug(name);
      return assets[slug]?.type;
  }, [assets, toSlug]);

  return { getAssetUrl, getAssetType, isLoading };
};