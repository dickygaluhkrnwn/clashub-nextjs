// File: lib/firestore-admin/tournaments.ts
// Deskripsi: [FIX FASE 11.2] Memperbaiki 'createTournamentAdmin' agar menerima status dari API route.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// [FIX V2.7] Mengganti '../types' menjadi '../clashub.types'
import {
  Tournament,
  FirestoreDocument,
  TournamentTeam,
} from '../clashub.types';
// Impor utilitas konversi data
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';
// [PERBAIKAN] Tambahkan FieldValue
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * @function getAllTournamentsAdmin
 * Mengambil semua turnamen dari koleksi 'tournaments'.
 * [FIX FASE 12.2] Diurutkan berdasarkan 'tournamentStartsAt' (tanggal turnamen dimulai).
 * Dipanggil dari API Routes GET /api/tournaments.
 */
export const getAllTournamentsAdmin = async (): Promise<
  FirestoreDocument<Tournament>[]
> => {
  try {
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);

    // [FIX FASE 12.2] Mengganti 'startsAt' (field lama V1)
    // dengan 'tournamentStartsAt' (field baru V2.1)
    // const q = tournamentsRef.orderBy('startsAt', 'desc'); // <-- INI BUG-NYA
    const q = tournamentsRef.orderBy('tournamentStartsAt', 'desc'); // <-- INI PERBAIKANNYA

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
 * @param data - Objek data turnamen (tanpa metadata yang di-set server)
 * @returns ID dokumen baru yang telah dibuat.
 */
export const createTournamentAdmin = async (
  // [PERBAIKAN FASE 11.2] Tipe Omit diubah.
  // Kita HAPUS 'status' dari Omit,
  // karena API route ('route.ts') SEKARANG yang mengirim 'status'.
  data: Omit<Tournament, 'id' | 'createdAt' | 'participantCountCurrent'>,
): Promise<string> => {
  try {
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);

    // Tambahkan metadata sisi server
    // [PERBAIKAN FASE 11.2] Hapus 'status' yang di-hardcode
    const newTournamentData = {
      ...data, // 'data' SEKARANG SUDAH MENGANDUNG 'status' yang benar dari route.ts
      createdAt: new Date(), // [FIX] Diubah dari Timestamp.now() ke new Date()
      participantCountCurrent: 0, // [FIX] Counter baru
      // status: 'registration_open', // <-- INI BUG-NYA (Fase 11.2), KITA HAPUS
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

// --- [ROMBAK V2: Fase 1 Peta Develop] ---
/**
 * @function registerTeamForTournamentAdmin
 * Mendaftarkan tim ke turnamen menggunakan Transaksi Firestore.
 * Fungsi ini:
 * 1. Mengecek apakah turnamen ada.
 * 2. Mengecek apakah turnamen sudah penuh (berdasarkan participantCountCurrent vs participantCount).
 * 3. Menambahkan dokumen tim baru ke sub-koleksi 'teams'.
 * 4. Menambah 'participantCountCurrent' di dokumen turnamen utama.
 *
 * @param tournamentId ID turnamen.
 * @param teamData Data tim yang mendaftar (sesuai Tipe TournamentTeam, tanpa server-set fields).
 * @param sessionUser Info user yang mendaftarkan (untuk leaderUid).
 * @returns {Promise<{ success: true, teamId: string }>} Jika berhasil, mengembalikan ID tim baru.
 * @throws {Error} Jika validasi gagal (misal: penuh).
 */
export const registerTeamForTournamentAdmin = async (
  tournamentId: string,
  // [ROMBAK V2] Menerima data tim baru, bukan participantId lama
  teamData: Omit<
    TournamentTeam,
    'id' | 'registeredAt' | 'status' | 'leaderUid'
  >,
  sessionUser: { uid: string; displayName: string },
): Promise<{ success: true; teamId: string }> => {
  const tournamentRef = adminFirestore
    .collection(COLLECTIONS.TOURNAMENTS)
    .doc(tournamentId);

  // [ROMBAK V2] Referensi ke sub-koleksi 'teams' dengan ID dokumen baru (auto-generated)
  const newTeamRef = tournamentRef.collection('teams').doc();

  try {
    const newTeamId = newTeamRef.id;
    await adminFirestore.runTransaction(async (t) => {
      // 1. Baca data turnamen
      const tournamentSnap = await t.get(tournamentRef);
      if (!tournamentSnap.exists) {
        throw new Error('Turnamen tidak ditemukan.');
      }
      const tournamentData = tournamentSnap.data() as Tournament;

      // 2. Cek kuota
      // [FIX] Membandingkan counter 'participantCountCurrent' dengan limit 'participantCount'
      if (
        tournamentData.participantCountCurrent >= tournamentData.participantCount
      ) {
        throw new Error('Pendaftaran turnamen sudah penuh.');
      }

      // 3. Cek validasi lain (seperti "player already registered")
      // dipindahkan ke API Route (Fase 3 Peta Develop) agar logic-nya terpusat.
      // Fungsi ini hanya fokus pada transaksi database atomik.

      // 4. Siapkan data pendaftar baru
      const newTeam: Omit<TournamentTeam, 'id'> = {
        ...teamData,
        leaderUid: sessionUser.uid,
        status: 'pending', // [FIX] Status default adalah 'pending'
        registeredAt: new Date(), // [FIX] Diubah dari Timestamp.now() ke new Date()
      };

      // 5. Tulis pendaftar baru
      t.set(newTeamRef, cleanDataForAdminSDK(newTeam));

      // 6. Update counter di turnamen utama
      t.update(tournamentRef, {
        participantCountCurrent: FieldValue.increment(1), // [FIX] Update counter baru
      });
    });

    console.log(
      `[Tournament - Admin] Tim ${newTeamId} berhasil terdaftar di ${tournamentId}.`,
    );
    return { success: true, teamId: newTeamId };
  } catch (error: any) {
    console.error(
      `Firestore Error [registerTeamForTournamentAdmin - Admin(${tournamentId})]:`,
      error.message,
    );
    // Lempar ulang error agar bisa ditangkap oleh API Route
    throw error;
  }
};
// --- [AKHIR ROMBAK V2] ---

// --- [ROMBAK V2: Fase 1 Peta Develop] ---
/**
 * @function getParticipantsForTournamentAdmin
 * Mengambil semua dokumen peserta (tim) yang terdaftar di turnamen.
 * @param tournamentId ID turnamen.
 * @returns {Promise<FirestoreDocument<TournamentTeam>[]>} Array data tim.
 */
export const getParticipantsForTournamentAdmin = async (
  tournamentId: string,
): Promise<FirestoreDocument<TournamentTeam>[]> => {
  try {
    // [FIX] Mengambil dari sub-koleksi 'teams'
    const participantsRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('teams'); // <-- [FIX] Sesuai Peta Develop

    // Urutkan berdasarkan tanggal daftar, yang paling dulu daftar muncul di atas
    const q = participantsRef.orderBy('registeredAt', 'asc');

    const snapshot = await q.get();

    // [FIX] Menggunakan tipe data TournamentTeam
    return snapshot.docs
      .map((doc) => docToDataAdmin<TournamentTeam>(doc))
      .filter(Boolean) as FirestoreDocument<TournamentTeam>[];
  } catch (error) {
    console.error(
      `Firestore Error [getParticipantsForTournamentAdmin - Admin(${tournamentId})]:`,
      // [FIX TYPO] Huruf 'i' yang nyasar sudah dihapus dari baris di bawah
      error,
    );
    return []; // Kembalikan array kosong jika error
  }
};
// --- [AKHIR ROMBAK V2] ---