// File: lib/firestore-admin/tournaments.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'tournaments'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// Impor tipe data Tournament yang baru kita buat, melalui barrel file 'types'
// [PERBAIKAN] Tambahkan TournamentParticipant
import {
  Tournament,
  FirestoreDocument,
  TournamentParticipant,
} from '../types';
// Impor utilitas konversi data
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';
// [PERBAIKAN] Tambahkan FieldValue
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * @function getAllTournamentsAdmin
 * Mengambil semua turnamen dari koleksi 'tournaments'.
 * Diurutkan berdasarkan tanggal mulai (terbaru dulu).
 * Dipanggil dari API Routes GET /api/tournaments.
 */
export const getAllTournamentsAdmin = async (): Promise<
  FirestoreDocument<Tournament>[]
> => {
  try {
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);
    // Mengurutkan berdasarkan startDate, turnamen terbaru (yang akan datang) muncul di atas
    const q = tournamentsRef.orderBy('startDate', 'desc');

    const snapshot = await q.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<Tournament>(doc))
      .filter(Boolean) as FirestoreDocument<Tournament>[];
  } catch (error) {
    console.error(
      `Firestore Error [getAllTournamentsAdmin - Admin]:`,
      error,
    );
    // Kembalikan array kosong jika terjadi error (misal: index hilang)
    return [];
  }
};

/**
 * @function getTournamentByIdAdmin
 * Mengambil satu dokumen turnamen berdasarkan ID-nya.
 * Dipanggil dari API Routes GET /api/tournaments/[tournamentId].
 */
export const getTournamentByIdAdmin = async (
  tournamentId: string,
): Promise<FirestoreDocument<Tournament> | null> => {
  try {
    const docRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);
    const docSnap = await docRef.get();

    return docToDataAdmin<Tournament>(docSnap);
  } catch (error) {
    console.error(
      `Firestore Error [getTournamentByIdAdmin - Admin(${tournamentId})]:`,
      error,
    );
    return null;
  }
};

/**
 * @function createTournamentAdmin
 * Membuat dokumen turnamen baru di koleksi 'tournaments'.
 * Dipanggil dari API Routes POST /api/tournaments.
 * @param data - Objek data turnamen (tanpa metadata 'id', 'createdAt', 'participantCount')
 * @returns ID dokumen baru yang telah dibuat.
 */
export const createTournamentAdmin = async (
  // Omit digunakan untuk memastikan 'id' dan metadata tidak dikirim oleh klien
  data: Omit<Tournament, 'id' | 'createdAt' | 'participantCount'>,
): Promise<string> => {
  try {
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);

    // Tambahkan metadata sisi server
    const newTournamentData = {
      ...data,
      createdAt: Timestamp.now(), // Gunakan Timestamp Admin SDK
      participantCount: 0,
    };

    // Bersihkan data (konversi Date ke Timestamp, hapus undefined)
    const cleanedData = cleanDataForAdminSDK(newTournamentData);

    const docRef = await tournamentsRef.add(cleanedData);
    console.log(
      `[Tournament - Admin] Turnamen baru ${docRef.id} berhasil dibuat.`,
    );
    return docRef.id;
  } catch (error) {
    console.error(`Firestore Error [createTournamentAdmin - Admin]:`, error);
    throw new Error('Gagal membuat turnamen (Admin SDK).');
  }
};

// --- [BARU: TAHAP 5, POIN 3] ---
/**
 * @function registerTeamForTournamentAdmin
 * Mendaftarkan tim ke turnamen menggunakan Transaksi Firestore.
 * Fungsi ini:
 * 1. Mengecek apakah turnamen ada.
 * 2. Mengecek apakah turnamen sudah penuh.
 * 3. Mengecek apakah tim (ID) sudah terdaftar.
 * 4. Menambahkan dokumen tim ke sub-koleksi 'participants'.
 * 5. Menambah 'participantCount' di dokumen turnamen utama.
 *
 * @param tournamentId ID turnamen.
 * @param participantTeamId ID dari EsportsTeam yang mendaftar.
 * @param participantData Data pendaftar (sesuai Tipe TournamentParticipant).
 * @returns {Promise<{ success: true, participantId: string }>} Jika berhasil.
 * @throws {Error} Jika validasi gagal (misal: penuh, sudah terdaftar).
 */
