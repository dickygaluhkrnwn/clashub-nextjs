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
import { UserProfile, Player, Tournament, JoinRequest, Post, PostCategory, ManagedClan, PublicClanIndex, ClanApiCache, ClanRole } from './types';

// Helper Type
type FirestoreDocument<T> = T & { id: string };

// =========================================================================
// FUNGSI UTILITY UMUM (Client SDK)
// =========================================================================

export const uploadProfileImage = ( // Fungsi ini tetap sama, tidak terkait Firestore langsung
    uid: string,
    newAvatarUrl: string,
    onProgress?: (percentage: number) => void
): Promise<string> => {
    console.log(`[AVATAR STATIS] Avatar dipilih. URL: ${newAvatarUrl}`);
    return Promise.resolve(newAvatarUrl);
};

/**
 * Mengambil satu dokumen berdasarkan ID menggunakan Client SDK.
 * Mengonversi Timestamp Firestore ke objek Date JavaScript.
 */
async function getDocumentById<T>(collectionName: string, id: string): Promise<FirestoreDocument<T> | null> {
    try {
        const docRef = clientDoc(firestore, collectionName, id);
        const docSnap = await clientGetDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as DocumentData;
            // Konversi Timestamp ke Date
            Object.keys(data).forEach(key => {
                if (data[key] instanceof ClientTimestamp) {
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
                 // Handle Firestore Timestamps within nested objects/arrays if necessary
                 // This example only handles top-level timestamps
            });
            return { ...data as T, id: docSnap.id }; // Pastikan cast ke T setelah konversi
        }
        console.log(`Firestore Info [getDocumentById - Client(${collectionName}, ${id})]: Document not found.`);
        return null;
    } catch (error) {
        console.error(`Firestore Error [getDocumentById - Client(${collectionName}, ${id})]:`, error);
        return null; // Kembalikan null jika error
    }
}

/**
 * Mengambil semua dokumen dari sebuah koleksi menggunakan Client SDK.
 * Mengonversi Timestamp Firestore ke objek Date JavaScript.
 */
async function getCollectionData<T>(collectionName: string): Promise<FirestoreDocument<T>[]> {
    try {
        const colRef = clientCollection(firestore, collectionName);
        const snapshot = await clientGetDocs(colRef);

        return snapshot.docs.map((doc: DocumentData) => {
            const data = doc.data();
            // Konversi Timestamp ke Date
            Object.keys(data).forEach(key => {
                if (data[key] instanceof ClientTimestamp) {
                    data[key] = (data[key] as ClientTimestamp).toDate();
                }
                 // Handle Firestore Timestamps within nested objects/arrays if necessary
            });
            return { id: doc.id, ...data } as FirestoreDocument<T>; // Pastikan cast ke T setelah konversi
        });
    } catch (error) {
        console.error(`Firestore Error [getCollectionData - Client(${collectionName})]:`, error);
        return []; // Kembalikan array kosong jika error
    }
}


// =========================================================================
// FUNGSI SPESIFIK USERPROFILE (users) - Client SDK
// =========================================================================

