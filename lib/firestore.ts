// File: lib/firestore.ts
// Deskripsi: Berisi semua fungsi utilitas untuk berinteraksi dengan Firebase Firestore.

import { firestore, storage } from './firebase'; // Impor instance firestore & storage kita
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  DocumentData,
  query, // Impor query
  where, // Impor where
  addDoc, // Impor addDoc
  Timestamp, // Impor Timestamp
  orderBy, // BARU: Impor orderBy
  limit // BARU: Impor limit
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  StorageReference
} from "firebase/storage"; // Impor fungsi Storage

// Impor tipe data yang sudah kita definisikan
import { UserProfile, Team, Player, Tournament, JoinRequest, Post, PostCategory } from './types';


// Helper Type untuk memastikan data dari Firestore memiliki ID dan semua field T
type FirestoreDocument<T> = T & { id: string };


/**
 * @function uploadProfileImage
 * Mengunggah file gambar ke Firebase Storage (path: users/{uid}/avatar.jpg).
 * @param uid - ID unik pengguna.
 * @param file - File Blob atau File yang akan diunggah.
 * @returns URL publik dari gambar yang diunggah.
 * @throws Error jika gagal mengunggah atau mendapatkan URL.
 */
export const uploadProfileImage = async (uid: string, file: File | Blob): Promise<string> => {
  try {
    const storageRef: StorageReference = ref(storage, `users/${uid}/avatar.jpg`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error(`Firestore Error [uploadProfileImage(${uid})]:`, error);
    throw new Error("Gagal mengunggah gambar profil."); // Re-throw error
  }
};

/**
 * @function createUserProfile
 * Membuat dokumen profil pengguna baru di koleksi 'users' saat registrasi.
 * @param uid - ID unik pengguna dari Firebase Authentication.
 * @param data - Data awal profil, seperti email, playerTag, dan thLevel.
 * @throws Error jika gagal membuat profil.
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const profileData: UserProfile = {
      uid: uid,
      email: data.email || null,
      displayName: data.playerTag || data.email?.split('@')[0] || 'New Player',
      playerTag: data.playerTag || '',
      thLevel: data.thLevel || 1,
      bio: 'Ini adalah E-Sports CV baru saya di Clashub!',
      role: 'Free Agent',
      playStyle: 'Attacker Utama',
      activeHours: 'Belum diatur',
      reputation: 5.0,
      avatarUrl: '/images/placeholder-avatar.png',
      ...data,
      teamId: null,
      teamName: null,
    };
    await setDoc(userRef, profileData);
  } catch (error) {
    console.error(`Firestore Error [createUserProfile(${uid})]:`, error);
    throw new Error("Gagal membuat profil pengguna baru di database."); // Re-throw error
  }
};

/**
 * @function updateUserProfile
 * Memperbarui data profil pengguna yang ada di Firestore.
 * @param uid - ID unik pengguna.
 * @param data - Data profil yang ingin diperbarui.
 * @throws Error jika gagal memperbarui profil.
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error(`Firestore Error [updateUserProfile(${uid})]:`, error);
    throw new Error("Gagal memperbarui profil pengguna."); // Re-throw error
  }
};

/**
 * @function getUserProfile
 * Mengambil data profil seorang pengguna dari Firestore.
 * @param uid - ID unik pengguna.
 * @returns Object UserProfile jika ada, atau null jika tidak ditemukan atau error.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', uid);
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
    return null; // Return null on error for fetching single doc
  }
};

/**
 * @function getDocumentById
 * Fungsi generik untuk mengambil dokumen tunggal dari sebuah koleksi.
 * @param collectionName - Nama koleksi di Firestore.
 * @param id - ID dokumen.
 * @returns Dokumen jika ada, atau null jika tidak ditemukan atau error.
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
 * @param collectionName - Nama koleksi di Firestore.
 * @returns Array berisi data dokumen, atau array kosong jika error.
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

// --- FUNGSI SPESIFIK TIM ---

/**
 * @function getTeamById
 * Mengambil data tim tunggal dari koleksi 'teams'. (Menggunakan helper getDocumentById)
 */
export const getTeamById = async (teamId: string): Promise<FirestoreDocument<Team> | null> => {
    // Error handling sudah ada di getDocumentById
    return getDocumentById<Team>('teams', teamId);
};

/**
 * @function getTeams
 * Mengambil semua data tim dari koleksi 'teams'. (Menggunakan helper getCollectionData)
 */
export const getTeams = async (): Promise<FirestoreDocument<Team>[]> => {
    // Error handling sudah ada di getCollectionData
    return getCollectionData<Team>('teams');
};

/**
 * @function getPlayers
 * Mengambil semua data pemain (profil pengguna) dari koleksi 'users'. (Menggunakan helper getCollectionData)
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    // Error handling sudah ada di getCollectionData
    return getCollectionData<Player>('users');
};

/**
 * @function getTournaments
 * Mengambil semua data turnamen dari koleksi 'tournaments'. (Menggunakan helper getCollectionData)
 */
export const getTournaments = async (): Promise<FirestoreDocument<Tournament>[]> => {
    // Error handling sudah ada di getCollectionData
    return getCollectionData<Tournament>('tournaments');
};

/**
 * @function getTeamMembers
 * Mengambil semua UserProfile yang teamId-nya cocok.
 * @param teamId - ID Tim.
 * @returns Array UserProfile (anggota tim), atau array kosong jika error.
 */
export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(
        usersRef,
        where('teamId', '==', teamId),
        where('role', '!=', 'Free Agent')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
    })) as UserProfile[];
  } catch (error) {
    console.error(`Firestore Error [getTeamMembers(${teamId})]:`, error);
    return []; // Return empty array on error
  }
};


