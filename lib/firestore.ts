// File: lib/firestore.ts
// Deskripsi: Berisi semua fungsi utilitas untuk berinteraksi dengan Firebase Firestore.
// DIROMBAK untuk mendukung arsitektur ManagedClan dan PublicClanIndex (Sprint 4.1).

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
import { UserProfile, Team, Player, Tournament, JoinRequest, Post, PostCategory, ManagedClan, PublicClanIndex, ClanApiCache } from './types';


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
}

// =========================================================================
// FUNGSI UTILITY UMUM (Dipertahankan)
// =========================================================================

/**
 * @function uploadProfileImage (PLACEHOLDER)
 * Fungsi ini tidak lagi mengunggah file ke Firebase Storage.
 * Ini me-return URL avatar yang diterima.
 */
export const uploadProfileImage = (
	uid: string, 
	newAvatarUrl: string,
	onProgress?: (percentage: number) => void
): Promise<string> => {
	console.log(`[AVATAR STATIS] Avatar dipilih. URL: ${newAvatarUrl}`);
	return Promise.resolve(newAvatarUrl);
};

/**
 * @function getDocumentById
 * Fungsi generik untuk mengambil dokumen tunggal dari sebuah koleksi.
 */
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
		return null; // Return null on error
	}
}

/**
 * @function getCollectionData
 * Fungsi generik untuk mengambil semua dokumen dari sebuah koleksi (tanpa query).
 */
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
		return []; // Return empty array on error
	}
}

// =========================================================================
// FUNGSI SPESIFIK USERPROFILE (users)
// =========================================================================

/**
 * @function createUserProfile
 * Membuat dokumen profil pengguna baru di koleksi 'users' saat registrasi.
 * DITAMBAH inisialisasi field verifikasi baru.
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
	try {
		const userRef = doc(firestore, COLLECTIONS.USERS, uid);
		const profileData: UserProfile = {
			uid: uid,
			email: data.email || null,
			displayName: data.playerTag || data.email?.split('@')[0] || 'New Player',
			
			// --- FIELD VERIFIKASI BARU (Init Default) ---
			isVerified: false, 
			playerTag: data.playerTag || '',
			inGameName: data.inGameName || undefined,
			clanTag: data.clanTag || null,
			clanRole: data.clanRole || 'not in clan',
			thLevel: data.thLevel || 9, // <<-- PERBAIKAN #3: Default TH Level diubah dari 1 ke 9
			trophies: data.trophies || 0, // <<-- PERBAIKAN #3.A: Menambahkan inisialisasi trophies
			lastVerified: data.lastVerified || undefined, 
			
			// --- FIELD E-SPORTS CV ---
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

/**
 * @function updateUserProfile
 * Memperbarui data profil pengguna yang ada di Firestore.
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
	try {
		const userRef = doc(firestore, COLLECTIONS.USERS, uid);
		await setDoc(userRef, data, { merge: true });
	} catch (error) {
		console.error(`Firestore Error [updateUserProfile(${uid})]:`, error);
		throw new Error(`Gagal memperbarui profil pengguna. Detail: ${error}`);
	}
};

/**
 * @function getUserProfile
 * Mengambil data profil seorang pengguna dari Firestore.
 */
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

/**
 * @function getPlayers
 * Mengambil semua data pemain (profil pengguna) dari koleksi 'users'. 
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
	// Digunakan untuk Team Hub - Players Tab
	return getCollectionData<Player>(COLLECTIONS.USERS);
};

// =========================================================================
// FUNGSI SPESIFIK MANAGED CLANS (managedClans)
// =========================================================================

/**
 * @function createOrLinkManagedClan
 * FUNGSI KRITIS SPRINT 4.1: Membuat dokumen ManagedClan baru atau mengembalikan ID yang sudah ada 
 * berdasarkan clanTag, dipicu saat Leader/Co-Leader memverifikasi akun mereka.
 * @param clanTag Tag klan CoC.
 * @param clanName Nama klan CoC.
 * @param ownerUid UID Leader/Co-Leader yang memverifikasi.
 * @returns {Promise<string>} ID internal ManagedClan (dokumen Firestore).
 */