/**
 * Membuat dokumen profil pengguna baru.
 * Menggunakan Client SDK. Dipanggil dari client (registrasi).
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
        // Pastikan semua field didefinisikan sesuai UserProfile
        const profileData: UserProfile = {
            uid: uid,
            email: data.email ?? null,
            displayName: data.displayName || data.playerTag || data.email?.split('@')[0] || `User_${uid.substring(0,4)}`,
            isVerified: data.isVerified ?? false,
            playerTag: data.playerTag || '',
            inGameName: data.inGameName, // Bisa undefined
            thLevel: data.thLevel ?? 9,
            trophies: data.trophies ?? 0,
            clanTag: data.clanTag ?? null,
            clanRole: data.clanRole ?? ClanRole.NOT_IN_CLAN,
            lastVerified: data.lastVerified, // Bisa undefined
            bio: data.bio || '',
            role: data.role || 'Free Agent',
            playStyle: data.playStyle, // Bisa undefined
            activeHours: data.activeHours || '',
            reputation: data.reputation ?? 5.0,
            avatarUrl: data.avatarUrl || '/images/placeholder-avatar.png',
            discordId: data.discordId ?? null, // Default ke null jika kosong
            website: data.website ?? null, // Default ke null jika kosong
            teamId: data.teamId ?? null,
            teamName: data.teamName ?? null,
        };
        // Hapus field undefined sebelum kirim ke firestore client sdk
         Object.keys(profileData).forEach(key => {
              if ((profileData as any)[key] === undefined) {
                  delete (profileData as any)[key];
              }
          });
        await clientSetDoc(userRef, profileData);
    } catch (error) {
        console.error(`Firestore Error [createUserProfile - Client(${uid})]:`, error);
        throw new Error("Gagal membuat profil pengguna baru di database.");
    }
};

/**
 * Memperbarui dokumen profil pengguna yang ada.
 * Menggunakan Client SDK. Dipanggil dari client (edit profil).
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
         // Hapus field undefined sebelum kirim
         const cleanData: Partial<UserProfile> = {};
         Object.keys(data).forEach(keyStr => {
              const key = keyStr as keyof Partial<UserProfile>;
              if (data[key] !== undefined) {
                  (cleanData as any)[key] = data[key];
              }
          });
        await clientSetDoc(userRef, cleanData, { merge: true });
    } catch (error) {
        console.error(`Firestore Error [updateUserProfile - Client(${uid})]:`, error);
        throw new Error(`Gagal memperbarui profil pengguna. Detail: ${(error as Error).message}`);
    }
};

/**
 * Mengambil data profil pengguna berdasarkan UID.
 * Menggunakan Client SDK. Bisa dipanggil dari client atau server.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    return getDocumentById<UserProfile>(COLLECTIONS.USERS, uid);
};

/**
 * Mengambil daftar semua pemain (subset UserProfile).
 * Menggunakan Client SDK.
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    // Perhatikan: Tipe Player adalah subset dari UserProfile
    return getCollectionData<Player>(COLLECTIONS.USERS);
};

// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans) - Client SDK (Hanya Read)
// =========================================================================

/**
 * Mengambil data ManagedClan berdasarkan ID internal Clashub.
 * Menggunakan Client SDK.
 */
export const getManagedClanData = async (clanId: string): Promise<FirestoreDocument<ManagedClan> | null> => {
    return getDocumentById<ManagedClan>(COLLECTIONS.MANAGED_CLANS, clanId);
};

/**
 * Mengambil daftar semua ManagedClan.
 * Menggunakan Client SDK.
 */
export const getManagedClans = async (): Promise<FirestoreDocument<ManagedClan>[]> => {
    return getCollectionData<ManagedClan>(COLLECTIONS.MANAGED_CLANS);
};

/**
 * Mengambil cache API klan (sub-koleksi).
 * Menggunakan Client SDK.
 */
