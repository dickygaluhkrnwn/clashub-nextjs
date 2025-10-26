// File: lib/firestore-admin.ts
// Deskripsi: Berisi fungsi utilitas Firestore yang HANYA menggunakan Firebase Admin SDK.
// File ini hanya boleh diimpor oleh Server Components, Server Actions, atau API Routes.

import { adminFirestore } from './firebase-admin'; // Import adminFirestore
// --- PERBAIKAN: Import Timestamp langsung dari namespace firestore ---
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from './firestore-collections';
import {
    ManagedClan,
    PublicClanIndex,
    ClanApiCache,
    UserProfile,
    CocIconUrls,
    ClanRole,
} from './types';

// =========================================================================
// 0. TIPE DATA BARU
// =========================================================================

/**
 * @interface RoleChangeLog
 * Mendefinisikan struktur data untuk log perubahan role Clash of Clans.
 * Disimpan di managedClans/{clanId}/roleChanges.
 */
export interface RoleChangeLog {
    playerTag: string; // Tag pemain (CoC)
    playerName: string; // Nama pemain
    memberUid: string; // UID pengguna Clashub
    oldRoleCoC: ClanRole; // Role CoC sebelum diubah
    newRoleCoC: ClanRole; // Role CoC setelah diubah
    changedByUid: string; // UID pengguna Clashub yang melakukan perubahan (Leader/Co-Leader)
    changedAt: Date; // Timestamp perubahan
}

// Helper Type
type FirestoreDocument<T> = T & { id: string };

// Fungsi untuk membersihkan data sebelum dikirim ke Admin SDK
// --- PERBAIKAN: Gunakan tipe UpdateData dari FirebaseFirestore ---
function cleanDataForAdminSDK<T extends object>(
    data: Partial<T>
): FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> {
    const cleaned: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> =
        {};
    for (const key in data) {
        if (
            Object.prototype.hasOwnProperty.call(data, key) &&
            data[key] !== undefined
        ) {
            // Khusus untuk Date, konversi ke AdminTimestamp
            if (data[key] instanceof Date) {
                cleaned[key] = AdminTimestamp.fromDate(data[key] as Date);
            } else {
                // Konversi Enum/string/number/boolean biasa
                cleaned[key] = data[key];
            }
        }
    }
    return cleaned;
}

// =========================================================================
// FUNGSI SERVER READ UTILITY BARU (ADMIN SDK)
// =========================================================================

/**
 * Mengambil semua log perubahan role untuk Clan tertentu.
 * Digunakan untuk logika reset penalti di Aggregators.
 */
export const getRoleLogsByClanId = async (
    clanId: string
): Promise<RoleChangeLog[]> => {
    try {
        const logRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('roleChanges');

        // Mengambil semua dokumen dan mengurutkan berdasarkan waktu (terbaru di bawah, meskipun tidak terlalu penting)
        const snapshot = await logRef.orderBy('changedAt', 'desc').get();

        return snapshot.docs.map(doc => {
            const data = doc.data() as any;
            // Pastikan konversi Timestamp ke Date saat membaca
            if (data.changedAt instanceof AdminTimestamp) {
                data.changedAt = data.changedAt.toDate();
            }
            return {
                id: doc.id,
                ...data
            } as RoleChangeLog;
        });
    } catch (error) {
        console.error(`Firestore Error [getRoleLogsByClanId - Admin(${clanId})]:`, error);
        return [];
    }
};

/**
 * Mengambil semua arsip CWL (Clan War League) untuk Clan tertentu.
 * Digunakan untuk menghitung CWL Success/Fail.
 */
export const getCwlArchivesByClanId = async (clanId: string): Promise<any[]> => {
    try {
        const cwlRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            // Asumsi sub-koleksi untuk arsip CWL adalah 'cwlArchives'
            .collection('cwlArchives'); 

        // Mengambil semua dokumen arsip CWL
        const snapshot = await cwlRef.get();

        return snapshot.docs.map(doc => {
            const data = doc.data() as any;
            // Konversi Timestamp jika diperlukan (tergantung skema internal, kita asumsikan Date/Timestamp di-handle di cleanData)
            return {
                id: doc.id,
                ...data
            };
        });
    } catch (error) {
        console.error(`Firestore Error [getCwlArchivesByClanId - Admin(${clanId})]:`, error);
        return [];
    }
};


// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans) - ADMIN SDK
// =========================================================================

/**
 * Mencatat perubahan role ke sub-koleksi managedClans/{clanId}/roleChanges.
 * Dipanggil dari API Routes manajemen role.
 */
