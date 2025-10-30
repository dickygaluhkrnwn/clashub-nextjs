import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';
// HAPUS import fungsi read client-side dari '@/lib/firestore';
// import { getUserProfile, getManagedClanData, getClanApiCache, getJoinRequests, getTeamMembers } from '@/lib/firestore';

// BARU: Import fungsi-fungsi READ dari Admin SDK yang sesuai
import {
    getUserProfileAdmin,      // <-- Menggantikan getUserProfile
    getManagedClanDataAdmin,  // <-- Menggantikan getManagedClanData
    getClanApiCacheAdmin,     // <-- Menggantikan getClanApiCache
    getJoinRequestsAdmin,     // <-- Menggantikan getJoinRequests
    getTeamMembersAdmin,      // <-- Menggantikan getTeamMembers
    getCwlArchivesByClanId,   // Sudah Admin SDK
    getRaidArchivesByClanId,  // Sudah Admin SDK
} from '@/lib/firestore-admin'; 

import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, CwlArchive, RaidArchive } from '@/lib/types'; 
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

    // GANTI: Gunakan getUserProfileAdmin dari Admin SDK untuk menghindari Permission Denied
    const userProfile = await getUserProfileAdmin(sessionUser.uid);
    let clanData: ClanManagementProps['clan'] | null = null;
    let cacheData: ClanManagementProps['cache'] | null = null;
    let requestsData: ClanManagementProps['joinRequests'] = [];
    let membersData: ClanManagementProps['members'] = [];
    let cwlArchivesData: ClanManagementProps['cwlArchives'] = [];
    let raidArchivesData: ClanManagementProps['raidArchives'] = []; // BARU: Inisialisasi data Raid
    let serverError: string | null = null;

    // 2. Validasi Status Verifikasi dan Penautan Klan
    const userClanId = userProfile?.clanId;

    // --- PERBAIKAN LOGIKA AKSES ---
    // Sekarang hanya cek verifikasi dan apakah klan sudah ditautkan.
    if (!userProfile?.isVerified || !userClanId) {
        serverError =
            'Akses Ditolak: Anda harus terverifikasi dan menautkan akun Clash of Clans Anda ke klan yang dikelola untuk mengakses halaman ini.';

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

    // 3. Ambil semua data secara paralel menggunakan ADMIN SDK
    try {
        const [
            managedClan,
            apiCache,
            joinRequests,
            teamMembers,
            cwlArchives,
            raidArchives 
        ] = await Promise.all([
            // GANTI: Gunakan Admin SDK
            getManagedClanDataAdmin(clanId), 
            getClanApiCacheAdmin(clanId),
            getJoinRequestsAdmin(clanId),
            getTeamMembersAdmin(clanId),
            // Dua fungsi ini sudah diimpor dan dijalankan dengan Admin SDK di file lama
            getCwlArchivesByClanId(clanId), 
            getRaidArchivesByClanId(clanId) 
        ]);

        if (managedClan) {
            // NOTE: data di sini sudah berupa ManagedClan | null
            clanData = managedClan as ManagedClan;
            cacheData = apiCache;
            requestsData = joinRequests;
            membersData = teamMembers;
            cwlArchivesData = cwlArchives;
            raidArchivesData = raidArchives; 

        } else {
            serverError =
                'Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.';
        }
    } catch (error) {
        // Pengecekan tambahan jika userProfile tiba-tiba null (meski seharusnya sudah ditangani)
        if (!userProfile) {
            serverError = 'Profil pengguna tidak ditemukan atau sesi terputus. Silakan coba login ulang.';
        } else {
            console.error('Server Error: Failed to load comprehensive clan data:', error);
            serverError = 'Gagal memuat data dashboard klan. Coba muat ulang halaman.';
        }
    }

    // 4. Meneruskan data lengkap ke Client Component
    return (
        <ManageClanClient
            initialData={clanData && userProfile ? {
                clan: clanData,
                cache: cacheData,
                joinRequests: requestsData,
                members: membersData,
                // Pastikan profile yang dikirim ke client adalah UserProfile Admin yang sudah bersih
                profile: userProfile, 
                cwlArchives: cwlArchivesData,
                raidArchives: raidArchivesData,
            } : null}
            serverError={serverError}
            // Pastikan profile yang dikirim adalah UserProfile (dari Admin SDK read)
            profile={userProfile || ({} as UserProfile)} 
        />
    );
};

export default ClanManagementPage;
