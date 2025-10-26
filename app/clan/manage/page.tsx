// File: app/clan/manage/page.tsx
// Deskripsi: Server Component untuk memuat data awal Dashboard Manajemen Klan.

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
// Import fungsi read yang diperlukan (getManagedClanData, getClanApiCache, getJoinRequests, getTeamMembers)
import {
    getUserProfile,
    getManagedClanData,
    getClanApiCache,
    getJoinRequests, // Fungsi baru untuk mengambil permintaan
    getTeamMembers // Fungsi untuk mengambil anggota klan
} from '@/lib/firestore';
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest } from '@/lib/types'; // Impor semua tipe data
import ManageClanClient from './ManageClanClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Clashub | Manajemen Klan',
    description:
        'Kelola data klan Anda, lihat status sinkronisasi, dan fitur admin lainnya.',
};

// Interface baru untuk data lengkap yang dikirim ke Client Component
// FIX: Tipe ini sudah benar, masalah ada di penanganan saat mengirim ke ManageClanClient.
export interface ClanManagementProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    joinRequests: JoinRequest[];
    members: UserProfile[];
    profile: UserProfile;
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
    let clanData: ClanManagementProps['clan'] | null = null;
    let cacheData: ClanManagementProps['cache'] | null = null;
    let requestsData: ClanManagementProps['joinRequests'] = [];
    let membersData: ClanManagementProps['members'] = [];
    let serverError: string | null = null;

    // 2. Validasi Peran dan Status Verifikasi
    // Gunakan Clashub Role (yang diset Leader/Co-Leader) untuk kontrol akses halaman
    const isClashubManager = userProfile?.role === 'Leader' || userProfile?.role === 'Co-Leader';

    // [FIX] Mengganti userProfile?.teamId menjadi userProfile?.clanId
    if (!userProfile?.isVerified || !isClashubManager || !userProfile?.clanId) {
        serverError =
            'Akses Ditolak: Anda harus memiliki peran Leader/Co-Leader Clashub yang terverifikasi dan menautkan klan untuk mengakses halaman manajemen.';
        
        // Kita tetap kembalikan data minimal untuk Client Component
        return (
            <ManageClanClient
                // Melempar error ke client dengan data minimal
                initialData={null}
                serverError={serverError}
                profile={userProfile || ({} as UserProfile)} // Cast fallback jika profile null
            />
        );
    } 
    
    // Clan ID yang digunakan untuk semua operasi
    const clanId = userProfile.clanId;

    // 3. Ambil data klan, cache, requests, dan anggota secara paralel
    try {
        const [managedClan, apiCache, joinRequests, teamMembers] = await Promise.all([
            getManagedClanData(clanId), // Info klan
            getClanApiCache(clanId), // Cache Partisipasi/War
            getJoinRequests(clanId), // Permintaan Bergabung
            getTeamMembers(clanId) // Semua UserProfile Anggota
        ]);

        if (managedClan) {
            clanData = managedClan as ManagedClan;
            cacheData = apiCache;
            requestsData = joinRequests;
            membersData = teamMembers;

        } else {
            serverError =
                'Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.';
        }
    } catch (error) {
        console.error('Server Error: Failed to load comprehensive clan data:', error);
        serverError = 'Gagal memuat data dashboard klan. Coba muat ulang halaman.';
    }

    // 4. Meneruskan data lengkap ke Client Component
    // FIX KRITIS: Memastikan profile selalu dimasukkan ke dalam objek initialData saat berhasil.
    return (
        <ManageClanClient
            initialData={clanData && userProfile ? {
                clan: clanData,
                cache: cacheData,
                joinRequests: requestsData,
                members: membersData,
                // FIX: profile dimasukkan ke dalam objek data utama.
                profile: userProfile, 
            } : null}
            serverError={serverError}
            profile={userProfile} // Properti ini mungkin redundan jika ada di initialData, tapi dipertahankan sebagai fallback untuk UI error state.
        />
    );
};

export default ClanManagementPage;
