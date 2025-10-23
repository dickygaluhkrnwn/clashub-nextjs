import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth'; // Utilitas Auth Sisi Server
import { getUserProfile } from '@/lib/firestore'; // Fungsi ambil data profil
import ProfileClient from './ProfileClient'; // Client Component (untuk interaktivitas)
import { UserProfile } from '@/lib/types'; // Import UserProfile

// Metadata untuk SEO
export const metadata: Metadata = {
    title: "Clashub | E-Sports CV Anda",
    description: "Lihat dan kelola E-Sports CV Clash of Clans Anda.",
};

// Mengubah komponen menjadi fungsi async: Server Component
const ProfilePage = async () => {
    let profileData: UserProfile | null = null;
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
            // KASUS PROFIL BARU: Profil belum ada di Firestore
            serverError = "Profil E-Sports CV Anda belum ditemukan. Silakan lengkapi data Anda di halaman Edit Profil.";
            
            // Inisialisasi data minimal agar ProfileClient dapat merender
            profileData = {
                uid: sessionUser.uid,
                email: sessionUser.email || null,
                displayName: sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
                // Field verifikasi default (penting)
                isVerified: false,
                playerTag: '',
                thLevel: 1,
                role: 'Free Agent',
                clanRole: 'not in clan',
                // Field penting lainnya
                reputation: 5.0,
                teamId: null,
                teamName: null,
            } as UserProfile; // Casting untuk memastikan tipe lengkap
        } else {
            // KASUS PROFIL DITEMUKAN:
            serverError = null; // Pastikan error direset jika data ditemukan
        }

    } catch (err) {
        // KASUS KONEKSI ERROR: Jika terjadi exception (misal koneksi ke Firestore mati)
        console.error("Server Error: Failed to load user profile:", err);
        profileData = null; // Paksa null jika terjadi error koneksi fatal
        serverError = "Gagal memuat data profil dari Firestore. Coba lagi."; // Error fatal
    }

    // 4. Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <ProfileClient 
            // Kita yakin profileData memiliki uid di sini (karena sudah di-check sessionUser)
            initialProfile={profileData} 
            serverError={serverError}
        />
    );
};

export default ProfilePage;
