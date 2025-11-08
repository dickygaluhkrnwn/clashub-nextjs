// File: lib/server-auth.ts
// Deskripsi: Fungsi utilitas untuk otentikasi
// di sisi server (Server Components) dengan membaca cookie.

import { headers } from 'next/headers';
// [PERBAIKAN] Impor tipe UserProfile dan koneksi database admin
import { UserProfile } from './types';
import { adminFirestore } from './firebase-admin';
import { COLLECTIONS } from './firestore-collections';

// Struktur data minimal pengguna yang dapat diperoleh dari server
export interface ServerUser {
  uid: string;
  email: string | null;
  displayName: string;
  avatarUrl?: string; // [PERBAIKAN] Menambahkan avatarUrl
}

/**
 * @function getSessionUser
 * Mengambil informasi pengguna dari cookie permintaan Next.js.
 * [PERBAIKAN] Fungsi ini sekarang mengambil data asli dari Firestore, BUKAN simulasi.
 * @returns {Promise<ServerUser | null>} Objek pengguna jika sesi ditemukan.
 */
export async function getSessionUser(): Promise<ServerUser | null> {
  // Ini adalah cara Next.js membaca header request di Server Component
  const requestHeaders = headers();
  const cookieHeader = requestHeaders.get('cookie');

  if (!cookieHeader) {
    return null; // Tidak ada cookie sama sekali
  }

  // 1. Cari nilai cookie 'session-token'
  const cookiesArray = cookieHeader.split(';');
  const sessionCookie = cookiesArray.find((c) =>
    c.trim().startsWith('session-token='),
  );

  if (sessionCookie) {
    // 2. Ekstrak nilai token yang sebenarnya
    const tokenValueRaw = sessionCookie.split('=')[1]?.trim();

    if (tokenValueRaw && tokenValueRaw.includes('logged_in')) {
      // Format yang diharapkan: logged_in_UID_ANDA
      const parts = tokenValueRaw.split('_');
      const uid = parts.slice(2).join('_');

      if (uid && uid.length > 5) {
        // --- [PERBAIKAN LOGIKA] ---
        // Hentikan simulasi. Ambil data asli dari Firestore.
        try {
          const userRef = adminFirestore
            .collection(COLLECTIONS.USERS)
            .doc(uid);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            // Jika cookie ada tapi profil tidak ada, sesi tidak valid
            console.warn(`[ServerAuth] No profile found for UID: ${uid}.`);
            return null;
          }

          const userProfile = userDoc.data() as UserProfile;

          // Kembalikan data profil asli (displayName akan "IKY")
          return {
            uid: userProfile.uid,
            email: userProfile.email,
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl || undefined, // [PERBAIKAN] Mengembalikan avatarUrl
          };
        } catch (error) {
          console.error(
            `[ServerAuth] Error fetching user profile for UID: ${uid}`,
            error,
          );
          // Gagal mengambil data, anggap sesi tidak valid
          return null;
        }
        // --- [AKHIR PERBAIKAN] ---
      }
    }
  }

  return null;
}