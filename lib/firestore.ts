// File: lib/firestore.ts (PERBAIKAN FINAL KEDUA)
// Deskripsi: Berisi semua fungsi utilitas untuk berinteraksi dengan Firebase Firestore.
// DIROMBAK untuk mendukung arsitektur ManagedClan dan PublicClanIndex (Sprint 4.1).
// PERBAIKAN: Menambahkan getPublicClansForHub untuk Team Hub.

import { firestore } from './firebase'; 
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    DocumentData,
    query,
    where,
    addDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

// Impor tipe data yang sudah kita definisikan, termasuk tipe klan baru
import { UserProfile, Team, Player, Tournament, JoinRequest, Post, PostCategory, ManagedClan, PublicClanIndex, ClanApiCache, ClanRole } from './types';


// Helper Type untuk memastikan data dari Firestore memiliki ID dan semua field T
type FirestoreDocument<T> = T & { id: string };

// =========================================================================
// FIREBASE FIRESTORE PATHS (KOLEKSI UTAMA)
// =========================================================================

const COLLECTIONS = {
    USERS: 'users',
    MANAGED_CLANS: 'managedClans', // Klan Internal yang Dikelola
    PUBLIC_CLAN_INDEX: 'publicClanIndex', // Cache Klan Publik
    JOIN_REQUESTS: 'joinRequests',
    POSTS: 'posts',
    TOURNAMENTS: 'tournaments',
}

// =========================================================================
// FUNGSI UTILITY UMUM (Dipertahankan)
// =========================================================================

export const uploadProfileImage = (
    uid: string, 
    newAvatarUrl: string,
    onProgress?: (percentage: number) => void
): Promise<string> => {
    console.log(`[AVATAR STATIS] Avatar dipilih. URL: ${newAvatarUrl}`);
    return Promise.resolve(newAvatarUrl);
};

async function getDocumentById<T>(collectionName: string, id: string): Promise<FirestoreDocument<T> | null> {
    try {
        const docRef = doc(firestore, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as T;
            return { ...data, id: docSnap.id } as FirestoreDocument<T>;
        }
        console.log(`Firestore Info [getDocumentById(${collectionName}, ${id})]: Document not found.`);
        return null;
    } catch (error) {
        console.error(`Firestore Error [getDocumentById(${collectionName}, ${id})]:`, error);
        return null;
    }
}

async function getCollectionData<T>(collectionName: string): Promise<FirestoreDocument<T>[]> {
    try {
        const colRef = collection(firestore, collectionName);
        const snapshot = await getDocs(colRef);

        return snapshot.docs.map((doc: DocumentData) => ({
            id: doc.id,
            ...doc.data(),
        })) as FirestoreDocument<T>[];
    } catch (error) {
        console.error(`Firestore Error [getCollectionData(${collectionName})]:`, error);
        return [];
    }
}

// =========================================================================
// FUNGSI SPESIFIK USERPROFILE (users)
// =========================================================================

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = doc(firestore, COLLECTIONS.USERS, uid);
        const profileData: UserProfile = {
            uid: uid,
            email: data.email || null,
            displayName: data.playerTag || data.email?.split('@')[0] || 'New Player',
            isVerified: false, 
            playerTag: data.playerTag || '',
            inGameName: data.inGameName || undefined,
            clanTag: data.clanTag || null,
            clanRole: data.clanRole || ClanRole.NOT_IN_CLAN,
            thLevel: data.thLevel || 9, 
            trophies: data.trophies || 0, 
            lastVerified: data.lastVerified || undefined, 
            bio: data.bio || '',
            role: data.role || 'Free Agent',
            playStyle: data.playStyle || 'Attacker Utama',
            activeHours: data.activeHours || '',
            reputation: data.reputation || 5.0,
            avatarUrl: data.avatarUrl || '/images/placeholder-avatar.png', 
            discordId: data.discordId || '',
            website: data.website || '',
            teamId: data.teamId || null,
            teamName: data.teamName || null,
        };
        await setDoc(userRef, profileData);
    } catch (error) {
        console.error(`Firestore Error [createUserProfile(${uid})]:`, error);
        throw new Error("Gagal membuat profil pengguna baru di database.");
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    try {
        const userRef = doc(firestore, COLLECTIONS.USERS, uid);
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error(`Firestore Error [updateUserProfile(${uid})]:`, error);
        throw new Error(`Gagal memperbarui profil pengguna. Detail: ${error}`);
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(firestore, COLLECTIONS.USERS, uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            return { ...data, uid: docSnap.id };
        } else {
            console.log(`Firestore Info [getUserProfile(${uid})]: No such user profile!`);
            return null;
        }
    } catch (error) {
        console.error(`Firestore Error [getUserProfile(${uid})]:`, error);
        return null;
    }
};

