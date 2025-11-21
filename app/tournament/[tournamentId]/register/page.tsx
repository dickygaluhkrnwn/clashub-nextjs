// File: app/tournament/[tournamentId]/register/page.tsx
// Deskripsi: Halaman server-side untuk mendaftar turnamen.
// Fokus: Data Fetching & Auth Check. UI didelegasikan ke Client Component.

import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  UserProfile,
  ManagedClan,
  EsportsTeam,
} from '@/lib/clashub.types';
import { DocumentData } from 'firebase-admin/firestore';
import TournamentRegisterClient from './TournamentRegisterClient';

/**
 * Mengambil data turnamen spesifik dari Firestore.
 */
async function getTournamentData(
  tournamentId: string,
): Promise<Tournament | null> {
  const tournamentRef = adminFirestore
    .collection(COLLECTIONS.TOURNAMENTS)
    .doc(tournamentId);
  const tournamentSnap = await tournamentRef.get();

  if (!tournamentSnap.exists) {
    return null;
  }

  const data = tournamentSnap.data() as DocumentData;
  // Konversi Timestamp ke Date
  Object.keys(data).forEach((key) => {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = data[key].toDate();
    }
  });

  return { id: tournamentSnap.id, ...data } as Tournament;
}

/**
 * Mengambil data profil user dari Firestore.
 */
async function getUserData(userId: string): Promise<UserProfile | null> {
  const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return null;
  }
  return userSnap.data() as UserProfile;
}

/**
 * Mengambil data klan yang dikelola dari Firestore.
 */
async function getManagedClanData(clanId: string): Promise<ManagedClan | null> {
  const clanRef = adminFirestore
    .collection(COLLECTIONS.MANAGED_CLANS)
    .doc(clanId);
  const clanSnap = await clanRef.get();
  if (!clanSnap.exists) {
    return null;
  }
  return { id: clanSnap.id, ...clanSnap.data() } as ManagedClan;
}

/**
 * Mengambil semua tim e-sports yang terdaftar di bawah klan.
 */
async function getEsportsTeams(clanId: string): Promise<EsportsTeam[]> {
  const teamsRef = adminFirestore
    .collection(COLLECTIONS.MANAGED_CLANS)
    .doc(clanId)
    .collection(COLLECTIONS.ESPORTS_TEAMS);

  const teamsSnap = await teamsRef.get();

  if (teamsSnap.empty) {
    return [];
  }

  return teamsSnap.docs.map(
    (doc: DocumentData) => ({ id: doc.id, ...doc.data() } as EsportsTeam),
  );
}

/**
 * Halaman Utama Pendaftaran (Server Component)
 */
export default async function TournamentRegisterPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { tournamentId } = params;

  // 1. Cek sesi user (Server-side Auth)
  const session = await getSessionUser();
  
  if (!session?.uid) {
    // Redirect ke login jika belum login
    return redirect(`/auth?callbackUrl=/tournament/${tournamentId}/register`);
  }

  const userId = session.uid;

  // 2. Fetch data turnamen
  const tournament = await getTournamentData(tournamentId);
  
  if (!tournament) {
    // Gunakan notFound() Next.js agar menampilkan halaman 404 standar
    notFound();
  }

  // 3. Fetch data user profile untuk validasi server-side
  const userProfile = await getUserData(userId);
  
  if (!userProfile) {
    return redirect('/auth');
  }

  // 4. Fetch data klan (Validasi server-side opsional, bisa dihapus jika memberatkan)
  // Kita biarkan fetch ini berjalan untuk memastikan user punya klan sebelum masuk halaman
  if (userProfile.clanId) {
    await getManagedClanData(userProfile.clanId);
    // Kita tidak perlu mengirim data ini ke client lagi, karena client pakai hook
  }

  // 5. Render Client Component
  // [PERBAIKAN] Hanya kirim 'tournament'. Props lain dihapus karena Client Component
  // sudah mengambilnya sendiri via hooks (useAuth, useManagedClanCache).
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8">
      <TournamentRegisterClient
        tournament={JSON.parse(JSON.stringify(tournament))}
      />
    </div>
  );
}