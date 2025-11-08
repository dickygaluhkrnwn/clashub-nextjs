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
    QueryConstraint, // <-- TAMBAHAN: Impor QueryConstraint
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
    WarSummary, // <-- [BARU] Import tipe WarSummary
    WarArchive, // <-- [BARU] Import tipe WarArchive
    KnowledgeHubItem, // <-- TAMBAHAN: Impor tipe gabungan
} from './types';

// Helper Tipe
// PERBAIKAN KRITIS: Menambahkan export agar tipe ini dapat diimpor oleh komponen lain
export type FirestoreDocument<T> = T & { id: string }; 

// =========================================================================
// FUNGSI UTILITY UMUM (Client SDK)
// =========================================================================

// --- Fungsi Konversi Dokumen ---
// Helper internal untuk mengonversi snapshot dokumen Firestore ke objek dengan ID dan konversi Timestamp
function docToData<T>(doc: DocumentData): FirestoreDocument<T> | null {
    if (!doc.exists()) {
        return null;
    }
    const data = doc.data();
    // Konversi Timestamp ke Date
    Object.keys(data).forEach((key) => {
        if (data[key] instanceof ClientTimestamp) {
            data[key] = (data[key] as ClientTimestamp).toDate();
        }
        // TODO: Handle nested Timestamps if necessary
    });
    return { id: doc.id, ...data } as FirestoreDocument<T>;
}
// -----------------------------


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
 */
async function getDocumentById<T>(
    collectionName: string,
    id: string
): Promise<FirestoreDocument<T> | null> {
    try {
        const docRef = clientDoc(firestore, collectionName, id);
        const docSnap = await clientGetDoc(docRef);
        return docToData<T>(docSnap); // Gunakan helper konversi
    } catch (error) {
        console.error(
            `Firestore Error [getDocumentById - Client(${collectionName}, ${id})]:`,
            error
        );
        return null; // Kembalikan null jika error
    }
}

/**
 * Mengambil semua dokumen dari sebuah koleksi menggunakan Client SDK.
 */
