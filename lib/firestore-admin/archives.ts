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
  FirestoreDocument,
  CocCurrentWar,
  CocWarLogEntry,
} from '../types';

// Impor helper parsing tanggal dari server-utils
import { parseCocApiTimestamp } from '../server-utils';

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

    // Memastikan semua objek Date di dalam rounds dikonversi ke ISO string.
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<CwlArchive, 'id'>;

      // Rekursif konversi Timestamp di dalam rounds ke ISO string untuk serialisasi
      const roundsWithDates =
        data.rounds?.map((round) => {
          const convertedRound = { ...round } as any;

          // Konversi startTime/endTime di objek CocWarLog di dalam array rounds
          if (
            convertedRound.endTime &&
            typeof convertedRound.endTime.toDate === 'function'
          ) {
            convertedRound.endTime = (
              convertedRound.endTime as AdminTimestamp
            )
              .toDate()
              .toISOString();
          } else if (
            Object.prototype.toString.call(convertedRound.endTime) ===
            '[object Date]'
          ) {
            convertedRound.endTime = (
              convertedRound.endTime as unknown as Date
            ).toISOString();
          }

          if (
            convertedRound.startTime &&
            typeof convertedRound.startTime.toDate === 'function'
          ) {
            convertedRound.startTime = (
              convertedRound.startTime as AdminTimestamp
            )
              .toDate()
              .toISOString();
          } else if (
            Object.prototype.toString.call(convertedRound.startTime) ===
            '[object Date]'
          ) {
            convertedRound.startTime = (
              convertedRound.startTime as unknown as Date
            ).toISOString();
          }

          return convertedRound as CocWarLog; // Cast kembali ke CocWarLog
        }) || [];

      return {
        id: doc.id,
        ...data,
        rounds: roundsWithDates,
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

        let startTime: Date | undefined = undefined;
        let endTime: Date | undefined = undefined;

        // Memeriksa dan mengonversi properti `startTime`
        if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
          const rawStartTime = (data as any).startTime;
          if (rawStartTime && typeof rawStartTime.toDate === 'function') {
            startTime = rawStartTime.toDate();
          } else if (
            Object.prototype.toString.call(rawStartTime) === '[object Date]'
          ) {
            startTime = rawStartTime as unknown as Date;
          }
          // Tambahkan fallback untuk parsing string dari CoC API
          else if (typeof rawStartTime === 'string') {
            startTime = parseCocApiTimestamp(rawStartTime);
          }
        }

        // Memeriksa dan mengonversi properti `endTime`
        if (Object.prototype.hasOwnProperty.call(data, 'endTime')) {
          const rawEndTime = (data as any).endTime;
          if (rawEndTime && typeof rawEndTime.toDate === 'function') {
            endTime = rawEndTime.toDate();
          } else if (
            Object.prototype.toString.call(rawEndTime) === '[object Date]'
          ) {
            endTime = rawEndTime as unknown as Date;
          }
          // Tambahkan fallback untuk parsing string dari CoC API
          else if (typeof rawEndTime === 'string') {
            endTime = parseCocApiTimestamp(rawEndTime);
          }
        }

        return {
          id: doc.id,
          ...data,
          startTime: startTime,
          endTime: endTime,
        } as FirestoreDocument<RaidArchive>;
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
      .collection('warArchives');

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
          if (rawEndTime && typeof rawEndTime.toDate === 'function') {
            warEndTime = rawEndTime.toDate();
          } else if (
            Object.prototype.toString.call(rawEndTime) === '[object Date]'
          ) {
            warEndTime = rawEndTime as unknown as Date;
          } else if (typeof rawEndTime === 'string') {
            warEndTime = parseCocApiTimestamp(rawEndTime);
          }
        }

        let startTime: Date | undefined = undefined;
        if (Object.prototype.hasOwnProperty.call(data, 'startTime')) {
          const rawStartTime = (data as any).startTime;
          if (rawStartTime && typeof rawStartTime.toDate === 'function') {
            startTime = rawStartTime.toDate();
          } else if (
            Object.prototype.toString.call(rawStartTime) === '[object Date]'
          ) {
            startTime = rawStartTime as unknown as Date;
          } else if (typeof rawStartTime === 'string') {
            startTime = parseCocApiTimestamp(rawStartTime);
          }
        }

        const returnObj = {
          id: doc.id,
          ...data,
          warEndTime: warEndTime,
          startTime: startTime,
        };

        // Hapus properti 'endTime' (string) warisan dari CocWarLog
        delete (returnObj as any).endTime;

        return returnObj as unknown as FirestoreDocument<WarArchive>;
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

