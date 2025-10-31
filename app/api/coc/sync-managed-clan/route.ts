// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route untuk menyinkronkan data ManagedClan internal dengan API CoC.
// Dipanggil secara manual (oleh manager) atau otomatis (oleh Cron Job).

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
    getWarArchivesByClanId, // <-- [BARU] Impor fungsi deduplikasi
    FirestoreDocument, // Import FirestoreDocument jika belum ada
    // getClanApiCacheAdmin // <-- Dihapus, tidak perlu pre-fetch cache
} from '@/lib/firestore-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // Import Admin Timestamp
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import {
    ManagedClan,
    ClanApiCache,
    CocMember,
    CocWarLog,       // Tipe dari CoC API Wrapper
    CocWarLogEntry, // Tipe spesifik untuk War Log Item
    UserProfile,
    ClanRole,
    TopPerformerPlayer, // Tipe untuk Top Performers
    CocRaidLog,       // Tipe untuk Raid Log API
    RaidArchive,       // Tipe untuk Arsip Raid
    WarArchive,        // Tipe untuk Arsip CWL
    CwlArchive,        // Tipe untuk Arsip CWL
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
// --- [BARU] Tambahkan toleransi waktu untuk pencocokan data migrasi ---
const MIGRATION_TIME_TOLERANCE_MS = 1000 * 60 * 10; // Toleransi 10 menit

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
        // --- PERBAIKAN: Izinkan null secara eksplisit untuk currentWar dan currentRaid ---
        else if ((key === 'currentWar' || key === 'currentRaid') && data[key] === null) {
            cleaned[key] = null;
        }

    }
    return cleaned;
}

// [DIHAPUS] Fungsi parseCocDate dipindahkan ke lib/th-utils.ts

/**
 * @function getWarArchiveId
 * Fungsi untuk membuat ID War yang konsisten.
 * @param opponentTag Tag klan lawan.
 * @param endTime Objek Date waktu selesai war.
 * @param isDetailArchive Apakah ini arsip detail (gunakan presisi detik).
 * @returns ID unik arsip.
 */
