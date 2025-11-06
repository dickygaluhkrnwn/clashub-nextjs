// File: lib/hooks/useNotifications.ts
// Deskripsi: TAHAP 1.5 - Custom hook SWR untuk mengelola data notifikasi.

import { useContext } from 'react';
import useSWR, { mutate } from 'swr';
// [PERBAIKAN] Impor useAuth, bukan AuthContext
import { useAuth } from '@/app/context/AuthContext';
import { Notification } from '@/lib/clashub.types';

// Definisikan fetcher standar untuk SWR
// [PERBAIKAN] Update fetcher untuk menangani error HTTP
const fetcher = async (url: string) => {
  const res = await fetch(url);

  // Jika respons tidak ok (misal: 401, 404, 500), lempar error
  // Ini akan ditangkap oleh SWR dan dimasukkan ke 'error'
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Tangkap jika json() gagal
    throw new Error(
      errorData.error || `Terjadi kesalahan: ${res.status} ${res.statusText}`
    );
  }

  // Jika ok, kembalikan JSON
  return res.json();
};

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
    data: notificationsData, // [PERBAIKAN] Ganti nama 'data'
    error,
    isLoading,
  } = useSWR<Notification[]>(swrKey, fetcher, {
    refreshInterval: 60000, // Refresh setiap 60 detik
    dedupingInterval: 60000,
  });

  // [PERBAIKAN] Pastikan 'notifications' selalu array.
  // Jika 'error' ada atau 'data' bukan array, kembalikan array kosong.
  const notifications =
    !error && notificationsData && Array.isArray(notificationsData)
      ? notificationsData
      : [];

  // Hitung jumlah notifikasi yang belum dibaca (SEKARANG AMAN)
  const unreadCount =
    notifications.filter((notif) => !notif.read).length || 0;

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
    notifications, // [PERBAIKAN] Kirim 'notifications' yang dijamin array
    unreadCount,
    isLoading,
    isError: error,
    markAsRead,
  };
};