export const logRoleChange = async (
    clanId: string,
    logData: Omit<RoleChangeLog, 'changedAt'>
): Promise<void> => {
    try {
        const logRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('roleChanges');

        const payload: RoleChangeLog = {
            ...logData,
            changedAt: new Date(), // Tambahkan timestamp
        };

        await logRef.add(cleanDataForAdminSDK(payload));
        
        console.log(`[RoleLog - Admin] Role change recorded for ${logData.playerTag}.`);

    } catch (error) {
        console.error(
            `Firestore Error [logRoleChange - Admin(${clanId})]:`,
            error
        );
        throw new Error('Gagal mencatat log perubahan peran (Admin SDK).');
    }
};


/**
 * Membuat dokumen ManagedClan baru atau mengembalikan ID yang sudah ada.
 * Menggunakan Admin SDK. Dipanggil dari server (verifikasi).
 */
export const createOrLinkManagedClan = async (
    clanTag: string,
    clanName: string,
    ownerUid: string
): Promise<string> => {
    try {
        const managedClansRef = adminFirestore.collection(
            COLLECTIONS.MANAGED_CLANS
        );
        const q = managedClansRef.where('tag', '==', clanTag).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            console.log(
                `[ManagedClan - Admin] Klan ${clanTag} sudah dikelola. ID: ${snapshot.docs[0].id}`
            );
            return snapshot.docs[0].id;
        }

        // --- PERBAIKAN ERROR TIPE TS(2322) ---
        // Definisikan tipe newClanData agar sesuai dengan Omit<ManagedClan, 'id'>
        const newClanData: Omit<ManagedClan, 'id'> = {
            name: clanName,
            tag: clanTag,
            ownerUid: ownerUid,
            vision: 'Kompetitif',
            recruitingStatus: 'Open',
            website: undefined,
            discordId: undefined,
            logoUrl: undefined,
            avgTh: 0,
            clanLevel: 0,
            memberCount: 0,
            lastSynced: new Date(), // Gunakan new Date() di sini
        };
        // --- AKHIR PERBAIKAN ---

        const cleanedData = cleanDataForAdminSDK(newClanData);
        const docRef = await managedClansRef.add(cleanedData);
        // Perbaikan kecil: Pastikan 'id' benar-benar ditambahkan ke dokumen setelah dibuat
        // Ini lebih aman dilakukan dengan update terpisah atau set dengan merge
        await docRef.set({ id: docRef.id }, { merge: true });

        console.log(
            `[ManagedClan - Admin] Klan baru dibuat: ${clanName} (${docRef.id})`
        );
        return docRef.id;
    } catch (error) {
        console.error(
            `Firestore Error [createOrLinkManagedClan - Admin(${clanTag})]:`,
            error
        );
        throw new Error('Gagal membuat atau menautkan klan yang dikelola (Admin SDK).');
    }
};

/**
 * Memperbarui cache API klan dan metadata klan utama.
 * Menggunakan Admin SDK. Dipanggil dari server (sinkronisasi).
 */
export const updateClanApiCache = async (
    clanId: string,
    cacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'>,
    updatedManagedClanFields: Partial<ManagedClan>
): Promise<void> => {
    try {
        const batch = adminFirestore.batch();
        const cacheRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('clanApiCache')
            .doc('current');
        const managedClanRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId);

        const cachePayload = {
            ...cacheData,
            id: 'current',
            lastUpdated: AdminTimestamp.now(), // Langsung AdminTimestamp karena ClanApiCache tidak butuh Date
        };
        // Gunakan cleanDataForAdminSDK juga untuk cache (meskipun lastUpdated sudah Timestamp)
        batch.set(cacheRef, cleanDataForAdminSDK(cachePayload));

        const clanUpdatePayload = cleanDataForAdminSDK({
            ...updatedManagedClanFields,
            lastSynced: new Date(), // Gunakan new Date(), cleanData akan konversi
        });
        if (Object.keys(clanUpdatePayload).length > 0) {
            batch.update(managedClanRef, clanUpdatePayload);
        }

        await batch.commit();
    } catch (error) {
        console.error(
            `Firestore Error [updateClanApiCache - Admin(${clanId})]:`,
            error
        );
        throw new Error('Gagal menyimpan cache API klan (Admin SDK).');
    }
};

// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex) - ADMIN SDK
// =========================================================================

/**
 * Memperbarui atau membuat dokumen indeks klan publik.
 * Menggunakan Admin SDK. Dipanggil dari server (pencarian / cron job).
 */