/**
 * Mengarsipkan data Perang Klasik yang telah selesai (transisi ke 'warEnded').
 * Mengubah data CocCurrentWar menjadi WarArchive secara EKSPLISIT
 * untuk memastikan 'hasDetails: true' TERTULIS di Firestore.
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
    // Format: {endTime}_{opponentTag}
    if (!warData.endTime) {
      throw new Error('War data is missing endTime, cannot create archive ID.');
    }
    const opponentTag = warData.opponent.tag?.replace('#', '') || 'unknown';
    const docId = `${warData.endTime}_${opponentTag}`;

    if (opponentTag === 'unknown') {
      console.warn(
        `[archiveClassicWar] Opponent tag is 'unknown' for war ${docId}. Archiving anyway.`
      );
    }

    const archiveRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.WAR_ARCHIVES)
      .doc(docId);

    // 1. Cek apakah dokumen ini sudah ada
    const existingDoc = await archiveRef.get();
    if (existingDoc.exists) {
      console.log(
        `[archiveClassicWar] War archive for clan ${clanId} (ID: ${docId}) already exists. Skipping.`
      );
      return;
    }

    // 2. Transformasi data CocCurrentWar -> WarArchive
    const archiveData: Omit<WarArchive, 'id'> = {
      clanTag: clanTag,
      warEndTime: parseCocApiTimestamp(warData.endTime), // Konversi ke Date object VALID
      hasDetails: true,

      state: warData.state,
      teamSize: warData.teamSize,
      preparationStartTime: warData.preparationStartTime,
      startTime: warData.startTime,
      endTime: warData.endTime,
      clan: warData.clan,
      opponent: warData.opponent,

      // 'warData.result' dari currentWar API sering 'undefined' bahkan saat 'warEnded'.
      // Kita set 'unknown' agar 'sync/warlog' bisa menimpanya.
      result: 'unknown',

      attacksPerMember: warData.attacksPerMember,
    };

    // 3. Simpan ke Firestore
    await archiveRef.set(archiveData);

    console.log(
      `[archiveClassicWar] Successfully archived classic war for clan ${clanId} (War ID: ${docId}).`
    );
  } catch (error) {
    console.error(
      `[archiveClassicWar] Failed to archive war for clan ${clanId} (War End: ${warData.endTime}):`,
      error
    );
  }
};

/**
 * Menggabungkan data ringkasan (result) dari War Log ke arsip perang yang ada.
 * Jika tidak ada arsip (dgn data detail) yang cocok, buat arsip ringkasan baru.
 * Ini adalah implementasi LANGKAH 3 dari Peta Develop.
 */
