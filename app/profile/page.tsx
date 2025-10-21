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
        profileData = await getUserProfile(sessionUser.uid);
        
        if (!profileData) {
            // Jika pengguna login tapi profil tidak ada (Error Sign-up), arahkan untuk Edit
            serverError = "Profil E-Sports CV Anda belum ditemukan. Silakan lengkapi data Anda.";
            // Kita tetap tampilkan halaman ini dengan error, dan berikan tombol Edit
        }

    } catch (err) {
        console.error("Server Error: Failed to load user profile:", err);
        serverError = "Gagal memuat data profil dari Firestore. Coba lagi.";
    }

    // 4. Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <ProfileClient 
            // Kita tahu profileData mungkin null, tapi kita tangani di Client Component
            initialProfile={profileData} 
            serverError={serverError}
        />
    );
};

export default ProfilePage;
