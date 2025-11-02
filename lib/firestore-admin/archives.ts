// File: lib/firestore-admin/archives.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait sub-koleksi arsip (CWL, Raid, War).

import { adminFirestore } from '../firebase-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../firestore-collections';
import {
  CwlArchive,
  RaidArchive,
  CocWarLog,
  WarArchive
} from '../types';
import { FirestoreDocument } from './utils';

/**
 * Mengambil semua arsip CWL (Clan War League) untuk Clan tertentu.
 * Diurutkan berdasarkan musim secara descending (terbaru di atas)
 */
export const getCwlArchivesByClanId = async (
  clanId: string
): Promise<FirestoreDocument<CwlArchive>[]> => {
  try {
    const cwlRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('cwlArchives');

    // Mengambil semua dokumen arsip CWL, diurutkan secara descending berdasarkan ID Musim (Season)
    const snapshot = await cwlRef.orderBy('season', 'desc').get();

    // PERBAIKAN #2: Memastikan semua objek Date di dalam rounds dikonversi ke ISO string.
    return snapshot.docs.map(doc => {
      const data = doc.data() as Omit<CwlArchive, 'id'>;

      // Rekursif konversi Timestamp di dalam rounds ke ISO string untuk serialisasi
      const roundsWithDates = data.rounds?.map(round => {
        // PERBAIKAN ERROR TS2352:
        // Kita cast 'round' ke 'any' di sini agar bisa memeriksa 'instanceof'
        // tanpa TypeScript mengeluh bahwa tipenya adalah 'string'.
        const convertedRound = { ...round } as any;

        // Konversi startTime/endTime di objek CocWarLog di dalam array rounds
        // [FIX TS2358] Ganti 'instanceof'
        if (convertedRound.endTime && typeof convertedRound.endTime.toDate === 'function') {
          // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
          convertedRound.endTime = (convertedRound.endTime as AdminTimestamp).toDate().toISOString();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(convertedRound.endTime) === '[object Date]') {
          convertedRound.endTime = (convertedRound.endTime as unknown as Date).toISOString();
        }

        // [FIX TS2358] Ganti 'instanceof'
        if (convertedRound.startTime && typeof convertedRound.startTime.toDate === 'function') {
          // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
          convertedRound.startTime = (convertedRound.startTime as AdminTimestamp).toDate().toISOString();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(convertedRound.startTime) === '[object Date]') {
          convertedRound.startTime = (convertedRound.startTime as unknown as Date).toISOString();
        }

        // Kita asumsikan properti lain di CocWarLog juga aman (string/number/boolean)
        return convertedRound as CocWarLog; // Cast kembali ke CocWarLog
      }) || [];


      return {
        id: doc.id, // Ambil ID dari dokumen
        ...data, // Sebar sisa data
        rounds: roundsWithDates, // Gunakan rounds yang sudah dikonversi
      } as FirestoreDocument<CwlArchive>;
    });
  } catch (error) {
    console.error(`Firestore Error [getCwlArchivesByClanId - Admin(${clanId})]:`, error);
    return [];
  }
};


/**
 * Mengambil semua arsip Raid (Ibu Kota Klan) untuk Clan tertentu.
 * Diurutkan berdasarkan waktu selesai (endTime) secara descending (terbaru di atas)
 */