export const mergeWarLogEntry = async (
  clanId: string,
  clanTag: string,
  entry: CocWarLogEntry
): Promise<void> => {
  const logResult = entry.result;
  const logEndTimeStr = entry.endTime;
  const logOpponentTag = entry.opponent?.tag;

  // 1. Validasi Data Log
  if (!logResult || !logEndTimeStr || !logOpponentTag) {
    console.warn(
      `[mergeWarLogEntry] Skipping warlog entry for clan ${clanId}. Reason: Incomplete data (result, endTime, or opponentTag missing).`
    );
    return;
  }

  // Jangan proses jika hasil dari log adalah 'unknown' ATAU tidak ada.
  if (!logResult || logResult === 'unknown') {
    console.warn(
      `[mergeWarLogEntry] Skipping warlog entry for clan ${clanId}. Reason: Log result is missing or 'unknown'.`
    );
    return;
  }

  const warArchivesCol = adminFirestore
    .collection(COLLECTIONS.MANAGED_CLANS)
    .doc(clanId)
    .collection(COLLECTIONS.WAR_ARCHIVES);

  // 3. Logika Fuzzy Query (Rencana B)
  const logTime = parseCocApiTimestamp(logEndTimeStr);
  // [PENYESUAIAN] Kita perlebar rentang jadi +/- 30 detik agar lebih aman
  const TIME_BUFFER_MS = 30 * 1000;
  const queryStartTime = new Date(logTime.getTime() - TIME_BUFFER_MS);
  const queryEndTime = new Date(logTime.getTime() + TIME_BUFFER_MS);

  try {
    // 4. Lakukan query HANYA berdasarkan opponent.tag (filter paling selektif)
    const query = warArchivesCol.where('opponent.tag', '==', logOpponentTag);

    const snapshot = await query.get();

    // 5. Jika Ditemukan (Dokumen Detail Ada) -> MERGE
    // Kita filter secara manual di sini untuk hasDetails DAN rentang waktu
    const docToUpdate = snapshot.docs.find((doc) => {
      // 1. Cast ke 'any' agar kita bisa cek '.toDate' tanpa error TypeScript
      const data = doc.data() as any;

      if (data.hasDetails !== true) return false;

      // 2. Cek 'toDate' di 'data.warEndTime'
      if (
        !data.warEndTime ||
        typeof data.warEndTime.toDate !== 'function'
      ) {
        return false;
      }
      const docTime = (data.warEndTime as AdminTimestamp).toDate();
      return docTime >= queryStartTime && docTime <= queryEndTime;
    });

    if (docToUpdate) {
      const docData = docToUpdate.data() as WarArchive;

      // Hanya update jika hasilnya masih 'unknown'
      if (docData.result === 'unknown' || !docData.result) {
        await docToUpdate.ref.update({
          result: logResult,
        });
        console.log(
          `[mergeWarLogEntry] MERGED result ('${logResult}') into existing war archive (ID: ${docToUpdate.id}) for clan ${clanId}.`
        );
      } else {
        console.log(
          `[mergeWarLogEntry] SKIPPED merge for war archive (ID: ${docToUpdate.id}). Result ('${docData.result}') already set.`
        );
      }
      return; // Selesai
    }

    // 6. Jika Tidak Ditemukan (Buat Arsip Ringkasan - Fallback)
    console.log(
      `[mergeWarLogEntry] No detailed archive found for clan ${clanId} (Opp: ${logOpponentTag}, End: ${logEndTimeStr}). Creating summary archive.`
    );

    const docId = `${logEndTimeStr}_${logOpponentTag.replace('#', '')}`;
    const fallbackRef = warArchivesCol.doc(docId);

    const existingFallback = await fallbackRef.get();
    if (existingFallback.exists) {
      console.log(
        `[mergeWarLogEntry] Summary archive (ID: ${docId}) already exists. Skipping.`
      );
      return;
    }

    // Buat objek ringkasan
    const summaryArchive: Omit<WarArchive, 'id'> = {
      clanTag: clanTag,
      warEndTime: logTime, // Simpan sebagai Date object (penting untuk query)
      endTime: logEndTimeStr, // Simpan string ISO (sesuai tipe CocWarLog)
      result: logResult,
      teamSize: entry.teamSize,
      hasDetails: false,
      state: 'warEnded',
      clan: {
        tag: entry.clan.tag,
        name: entry.clan.name,
        badgeUrls: entry.clan.badgeUrls,
        clanLevel: entry.clan.clanLevel,
        stars: entry.clan.stars,
        destructionPercentage: entry.clan.destructionPercentage,
        attacks: entry.clan.attacks,
        expEarned: entry.clan.expEarned,
        members: [], // Kosong karena ini ringkasan
      },
      opponent: {
        tag: entry.opponent.tag,
        name: entry.opponent.name,
        badgeUrls: entry.opponent.badgeUrls,
        clanLevel: entry.opponent.clanLevel,
        stars: entry.opponent.stars,
        destructionPercentage: entry.opponent.destructionPercentage,
        members: [], // Kosong karena ini ringkasan
      },
      preparationStartTime: 'unknown',
      startTime: 'unknown',
    };

    await fallbackRef.set(summaryArchive);
    console.log(
      `[mergeWarLogEntry] Created new SUMMARY archive (ID: ${docId}) for clan ${clanId}.`
    );
  } catch (queryError) {
    console.error(
      `[mergeWarLogEntry] Error during query/merge for clan ${clanId} (Opp: ${logOpponentTag}):`,
      queryError
    );
  }
};