// File: lib/firestore.ts
// Deskripsi: Berisi fungsi utilitas Firestore yang HANYA menggunakan Client SDK.
// File ini aman diimpor oleh komponen Client-Side.

// Impor Client SDK dan alias-kan tipenya
import { firestore } from './firebase'; // Client SDK instance
import {
    doc as clientDoc,
    setDoc as clientSetDoc,
    getDoc as clientGetDoc,
    updateDoc as clientUpdateDoc,
    collection as clientCollection,
    getDocs as clientGetDocs,
    query as clientQuery,
    where as clientWhere,
    addDoc as clientAddDoc,
    Timestamp as ClientTimestamp, // Alias Timestamp Client
    orderBy as clientOrderBy,
    limit as clientLimit,
    DocumentData, // Tipe standar
} from 'firebase/firestore';
// --- PERBAIKAN: Pastikan path impor benar ---
import { COLLECTIONS } from './firestore-collections';

// Impor tipe data (tetap diperlukan)
import {
    UserProfile,
    Player,
    Tournament,
    JoinRequest,
    Post,
    PostCategory,
    ManagedClan,
    PublicClanIndex,
    ClanApiCache,
    ClanRole,
    Video, // <-- TAMBAHAN: Impor tipe Video
    // VideoCategory // (Tidak perlu diimpor jika 'Berita Komunitas' digunakan)
} from './types';

// Helper Tipe
type FirestoreDocument<T> = T & { id: string };

// =========================================================================
// FUNGSI UTILITY UMUM (Client SDK)
// =========================================================================

export const uploadProfileImage = ( // Fungsi ini tetap sama, tidak terkait Firestore langsung
// ... existing code ...
    uid: string,
    newAvatarUrl: string,
    onProgress?: (percentage: number) => void
): Promise<string> => {
// ... existing code ...
    console.log(`[AVATAR STATIS] Avatar dipilih. URL: ${newAvatarUrl}`);
    return Promise.resolve(newAvatarUrl);
};

/**
 * Mengambil satu dokumen berdasarkan ID menggunakan Client SDK.
// ... existing code ...
 */
