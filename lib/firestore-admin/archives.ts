// File: lib/firestore-admin/archives.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait sub-koleksi arsip (CWL, Raid, War).

import { adminFirestore } from '../firebase-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../firestore-collections';
import {
  CwlArchive,
  RaidArchive,
  CocWarLog,
  WarArchive,
  // [FIX] Impor FirestoreDocument dari sumber yang benar (../types)
  FirestoreDocument,
  CocCurrentWar, // <-- [TAMBAHAN] Diperlukan untuk fungsi arsip baru
} from '../types';
// [FIX] Hapus impor yang salah dari './utils'
// import { FirestoreDocument } from './utils';

// --- [MODIFIKASI PERBAIKAN] ---
// Impor helper parsing tanggal dari server-utils
import { parseCocApiTimestamp } from '../server-utils';
// --- [AKHIR MODIFIKASI] ---

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
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<CwlArchive, 'id'>;

      // Rekursif konversi Timestamp di dalam rounds ke ISO string untuk serialisasi
      const roundsWithDates =
        data.rounds?.map((round) => {
          // PERBAIKAN ERROR TS2352:
          // Kita cast 'round' ke 'any' di sini agar bisa memeriksa 'instanceof'
          // tanpa TypeScript mengeluh bahwa tipenya adalah 'string'.
          const convertedRound = { ...round } as any;

          // Konversi startTime/endTime di objek CocWarLog di dalam array rounds
          // [FIX TS2358] Ganti 'instanceof'
          if (
            convertedRound.endTime &&
            typeof convertedRound.endTime.toDate === 'function'
          ) {
            // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
            convertedRound.endTime = (
              convertedRound.endTime as AdminTimestamp
            )
              .toDate()
              .toISOString();
            // [FIX TS2352] Ganti 'instanceof'
          } else if (
            Object.prototype.toString.call(convertedRound.endTime) ===
            '[object Date]'
          ) {
            convertedRound.endTime = (
              convertedRound.endTime as unknown as Date
            ).toISOString();
          }

          // [FIX TS2358] Ganti 'instanceof'
          if (
            convertedRound.startTime &&
            typeof convertedRound.startTime.toDate === 'function'
          ) {
            // FIX: Gunakan .toDate() untuk konversi, lalu .toISOString() untuk serialisasi
            convertedRound.startTime = (
              convertedRound.startTime as AdminTimestamp
            )
              .toDate()
              .toISOString();
            // [FIX TS2352] Ganti 'instanceof'
          } else if (
            Object.prototype.toString.call(convertedRound.startTime) ===
            '[object Date]'
          ) {
            convertedRound.startTime = (
              convertedRound.startTime as unknown as Date
            ).toISOString();
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
    console.error(
      `Firestore Error [getCwlArchivesByClanId - Admin(${clanId})]:`,
      error
    );
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

    return snapshot.docs
      .map((doc) => {
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
          } else if (
            Object.prototype.toString.call(rawStartTime) === '[object Date]'
          ) {
            // Tambahkan cek jika sudah Date
            startTime = rawStartTime as unknown as Date;
          }
          // --- [MODIFIKASI PERBAIKAN] ---
          // Tambahkan fallback untuk parsing string dari CoC API
          else if (typeof rawStartTime === 'string') {
            startTime = parseCocApiTimestamp(rawStartTime);
          }
          // --- [AKHIR MODIFIKASI] ---
        }

        // Memeriksa dan mengonversi properti `endTime`
        if (Object.prototype.hasOwnProperty.call(data, 'endTime')) {
          const rawEndTime = (data as any).endTime;
          // [FIX TS2358] Ganti 'instanceof'
          if (rawEndTime && typeof rawEndTime.toDate === 'function') {
            endTime = rawEndTime.toDate();
            // [FIX TS2352] Ganti 'instanceof'
          } else if (
            Object.prototype.toString.call(rawEndTime) === '[object Date]'
          ) {
            // Tambahkan cek jika sudah Date
            endTime = rawEndTime as unknown as Date;
          }
          // --- [MODIFIKASI PERBAIKAN] ---
          // Tambahkan fallback untuk parsing string dari CoC API
          else if (typeof rawEndTime === 'string') {
            endTime = parseCocApiTimestamp(rawEndTime);
          }
          // --- [AKHIR MODIFIKASI] ---
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
      })
      .filter(
        (item) => item !== null && item.endTime !== undefined
      ) as FirestoreDocument<RaidArchive>[];
  } catch (error) {
    console.error(
      `Firestore Error [getRaidArchivesByClanId - Admin(${clanId})]:`,
      error
    );
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
    const snapshot = await warRef
      .orderBy('warEndTime', 'desc')
      .limit(50)
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as Omit<WarArchive, 'id'>;

        // Konversi manual timestamp ke Date
        let warEndTime: Date | undefined = undefined;
        if (Object.prototype.hasOwnProperty.call(data, 'warEndTime')) {
          const rawEndTime = (data as any).warEndTime;
          // [FIX TS2358] Ganti 'instanceof'
          if (rawEndTime && typeof rawEndTime.toDate === 'function') {
            warEndTime = rawEndTime.toDate();
            // [FIX TS2352] Ganti 'instanceof'
          } else if (
            Object.prototype.toString.call(rawEndTime) === '[object Date]'
          ) {
            warEndTime = rawEndTime as unknown as Date;
          } else if (typeof rawEndTime === 'string') {
            // --- [MODIFIKASI PERBAIKAN] ---
            // warEndTime = new Date(rawEndTime); // BUG: Ini akan gagal
            warEndTime = parseCocApiTimestamp(rawEndTime); // FIX: Gunakan parser
            // --- [AKHIR MODIFIKASI] ---
          }
        }

        let startTime: Date | undefined = undefined;
        if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
          const rawStartTime = (data as any).startTime;
          // [FIX TS2358] Ganti 'instanceof'
          if (rawStartTime && typeof rawStartTime.toDate === 'function') {
            startTime = rawStartTime.toDate();
            // [FIX TS2352] Ganti 'instanceof'
          } else if (
            Object.prototype.toString.call(rawStartTime) === '[object Date]'
          ) {
            startTime = rawStartTime as unknown as Date;
          } else if (typeof rawStartTime === 'string') {
            // --- [MODIFIKASI PERBAIKAN] ---
            // startTime = new Date(rawStartTime); // BUG: Ini akan gagal
            startTime = parseCocApiTimestamp(rawStartTime); // FIX: Gunakan parser
            // --- [AKHIR MODIFIKASI] ---
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
      })
      .filter((item) => item !== null) as FirestoreDocument<WarArchive>[];
  } catch (error) {
    console.error(
      `Firestore Error [getWarArchivesByClanId - Admin(${clanId})]:`,
      error
    );
    return [];
  }
};

