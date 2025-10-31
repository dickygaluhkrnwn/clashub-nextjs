// File: app/clan/manage/page.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';

// BARU: Import fungsi-fungsi READ dari Admin SDK yang sesuai
import {
    getUserProfileAdmin,       // <-- Menggantikan getUserProfile
    getManagedClanDataAdmin,   // <-- Menggantikan getManagedClanData
    getClanApiCacheAdmin,      // <-- Menggantikan getClanApiCache
    getJoinRequestsAdmin,      // <-- Menggantikan getJoinRequests
    getTeamMembersAdmin,       // <-- Menggantikan getTeamMembers
    getCwlArchivesByClanId,    // Sudah Admin SDK
    getRaidArchivesByClanId,   // Sudah Admin SDK
    getWarArchivesByClanId, // <<< TAMBAHKAN BARIS INI
    FirestoreDocument,         // Import FirestoreDocument
} from '@/lib/firestore-admin'; 

// [PERBAIKAN LOGIKA] Import API CoC untuk fetch data live
import cocApi from '@/lib/coc-api'; 
// [PERBAIKAN LOGIKA & FIX TS2459] Import helper parsing tanggal dari th-utils
import { parseCocDate } from '@/lib/th-utils'; 

import { 
    ManagedClan, 
    ClanApiCache, 
    UserProfile, 
    JoinRequest, 
    CwlArchive, 
    RaidArchive, 
    WarArchive, // <<< TAMBAHKAN BARIS INI
    WarSummary,   // <<< TAMBAHKAN BARIS INI
    CocWarLog // <<< TAMBAHKAN BARIS INI
} from '@/lib/types'; 
import ManageClanClient from './ManageClanClient';
import React from 'react';

export const metadata: Metadata = {
    title: 'Clashub | Manajemen Klan',
    description:
        'Kelola data klan Anda, lihat status sinkronisasi, dan fitur admin lainnya.',
};

