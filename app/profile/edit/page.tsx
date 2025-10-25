import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile } from '@/lib/firestore'; // Fungsi ambil data profil
import { UserProfile, ClanRole } from '@/lib/types'; // Import UserProfile dan ClanRole
import EditProfileClient from './EditProfileClient';
import { Metadata } from 'next';

// --- TAMBAHKAN BARIS INI UNTUK MEMAKSA RENDER DINAMIS ---
export const dynamic = 'force-dynamic';
// --- AKHIR TAMBAHAN ---

export const metadata: Metadata = {
    title: "Clashub | Edit E-Sports CV",
    description: "Perbarui informasi Town Hall, gaya bermain, bio, dan detail kontak Anda."
};

/**
 * @component EditProfilePage (Server Component)
 * Menangani otentikasi sisi server, mengambil data UserProfile lengkap,
 * dan meneruskannya ke klien.
 */
const EditProfilePage = async () => {

    const sessionUser = await getSessionUser();

    // Route Protection (Server-Side Redirect)
    if (!sessionUser) {
        redirect('/auth');
    }

    // Ambil UserProfile lengkap dari Firestore
    // Dengan 'force-dynamic', ini akan selalu dijalankan untuk user saat ini
    const userProfile = await getUserProfile(sessionUser.uid);

    // Jika profil tidak ditemukan, kita buat objek dasar sebagai fallback
    // PERBAIKAN KRITIS: Sinkronisasi semua field baru untuk form Client-Side
    const initialProfile: Partial<UserProfile> = userProfile || {
        uid: sessionUser.uid,
        displayName: sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
        email: sessionUser.email,

        // --- FIELD VERIFIKASI COCLANS (Default) ---
        isVerified: false,
        playerTag: '',
        inGameName: undefined, // Ditambahkan
        thLevel: 9,
        trophies: 0,
        clanTag: null, // Ditambahkan
        clanRole: ClanRole.NOT_IN_CLAN, // Menggunakan Enum ClanRole
        lastVerified: undefined, // Ditambahkan

        // --- FIELD E-SPORTS CV LAMA (Default) ---
        role: 'Free Agent',
        playStyle: undefined,
        activeHours: '',
        reputation: 5.0,
        avatarUrl: '/images/placeholder-avatar.png',
        discordId: null,
        website: null,
        bio: '',
        teamId: null,
        teamName: null,
    };

    // Meneruskan Profil lengkap ke Client Component
    return (
        <EditProfileClient initialProfile={initialProfile as UserProfile} />
    );
};

export default EditProfilePage;
