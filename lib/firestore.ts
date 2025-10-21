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
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  StorageReference 
} from "firebase/storage"; // Impor fungsi Storage

// Impor tipe data yang sudah kita definisikan
import { UserProfile, Team, Player, Tournament } from './types';


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
    // Perbaikan Type Safety: Menggunakan Type Assertion ganda
    const data = docSnap.data() as UserProfile;
    return { ...data, uid: docSnap.id }; // Mengembalikan UserProfile lengkap dengan UID
  } else {
    console.log('No such user profile!');
    return null;
  }
};

/**
 * @function getCollectionData
 * Fungsi generik untuk mengambil semua dokumen dari sebuah koleksi.
 * @param collectionName - Nama koleksi di Firestore.
 * @returns Array berisi data dokumen.
 */
// Tipe generik T sekarang harus berupa objek yang diperluas dengan 'id: string'
async function getCollectionData<T>(collectionName: string): Promise<FirestoreDocument<T>[]> {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    
    return snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreDocument<T>[]; // Type Assertion untuk menjamin struktur
}

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