async function getCollectionData<T>(
    collectionName: string
): Promise<FirestoreDocument<T>[]> {
    try {
        const colRef = clientCollection(firestore, collectionName);
        const snapshot = await clientGetDocs(colRef);
        // Gunakan helper konversi untuk setiap dokumen
        return snapshot.docs.map(doc => docToData<T>(doc)).filter(item => item !== null) as FirestoreDocument<T>[];
    } catch (error) {
        console.error(
            `Firestore Error [getCollectionData - Client(${collectionName})]:`,
            error
        );
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
export const createUserProfile = async (
    uid: string,
    data: Partial<UserProfile>
): Promise<void> => {
    try {
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
        // Pastikan semua field didefinisikan sesuai UserProfile
        const profileData: UserProfile = {
            uid: uid,
            email: data.email ?? null,
            displayName:
                data.displayName ||
                data.playerTag ||
                data.email?.split('@')[0] ||
                `User_${uid.substring(0, 4)}`,
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
            clanId: data.clanId ?? null,
            clanName: data.clanName ?? null,
        };
        // Hapus field undefined sebelum kirim ke firestore client sdk
        Object.keys(profileData).forEach((key) => {
            if ((profileData as any)[key] === undefined) {
                delete (profileData as any)[key];
            }
        });
        await clientSetDoc(userRef, profileData, { merge: true }); // Menggunakan merge true untuk update
    } catch (error) {
        console.error(`Firestore Error [createUserProfile - Client(${uid})]:`, error);
        throw new Error('Gagal membuat profil pengguna baru di database.');
    }
};

/**
 * Memperbarui dokumen profil pengguna yang ada.
 * Menggunakan Client SDK. Dipanggil dari client (edit profil).
 */
export const updateUserProfile = async (
    uid: string,
    data: Partial<UserProfile>
): Promise<void> => {
    try {
        const userRef = clientDoc(firestore, COLLECTIONS.USERS, uid);
        // Hapus field undefined sebelum kirim
        const cleanData: Partial<UserProfile> = {};
        Object.keys(data).forEach((keyStr) => {
            const key = keyStr as keyof Partial<UserProfile>;
            if (data[key] !== undefined) {
                (cleanData as any)[key] = data[key];
            }
        });
        await clientSetDoc(userRef, cleanData, { merge: true });
    } catch (error) {
        console.error(`Firestore Error [updateUserProfile - Client(${uid})]:`, error);
        throw new Error(
            `Gagal memperbarui profil pengguna. Detail: ${(error as Error).message}`
        );
    }
};

/**
 * Mengambil data profil pengguna berdasarkan UID.
 * Menggunakan Client SDK. Bisa dipanggil dari client atau server.
 */
export const getUserProfile = async (
    uid: string
): Promise<UserProfile | null> => {
    return getDocumentById<UserProfile>(COLLECTIONS.USERS, uid);
};

/**
 * Mengambil data profil pengguna berdasarkan Tag Pemain CoC.
 */
export const getUserProfileByTag = async (
    playerTag: string
): Promise<UserProfile | null> => {
    const normalizedTag = playerTag.startsWith('#')
        ? playerTag.toUpperCase()
        : `#${playerTag.toUpperCase()}`;
    try {
        const usersRef = clientCollection(firestore, COLLECTIONS.USERS);
        const q = clientQuery(
            usersRef,
            clientWhere('playerTag', '==', normalizedTag),
            clientLimit(1)
        );
        const snapshot = await clientGetDocs(q);
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return docToData<UserProfile>(doc); // Gunakan helper konversi
        }
        console.log(
            `Firestore Info [getUserProfileByTag - Client(${normalizedTag})]: Profile not found.`
        );
        return null;
    } catch (error) {
        console.error(
            `Firestore Error [getUserProfileByTag - Client(${normalizedTag})]:`,
            error
        );
        return null;
    }
};

/**
 * Mengambil daftar semua pemain (subset UserProfile).
 * Menggunakan Client SDK.
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    return getCollectionData<Player>(COLLECTIONS.USERS);
};

// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans) - Client SDK (Hanya Read)
// =========================================================================

/**
 * Mengambil data ManagedClan berdasarkan ID internal Clashub.
 * Menggunakan Client SDK.
 */
export const getManagedClanData = async (
    clanId: string
): Promise<FirestoreDocument<ManagedClan> | null> => {
    return getDocumentById<ManagedClan>(COLLECTIONS.MANAGED_CLANS, clanId);
};

/**
 * Mengambil daftar semua ManagedClan.
 * Menggunakan Client SDK.
 */
export const getManagedClans = async (): Promise<
    FirestoreDocument<ManagedClan>[]
> => {
    return getCollectionData<ManagedClan>(COLLECTIONS.MANAGED_CLANS);
};

/**
 * Mengambil data ManagedClan berdasarkan Clan Tag CoC.
 * Menggunakan Client SDK.
 */
export const getManagedClanByTag = async (
    clanTag: string
): Promise<FirestoreDocument<ManagedClan> | null> => {
    const normalizedTag = clanTag.startsWith('#')
        ? clanTag.toUpperCase()
        : `#${clanTag.toUpperCase()}`;
    try {
        const clansRef = clientCollection(firestore, COLLECTIONS.MANAGED_CLANS);
        const q = clientQuery(
            clansRef,
            clientWhere('tag', '==', normalizedTag),
            clientLimit(1)
        );
        const snapshot = await clientGetDocs(q);
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return docToData<ManagedClan>(doc); // Gunakan helper konversi
        }
        console.log(
            `Firestore Info [getManagedClanByTag - Client(${normalizedTag})]: Managed Clan not found.`
        );
        return null;
    } catch (error) {
        console.error(
            `Firestore Error [getManagedClanByTag - Client(${normalizedTag})]:`,
            error
        );
        return null;
    }
};

/**
 * Mengambil cache API klan (sub-koleksi).
 * Menggunakan Client SDK.
 */
