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
} from '@/lib/firestore-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // Import Admin Timestamp
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

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30;

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
            if (data[key] instanceof Date) {
                cleaned[key] = AdminTimestamp.fromDate(data[key] as Date);
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

/**
 * Mengonversi string tanggal CoC (YYYYMMDDTHHMMSS.mmmZ) ke objek Date yang valid.
 * @param cocDate String tanggal dari CoC API.
 * @returns Objek Date yang valid, atau Invalid Date jika format salah.
 */
function parseCocDate(cocDate: string | undefined): Date {
    // Cek ini sekarang menangani 'undefined', 'null', dan string kosong
    if (!cocDate || cocDate.length < 15) {
        return new Date(NaN); // Handle string tidak valid
    }
    
    try {
        // Input:  20251030T122129.000Z
        // Output: 2025-10-30T12:21:29.000Z (Format ISO 8601 standar)
        const year = cocDate.substring(0, 4);
        const month = cocDate.substring(4, 6);
        const day = cocDate.substring(6, 8);
        const hour = cocDate.substring(9, 11);
        const minute = cocDate.substring(11, 13);
        const second = cocDate.substring(13, 15);
        const rest = cocDate.substring(15); // .000Z

        const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${rest}`;
        
        return new Date(isoString);
    } catch (e) {
        console.error(`[parseCocDate] Failed to parse date string: ${cocDate}`, e);
        return new Date(NaN); // Kembalikan Invalid Date jika parsing gagal
    }
}

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
                : new Date(managedClan.lastSynced); 

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

        // Parallel fetch data dari CoC API dan Firestore
        const [
            clanData, 
            warLogResponse, 
            currentWarData, 
            roleLogs, 
            cwlArchives, 
            raidLogData, 
            allUsersSnapshot,
            existingWarArchives 
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
            .map(m => ({ tag: m.tag, name: m.name, value: 'Promosi', thLevel: m.townHallLevel, role: m.role as ClanRole } as TopPerformerPlayer));

        const demotions = participationMembers
            .filter(m => m.participationStatus === 'Demosi')
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

        // 5. Buat Payload Cache & ManagedClan Metadata (Logika dipertahankan)
        const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
            // Simpan data jika inWar, preparation, ATAU warEnded
            currentWar: (currentWarData?.state === 'inWar' || currentWarData?.state === 'preparation' || currentWarData?.state === 'warEnded') 
                        ? currentWarData 
                        : null,
            currentRaid: raidLogData || null, 
            members: participationMembers,
            topPerformers: topPerformersData, 
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
        // --- [PERBAIKAN UTAMA] LOGIKA PENGARSIPAN WAR (HYBRID) ---
        // =========================================================================

        // Buat Set (peta) dari ID arsip yang sudah ada untuk pengecekan cepat
        // Perhatian: ID di Set ini harus menggunakan format ID yang SAMA dengan format yang Anda gunakan untuk cek/tulis.
        const existingWarIds = new Set(existingWarArchives.map(war => {
            // War Detail Archive menggunakan ID dengan presisi detik
            // Jika War Summary (hanya punya presisi menit), kita tetap buat ID detail (detik) untuk membandingkan.
            // Namun, untuk WarSummary, kita hanya dapat memastikan ID Summary (menit) sudah ada.
            
            // Kita harus membuat ID WarDetail untuk memverifikasi apakah DETAIL sudah diarsip.
            const endTime = war.warEndTime instanceof Date 
                 ? war.warEndTime 
                 : (war.warEndTime as unknown as AdminTimestamp).toDate();
                 
            // Jika war ini sudah punya detail (seharusnya punya warTag/members), gunakan ID detail (detik)
            // Jika war ini hanya summary (war.members undefined), gunakan ID summary (menit)
            const isDetail = war.hasDetails || !!war.members;
            return getWarArchiveId(war.opponent?.tag || '', endTime, isDetail); 
        }));
        
        // Memastikan ID yang dihasilkan oleh getWarArchiveId (detik) dari WarEnded/Current War
        // akan dicocokkan dengan ID di existingWarIds.

        const warArchivesRef = managedClanRef.collection('warArchives');
        let archivedWarCount = 0;
        
        // --- [LANGKAH 1: Arsipkan Data DETAIL dari currentWar] ---
        if (currentWarData?.warTag && currentWarData.state === 'warEnded') {
            const warEndTime = parseCocDate(currentWarData.endTime);
            
            if (!isNaN(warEndTime.getTime()) && currentWarData.opponent?.tag) {
                const opponentTag = currentWarData.opponent.tag;
                // --- [PERBAIKAN: GUNAKAN isDetailArchive = true (presisi detik)] ---
                const warId = getWarArchiveId(opponentTag, warEndTime, true);
                
                // Cek apakah war DETAIL ini SUDAH diarsip (dengan ID detik)
                if (!existingWarIds.has(warId)) {
                    console.log(`[SYNC ARCHIVE-DETAIL] New war found (ID: ${warId}). Archiving with details...`);
                    const archiveDocRef = warArchivesRef.doc(warId); 

                    // Salin data DETAIL dari currentWarData
                    const warArchiveData: Omit<WarArchive, 'id'|'clanTag'|'warEndTime'> = {
                        state: 'warEnded',
                        teamSize: currentWarData.teamSize,
                        clan: currentWarData.clan,
                        opponent: currentWarData.opponent,
                        startTime: currentWarData.startTime, 
                        endTime: currentWarData.endTime,
                        result: currentWarData.result,
                        preparationStartTime: currentWarData.preparationStartTime,
                        attacksPerMember: currentWarData.attacksPerMember,
                        members: currentWarData.members, // Menyimpan detail attacks
                    };

                    batch.set(archiveDocRef, cleanDataForAdminSDK({
                        ...warArchiveData,
                        clanTag: rawClanTag,
                        startTime: parseCocDate(currentWarData.startTime),
                        warEndTime: warEndTime,
                        hasDetails: true // <-- [PENANDA BARU]
                    }), { merge: true });
                    
                    archivedWarCount++; 
                    existingWarIds.add(warId); 
                    console.log(`[SYNC ARCHIVE-DETAIL] War successfully archived with ID: ${warId}`);
                } else {
                    console.log(`[SYNC ARCHIVE-DETAIL] War ID: ${warId} already exists. Skipping.`);
                }
            }
        }

        // --- [LANGKAH 2: Arsipkan Data SUMMARY dari warLog] ---
        if (warLogResponse?.items && Array.isArray(warLogResponse.items)) {
            console.log(`[SYNC ARCHIVE-SUMMARY] Checking ${warLogResponse.items.length} summary wars from API.`);
            
            warLogResponse.items.forEach((warEntry: CocWarLogEntry) => {
                const warEndTime = parseCocDate(warEntry.endTime);
                const opponentTag = warEntry.opponent?.tag;

                if (!isNaN(warEndTime.getTime()) && warEntry.result && opponentTag) {
                    // --- [PERBAIKAN: GUNAKAN isDetailArchive = false (presisi menit)] ---
                    const warId = getWarArchiveId(opponentTag, warEndTime, false);
                    
                    // Cek lagi: Jika ID ini TIDAK ADA di 'existingWarIds'
                    if (!existingWarIds.has(warId)) {
                        // Namun, sebelum mengarsipkan Summary, kita harus memastikan ID Detail (detik)
                        // yang mungkin sama (jika sync sebelumnya gagal) juga tidak ada.
                        const potentialDetailId = getWarArchiveId(opponentTag, warEndTime, true);
                        if(existingWarIds.has(potentialDetailId)) {
                            console.log(`[SYNC ARCHIVE-SUMMARY] Skipping summary ID ${warId} because detail ID ${potentialDetailId} already exists.`);
                            return; // Skip Summary jika Detail (detik) sudah ada
                        }
                        
                        // Ini adalah war SUMMARY baru yang belum kita miliki (dengan presisi menit)
                        console.log(`[SYNC ARCHIVE-SUMMARY] New summary war found (ID: ${warId}). Archiving...`);
                        const archiveDocRef = warArchivesRef.doc(warId);

                        // Buat objek arsip HANYA dari data summary
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
                        existingWarIds.add(warId); // Tambahkan ID summary (menit) ke Set.
                    }
                }
            });
        }
        // --- [AKHIR PERBAIKAN UTAMA] ---
        

        // e. Simpan Arsip Raid (Logika dipertahankan)
        let archivedRaid = false;
        if (raidLogData && raidLogData.state === 'ended') {
            const raidArchivesRef = managedClanRef.collection('raidArchives');
            const raidEndTime = parseCocDate(raidLogData.endTime);
            if (!isNaN(raidEndTime.getTime())) {
                const raidId = `${rawClanTag.replace('#', '')}-${raidEndTime.toISOString()}`; 
                const archiveDocRef = raidArchivesRef.doc(raidId);
                
                const raidArchiveData: Omit<RaidArchive, 'id'|'clanTag'> = {
                    raidId: raidId, 
                    startTime: parseCocDate(raidLogData.startTime),
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