export const getClanApiCache = async (clanId: string): Promise<ClanApiCache | null> => {
    const cachePath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/clanApiCache`;
    return getDocumentById<ClanApiCache>(cachePath, 'current');
};

// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex) - Client SDK (Hanya Read)
// =========================================================================

/**
 * Mengambil data indeks klan publik berdasarkan clanTag.
 * Menggunakan Client SDK.
 */
export const getPublicClanIndex = async (clanTag: string): Promise<PublicClanIndex | null> => {
    return getDocumentById<PublicClanIndex>(COLLECTIONS.PUBLIC_CLAN_INDEX, clanTag);
};

/**
 * Mengambil daftar semua indeks klan publik untuk Team Hub.
 * Menggunakan Client SDK.
 */
export const getPublicClansForHub = async (): Promise<FirestoreDocument<PublicClanIndex>[]> => {
    return getCollectionData<PublicClanIndex>(COLLECTIONS.PUBLIC_CLAN_INDEX);
};

// =========================================================================
// FUNGSI SPESIFIK LAINNYA - Client SDK
// =========================================================================

/**
 * Mengambil daftar turnamen.
 * Menggunakan Client SDK.
 */
export const getTournaments = async (): Promise<FirestoreDocument<Tournament>[]> => {
    return getCollectionData<Tournament>(COLLECTIONS.TOURNAMENTS);
};

/**
 * Mengambil daftar anggota tim berdasarkan teamId.
 * Menggunakan Client SDK.
 */
export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
    try {
        const usersRef = clientCollection(firestore, COLLECTIONS.USERS);
        const q = clientQuery(
            usersRef,
            clientWhere('teamId', '==', teamId)
        );
        const snapshot = await clientGetDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            Object.keys(data).forEach(key => {
                 if (data[key] instanceof ClientTimestamp) {
                     data[key] = (data[key] as ClientTimestamp).toDate();
                 }
             });
            return { uid: doc.id, ...data } as UserProfile;
        });
    } catch (error) {
        console.error(`Firestore Error [getTeamMembers - Client(${teamId})]:`, error);
        return [];
    }
};

/**
 * Mengirim permintaan bergabung ke tim.
 * Menggunakan Client SDK. Dipanggil dari client.
 */
export const sendJoinRequest = async (
    teamId: string,
    teamName: string,
    requesterProfile: UserProfile,
    message: string = ''
): Promise<void> => {
    try {
        const requestsRef = clientCollection(firestore, COLLECTIONS.JOIN_REQUESTS);
        const requestData: Omit<JoinRequest, 'id' | 'timestamp'> & { timestamp: ClientTimestamp } = {
            teamId,
            teamName,
            requesterId: requesterProfile.uid,
            requesterName: requesterProfile.displayName,
            requesterThLevel: requesterProfile.thLevel || 0,
            message,
            status: 'pending',
            timestamp: ClientTimestamp.now(),
        };
        await clientAddDoc(requestsRef, requestData);
    } catch (error) {
        console.error(`Firestore Error [sendJoinRequest - Client(${teamId}, ${requesterProfile.uid})]:`, error);
        throw new Error("Gagal mengirim permintaan bergabung.");
    }
};

/**
 * Mengambil daftar permintaan bergabung yang tertunda untuk tim tertentu.
 * Menggunakan Client SDK.
 */
export const getJoinRequests = async (teamId: string): Promise<FirestoreDocument<JoinRequest>[]> => {
    try {
        const requestsRef = clientCollection(firestore, COLLECTIONS.JOIN_REQUESTS);
        const q = clientQuery(
            requestsRef,
            clientWhere('teamId', '==', teamId),
            clientWhere('status', '==', 'pending'),
            clientOrderBy('timestamp', 'desc')
        );
        const snapshot = await clientGetDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as ClientTimestamp).toDate()
            } as FirestoreDocument<JoinRequest>;
        });
    } catch (error) {
        console.error(`Firestore Error [getJoinRequests - Client(${teamId})]:`, error);
        return [];
    }
};

// --- FUNGSI KNOWLEDGE HUB (Client SDK) ---

/**
 * Mengambil postingan berdasarkan ID.
 * Menggunakan Client SDK.
 */
export const getPostById = async (postId: string): Promise<FirestoreDocument<Post> | null> => {
    const post = await getDocumentById<Post>(COLLECTIONS.POSTS, postId);
    return post;
};

/**
 * Membuat postingan baru.
 * Menggunakan Client SDK. Dipanggil dari client.
 */
export const createPost = async (
    data: {
        title: string,
        content: string,
        category: PostCategory,
        tags: string[],
    },
    authorProfile: UserProfile
): Promise<string> => {
    if (!authorProfile || !authorProfile.playerTag || !authorProfile.thLevel || authorProfile.thLevel < 1) {
        throw new Error("Gagal membuat postingan. E-Sports CV Anda belum lengkap (Player Tag/TH Level wajib diisi).");
    }

    try {
        const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
        const now = ClientTimestamp.now();

        const newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: ClientTimestamp, updatedAt: ClientTimestamp } = {
            title: data.title,
            content: data.content,
            category: data.category,
            tags: data.tags,
            authorId: authorProfile.uid,
            authorName: authorProfile.displayName,
            authorAvatarUrl: authorProfile.avatarUrl || '/images/placeholder-avatar.png',
            likes: 0,
            replies: 0,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await clientAddDoc(postsRef, newPostData);
        return docRef.id;
    } catch (error) {
        console.error(`Firestore Error [createPost - Client(author: ${authorProfile.uid})]:`, error);
        throw new Error("Gagal membuat postingan baru.");
    }
};

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
        return snapshot.docs.map(doc => {
            const data = doc.data();
             Object.keys(data).forEach(key => {
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
        console.error(`Firestore Error [getPosts - Client(category: ${category}, sortBy: ${sortBy})]:`, error);
        return [];
    }
};

