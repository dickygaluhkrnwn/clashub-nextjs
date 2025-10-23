import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
// PERBAIKAN: Mengganti getManagedClanDataWithCache (belum ada) dengan fungsi yang tersedia
import { getUserProfile, getManagedClanData, getClanApiCache } from '@/lib/firestore'; 
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

    // 1. Route Protection (Authentication)
    if (!sessionUser) {
        redirect('/auth');
    }

    const userProfile = await getUserProfile(sessionUser.uid);
    let clanData: ClanManagementData | null = null;
    let serverError: string | null = null;
    
    // 2. Validasi Peran dan Status Verifikasi
    // Pastikan userProfile ada dan isVerified
    const isClanManager = userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';
    
    if (!userProfile?.isVerified || !isClanManager || !userProfile?.teamId) {
        serverError = "Akses Ditolak: Anda harus menjadi Leader/Co-Leader yang terverifikasi dan menautkan klan untuk mengakses halaman manajemen.";
        // Tidak perlu redirect, biarkan Client Component menampilkan pesan error
    } else {
        // 3. Ambil data klan dan cache-nya
        try {
            // Kita menggunakan userProfile.teamId, yang diisi saat verifikasi leader/co-leader
            const managedClan = await getManagedClanData(userProfile.teamId);
            
            if (managedClan) {
                // Ambil cache data API
                const apiCache = await getClanApiCache(managedClan.id); 

                clanData = { 
                    // Pastikan kita hanya mengirim field ManagedClan ke client (menghilangkan 'id')
                    clan: managedClan as ManagedClan, 
                    cache: apiCache,
                };
            } else {
                serverError = "Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.";
            }
        } catch (error) {
            console.error("Server Error: Failed to load managed clan data:", error);
            serverError = "Gagal memuat data klan. Coba muat ulang halaman.";
        }
    }

    // 4. Meneruskan data ke Client Component
    // Walaupun ada serverError, kita tetap meneruskan data ke Client Component untuk ditampilkan
    return (
        <ManageClanClient 
            initialData={clanData} 
            serverError={serverError} 
            profile={userProfile}
        />
    );
};

export default ClanManagementPage;