export const getRaidArchivesByClanId = async (
  clanId: string
): Promise<FirestoreDocument<RaidArchive>[]> => {
  try {
    const raidRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('raidArchives');

    // Mengambil semua dokumen arsip Raid, diurutkan berdasarkan endTime secara descending
    const snapshot = await raidRef.orderBy('endTime', 'desc').get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as Omit<RaidArchive, 'id'>;

      // Deklarasi yang lebih aman untuk TypeScript
      let startTime: Date | undefined = undefined;
      let endTime: Date | undefined = undefined;

      // Memeriksa dan mengonversi properti `startTime`
      if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
        const rawStartTime = (data as any).startTime;
        // [FIX TS2358] Ganti 'instanceof'
        if (rawStartTime && typeof rawStartTime.toDate === 'function') {
          startTime = rawStartTime.toDate();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(rawStartTime) === '[object Date]') { // Tambahkan cek jika sudah Date
          startTime = rawStartTime as unknown as Date;
        }
      }

      // Memeriksa dan mengonversi properti `endTime`
      if (Object.prototype.hasOwnProperty.call(data, 'endTime')) {
        const rawEndTime = (data as any).endTime;
        // [FIX TS2358] Ganti 'instanceof'
        if (rawEndTime && typeof rawEndTime.toDate === 'function') {
          endTime = rawEndTime.toDate();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(rawEndTime) === '[object Date]') { // Tambahkan cek jika sudah Date
          endTime = rawEndTime as unknown as Date;
        }
      }

      // Mengembalikan objek dengan properti Date yang sudah dikonversi atau undefined
      return {
        id: doc.id,
        ...data,
        // PERBAIKAN: Hapus non-null assertion (!)
        // Karena startTime/endTime sekarang opsional di tipe RaidArchive, kita bisa biarkan undefined
        startTime: startTime,
        endTime: endTime,
        // Members sudah seharusnya bertipe CocRaidMember[]
      } as FirestoreDocument<RaidArchive>;
      // Filter item yang tidak memiliki endTime (data korup/belum selesai)
    }).filter(item => item !== null && item.endTime !== undefined) as FirestoreDocument<RaidArchive>[];

  } catch (error) {
    console.error(`Firestore Error [getRaidArchivesByClanId - Admin(${clanId})]:`, error);
    return [];
  }
};

/**
 * Mengambil semua arsip War Classic (War Klasik) untuk Clan tertentu.
 * Diurutkan berdasarkan waktu selesai (warEndTime) secara descending (terbaru di atas).
 */
export const getWarArchivesByClanId = async (
  clanId: string
): Promise<FirestoreDocument<WarArchive>[]> => {
  try {
    const warRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('warArchives'); // Nama koleksi yang benar

    // Mengambil arsip, diurutkan berdasarkan warEndTime (descending)
    // Kita batasi 50 untuk performa
    const snapshot = await warRef.orderBy('warEndTime', 'desc').limit(50).get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as Omit<WarArchive, 'id'>;

      // Konversi manual timestamp ke Date
      let warEndTime: Date | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(data, 'warEndTime')) {
        const rawEndTime = (data as any).warEndTime;
        // [FIX TS2358] Ganti 'instanceof'
        if (rawEndTime && typeof rawEndTime.toDate === 'function') {
          warEndTime = rawEndTime.toDate();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(rawEndTime) === '[object Date]') {
          warEndTime = rawEndTime as unknown as Date;
        } else if (typeof rawEndTime === 'string') {
          warEndTime = new Date(rawEndTime); // Fallback jika disimpan sebagai string
        }
      }

      let startTime: Date | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
        const rawStartTime = (data as any).startTime;
        // [FIX TS2358] Ganti 'instanceof'
        if (rawStartTime && typeof rawStartTime.toDate === 'function') {
          startTime = rawStartTime.toDate();
          // [FIX TS2352] Ganti 'instanceof'
        } else if (Object.prototype.toString.call(rawStartTime) === '[object Date]') {
          startTime = rawStartTime as unknown as Date;
        } else if (typeof rawStartTime === 'string') {
          startTime = new Date(rawStartTime); // Fallback
        }
      }

      // --- PERBAIKAN: Cast ke 'unknown' terlebih dahulu ---
      const returnObj = {
        id: doc.id,
        ...data,
        warEndTime: warEndTime, // Pastikan ini adalah objek Date
        startTime: startTime, // Pastikan ini adalah objek Date
      };

      // Hapus properti 'endTime' (string) warisan dari CocWarLog
      delete (returnObj as any).endTime;

      return returnObj as unknown as FirestoreDocument<WarArchive>;
      // --- AKHIR PERBAIKAN ---

    }).filter(item => item !== null) as FirestoreDocument<WarArchive>[];

  } catch (error) {
    console.error(`Firestore Error [getWarArchivesByClanId - Admin(${clanId})]:`, error);
    return [];
  }
};
