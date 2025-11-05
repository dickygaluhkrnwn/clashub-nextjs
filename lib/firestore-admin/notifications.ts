// File: lib/firestore-admin/notifications.ts
// Deskripsi: TAHAP 1.4 - Utility Admin SDK untuk membuat notifikasi.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
import { Notification } from '../clashub.types';
import { cleanDataForAdminSDK } from './utils';

/**
 * @function createNotification
 * Membuat dokumen notifikasi baru di sub-koleksi 'notifications' milik pengguna.
 *
 * @param userId - UID pengguna yang akan menerima notifikasi.
 * @param message - Teks yang akan ditampilkan.
 * @param url - Link tujuan saat notifikasi di-klik.
 * @param type - Tipe notifikasi (untuk styling atau filter di masa depan).
 */
export const createNotification = async (
  userId: string,
  message: string,
  url: string,
  type: Notification['type']
): Promise<void> => {
  if (!userId) {
    console.error('[createNotification] Gagal: userId tidak valid.');
    return;
  }

  try {
    // Tentukan path ke sub-koleksi 'notifications' milik user
    const notifRef = adminFirestore
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .collection(COLLECTIONS.NOTIFICATIONS)
      .doc(); // Buat ID dokumen baru secara otomatis

    const newNotification: Omit<Notification, 'id'> = {
      userId: userId,
      message: message,
      url: url,
      type: type,
      read: false,
      createdAt: new Date(), // Set timestamp saat ini
    };

    // Bersihkan data (konversi Date ke Timestamp) dan simpan
    await notifRef.set(cleanDataForAdminSDK(newNotification));
    
    console.log(`[Notification] Notifikasi berhasil dibuat untuk user ${userId}.`);

  } catch (error) {
    console.error(
      `[createNotification Error] Gagal membuat notifikasi untuk user ${userId}:`,
      error
    );
    // Kita tidak melempar error di sini agar proses utama (misal: approve user)
    // tidak gagal hanya karena notifikasinya gagal terkirim.
  }
};