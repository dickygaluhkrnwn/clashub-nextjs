// File: lib/firestore-admin/clans.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait 'managedClans' dan 'publicClanIndex'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
import {
  ManagedClan,
  PublicClanIndex,
  ClanApiCache,
  CocIconUrls,
  FirestoreDocument, // <-- Impor ini sudah benar
} from '../types';
// [PERBAIKAN] Hapus impor 'FirestoreDocument' dari './utils' karena sudah diimpor dari '../types'
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';
// [UPDATE Fase 1.3] Tambahkan FieldValue
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Mengambil data ManagedClan berdasarkan ID internal Clashub (Admin).
 */
export const getManagedClanDataAdmin = async (
  clanId: string,
): Promise<FirestoreDocument<ManagedClan> | null> => {
  try {
    const docRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);
    const docSnap = await docRef.get();
    return docToDataAdmin<ManagedClan>(docSnap);
  } catch (error) {
    console.error(
      `Firestore Error [getManagedClanDataAdmin - Admin(${clanId})]:`,
      error,
    );
    return null;
  }
};

/**
 * Mengambil cache API klan (sub-koleksi) (Admin).
 */
export const getClanApiCacheAdmin = async (
  clanId: string,
): Promise<ClanApiCache | null> => {
  try {
    const cacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('clanApiCache')
      .doc('current');
    const docSnap = await cacheRef.get();
    return docToDataAdmin<ClanApiCache>(docSnap);
  } catch (error) {
    console.error(
      `Firestore Error [getClanApiCacheAdmin - Admin(${clanId})]:`,
      error,
    );
    return null;
  }
};

/**
 * Membuat dokumen ManagedClan baru atau mengembalikan ID yang sudah ada.
 * Menggunakan Admin SDK. Dipanggil dari server (verifikasi).
 */
export const createOrLinkManagedClan = async (
  clanTag: string,
  clanName: string,
  ownerUid: string,
): Promise<string> => {
  try {
    const managedClansRef = adminFirestore.collection(
      COLLECTIONS.MANAGED_CLANS,
    );
    const q = managedClansRef.where('tag', '==', clanTag).limit(1);
    const snapshot = await q.get();

    if (!snapshot.empty) {
      console.log(
        `[ManagedClan - Admin] Klan ${clanTag} sudah dikelola. ID: ${snapshot.docs[0].id}`,
      );
      return snapshot.docs[0].id;
    }

    const newClanData: Omit<ManagedClan, 'id'> = {
      name: clanName,
      tag: clanTag,
      ownerUid: ownerUid,
      vision: 'Kompetitif', // Default vision
      recruitingStatus: 'Open', // Default status
      website: undefined,
      discordId: undefined,
      logoUrl: undefined,
      avgTh: 0,
      clanLevel: 0, // Akan diupdate saat sync pertama
      memberCount: 0, // Akan diupdate saat sync pertama
      lastSynced: new Date(0), // Set ke waktu epoch agar sync pertama ter-trigger
      // [UPDATE Fase 1.3] Tambahkan field memberList (snapshot)
      memberList: [], // Default array kosong
    };

    const cleanedData = cleanDataForAdminSDK(newClanData);
    const docRef = await managedClansRef.add(cleanedData);
    // Menambahkan ID dokumen sebagai field 'id' setelah dibuat
    await docRef.set({ id: docRef.id }, { merge: true });

    console.log(
      `[ManagedClan - Admin] Klan baru dibuat: ${clanName} (${docRef.id})`,
    );
    return docRef.id;
  } catch (error) {
    console.error(
      `Firestore Error [createOrLinkManagedClan - Admin(${clanTag})]:`,
      error,
    );
    throw new Error('Gagal membuat atau menautkan klan yang dikelola (Admin SDK).');
  }
};

/**
 * Memperbarui cache API klan dan metadata klan utama.
 * FUNGSI INI SEKARANG HANYA CONTOH, LOGIKA UTAMA ADA DI API SYNC LANGSUNG DENGAN BATCH
 */