export const registerTeamForTournamentAdmin = async (
  tournamentId: string,
  participantTeamId: string,
  // Omit 'id' dan 'registeredAt' karena akan di-set oleh server
  participantData: Omit<TournamentParticipant, 'id' | 'registeredAt' | 'status'>,
  sessionUser: { uid: string; displayName: string },
): Promise<{ success: true; participantId: string }> => {
  const tournamentRef = adminFirestore
    .collection(COLLECTIONS.TOURNAMENTS)
    .doc(tournamentId);

  // Menggunakan COLLECTIONS.REGISTRATIONS sesuai file collections.ts
  // dan roadmap Tahap 4.1
  const participantRef = tournamentRef
    .collection(COLLECTIONS.REGISTRATIONS)
    .doc(participantTeamId); // Gunakan ID Tim E-sports sebagai ID dokumen

  try {
    await adminFirestore.runTransaction(async (t) => {
      // 1. Baca data turnamen
      const tournamentSnap = await t.get(tournamentRef);
      if (!tournamentSnap.exists) {
        throw new Error('Turnamen tidak ditemukan.');
      }
      const tournamentData = tournamentSnap.data() as Tournament;

      // 2. Cek kuota
      if (tournamentData.participantCount >= tournamentData.maxParticipants) {
        throw new Error('Pendaftaran turnamen sudah penuh.');
      }

      // 3. Cek apakah sudah terdaftar
      const existingParticipantSnap = await t.get(participantRef);
      if (existingParticipantSnap.exists) {
        throw new Error('Tim ini sudah terdaftar di turnamen ini.');
      }

      // 4. Siapkan data pendaftar baru
      const newParticipant: Omit<TournamentParticipant, 'id'> = {
        ...participantData,
        // Data ini di-set oleh server untuk keamanan
        representativeId: sessionUser.uid,
        representativeName: sessionUser.displayName,
        status: 'APPROVED', // Langsung set 'APPROVED'
        registeredAt: new Date(), // [PERBAIKAN] Diubah dari Timestamp.now() ke new Date()
      };

      // 5. Tulis pendaftar baru
      // Kita gunakan cleanDataForAdminSDK untuk mengonversi Date (jika ada) ke Timestamp
      t.set(participantRef, cleanDataForAdminSDK(newParticipant));

      // 6. Update counter di turnamen utama
      t.update(tournamentRef, {
        participantCount: FieldValue.increment(1),
      });
    });

    console.log(
      `[Tournament - Admin] Tim ${participantTeamId} berhasil terdaftar di ${tournamentId}.`,
    );
    return { success: true, participantId: participantRef.id };
  } catch (error: any) {
    console.error(
      `Firestore Error [registerTeamForTournamentAdmin - Admin(${tournamentId}, ${participantTeamId})]:`,
      error.message,
    );
    // Lempar ulang error agar bisa ditangkap oleh API Route
    throw error;
  }
};
// --- [AKHIR BARU] ---

// --- [BARU: TAHAP 6, POIN 1] ---
/**
 * @function getParticipantsForTournamentAdmin
 * Mengambil semua dokumen peserta (tim) yang terdaftar di turnamen.
 * @param tournamentId ID turnamen.
 * @returns {Promise<FirestoreDocument<TournamentParticipant>[]>} Array data peserta.
 */
export const getParticipantsForTournamentAdmin = async (
  tournamentId: string,
): Promise<FirestoreDocument<TournamentParticipant>[]> => {
  try {
    const participantsRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection(COLLECTIONS.REGISTRATIONS); // Sesuai collections.ts

    // Urutkan berdasarkan tanggal daftar, yang paling dulu daftar muncul di atas
    const q = participantsRef.orderBy('registeredAt', 'asc');

    const snapshot = await q.get();

    return snapshot.docs
      .map((doc) => docToDataAdmin<TournamentParticipant>(doc))
      .filter(Boolean) as FirestoreDocument<TournamentParticipant>[];
  } catch (error) {
    console.error(
      `Firestore Error [getParticipantsForTournamentAdmin - Admin(${tournamentId})]:`,
      error,
    );
    return []; // Kembalikan array kosong jika error
  }
};
// --- [AKHIR BARU] ---