// --- FUNGSI JOIN REQUEST (Tugas 2.3) ---

/**
 * @function sendJoinRequest
 * Mengirim permintaan bergabung ke sebuah tim.
 * @throws Error jika gagal mengirim permintaan.
 */
export const sendJoinRequest = async (
    teamId: string,
    teamName: string,
    requesterProfile: UserProfile,
    message: string = ''
): Promise<void> => {
  try {
    const requestsRef = collection(firestore, 'joinRequests');
    const requestData: Omit<JoinRequest, 'id'> = {
        teamId,
        teamName,
        requesterId: requesterProfile.uid,
        requesterName: requesterProfile.displayName,
        requesterThLevel: requesterProfile.thLevel,
        message,
        status: 'pending',
        timestamp: Timestamp.now().toDate(), // Tetap gunakan toDate() agar sesuai tipe
    };
    await addDoc(requestsRef, requestData);
  } catch (error) {
    console.error(`Firestore Error [sendJoinRequest(${teamId}, ${requesterProfile.uid})]:`, error);
    throw new Error("Gagal mengirim permintaan bergabung."); // Re-throw error
  }
};

/**
 * @function getJoinRequests
 * Mengambil semua permintaan bergabung yang PENDING untuk tim tertentu.
 * @returns Array JoinRequest, atau array kosong jika error.
 */
export const getJoinRequests = async (teamId: string): Promise<FirestoreDocument<JoinRequest>[]> => {
  try {
    const requestsRef = collection(firestore, 'joinRequests');
    const q = query(
        requestsRef,
        where('teamId', '==', teamId),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate()
    })) as FirestoreDocument<JoinRequest>[];
  } catch (error) {
    console.error(`Firestore Error [getJoinRequests(${teamId})]:`, error);
    return []; // Return empty array on error
  }
};


/**
 * @function updateJoinRequestStatus
 * Memperbarui status permintaan (Approve/Reject).
 * @param requestId - ID dokumen permintaan.
 * @param newStatus - Status baru ('approved' atau 'rejected').
 * @throws Error jika gagal memperbarui status.
 */
export const updateJoinRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected'): Promise<void> => {
  try {
    const requestRef = doc(firestore, 'joinRequests', requestId);
    await updateDoc(requestRef, { status: newStatus });
  } catch (error) {
    console.error(`Firestore Error [updateJoinRequestStatus(${requestId}, ${newStatus})]:`, error);
    throw new Error("Gagal memperbarui status permintaan bergabung."); // Re-throw error
  }
};