export const updatePublicClanIndex = async (
    clanTag: string,
    clanData: Partial<PublicClanIndex>
): Promise<void> => {
    try {
        const docRef = adminFirestore
            .collection(COLLECTIONS.PUBLIC_CLAN_INDEX)
            .doc(clanTag);

        const defaultBadgeUrls: CocIconUrls = {
            small: '/images/clan-badge-placeholder.png',
            medium: '/images/clan-badge-placeholder.png',
            large: '/images/clan-badge-placeholder.png',
        };

        // Di sini lastUpdated di PublicClanIndex juga Date, jadi gunakan new Date()
        const payload: Omit<PublicClanIndex, 'lastUpdated'> & { lastUpdated: Date } =
            {
                tag: clanData.tag || clanTag,
                name: clanData.name || 'Nama Klan Tidak Ditemukan',
                clanLevel: clanData.clanLevel || 1,
                memberCount: clanData.memberCount || 0,
                clanPoints: clanData.clanPoints || 0,
                clanCapitalPoints: clanData.clanCapitalPoints || 0,
                clanVersusPoints: clanData.clanVersusPoints || 0,
                badgeUrls: clanData.badgeUrls || defaultBadgeUrls,
                lastUpdated: new Date(), // Gunakan new Date()
                requiredTrophies: clanData.requiredTrophies || 0,
                warFrequency: clanData.warFrequency || 'unknown',
                warWinStreak: clanData.warWinStreak || 0,
                warWins: clanData.warWins || 0,
                type: clanData.type || 'closed',
                description: clanData.description || '',
                location: clanData.location || undefined,
            };

        const finalPayload = cleanDataForAdminSDK(payload); // cleanData akan konversi lastUpdated
        await docRef.set(finalPayload, { merge: true });
    } catch (error) {
        console.error(
            `Firestore Error [updatePublicClanIndex - Admin(${clanTag})]:`,
            error
        );
        // throw new Error("Gagal menyimpan indeks klan publik (Admin SDK).");
    }
};

// =========================================================================
// FUNGSI SPESIFIK LAINNYA - ADMIN SDK
// =========================================================================

/**
 * Memperbarui status permintaan bergabung.
 * Menggunakan Admin SDK. Dipanggil dari server.
 * Perlu diingat: Permintaan bergabung disimpan di sub-koleksi managedClans/{clanId}/joinRequests
 */
export const updateJoinRequestStatus = async (
    clanId: string, // Perlu clanId untuk path yang benar
    requestId: string,
    newStatus: 'approved' | 'rejected'
): Promise<void> => {
    try {
        // FIX: Menggunakan path sub-koleksi yang benar: managedClans/{clanId}/joinRequests/{requestId}
        const requestRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('joinRequests') // Asumsi nama sub-koleksi adalah 'joinRequests'
            .doc(requestId);
        
        await requestRef.update({ status: newStatus });
        console.log(`[JoinRequest - Admin] Request ${requestId} for Clan ${clanId} status updated to ${newStatus}.`);

    } catch (error) {
        console.error(
            `Firestore Error [updateJoinRequestStatus - Admin(${requestId}, ${newStatus})]:`,
            error
        );
        throw new Error('Gagal memperbarui status permintaan bergabung (Admin SDK).');
    }
};

/**
 * Memperbarui clanId, clanName, dan role pengguna.
 * Menggunakan Admin SDK. Dipanggil dari server (misalnya saat approve/kick).
 */
export const updateMemberRole = async (
    uid: string,
    // [FIX 1] Ganti 'teamId' -> 'clanId'
    clanId: string | null,
    // [FIX 1] Ganti 'teamName' -> 'clanName'
    clanName: string | null,
    newRole: UserProfile['role'] // Peran Clashub ('Leader', 'Member', 'Free Agent')
): Promise<void> => {
    try {
        const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
        const updateData: Partial<UserProfile> = {
            // [FIX 1] Ganti 'teamId' -> 'clanId'
            clanId: clanId,
            // [FIX 1] Ganti 'teamName' -> 'clanName'
            clanName: clanName,
            role: newRole,
        };

        const cleanedUpdateData = cleanDataForAdminSDK(updateData);

        if (Object.keys(cleanedUpdateData).length > 0) {
            await userRef.update(cleanedUpdateData);
        } else {
            console.warn(
                `[updateMemberRole - Admin] No valid data provided for update for UID: ${uid}`
            );
        }
    } catch (error) {
        console.error(
            `Firestore Error [updateMemberRole - Admin(${uid}, ${newRole})]:`,
            error
        );
        throw new Error('Gagal memperbarui peran anggota (Admin SDK).');
    }
};
