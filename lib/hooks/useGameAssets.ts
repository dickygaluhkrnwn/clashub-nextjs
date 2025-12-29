// File: lib/hooks/useGameAssets.ts
// Deskripsi: Hook untuk mengambil dan mengelola URL gambar aset game.
// UPDATE: Menambahkan error handling log yang lebih jelas untuk Permission Denied.

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface GameAssetMap {
  [key: string]: string; 
}

const CACHE_KEY = 'clashub_game_assets_cache_v2'; 
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; 
const PLACEHOLDER_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const useGameAssets = () => {
  const [assets, setAssets] = useState<GameAssetMap>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper slugify yang konsisten dengan Admin
  const toSlug = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\./g, '') 
      .replace(/'/g, '')  
      .replace(/%/g, '')  
      .replace(/\s+/g, '-') 
      .trim();
  };

  useEffect(() => {
    const fetchAssets = async () => {
      let loadedFromCache = false;

      // 1. Cek Local Storage
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

      // 2. Fetch dari Firestore
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
          const key = `${data.type}_${data.slug}`; 
          newAssets[key] = data.imageUrl;
        });

        if (!isBackground) {
           console.log(`[Assets] Loaded ${Object.keys(newAssets).length} assets.`);
        }

        setAssets(newAssets);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ 
            data: newAssets, 
            timestamp: Date.now() 
          }));
        }
      } catch (error: any) {
        // [FIX] Log error spesifik untuk mendeteksi masalah Permission
        if (error.code === 'permission-denied') {
            console.error("[Assets] CRITICAL: Firestore Permission Denied! Cek Rules untuk 'gameAssets'.");
        } else {
            console.error("[Assets] Failed to fetch:", error);
        }
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const getAssetUrl = useCallback((name: string, type: string) => {
      const slug = toSlug(name);
      const key = `${type}_${slug}`;

      if (assets[key]) {
          return assets[key];
      }
      
      return PLACEHOLDER_URL; 
  }, [assets]);

  return { getAssetUrl, isLoading };
};