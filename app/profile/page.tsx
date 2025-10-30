import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth'; // Utilitas Auth Sisi Server
import { getUserProfile, getPostsByAuthor } from '@/lib/firestore'; // Fungsi ambil data profil
import cocApi from '@/lib/coc-api'; // Objek yang berisi method API CoC
import ProfileClient from './ProfileClient'; // Client Component (untuk interaktivitas)
import { UserProfile, ClanRole, Post, CocPlayer } from '@/lib/types'; // Import UserProfile, ClanRole, Post, CocPlayer

// Metadata untuk SEO
export const metadata: Metadata = {
    title: "Clashub | E-Sports CV Anda",
    description: "Lihat dan kelola E-Sports CV Clash of Clans Anda.",
};

// --- Tambahkan baris ini untuk memaksa render dinamis ---
export const dynamic = 'force-dynamic';
// --- Akhir tambahan ---

// --- Fungsi Helper untuk Map Role CoC API ke Enum ClanRole ---
const mapCocRoleToClanRole = (cocRole?: string): ClanRole => {
    switch (cocRole?.toLowerCase()) {
        case 'leader': return ClanRole.LEADER;
        case 'coLeader': return ClanRole.CO_LEADER;
        case 'admin': return ClanRole.ELDER; // CoC API uses 'admin' for Elder
        case 'member': return ClanRole.MEMBER;
        default: return ClanRole.NOT_IN_CLAN;
    }
};

// Mengubah komponen menjadi fungsi async: Server Component
const ProfilePage = async () => {
    let profileData: UserProfile | null = null;
    let serverError: string | null = null;
    let recentPosts: Post[] = [];
    
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
            
            // Inisialisasi data minimal
            profileData = {
                uid: sessionUser.uid,
                email: sessionUser.email || null,
                displayName: sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
                isVerified: false,
                playerTag: '',
                inGameName: undefined, 
                thLevel: 9, 
                trophies: 0, 
                clanTag: null, 
                clanRole: ClanRole.NOT_IN_CLAN, 
                lastVerified: undefined, 
                role: 'Free Agent',
                playStyle: undefined,
                activeHours: '',
                reputation: 5.0,
                avatarUrl: '/images/placeholder-avatar.png',
                discordId: null,
                website: null,
                bio: '',
                // FIX: Ganti teamId/teamName menjadi clanId/clanName
                clanId: null,
                clanName: null,
            } as UserProfile; // Casting untuk memastikan tipe lengkap
        } else {
            // KASUS PROFIL DITEMUKAN:
            serverError = null; // Pastikan error direset

            // --- Ambil data live jika terverifikasi ---
            if (profileData.isVerified && profileData.playerTag) {
                try {
                    // --- PERBAIKAN: Encode playerTag sebelum memanggil API ---
                    const encodedPlayerTag = encodeURIComponent(profileData.playerTag);
                    console.log(`[ProfilePage] Fetching live CoC data for encoded tag: ${encodedPlayerTag}`);
                    const livePlayerData: CocPlayer | null = await cocApi.getPlayerData(encodedPlayerTag); // Gunakan tag yang sudah di-encode

                    if (livePlayerData) {
                        console.log(`[ProfilePage] Live data found. Merging...`);
                        // Timpa data Firestore dengan data live
                        profileData = {
                            ...profileData, 
                            inGameName: livePlayerData.name,
                            thLevel: livePlayerData.townHallLevel,
                            trophies: livePlayerData.trophies,
                            clanTag: livePlayerData.clan?.tag || null,
                            // FIX: Ganti teamName menjadi clanName
                            clanName: livePlayerData.clan 
                                ? (profileData.clanName && profileData.clanName !== livePlayerData.clan.name ? livePlayerData.clan.name : profileData.clanName || livePlayerData.clan.name) 
                                : null, 
                            clanRole: mapCocRoleToClanRole(livePlayerData.role),
                        };
                    } else {
                        console.warn(`[ProfilePage] Live CoC data not found for tag: ${profileData.playerTag}. Using Firestore data.`);
                    }
                } catch (cocErr) {
                    console.error(`[ProfilePage] Error fetching live CoC data for tag ${profileData.playerTag}:`, cocErr);
                }
            }
        }

        // Ambil postingan nyata (setelah profileData dipastikan ada dan mungkin sudah digabung)
        if (profileData?.uid) { 
            try {
                // FIX: Memastikan profileData tidak null sebelum mengakses uid
                recentPosts = await getPostsByAuthor(profileData.uid, 3);
            } catch (postErr) {
                // Log error jika index belum dibuat, tapi jangan blokir render halaman
                console.error("Server Error: Failed to load recent posts (Firestore Index might be missing):", postErr); 
                // Biarkan recentPosts kosong jika gagal
            }
        }

    } catch (err) {
        // KASUS KONEKSI ERROR
        console.error("Server Error: Failed to load user profile:", err);
        profileData = null; 
        serverError = "Gagal memuat data profil dari Firestore. Coba lagi."; 
    }

    // 4. Meneruskan data ke Client Component
    return (
        <ProfileClient 
            initialProfile={profileData} 
            serverError={serverError}
            recentPosts={recentPosts}
        />
    );
};

export default ProfilePage;
