import { adminFirestore } from '@/lib/firebase-admin'; // FIX: Path alias
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // FIX: Import Timestamp
import { COLLECTIONS } from '@/lib/firestore-collections'; // FIX: Path alias
import {
  UserProfile,
  ClanRole,
  RoleChangeLog,
  FirestoreDocument,
  JoinRequest,
} from '@/lib/types'; // FIX: Path alias
import { cleanDataForAdminSDK, docToDataAdmin } from '@/lib/firestore-admin/utils'; // FIX: Path alias

// ----------------------------------------------------------------
// FUNGSI BARU (TAHAP 1.1)
// ----------------------------------------------------------------
/**
 * Tipe data untuk role yang diizinkan melakukan aksi manajemen.
 */
export type AdminRole = 'Leader' | 'Co-Leader';

const ADMIN_ROLES: AdminRole[] = ['Leader', 'Co-Leader'];

/**
 * Memverifikasi apakah seorang pengguna (berdasarkan UID) memiliki peran admin ('Leader' atau 'Co-Leader')
 * dalam klan yang dikelola (berdasarkan clanId).
 * Ini adalah fungsi keamanan inti untuk API manajemen.
 *
 * @param uid UID pengguna yang diautentikasi (dari token).
 * @param clanId ID dokumen klan di 'managedClans'.
 * @returns {Promise<{ isAuthorized: boolean, userProfile: UserProfile | null }>}
 * Mengembalikan boolean 'isAuthorized' dan 'userProfile' jika ditemukan.
 */
export const verifyUserClanRole = async (
  uid: string,
  clanId: string,
  allowedRoles: AdminRole[] = ADMIN_ROLES
): Promise<{
  isAuthorized: boolean;
  userProfile: FirestoreDocument<UserProfile> | null;
}> => {
  if (!uid || !clanId) {
    console.warn('[verifyUserClanRole] UID atau ClanID tidak diberikan.');
    return { isAuthorized: false, userProfile: null };
  }

  try {
    // 1. Ambil profil pengguna
    const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(uid);
    const userSnap = await userRef.get();
    const userProfile = docToDataAdmin<UserProfile>(userSnap);

    if (!userProfile) {
      console.warn(`[verifyUserClanRole] Pengguna ${uid} tidak ditemukan.`);
      return { isAuthorized: false, userProfile: null };
    }

    // 2. Verifikasi kepemilikan klan dan peran
    const isOwner = userProfile.clanId === clanId;
    const hasAdminRole = allowedRoles.includes(userProfile.role as AdminRole);

    if (isOwner && hasAdminRole) {
      // Pengguna adalah 'Leader' atau 'Co-Leader' DARI klan yang benar.
      return { isAuthorized: true, userProfile: userProfile };
    } else {
      console.warn(
        `[verifyUserClanRole] Ditolak: Pengguna ${uid} (Role: ${userProfile.role}) mencoba mengakses klan ${clanId}.`
      );
      return { isAuthorized: false, userProfile: userProfile };
    }
  } catch (error) {
    console.error(
      `Firestore Error [verifyUserClanRole - Admin(${uid}, ${clanId})]:`,
      error
    );
    return { isAuthorized: false, userProfile: null };
  }
};
// ----------------------------------------------------------------

/**
 * Mengambil daftar permintaan bergabung yang tertunda untuk tim tertentu (Admin).
 */
export const getJoinRequestsAdmin = async (
  clanId: string
): Promise<FirestoreDocument<JoinRequest>[]> => {
  try {
    const requestsRef = adminFirestore.collection(
      `${COLLECTIONS.MANAGED_CLANS}/${clanId}/joinRequests`
    );
    const q = requestsRef.where('status', '==', 'pending');

    const snapshot = await q.get();
    return snapshot.docs
      .map((doc) => docToDataAdmin<JoinRequest>(doc))
      .filter(Boolean) as FirestoreDocument<JoinRequest>[];
  } catch (error) {
    console.error(
      `Firestore Error [getJoinRequestsAdmin - Admin(${clanId})]:`,
      error
    );
    return [];
  }
};

/**
 * Mengambil satu dokumen JoinRequest berdasarkan ID-nya (Admin).
 */
export const getJoinRequestAdmin = async (
  clanId: string,
  requestId: string
): Promise<FirestoreDocument<JoinRequest> | null> => {
  try {
    const docRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('joinRequests')
      .doc(requestId);
    const docSnap = await docRef.get();
    return docToDataAdmin<JoinRequest>(docSnap);
  } catch (error) {
    console.error(
      `Firestore Error [getJoinRequestAdmin - Admin(${clanId}, ${requestId})]:`,
      error
    );
    return null;
  }
};

/**
 * Mengambil semua log perubahan role untuk Clan tertentu.
 */
export const getRoleLogsByClanId = async (
  clanId: string
): Promise<RoleChangeLog[]> => {
  try {
    const logRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('roleChanges');

    const snapshot = await logRef.orderBy('changedAt', 'desc').get();

    // FIX: Menambahkan tipe 'any' untuk 'doc'
    return snapshot.docs.map(
      (doc: FirebaseFirestore.DocumentSnapshot) => {
        const data = doc.data() as any;
        if (data.changedAt && typeof data.changedAt.toDate === 'function') {
          data.changedAt = data.changedAt.toDate();
        }
        return {
          playerTag: data.playerTag,
          playerName: data.playerName,
          memberUid: data.memberUid,
          oldRoleCoC: data.oldRoleCoC,
          newRoleCoC: data.newRoleCoC,
          changedByUid: data.changedByUid,
          changedAt: data.changedAt, // Ini sudah jadi Date
        } as RoleChangeLog;
      }
    );
  } catch (error) {
    console.error(
      `Firestore Error [getRoleLogsByClanId - Admin(${clanId})]:`,
      error
    );
    return [];
  }
};

/**
 * Mencatat perubahan role ke sub-koleksi managedClans/{clanId}/roleChanges.
 */
export const logRoleChange = async (
  clanId: string,
  logData: Omit<RoleChangeLog, 'changedAt'>
): Promise<void> => {
  try {
    const logRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('roleChanges');

    const payloadWithDate: RoleChangeLog = {
      ...logData,
      changedAt: new Date(),
    };

    await logRef.add(cleanDataForAdminSDK(payloadWithDate));

    console.log(
      `[RoleLog - Admin] Role change recorded for ${logData.playerTag}.`
    );
  } catch (error) {
    console.error(
      `Firestore Error [logRoleChange - Admin(${clanId})]:`,
      error
    );
    throw new Error('Gagal mencatat log perubahan peran (Admin SDK).');
  }
};

/**
 * Memperbarui status permintaan bergabung.
 */
export const updateJoinRequestStatus = async (
  clanId: string,
  requestId: string,
  newStatus: 'approved' | 'rejected'
): Promise<void> => {
  try {
    const requestRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('joinRequests')
      .doc(requestId);

    await requestRef.update({ status: newStatus });
    console.log(
      `[JoinRequest - Admin] Request ${requestId} for Clan ${clanId} status updated to ${newStatus}.`
    );
  } catch (error) {
    console.error(
      `Firestore Error [updateJoinRequestStatus - Admin(${requestId}, ${newStatus})]:`,
      error
    );
    throw new Error('Gagal memperbarui status permintaan bergabung (Admin SDK).');
  }
};

