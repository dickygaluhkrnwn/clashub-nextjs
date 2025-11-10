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
  where as clientWhere,
  or as clientOr, // 'or' tidak kita gunakan lagi untuk getManagedTournaments, tapi biarkan impornya
  limit as clientLimit,
} from 'firebase/firestore';
import { COLLECTIONS } from '../firestore-collections';
import { Tournament, FirestoreDocument, TournamentTeam } from '../types';

// Converter untuk Tipe Tournament
const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore(tournament: Tournament): DocumentData {
    return tournament;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): Tournament {
    const data = snapshot.data(options)!;
    return {
      ...data,
      startsAt: (data.startsAt as ClientTimestamp).toDate(),
      endsAt: (data.endsAt as ClientTimestamp).toDate(),
      createdAt: (data.createdAt as ClientTimestamp).toDate(),
    } as Tournament;
  },
};

// Converter untuk Tipe TournamentTeam (Client-side)
const teamConverter: FirestoreDataConverter<TournamentTeam> = {
  toFirestore(team: TournamentTeam): DocumentData {
    return team;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): TournamentTeam {
    const data = snapshot.data(options)!;
    return {
      ...data,
      registeredAt: (data.registeredAt as ClientTimestamp).toDate(),
    } as TournamentTeam;
  },
};

/**
 * @function getAllTournamentsClient
 * Mengambil semua turnamen dari sisi client.
 */
export const getAllTournamentsClient = async (): Promise<
  FirestoreDocument<Tournament>[]
> => {
  try {
    const tournamentsRef = clientCollection(
      firestore,
      COLLECTIONS.TOURNAMENTS,
    ).withConverter(tournamentConverter);

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
 * Mengambil satu dokumen turnamen berdasarkan ID-nya dari sisi client.
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

// =================================================================
// [PERBAIKAN V2.2 - (HEADER FIX)]
// Fungsi client-side untuk memeriksa apakah user adalah manajer.
// =================================================================
/**
 * @function getManagedTournamentsForUserClient
 * [FIX V2.2] Mengambil turnamen di mana user adalah 'organizer' ATAU 'committee'.
 * Menggunakan dua query terpisah untuk menghindari kegagalan index composite 'OR'.
 * @param userId UID pengguna yang sedang login.
 */
export const getManagedTournamentsForUserClient = async (
  userId: string,
): Promise<FirestoreDocument<Tournament>[]> => {
  if (!userId) {
    return [];
  }

  try {
    const tournamentsRef = clientCollection(
      firestore,
      COLLECTIONS.TOURNAMENTS,
    ).withConverter(tournamentConverter);

    // [FIX V2.2] Ganti query 'OR' yang butuh index composite
    // dengan dua query terpisah yang lebih aman.
    // Ini akan mengambil *semua* turnamen yang di-manage.

    // Query 1: Cek apakah user adalah Organizer
    const organizerQuery = clientQuery(
      tournamentsRef,
      clientWhere('organizerUid', '==', userId),
    );

    // Query 2: Cek apakah user adalah Committee
    const committeeQuery = clientQuery(
      tournamentsRef,
      clientWhere('committeeUids', 'array-contains', userId),
    );

    // Jalankan kedua query secara paralel
    const [organizerSnapshot, committeeSnapshot] = await Promise.all([
      clientGetDocs(organizerQuery),
      clientGetDocs(committeeQuery),
    ]);

    // Gabungkan hasil dan hapus duplikat (jika user adalah organizer DAN committee)
    const managedTournaments = new Map<string, FirestoreDocument<Tournament>>();

    organizerSnapshot.docs.forEach((doc) => {
      managedTournaments.set(doc.id, {
        ...doc.data(),
        id: doc.id,
      } as FirestoreDocument<Tournament>);
    });

    committeeSnapshot.docs.forEach((doc) => {
      // Set akan otomatis menimpa/menambah jika key (doc.id) sudah ada
      managedTournaments.set(doc.id, {
        ...doc.data(),
        id: doc.id,
      } as FirestoreDocument<Tournament>);
    });

    // Konversi Map kembali ke array dan urutkan
    const combinedList = Array.from(managedTournaments.values());

    combinedList.sort((a, b) => {
      // Urutkan berdasarkan startsAt (Timestamp/Date), terbaru dulu (descending)
      // Gunakan getTime() untuk perbandingan yang aman
      return b.startsAt.getTime() - a.startsAt.getTime();
    });

    return combinedList;
  } catch (error) {
    console.error(
      `Firestore Error [getManagedTournamentsForUserClient - Client]:`,
      error,
    );
    // Jika ada error lain (misal: permission), kembalikan array kosong
    return [];
  }
};

/**
 * @function getRegisteredTournamentsForUserClient
 * [BARU: Fase 2] Mengambil turnamen di mana user adalah 'leader' dari tim yang terdaftar.
 * Digunakan di halaman /my-tournaments (Fase 4).
 * @param userId UID pengguna yang sedang login.
 */
export const getRegisteredTournamentsForUserClient = async (
  userId: string,
): Promise<FirestoreDocument<TournamentTeam>[]> => {
  if (!userId) {
    return [];
  }

  try {
    // [EDIT] Berdasarkan bug Fase 1, kita tahu data ada di `tournaments/{id}/teams`.
    // Query CollectionGroup adalah cara yang tepat.
    const groupRef = clientCollection(
      firestore,
      'teams', // Ini adalah nama sub-koleksi (Collection Group ID)
    ).withConverter(teamConverter);

    const q = clientQuery(
      groupRef,
      clientWhere('leaderUid', '==', userId),
      clientOrderBy('registeredAt', 'desc'),
    );

    const snapshot = await clientGetDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({ ...doc.data(), id: doc.id } as FirestoreDocument<TournamentTeam>),
    );
  } catch (error) {
    console.error(
      `Firestore Error [getRegisteredTournamentsForUserClient - Client]:`,
      error,
    );
    // Ini kemungkinan besar akan gagal jika index 'collectionGroup' (teams) belum dibuat.
    // Index: collection: 'teams', field: 'leaderUid ASC, registeredAt DESC'
    return [];
  }
};