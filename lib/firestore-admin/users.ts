// File: lib/firestore-admin/users.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'users'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// [PERBAIKAN] Impor FirestoreDocument dari global types, bukan ./utils
// [UPDATE 4.2] Tambahkan PlayerReview
import {
  UserProfile,
  FirestoreDocument,
  JoinRequest,
  PlayerReview, // <-- TAMBAHAN TAHAP 4.2
} from '../types';
// [EDIT] Impor tipe string literal DAN Enum
import {
  ClanRole, // Enum (Mungkin masih dipakai di tempat lain)
  ManagerRole,
  StandardMemberRole,
} from '../enums';
// [PERBAIKAN] Hapus FirestoreDocument dari impor ./utils
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';
// [UPDATE 4.2 & FIX 404] Tambahkan DocumentData dan FieldPath
import { DocumentData, FieldPath } from 'firebase-admin/firestore';

/**
 * Mengambil dokumen UserProfile berdasarkan UID (Admin).
 */
export const getUserProfileAdmin = async (
  uid: string,
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
  clanId: string,
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
      error,
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
  // [PERBAIKAN ERROR] Tipe yang benar adalah string literal, bukan Enum ClanRole
  newRole: ManagerRole | StandardMemberRole, // Peran Clashub ('Leader', 'Member', 'Free Agent')
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
        `[updateMemberRole - Admin] No valid data provided for update for UID: ${uid}`,
      );
    }
  } catch (error) {
    console.error(
      `Firestore Error [updateMemberRole - Admin(${uid}, ${newRole})]:`,
      error,
    );
    throw new Error('Gagal memperbarui peran anggota (Admin SDK).');
  }
};

/**
 * [BARU] Memperbarui HANYA role Clashub pengguna (Admin).
 * Misal: Member -> Co-Leader
 */
export const updateUserClashubRole = async (
  uid: string,
  // [PERBAIKAN ERROR] Tipe yang benar adalah string literal
  newRole: ManagerRole | StandardMemberRole, // <-- Menggunakan Tipe String Literal
): Promise<void> => {
  try {
    const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
    await userRef.update({
      role: newRole,
    });
  } catch (error) {
    console.error(
      `Firestore Error [updateUserClashubRole - Admin(${uid}, ${newRole})]:`,
      error,
    );
    // Kita lempar error agar bisa ditangkap oleh API route
    throw new Error('Gagal memperbarui role Clashub pengguna (Admin SDK).');
  }
};

// --- [BARU: TAHAP 4.2] ---

/**
 * Mengambil data riwayat klan (clanHistory) untuk seorang pengguna (Admin).
 */
export const getClanHistoryAdmin = async (
  uid: string,
): Promise<FirestoreDocument<DocumentData>[]> => {
  try {
    const historyRef = adminFirestore
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .collection(COLLECTIONS.CLAN_HISTORY);

    // [CATATAN] Saat ini, roadmap tidak mensyaratkan pengurutan spesifik,
    // tapi kita bisa tambahkan .orderBy('timestamp', 'desc') jika field itu ada.
    const snapshot = await historyRef.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<DocumentData>(doc))
      .filter(Boolean) as FirestoreDocument<DocumentData>[];
  } catch (error) {
    console.error(
      `Firestore Error [getClanHistoryAdmin - Admin(${uid})]:`,
      error,
    );
    return [];
  }
};

/**
 * Mengambil semua ulasan (reviews) yang ditujukan untuk seorang pengguna (Admin).
 */
export const getPlayerReviewsAdmin = async (
  uid: string,
): Promise<FirestoreDocument<PlayerReview>[]> => {
  try {
    const reviewsRef = adminFirestore.collection(COLLECTIONS.PLAYER_REVIEWS);
    const q = reviewsRef.where('targetPlayerUid', '==', uid);

    // [CATATAN] Bisa ditambahkan .orderBy('createdAt', 'desc') jika diperlukan.
    const snapshot = await q.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<PlayerReview>(doc))
      .filter(Boolean) as FirestoreDocument<PlayerReview>[];
  } catch (error) {
    console.error(
      `Firestore Error [getPlayerReviewsAdmin - Admin(${uid})]:`,
      error,
    );
    return [];
  }
};

// [TAMBAHAN BARU UNTUK FIX ERROR 404]
/**
 * [BARU] Mengambil beberapa dokumen UserProfile berdasarkan array UID (Admin).
 * Dibuat untuk API route /api/users/profiles-by-ids
 */
export const getUserProfilesByIdsAdmin = async (
  uids: string[],
): Promise<FirestoreDocument<UserProfile>[]> => {
  if (!uids || uids.length === 0) {
    return [];
  }

  // Firestore 'in' query memiliki batas 30 item.
  // Jika panitia bisa lebih dari 30, kita perlu chunking.
  // Tapi untuk sekarang (panitia < 30), ini sudah aman.
  if (uids.length > 30) {
    console.warn(
      `[getUserProfilesByIdsAdmin] Peringatan: Query melebihi 30 UID (${uids.length}). Hasil mungkin tidak lengkap.`,
    );
    // Batasi ke 30 pertama untuk menghindari error Firestore
    uids = uids.slice(0, 30);
  }

  try {
    const usersRef = adminFirestore.collection(COLLECTIONS.USERS);
    // [PERBAIKAN ERROR TS] Panggil 'FieldPath' langsung dari impor, bukan dari 'adminFirestore.FieldPath'
    const q = usersRef.where(FieldPath.documentId(), 'in', uids);
    const snapshot = await q.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<UserProfile>(doc))
      .filter(Boolean) as FirestoreDocument<UserProfile>[];
  } catch (error) {
    console.error(
      `Firestore Error [getUserProfilesByIdsAdmin - Admin(${uids.join(
        ', ',
      )})]:`,
      error,
    );
    return [];
  }
};