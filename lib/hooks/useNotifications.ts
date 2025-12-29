// File: lib/hooks/useNotifications.ts
// Deskripsi: NOTIFIKASI 2.0 - Hybrid Fetching (REVISI INDEX-FREE).
// Menghapus orderBy di query Firestore untuk mencegah error "Missing Index".
// Sorting dilakukan secara manual di JavaScript.

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/app/context/AuthContext';
import { Notification } from '@/lib/clashub.types';
import { 
  collection, 
  query, 
  where, 
  // orderBy, // <-- DIHAPUS agar tidak butuh index komposit
  limit, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';

// Definisikan fetcher standar untuk SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Terjadi kesalahan: ${res.status} ${res.statusText}`
    );
  }
  return res.json();
};

/**
 * @hook useNotifications
 * Hook cerdas untuk mengelola notifikasi gabungan.
 */
export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [globalAnnouncements, setGlobalAnnouncements] = useState<Notification[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);

  // 1. Fetch Personal Notifications (via SWR)
  const swrKey = currentUser ? '/api/notifications' : null;
  const {
    data: personalData,
    error: personalError,
    isLoading: personalLoading,
  } = useSWR<Notification[]>(swrKey, fetcher, {
    refreshInterval: 60000,
    dedupingInterval: 60000,
  });

  const personalNotifications = useMemo(() => {
    return Array.isArray(personalData) ? personalData : [];
  }, [personalData]);

  // 2. Load Read Status dari LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      const stored = localStorage.getItem(`clashub_read_announcements_${currentUser.uid}`);
      if (stored) {
        try {
          setReadAnnouncementIds(JSON.parse(stored));
        } catch (e) {
          console.error("Gagal parse localStorage notifikasi:", e);
        }
      }
    }
  }, [currentUser]);

  // 3. Fetch Global Announcements (via Firestore Listener)
  useEffect(() => {
    // REVISI: Query sederhana tanpa orderBy untuk menghindari error Index
    const q = query(
      collection(db, 'announcements'),
      where('isActive', '==', true),
      limit(20) // Ambil cukup banyak, nanti kita sort dan slice di client
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcements: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: 'global',
          message: data.title,
          type: 'announcement',
          url: `/announcements/${doc.id}`,
          read: false,
          // Handle Timestamp conversion dengan aman
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
            ? data.createdAt.toDate() 
            : new Date(), 
          iconType: data.type || 'info',
          actionLabel: 'Baca Selengkapnya'
        } as Notification;
      });

      // REVISI: Sorting manual di Client Side (Terbaru di atas)
      announcements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Ambil 5 teratas setelah di-sort
      setGlobalAnnouncements(announcements.slice(0, 5));
    }, (error) => {
      console.error("Error fetching announcements:", error);
      // Cek apakah error permission
      if (error.code === 'permission-denied') {
        console.warn("Cek Security Rules Firestore: Pastikan 'announcements' bisa dibaca publik/auth users.");
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Smart Merging & Sorting
  const notifications = useMemo(() => {
    // A. Proses Pengumuman Global
    const processedAnnouncements = globalAnnouncements.map(ann => ({
      ...ann,
      read: readAnnouncementIds.includes(ann.id)
    }));

    // B. Gabungkan dengan Personal
    const normalizedPersonal = personalNotifications.map(n => ({
      ...n,
      createdAt: new Date(n.createdAt)
    }));

    const merged = [...processedAnnouncements, ...normalizedPersonal];

    // C. Sort Descending (Terbaru di atas)
    return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [globalAnnouncements, personalNotifications, readAnnouncementIds]);

  // 5. Hitung Unread Count
  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * @function markAsRead
   */
  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    const target = notifications.find(n => n.id === notificationId);
    if (!target || target.read) return;

    if (target.type === 'announcement') {
      // Logic Lokal
      const newReadIds = [...readAnnouncementIds, notificationId];
      setReadAnnouncementIds(newReadIds);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `clashub_read_announcements_${currentUser.uid}`, 
          JSON.stringify(newReadIds)
        );
      }
    } else {
      // Logic API Server
      const updatedPersonal = personalNotifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      mutate(swrKey, updatedPersonal, false);

      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        });
      } catch (error) {
        mutate(swrKey, personalNotifications, false);
      }
    }
  };

  /**
   * @function markAllAsRead
   */
  const markAllAsRead = async () => {
    if (!currentUser) return;

    // 1. Handle Announcements
    const unreadAnnouncementIds = notifications
      .filter(n => n.type === 'announcement' && !n.read)
      .map(n => n.id);
    
    if (unreadAnnouncementIds.length > 0) {
      const newReadIds = [...readAnnouncementIds, ...unreadAnnouncementIds];
      setReadAnnouncementIds(newReadIds);
      localStorage.setItem(
        `clashub_read_announcements_${currentUser.uid}`, 
        JSON.stringify(newReadIds)
      );
    }

    // 2. Handle Personal
    const updatedPersonal = personalNotifications.map(n => ({ ...n, read: true }));
    mutate(swrKey, updatedPersonal, false);
  };

  return {
    notifications,
    unreadCount,
    isLoading: personalLoading && globalAnnouncements.length === 0,
    isError: personalError,
    markAsRead,
    markAllAsRead
  };
};