async function getDocumentById<T>(
    collectionName: string,
// ... existing code ...
    id: string
): Promise<FirestoreDocument<T> | null> {
// ... existing code ...
    try {
        const docRef = clientDoc(firestore, collectionName, id);
// ... existing code ...
        const docSnap = await clientGetDoc(docRef);

        if (docSnap.exists()) {
// ... existing code ...
            const data = docSnap.data() as DocumentData;
            // Konversi Timestamp ke Date
// ... existing code ...
            Object.keys(data).forEach((key) => {
                if (data[key] instanceof ClientTimestamp) {
// ... existing code ...
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
// ... existing code ...
                // Handle Firestore Timestamps within nested objects/arrays if necessary
                // This example only handles top-level timestamps
            });
// ... existing code ...
            return { ...(data as T), id: docSnap.id }; // Pastikan cast ke T setelah konversi
        }
// ... existing code ...
        console.log(
            `Firestore Info [getDocumentById - Client(${collectionName}, ${id})]: Document not found.`
// ... existing code ...
        );
        return null;
// ... existing code ...
    } catch (error) {
        console.error(
// ... existing code ...
            `Firestore Error [getDocumentById - Client(${collectionName}, ${id})]:`,
            error
// ... existing code ...
        );
        return null; // Kembalikan null jika error
// ... existing code ...
    }
}

/**
 * Mengambil semua dokumen dari sebuah koleksi menggunakan Client SDK.
// ... existing code ...
 */
async function getCollectionData<T>(
    collectionName: string
// ... existing code ...
): Promise<FirestoreDocument<T>[]> {
    try {
// ... existing code ...
        const colRef = clientCollection(firestore, collectionName);
        const snapshot = await clientGetDocs(colRef);

// ... existing code ...
        return snapshot.docs.map((doc: DocumentData) => {
            const data = doc.data();
// ... existing code ...
            // Konversi Timestamp ke Date
            Object.keys(data).forEach((key) => {
// ... existing code ...
                if (data[key] instanceof ClientTimestamp) {
                    data[key] = (data[key] as ClientTimestamp).toDate();
// ... existing code ...
                }
                // Handle Firestore Timestamps within nested objects/arrays if necessary
// ... existing code ...
            });
            return { id: doc.id, ...data } as FirestoreDocument<T>; // Pastikan cast ke T setelah konversi
// ... existing code ...
        });
    } catch (error) {
// ... existing code ...
        console.error(
            `Firestore Error [getCollectionData - Client(${collectionName})]:`,
// ... existing code ...
            error
        );
// ... existing code ...
        return []; // Kembalikan array kosong jika error
    }
}

// =========================================================================
// FUNGSI SPESIFIK USERPROFILE (users) - Client SDK
// =========================================================================

/**
// ... existing code ...
 * Membuat dokumen profil pengguna baru.
 * Menggunakan Client SDK. Dipanggil dari client (registrasi).
// ... existing code ...
 */
export const createUserProfile = async (
    uid: string,
// ... existing code ...
    data: Partial<UserProfile>
): Promise<void> => {
// ... existing code ...
    try {
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
// ... existing code ...
        // Pastikan semua field didefinisikan sesuai UserProfile
        const profileData: UserProfile = {
// ... existing code ...
            uid: uid,
            email: data.email ?? null,
// ... existing code ...
            displayName:
                data.displayName ||
// ... existing code ...
                data.playerTag ||
                data.email?.split('@')[0] ||
// ... existing code ...
                `User_${uid.substring(0, 4)}`,
            isVerified: data.isVerified ?? false,
// ... existing code ...
            playerTag: data.playerTag || '',
            inGameName: data.inGameName, // Bisa undefined
// ... existing code ...
            thLevel: data.thLevel ?? 9,
            trophies: data.trophies ?? 0,
// ... existing code ...
            clanTag: data.clanTag ?? null,
            clanRole: data.clanRole ?? ClanRole.NOT_IN_CLAN,
// ... existing code ...
            lastVerified: data.lastVerified, // Bisa undefined
            bio: data.bio || '',
// ... existing code ...
            role: data.role || 'Free Agent',
            playStyle: data.playStyle, // Bisa undefined
// ... existing code ...
            activeHours: data.activeHours || '',
            reputation: data.reputation ?? 5.0,
// ... existing code ...
            avatarUrl: data.avatarUrl || '/images/placeholder-avatar.png',
            discordId: data.discordId ?? null, // Default ke null jika kosong
// ... existing code ...
            website: data.website ?? null, // Default ke null jika kosong
            // [FIX 1] Ganti 'teamId' -> 'clanId'
// ... existing code ...
            clanId: data.clanId ?? null,
            // [FIX 1] Ganti 'teamName' -> 'clanName'
// ... existing code ...
            clanName: data.clanName ?? null,
        };
// ... existing code ...
        // Hapus field undefined sebelum kirim ke firestore client sdk
        Object.keys(profileData).forEach((key) => {
// ... existing code ...
            if ((profileData as any)[key] === undefined) {
                delete (profileData as any)[key];
// ... existing code ...
            }
        });
// ... existing code ...
        await clientSetDoc(userRef, profileData, { merge: true }); // Menggunakan merge true untuk update
    } catch (error) {
// ... existing code ...
        console.error(`Firestore Error [createUserProfile - Client(${uid})]:`, error);
        throw new Error('Gagal membuat profil pengguna baru di database.');
// ... existing code ...
    }
};

/**
 * Memperbarui dokumen profil pengguna yang ada.
// ... existing code ...
 * Menggunakan Client SDK. Dipanggil dari client (edit profil).
 */
export const updateUserProfile = async (
// ... existing code ...
    uid: string,
    data: Partial<UserProfile>
// ... existing code ...
): Promise<void> => {
    try {
// ... existing code ...
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
        // Hapus field undefined sebelum kirim
// ... existing code ...
        const cleanData: Partial<UserProfile> = {};
        Object.keys(data).forEach((keyStr) => {
// ... existing code ...
            const key = keyStr as keyof Partial<UserProfile>;
            if (data[key] !== undefined) {
// ... existing code ...
                (cleanData as any)[key] = data[key];
            }
// ... existing code ...
        });
        await clientSetDoc(userRef, cleanData, { merge: true });
// ... existing code ...
    } catch (error) {
        console.error(`Firestore Error [updateUserProfile - Client(${uid})]:`, error);
// ... existing code ...
        throw new Error(
            `Gagal memperbarui profil pengguna. Detail: ${(error as Error).message}`
// ... existing code ...
        );
    }
};

/**
// ... existing code ...
 * Mengambil data profil pengguna berdasarkan UID.
 * Menggunakan Client SDK. Bisa dipanggil dari client atau server.
// ... existing code ...
 */
export const getUserProfile = async (
    uid: string
// ... existing code ...
): Promise<UserProfile | null> => {
    return getDocumentById<UserProfile>(COLLECTIONS.USERS, uid);
};

// --- FUNGSI BARU: Mencari UserProfile berdasarkan Tag CoC ---
/**
// ... existing code ...
 * Mengambil data profil pengguna berdasarkan Tag Pemain CoC.
 * Catatan: Ini memerlukan indeks Firestore pada field 'playerTag'.
// ... existing code ...
 */
export const getUserProfileByTag = async (
    playerTag: string
// ... existing code ...
): Promise<UserProfile | null> => {
    // Normalisasi tag (hapus # jika ada)
// ... existing code ...
    const normalizedTag = playerTag.startsWith('#')
        ? playerTag.toUpperCase()
// ... existing code ...
        : `#${playerTag.toUpperCase()}`;

    try {
// ... existing code ...
        const usersRef = clientCollection(firestore, COLLECTIONS.USERS);
        const q = clientQuery(
// ... existing code ...
            usersRef,
            clientWhere('playerTag', '==', normalizedTag),
// ... existing code ...
            clientLimit(1) // Hanya perlu satu hasil
        );
// ... existing code ...
        const snapshot = await clientGetDocs(q);

        if (snapshot.docs.length > 0) {
// ... existing code ...
            const doc = snapshot.docs[0];
            const data = doc.data() as DocumentData;
// ... existing code ...
            // Konversi Timestamp
            Object.keys(data).forEach((key) => {
// ... existing code ...
                if (data[key] instanceof ClientTimestamp) {
                    data[key] = (data[key] as ClientTimestamp).toDate();
// ... existing code ...
                }
            });
// ... existing code ...
            return { uid: doc.id, ...data } as UserProfile;
        }

// ... existing code ...
        console.log(
            `Firestore Info [getUserProfileByTag - Client(${normalizedTag})]: Profile not found.`
// ... existing code ...
        );
        return null;
// ... existing code ...
    } catch (error) {
        console.error(
// ... existing code ...
            `Firestore Error [getUserProfileByTag - Client(${normalizedTag})]:`,
            error
// ... existing code ...
        );
        return null;
// ... existing code ...
    }
};
// -----------------------------------------------------------

/**
// ... existing code ...
 * Mengambil daftar semua pemain (subset UserProfile).
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    // Perhatikan: Tipe Player adalah subset dari UserProfile
// ... existing code ...
    return getCollectionData<Player>(COLLECTIONS.USERS);
};

// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans) - Client SDK (Hanya Read)
// =========================================================================

/**
// ... existing code ...
 * Mengambil data ManagedClan berdasarkan ID internal Clashub.
 * Menggunakan Client SDK.
// ... existing code ...
 */
// FIX 1: Ganti nama fungsi menjadi getManagedClanData agar tidak bentrok, tapi fungsi yang dicari adalah getManagedClan yang ada di Admin SDK.
// Untuk menghindari kebingungan, kita biarkan saja nama ini, karena ini adalah fungsi yang benar.
export const getManagedClanData = async (
// ... existing code ...
    clanId: string
): Promise<FirestoreDocument<ManagedClan> | null> => {
// ... existing code ...
    return getDocumentById<ManagedClan>(COLLECTIONS.MANAGED_CLANS, clanId);
};

/**
// ... existing code ...
 * Mengambil daftar semua ManagedClan.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getManagedClans = async (): Promise<
    FirestoreDocument<ManagedClan>[]
// ... existing code ...
> => {
    return getCollectionData<ManagedClan>(COLLECTIONS.MANAGED_CLANS);
};

// --- FUNGSI BARU: Mengambil ManagedClan berdasarkan TAG ---
/**
// ... existing code ...
 * Mengambil data ManagedClan berdasarkan Clan Tag CoC.
 * Catatan: Ini memerlukan indeks Firestore pada field 'tag'.
// ... existing code ...
 * Menggunakan Client SDK.
 */
export const getManagedClanByTag = async (
// ... existing code ...
    clanTag: string
): Promise<FirestoreDocument<ManagedClan> | null> => {
// ... existing code ...
    // Normalisasi tag (pastikan diawali '#')
    const normalizedTag = clanTag.startsWith('#')
// ... existing code ...
        ? clanTag.toUpperCase()
        : `#${clanTag.toUpperCase()}`;

// ... existing code ...
    try {
        const clansRef = clientCollection(firestore, COLLECTIONS.MANAGED_CLANS);
// ... existing code ...
        const q = clientQuery(
            clansRef,
// ... existing code ...
            clientWhere('tag', '==', normalizedTag),
            clientLimit(1) // Hanya perlu satu hasil
// ... existing code ...
        );
        const snapshot = await clientGetDocs(q);

// ... existing code ...
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
// ... existing code ...
            const data = doc.data() as DocumentData;
            // Konversi Timestamp
// ... existing code ...
            Object.keys(data).forEach((key) => {
                if (data[key] instanceof ClientTimestamp) {
// ... existing code ...
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
// ... existing code ...
            });
            return { id: doc.id, ...data } as FirestoreDocument<ManagedClan>;
// ... existing code ...
        }

        console.log(
// ... existing code ...
            `Firestore Info [getManagedClanByTag - Client(${normalizedTag})]: Managed Clan not found.`
        );
// ... existing code ...
        return null;
    } catch (error) {
// ... existing code ...
        console.error(
            `Firestore Error [getManagedClanByTag - Client(${normalizedTag})]:`,
// ... existing code ...
            error
        );
// ... existing code ...
        return null;
    }
};
// -----------------------------------------------------------


/**
// ... existing code ...
 * Mengambil cache API klan (sub-koleksi).
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getClanApiCache = async (
    clanId: string
// ... existing code ...
): Promise<ClanApiCache | null> => {
    const cachePath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/clanApiCache`;
// ... existing code ...
    return getDocumentById<ClanApiCache>(cachePath, 'current');
};

// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex) - Client SDK (Hanya Read)
// =========================================================================

/**
// ... existing code ...
 * Mengambil data indeks klan publik berdasarkan clanTag.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getPublicClanIndex = async (
    clanTag: string
// ... existing code ...
): Promise<PublicClanIndex | null> => {
    return getDocumentById<PublicClanIndex>(
// ... existing code ...
        COLLECTIONS.PUBLIC_CLAN_INDEX,
        clanTag
// ... existing code ...
    );
};

/**
// ... existing code ...
 * Mengambil daftar semua indeks klan publik untuk Team Hub.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getPublicClansForHub = async (): Promise<
    FirestoreDocument<PublicClanIndex>[]
// ... existing code ...
> => {
    return getCollectionData<PublicClanIndex>(COLLECTIONS.PUBLIC_CLAN_INDEX);
};

// =========================================================================
// FUNGSI SPESIFIK LAINNYA - Client SDK
// =========================================================================

/**
// ... existing code ...
 * Mengambil daftar turnamen.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getTournaments = async (): Promise<
    FirestoreDocument<Tournament>[]
// ... existing code ...
> => {
    return getCollectionData<Tournament>(COLLECTIONS.TOURNAMENTS);
};

/**
// ... existing code ...
 * Mengambil daftar anggota tim berdasarkan clanId.
 * Menggunakan Client SDK.
// ... existing code ...
 */
// [FIX 2] Ganti 'teamId' -> 'clanId'
export const getTeamMembers = async (clanId: string): Promise<UserProfile[]> => {
// ... existing code ...
    try {
        const usersRef = clientCollection(firestore, COLLECTIONS.USERS);
// ... existing code ...
        const q = clientQuery(
            usersRef,
// ... existing code ...
            // [FIX 2] Ganti 'teamId' -> 'clanId'
            clientWhere('clanId', '==', clanId)
// ... existing code ...
        );
        const snapshot = await clientGetDocs(q);

// ... existing code ...
        return snapshot.docs.map((doc) => {
            const data = doc.data() as DocumentData;
// ... existing code ...
            Object.keys(data).forEach((key) => {
                if (data[key] instanceof ClientTimestamp) {
// ... existing code ...
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
// ... existing code ...
            });
            return { uid: doc.id, ...data } as UserProfile;
// ... existing code ...
        });
    } catch (error) {
// ... existing code ...
        // [FIX 2] Ganti 'teamId' -> 'clanId'
        console.error(`Firestore Error [getTeamMembers - Client(${clanId})]:`, error);
// ... existing code ...
        return [];
    }
};

/**
// ... existing code ...
 * Mengambil satu dokumen permintaan bergabung berdasarkan ID.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getJoinRequest = async (
    clanId: string,
// ... existing code ...
    requestId: string
): Promise<FirestoreDocument<JoinRequest> | null> => {
// ... existing code ...
    try {
        const requestsPath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`;
// ... existing code ...
        const request = await getDocumentById<JoinRequest>(requestsPath, requestId);
        return request;
// ... existing code ...
    } catch (error) {
        console.error(`Firestore Error [getJoinRequest - Client(${clanId}, ${requestId})]:`, error);
// ... existing code ...
        return null;
    }
};


/**
// ... existing code ...
 * Mengirim permintaan bergabung ke tim.
 * Menggunakan Client SDK. Dipanggil dari client.
// ... existing code ...
 */
export const sendJoinRequest = async (
    // [FIX 3] Ganti 'teamId' -> 'clanId'
// ... existing code ...
    clanId: string,
    // [FIX 3] Ganti 'teamName' -> 'clanName'
// ... existing code ...
    clanName: string,
    requesterProfile: UserProfile,
// ... existing code ...
    message: string = ''
): Promise<void> => {
// ... existing code ...
    try {
        // [FIX 3] Path ini salah, seharusnya sub-koleksi.
// ... existing code ...
        // Namun, kita ikuti dulu perubahan 'teamId' -> 'clanId'
        // Logika API Route '.../request/[requestId]' sudah benar menggunakan sub-koleksi.
// ... existing code ...
        // Fungsi ini perlu diperbaiki path-nya nanti agar konsisten.
        const requestsRef = clientCollection(
// ... existing code ...
            firestore,
            // [FIX 3] Ubah path koleksi ke sub-koleksi yang benar
// ... existing code ...
            `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
        );

// ... existing code ...
        const requestData: Omit<JoinRequest, 'id' | 'timestamp'> & {
            timestamp: ClientTimestamp;
// ... existing code ...
        } = {
            // [FIX 3] Ganti 'teamId' -> 'clanId'
// ... existing code ...
            clanId,
            // [FIX 3] Ganti 'teamName' -> 'clanName'
// ... existing code ...
            clanName,
            requesterId: requesterProfile.uid,
// ... existing code ...
            requesterName: requesterProfile.displayName,
            requesterThLevel: requesterProfile.thLevel || 0,
// ... existing code ...
            message,
            status: 'pending',
// ... existing code ...
            timestamp: ClientTimestamp.now(),
        };
// ... existing code ...
        await clientAddDoc(requestsRef, requestData);
    } catch (error) {
// ... existing code ...
        // [FIX 3] Ganti 'teamId' -> 'clanId'
        console.error(
// ... existing code ...
            `Firestore Error [sendJoinRequest - Client(${clanId}, ${requesterProfile.uid})]:`,
            error
// ... existing code ...
        );
        throw new Error('Gagal mengirim permintaan bergabung.');
// ... existing code ...
    }
};

/**
// ... existing code ...
 * Mengambil daftar permintaan bergabung yang tertunda untuk tim tertentu.
 * Menggunakan Client SDK.
// ... existing code ...
 */
// [FIX 4] Ganti 'teamId' -> 'clanId'
export const getJoinRequests = async (
    clanId: string
// ... existing code ...
): Promise<FirestoreDocument<JoinRequest>[]> => {
    try {
// ... existing code ...
        // [FIX 4] Ubah path koleksi ke sub-koleksi yang benar
        const requestsRef = clientCollection(
// ... existing code ...
            firestore,
            `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
// ... existing code ...
        );
        const q = clientQuery(
// ... existing code ...
            requestsRef,
            // [FIX 4] Ganti 'teamId' -> 'clanId' (Meskipun query di sub-koleksi ini tidak lagi diperlukan,
// ... existing code ...
            // kita biarkan untuk konsistensi jika skema lama masih dipakai.
            // Sebenarnya, karena sudah di sub-koleksi, 'clanId' tidak perlu di-query lagi)
// ... existing code ...
            // clientWhere('clanId', '==', clanId), // Baris ini bisa dihapus
            clientWhere('status', '==', 'pending'),
// ... existing code ...
            clientOrderBy('timestamp', 'desc')
        );
// ... existing code ...
        const snapshot = await clientGetDocs(q);

        return snapshot.docs.map((doc) => {
// ... existing code ...
            const data = doc.data();
            return {
// ... existing code ...
                id: doc.id,
                ...data,
// ... existing code ...
                timestamp: (data.timestamp as ClientTimestamp).toDate(),
            } as FirestoreDocument<JoinRequest>;
// ... existing code ...
        });
    } catch (error) {
// ... existing code ...
        // [FIX 4] Ganti 'teamId' -> 'clanId'
        console.error(`Firestore Error [getJoinRequests - Client(${clanId})]:`, error);
// ... existing code ...
        return [];
    }
};

// --- FUNGSI KNOWLEDGE HUB (Client SDK) ---

/**
// ... existing code ...
 * Mengambil postingan berdasarkan ID.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getPostById = async (
    postId: string
// ... existing code ...
): Promise<FirestoreDocument<Post> | null> => {
    const post = await getDocumentById<Post>(COLLECTIONS.POSTS, postId);
// ... existing code ...
    return post;
};

/**
// ... existing code ...
 * Membuat postingan baru.
 * Menggunakan Client SDK. Dipanggil dari client.
// ... existing code ...
 */
export const createPost = async (
    // --- PERUBAHAN TIPE DATA (Langkah 3) ---
// ... existing code ...
    // Sekarang menerima semua field opsional dari 'Post'
    data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'replies' | 'authorId' | 'authorName' | 'authorAvatarUrl'>,
// ... existing code ...
    // --- AKHIR PERUBAHAN TIPE DATA ---
    authorProfile: UserProfile
// ... existing code ...
): Promise<string> => {
    if (
// ... existing code ...
        !authorProfile ||
        !authorProfile.playerTag ||
// ... existing code ...
        !authorProfile.thLevel ||
        authorProfile.thLevel < 1
// ... existing code ...
    ) {
        throw new Error(
// ... existing code ...
            'Gagal membuat postingan. E-Sports CV Anda belum lengkap (Player Tag/TH Level wajib diisi).'
        );
// ... existing code ...
    }

    try {
// ... existing code ...
        const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
        const now = ClientTimestamp.now();

// ... existing code ...
        // --- PERBAIKAN ERROR ts2322 ---
        // Tipe newPostData harus mengecualikan createdAt dan updatedAt dari Omit<Post, 'id'>,
// ... existing code ...
        // lalu menambahkannya kembali dengan tipe ClientTimestamp.
        const newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & {
// ... existing code ...
            createdAt: ClientTimestamp;
            updatedAt: ClientTimestamp;
// ... existing code ...
        } = {
            // Sebarkan semua properti dari 'data' (termasuk troopLink, videoUrl, baseImageUrl, baseLinkUrl)
// ... existing code ...
            ...data,
            // Tambahkan field yang dihasilkan server/default
// ... existing code ...
            authorId: authorProfile.uid,
            authorName: authorProfile.displayName,
// ... existing code ...
            authorAvatarUrl:
                authorProfile.avatarUrl || '/images/placeholder-avatar.png',
// ... existing code ...
            likes: 0,
            replies: 0,
// ... existing code ...
            createdAt: now, // Tipe ClientTimestamp
            updatedAt: now, // Tipe ClientTimestamp
// ... existing code ...
        };
        // --- AKHIR PERBAIKAN ---

// ... existing code ...
        // Hapus field undefined sebelum kirim ke firestore client sdk
        Object.keys(newPostData).forEach((key) => {
// ... existing code ...
            // Gunakan assertion tipe di sini
            if ((newPostData as any)[key] === undefined) {
// ... existing code ...
                delete (newPostData as any)[key];
            }
// ... existing code ...
        });

        const docRef = await clientAddDoc(postsRef, newPostData as any); // Gunakan 'as any' jika tipe masih bermasalah
// ... existing code ...
        return docRef.id;
    } catch (error) {
// ... existing code ...
        console.error(
            `Firestore Error [createPost - Client(author: ${authorProfile.uid})]:`,
// ... existing code ...
            error
        );
// ... existing code ...
        throw new Error('Gagal membuat postingan baru.');
    }
};


// --- FUNGSI BARU: Mengambil Postingan Berdasarkan Penulis ---
/**
// ... existing code ...
 * Mengambil daftar postingan berdasarkan UID penulis.
 * Menggunakan Client SDK.
// ... existing code ...
 */
export const getPostsByAuthor = async (
    authorId: string,
// ... existing code ...
    limitCount: number = 3
): Promise<FirestoreDocument<Post>[]> => {
// ... existing code ...
    const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
    // Query: filter berdasarkan authorId, urutkan berdasarkan waktu buat terbaru, batasi 3
// ... existing code ...
    let q = clientQuery(
        postsRef,
// ... existing code ...
        clientWhere('authorId', '==', authorId),
        clientOrderBy('createdAt', 'desc'),
// ... existing code ...
        clientLimit(limitCount)
    );

// ... existing code ...
    try {
        const snapshot = await clientGetDocs(q);
// ... existing code ...
        return snapshot.docs.map((doc) => {
            const data = doc.data();
// ... existing code ...
            Object.keys(data).forEach((key) => {
                if (data[key] instanceof ClientTimestamp) {
// ... existing code ...
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
// ... existing code ...
            });
            return {
// ... existing code ...
                id: doc.id,
                ...data,
// ... existing code ...
            } as FirestoreDocument<Post>;
        });
// ... existing code ...
    } catch (error) {
        console.error(
// ... existing code ...
            `Firestore Error [getPostsByAuthor - Client(${authorId})]:`,
            error
// ... existing code ...
        );
        return [];
// ... existing code ...
    }
};
// -------------------------------------------------------------------

/**
 * Mengambil daftar postingan dengan filter dan sortir.
 * Menggunakan Client SDK.
 */
export const getPosts = async (
    category: PostCategory | 'all',
    sortBy: 'createdAt' | 'likes' = 'createdAt',
    sortOrder: 'desc' | 'asc' = 'desc'
): Promise<FirestoreDocument<Post>[]> => {
    const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
    let q = clientQuery(postsRef);

    if (category && category !== 'Semua Diskusi' && category !== 'all') {
        q = clientQuery(q, clientWhere('category', '==', category));
    }

    q = clientQuery(q, clientOrderBy(sortBy, sortOrder));
    q = clientQuery(q, clientLimit(50));

    try {
        const snapshot = await clientGetDocs(q);
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            Object.keys(data).forEach((key) => {
                if (data[key] instanceof ClientTimestamp) {
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
            });
            return {
                id: doc.id,
                ...data,
            } as FirestoreDocument<Post>;
        });
    } catch (error) {
        console.error(
            `Firestore Error [getPosts - Client(category: ${category}, sortBy: ${sortBy})]:`,
            error
        );
        return [];
    }
};
