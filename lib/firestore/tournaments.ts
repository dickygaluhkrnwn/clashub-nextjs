// File: lib/firestore/tournaments.ts
// Deskripsi: Berisi fungsi utilitas Firestore Client SDK yang spesifik untuk 'tournaments'.

import { firestore } from '../firebase'; // Client SDK instance
import {
  collection as clientCollection,
  addDoc as clientAddDoc,
  Timestamp as ClientTimestamp,
} from 'firebase/firestore';
import { COLLECTIONS } from '../firestore-collections';
import { TournamentParticipant, UserProfile } from '../types';

/**
 * @function registerForTournamentClient
 * Mendaftarkan sebuah tim (diwakili oleh user) ke turnamen.
 * Fungsi ini dipanggil dari client-side (misalnya: Tombol "Daftar" di halaman registrasi).
 *
 * @param tournamentId - ID dokumen turnamen yang dituju.
 * @param userProfile - Objek UserProfile dari pengguna yang sedang login (sebagai perwakilan).
 * @param clanInfo - Informasi dasar klan yang didaftarkan.
 */
export const registerForTournamentClient = async (
  tournamentId: string,
  userProfile: UserProfile,
  clanInfo: {
    tag: string;
    name: string;
    badgeUrl: string;
  },
): Promise<void> => {
  try {
    // Tentukan path ke sub-koleksi 'registrations' (sesuai firestore-collections.ts)
    const registrationsRef = clientCollection(
      firestore,
      `${COLLECTIONS.TOURNAMENTS}/${tournamentId}/${COLLECTIONS.REGISTRATIONS}`,
    );

    // Siapkan data pendaftar sesuai interface TournamentParticipant
    const newParticipantData: Omit<TournamentParticipant, 'id' | 'registeredAt'> & {
      registeredAt: ClientTimestamp;
    } = {
      clanTag: clanInfo.tag,
      clanName: clanInfo.name,
      clanBadgeUrl: clanInfo.badgeUrl,
      representativeId: userProfile.uid,
      representativeName: userProfile.displayName,
      status: 'PENDING', // Default status saat mendaftar
      registeredAt: ClientTimestamp.now(),
    };

    // Tambahkan dokumen baru ke sub-koleksi
    await clientAddDoc(registrationsRef, newParticipantData);

    console.log(
      `[Tournament - Client] User ${userProfile.uid} berhasil mendaftarkan klan ${clanInfo.tag} untuk turnamen ${tournamentId}.`,
    );
  } catch (error) {
    console.error(
      `Firestore Error [registerForTournamentClient - Client(${tournamentId})]:`,
      error,
    );
    throw new Error('Gagal mendaftar turnamen. Silakan coba lagi.');
  }
};