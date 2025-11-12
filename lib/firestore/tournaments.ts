// File: lib/firestore/tournaments.ts
// Deskripsi: Berisi fungsi utilitas Firestore Client SDK yang spesifik untuk 'tournaments'.
// [PERBAIKAN FASE 14.2] Memperbaiki converter dan query untuk V2.1 (4 field tanggal baru).

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
// [PERBAIKAN FASE 14.2] Impor tipe 'Tournament' yang sudah benar dari 'types'
import { Tournament, FirestoreDocument, TournamentTeam } from '../types';

// [PERBAIKAN FASE 14.2] Converter untuk Tipe Tournament diperbarui
const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore(tournament: Tournament): DocumentData {
    // Data yang dikirim KE firestore sudah di-handle oleh cleanDataForAdminSDK (new Date())
    // jadi di sisi client kita bisa biarkan ini
    return tournament;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): Tournament {
    const data = snapshot.data(options)!;
    // Logika ini sangat penting.
    // Kita harus konversi semua field Timestamp (dari Firestore)
    // kembali menjadi objek Date (untuk JavaScript di client).
    return {
      ...data,
      // Hapus 'startsAt' dan 'endsAt' yang sudah tidak ada
      // startsAt: (data.startsAt as ClientTimestamp).toDate(),
      // endsAt: (data.endsAt as ClientTimestamp).toDate(),

      // Tambahkan 4 field tanggal baru (dan createdAt)
      // Kita tambahkan pengecekan '&& data.fieldName.toDate'
      // untuk memastikan data tidak crash jika field-nya (karena suatu hal) null.
      createdAt: data.createdAt && (data.createdAt as ClientTimestamp).toDate(),
      registrationStartsAt:
        data.registrationStartsAt &&
        (data.registrationStartsAt as ClientTimestamp).toDate(),
      registrationEndsAt:
        data.registrationEndsAt &&
        (data.registrationEndsAt as ClientTimestamp).toDate(),
      tournamentStartsAt:
        data.tournamentStartsAt &&
        (data.tournamentStartsAt as ClientTimestamp).toDate(),
      tournamentEndsAt:
        data.tournamentEndsAt &&
        (data.tournamentEndsAt as ClientTimestamp).toDate(),
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

    // [PERBAIKAN FASE 14.2] Ganti 'startsAt' ke 'tournamentStartsAt'
    const q = clientQuery(
      tournamentsRef,
      clientOrderBy('tournamentStartsAt', 'desc'),
    );
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
 * [FIX FASE 14.2] Memperbaiki logika sorting.
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
      // [PERBAIKAN FASE 14.2]
      // Ganti 'startsAt' (error TS2339) dengan 'tournamentStartsAt'.
      // 'tournamentConverter' yang baru diperbaiki akan memastikan
      // 'tournamentStartsAt' adalah objek Date yang valid.
      return (
        b.tournamentStartsAt.getTime() - a.tournamentStartsAt.getTime()
      );
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