export const getClanApiCache = async (
    clanId: string
): Promise<ClanApiCache | null> => {
    const cachePath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/clanApiCache`;
    return getDocumentById<ClanApiCache>(cachePath, 'current');
};

// =========================================================================
// FUNGSI SPESIFIK ARSIP (warArchives) - Client SDK (Hanya Read)
// =========================================================================

/**
 * Mengambil satu dokumen arsip War Classic berdasarkan ID.
 * Digunakan oleh WarDetailModal.tsx.
 */
export const getWarArchive = async (
    clanId: string,
    warId: string
): Promise<WarArchive | null> => {
    try {
        const warArchivesPath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/warArchives`;
        // WarArchive sudah diimpor melalui './types'
        const warArchive = await getDocumentById<WarArchive>(warArchivesPath, warId);
        return warArchive;
    } catch (error) {
        console.error(`Firestore Error [getWarArchive - Client(${clanId}, ${warId})]:`, error);
        return null;
    }
};

/**
 * [BARU] Mengambil daftar ringkasan perang (WarSummary) yang diarsipkan.
 * Digunakan oleh WarHistoryTabContent.tsx.
 */
export const getWarSummaries = async (
    clanId: string,
    limitCount: number = 50
): Promise<FirestoreDocument<WarSummary>[]> => {
    try {
        const warArchivesPath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/warArchives`;
        const warArchivesRef = clientCollection(firestore, warArchivesPath);

        // Query: order by warEndTime descending (terbaru dulu), limit 50
        const q = clientQuery(
            warArchivesRef,
            clientOrderBy('warEndTime', 'desc'),
            clientLimit(limitCount)
        );

        const snapshot = await clientGetDocs(q);
        
        return snapshot.docs.map(doc => {
            const archive = docToData<WarArchive>(doc);
            if (!archive) return null;

            // Map WarArchive (detail data) to WarSummary (ringkasan data)
            // PERBAIKAN ERROR 2783: Memastikan field tidak diduplikasi saat mapping.
            const summary: WarSummary = {
                id: archive.id, // ID dokumen Firestore
                opponentName: archive.opponent?.name || 'Klan Lawan',
                teamSize: archive.teamSize || 0,
                result: archive.result || 'unknown',
                ourStars: archive.clan?.stars || 0,
                opponentStars: archive.opponent?.stars || 0,
                ourDestruction: archive.clan?.destructionPercentage || 0,
                opponentDestruction: archive.opponent?.destructionPercentage || 0,
                endTime: archive.warEndTime, // Sudah di-convert ke Date oleh docToData
                hasDetails: archive.hasDetails === true,
            };

            return summary as FirestoreDocument<WarSummary>; 
        }).filter(item => item !== null) as FirestoreDocument<WarSummary>[];
    } catch (error) {
        console.error(`Firestore Error [getWarSummaries - Client(${clanId})]:`, error);
        return [];
    }
};


// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex) - Client SDK (Hanya Read)
// =========================================================================

/**
 * Mengambil data indeks klan publik berdasarkan clanTag.
 * Menggunakan Client SDK.
 */
export const getPublicClanIndex = async (
    clanTag: string
): Promise<PublicClanIndex | null> => {
    return getDocumentById<PublicClanIndex>(
        COLLECTIONS.PUBLIC_CLAN_INDEX,
        clanTag
    );
};

// ... (Sisa kode yang tidak berubah)
/**
 * Mengambil daftar semua indeks klan publik untuk Team Hub.
 * Menggunakan Client SDK.
 */
export const getPublicClansForHub = async (): Promise<
    FirestoreDocument<PublicClanIndex>[]
> => {
    return getCollectionData<PublicClanIndex>(COLLECTIONS.PUBLIC_CLAN_INDEX);
};

// =========================================================================
// FUNGSI SPESIFIK LAINNYA - Client SDK
// =========================================================================

/**
 * Mengambil daftar turnamen.
 * Menggunakan Client SDK.
 */
export const getTournaments = async (): Promise<
    FirestoreDocument<Tournament>[]
> => {
    return getCollectionData<Tournament>(COLLECTIONS.TOURNAMENTS);
};

/**
 * Mengambil daftar anggota tim berdasarkan clanId.
 * Menggunakan Client SDK.
 */
export const getTeamMembers = async (clanId: string): Promise<UserProfile[]> => {
    try {
        const usersRef = clientCollection(firestore, COLLECTIONS.USERS);
        const q = clientQuery(
            usersRef,
            clientWhere('clanId', '==', clanId)
        );
        const snapshot = await clientGetDocs(q);
        return snapshot.docs.map(doc => docToData<UserProfile>(doc)).filter(Boolean) as UserProfile[]; // Filter null results
    } catch (error) {
        console.error(`Firestore Error [getTeamMembers - Client(${clanId})]:`, error);
        return [];
    }
};

/**
 * Mengambil satu dokumen permintaan bergabung berdasarkan ID.
 * Menggunakan Client SDK.
 */
export const getJoinRequest = async (
    clanId: string,
    requestId: string
): Promise<FirestoreDocument<JoinRequest> | null> => {
    try {
        const requestsPath = `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`;
        const request = await getDocumentById<JoinRequest>(requestsPath, requestId);
        return request;
    } catch (error) {
        console.error(`Firestore Error [getJoinRequest - Client(${clanId}, ${requestId})]:`, error);
        return null;
    }
};

/**
 * Mengirim permintaan bergabung ke tim.
 * Menggunakan Client SDK. Dipanggil dari client.
 */
export const sendJoinRequest = async (
    clanId: string,
    clanName: string,
    requesterProfile: UserProfile,
    message: string = ''
): Promise<void> => {
    try {
        const requestsRef = clientCollection(
            firestore,
            `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
        );
        const requestData: Omit<JoinRequest, 'id' | 'timestamp'> & {
            timestamp: ClientTimestamp;
        } = {
            clanId,
            clanName,
            requesterId: requesterProfile.uid,
            requesterName: requesterProfile.displayName,
            requesterThLevel: requesterProfile.thLevel || 0,
            message,
            status: 'pending',
            timestamp: ClientTimestamp.now(),
        };
        await clientAddDoc(requestsRef, requestData);
    } catch (error) {
        console.error(
            `Firestore Error [sendJoinRequest - Client(${clanId}, ${requesterProfile.uid})]:`,
            error
        );
        throw new Error('Gagal mengirim permintaan bergabung.');
    }
};

