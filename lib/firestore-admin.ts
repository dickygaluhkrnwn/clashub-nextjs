// File: lib/firestore-admin.ts
// Deskripsi: Berisi fungsi utilitas Firestore yang HANYA menggunakan Firebase Admin SDK.
// File ini hanya boleh diimpor oleh Server Components, Server Actions, atau API Routes.

import { adminFirestore } from './firebase-admin'; // Import adminFirestore
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from './firestore-collections';
import {
    ManagedClan,
    PublicClanIndex,
    ClanApiCache,
    UserProfile,
    CocIconUrls,
    ClanRole,
    CwlArchive,
    RaidArchive, // BARU: Import RaidArchive
    Post, // <--- FIX: Tambahkan import untuk tipe Post
    JoinRequest, // <--- FIX: Tambahkan import untuk tipe JoinRequest
    CocWarLog, // <-- PERBAIKAN: Tambahkan impor CocWarLog yang hilang
    WarArchive // <<< TAMBAHKAN BARIS INI
} from './types';

// =========================================================================
// 0. TIPE DATA BARU (Jika ada - contoh: RoleChangeLog)
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

// --- PERBAIKAN: Tambahkan export ---
/**
 * Helper Type untuk menambahkan ID ke tipe data saat membaca dari Firestore
 */
export type FirestoreDocument<T> = T & { id: string };

// Fungsi untuk membersihkan data sebelum dikirim ke Admin SDK
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

// Helper internal untuk mengonversi snapshot dokumen Firestore ke objek dengan ID dan konversi Timestamp
// NOTE: Konversi ini menghasilkan objek Date. Next.js akan mengeluh jika ini diteruskan ke Client Component.
// Perlu konversi tambahan di Server Component (page.tsx)
function docToDataAdmin<T>(doc: FirebaseFirestore.DocumentSnapshot): FirestoreDocument<T> | null {
    if (!doc.exists) {
        return null;
    }
    const data = doc.data() as any;
    // Konversi Timestamp ke Date (tetap lakukan ini untuk integritas data di Server)
    Object.keys(data).forEach((key) => {
        if (data[key] instanceof AdminTimestamp) {
            data[key] = (data[key] as AdminTimestamp).toDate();
        }
    });
    return { id: doc.id, ...data } as FirestoreDocument<T>;
}
// -----------------------------------------------------------

// =========================================================================
// FUNGSI SERVER READ UTILITY BARU (ADMIN SDK)
// =========================================================================

/**
 * Mengambil dokumen UserProfile berdasarkan UID (Admin).
 */
export const getUserProfileAdmin = async (
    uid: string
): Promise<FirestoreDocument<UserProfile> | null> => {
    try {
        const docRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
        const docSnap = await docRef.get();
        return docToDataAdmin<UserProfile>(docSnap);
    } catch (error) {
        console.error(`Firestore Error [getUserProfileAdmin - Admin(${uid})]:`, error);
        return null;
    }
};

/**
 * Mengambil data ManagedClan berdasarkan ID internal Clashub (Admin).
 */
export const getManagedClanDataAdmin = async (
    clanId: string
): Promise<FirestoreDocument<ManagedClan> | null> => {
    try {
        const docRef = adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId);
        const docSnap = await docRef.get();
        return docToDataAdmin<ManagedClan>(docSnap);
    } catch (error) {
        console.error(`Firestore Error [getManagedClanDataAdmin - Admin(${clanId})]:`, error);
        return null;
    }
};

/**
 * Mengambil cache API klan (sub-koleksi) (Admin).
 */
export const getClanApiCacheAdmin = async (
    clanId: string
): Promise<ClanApiCache | null> => {
    try {
        const cacheRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS).doc(clanId)
            .collection('clanApiCache').doc('current');
        const docSnap = await cacheRef.get();
        return docToDataAdmin<ClanApiCache>(docSnap);
    } catch (error) {
        console.error(`Firestore Error [getClanApiCacheAdmin - Admin(${clanId})]:`, error);
        return null;
    }
};