export const createOrLinkManagedClan = async (clanTag: string, clanName: string, ownerUid: string): Promise<string> => {
	try {
		const managedClansRef = collection(firestore, COLLECTIONS.MANAGED_CLANS);

		// 1. Cek apakah klan dengan tag ini sudah dikelola
		const q = query(managedClansRef, where('tag', '==', clanTag), limit(1));
		const snapshot = await getDocs(q);

		if (!snapshot.empty) {
			// Klan sudah ada, kembalikan ID yang sudah ada
			const existingClan = snapshot.docs[0].data() as ManagedClan;
			console.log(`[ManagedClan] Klan ${clanTag} sudah dikelola. ID: ${snapshot.docs[0].id}`);
			return snapshot.docs[0].id;
		}

		// 2. Jika belum ada, buat ManagedClan baru
		const newClanData: ManagedClan = {
			id: '', // ID akan diisi oleh Firestore
			name: clanName,
			tag: clanTag,
			ownerUid: ownerUid,
			
			// Default Clashub Internal Data
			vision: 'Kompetitif', // Default: Kompetitif
			recruitingStatus: 'Open',
			website: undefined,
			discordId: undefined,
			
			// Default Cached Data dari API
			logoUrl: undefined, // Akan diisi saat sinkronisasi pertama
			avgTh: 0,
			clanLevel: 0,
			memberCount: 0,
			lastSynced: Timestamp.now().toDate(), // Gunakan Date untuk konsistensi type
		};

		const docRef = await addDoc(managedClansRef, newClanData);

		// Update ID internal di dokumen
		await updateDoc(docRef, { id: docRef.id });

		console.log(`[ManagedClan] Klan baru dibuat: ${clanName} (${docRef.id})`);
		return docRef.id;

	} catch (error) {
		console.error(`Firestore Error [createOrLinkManagedClan(${clanTag})]:`, error);
		throw new Error("Gagal membuat atau menautkan klan yang dikelola.");
	}
};


/**
 * @function getManagedClanData
 * Mengambil data klan internal (ManagedClan) berdasarkan ID internal Clashub.
 * Menggantikan getTeamById.
 * @param clanId ID internal ManagedClan.
 * @returns ManagedClan jika ada.
 */
export const getManagedClanData = async (clanId: string): Promise<FirestoreDocument<ManagedClan> | null> => {
	return getDocumentById<ManagedClan>(COLLECTIONS.MANAGED_CLANS, clanId);
};

/**
 * @function getManagedClans
 * Mengambil daftar klan internal (ManagedClan).
 * Menggantikan getTeams.
 * @returns Array ManagedClan.
 */
export const getManagedClans = async (): Promise<FirestoreDocument<ManagedClan>[]> => {
	return getCollectionData<ManagedClan>(COLLECTIONS.MANAGED_CLANS);
};

/**
 * @function getClanApiCache
 * Mengambil cache data API terbaru untuk ManagedClan.
 * Disimpan di managedClans/{id}/clanApiCache/current
 * @param clanId ID internal ManagedClan.
 * @returns ClanApiCache jika ada.
 */
export const getClanApiCache = async (clanId: string): Promise<ClanApiCache | null> => {
	const cacheRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId, 'clanApiCache', 'current');
	const docSnap = await getDoc(cacheRef);

	if (docSnap.exists()) {
		const data = docSnap.data() as ClanApiCache;
		// Konversi Timestamp ke Date jika ada
		if (data.lastUpdated instanceof Timestamp) {
			data.lastUpdated = data.lastUpdated.toDate();
		}
		return data;
	}
	return null;
}

/**
 * @function updateClanApiCache
 * Menyimpan data API cache yang telah diproses/dihitung ke dalam sub-koleksi privat.
 * @param clanId ID internal ManagedClan.
 * @param cacheData Data cache baru, termasuk anggota dengan Partisipasi.
 * @param updatedManagedClanFields Field ManagedClan yang diperbarui (avgTh, memberCount, dll)
 */