// [PERBAIKAN LOGIKA] Tambahkan konstanta retensi 12 jam
const WAR_ENDED_RETENTION_MS = 1000 * 60 * 60 * 12; // 12 Jam

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
    warHistory: WarSummary[]; // <<< TAMBAHKAN BARIS INI
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
    let warHistoryData: ClanManagementProps['warHistory'] = []; // <<< TAMBAHKAN BARIS INI
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
            raidArchives, 
            warArchives // <<< TAMBAHKAN BARIS INI
        ] = await Promise.all([
            getManagedClanDataAdmin(clanId), 
            getClanApiCacheAdmin(clanId),
            getJoinRequestsAdmin(clanId), // FIX: Sudah tanpa orderBy di firestore-admin.ts
            getTeamMembersAdmin(clanId),
            getCwlArchivesByClanId(clanId), 
            getRaidArchivesByClanId(clanId),
            getWarArchivesByClanId(clanId) // <<< TAMBAHKAN BARIS INI
        ]);

        if (managedClan) {
            clanData = managedClan as ManagedClan;
            cacheData = apiCache; // Ini bisa null
            requestsData = joinRequests as FirestoreDocument<JoinRequest>[];
            membersData = teamMembers as UserProfile[];
            cwlArchivesData = cwlArchives as CwlArchive[];
            raidArchivesData = raidArchives as RaidArchive[]; 

            // [PERBAIKAN LOGIKA] Ambil data War Aktif (Live) dan terapkan retensi
            let liveWarData: CocWarLog | null = null;
            try {
                 const rawClanTag = managedClan.tag;
                 const encodedClanTag = encodeURIComponent(rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`);
                 liveWarData = await cocApi.getClanCurrentWar(encodedClanTag, rawClanTag);
                 
                 console.log(`[ClanPage Load] Live War data state: ${liveWarData?.state || 'notInWar'}`);

                 // Terapkan Logika Retensi di sini (Server Component)
                 if (liveWarData) {
                     // [KASUS 1 & 2]: 'inWar', 'preparation', 'warEnded' (dari API)
                     // Jika API mengembalikan data (bukan null), gunakan data itu.
                     if (cacheData) {
                         cacheData.currentWar = liveWarData;
                     } else if (!cacheData) {
                         // Jika cache belum ada (sangat jarang), buat cache minimal
                         cacheData = { id: 'current', lastUpdated: new Date(), members: [], currentWar: liveWarData };
                     }
                 } else {
                     // [KASUS 3]: API mengembalikan null ('notInWar')
                     const existingCachedWar = cacheData?.currentWar;
                     
                     if (existingCachedWar && existingCachedWar.state === 'warEnded' && existingCachedWar.endTime) {
                         // Cek apakah 'endTime' adalah string (dari serialisasi) atau Date (dari cache)
                         const endTimeDate = typeof existingCachedWar.endTime === 'string' 
                             ? parseCocDate(existingCachedWar.endTime) // Gunakan parser
                             : new Date(existingCachedWar.endTime); // Asumsikan Date atau Timestamp

                         // [PERBAIKAN] Tambahkan pengecekan null untuk endTimeDate
                         if (endTimeDate && !isNaN(endTimeDate.getTime())) {
                             const timeElapsed = Date.now() - endTimeDate.getTime();
                             
                             if (timeElapsed >= WAR_ENDED_RETENTION_MS) {
                                 // [KASUS 3a]: Retensi berakhir. Hapus dari cache.
                                 if(cacheData) cacheData.currentWar = null;
                                 console.log(`[ClanPage Load] War Ended retention expired. Clearing cache.`);
                             } else {
                                 // [KASUS 3b]: Masih dalam retensi. Biarkan data 'warEnded' di cacheData.
                                 console.log(`[ClanPage Load] API notInWar, but retaining 'warEnded' from cache (Time left: ${WAR_ENDED_RETENTION_MS - timeElapsed}ms).`);
                             }
                         } else {
                            // [KASUS 3c]: endTimeDate tidak valid (null atau invalid Date)
                            if(cacheData) cacheData.currentWar = null;
                            console.warn(`[ClanPage Load] Invalid 'warEnded' endTime found in cache. Clearing cache.`);
                         }
                     } else if (existingCachedWar && (existingCachedWar.state === 'inWar' || existingCachedWar.state === 'preparation')) {
                         // [KASUS 4]: API notInWar, tapi cache masih inWar (sinkronisasi terlewat)
                         // Paksa set ke null
                         if(cacheData) cacheData.currentWar = null;
                         console.log(`[ClanPage Load] API notInWar, clearing stale '${existingCachedWar.state}' from cache.`);
                     }
                 }

            } catch (warError) {
                console.error("[ClanPage Load] Failed to fetch LIVE current war data:", warError);
                // Biarkan cacheData.currentWar apa adanya jika fetch API gagal
            }
            // --- AKHIR PERBAIKAN LOGIKA WAR ---


            // --- TAMBAHAN: Format Data WarArchive mentah menjadi WarSummary ---
            warHistoryData = (warArchives as FirestoreDocument<WarArchive>[]).map(archive => {
                // Pastikan kita memiliki data clan dan opponent
                const clanStars = archive.clan?.stars ?? 0;
                const clanDestruction = archive.clan?.destructionPercentage ?? 0;
                const opponentStars = archive.opponent?.stars ?? 0;
                const opponentDestruction = archive.opponent?.destructionPercentage ?? 0;

                return {
                    id: archive.id,
                    opponentName: archive.opponent?.name || 'Nama Lawan Tdk Diketahui',
                    teamSize: archive.teamSize,
                    result: archive.result || 'unknown',
                    ourStars: clanStars,
                    opponentStars: opponentStars,
                    ourDestruction: clanDestruction,
                    opponentDestruction: opponentDestruction,
                    // Pastikan endTime adalah objek Date yang valid
                    // [FIX TS2358] Ganti 'instanceof Date' dengan cek truthiness
                    endTime: archive.warEndTime ? new Date(archive.warEndTime) : new Date(0),
                };
            });
            // --- AKHIR TAMBAHAN ---

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
            warHistory: warHistoryData, // <<< TAMBAHKAN BARIS INI
        });
    }
    
    // [LOGGING UNTUK DEBUG] Cek apa yang dikirim ke Client
    console.log("[ClanPage Load] Data being sent to client (currentWar state):", initialDataProps?.cache?.currentWar?.state || null);


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