export const updateClanApiCache = async (
  clanId: string,
  cacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'>,
  updatedManagedClanFields: Partial<ManagedClan>,
): Promise<void> => {
  console.warn(
    '[updateClanApiCache - Admin] This function is deprecated. Use batch operations within the sync API route instead.',
  );
  try {
    const batch = adminFirestore.batch();
    const cacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('clanApiCache')
      .doc('current');
    const managedClanRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    const cachePayload = {
      ...cacheData,
      id: 'current',
      lastUpdated: new Date(), // Gunakan Date biasa, cleanData akan konversi
    };
    batch.set(cacheRef, cleanDataForAdminSDK(cachePayload), { merge: true }); // Gunakan merge

    const clanUpdatePayload = cleanDataForAdminSDK({
      ...updatedManagedClanFields,
      lastSynced: new Date(), // Update lastSynced juga
    });
    if (Object.keys(clanUpdatePayload).length > 0) {
      batch.update(managedClanRef, clanUpdatePayload);
    }

    await batch.commit();
    console.log(
      `[updateClanApiCache - Admin(${clanId})] Batch commit successful (legacy function).`,
    );
  } catch (error) {
    console.error(
      `Firestore Error [updateClanApiCache - Admin(${clanId})]:`,
      error,
    );
    throw new Error('Gagal menyimpan cache API klan (Admin SDK - legacy).');
  }
};

/**
 * Memperbarui atau membuat dokumen indeks klan publik.
 * Menggunakan Admin SDK. Dipanggil dari server (pencarian / cron job).
 */
export const updatePublicClanIndex = async (
  clanTag: string,
  clanData: Partial<PublicClanIndex>,
): Promise<void> => {
  try {
    const docRef = adminFirestore
      .collection(COLLECTIONS.PUBLIC_CLAN_INDEX)
      .doc(clanTag); // Gunakan clanTag sebagai ID dokumen

    const defaultBadgeUrls: CocIconUrls = {
      small: '/images/clan-badge-placeholder.png',
      medium: '/images/clan-badge-placeholder.png',
      large: '/images/clan-badge-placeholder.png',
    };

    // Siapkan payload lengkap dengan fallback dan timestamp
    const payload: Omit<PublicClanIndex, 'lastUpdated'> & { lastUpdated: Date } =
      {
        tag: clanData.tag || clanTag,
        name: clanData.name || 'Nama Klan Tidak Ditemukan',
        clanLevel: clanData.clanLevel || 1,
        memberCount: clanData.memberCount || 0,
        clanPoints: clanData.clanPoints || 0,
        clanCapitalPoints: clanData.clanCapitalPoints || 0,
        clanVersusPoints: clanData.clanVersusPoints || 0,
        badgeUrls: clanData.badgeUrls || defaultBadgeUrls,
        lastUpdated: new Date(), // Timestamp saat ini
        requiredTrophies: clanData.requiredTrophies || 0,
        warFrequency: clanData.warFrequency || 'unknown',
        warWinStreak: clanData.warWinStreak || 0,
        warWins: clanData.warWins || 0,
        type: clanData.type || 'closed',
        description: clanData.description || '',
        location: clanData.location || undefined,
        warLeague: clanData.warLeague || undefined, // Sertakan warLeague
      };

    const finalPayload = cleanDataForAdminSDK(payload); // Konversi Date ke Timestamp
    await docRef.set(finalPayload, { merge: true }); // Gunakan merge true
  } catch (error) {
    console.error(
      `Firestore Error [updatePublicClanIndex - Admin(${clanTag})]:`,
      error,
    );
    // Jangan throw error agar cron job tidak berhenti jika satu klan gagal
  }
};

// --- [BARU: TAHAP 1.3 - Roadmap] ---
// Fungsi baru ditambahkan di sini

/**
 * [BARU] Memperbarui snapshot 'memberList' di dokumen ManagedClan.
 * Ini digunakan untuk perbandingan join/leave di sinkronisasi berikutnya.
 * Ini juga memperbarui 'memberCount' dan 'lastSynced'
 */
export const updateManagedClanMemberList = async (
  clanId: string,
  newMemberList: { tag: string; name: string }[],
): Promise<void> => {
  try {
    const clanRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    const updateData = {
      memberList: newMemberList,
      memberCount: newMemberList.length,
      lastSynced: FieldValue.serverTimestamp(), // Gunakan server timestamp
    };

    await clanRef.update(updateData);

    console.log(
      `[updateManagedClanMemberList] Snapshot memberList untuk clan ${clanId} berhasil diperbarui.`,
    );
  } catch (error) {
    console.error(
      `Firestore Error [updateManagedClanMemberList - Admin(${clanId})]:`,
      error,
    );
    // Tidak melempar error agar proses sinkronisasi utama bisa lanjut
  }
};