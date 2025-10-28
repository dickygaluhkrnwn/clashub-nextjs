import { redirect } from 'next/navigation';
// FIX 1: Hapus import Metadata yang duplikat
import type { Metadata } from 'next'; 
import { getSessionUser } from '@/lib/server-auth';
// Import fungsi read yang diperlukan (getManagedClanData, getClanApiCache, getJoinRequests, getTeamMembers)
import {
    getUserProfile,
    getManagedClanData,
    getClanApiCache,
    getJoinRequests, // Fungsi baru untuk mengambil permintaan
    getTeamMembers // Fungsi untuk mengambil anggota klan
} from '@/lib/firestore';
// BARU: Import fungsi Admin SDK untuk mengambil arsip
import { getCwlArchivesByClanId } from '@/lib/firestore-admin'; 
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, CwlArchive } from '@/lib/types'; // Impor semua tipe data, termasuk CwlArchive
import ManageClanClient from './ManageClanClient';
// FIX 1: Hapus import Metadata yang duplikat
// import { Metadata } from 'next'; 
import React from 'react'; // Import React untuk elemen JSX

export const metadata: Metadata = {
    title: 'Clashub | Manajemen Klan',
    description:
        'Kelola data klan Anda, lihat status sinkronisasi, dan fitur admin lainnya.',
};

// Interface baru untuk data lengkap yang dikirim ke Client Component
export interface ClanManagementProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    joinRequests: JoinRequest[];
    members: UserProfile[];
    profile: UserProfile;
    // BARU: Menambahkan arsip CWL untuk Tab Riwayat CWL (Fase 3)
    cwlArchives: CwlArchive[];
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
    let cwlArchivesData: ClanManagementProps['cwlArchives'] = []; // BARU: Inisialisasi data CWL
    let serverError: string | null = null;

    // 2. Validasi Peran dan Status Verifikasi
    // Gunakan Clashub Role (yang diset Leader/Co-Leader) untuk kontrol akses halaman
    const isClashubManager = userProfile?.role === 'Leader' || userProfile?.role === 'Co-Leader';

    // --- LOGIKA KRITIS: HANYA MENGGUNAKAN clanId ---
    // Fix 2: Hapus logic fallback 'teamId' dan hanya gunakan 'clanId'.
    const userClanId = userProfile?.clanId; 
    
    // Logika GAGAL AKSES
    if (!userProfile?.isVerified || !isClashubManager || !userClanId) { 
        serverError =
            'Akses Ditolak: Anda harus memiliki peran Leader/Co-Leader Clashub yang terverifikasi dan menautkan klan untuk mengakses halaman manajemen.';
        
        // Catatan: Pesan peringatan tentang 'teamId' dihilangkan karena kode sudah di-fix untuk hanya mencari 'clanId'
        // Jika userClanId (yaitu userProfile?.clanId) masih null, maka serverError akan muncul.

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
    
    // Clan ID yang digunakan untuk semua operasi (gunakan ID yang ditemukan)
    const clanId = userClanId; 

    // 3. Ambil data klan, cache, requests, anggota, dan arsip CWL secara paralel
    try {
        const [managedClan, apiCache, joinRequests, teamMembers, cwlArchives] = await Promise.all([ // BARU: Tambahkan cwlArchives
            getManagedClanData(clanId), // Info klan
            getClanApiCache(clanId), // Cache Partisipasi/War
            getJoinRequests(clanId), // Permintaan Bergabung
            getTeamMembers(clanId), // Semua UserProfile Anggota
            getCwlArchivesByClanId(clanId) // BARU: Ambil Arsip CWL
        ]);

        if (managedClan) {
            clanData = managedClan as ManagedClan;
            cacheData = apiCache;
            requestsData = joinRequests;
            membersData = teamMembers;
            cwlArchivesData = cwlArchives; // BARU: Simpan data arsip CWL

        } else {
            serverError =
                'Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.';
        }
    } catch (error) {
        console.error('Server Error: Failed to load comprehensive clan data:', error);
        serverError = 'Gagal memuat data dashboard klan. Coba muat ulang halaman.';
    }

    // 4. Meneruskan data lengkap ke Client Component
    return (
        <ManageClanClient
            initialData={clanData && userProfile ? {
                clan: clanData,
                cache: cacheData,
                joinRequests: requestsData,
                members: membersData,
                // FIX: profile dimasukkan ke dalam objek data utama.
                profile: userProfile, 
                // BARU: Salurkan data arsip CWL
                cwlArchives: cwlArchivesData,
            } : null}
            serverError={serverError}
            profile={userProfile} // Properti ini mungkin redundan jika ada di initialData, tapi dipertahankan sebagai fallback untuk UI error state.
        />
    );
};

export default ClanManagementPage;