export const updateClanApiCache = async (
	clanId: string, 
	cacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'>,
	updatedManagedClanFields: Partial<ManagedClan>
): Promise<void> => {
	try {
		const cacheRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId, 'clanApiCache', 'current');
		const managedClanRef = doc(firestore, COLLECTIONS.MANAGED_CLANS, clanId);

		// 1. Simpan Cache Data (termasuk daftar anggota & Partisipasi)
		const cachePayload = {
			...cacheData,
			id: 'current',
			lastUpdated: Timestamp.now(), // Simpan sebagai Timestamp Firestore
		};
		await setDoc(cacheRef, cachePayload);

		// 2. Perbarui Metadata di dokumen ManagedClan utama
		await updateDoc(managedClanRef, {
			...updatedManagedClanFields,
			lastSynced: Timestamp.now(), // Simpan Timestamp sinkronisasi di root
		});

	} catch (error) {
		console.error(`Firestore Error [updateClanApiCache(${clanId})]:`, error);
		throw new Error("Gagal menyimpan cache API klan.");
	}
}


// =========================================================================
// FUNGSI SPESIFIK PUBLIC CLANS (publicClanIndex)
// =========================================================================

/**
 * @function getPublicClanIndex
 * Mengambil data cache klan publik berdasarkan clanTag.
 * @param clanTag Tag klan CoC.
 * @returns PublicClanIndex jika ada.
 */
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

/**
 * @function updatePublicClanIndex
 * Menyimpan snapshot data klan publik (sebagai cache).
 * @param clanData Data PublicClanIndex yang baru (dari API).
 */
export const updatePublicClanIndex = async (clanTag: string, clanData: Omit<PublicClanIndex, 'lastUpdated'>): Promise<void> => {
	try {
		const docRef = doc(firestore, COLLECTIONS.PUBLIC_CLAN_INDEX, clanTag);
		
		const payload = {
			...clanData,
			lastUpdated: Timestamp.now(), // Simpan sebagai Timestamp Firestore
		};
		
		await setDoc(docRef, payload, { merge: true }); // Gunakan merge: true untuk menjaga field lain jika ada
	} catch (error) {
		console.error(`Firestore Error [updatePublicClanIndex(${clanTag})]:`, error);
		throw new Error("Gagal menyimpan indeks klan publik.");
	}
}


// =========================================================================
// FUNGSI SPESIFIK LAINNYA (Dipertahankan, sedikit disesuaikan)
// =========================================================================

// --- FUNGSI SPESIFIK TIM LAMA (Dihapus/Digantikan) ---
// getTeamById digantikan oleh getManagedClanData
// getTeams digantikan oleh getManagedClans


/**
 * @function getTournaments
 * Mengambil semua data turnamen dari koleksi 'tournaments'.
 */
export const getTournaments = async (): Promise<FirestoreDocument<Tournament>[]> => {
	return getCollectionData<Tournament>(COLLECTIONS.USERS);
};

/**
 * @function getTeamMembers
 * Mengambil semua UserProfile yang teamId-nya cocok.
 */
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


// --- FUNGSI JOIN REQUEST (Dipertahankan) ---

/**
 * @function sendJoinRequest
 * Mengirim permintaan bergabung ke sebuah tim.
 */
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

/**
 * @function getJoinRequests
 * Mengambil semua permintaan bergabung yang PENDING untuk tim tertentu.
 */
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


/**
 * @function updateJoinRequestStatus
 * Memperbarui status permintaan (Approve/Reject).
 */
export const updateJoinRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected'): Promise<void> => {
	try {
		const requestRef = doc(firestore, COLLECTIONS.JOIN_REQUESTS, requestId);
		await updateDoc(requestRef, { status: newStatus });
	} catch (error) {
		console.error(`Firestore Error [updateJoinRequestStatus(${requestId}, ${newStatus})]:`, error);
		throw new Error("Gagal memperbarui status permintaan bergabung.");
	}
};

/**
 * @function updateMemberRole
 * Mengubah peran anggota tim (digunakan saat Approval dan Manajemen Roster).
 */
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


// --- FUNGSI KNOWLEDGE HUB (Dipertahankan) ---

/**
 * @function getPostById
 * Mengambil data postingan tunggal dari koleksi 'posts'.
 */
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

/**
 * @function createPost
 * Membuat postingan baru di koleksi 'posts'.
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

/**
 * @function getPosts
 * Mengambil postingan dari koleksi 'posts' dengan opsi filter dan sort.
 */
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
