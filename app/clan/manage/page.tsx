// File: app/clan/manage/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';

// BARU: Import fungsi-fungsi READ dari Admin SDK yang sesuai
import {
    getUserProfileAdmin,      // <-- Menggantikan getUserProfile
    getManagedClanDataAdmin,  // <-- Menggantikan getManagedClanData
    getClanApiCacheAdmin,     // <-- Menggantikan getClanApiCache
    getJoinRequestsAdmin,     // <-- Menggantikan getJoinRequests
    getTeamMembersAdmin,      // <-- Menggantikan getTeamMembers
    getCwlArchivesByClanId,   // Sudah Admin SDK
    getRaidArchivesByClanId,  // Sudah Admin SDK
    FirestoreDocument,        // Import FirestoreDocument
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
// CATATAN: Semua properti Date di tipe ini akan diubah menjadi string di Server Component (RSC)
// sebelum diteruskan ke Client Component.
export interface ClanManagementProps {
    clan: ManagedClan; // Mengandung Date (lastSynced)
    cache: ClanApiCache | null; // Mengandung Date (lastUpdated)
    joinRequests: JoinRequest[]; // Mengandung Date (timestamp)
    members: UserProfile[]; // Mengandung Date (lastVerified)
    profile: UserProfile; // Mengandung Date (lastVerified)
    cwlArchives: CwlArchive[]; // Mengandung Date (di rounds-nya, sudah diubah string di firestore-admin.ts)
    raidArchives: RaidArchive[]; // Mengandung Date (startTime, endTime)
}

// =========================================================================
// HELPER: DATE SERIALIZATION
// =========================================================================

/**
 * Helper untuk mengubah objek Date di properti tingkat atas menjadi string ISO
 * untuk serialisasi yang aman saat meneruskan data dari Server ke Client Component.
 * Ini juga akan mengatasi properti Date/Timestamp yang terlewat.
 * @param obj Data input yang mungkin berisi objek Date.
 * @returns Objek yang identik dengan semua Date diubah menjadi string ISO.
 */
function serializeDates(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Khusus untuk Array
    if (Array.isArray(obj)) {
        return obj.map(item => serializeDates(item));
    }

    // Khusus untuk Objek
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value instanceof Date) {
                newObj[key] = value.toISOString(); // Konversi Date ke string ISO
            } else if (typeof value === 'object' && value !== null) {
                // Rekursif untuk objek bersarang (misal: di dalam cache/cwl/raid)
                newObj[key] = serializeDates(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
}

// =========================================================================
// SERVER COMPONENT UTAMA
// =========================================================================

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

    const userProfile = await getUserProfileAdmin(sessionUser.uid);
    let clanData: ClanManagementProps['clan'] | null = null;
    let cacheData: ClanManagementProps['cache'] | null = null;
    let requestsData: ClanManagementProps['joinRequests'] = [];
    let membersData: ClanManagementProps['members'] = [];
    let cwlArchivesData: ClanManagementProps['cwlArchives'] = [];
    let raidArchivesData: ClanManagementProps['raidArchives'] = []; 
    let serverError: string | null = null;

    // 2. Validasi Status Verifikasi dan Penautan Klan
    const userClanId = userProfile?.clanId;

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
            getManagedClanDataAdmin(clanId), 
            getClanApiCacheAdmin(clanId),
            getJoinRequestsAdmin(clanId), // FIX: Sudah tanpa orderBy di firestore-admin.ts
            getTeamMembersAdmin(clanId),
            getCwlArchivesByClanId(clanId), 
            getRaidArchivesByClanId(clanId) 
        ]);

        if (managedClan) {
            clanData = managedClan as ManagedClan;
            cacheData = apiCache;
            requestsData = joinRequests as FirestoreDocument<JoinRequest>[];
            membersData = teamMembers as UserProfile[];
            cwlArchivesData = cwlArchives as CwlArchive[];
            raidArchivesData = raidArchives as RaidArchive[]; 

        } else {
            serverError =
                'Data klan terkelola tidak ditemukan di Firestore. Mungkin terjadi kesalahan penautan.';
        }
    } catch (error) {
        if (!userProfile) {
            serverError = 'Profil pengguna tidak ditemukan atau sesi terputus. Silakan coba login ulang.';
        } else {
            console.error('Server Error: Failed to load comprehensive clan data:', error);
            // Menangkap error index Firestore dari getJoinRequestsAdmin di sini
            serverError = 'Gagal memuat data dashboard klan. Coba muat ulang halaman. (Detail: ' + (error instanceof Error ? error.message.split('\n')[0] : 'Unknown Error') + ')';
        }
    }

    // 4. Meneruskan data lengkap ke Client Component
    let initialDataProps = null;
    if (clanData && userProfile) {
        // PERBAIKAN KRITIS: SERIALISASI DATA SEBELUM DIKIRIM KE CLIENT
        initialDataProps = serializeDates({
            clan: clanData,
            cache: cacheData,
            joinRequests: requestsData,
            members: membersData,
            profile: userProfile, 
            cwlArchives: cwlArchivesData,
            raidArchives: raidArchivesData,
        });
    }

    return (
        <ManageClanClient
            // Menggunakan data yang sudah diserialisasi
            initialData={initialDataProps}
            serverError={serverError}
            profile={userProfile || ({} as UserProfile)} 
        />
    );
};

export default ClanManagementPage;