export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    return getCollectionData<Player>(COLLECTIONS.USERS);
};

// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans)
// =========================================================================

export const createOrLinkManagedClan = async (clanTag: string, clanName: string, ownerUid: string): Promise<string> => {
    try {
        const managedClansRef = collection(firestore, COLLECTIONS.MANAGED_CLANS);
        const q = query(managedClansRef, where('tag', '==', clanTag), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log(`[ManagedClan] Klan ${clanTag} sudah dikelola. ID: ${snapshot.docs[0].id}`);
            return snapshot.docs[0].id;
        }

        const newClanData: ManagedClan = {
            id: '',
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
            lastSynced: Timestamp.now().toDate(),
        };

        const docRef = await addDoc(managedClansRef, newClanData);
        await updateDoc(docRef, { id: docRef.id });

        console.log(`[ManagedClan] Klan baru dibuat: ${clanName} (${docRef.id})`);
        return docRef.id;

    } catch (error) {
        console.error(`Firestore Error [createOrLinkManagedClan(${clanTag})]:`, error);
        throw new Error("Gagal membuat atau menautkan klan yang dikelola.");
    }
};

export const getManagedClanData = async (clanId: string): Promise<FirestoreDocument<ManagedClan> | null> => {
    return getDocumentById<ManagedClan>(COLLECTIONS.MANAGED_CLANS, clanId);
};

export const getManagedClans = async (): Promise<FirestoreDocument<ManagedClan>[]> => {
    return getCollectionData<ManagedClan>(COLLECTIONS.MANAGED_CLANS);
};

export const getClanApiCache = async (clanId: string): Promise<ClanApiCache | null> => {
    const cacheRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId, 'clanApiCache', 'current');
    const docSnap = await getDoc(cacheRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as ClanApiCache;
        if (data.lastUpdated instanceof Timestamp) {
            data.lastUpdated = data.lastUpdated.toDate();
        }
        return data;
    }
    return null;
}

export const updateClanApiCache = async (
    clanId: string, 
    cacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'>,
    updatedManagedClanFields: Partial<ManagedClan>
): Promise<void> => {
    try {
        const cacheRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId, 'clanApiCache', 'current');
        const managedClanRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId);

        const cachePayload = {
            ...cacheData,
            id: 'current',
            lastUpdated: Timestamp.now(),
        };
        await setDoc(cacheRef, cachePayload);

        await updateDoc(managedClanRef, {
            ...updatedManagedClanFields,
            lastSynced: Timestamp.now(),
        });

    } catch (error) {
        console.error(`Firestore Error [updateClanApiCache(${clanId})]:`, error);
        throw new Error("Gagal menyimpan cache API klan.");
    }
}

// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex)
// =========================================================================

export const getPublicClanIndex = async (clanTag: string): Promise<PublicClanIndex | null> => {
    const docRef = doc(firestore, COLLECTIONS.PUBLIC_CLAN_INDEX, clanTag);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as PublicClanIndex;
        if (data.lastUpdated instanceof Timestamp) {
            data.lastUpdated = data.lastUpdated.toDate();
        }
        return data;
    }
    return null;
}

export const getPublicClansForHub = async (): Promise<FirestoreDocument<PublicClanIndex>[]> => {
    return getCollectionData<PublicClanIndex>(COLLECTIONS.PUBLIC_CLAN_INDEX);
};

