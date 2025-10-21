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
 * di Server Component tanpa server eksternal/middleware kompleks, kita akan 
 * MENSIMULASIKAN dengan membaca cookie dummy 'session-token' untuk demo SSR.
 * * Di lingkungan produksi penuh, kode ini harus memanggil Firebase Admin SDK
 * untuk memverifikasi ID token dari klien.
 * * Untuk saat ini, kita akan menganggap token 'dummy-auth-token' berarti pengguna login.
 * Data UID/Email akan diambil dari cookie jika tersedia.
 * * @returns {Promise<ServerUser | null>} Objek pengguna jika sesi ditemukan.
 */
export async function getSessionUser(): Promise<ServerUser | null> {
    
    // Ini adalah cara Next.js membaca header request di Server Component
    const requestHeaders = headers();
    const cookie = requestHeaders.get('cookie');

    // MENSIMULASIKAN otentikasi:
    // Jika kita menemukan cookie 'session-token' dengan nilai tertentu,
    // kita asumsikan pengguna terautentikasi dan memberikan data dummy.
    
    // Di dunia nyata, Anda akan menggunakan Admin SDK di sini:
    // if (token) { await admin.auth().verifyIdToken(token); }

    const dummyToken = cookie?.split(';').find(c => c.trim().startsWith('session-token='));
    
    if (dummyToken && dummyToken.includes('logged_in')) {
        // Karena ini simulasi, kita bisa menggunakan UID dari salah satu seed data
        const uid = "uid_lordz"; 
        const email = "lordz@example.com";
        const displayName = "Lord Z";

        return { uid, email, displayName };
    }

    return null;
}