// --- [PERBAIKAN BUG 2] FUNGSI ARSIP DIPERBARUI ---

/**
 * Mengarsipkan data Perang Klasik yang telah selesai (transisi ke 'warEnded').
 * [PERBAIKAN BUG 2] Mengubah data CocCurrentWar menjadi WarArchive secara EKSPLISIT
 * untuk memastikan 'hasDetails: true' TERTULIS di Firestore.
 * @param clanId - ID dokumen ManagedClan internal
 * @param clanTag - Tag klan (misal "#123ABC")
 * @param warData - Objek CocCurrentWar LENGKAP (sudah dinormalisasi oleh coc-api.ts)
 */
export const archiveClassicWar = async (
  clanId: string,
  clanTag: string,
  warData: CocCurrentWar
): Promise<void> => {
  // Hanya arsipkan jika state 'warEnded' dan BUKAN CWL (warTag tidak ada atau null)
  if (warData.state !== 'warEnded' || warData.warTag) {
    if (warData.warTag) {
      console.log(
        `[archiveClassicWar] Skipping archive for clan ${clanId}. Reason: Is a CWL war.`
      );
    }
    return;
  }

  try {
    // Tentukan ID dokumen. Gunakan endTime (string ISO) sebagai ID.
    // --- [MODIFIKASI FASE 6: UNIFIKASI ID] ---
    // Logika ini SEKARANG SAMA PERSIS dengan logika ID di sync/warlog/route.ts
    if (!warData.endTime) {
      throw new Error('War data is missing endTime, cannot use as archive ID.');
    }
    const opponentTag = warData.opponent?.tag || 'unknown';
    const docId = `${warData.endTime}_${opponentTag.replace('#', '')}`;
    // --- [AKHIR MODIFIKASI FASE 6] ---

    const archiveRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.WAR_ARCHIVES) // Menggunakan 'warArchives'
      .doc(docId); // Gunakan ID baru yang sudah disamakan

    // 1. Cek apakah dokumen ini sudah ada (mencegah duplikat write)
    const existingDoc = await archiveRef.get();
    if (existingDoc.exists) {
      console.log(
        `[archiveClassicWar] War archive for clan ${clanId} (ID: ${docId}) already exists. Skipping.`
      );
      return;
    }

    // 2. [PERBAIKAN BUG 2] Transformasi data CocCurrentWar -> WarArchive
    // Buat objek 'WarArchive' secara manual, JANGAN gunakan spread '...warData'.
    // Ini untuk memastikan 'hasDetails: true' tidak tertimpa oleh 'undefined'.
    const archiveData: Omit<WarArchive, 'id'> = {
      // Properti Kustom WarArchive
      clanTag: clanTag,
      // --- [MODIFIKASI PERBAIKAN] ---
      // Ganti 'new Date()' dengan parser yang benar
      warEndTime: parseCocApiTimestamp(warData.endTime), // Konversi ke Date object VALID
      // --- [AKHIR MODIFIKASI] ---
      hasDetails: true, // <-- INI YANG PENTING AGAR TOMBOL AKTIF

      // Properti yang di-inherit dari CocWarLog / CocCurrentWar
      state: warData.state,
      teamSize: warData.teamSize,
      // --- [MODIFIKASI PERBAIKAN] ---
      // Kita juga harus mengonversi string timestamp lain yang di-inherit
      // jika kita ingin menyimpannya sebagai Date (meskipun tipe mewarisi string)
      // TAPI, tipe WarArchive mewarisi string, jadi kita biarkan string.
      // Hanya 'warEndTime' yang bertipe Date.
      preparationStartTime: warData.preparationStartTime,
      startTime: warData.startTime,
      // --- [AKHIR MODIFIKASI] ---
      endTime: warData.endTime, // Simpan string ISO juga (sesuai tipe CocWarLog)
      clan: warData.clan, // Objek lengkap (sudah dinormalisasi dari coc-api.ts)
      opponent: warData.opponent, // Objek lengkap (sudah dinormalisasi dari coc-api.ts)
      result: warData.result,
      attacksPerMember: warData.attacksPerMember,
      // warTag akan undefined/null, yang mana sudah benar
    };

    // 3. Simpan ke Firestore
    await archiveRef.set(archiveData);

    console.log(
      `[archiveClassicWar] Successfully archived classic war for clan ${clanId} (ID: ${docId}).`
    );
  } catch (error) {
    console.error(
      `[archiveClassicWar] Failed to archive war for clan ${clanId} (War End: ${warData.endTime}):`,
      error
    );
    // Jangan throw error, agar proses sinkronisasi utama tetap berjalan
  }
};