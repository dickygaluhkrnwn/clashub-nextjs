// File: lib/firestore-admin.ts
// Deskripsi: Berisi fungsi utilitas Firestore yang HANYA menggunakan Firebase Admin SDK.
// File ini hanya boleh diimpor oleh Server Components, Server Actions, atau API Routes.

// PERBAIKAN: Ekspor adminFirestore
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
            data[key] !== undefined &&
            data[key] !== null // Tambahkan pengecekan null
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
            // Kembalikan objek yang sesuai dengan tipe RoleChangeLog
            return {
                playerTag: data.playerTag,
                playerName: data.playerName,
                memberUid: data.memberUid,
                oldRoleCoC: data.oldRoleCoC,
                newRoleCoC: data.newRoleCoC,
                changedByUid: data.changedByUid,
                changedAt: data.changedAt, // Ini sudah jadi Date
                // Jangan sertakan 'id' jika tidak didefinisikan di tipe RoleChangeLog
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
            // Konversi Timestamp jika diperlukan
            // Contoh: Jika ada field 'archiveDate'
            // if (data.archiveDate instanceof AdminTimestamp) {
            //     data.archiveDate = data.archiveDate.toDate();
            // }
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

        // Pastikan tipe data sesuai sebelum membersihkan
        const payloadWithDate: RoleChangeLog = {
            ...logData,
            changedAt: new Date(), // Tambahkan timestamp
        };

        await logRef.add(cleanDataForAdminSDK(payloadWithDate)); // Gunakan payloadWithDate

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

        const newClanData: Omit<ManagedClan, 'id'> = {
            name: clanName,
            tag: clanTag,
            ownerUid: ownerUid,
            vision: 'Kompetitif', // Default vision
            recruitingStatus: 'Open', // Default status
            website: undefined,
            discordId: undefined,
            logoUrl: undefined,
            avgTh: 0,
            clanLevel: 0, // Akan diupdate saat sync pertama
            memberCount: 0, // Akan diupdate saat sync pertama
            lastSynced: new Date(0), // Set ke waktu epoch agar sync pertama ter-trigger
        };

        const cleanedData = cleanDataForAdminSDK(newClanData);
        const docRef = await managedClansRef.add(cleanedData);
        // Menambahkan ID dokumen sebagai field 'id' setelah dibuat
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
 * FUNGSI INI SEKARANG HANYA CONTOH, LOGIKA UTAMA ADA DI API SYNC LANGSUNG DENGAN BATCH
 */
export const updateClanApiCache = async (
    clanId: string,
    cacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'>,
    updatedManagedClanFields: Partial<ManagedClan>
): Promise<void> => {
    console.warn("[updateClanApiCache - Admin] This function is deprecated. Use batch operations within the sync API route instead.");
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
            lastUpdated: new Date(), // Gunakan Date biasa, cleanData akan konversi
        };
        batch.set(cacheRef, cleanDataForAdminSDK(cachePayload), { merge: true }); // Gunakan merge

        const clanUpdatePayload = cleanDataForAdminSDK({
            ...updatedManagedClanFields,
            lastSynced: new Date(), // Update lastSynced juga
        });
        if (Object.keys(clanUpdatePayload).length > 0) {
            batch.update(managedClanRef, clanUpdatePayload);
        }

        await batch.commit();
        console.log(`[updateClanApiCache - Admin(${clanId})] Batch commit successful (legacy function).`);
    } catch (error) {
        console.error(
            `Firestore Error [updateClanApiCache - Admin(${clanId})]:`,
            error
        );
        throw new Error('Gagal menyimpan cache API klan (Admin SDK - legacy).');
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
            .doc(clanTag); // Gunakan clanTag sebagai ID dokumen

        const defaultBadgeUrls: CocIconUrls = {
            small: '/images/clan-badge-placeholder.png',
            medium: '/images/clan-badge-placeholder.png',
            large: '/images/clan-badge-placeholder.png',
        };

        // Siapkan payload lengkap dengan fallback dan timestamp
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
                lastUpdated: new Date(), // Timestamp saat ini
                requiredTrophies: clanData.requiredTrophies || 0,
                warFrequency: clanData.warFrequency || 'unknown',
                warWinStreak: clanData.warWinStreak || 0,
                warWins: clanData.warWins || 0,
                type: clanData.type || 'closed',
                description: clanData.description || '',
                location: clanData.location || undefined,
                warLeague: clanData.warLeague || undefined, // Sertakan warLeague
            };

        const finalPayload = cleanDataForAdminSDK(payload); // Konversi Date ke Timestamp
        await docRef.set(finalPayload, { merge: true }); // Gunakan merge true
    } catch (error) {
        console.error(
            `Firestore Error [updatePublicClanIndex - Admin(${clanTag})]:`,
            error
        );
        // Jangan throw error agar cron job tidak berhenti jika satu klan gagal
        // throw new Error("Gagal menyimpan indeks klan publik (Admin SDK).");
    }
};

// =========================================================================
// FUNGSI SPESIFIK LAINNYA - ADMIN SDK
// =========================================================================

/**
 * Memperbarui status permintaan bergabung.
 * Menggunakan Admin SDK. Dipanggil dari server.
 */
export const updateJoinRequestStatus = async (
    clanId: string,
    requestId: string,
    newStatus: 'approved' | 'rejected'
): Promise<void> => {
    try {
        const requestRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('joinRequests') // Asumsi nama sub-koleksi
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
 * Menggunakan Admin SDK. Dipanggil dari server (misalnya saat approve/kick/role change).
 */
export const updateMemberRole = async (
    uid: string,
    clanId: string | null,
    clanName: string | null,
    newRole: UserProfile['role'] // Peran Clashub ('Leader', 'Member', 'Free Agent')
): Promise<void> => {
    try {
        const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
        const updateData: Partial<UserProfile> = {
            clanId: clanId,
            clanName: clanName,
            role: newRole,
        };

        // Bersihkan data sebelum update (menghapus undefined/null jika tidak diperlukan)
        const cleanedUpdateData = cleanDataForAdminSDK(updateData);
        // Pastikan null secara eksplisit disimpan jika clanId/clanName memang null
        if (clanId === null) cleanedUpdateData.clanId = null;
        if (clanName === null) cleanedUpdateData.clanName = null;


        if (Object.keys(cleanedUpdateData).length > 0) {
            await userRef.update(cleanedUpdateData); // Gunakan update, bukan set merge
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

// PERBAIKAN: Ekspor adminFirestore
export { adminFirestore };
