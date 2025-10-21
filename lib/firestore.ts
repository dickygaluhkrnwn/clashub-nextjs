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
  Timestamp // Impor Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  StorageReference 
} from "firebase/storage"; // Impor fungsi Storage

// Impor tipe data yang sudah kita definisikan
import { UserProfile, Team, Player, Tournament, JoinRequest } from './types';


// Helper Type untuk memastikan data dari Firestore memiliki ID dan semua field T
type FirestoreDocument<T> = T & { id: string };


/**
 * @function uploadProfileImage
 * Mengunggah file gambar ke Firebase Storage (path: users/{uid}/avatar.jpg).
 * @param uid - ID unik pengguna.
 * @param file - File Blob atau File yang akan diunggah.
 * @returns URL publik dari gambar yang diunggah.
 */
export const uploadProfileImage = async (uid: string, file: File | Blob): Promise<string> => {
    // Tentukan path penyimpanan: users/USER_UID/avatar.jpg
    const storageRef: StorageReference = ref(storage, `users/${uid}/avatar.jpg`);
    
    // Unggah file. Kami menggunakan 'avatar.jpg' sebagai nama tetap.
    const snapshot = await uploadBytes(storageRef, file);
    
    // Dapatkan URL publik dari file yang diunggah
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
};

/**
 * @function createUserProfile
 * Membuat dokumen profil pengguna baru di koleksi 'users' saat registrasi.
 * @param uid - ID unik pengguna dari Firebase Authentication.
 * @param data - Data awal profil, seperti email, playerTag, dan thLevel.
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(firestore, 'users', uid);
  
  // Menentukan data awal lengkap untuk dokumen Firestore
  const profileData: UserProfile = {
    uid: uid,
    email: data.email || null,
    // Menggunakan PlayerTag sebagai DisplayName awal jika tidak ada
    displayName: data.playerTag || data.email?.split('@')[0] || 'New Player', 
    playerTag: data.playerTag || '',
    thLevel: data.thLevel || 1, // Default ke TH 1 jika tidak ada
    bio: 'Ini adalah E-Sports CV baru saya di Clashub!',
    role: 'Free Agent', // Default role untuk pengguna baru
    playStyle: 'Attacker Utama', // Default play style
    activeHours: 'Belum diatur',
    reputation: 5.0, // Reputasi awal sempurna
    avatarUrl: '/images/placeholder-avatar.png', // Default URL Avatar
    ...data, // Menimpa nilai default jika ada di data input
    teamId: null, // BARU: Default teamId ke null
    teamName: null, // BARU: Default teamName ke null
  };
  
  // Menggunakan setDoc untuk membuat dokumen dengan ID Auth pengguna
  await setDoc(userRef, profileData);
};

/**
 * @function updateUserProfile
 * Memperbarui data profil pengguna yang ada di Firestore.
 * @param uid - ID unik pengguna.
 * @param data - Data profil yang ingin diperbarui.
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(firestore, 'users', uid);
  await updateDoc(userRef, data);
};

/**
 * @function getUserProfile
 * Mengambil data profil seorang pengguna dari Firestore.
 * @param uid - ID unik pengguna.
 * @returns Object UserProfile jika ada, atau null jika tidak ditemukan.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as UserProfile;
    return { ...data, uid: docSnap.id }; 
  } else {
    console.log('No such user profile!');
    return null;
  }
};

/**
 * @function getDocumentById
 * Fungsi generik untuk mengambil dokumen tunggal dari sebuah koleksi. (BARU)
 * @param collectionName - Nama koleksi di Firestore.
 * @param id - ID dokumen.
 * @returns Dokumen jika ada, atau null.
 */
async function getDocumentById<T>(collectionName: string, id: string): Promise<FirestoreDocument<T> | null> {
    const docRef = doc(firestore, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as T;
        return { ...data, id: docSnap.id } as FirestoreDocument<T>;
    }
    return null;
}

/**
 * @function getCollectionData
 * Fungsi generik untuk mengambil semua dokumen dari sebuah koleksi (tanpa query).
 * @param collectionName - Nama koleksi di Firestore.
 * @returns Array berisi data dokumen.
 */
