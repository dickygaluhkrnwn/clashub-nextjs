// File: lib/firestore-admin/tournaments.ts
// Deskripsi: Berisi fungsi utilitas Firestore Admin SDK terkait koleksi 'tournaments'.

import { adminFirestore } from '../firebase-admin';
import { COLLECTIONS } from '../firestore-collections';
// Impor tipe data Tournament yang baru kita buat, melalui barrel file 'types'
import { Tournament, FirestoreDocument } from '../types';
// Impor utilitas konversi data
import { docToDataAdmin, cleanDataForAdminSDK } from './utils';
import { Timestamp } from 'firebase-admin/firestore';

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