/**
 * Mengambil daftar permintaan bergabung yang tertunda untuk tim tertentu (Admin).
 * PERBAIKAN #1: Menghapus .orderBy('timestamp', 'desc') untuk menghindari Index Error.
 */
export const getJoinRequestsAdmin = async (
    clanId: string
): Promise<FirestoreDocument<JoinRequest>[]> => {
    try {
        const requestsRef = adminFirestore.collection(
            `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
        );
        // Hapus orderBy untuk menghindari FAILED_PRECONDITION: The query requires an index.
        const q = requestsRef.where('status', '==', 'pending');
        
        // Catatan: Sorting harus dilakukan di sisi aplikasi jika diperlukan.
        const snapshot = await q.get();
        return snapshot.docs.map(doc => docToDataAdmin<JoinRequest>(doc)).filter(Boolean) as FirestoreDocument<JoinRequest>[];
    } catch (error) {
        console.error(`Firestore Error [getJoinRequestsAdmin - Admin(${clanId})]:`, error);
        // Error log yang muncul di terminal (seperti FAILED_PRECONDITION) sekarang berasal dari sini
        return [];
    }
};

/**
 * Mengambil daftar anggota tim (UserProfile) berdasarkan clanId (Admin).
 */
export const getTeamMembersAdmin = async (clanId: string): Promise<UserProfile[]> => {
    try {
        const usersRef = adminFirestore.collection(COLLECTIONS.USERS);
        const q = usersRef.where('clanId', '==', clanId);
        const snapshot = await q.get();
        return snapshot.docs.map(doc => docToDataAdmin<UserProfile>(doc)).filter(Boolean) as UserProfile[]; // Filter null results
    } catch (error) {
        console.error(`Firestore Error [getTeamMembersAdmin - Admin(${clanId})]:`, error);
        return [];
    }
};

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
            } as RoleChangeLog;
        });
    } catch (error) {
        console.error(`Firestore Error [getRoleLogsByClanId - Admin(${clanId})]:`, error);
        return [];
    }
};

/**
 * Mengambil semua arsip CWL (Clan War League) untuk Clan tertentu.
 * Diurutkan berdasarkan musim secara descending (terbaru di atas)
 */
export const getCwlArchivesByClanId = async (
    clanId: string
): Promise<FirestoreDocument<CwlArchive>[]> => {
    try {
        const cwlRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('cwlArchives');

        // Mengambil semua dokumen arsip CWL, diurutkan secara descending berdasarkan ID Musim (Season)
        const snapshot = await cwlRef.orderBy('season', 'desc').get();

        // PERBAIKAN #2: Memastikan semua objek Date di dalam rounds dikonversi ke ISO string.
        return snapshot.docs.map(doc => {
            const data = doc.data() as Omit<CwlArchive, 'id'>; 

            // Rekursif konversi Timestamp di dalam rounds ke ISO string untuk serialisasi
            const roundsWithDates = data.rounds?.map(round => {
                // PERBAIKAN ERROR TS2352:
                // Kita cast 'round' ke 'any' di sini agar bisa memeriksa 'instanceof'
                // tanpa TypeScript mengeluh bahwa tipenya adalah 'string'.
                const convertedRound = { ...round } as any;
                
                // Konversi startTime/endTime di objek CocWarLog di dalam array rounds
                if (convertedRound.endTime instanceof AdminTimestamp) {
                    // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
                    convertedRound.endTime = (convertedRound.endTime as AdminTimestamp).toDate().toISOString();
                } else if (convertedRound.endTime instanceof Date) {
                    convertedRound.endTime = (convertedRound.endTime as Date).toISOString();
                }

                if (convertedRound.startTime instanceof AdminTimestamp) {
                    // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
                    convertedRound.startTime = (convertedRound.startTime as AdminTimestamp).toDate().toISOString();
                } else if (convertedRound.startTime instanceof Date) {
                    convertedRound.startTime = (convertedRound.startTime as Date).toISOString();
                }

                // Kita asumsikan properti lain di CocWarLog juga aman (string/number/boolean)
                return convertedRound as CocWarLog; // Cast kembali ke CocWarLog
            }) || [];


            return {
                id: doc.id, // Ambil ID dari dokumen
                ...data, // Sebar sisa data
                rounds: roundsWithDates, // Gunakan rounds yang sudah dikonversi
            } as FirestoreDocument<CwlArchive>;
        });
    } catch (error) {
        console.error(`Firestore Error [getCwlArchivesByClanId - Admin(${clanId})]:`, error);
        return [];
    }
};


/**
 * Mengambil semua arsip Raid (Ibu Kota Klan) untuk Clan tertentu.
 * Diurutkan berdasarkan waktu selesai (endTime) secara descending (terbaru di atas)
 */
export const getRaidArchivesByClanId = async (
    clanId: string
): Promise<FirestoreDocument<RaidArchive>[]> => {
    try {
        const raidRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('raidArchives');

        // Mengambil semua dokumen arsip Raid, diurutkan berdasarkan endTime secara descending
        const snapshot = await raidRef.orderBy('endTime', 'desc').get();

        return snapshot.docs.map(doc => {
            const data = doc.data() as Omit<RaidArchive, 'id'>; 

            // Deklarasi yang lebih aman untuk TypeScript
            let startTime: Date | undefined = undefined;
            let endTime: Date | undefined = undefined;

            // Memeriksa dan mengonversi properti `startTime`
            if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
                const rawStartTime = (data as any).startTime;
                 if (rawStartTime instanceof AdminTimestamp) {
                    startTime = rawStartTime.toDate();
                 } else if (rawStartTime instanceof Date) { // Tambahkan cek jika sudah Date
                    startTime = rawStartTime;
                 }
            }

            // Memeriksa dan mengonversi properti `endTime`
            if (Object.prototype.hasOwnProperty.call(data, 'endTime')) {
                const rawEndTime = (data as any).endTime;
                if (rawEndTime instanceof AdminTimestamp) {
                    endTime = rawEndTime.toDate();
                } else if (rawEndTime instanceof Date) { // Tambahkan cek jika sudah Date
                    endTime = rawEndTime;
                }
            }
            
            // Mengembalikan objek dengan properti Date yang sudah dikonversi atau undefined
            return {
                id: doc.id, 
                ...data, 
                // PERBAIKAN: Hapus non-null assertion (!)
                // Karena startTime/endTime sekarang opsional di tipe RaidArchive, kita bisa biarkan undefined
                startTime: startTime,
                endTime: endTime,   
                 // Members sudah seharusnya bertipe CocRaidMember[]
            } as FirestoreDocument<RaidArchive>; 
        // Filter item yang tidak memiliki endTime (data korup/belum selesai)
        }).filter(item => item !== null && item.endTime !== undefined) as FirestoreDocument<RaidArchive>[]; 

    } catch (error) {
        console.error(`Firestore Error [getRaidArchivesByClanId - Admin(${clanId})]:`, error);
        return [];
    }
};

/**
 * Mengambil semua arsip War Classic (War Klasik) untuk Clan tertentu.
 * Diurutkan berdasarkan waktu selesai (warEndTime) secara descending (terbaru di atas).
 */
export const getWarArchivesByClanId = async (
    clanId: string
): Promise<FirestoreDocument<WarArchive>[]> => {
    try {
        const warRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('warArchives'); // Nama koleksi yang benar

        // Mengambil arsip, diurutkan berdasarkan warEndTime (descending)
        // Kita batasi 50 untuk performa
        const snapshot = await warRef.orderBy('warEndTime', 'desc').limit(50).get(); 

        return snapshot.docs.map(doc => {
            const data = doc.data() as Omit<WarArchive, 'id'>;
            
            // Konversi manual timestamp ke Date
            let warEndTime: Date | undefined = undefined;
            if (Object.prototype.hasOwnProperty.call(data, 'warEndTime')) {
                const rawEndTime = (data as any).warEndTime;
                if (rawEndTime instanceof AdminTimestamp) {
                    warEndTime = rawEndTime.toDate();
                } else if (rawEndTime instanceof Date) {
                    warEndTime = rawEndTime;
                } else if (typeof rawEndTime === 'string') {
                    warEndTime = new Date(rawEndTime); // Fallback jika disimpan sebagai string
                }
            }
            
            let startTime: Date | undefined = undefined;
            if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
                const rawStartTime = (data as any).startTime;
                if (rawStartTime instanceof AdminTimestamp) {
                    startTime = rawStartTime.toDate();
                } else if (rawStartTime instanceof Date) {
                    startTime = rawStartTime;
                } else if (typeof rawStartTime === 'string') {
                    startTime = new Date(rawStartTime); // Fallback
                }
            }

            // --- PERBAIKAN: Cast ke 'unknown' terlebih dahulu ---
            // Ini memaksa TypeScript untuk menerima bahwa objek yang kita buat
            // sudah sesuai dengan tipe FirestoreDocument<WarArchive>,
            // dan ...data (yang berisi clanTag) sudah termasuk.
            const returnObj = {
                id: doc.id,
                ...data,
                warEndTime: warEndTime, // Pastikan ini adalah objek Date
                startTime: startTime, // Pastikan ini adalah objek Date
            };
            
            // Hapus properti 'endTime' (string) warisan dari CocWarLog
            delete (returnObj as any).endTime;

            return returnObj as unknown as FirestoreDocument<WarArchive>;
            // --- AKHIR PERBAIKAN ---
            
        }).filter(item => item !== null) as FirestoreDocument<WarArchive>[];

    } catch (error) {
        console.error(`Firestore Error [getWarArchivesByClanId - Admin(${clanId})]:`, error);
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


/**
 * @function deletePostAdmin
 * Menghapus postingan dari koleksi 'posts'.
 * Dipanggil dari API Routes DELETE /api/posts/[postId].
 */
export const deletePostAdmin = async (
    postId: string
): Promise<void> => {
    try {
        const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
        await postRef.delete();
        console.log(`[Post - Admin] Postingan ${postId} berhasil dihapus.`);
    } catch (error) {
        console.error(
            `Firestore Error [deletePostAdmin - Admin(${postId})]:`,
            error
        );
        throw new Error('Gagal menghapus postingan (Admin SDK).');
    }
};


/**
 * @function updatePostAdmin
 * Memperbarui data postingan di koleksi 'posts'.
 * Dipanggil dari API Routes PUT /api/posts/[postId].
 */
export const updatePostAdmin = async (
    postId: string,
    data: Partial<Post> // Gunakan tipe Post yang sudah diimpor
): Promise<void> => {
    try {
        const postRef = adminFirestore.collection(COLLECTIONS.POSTS).doc(postId);
        
        // Tambahkan updatedAt manual
        const updateDataWithTimestamp = {
            ...data,
            updatedAt: new Date(),
        };

        const cleanedData = cleanDataForAdminSDK(updateDataWithTimestamp);

        if (Object.keys(cleanedData).length > 0) {
            await postRef.update(cleanedData);
            console.log(`[Post - Admin] Postingan ${postId} berhasil diperbarui.`);
        } else {
            console.warn(`[updatePostAdmin - Admin] No valid data provided for update for Post ID: ${postId}`);
        }
    } catch (error) {
        console.error(
            `Firestore Error [updatePostAdmin - Admin(${postId})]:`,
            error
        );
        throw new Error('Gagal memperbarui postingan (Admin SDK).');
    }
};

export { adminFirestore }; // Ekspor adminFirestore di akhir