async function getCollectionData<T>(collectionName: string): Promise<FirestoreDocument<T>[]> {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    
    return snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreDocument<T>[]; 
}

// --- FUNGSI SPESIFIK TIM ---

/**
 * @function getTeamById (BARU)
 * Mengambil data tim tunggal dari koleksi 'teams'.
 */
export const getTeamById = async (teamId: string): Promise<FirestoreDocument<Team> | null> => {
    return getDocumentById<Team>('teams', teamId);
};

/**
 * @function getTeams
 * Mengambil semua data tim dari koleksi 'teams'.
 */
export const getTeams = async (): Promise<FirestoreDocument<Team>[]> => {
    return getCollectionData<Team>('teams');
};

/**
 * @function getPlayers
 * Mengambil semua data pemain (profil pengguna) dari koleksi 'users'.
 */
export const getPlayers = async (): Promise<FirestoreDocument<Player>[]> => {
    return getCollectionData<Player>('users');
};

/**
 * @function getTournaments
 * Mengambil semua data turnamen dari koleksi 'tournaments'.
 */
export const getTournaments = async (): Promise<FirestoreDocument<Tournament>[]> => {
    return getCollectionData<Tournament>('tournaments');
};

/**
 * @function getTeamMembers (BARU)
 * Mengambil semua UserProfile yang teamId-nya cocok.
 * @param teamId - ID Tim.
 * @returns Array UserProfile (anggota tim).
 */
export const getTeamMembers = async (teamId: string): Promise<UserProfile[]> => {
    const usersRef = collection(firestore, 'users');
    // Query untuk mencari semua pengguna di tim ini yang statusnya bukan 'Free Agent'
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
};


// --- FUNGSI JOIN REQUEST (Tugas 2.3) ---

/**
 * @function sendJoinRequest (BARU)
 * Mengirim permintaan bergabung ke sebuah tim.
 */
export const sendJoinRequest = async (
    teamId: string, 
    teamName: string, 
    requesterProfile: UserProfile, 
    message: string = ''
): Promise<void> => {
    
    const requestsRef = collection(firestore, 'joinRequests');
    
    const requestData: Omit<JoinRequest, 'id'> = {
        teamId,
        teamName,
        requesterId: requesterProfile.uid,
        requesterName: requesterProfile.displayName,
        requesterThLevel: requesterProfile.thLevel,
        message,
        status: 'pending',
        timestamp: Timestamp.now().toDate(), // Menggunakan Firebase Timestamp
    };

    await addDoc(requestsRef, requestData);
};

/**
 * @function getJoinRequests (BARU)
 * Mengambil semua permintaan bergabung yang PENDING untuk tim tertentu.
 */
export const getJoinRequests = async (teamId: string): Promise<FirestoreDocument<JoinRequest>[]> => {
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
        // Memastikan tipe data timestamp
        timestamp: (doc.data().timestamp as Timestamp).toDate() 
    })) as FirestoreDocument<JoinRequest>[];
};


/**
 * @function updateJoinRequestStatus (BARU)
 * Memperbarui status permintaan (Approve/Reject).
 * @param requestId - ID dokumen permintaan.
 * @param newStatus - Status baru ('approved' atau 'rejected').
 */
export const updateJoinRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected'): Promise<void> => {
    const requestRef = doc(firestore, 'joinRequests', requestId);
    await updateDoc(requestRef, { status: newStatus });
};

/**
 * @function updateMemberRole (BARU)
 * Mengubah peran anggota tim (digunakan saat Approval dan Manajemen Roster).
 * @param uid - UID pengguna yang perannya diubah.
 * @param teamId - ID Tim baru/saat ini.
 * @param teamName - Nama Tim baru/saat ini.
 * @param newRole - Peran baru pengguna.
 */
export const updateMemberRole = async (
    uid: string, 
    teamId: string | null, 
    teamName: string | null, 
    newRole: UserProfile['role']
): Promise<void> => {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, {
        teamId: teamId,
        teamName: teamName,
        role: newRole,
    });
};
