// File: lib/hooks/useNotifications.ts
// Deskripsi: TAHAP 1.5 - Custom hook SWR untuk mengelola data notifikasi.

import { useContext } from 'react';
import useSWR, { mutate } from 'swr';
// [PERBAIKAN] Impor useAuth, bukan AuthContext
import { useAuth } from '@/app/context/AuthContext';
import { Notification } from '@/lib/clashub.types';

// Definisikan fetcher standar untuk SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * @hook useNotifications
 * Hook untuk mengambil dan mengelola notifikasi pengguna yang sedang login.
 */
export const useNotifications = () => {
  // [PERBAIKAN] Gunakan useAuth() dan ambil 'currentUser'
  const { currentUser } = useAuth();

  // Key SWR: /api/notifications
  // Hanya fetch jika user sudah login (currentUser !== null)
  const swrKey = currentUser ? '/api/notifications' : null;

  const {
    data: notifications,
    error,
    isLoading,
  } = useSWR<Notification[]>(swrKey, fetcher, {
    refreshInterval: 60000, // Refresh setiap 60 detik
    dedupingInterval: 60000,
  });

  // Hitung jumlah notifikasi yang belum dibaca
  const unreadCount =
    notifications?.filter((notif) => !notif.read).length || 0;

  /**
   * @function markAsRead
   * Menandai satu notifikasi sebagai 'read: true' via API PUT.
   * @param notificationId - ID dokumen notifikasi di Firestore.
   */
  const markAsRead = async (notificationId: string) => {
    // [PERBAIKAN] Cek 'currentUser'
    if (!currentUser || !notifications) return;

    // 1. Update Optimis (Optimistic Update)
    const optimisticData = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );

    mutate(swrKey, optimisticData, false);

    // 2. Kirim request API di background
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        // Jika API gagal, kembalikan data (rollback)
        console.error('Gagal menandai notifikasi sebagai terbaca, me-rollback...');
        mutate(swrKey, notifications, false); // Rollback
      }
      // Jika sukses, data lokal sudah benar (read: true)
    } catch (error) {
      console.error('Error di markAsRead:', error);
      // Rollback jika terjadi network error
      mutate(swrKey, notifications, false);
    }
  };

  return {
    notifications: notifications || [], // Kembalikan array kosong jika undefined
    unreadCount,
    isLoading,
    isError: error,
    markAsRead,
  };
};