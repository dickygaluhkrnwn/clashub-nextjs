// File: lib/firestore.ts
// Deskripsi: Berisi semua fungsi utilitas untuk berinteraksi dengan Firebase Firestore.
// Ini adalah satu-satunya tempat di mana kita akan menulis kode query database secara langsung.

import { firestore } from './firebase'; // Impor instance firestore kita
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  DocumentData,
} from 'firebase/firestore';

// Impor tipe data yang sudah kita definisikan
import { UserProfile, Team, Player, Tournament } from './types';

/**
 * @function createUserProfile
 * Membuat dokumen profil pengguna baru di koleksi 'users' saat registrasi.
 * @param uid - ID unik pengguna dari Firebase Authentication.
 * @param data - Data awal profil, seperti email, playerTag, dan thLevel.
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(firestore, 'users', uid);
  const profileData: UserProfile = {
    uid: uid,
    email: data.email || null,
    displayName: data.displayName || data.email?.split('@')[0] || 'New Player',
    playerTag: data.playerTag || '',
    thLevel: data.thLevel || 0,
    bio: '',
    role: 'Free Agent',
    activeHours: '',
    reputation: 0,
    ...data,
  };
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
    return docSnap.data() as UserProfile;
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
async function getCollectionData<T>(collectionName: string): Promise<T[]> {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
}

/**
 * @function getTeams
 * Mengambil semua data tim dari koleksi 'teams'.
 */
export const getTeams = async (): Promise<Team[]> => {
    return getCollectionData<Team>('teams');
};

/**
 * @function getPlayers
 * Mengambil semua data pemain (profil pengguna) dari koleksi 'users'.
 */
export const getPlayers = async (): Promise<Player[]> => {
    return getCollectionData<Player>('users');
};

/**
 * @function getTournaments
 * Mengambil semua data turnamen dari koleksi 'tournaments'.
 */
export const getTournaments = async (): Promise<Tournament[]> => {
    return getCollectionData<Tournament>('tournaments');
};
