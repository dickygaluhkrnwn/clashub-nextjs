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
 * * CATATAN: Ini adalah SIMULASI pembacaan sesi. Di produksi, harus menggunakan 
 * Firebase Admin SDK untuk memverifikasi token sesi JWT.
 * @returns {Promise<ServerUser | null>} Objek pengguna jika sesi ditemukan.
 */
export async function getSessionUser(): Promise<ServerUser | null> {
    
    // Ini adalah cara Next.js membaca header request di Server Component
    const requestHeaders = headers();
    const cookieHeader = requestHeaders.get('cookie');

    if (!cookieHeader) {
        return null; // Tidak ada cookie sama sekali
    }

    // 1. Cari nilai cookie 'session-token' secara lebih robust.
    // Cookie header terlihat seperti: "cookie1=value1; session-token=logged_in_uid_anda; cookie3=value3"
    const cookiesArray = cookieHeader.split(';');
    
    // Temukan cookie yang dimulai dengan 'session-token=' (dengan trim untuk menghapus spasi)
    const sessionCookie = cookiesArray.find(c => c.trim().startsWith('session-token='));
    
    // Debugging Console (Hanya untuk keperluan diagnostik)
    // console.log("[ServerAuth] Cookie Header:", cookieHeader);
    // console.log("[ServerAuth] Session Cookie Found:", sessionCookie ? true : false);

    if (sessionCookie) {
        // 2. Ekstrak nilai token yang sebenarnya
        // Nilai mentah: " session-token=logged_in_uid_anda"
        const tokenValueRaw = sessionCookie.split('=')[1]?.trim(); 
        
        if (tokenValueRaw && tokenValueRaw.includes('logged_in')) {
            
            // Format yang diharapkan: logged_in_UID_ANDA
            const parts = tokenValueRaw.split('_');
            
            // Ambil semua bagian dari index 2 ke belakang (UID)
            const uid = parts.slice(2).join('_');
            
            // console.log("[ServerAuth] Extracted UID:", uid);

            if (uid && uid.length > 5) { // Cek UID minimal panjang
                // Karena ini simulasi, kita mengisi email dan displayName dengan nilai dummy.
                const email = `${uid}@clashub.com`;
                const displayName = uid === "uid_lordz" ? "Lord Z" : `Clasher #${uid.substring(0, 8)}`;
                
                return { uid, email, displayName };
            }
        }
    }

    return null;
}