export const updatePublicClanIndex = async (clanTag: string, clanData: Partial<PublicClanIndex>): Promise<void> => {
    try {
        const docRef = doc(firestore, COLLECTIONS.PUBLIC_CLAN_INDEX, clanTag);
        
        const payload: PublicClanIndex = {
            tag: clanData.tag || clanTag,
            name: clanData.name || 'Nama Klan Tidak Ditemukan',
            clanLevel: clanData.clanLevel || 1,
            memberCount: clanData.memberCount || 0,
            clanPoints: clanData.clanPoints || 0,
            clanCapitalPoints: clanData.clanCapitalPoints || 0,
            clanVersusPoints: clanData.clanVersusPoints || 0, // Menambahkan field untuk konsistensi
            badgeUrls: clanData.badgeUrls || {
                small: '/images/clan-badge-placeholder.png',
                medium: '/images/clan-badge-placeholder.png',
                large: '/images/clan-badge-placeholder.png',
            },
            lastUpdated: Timestamp.now().toDate(),
            // Menambahkan field opsional lainnya dengan nilai default null
            requiredTrophies: clanData.requiredTrophies || 0,
            warFrequency: clanData.warFrequency || 'unknown',
            warWinStreak: clanData.warWinStreak || 0,
            warWins: clanData.warWins || 0,
            type: clanData.type || 'closed',
            description: clanData.description || '',
            location: clanData.location || undefined,
        };
        
        await setDoc(docRef, { ...payload, lastUpdated: Timestamp.now() }, { merge: true });
    } catch (error) {
        console.error(`Firestore Error [updatePublicClanIndex(${clanTag})]:`, error);
        throw new Error("Gagal menyimpan indeks klan publik.");
    }
}

// =========================================================================
// FUNGSI SPESIFIK LAINNYA
// =========================================================================

export const getTournaments = async (): Promise<FirestoreDocument<Tournament>[]> => {
    return getCollectionData<Tournament>(COLLECTIONS.TOURNAMENTS);
};

export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(firestore, COLLECTIONS.USERS);
        const q = query(
            usersRef,
            where('teamId', '==', teamId)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data(),
        })) as UserProfile[];
    } catch (error) {
        console.error(`Firestore Error [getTeamMembers(${teamId})]:`, error);
        return [];
    }
};

export const sendJoinRequest = async (
    teamId: string,
    teamName: string,
    requesterProfile: UserProfile,
    message: string = ''
): Promise<void> => {
    try {
        const requestsRef = collection(firestore, COLLECTIONS.JOIN_REQUESTS);
        const requestData: Omit<JoinRequest, 'id' | 'timestamp'> & { timestamp: Timestamp } = {
            teamId,
            teamName,
            requesterId: requesterProfile.uid,
            requesterName: requesterProfile.displayName,
            requesterThLevel: requesterProfile.thLevel,
            message,
            status: 'pending',
            timestamp: Timestamp.now(), 
        };
        await addDoc(requestsRef, requestData);
    } catch (error) {
        console.error(`Firestore Error [sendJoinRequest(${teamId}, ${requesterProfile.uid})]:`, error);
        throw new Error("Gagal mengirim permintaan bergabung.");
    }
};

export const getJoinRequests = async (teamId: string): Promise<FirestoreDocument<JoinRequest>[]> => {
    try {
        const requestsRef = collection(firestore, COLLECTIONS.JOIN_REQUESTS);
        const q = query(
            requestsRef,
            where('teamId', '==', teamId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: (data.timestamp as Timestamp).toDate()
            } as FirestoreDocument<JoinRequest>;
        });
    } catch (error) {
        console.error(`Firestore Error [getJoinRequests(${teamId})]:`, error);
        return [];
    }
};

export const updateJoinRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected'): Promise<void> => {
    try {
        const requestRef = doc(firestore, COLLECTIONS.JOIN_REQUESTS, requestId);
        await updateDoc(requestRef, { status: newStatus });
    } catch (error) {
        console.error(`Firestore Error [updateJoinRequestStatus(${requestId}, ${newStatus})]:`, error);
        throw new Error("Gagal memperbarui status permintaan bergabung.");
    }
};

