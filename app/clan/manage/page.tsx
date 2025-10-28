import { redirect } from 'next/navigation';
import type { Metadata } from 'next'; 
import { getSessionUser } from '@/lib/server-auth';
// Import fungsi read client-side
import {
    getUserProfile,
    getManagedClanData,
    getClanApiCache,
    getJoinRequests, // Fungsi baru untuk mengambil permintaan
    getTeamMembers // Fungsi untuk mengambil anggota klan
} from '@/lib/firestore';
// BARU: Import fungsi Admin SDK untuk mengambil arsip
import { getCwlArchivesByClanId, getRaidArchivesByClanId } from '@/lib/firestore-admin'; // BARU: Tambah getRaidArchivesByClanId
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, CwlArchive, RaidArchive } from '@/lib/types'; // BARU: Tambah RaidArchive
import ManageClanClient from './ManageClanClient';
import React from 'react'; 

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
    cwlArchives: CwlArchive[];
    // BARU: Menambahkan arsip Raid untuk Tab Raid (Fase 3.2)
    raidArchives: RaidArchive[]; 
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
    let cwlArchivesData: ClanManagementProps['cwlArchives'] = []; 
    let raidArchivesData: ClanManagementProps['raidArchives'] = []; // BARU: Inisialisasi data Raid
    let serverError: string | null = null;

    // 2. Validasi Peran dan Status Verifikasi
    const isClashubManager = userProfile?.role === 'Leader' || userProfile?.role === 'Co-Leader';
    const userClanId = userProfile?.clanId; 
    
    // Logika GAGAL AKSES
    if (!userProfile?.isVerified || !isClashubManager || !userClanId) { 
        serverError =
            'Akses Ditolak: Anda harus memiliki peran Leader/Co-Leader Clashub yang terverifikasi dan menautkan klan untuk mengakses halaman manajemen.';
        
        return (
            <ManageClanClient
                initialData={null}
                serverError={serverError}
                profile={userProfile || ({} as UserProfile)} 
            />
        );
    } 
    
    // Clan ID yang digunakan untuk semua operasi
    const clanId = userClanId; 

    // 3. Ambil semua data secara paralel
    try {
        const [
            managedClan, 
            apiCache, 
            joinRequests, 
            teamMembers, 
            cwlArchives, 
            raidArchives // BARU: Tambahkan raidArchives
        ] = await Promise.all([ 
            getManagedClanData(clanId), 
            getClanApiCache(clanId), 
            getJoinRequests(clanId), 
            getTeamMembers(clanId), 
            getCwlArchivesByClanId(clanId), 
            getRaidArchivesByClanId(clanId) // BARU: Panggil fungsi getRaidArchives
        ]);

        if (managedClan) {
            clanData = managedClan as ManagedClan;
            cacheData = apiCache;
            requestsData = joinRequests;
            membersData = teamMembers;
            cwlArchivesData = cwlArchives; 
            raidArchivesData = raidArchives; // BARU: Simpan data arsip Raid

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
                profile: userProfile, 
                cwlArchives: cwlArchivesData,
                // BARU: Salurkan data arsip Raid
                raidArchives: raidArchivesData, 
            } : null}
            serverError={serverError}
            profile={userProfile} 
        />
    );
};

export default ClanManagementPage;

