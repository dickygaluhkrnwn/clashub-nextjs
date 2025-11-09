// File: lib/firestore/tournaments.ts
// Deskripsi: Berisi fungsi utilitas Firestore Client SDK yang spesifik untuk 'tournaments'.

import { firestore } from '../firebase'; // Client SDK instance
import {
  collection as clientCollection,
  doc as clientDoc,
  getDoc as clientGetDoc,
  getDocs as clientGetDocs,
  query as clientQuery,
  orderBy as clientOrderBy,
  Timestamp as ClientTimestamp,
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { COLLECTIONS } from '../firestore-collections';
// [ROMBAK V2] Impor Tipe Baru (Tournament) dan helper FirestoreDocument
import { Tournament, FirestoreDocument } from '../types';

// [ROMBAK V2] Buat Firestore Converter untuk Tipe Tournament
// Ini akan otomatis mengonversi Timestamp (Firestore) menjadi Date (JavaScript) saat membaca data
const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore(tournament: Tournament): DocumentData {
    // Kita tidak akan menulis dari client, jadi ini bisa dikosongkan
    // Pengecualian: Kita mungkin perlu fungsi update, tapi kita buat nanti
    return tournament;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): Tournament {
    const data = snapshot.data(options)!;
    // Konversi semua Timestamp server menjadi objek Date di client
    return {
      ...data,
      startsAt: (data.startsAt as ClientTimestamp).toDate(),
      endsAt: (data.endsAt as ClientTimestamp).toDate(),
      createdAt: (data.createdAt as ClientTimestamp).toDate(),
    } as Tournament;
  },
};

/**
 * @function getAllTournamentsClient
 * [BARU: Fase 1] Mengambil semua turnamen dari sisi client.
 * Digunakan di halaman utama /tournament (Fase 2 Peta Develop).
 */
export const getAllTournamentsClient = async (): Promise<
  FirestoreDocument<Tournament>[]
> => {
  try {
    const tournamentsRef = clientCollection(
      firestore,
      COLLECTIONS.TOURNAMENTS,
    ).withConverter(tournamentConverter);

    // [ROMBAK V2] Urutkan berdasarkan 'startsAt' (Timestamp) baru
    const q = clientQuery(tournamentsRef, clientOrderBy('startsAt', 'desc'));
    const snapshot = await clientGetDocs(q);

    return snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as FirestoreDocument<Tournament>),
    );
  } catch (error) {
    console.error(`Firestore Error [getAllTournamentsClient - Client]:`, error);
    return [];
  }
};

/**
 * @function getTournamentClient
 * [BARU: Fase 1] Mengambil satu dokumen turnamen berdasarkan ID-nya dari sisi client.
 * Digunakan di halaman detail /tournament/[id] (Fase 3 Peta Develop).
 */
export const getTournamentClient = async (
  tournamentId: string,
): Promise<FirestoreDocument<Tournament> | null> => {
  try {
    const docRef = clientDoc(
      firestore,
      COLLECTIONS.TOURNAMENTS,
      tournamentId,
    ).withConverter(tournamentConverter);

    const docSnap = await clientGetDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { ...docSnap.data(), id: docSnap.id } as FirestoreDocument<Tournament>;
  } catch (error) {
    console.error(
      `Firestore Error [getTournamentClient - Client(${tournamentId})]:`,
      error,
    );
    return null;
  }
};

// [DIHAPUS] Fungsi registerForTournamentClient dihapus
// Logic pendaftaran sekarang ditangani 100% oleh server-side API Route
// (Sesuai Peta Develop Fase 3, Step 2)