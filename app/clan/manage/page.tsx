import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile, getManagedClanDataWithCache } from '@/lib/firestore'; // Impor fungsi baru
import { ManagedClan, ClanApiCache } from '@/lib/types'; // Impor tipe data baru
import ManageClanClient from './ManageClanClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Clashub | Manajemen Klan",
    description: "Kelola data klan Anda, lihat status sinkronisasi, dan fitur admin lainnya.",
};

interface ClanManagementData {
    clan: ManagedClan;
    cache: ClanApiCache | null;
}

/**
 * @component ClanManagementPage (Server Component)
 * Memuat profil pengguna, memvalidasi peran kepemimpinan, dan memuat data klan terkelola.
 */
const ClanManagementPage = async () => {
    const sessionUser = await getSessionUser();

    // 1. Route Protection
    if (!sessionUser) {
        redirect('/auth');
    }

    const userProfile = await getUserProfile(sessionUser.uid);
    let clanData: ClanManagementData | null = null;
    let serverError: string | null = null;
    
    // 2. Validasi Peran dan Status Verifikasi
    const isClanManager = userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';
    
    if (!userProfile?.isVerified || !isClanManager || !userProfile?.teamId) {
        serverError = "Akses Ditolak: Anda harus menjadi Leader/Co-Leader yang terverifikasi dan menautkan klan untuk mengakses halaman manajemen.";
        // Redirect ke /profile jika tidak memenuhi syarat (opsional, tapi lebih baik)
        // redirect('/profile'); // Biarkan ClientComponent yang menangani tampilan Access Denied
    } else {
        // 3. Ambil data klan dan cache-nya
        try {
            const result = await getManagedClanDataWithCache(userProfile.teamId);
            if (result) {
                clanData = { clan: result.clan, cache: result.cache };
            } else {
                serverError = "Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.";
            }
        } catch (error) {
            console.error("Server Error: Failed to load managed clan data:", error);
            serverError = "Gagal memuat data klan. Coba muat ulang halaman.";
        }
    }

    // 4. Meneruskan data ke Client Component
    return (
        <ManageClanClient 
            initialData={clanData} 
            serverError={serverError} 
            profile={userProfile}
        />
    );
};

export default ClanManagementPage;
