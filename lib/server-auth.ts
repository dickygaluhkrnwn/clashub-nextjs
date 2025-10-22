// File: lib/server-auth.ts
// Deskripsi: Fungsi utilitas untuk mensimulasikan otentikasi
// di sisi server (Server Components) dengan membaca cookie.

import { headers } from 'next/headers';
import { UserProfile } from './types';

// Struktur data minimal pengguna yang dapat diperoleh dari server
export interface ServerUser {
  uid: string;
  email: string | null;
  displayName: string;
  // Di masa depan, data ini bisa di-decode dari token JWT Firebase
}


/**
 * @function getSessionUser
 * Mengambil informasi pengguna dari cookie permintaan Next.js (simulasi).
 * * CATATAN: Karena Next.js tidak memiliki integrasi native untuk Firebase Admin SDK 
 * di Server Component, kita MENSIMULASIKAN dengan membaca cookie 'session-token'.
 * Cookie ini seharusnya berisi UID pengguna yang sebenarnya.
 * * @returns {Promise<ServerUser | null>} Objek pengguna jika sesi ditemukan.
 */
export async function getSessionUser(): Promise<ServerUser | null> {
    
    // Ini adalah cara Next.js membaca header request di Server Component
    const requestHeaders = headers();
    const cookie = requestHeaders.get('cookie');

    // 1. Cari cookie 'session-token'
    const dummyToken = cookie?.split(';').find(c => c.trim().startsWith('session-token='));
    
    if (dummyToken && dummyToken.includes('logged_in')) {
        // 2. Ekstrak UID dari nilai token (format: 'logged_in_UID_ANDA')
        const tokenValue = dummyToken.split('=')[1];
        const uid = tokenValue.split('_')[1]; // Mengambil bagian setelah 'logged_in_'
        
        if (uid) {
            // Karena ini simulasi, kita mengisi email dan displayName dengan nilai dummy.
            // Di lingkungan nyata, kita akan memuat displayName/email dari data profil.
            const email = `${uid}@example.com`;
            const displayName = uid === "uid_lordz" ? "Lord Z" : `Clasher #${uid.substring(4, 8)}`;
            
            return { uid, email, displayName };
        }
    }

    return null;
}
