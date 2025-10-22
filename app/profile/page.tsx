import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth'; // Utilitas Auth Sisi Server
import { getUserProfile } from '@/lib/firestore'; // Fungsi ambil data profil
import ProfileClient from './ProfileClient'; // Client Component (untuk interaktivitas)

// Metadata untuk SEO
export const metadata: Metadata = {
    title: "Clashub | E-Sports CV Anda",
    description: "Lihat dan kelola E-Sports CV Clash of Clans Anda.",
};

// Mengubah komponen menjadi fungsi async: Server Component
const ProfilePage = async () => {
    let profileData = null;
    let serverError: string | null = null;
    
    // 1. Dapatkan status pengguna dari Sisi Server
    const sessionUser = await getSessionUser();

    // 2. Route Protection (Server-Side Redirect)
    if (!sessionUser) {
        // Jika tidak ada sesi, alihkan pengguna ke halaman login
        redirect('/auth');
    }
    
    // 3. Ambil data profil dari Firestore menggunakan UID
    try {
        // getUserProfile sudah menangani doc.exists() dan mengembalikan null jika tidak ada.
        profileData = await getUserProfile(sessionUser.uid);
        
        if (!profileData) {
            // KASUS PROFIL BARU:
            // Jika data profil tidak ada (null), kita JANGAN set serverError.
            // Cukup berikan pesan ke klien bahwa profil belum diisi (ditangani di Client Component).
            serverError = "Profil E-Sports CV Anda belum ditemukan. Silakan lengkapi data Anda.";
             // Karena ini adalah kasus "data not found" bukan "connection error", kita biarkan
             // profileData tetap null dan serverError memberikan info kontekstual.
        } else {
             // KASUS PROFIL DITEMUKAN:
             serverError = null; // Pastikan error direset jika data ditemukan
        }

    } catch (err) {
        // KASUS KONEKSI ERROR: Jika terjadi exception (misal koneksi ke Firestore mati)
        console.error("Server Error: Failed to load user profile:", err);
        profileData = null; // Paksa null untuk initialProfile
        serverError = "Gagal memuat data profil dari Firestore. Coba lagi."; // Error fatal
    }

    // 4. Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <ProfileClient 
            // Jika terjadi error koneksi, profileData akan null dan serverError akan diisi.
            // Jika profil belum ada, profileData akan null, dan serverError akan berisi pesan informatif.
            initialProfile={profileData} 
            serverError={serverError}
        />
    );
};

export default ProfilePage;