const getWarArchiveId = (opponentTag: string, endTime: Date, isDetailArchive: boolean = false): string => {
    // Presisi menit (YYYY-MM-DDTHH:MM) untuk Summary lama
    let standardizedTime = endTime.toISOString().substring(0, 16); 
    
    if (isDetailArchive) {
        // Presisi detik (YYYY-MM-DDTHH:MM:SS) untuk Detail baru (War Ended)
        standardizedTime = endTime.toISOString().substring(0, 19); 
    }
    
    const safeOpponentTag = opponentTag.replace(/[^a-zA-Z0-9]/g, '');
    return `${safeOpponentTag}-${standardizedTime}`; 
};
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
            currentWarData, 
            roleLogs, 
            cwlArchives, 
            raidLogData, 
            allUsersSnapshot,
            existingWarArchives // <-- [PENTING] Ini adalah data yang sudah ada (termasuk migrasi)
        ] = await Promise.all([
            cocApi.getClanData(encodedClanTag),
            cocApi.getClanWarLog(encodedClanTag), 
            cocApi.getClanCurrentWar(encodedClanTag, rawClanTag), // <- Sumber data detail
            getRoleLogsByClanId(clanId),
            getCwlArchivesByClanId(clanId), 
            Promise.resolve(null as CocRaidLog | null)
                .catch(err => { console.warn(`Failed to fetch Raid Log for ${rawClanTag}:`, err); return null; }), 
            
            // BARU: Ambil semua UserProfile (Admin SDK) untuk auto-link
            adminFirestore.collection(COLLECTIONS.USERS)
                .where('isVerified', '==', true) 
                .where('clanTag', '==', rawClanTag) 
                .get(),
            
            getWarArchivesByClanId(clanId) 
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
        
        // --- [PERBAIKAN] LOGIKA PENYIMPANAN WAR DISERAHKAN ---
        // Logic retensi 12 jam dipindahkan ke page.tsx.
        // API Sync HANYA menyimpan data mentah yang didapat dari API CoC.
        
        let warToCache: CocWarLog | null = null;
        
        if (currentWarData) {
            const state = currentWarData.state;
            
            if (state === 'inWar' || state === 'preparation' || state === 'warEnded') {
                // [KASUS 1, 2]: War AKTIF / PERSIAPAN / ENDED (dari API)
                warToCache = currentWarData;
                console.log(`[SYNC CACHE] Storing API War data (State: ${state}).`);
            }
            // (Jika state lain, warToCache tetap null)
        } else {
             // [KASUS 3]: API mengembalikan null (notInWar)
             warToCache = null;
             console.log(`[SYNC WAR] API returned 'notInWar'. Storing null.`);
        }

        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            // FIX: Menggunakan warToCache yang sudah disederhanakan
            currentWar: warToCache, 
            currentRaid: raidLogData || null, 
            members: participationMembers,
            topPerformers: topPerformersData, 
        };

        // --- AKHIR PERBAIKAN LOGIKA ---

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

        // a. Update Cache
        const cacheRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS).doc(clanId)
            .collection('clanApiCache').doc('current');
        const cachePayload = { ...newCacheData, id: 'current', lastUpdated: now };
        batch.set(cacheRef, cleanDataForAdminSDK(cachePayload));


        // b. Update Metadata ManagedClan
        const managedClanRef = adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId);
        const clanUpdatePayload = cleanDataForAdminSDK({ ...updatedManagedClanFields, lastSynced: now });
        if (Object.keys(clanUpdatePayload).length > 0) {
            batch.update(managedClanRef, clanUpdatePayload);
        }
        
        // c. AUTO-LINK PROFIL ANGGOTA CLASHUB
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
        // --- LOGIKA PENGARSIPAN WAR (HYBRID) ---
        // =========================================================================

        // --- PERBAIKAN LOGIKA ANTI-DUPLIKASI (Bagian 1) ---
        // Buat Set (peta) dari ID arsip yang *dihasilkan oleh skrip ini* (Format Sinkronisasi)
        const generatedWarIds = new Set<string>();
        // Buat Peta (Map) dari arsip migrasi (Format Migrasi) untuk pencocokan semantik
        const migrationWarMap = new Map<string, FirestoreDocument<WarArchive>>();
        
        // --- [PERBAIKAN V6] ---
        // Set ini akan melacak ID arsip yang *sudah memiliki detail* (baik dari migrasi V4 atau dari update V6)
        // Kunci: "OpponentTag-YYYY-MM-DD"
        const detailedWarKeys = new Set<string>();

        existingWarArchives.forEach(war => {
            const opponentTag = war.opponent?.tag || '#UNKNOWN';
            const endTime = war.warEndTime; // Ini adalah Date object
            
            // Hanya proses jika endTime valid
            if (endTime && !isNaN(endTime.getTime())) {
                const semanticKey = `${opponentTag}-${endTime.toISOString().substring(0, 10)}`;
                
                // (ID Format Migrasi: #2G8PU0GLJ-20251030-BLACKLIST)
                if (war.id.startsWith(rawClanTag)) {
                    if (!migrationWarMap.has(semanticKey)) {
                        migrationWarMap.set(semanticKey, war);
                    }
                } else {
                    // (ID Format Sinkronisasi: BLACKLIST-2025-10-30T10:00:00)
                    const isDetail = war.hasDetails || !!war.members;
                    const generatedId = getWarArchiveId(opponentTag, endTime, isDetail);
                    generatedWarIds.add(generatedId);
                }

                // [PERBAIKAN V6] Jika arsip ini (format apapun) memiliki detail, tandai kuncinya
                if (war.hasDetails === true) {
                    detailedWarKeys.add(semanticKey);
                }
            }
        });
        console.log(`[SYNC DE-DUPE] Loaded ${generatedWarIds.size} sync IDs, ${migrationWarMap.size} migration candidates, and ${detailedWarKeys.size} known detailed wars.`);
        // --- AKHIR PERBAIKAN (Bagian 1) ---
        

        const warArchivesRef = managedClanRef.collection('warArchives');
        let archivedWarCount = 0;
        
        // --- [LANGKAH 1: Arsipkan Data DETAIL dari currentWar] ---
        if (warToCache && warToCache.state === 'warEnded') {
            const warEndTime = parseCocDate(warToCache.endTime);
            
            if (warEndTime && !isNaN(warEndTime.getTime()) && warToCache.opponent?.tag) {
                const opponentTag = warToCache.opponent.tag;
                const warEndTimeMs = warEndTime.getTime();
                
                // Definisikan data payload detail satu kali
                const warArchiveData: Omit<WarArchive, 'id'|'clanTag'|'warEndTime'> = {
                    state: 'warEnded',
                    teamSize: warToCache.teamSize,
                    clan: warToCache.clan,
                    opponent: warToCache.opponent,
                    startTime: warToCache.startTime, 
                    endTime: warToCache.endTime,
                    result: warToCache.result,
                    preparationStartTime: warToCache.preparationStartTime,
                    attacksPerMember: warToCache.attacksPerMember,
                    members: warToCache.members, // Menyimpan detail attacks
                };

                // --- PERBAIKAN BARU (Mencari duplikat migrasi) ---
                // Buat kunci pencarian semantik
                const semanticKey = `${opponentTag}-${warEndTime.toISOString().substring(0, 10)}`;
                const matchingMigrationDoc = migrationWarMap.get(semanticKey);
                let migrationMatchFound = false;

                if (matchingMigrationDoc) {
                    // Jika kunci tanggal ditemukan, cek toleransi waktu
                    const archiveEndTime = matchingMigrationDoc.warEndTime; // Ini Date
                    const timeDiff = Math.abs(archiveEndTime.getTime() - warEndTimeMs);
                    
                    // --- PERBAIKAN V5: Logika Anti-Duplikasi ---
                    // Cek: Apakah tag lawan cocok, waktunya dalam toleransi, 
                    // DAN ID-nya adalah format migrasi (dimulai dengan #TAGKLAN)?
                    // Kita TIDAK LAGI peduli dengan status !hasDetails.
                    if (timeDiff < MIGRATION_TIME_TOLERANCE_MS && matchingMigrationDoc.id.startsWith(rawClanTag)) {
                        migrationMatchFound = true;
                        
                        // --- KASUS A: DITEMUKAN DUPLIKAT MIGRASI ---
                        // Kita *memperbarui* dokumen migrasi yang ada.
                        console.log(`[SYNC ARCHIVE-UPDATE] Found matching migration doc (ID: ${matchingMigrationDoc.id}). Updating with details...`);
                        
                        const archiveDocRef = warArchivesRef.doc(matchingMigrationDoc.id); 

                        batch.update(archiveDocRef, cleanDataForAdminSDK({
                            ...warArchiveData,
                            clanTag: rawClanTag,
                            startTime: parseCocDate(warToCache.startTime), // Konversi ke Date
                            warEndTime: warEndTime, // Konversi ke Date
                            hasDetails: true // <-- Ini yang paling penting
                        }));
                        
                        archivedWarCount++; 
                        detailedWarKeys.add(semanticKey); // [PERBAIKAN V6] Tandai bahwa kunci ini sekarang punya detail
                    }
                }
                // --- AKHIR PERBAIKAN V5 ---

                const warId_SyncFormat = getWarArchiveId(opponentTag, warEndTime, true); // "Sync Format" ID

                if (!migrationMatchFound && !generatedWarIds.has(warId_SyncFormat)) { 
                    // --- KASUS B: TIDAK ADA DUPLIKAT (PERANG BARU) ---
                    console.log(`[SYNC ARCHIVE-DETAIL] New war found (ID: ${warId_SyncFormat}). Archiving with details...`);
                    const archiveDocRef = warArchivesRef.doc(warId_SyncFormat); 

                    batch.set(archiveDocRef, cleanDataForAdminSDK({
                        ...warArchiveData,
                        clanTag: rawClanTag,
                        startTime: parseCocDate(warToCache.startTime),
                        warEndTime: warEndTime,
                        hasDetails: true
                    }), { merge: true });
                    
                    archivedWarCount++; 
                    generatedWarIds.add(warId_SyncFormat); // Tambahkan ID baru ke Set
                    detailedWarKeys.add(semanticKey); // [PERBAIKAN V6] Tandai bahwa kunci ini sekarang punya detail
                    console.log(`[SYNC ARCHIVE-DETAIL] War successfully archived with ID: ${warId_SyncFormat}`);
                } else if (!migrationMatchFound) {
                    // --- KASUS C: DUPLIKAT "SYNC FORMAT" DITEMUKAN ---
                    console.log(`[SYNC ARCHIVE-DETAIL] War ID (Sync Format): ${warId_SyncFormat} already exists. Skipping.`);
                }
            }
        }

        // --- [LANGKAH 2: Arsipkan Data SUMMARY dari warLog] ---
        if (warLogResponse?.items && Array.isArray(warLogResponse.items)) {
            console.log(`[SYNC ARCHIVE-SUMMARY] Checking ${warLogResponse.items.length} summary wars from API.`);
            
            warLogResponse.items.forEach((warEntry: CocWarLogEntry) => {
                const warEndTime = parseCocDate(warEntry.endTime);
                const opponentTag = warEntry.opponent?.tag;

                if (warEndTime && !isNaN(warEndTime.getTime()) && warEntry.result && opponentTag) {
                    
                    // --- PERBAIKAN LOGIKA ANTI-DUPLIKASI (Bagian 2) ---
                    // [PERBAIKAN V6] Gunakan Set 'detailedWarKeys' yang sudah kita siapkan
                    const semanticKey = `${opponentTag}-${warEndTime.toISOString().substring(0, 10)}`;
                    
                    // Cek #1: Jika kunci semantik ini sudah ditandai memiliki detail (baik dari migrasi atau dari LANGKAH 1)
                    // JANGAN buat arsip summary.
                    if (detailedWarKeys.has(semanticKey)) {
                        // console.log(`[SYNC ARCHIVE-SUMMARY] Skipping summary for ${opponentTag} (ended ${warEndTime}) because a detailed archive (migrated or synced) already exists.`);
                        return; // LEWATI (JANGAN BUAT DUPLIKAT SUMMARY)
                    }

                    // Cek #2: Cek ID yang digenerate (Format Sinkronisasi)
                    const summaryId = getWarArchiveId(opponentTag, warEndTime, false); // ID Summary (HH:MM)
                    const detailId = getWarArchiveId(opponentTag, warEndTime, true);   // ID Detail (HH:MM:SS)

                    if (generatedWarIds.has(summaryId) || generatedWarIds.has(detailId)) {
                        // console.log(`[SYNC ARCHIVE-SUMMARY] Skipping summary ID ${summaryId} because a matching generated ID already exists in Firestore.`);
                        return; // Sudah ada (dari sync sebelumnya)
                    }
                    // --- AKHIR PERBAIKAN V6 ---
                    
                    console.log(`[SYNC ARCHIVE-SUMMARY] New summary war found (ID: ${summaryId}). Archiving...`);
                    const archiveDocRef = warArchivesRef.doc(summaryId);

                    const warArchiveData: Omit<WarArchive, 'id' | 'clanTag' | 'warEndTime'> = {
                        ...warEntry,
                        state: 'warEnded',
                        preparationStartTime: undefined,
                        attacksPerMember: undefined,
                        members: undefined, 
                    };

                    batch.set(archiveDocRef, cleanDataForAdminSDK({
                        ...warArchiveData,
                        clanTag: rawClanTag, 
                        warEndTime: warEndTime,
                        hasDetails: false // <-- [PENANDA BARU]
                    }), { merge: true }); 
                    
                    archivedWarCount++; 
                    generatedWarIds.add(summaryId); // Tambahkan ID summary (menit) ke Set.
                }
            });
        }
        
        // e. Simpan Arsip Raid (Logika dipertahankan)
        let archivedRaid = false;
        if (raidLogData && raidLogData.state === 'ended') {
            const raidArchivesRef = managedClanRef.collection('raidArchives');
            const raidEndTime = parseCocDate(raidLogData.endTime);
            if (raidEndTime && !isNaN(raidEndTime.getTime())) {
                const raidId = `${rawClanTag.replace('#', '')}-${raidEndTime.toISOString()}`; 
                const archiveDocRef = raidArchivesRef.doc(raidId);
                
                const raidArchiveData: Omit<RaidArchive, 'id'|'clanTag'> = {
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
                archivedWarCount: archivedWarCount, 
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
        let errorMessage = `Sync failed for clan ${clanTagForLog}: ${
            error instanceof Error ? error.message : 'Unknown error'
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