/**
 * @function updateMemberRole
 * Mengubah peran anggota tim (digunakan saat Approval dan Manajemen Roster).
 * @param uid - UID pengguna yang perannya diubah.
 * @param teamId - ID Tim baru/saat ini.
 * @param teamName - Nama Tim baru/saat ini.
 * @param newRole - Peran baru pengguna.
 * @throws Error jika gagal memperbarui peran.
 */
export const updateMemberRole = async (
    uid: string,
    teamId: string | null,
    teamName: string | null,
    newRole: UserProfile['role']
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, {
        teamId: teamId,
        teamName: teamName,
        role: newRole,
    });
  } catch (error) {
    console.error(`Firestore Error [updateMemberRole(${uid}, ${newRole})]:`, error);
    throw new Error("Gagal memperbarui peran anggota."); // Re-throw error
  }
};

// --- FUNGSI SPESIFIK KNOWLEDGE HUB (Tugas 3.1 & 3.2) ---

/**
 * @function getPostById (BARU - Tugas 3.2)
 * Mengambil data postingan tunggal dari koleksi 'posts'.
 */
export const getPostById = async (postId: string): Promise<FirestoreDocument<Post> | null> => {
  // getDocumentById sudah memiliki try...catch
  const post = await getDocumentById<Post>('posts', postId);

  if (post) {
    try {
      // Tambahkan try-catch terpisah untuk konversi timestamp yang lebih spesifik
      const data = post as any;
      return {
        ...post,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
      } as FirestoreDocument<Post>;
    } catch (conversionError) {
      console.error(`Firestore Error [getPostById(${postId}) - Timestamp Conversion]:`, conversionError);
      return null; // Gagal konversi tanggal dianggap data tidak valid
    }
  }
  return null;
};

/**
 * @function createPost (BARU - Tugas 3.2)
 * Membuat postingan baru di koleksi 'posts'.
 * @param data - Data postingan dari form.
 * @param authorProfile - Profil pengguna yang membuat postingan.
 * @returns ID dokumen postingan yang baru dibuat.
 * @throws Error jika gagal membuat postingan.
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
  try {
    const postsRef = collection(firestore, 'posts');
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
    throw new Error("Gagal membuat postingan baru."); // Re-throw error
  }
};

/**
 * @function getPosts (Tugas 3.1)
 * Mengambil postingan dari koleksi 'posts' dengan opsi filter dan sort.
 * @param category - Kategori untuk difilter.
 * @param sortBy - Kolom untuk mengurutkan ('createdAt' atau 'likes').
 * @param sortOrder - Urutan ('desc' atau 'asc').
 * @returns Array Post, atau array kosong jika error.
 */
export const getPosts = async (
    category: PostCategory | 'all',
    sortBy: 'createdAt' | 'likes' = 'createdAt',
    sortOrder: 'desc' | 'asc' = 'desc'
): Promise<FirestoreDocument<Post>[]> => {
    // try...catch sudah ada di sini, kita hanya perlu memastikan logging-nya informatif
    const postsRef = collection(firestore, 'posts');
    let q = query(postsRef);

    if (category && category !== 'Semua Diskusi' && category !== 'all') {
        q = query(q, where('category', '==', category));
    }

    if (sortBy === 'createdAt') {
        q = query(q, orderBy('createdAt', sortOrder));
    } else if (sortBy === 'likes') {
        q = query(q, orderBy('likes', sortOrder));
    }

    q = query(q, limit(50));

    try {
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            try {
              // Tambahkan try-catch di dalam map untuk konversi timestamp
              return {
                  id: doc.id,
                  ...data,
                  createdAt: (data.createdAt as Timestamp).toDate(),
                  updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
              } as FirestoreDocument<Post>;
            } catch (conversionError) {
               console.error(`Firestore Error [getPosts - Timestamp Conversion for doc ${doc.id}]:`, conversionError);
               return null; // Tandai dokumen ini sebagai tidak valid
            }
        }).filter(post => post !== null) as FirestoreDocument<Post>[]; // Filter dokumen yang gagal konversi

    } catch (error) {
        // Logging error yang lebih informatif
        console.error(`Firestore Error [getPosts(category: ${category}, sortBy: ${sortBy})]:`, error);
        return []; // Return empty array on error
    }
};
