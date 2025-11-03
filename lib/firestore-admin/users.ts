// File: lib/firestore-admin/users.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'users'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// [PERBAIKAN] Impor FirestoreDocument dari global types, bukan ./utils
import { UserProfile, FirestoreDocument, ClanRole, JoinRequest } from '../types';
// [PERBAIKAN] Hapus FirestoreDocument dari impor ./utils
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';

/**
 * Mengambil dokumen UserProfile berdasarkan UID (Admin).
 */
export const getUserProfileAdmin = async (
  uid: string
): Promise<FirestoreDocument<UserProfile> | null> => {
  try {
    const docRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
    const docSnap = await docRef.get();
    return docToDataAdmin<UserProfile>(docSnap);
  } catch (error) {
    console.error(`Firestore Error [getUserProfileAdmin - Admin(${uid})]:`, error);
    return null;
  }
};

/**
 * Mengambil daftar anggota tim (UserProfile) berdasarkan clanId (Admin).
 */
export const getTeamMembersAdmin = async (
  clanId: string
): Promise<UserProfile[]> => {
  try {
    const usersRef = adminFirestore.collection(COLLECTIONS.USERS);
    const q = usersRef.where('clanId', '==', clanId);
    const snapshot = await q.get();
    return snapshot.docs
      .map((doc) => docToDataAdmin<UserProfile>(doc))
      .filter(Boolean) as UserProfile[]; // Filter null results
  } catch (error) {
    console.error(
      `Firestore Error [getTeamMembersAdmin - Admin(${clanId})]:`,
      error
    );
    return [];
  }
};

/**
 * Memperbarui clanId, clanName, dan role pengguna.
 * Menggunakan Admin SDK. Dipanggil dari server (misalnya saat approve/kick/role change).
 */
export const updateMemberRole = async (
  uid: string,
  clanId: string | null,
  clanName: string | null,
  newRole: UserProfile['role'] // Peran Clashub ('Leader', 'Member', 'Free Agent')
): Promise<void> => {
  try {
    const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
    const updateData: Partial<UserProfile> = {
      clanId: clanId,
      clanName: clanName,
      role: newRole,
    };

    // Bersihkan data sebelum update (menghapus undefined/null jika tidak diperlukan)
    // [CATATAN] Dengan setelan { ignoreUndefinedProperties: true } di firebase-admin.ts,
    // cleanDataForAdminSDK mungkin tidak lagi diperlukan, tapi kita biarkan untuk keamanan.
    const cleanedUpdateData = cleanDataForAdminSDK(updateData);

    // Pastikan null secara eksplisit disimpan jika clanId/clanName memang null
    if (clanId === null) cleanedUpdateData.clanId = null;
    if (clanName === null) cleanedUpdateData.clanName = null;

    if (Object.keys(cleanedUpdateData).length > 0) {
      await userRef.update(cleanedUpdateData); // Gunakan update, bukan set merge
    } else {
      console.warn(
        `[updateMemberRole - Admin] No valid data provided for update for UID: ${uid}`
      );
    }
  } catch (error) {
    console.error(
      `Firestore Error [updateMemberRole - Admin(${uid}, ${newRole})]:`,
      error
    );
    throw new Error('Gagal memperbarui peran anggota (Admin SDK).');
  }
};
