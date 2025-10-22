// File: lib/firestore.ts
// Deskripsi: Berisi semua fungsi utilitas untuk berinteraksi dengan Firebase Firestore.

// PERUBAHAN: Hanya impor firestore, storage dihapus
import { firestore } from './firebase'; 
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
// HAPUS SEMUA IMPOR STORAGE:
// import { ref, uploadBytesResumable, getDownloadURL, StorageReference } from "firebase/storage"; 

// Impor tipe data yang sudah kita definisikan
import { UserProfile, Team, Player, Tournament, JoinRequest, Post, PostCategory } from './types';


// Helper Type untuk memastikan data dari Firestore memiliki ID dan semua field T
type FirestoreDocument<T> = T & { id: string };


/**
 * @function uploadProfileImage (DIUBAH MENJADI FUNGSI PLACEHOLDER)
 * Fungsi ini tidak lagi mengunggah file ke Firebase Storage (Storage Dihapus).
 * Ini hanya ada untuk kompatibilitas sementara dan me-return URL avatar yang diterima.
 * @param newAvatarUrl - URL avatar statis yang dipilih oleh pengguna.
 * @returns Promise<string> yang me-return newAvatarUrl.
 */
export const uploadProfileImage = (
  uid: string, 
  newAvatarUrl: string, // PERUBAHAN: Menerima URL sebagai pengganti File
  onProgress?: (percentage: number) => void // Dibiarkan untuk kompatibilitas API
): Promise<string> => {
  // Karena kita menggunakan avatar statis, fungsi ini tidak melakukan apa-apa selain me-return.
  console.log(`[AVATAR STATIS] Avatar dipilih. URL: ${newAvatarUrl}`);
  return Promise.resolve(newAvatarUrl);
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
      // URL Avatar default
      avatarUrl: data.avatarUrl || '/images/placeholder-avatar.png', 
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
    // PERBAIKAN UTAMA: Kita tetap menggunakan updateDoc. Masalah "loading" kemungkinan 
    // besar adalah karena Rules. Asumsikan Rules di Langkah 1 sudah diimplementasikan (di Canvas).
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
      // Kita asumsikan data sesuai UserProfile, tapi bisa ditambahkan validasi skema jika perlu
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
       // Asumsikan data cocok dengan T. Validasi skema bisa ditambahkan di sini.
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

    // Asumsikan data cocok dengan T. Bisa ditambahkan validasi per item jika perlu.
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
 * PERBAIKAN UTAMA: Hapus where('role', '!=', 'Free Agent') untuk menghindari Composite Index Error.
 * Pemfilteran Free Agent akan dilakukan di sisi aplikasi (Client/Server Component).
 * @param teamId - ID Tim.
 * @returns Array UserProfile (anggota tim), atau array kosong jika error.
 */
export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(
        usersRef,
        where('teamId', '==', teamId)
        // HAPUS: where('role', '!=', 'Free Agent')
    );
    const snapshot = await getDocs(q);

    // Asumsikan data cocok UserProfile
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
    // Konversi Date ke Timestamp Firestore saat menyimpan
    const requestData: Omit<JoinRequest, 'id' | 'timestamp'> & { timestamp: Timestamp } = {
        teamId,
        teamName,
        requesterId: requesterProfile.uid,
        requesterName: requesterProfile.displayName,
        requesterThLevel: requesterProfile.thLevel,
        message,
        status: 'pending',
        timestamp: Timestamp.now(), // Gunakan Timestamp Firestore
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
        // orderBy('timestamp', 'desc') // Bisa ditambahkan jika perlu urutan
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
         const data = doc.data();
         // Konversi Timestamp ke Date saat mengambil data
         return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate() // Konversi di sini
         } as FirestoreDocument<JoinRequest>;
    });
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
      // PERBAIKAN: Hindari 'as any'. Lakukan type assertion spesifik ke Timestamp.
      const createdAtTimestamp = post.createdAt as unknown as Timestamp;
      const updatedAtTimestamp = post.updatedAt ? post.updatedAt as unknown as Timestamp : undefined;

      // Pastikan konversi hanya dilakukan jika memang Timestamp
      if (!(createdAtTimestamp instanceof Timestamp)) {
          throw new Error('createdAt field is not a valid Firestore Timestamp.');
      }
       if (updatedAtTimestamp && !(updatedAtTimestamp instanceof Timestamp)) {
           throw new Error('updatedAt field is not a valid Firestore Timestamp.');
       }

      return {
        ...post,
        // Lakukan konversi setelah memastikan tipe
        createdAt: createdAtTimestamp.toDate(),
        updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : undefined,
      }; // Tipe FirestoreDocument<Post> sudah benar
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
    const now = Timestamp.now(); // Gunakan Timestamp Firestore

    // Tipe data sudah benar, Omit createdAt/updatedAt dari Post, lalu tambahkan sebagai Timestamp
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
        updatedAt: now, // Simpan sebagai Timestamp
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
    sortBy: 'createdAt' | 'likes' = 'createdAt', // Tetap bisa sort by likes jika index ada
    sortOrder: 'desc' | 'asc' = 'desc'
): Promise<FirestoreDocument<Post>[]> => {
    const postsRef = collection(firestore, 'posts');
    let q = query(postsRef);

    if (category && category !== 'Semua Diskusi' && category !== 'all') {
        q = query(q, where('category', '==', category));
    }

    // Terapkan orderBy berdasarkan sortBy
    q = query(q, orderBy(sortBy, sortOrder));


    q = query(q, limit(50)); // Batasi jumlah hasil

    try {
        const snapshot = await getDocs(q);

        const posts: FirestoreDocument<Post>[] = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            try {
              // PERBAIKAN: Lakukan type assertion spesifik ke Timestamp
              const createdAtTimestamp = data.createdAt as Timestamp;
              const updatedAtTimestamp = data.updatedAt ? data.updatedAt as Timestamp : undefined;

              // Validasi dasar tipe Timestamp sebelum konversi
              if (!(createdAtTimestamp instanceof Timestamp)) {
                  console.error(`Invalid createdAt type for doc ${doc.id}:`, data.createdAt);
                  return; // Lewati dokumen ini jika createdAt tidak valid
              }
               if (updatedAtTimestamp && !(updatedAtTimestamp instanceof Timestamp)) {
                   console.error(`Invalid updatedAt type for doc ${doc.id}:`, data.updatedAt);
                   // updatedAt opsional, jadi mungkin set ke undefined
                   data.updatedAt = undefined;
               }

              posts.push({
                  id: doc.id,
                  ...data,
                  // Konversi setelah validasi
                  createdAt: createdAtTimestamp.toDate(),
                  updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate() : undefined,
              } as FirestoreDocument<Post>); // Pastikan casting di akhir

            } catch (conversionError) {
               console.error(`Firestore Error [getPosts - Timestamp Conversion for doc ${doc.id}]:`, conversionError);
               // Jangan tambahkan post ini jika konversi gagal
            }
        });
        return posts;

    } catch (error) {
        console.error(`Firestore Error [getPosts(category: ${category}, sortBy: ${sortBy})]:`, error);
        return []; // Return empty array on error
    }
};
