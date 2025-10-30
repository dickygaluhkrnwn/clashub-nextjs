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
    FirestoreDocument, // Import FirestoreDocument jika belum ada
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
    RaidArchive,      // Tipe untuk Arsip Raid
    WarArchive,       // Tipe untuk Arsip War
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
// FUNGSI HELPER BARU
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
        // Jika value adalah null dan kita ingin menyimpannya, tambahkan kondisi khusus di sini jika perlu
        // else if (key === 'clanId' && data[key] === null) { cleaned[key] = null; } // Contoh

        // --- PERBAIKAN: Izinkan null secara eksplisit untuk currentWar dan currentRaid ---
        else if ((key === 'currentWar' || key === 'currentRaid') && data[key] === null) {
             cleaned[key] = null;
        }

    }
    return cleaned;
}

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
        const rawClanTag = managedClan.tag;
        const encodedClanTag = encodeURIComponent(
            rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`
        );

        console.log(`[SYNC START] Fetching API data for clan: ${rawClanTag}`);

        // Parallel fetch data dari CoC API dan Firestore
        const [clanData, warLogResponse, currentWarData, roleLogs, cwlArchives, raidLogData, allUsersSnapshot] = await Promise.all([
            cocApi.getClanData(encodedClanTag),
            cocApi.getClanWarLog(encodedClanTag), 
            cocApi.getClanCurrentWar(encodedClanTag, rawClanTag),
            getRoleLogsByClanId(clanId),
            getCwlArchivesByClanId(clanId), 
            Promise.resolve(null as CocRaidLog | null) // Placeholder Raid
                .catch(err => { console.warn(`Failed to fetch Raid Log for ${rawClanTag}:`, err); return null; }), 
             
             // BARU: Ambil semua UserProfile (Admin SDK) untuk auto-link
             adminFirestore.collection(COLLECTIONS.USERS)
                .where('isVerified', '==', true) // Hanya perlu yang terverifikasi Clashub
                .where('clanTag', '==', rawClanTag) // Filter berdasarkan tag klan yang sama
                .get(),
        ]);
        
        // Konversi snapshot user ke array yang mudah diakses
        allUserProfiles = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirestoreDocument<UserProfile>[];


        const currentMembersApi = (clanData.memberList || []) as CocMember[];
        const memberCountActual = currentMembersApi.length;


        // 4. Hitung Metrik Partisipasi & Top Performers (Logika dipertahankan)
        // ... (Logika Partisipasi dan Top Performers yang sudah Anda berikan) ...
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
            currentWar: (currentWarData?.state === 'inWar' || currentWarData?.state === 'preparation') ? currentWarData : null,
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
        
        // c. AUTO-LINK PROFIL ANGGOTA CLASHUB (Perbaikan Utama)
        let linkedMemberCount = 0;
        
        // Iterasi anggota yang ada di CoC API
        currentMembersApi.forEach(cocMember => {
            // Cari UserProfile Clashub yang match berdasarkan tag
            const clashubProfile = allUserProfiles.find(p => p.playerTag === cocMember.tag);

            if (clashubProfile) {
                 // Jika ditemukan UserProfile terverifikasi, update field clanId/clanName/role
                 const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(clashubProfile.id);
                 
                 const newClashubRole = mapCocRoleToClashubRole(cocMember.role);

                 const userUpdateData: Partial<UserProfile> = {
                     // Tautkan ke ManagedClan ID
                     clanId: clanId, 
                     clanName: managedClan!.name, // Gunakan nama ManagedClan
                     // Perbarui role internal Clashub
                     role: newClashubRole, 
                     // Perbarui role CoC (hanya untuk log/display di profil)
                     clanRole: cocMember.role as unknown as ClanRole, 
                 };
                 
                 // Gunakan set dengan merge: true untuk memastikan field lain tidak terhapus
                 batch.set(userRef, cleanDataForAdminSDK(userUpdateData), { merge: true });
                 linkedMemberCount++;
            }
            // Catatan: Jika clashubProfile tidak ditemukan, biarkan (akun CoC ada tapi belum terdaftar di Clashub)
        });
        
        console.log(`[SYNC AUTO-LINK] Successfully found and updated ${linkedMemberCount} verified members in roster.`);


        // d. Simpan Arsip War Classic (Logika dipertahankan)
        const warArchivesRef = managedClanRef.collection('warArchives');
        let archivedWarCount = 0;
        if (warLogResponse?.items && Array.isArray(warLogResponse.items)) {
            warLogResponse.items.forEach((warEntry: CocWarLogEntry) => {
                 // ... (Logika arsip War Classic) ...
                const warEndTime = new Date(warEntry.endTime);
                if (!isNaN(warEndTime.getTime()) && warEntry.result) {
                    const opponentTag = warEntry.opponent?.tag;
                    if (!opponentTag) { return; }
                    const warId = `${opponentTag.replace('#', '')}-${warEndTime.toISOString()}`;
                    const archiveDocRef = warArchivesRef.doc(warId);

                    // --- PERBAIKAN LOGIKA PENGARSIPAN WAR CLASSIC ---
                    // Buat objek baru berdasarkan warEntry, tambahkan state dan field kustom
                    // Tipe Omit sekarang didasarkan pada tipe WarArchive yang (diasumsikan) sudah benar
                    const warArchiveData: Omit<WarArchive, 'id' | 'clanTag' | 'warEndTime'> = {
                        // Salin semua properti dari CocWarLogEntry (warEntry)
                        ...warEntry,
                        
                        // Tambahkan/Timpa properti kustom WarArchive
                        state: 'warEnded',
                        // startTime tidak ada di CocWarLogEntry, jadi biarkan undefined (akan dihapus oleh cleanData)
                        startTime: undefined, 
                    };
                    // --- AKHIR PERBAIKAN ---

                    batch.set(archiveDocRef, cleanDataForAdminSDK({
                        ...warArchiveData,
                        clanTag: rawClanTag, 
                        warEndTime: warEndTime 
                    }), { merge: true }); 
                    archivedWarCount++;
                }
            });
        }
        
        // e. Simpan Arsip Raid (Logika dipertahankan)
        let archivedRaid = false;
        if (raidLogData && raidLogData.state === 'ended') {
            // ... (Logika arsip Raid) ...
            const raidArchivesRef = managedClanRef.collection('raidArchives');
            const raidEndTime = new Date(raidLogData.endTime);
            if (!isNaN(raidEndTime.getTime())) {
                 const raidId = `${rawClanTag.replace('#', '')}-${raidEndTime.toISOString()}`;
                 const archiveDocRef = raidArchivesRef.doc(raidId);
                 
                 const raidArchiveData: Omit<RaidArchive, 'id'|'clanTag'> = {
                     raidId: raidId, 
                     startTime: new Date(raidLogData.startTime),
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
                 batch.set(archiveDocRef, cleanDataForAdminSDK({
                     ...raidArchiveData,
                     clanTag: rawClanTag 
                 }), { merge: true }); 
                 archivedRaid = true;
            }
        }
        
        // f. Arsip CWL Sementara (Logika dipertahankan)
        if (currentWarData?.warTag && currentWarData.state === 'warEnded') {
            // ... (Logika arsip CWL Sementara) ...
            const warEndTime = new Date(currentWarData.endTime);
            if (!isNaN(warEndTime.getTime()) && currentWarData.opponent?.tag) {
                const opponentTag = currentWarData.opponent.tag;
                const warId = `CWL-${opponentTag.replace('#', '')}-${warEndTime.toISOString()}`; 
                const archiveDocRef = warArchivesRef.doc(warId); 

                const cwlWarArchiveData: Omit<WarArchive, 'id'|'clanTag'|'warEndTime'> = {
                    state: 'warEnded',
                    teamSize: currentWarData.teamSize,
                    clan: currentWarData.clan, 
                    opponent: currentWarData.opponent, 
                    startTime: currentWarData.startTime,
                    endTime: currentWarData.endTime,
                    result: currentWarData.result,
                };

                 batch.set(archiveDocRef, cleanDataForAdminSDK({
                    ...cwlWarArchiveData,
                    clanTag: rawClanTag,
                    warEndTime: warEndTime
                 }), { merge: true });
                 archivedWarCount++; 
            }
        }


        // Eksekusi Batch
        try {
            await batch.commit();
            console.log(`[SYNC FIRESTORE] Batch commit successful for clan ${rawClanTag}. Linked ${linkedMemberCount} members. Archived ${archivedWarCount} wars, ${archivedRaid ? 1 : 0} raids.`);
        } catch (batchError) {
            console.error(`[SYNC FIRESTORE] Batch commit FAILED for clan ${rawClanTag}:`, batchError);
            throw new Error(`Batch commit failed: ${(batchError as Error).message}`);
        }


        return NextResponse.json(
            {
                message: `Managed Clan ${managedClan.name} synced successfully. Linked ${linkedMemberCount} verified members.`,
                syncedAt: now,
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