/**
 * Mengambil daftar permintaan bergabung yang tertunda untuk tim tertentu.
 * Menggunakan Client SDK.
 */
export const getJoinRequests = async (
    clanId: string
): Promise<FirestoreDocument<JoinRequest>[]> => {
    try {
        const requestsRef = clientCollection(
            firestore,
            `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
        );
        const q = clientQuery(
            requestsRef,
            clientWhere('status', '==', 'pending'),
            clientOrderBy('timestamp', 'desc')
        );
        const snapshot = await clientGetDocs(q);
        return snapshot.docs.map(doc => docToData<JoinRequest>(doc)).filter(Boolean) as FirestoreDocument<JoinRequest>[];
    } catch (error) {
        console.error(`Firestore Error [getJoinRequests - Client(${clanId})]:`, error);
        return [];
    }
};

// --- FUNGSI KNOWLEDGE HUB (Client SDK) ---

/**
 * Mengambil postingan berdasarkan ID.
 * Menggunakan Client SDK.
 */
export const getPostById = async (
    postId: string
): Promise<FirestoreDocument<Post> | null> => {
    const post = await getDocumentById<Post>(COLLECTIONS.POSTS, postId);
    return post;
};

/**
 * Membuat postingan baru.
 * Menggunakan Client SDK. Dipanggil dari client.
 */
export const createPost = async (
    data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'replies' | 'authorId' | 'authorName' | 'authorAvatarUrl'>,
    authorProfile: UserProfile
): Promise<string> => {
    if (
        !authorProfile ||
        !authorProfile.playerTag ||
        !authorProfile.thLevel ||
        authorProfile.thLevel < 1
    ) {
        throw new Error(
            'Gagal membuat postingan. E-Sports CV Anda belum lengkap (Player Tag/TH Level wajib diisi).'
        );
    }
    try {
        const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
        const now = ClientTimestamp.now();
        const newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & {
            createdAt: ClientTimestamp;
            updatedAt: ClientTimestamp;
        } = {
            ...data,
            authorId: authorProfile.uid,
            authorName: authorProfile.displayName,
            authorAvatarUrl:
                authorProfile.avatarUrl || '/images/placeholder-avatar.png',
            
            // [PERBAIKAN ERROR TS2322]
            // 'likes' adalah string[], bukan number. Inisialisasi sebagai array kosong.
            likes: [], 

            replies: 0,
            createdAt: now,
            updatedAt: now,
        };
        Object.keys(newPostData).forEach((key) => {
            if ((newPostData as any)[key] === undefined) {
                delete (newPostData as any)[key];
            }
        });
        const docRef = await clientAddDoc(postsRef, newPostData as any);
        return docRef.id;
    } catch (error) {
        console.error(
            `Firestore Error [createPost - Client(author: ${authorProfile.uid})]:`,
            error
        );
        throw new Error('Gagal membuat postingan baru.');
    }
};

/**
 * Mengambil daftar postingan berdasarkan UID penulis.
 * Menggunakan Client SDK.
 */
export const getPostsByAuthor = async (
    authorId: string,
    limitCount: number = 3
): Promise<FirestoreDocument<Post>[]> => {
    const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
    let q = clientQuery(
        postsRef,
        clientWhere('authorId', '==', authorId),
        clientOrderBy('createdAt', 'desc'),
        clientLimit(limitCount)
    );
    try {
        const snapshot = await clientGetDocs(q);
        return snapshot.docs.map(doc => docToData<Post>(doc)).filter(Boolean) as FirestoreDocument<Post>[];
    } catch (error) {
        console.error(
            `Firestore Error [getPostsByAuthor - Client(${authorId})]:`,
            error
        );
        return [];
    }
};

/**
 * Mengambil daftar postingan atau video dengan filter dan sortir.
 * Menggunakan Client SDK.
 */
export const getPosts = async (
    // PERBAIKAN 1: Update tipe parameter category
    category: PostCategory | 'all' | 'all-posts',
    // PERBAIKAN 2: Update tipe sortBy (createdAt untuk Post, publishedAt untuk Video)
    sortBy: 'createdAt' | 'publishedAt' | 'likes' = 'createdAt', // <-- Izinkan 'likes'
    sortOrder: 'desc' | 'asc' = 'desc'
    // PERBAIKAN 3: Update return type
): Promise<FirestoreDocument<KnowledgeHubItem>[]> => {

    const results: FirestoreDocument<KnowledgeHubItem>[] = [];
    const queries: Promise<void>[] = []; // Array untuk menampung promise fetch

    // --- PERBAIKAN LOGIKA ---
    // 1. Tentukan kapan harus fetch video
    // (Hanya jika 'all' atau 'Berita Komunitas')
    const shouldFetchVideos = category === 'all' || category === 'Berita Komunitas';

    // 2. Tentukan kapan harus fetch post
    // (Selalu fetch post, KECUALI jika kita mau filter 'Videos Only' - tapi kita tidak punya filter itu)
    const shouldFetchPosts = true; 
    
    // 3. Tentukan key untuk sorting di database
    const postSortKey = sortBy === 'likes' ? 'likes' : 'createdAt';
    // -------------------------

    // --- Query untuk Posts ---
    if (shouldFetchPosts) {
        const postsRef = clientCollection(firestore, COLLECTIONS.POSTS);
        const postConstraints: QueryConstraint[] = [];

        // 4. PERBAIKAN LOGIKA FILTER KATEGORI POSTS
        // Hanya tambahkan filter 'where' jika kategori BUKAN 'all' atau 'all-posts'.
        if (category !== 'all' && category !== 'all-posts') {
            // Ini akan menangani 'Berita Komunitas', 'Strategi Serangan', dll.
            postConstraints.push(clientWhere('category', '==', category));
        }

        // 5. PERBAIKAN LOGIKA SORTING POSTS
        postConstraints.push(clientOrderBy(postSortKey, sortOrder));
        postConstraints.push(clientLimit(50)); // Batasi jumlah

        const qPosts = clientQuery(postsRef, ...postConstraints);

        queries.push(
            clientGetDocs(qPosts).then(snapshot => {
                snapshot.docs.forEach(doc => {
                    const post = docToData<Post>(doc);
                    if (post) {
                        results.push(post);
                    }
                });
            }).catch(error => {
                console.error(`Firestore Error [getPosts - Posts Query (category: ${category})]:`, error);
                // Jangan throw error, biarkan fungsi mengembalikan hasil parsial jika mungkin
            })
        );
    }

    // --- Query untuk Videos ---
    if (shouldFetchVideos) {
        const videosRef = clientCollection(firestore, COLLECTIONS.VIDEOS);
        const videoConstraints: QueryConstraint[] = [];

        // 8. PERBAIKAN LOGIKA SORTING VIDEO
        // Video tidak punya 'likes', jadi JIKA sortBy 'likes', kita fallback ke 'publishedAt'.
        const videoSortKey = 'publishedAt'; // Selalu sort video by publishedAt
        videoConstraints.push(clientOrderBy(videoSortKey, sortOrder));
        videoConstraints.push(clientLimit(10)); // Batasi jumlah video (misalnya lebih sedikit)

        const qVideos = clientQuery(videosRef, ...videoConstraints);

        queries.push(
            clientGetDocs(qVideos).then(snapshot => {
                snapshot.docs.forEach(doc => {
                    const video = docToData<Video>(doc);
                    // 9. Safety check: Jangan tambahkan video jika filter 'all-posts'
                    if (video) {
                        results.push(video);
                    }
                });
            }).catch(error => {
                console.error(`[Firestore Error [getPosts - Videos Query]:`, error);
            })
        );
    }

    try {
        // Jalankan semua query secara paralel
        await Promise.all(queries);

        // --- Penggabungan dan Pengurutan Akhir ---
        // Jika sorting berdasarkan 'likes', kita harus sorting di client
        if (sortBy === 'likes') {
             results.sort((a, b) => {
                // [PERBAIKAN ERROR TS2362/TS2363]
                // Gunakan '.length' karena 'likes' adalah string[].
                // Gunakan Array.isArray untuk memastikan tipe-nya aman.
                const scoreA = Array.isArray((a as Post).likes) ? (a as Post).likes.length : 0;
                const scoreB = Array.isArray((b as Post).likes) ? (b as Post).likes.length : 0;
                
                // Jika sortOrder desc (trending), B - A
                return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
             });
        } 
        // Jika sorting berdasarkan 'createdAt' (terbaru), kita sort berdasarkan tanggal
        else {
            results.sort((a, b) => {
                const dateA = (a as Post).createdAt ?? (a as Video).publishedAt;
                const dateB = (b as Post).createdAt ?? (b as Video).publishedAt;
                // Pastikan dateA dan dateB adalah objek Date
                const timeA = dateA instanceof Date ? dateA.getTime() : 0;
                const timeB = dateB instanceof Date ? dateB.getTime() : 0;

                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
            });
        }

        // Batasi total hasil gabungan jika perlu (misal: 50 item)
        return results.slice(0, 50);

    } catch (error) {
        // Tangani error umum jika Promise.all gagal (meskipun catch di dalam sudah ada)
        console.error(`Firestore Error [getPosts - Overall Fetch (category: ${category})]:`, error);
        return []; // Kembalikan array kosong jika ada error besar
    }
};