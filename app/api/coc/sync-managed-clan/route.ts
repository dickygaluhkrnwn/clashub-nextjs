// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route untuk menyinkronkan data ManagedClan internal dengan API CoC.
// (VERSI DIPERBARUI - Implementasi Roadmap V5)

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Import fungsi Client SDK untuk read dan fungsi Admin SDK untuk write
import { getUserProfile, getManagedClanData } from '@/lib/firestore'; // Hanya perlu read
// FIX: Import fungsi read baru dan adminFirestore/Timestamp dari lib/firestore-admin.ts
import {
    adminFirestore, // <-- DIIMPORT SEKARANG dan DIEKSPOR dari firestore-admin.ts
    RoleChangeLog,
    getRoleLogsByClanId,
    getCwlArchivesByClanId,
    // [DIHAPUS] getWarArchivesByClanId, // <-- Dihapus, kita akan query koleksi top-level baru
    FirestoreDocument, // Import FirestoreDocument jika belum ada
    // getClanApiCacheAdmin // <-- Dihapus, tidak perlu pre-fetch cache
} from '@/lib/firestore-admin';
// [PERBAIKAN ERROR] Impor Admin Timestamp dan FieldValue
import { Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore';
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import {
    ManagedClan,
    ClanApiCache,
    CocMember,
    CocWarLog,      // Tipe dari CoC API Wrapper
    CocWarLogEntry, // Tipe spesifik untuk War Log Item
    UserProfile,
    ClanRole,
    TopPerformerPlayer, // Tipe untuk Top Performers
    CocRaidLog,       // Tipe untuk Raid Log API
    RaidArchive,      // Tipe untuk Arsip Raid
    WarArchive,       // Tipe untuk Arsip CWL
    CwlArchive,       // Tipe untuk Arsip CWL
} from '@/lib/types';
import { getAggregatedParticipationData } from './logic/participationAggregator';
// Import tipe data dari file lokal yang baru dibuat
// ClanWarLog dan CwlWarLog dari logic/types digunakan untuk input aggregator
import { ClanWarLog as AggregatorClanWarLog, CwlWarLog as AggregatorCwlWarLog } from './logic/types';
import { COLLECTIONS } from '@/lib/firestore-collections'; // Import nama koleksi
// [PERBAIKAN] Impor parseCocDate dari utilitas
import { parseCocDate } from '@/lib/th-utils';

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30;
// [DIHAPUS] Toleransi waktu migrasi tidak diperlukan lagi dengan ID baru
// const MIGRATION_TIME_TOLERANCE_MS = 1000 * 60 * 10; 

// =========================================================================
// FUNGSI HELPER BARU & PERBAIKAN ID
// =========================================================================
/**
 * Fungsi helper untuk membersihkan data sebelum disimpan ke Firestore Admin SDK.
 * Mengonversi Date ke AdminTimestamp dan menghapus undefined/null.
 */
function cleanDataForAdminSDK<T extends object>(
    data: Partial<T>
): FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> {
    const cleaned: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {};
    for (const key in data) {
        if (
            Object.prototype.hasOwnProperty.call(data, key) &&
            data[key] !== undefined &&
            data[key] !== null // Hapus null juga, kecuali diizinkan secara eksplisit
        ) {
            // [FIX TS2352/TS2358] Ganti 'instanceof Date' dengan pengecekan yang lebih aman
            if (Object.prototype.toString.call(data[key]) === '[object Date]') {
                cleaned[key] = AdminTimestamp.fromDate(data[key] as unknown as Date);
            } else {
                cleaned[key] = data[key];
            }
        }
        // --- PERBAIKAN: Izinkan null secara eksplisit untuk currentRaid ---
        else if (key === 'currentRaid' && data[key] === null) {
            cleaned[key] = null;
        }
        // TUGAS 1.1: Izinkan null secara eksplisit untuk currentWar (dikembalikan)
        else if (key === 'currentWar' && data[key] === null) {
            cleaned[key] = null;
        }

    }
    return cleaned;
}

// [DIHAPUS] Fungsi getWarArchiveId yang lama (berbasis opponentTag) dihapus.
// Kita akan membuat helper baru di dalam logika pengarsipan.
// --- AKHIR HELPER BARU & PERBAIKAN ID ---

// Helper untuk memetakan role CoC API ke Clashub Role internal
const mapCocRoleToClashubRole = (cocRole: CocMember['role']): UserProfile['role'] => {
    switch (cocRole.toLowerCase()) {
        case 'leader': return 'Leader';
        case 'coLeader': return 'Co-Leader';
        case 'admin': return 'Elder';
        case 'member': return 'Member';
        default: return 'Member'; // Default ke Member jika di klan
    }
};

// =========================================================================
// FUNGSI UTAMA API SYNC
// =========================================================================

/**
 * @function GET
 * Endpoint untuk menyinkronkan data ManagedClan internal dengan API Clash of Clans.
 */
export async function GET(request: NextRequest) {
    const clanId = request.nextUrl.searchParams.get('clanId');
    const userUid = request.headers.get('X-Request-UID'); // Untuk otorisasi manual sync

    if (!clanId) {
        return NextResponse.json(
            { error: 'Missing clanId parameter.' },
            { status: 400 }
        );
    }

    let managedClan: ManagedClan | null = null;
    let allUserProfiles: FirestoreDocument<UserProfile>[] = []; // BARU: Untuk cache UID

    try {
        // 1. Otorisasi & Ambil ManagedClan (Gunakan Client SDK untuk get)
        managedClan = await getManagedClanData(clanId);

        if (!managedClan) {
            return NextResponse.json(
                { error: 'Managed Clan not found.' },
                { status: 404 }
            );
        }

        // Cek apakah dokumen klan di Firestore memiliki field 'tag'
        if (!managedClan.tag) {
            console.error(`[SYNC FAILED] ManagedClan document (ID: ${clanId}) is missing the 'tag' field.`);
            return NextResponse.json(
                { error: `Sync failed: Your clan data in Firestore (ID: ${clanId}) is missing its 'tag'. Please correct the data.` },
                { status: 500 } // Ini error data server, 500 wajar
            );
        }

        // Cek Otorisasi (Logika Manager tetap dipertahankan)
        if (userUid) {
            const user = await getUserProfile(userUid);
            const userIsManager = user?.role === 'Leader' || user?.role === 'Co-Leader';

            if (managedClan.ownerUid !== userUid && !userIsManager) {
                return NextResponse.json(
                    { error: 'Unauthorized. Only clan managers (Leader/Co-Leader verified) can trigger manual sync.' },
                    { status: 403 }
                );
            }
        }

        // 2. Cek Stale Cache (Logika tetap dipertahankan)
        const lastSyncedDate =
            managedClan.lastSynced instanceof Date
                ? managedClan.lastSynced
                // [FIX] Arahkan ke toDate() jika ini adalah AdminTimestamp (meskipun seharusnya Date)
                : new Date((managedClan.lastSynced as any).seconds ? (managedClan.lastSynced as any).toDate() : managedClan.lastSynced);

        if (
            !userUid &&
            !isNaN(lastSyncedDate.getTime()) &&
            Date.now() - lastSyncedDate.getTime() < CACHE_STALE_MS
        ) {
            console.log(`[SYNC SKIP] Clan ${managedClan.tag} cache is fresh.`);
            return NextResponse.json(
                { message: 'Cache is fresh. Skipping full sync.' },
                { status: 200 }
            );
        }

        // 3. Ambil Data API Mentah & Data Internal Firestore
        const rawClanTag = managedClan.tag; // <-- Sekarang aman, kita sudah cek di atas
        const encodedClanTag = encodeURIComponent(
            rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`
        );

        console.log(`[SYNC START] Fetching API data for clan: ${rawClanTag}`);

        // [DIHAPUS] Pengambilan existingCurrentWar dipindahkan ke page.tsx

        // Parallel fetch data dari CoC API dan Firestore
        const [
            clanData,
            warLogResponse,
            currentWarData, // <- Sumber data detail
            roleLogs,
            cwlArchives,
            raidLogData,
            allUsersSnapshot,
            // [DIHAPUS] existingWarArchives (dari subkoleksi lama)
        ] = await Promise.all([
            cocApi.getClanData(encodedClanTag),
            cocApi.getClanWarLog(encodedClanTag),
            cocApi.getClanCurrentWar(encodedClanTag, rawClanTag),
            getRoleLogsByClanId(clanId),
            getCwlArchivesByClanId(clanId),
            Promise.resolve(null as CocRaidLog | null) // Ganti jadi cocApi.getClanRaidLog nanti
                .catch(err => { console.warn(`Failed to fetch Raid Log for ${rawClanTag}:`, err); return null; }),

            // BARU: Ambil semua UserProfile (Admin SDK) untuk auto-link
            adminFirestore.collection(COLLECTIONS.USERS)
                .where('isVerified', '==', true)
                .where('clanTag', '==', rawClanTag)
                .get(),

            // [DIHAPUS] getWarArchivesByClanId(clanId) - diganti dengan query baru nanti
        ]);

        // Konversi snapshot user ke array yang mudah diakses
        allUserProfiles = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirestoreDocument<UserProfile>[];

        const currentMembersApi = (clanData.memberList || []) as CocMember[];
        const memberCountActual = currentMembersApi.length;

        // 4. Hitung Metrik Partisipasi & Top Performers (Logika dipertahankan)
        const participationMembers: ClanApiCache['members'] =
            getAggregatedParticipationData({
                currentMembers: currentMembersApi,
                warLog: warLogResponse as unknown as AggregatorClanWarLog,
                cwlArchives: cwlArchives as unknown as AggregatorCwlWarLog[],
                roleLogs: roleLogs,
            });

        const promotions = participationMembers
            .filter(m => m.participationStatus === 'Promosi')
            // FIX TYPO: Mengganti townhallLevel menjadi townHallLevel
            .map(m => ({ tag: m.tag, name: m.name, value: 'Promosi', thLevel: m.townHallLevel, role: m.role as ClanRole } as TopPerformerPlayer));

        const demotions = participationMembers
            .filter(m => m.participationStatus === 'Demosi')
            // FIX TYPO: Mengganti townhallLevel menjadi townHallLevel
            .map(m => ({ tag: m.tag, name: m.name, value: 'Demosi', thLevel: m.townHallLevel, role: m.role as ClanRole } as TopPerformerPlayer));

        // Top Donator
        let topDonator: TopPerformerPlayer | null = null;
        if (currentMembersApi.length > 0) {
            const sortedDonators = [...currentMembersApi].sort((a, b) => b.donations - a.donations);
            if (sortedDonators[0].donations > 0) {
                const topApiDonator = sortedDonators[0];
                topDonator = {
                    tag: topApiDonator.tag,
                    name: topApiDonator.name,
                    value: topApiDonator.donations,
                    // FIX TYPO: Mengganti townhallLevel menjadi townHallLevel
                    thLevel: topApiDonator.townHallLevel,
                    role: topApiDonator.role as ClanRole
                };
            }
        }

        // Top Raid Looter
        let topRaidLooter: TopPerformerPlayer | null = null;
        if (raidLogData?.members && raidLogData.members.length > 0) {
            const sortedLooters = [...raidLogData.members].sort((a, b) => b.capitalResourcesLooted - a.capitalResourcesLooted);
            if (sortedLooters[0].capitalResourcesLooted > 0) {
                const topApiLooter = sortedLooters[0];
                const looterProfile = currentMembersApi.find(m => m.tag === topApiLooter.tag);
                topRaidLooter = {
                    tag: topApiLooter.tag,
                    name: topApiLooter.name,
                    value: topApiLooter.capitalResourcesLooted,
                    // FIX TYPO: Mengganti townhallLevel menjadi townHallLevel
                    thLevel: looterProfile?.townHallLevel,
                    role: looterProfile?.role as ClanRole
                };
            }
        }

        const topPerformersData: ClanApiCache['topPerformers'] = {
            promotions,
            demotions,
            topRaidLooter,
            topDonator,
        };

        // 5. Buat Payload Cache & ManagedClan Metadata

        // [DIHAPUS] Logika warToCache (penyimpanan di subkoleksi cache) dihapus
        // dan diganti dengan [MASALAH 2] di bawah.

        // Persiapan data untuk cache
        // TUGAS 1.1: Hapus 'currentWar' dari Omit
        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            currentRaid: raidLogData || null, // Tetap simpan raid di cache lama
            members: participationMembers,
            topPerformers: topPerformersData,
            // TUGAS 1.1: Kembalikan data war aktif ke cache
            currentWar: currentWarData || null,
        };

        const totalThLevel = currentMembersApi.reduce(
            (sum, member) => sum + member.townHallLevel,
            0
        );
        const avgTh =
            memberCountActual > 0
                ? parseFloat((totalThLevel / memberCountActual).toFixed(1))
                : 0;

        const updatedManagedClanFields: Partial<ManagedClan> = {
            logoUrl: clanData.badgeUrls.large,
            avgTh: avgTh,
            clanLevel: clanData.clanLevel,
            memberCount: memberCountActual,
        };

        // 6. Simpan ke Firestore (Cache, Metadata, Arsip & **AUTO-LINK MEMBER**)
        const batch = adminFirestore.batch();
        const now = new Date();
        const safeClanTag = rawClanTag.replace('#', ''); // ID dokumen aman

        // =========================================================================
        // --- [DIHAPUS - TUGAS 1.1] ---
        // Blok logika 'clanActiveWar' (Masalah 2 dari V4) dihapus.
        // Logika dipindahkan kembali ke cachePayload di bawah.
        // =========================================================================
        
        // a. Kelola Dokumen Perang Aktif (Koleksi BARU: clanActiveWar)
        /*
        ... (Logika V4 yang dihapus) ...
        */

        // b. Update Cache (Sekarang termasuk currentWar)
        const cacheRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS).doc(clanId)
            .collection('clanApiCache').doc('current');

        const cachePayload = {
            ...newCacheData,
            id: 'current',
            lastUpdated: now,
            // TUGAS 1.1: 'currentWar: FieldValue.delete()' DIHAPUS.
            // Data currentWar (termasuk null) sekarang ada di dalam newCacheData.
        };
        // Gunakan set + merge:true
        batch.set(cacheRef, cleanDataForAdminSDK(cachePayload), { merge: true });

        // c. Update Metadata ManagedClan (Tetap sama)
        const managedClanRef = adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId);
        const clanUpdatePayload = cleanDataForAdminSDK({ ...updatedManagedClanFields, lastSynced: now });
        if (Object.keys(clanUpdatePayload).length > 0) {
            batch.update(managedClanRef, clanUpdatePayload);
        }

        // d. AUTO-LINK PROFIL ANGGOTA CLASHUB (Tetap sama)
        let linkedMemberCount = 0;

        currentMembersApi.forEach(cocMember => {
            const clashubProfile = allUserProfiles.find(p => p.playerTag === cocMember.tag);

            if (clashubProfile) {
                const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(clashubProfile.id);
                const newClashubRole = mapCocRoleToClashubRole(cocMember.role);

                const userUpdateData: Partial<UserProfile> = {
                    clanId: clanId,
                    clanName: managedClan!.name,
                    role: newClashubRole,
                    clanRole: cocMember.role as unknown as ClanRole,
                };

                batch.set(userRef, cleanDataForAdminSDK(userUpdateData), { merge: true });
                linkedMemberCount++;
            }
        });

        console.log(`[SYNC AUTO-LINK] Successfully found and updated ${linkedMemberCount} verified members in roster.`);


        // =========================================================================
        // --- [MASALAH 1: LOGIKA PENGARSIPAN WAR (PERBAIKAN V5)] ---
        // Sesuai roadmap: Tulis data warLog DAN currentWar (jika ended) 
        // ke sub-koleksi 'managedClans/{clanId}/clanWarHistory'
        // =========================================================================

        // Helper baru untuk ID arsip, sesuai roadmap: [clanTag]-[warEndTime]
        // clanTag: #2G8PU0GLJ, endTime: Date object
        // Hasil: 2G8PU0GLJ-2025-10-30T10:00:00.000Z (Format ISO 8601 Penuh)
        const getWarHistoryId = (clanTag: string, endTime: Date): string => {
            const safeTag = clanTag.replace('#', '');
            const standardizedTime = endTime.toISOString(); // Format ISO 8601 penuh
            return `${safeTag}-${standardizedTime}`;
        };

        // Ambil data arsip yang sudah ada dari koleksi BARU (sub-koleksi)
        // TUGAS 2.1: Ubah path ke sub-koleksi
        const warHistoryCollectionRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId) // <-- TUGAS 2.1 (Path diubah ke sub-koleksi)
            .collection('clanWarHistory'); // <-- KOLEKSI BARU

        // TUGAS 2.1: Hapus filter .where()
        const existingWarArchivesSnap = await warHistoryCollectionRef
            .get(); // <-- TUGAS 2.1 (Filter .where() dihapus)

        // Buat Set dari ID yang sudah ada untuk deduplikasi
        const existingWarIds = new Set<string>();
        existingWarArchivesSnap.docs.forEach(doc => {
            existingWarIds.add(doc.id);
        });

        // TUGAS 2.1: Perbarui pesan log
        console.log(`[SYNC WAR HISTORY] Found ${existingWarIds.size} existing wars in 'managedClans/${clanId}/clanWarHistory' for clan ${rawClanTag}.`);

        let archivedWarCount = 0;

        // --- [LANGKAH 1: Arsipkan Data DETAIL dari currentWar jika 'warEnded'] ---
        // Ini adalah sumber data DENGAN DETAIL (anggota, serangan)
        if (currentWarData && currentWarData.state === 'warEnded') {
            const warEndTime = parseCocDate(currentWarData.endTime);

            // Pastikan kita punya data valid
            if (warEndTime && !isNaN(warEndTime.getTime()) && currentWarData.clan?.tag) {
                const clanTag = currentWarData.clan.tag;
                // Buat ID baru sesuai roadmap
                const warId = getWarHistoryId(clanTag, warEndTime);

                // Hanya simpan jika ID ini belum ada di database
                if (!existingWarIds.has(warId)) {
                    console.log(`[SYNC WAR HISTORY] Archiving detailed war (from currentWar): ${warId}`);

                    // [PERBAIKAN ERROR] Gunakan Omit<WarArchive, 'id'>
                    // Tipe WarArchive tidak secara eksplisit memiliki 'ourStars', 'opponentStars', dll.
                    // Kita tambahkan '& { [key: string]: any }' untuk mengatasi error TypeScript
                    const warHistoryData: Omit<WarArchive, 'id'> & { [key: string]: any } = {
                        // id: warId, // ID tidak perlu di dalam data
                        clanTag: clanTag, // Untuk query
                        warEndTime: warEndTime, // Untuk query/sort (sudah jadi Date)
                        hasDetails: true, // Penanda penting

                        // Data lengkap dari currentWar
                        state: 'warEnded',
                        teamSize: currentWarData.teamSize,
                        attacksPerMember: currentWarData.attacksPerMember,
                        clan: currentWarData.clan,
                        opponent: currentWarData.opponent,
                        startTime: parseCocDate(currentWarData.startTime), // Konversi Date
                        endTime: currentWarData.endTime, // Simpan string ISO asli
                        preparationStartTime: parseCocDate(currentWarData.preparationStartTime), // Konversi Date
                        result: currentWarData.result,
                        members: currentWarData.members, // Data detail serangan
                        
                        // --- PERBAIKAN (Tugas 3.1): Tambahkan pemetaan field untuk WarSummary ---
                        // Data DETAIL sudah memiliki ini di dalam 'clan' dan 'opponent', 
                        // tapi kita tambahkan di top level agar konsisten dengan data SUMMARY
                        ourStars: currentWarData.clan?.stars || 0,
                        ourDestruction: currentWarData.clan?.destructionPercentage || 0,
                        opponentStars: currentWarData.opponent?.stars || 0,
                        opponentDestruction: currentWarData.opponent?.destructionPercentage || 0,
                        // --- AKHIR PERBAIKAN ---
                    };

                    const docRef = warHistoryCollectionRef.doc(warId);
                    // Gunakan cleanDataForAdminSDK untuk konversi Date -> Timestamp
                    batch.set(docRef, cleanDataForAdminSDK(warHistoryData));

                    archivedWarCount++;
                    existingWarIds.add(warId); // Tambahkan ke set agar tidak diduplikasi oleh Log
                }
            }
        }

        // --- [LANGKAH 2: Arsipkan Data SUMMARY dari warLog] ---
        // Ini adalah sumber data TANPA DETAIL (hanya hasil akhir)
        if (warLogResponse?.items && Array.isArray(warLogResponse.items)) {
            console.log(`[SYNC WAR HISTORY] Checking ${warLogResponse.items.length} summary wars from API warLog.`);

            warLogResponse.items.forEach((warEntry: CocWarLogEntry) => {
                const warEndTime = parseCocDate(warEntry.endTime);
                // Kita butuh clanTag dari klan *kita* di log, bukan lawan
                const clanTag = warEntry.clan?.tag;

                if (warEndTime && !isNaN(warEndTime.getTime()) && warEntry.result && clanTag) {

                    // Buat ID baru sesuai roadmap
                    const warId = getWarHistoryId(clanTag, warEndTime);

                    // Hanya tambahkan jika ID ini BELUM ada
                    // (Baik dari sync sebelumnya, atau dari 'currentWar' di atas)
                    if (!existingWarIds.has(warId)) {
                        console.log(`[SYNC WAR HISTORY] Archiving summary war (from warLog): ${warId}`);

                        // [PERBAIKAN ERROR] Gunakan Omit<WarArchive, 'id'> & { [key: string]: any }
                        const warHistoryData: Omit<WarArchive, 'id'> & { [key: string]: any } = {
                            // id: warId,
                            clanTag: clanTag,
                            warEndTime: warEndTime, // (sudah jadi Date)
                            hasDetails: false, // Penanda penting

                            // Data summary dari warLog
                            state: 'warEnded',
                            teamSize: warEntry.teamSize,
                            clan: warEntry.clan,
                            opponent: warEntry.opponent,
                            result: warEntry.result,

                            // --- PERBAIKAN (Tugas 3.1): Tambahkan pemetaan field untuk WarSummary ---
                            ourStars: warEntry.clan?.stars || 0,
                            ourDestruction: warEntry.clan?.destructionPercentage || 0,
                            opponentStars: warEntry.opponent?.stars || 0,
                            opponentDestruction: warEntry.opponent?.destructionPercentage || 0,
                            // --- AKHIR PERBAIKAN ---

                            // Field detail di-set ke undefined
                            attacksPerMember: undefined,
                            startTime: undefined, // warLog tidak punya startTime
                            preparationStartTime: undefined,
                            endTime: warEntry.endTime, // String ISO asli
                            members: undefined,
                        };

                        const docRef = warHistoryCollectionRef.doc(warId);
                        batch.set(docRef, cleanDataForAdminSDK(warHistoryData));

                        archivedWarCount++;
                        existingWarIds.add(warId); // Tambahkan ke set
                    }
                }
            });
        }

        // --- AKHIR [MASALAH 1] ---


        // e. Simpan Arsip Raid (Logika dipertahankan, MASIH MENGGUNAKAN SUBKOLEKSI LAMA)
        // (Ini di luar scope roadmap kita saat ini, jadi biarkan apa adanya)
        let archivedRaid = false;
        if (raidLogData && raidLogData.state === 'ended') {
            const raidArchivesRef = managedClanRef.collection('raidArchives');
            const raidEndTime = parseCocDate(raidLogData.endTime);
            if (raidEndTime && !isNaN(raidEndTime.getTime())) {
                const raidId = `${rawClanTag.replace('#', '')}-${raidEndTime.toISOString()}`;
                const archiveDocRef = raidArchivesRef.doc(raidId);

                const raidArchiveData: Omit<RaidArchive, 'id' | 'clanTag'> = {
                    raidId: raidId,
                    startTime: parseCocDate(raidLogData.startTime) || undefined,
                    endTime: raidEndTime,
                    capitalTotalLoot: raidLogData.capitalTotalLoot,
                    totalAttacks: raidLogData.totalAttacks,
                    members: raidLogData.members,
                    offensiveReward: raidLogData.offensiveReward,
                    defensiveReward: raidLogData.defensiveReward,
                    enemyDistrictsDestroyed: raidLogData.enemyDistrictsDestroyed,
                    defenseLog: raidLogData.defenseLog,
                    attackLog: raidLogData.attackLog,
                };
                const existingRaidDoc = await archiveDocRef.get();
                if (!existingRaidDoc.exists) {
                    batch.set(archiveDocRef, cleanDataForAdminSDK({
                        ...raidArchiveData,
                        clanTag: rawClanTag
                    }), { merge: true });
                    archivedRaid = true;
                }
            }
        }

        // Eksekusi Batch
        try {
            await batch.commit();
            console.log(`[SYNC FIRESTORE] Batch commit successful for clan ${rawClanTag}. Linked ${linkedMemberCount} members. Archived ${archivedWarCount} new wars, ${archivedRaid ? 1 : 0} raids.`);
        } catch (batchError) {
            console.error(`[SYNC FIRESTORE] Batch commit FAILED for clan ${rawClanTag}:`, batchError);
            throw new Error(`Batch commit failed: ${(batchError as Error).message}`);
        }


        return NextResponse.json(
            {
                message: `Managed Clan ${managedClan.name} synced successfully. Linked ${linkedMemberCount} verified members. Archived ${archivedWarCount} new wars.`,
                syncedAt: now,
                archivedWarCount: archivedWarCount, // <-- Menggunakan hitungan baru
                memberCount: memberCountActual,
                topPerformers: topPerformersData,
            },
            { status: 200 }
        );
    } catch (error) {
        // Logging error yang lebih informatif
        const clanTagForLog = managedClan?.tag || `ID: ${clanId}`;
        console.error(`Error during clan sync for ${clanTagForLog}:`, error);

        // Penanganan error spesifik dari API atau Batch
        let errorMessage = `Sync failed for clan ${clanTagForLog}: ${error instanceof Error ? error.message : 'Unknown error'
            }`;
        let statusCode = 500;
        if (error instanceof Error) {
            if (error.message.startsWith('notFound')) {
                statusCode = 404;
                errorMessage = `Clan ${clanTagForLog} not found in CoC API. Cannot sync.`;
            } else if (error.message.includes('Forbidden')) {
                statusCode = 403;
                errorMessage = `Access denied (403) for clan ${clanTagForLog}. Check API Key/IP.`;
            } else if (error.message.includes('Batch commit failed')) {
                errorMessage = `API data processed for ${clanTagForLog}, but failed during Firestore batch save. ${error.message}`;
            }
        }

        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}