export const updateMemberRole = async (
    uid: string,
    teamId: string | null,
    teamName: string | null,
    newRole: UserProfile['role']
): Promise<void> => {
    try {
        const userRef = doc(firestore, COLLECTIONS.USERS, uid);
        await updateDoc(userRef, {
            teamId: teamId,
            teamName: teamName,
            role: newRole,
        });
    } catch (error) {
        console.error(`Firestore Error [updateMemberRole(${uid}, ${newRole})]:`, error);
        throw new Error("Gagal memperbarui peran anggota.");
    }
};

// --- FUNGSI KNOWLEDGE HUB ---

export const getPostById = async (postId: string): Promise<FirestoreDocument<Post> | null> => {
    const post = await getDocumentById<Post>(COLLECTIONS.POSTS, postId);

    if (post) {
        try {
            const createdAtTimestamp = post.createdAt as unknown as Timestamp;
            const updatedAtTimestamp = post.updatedAt ? post.updatedAt as unknown as Timestamp : undefined;

            if (!(createdAtTimestamp instanceof Timestamp)) {
                throw new Error('createdAt field is not a valid Firestore Timestamp.');
            }
            if (updatedAtTimestamp && !(updatedAtTimestamp instanceof Timestamp)) {
                throw new Error('updatedAt field is not a valid Firestore Timestamp.');
            }

            return {
                ...post,
                createdAt: createdAtTimestamp.toDate(),
                updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : undefined,
            }; 
        } catch (conversionError) {
            console.error(`Firestore Error [getPostById(${postId}) - Timestamp Conversion]:`, conversionError);
            return null;
        }
    }
    return null;
};

export const createPost = async (
    data: {
        title: string,
        content: string,
        category: PostCategory,
        tags: string[],
    },
    authorProfile: UserProfile
): Promise<string> => {
    if (!authorProfile || !authorProfile.playerTag || authorProfile.thLevel === undefined || authorProfile.thLevel < 1) {
        throw new Error("Gagal membuat postingan. E-Sports CV Anda belum lengkap (Player Tag/TH Level wajib diisi).");
    }

    try {
        const postsRef = collection(firestore, COLLECTIONS.POSTS);
        const now = Timestamp.now(); 

        const newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp } = {
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

        const docRef = await addDoc(postsRef, newPostData);
        return docRef.id;
    } catch (error) {
        console.error(`Firestore Error [createPost(author: ${authorProfile.uid})]:`, error);
        throw new Error("Gagal membuat postingan baru.");
    }
};

export const getPosts = async (
    category: PostCategory | 'all',
    sortBy: 'createdAt' | 'likes' = 'createdAt', 
    sortOrder: 'desc' | 'asc' = 'desc'
): Promise<FirestoreDocument<Post>[]> => {
    const postsRef = collection(firestore, COLLECTIONS.POSTS);
    let q = query(postsRef);

    if (category && category !== 'Semua Diskusi' && category !== 'all') {
        q = query(q, where('category', '==', category));
    }

    q = query(q, orderBy(sortBy, sortOrder));
    q = query(q, limit(50));

    try {
        const snapshot = await getDocs(q);
        const posts: FirestoreDocument<Post>[] = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            try {
                const createdAtTimestamp = data.createdAt as Timestamp;
                const updatedAtTimestamp = data.updatedAt ? data.updatedAt as Timestamp : undefined;

                if (!(createdAtTimestamp instanceof Timestamp)) {
                    console.error(`Invalid createdAt type for doc ${doc.id}:`, data.createdAt);
                    return;
                }
                if (updatedAtTimestamp && !(updatedAtTimestamp instanceof Timestamp)) {
                    console.error(`Invalid updatedAt type for doc ${doc.id}:`, data.updatedAt);
                    data.updatedAt = undefined;
                }

                posts.push({
                    id: doc.id,
                    ...data,
                    createdAt: createdAtTimestamp.toDate(),
                    updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : undefined,
                } as FirestoreDocument<Post>); 

            } catch (conversionError) {
                console.error(`Firestore Error [getPosts - Timestamp Conversion for doc ${doc.id}]:`, conversionError);
            }
        });
        return posts;
    } catch (error) {
        console.error(`Firestore Error [getPosts(category: ${category}, sortBy: ${sortBy})]:`, error);
        return [];
    }
};