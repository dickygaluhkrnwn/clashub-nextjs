// File: app/tournament/[tournamentId]/register/page.tsx
// Deskripsi: Halaman server-side untuk mendaftar turnamen.
// Halaman ini mengambil data turnamen, user, dan tim e-sports yang dimiliki user.

import { redirect } from 'next/navigation';
// [FIX-Error 1 & 3] Menggunakan getSessionUser kustom, bukan next-auth
import { getSessionUser } from '@/lib/server-auth';
// [FIX-Error 2] Menggunakan adminFirestore sesuai file lib/firebase-admin.ts
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  UserProfile,
  ManagedClan,
  EsportsTeam,
} from '@/lib/clashub.types';
// [FIX-Error 4] Mengimpor DocumentData untuk type hint
import { DocumentData } from 'firebase-admin/firestore';
// Kita akan membuat komponen client ini di langkah berikutnya
// import TournamentRegisterClient from './TournamentRegisterClient';

/**
 * Mengambil data turnamen spesifik dari Firestore.
 * @param tournamentId ID turnamen yang akan diambil.
 * @returns Data turnamen atau null jika tidak ditemukan.
 */
async function getTournamentData(
  tournamentId: string,
): Promise<Tournament | null> {
  // [FIX-Error 2] Menggunakan adminFirestore
  const tournamentRef = adminFirestore
    .collection(COLLECTIONS.TOURNAMENTS)
    .doc(tournamentId);
  const tournamentSnap = await tournamentRef.get();

  if (!tournamentSnap.exists) {
    return null;
  }

  return { id: tournamentSnap.id, ...tournamentSnap.data() } as Tournament;
}

/**
 * Mengambil data profil user dari Firestore.
 * @param userId ID user yang akan diambil.
 * @returns Data UserProfile atau null jika tidak ditemukan.
 */
async function getUserData(userId: string): Promise<UserProfile | null> {
  // [FIX-Error 2] Menggunakan adminFirestore
  const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return null;
  }
  return userSnap.data() as UserProfile;
}

/**
 * Mengambil data klan yang dikelola dari Firestore.
 * @param clanId ID klan yang akan diambil.
 * @returns Data ManagedClan atau null jika tidak ditemukan.
 */
async function getManagedClanData(clanId: string): Promise<ManagedClan | null> {
  // [FIX-Error 2] Menggunakan adminFirestore
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
 * @param clanId ID klan yang tim-nya akan diambil.
 * @returns Array dari EsportsTeam.
 */
async function getEsportsTeams(clanId: string): Promise<EsportsTeam[]> {
  // [FIX-Error 2] Menggunakan adminFirestore
  const teamsRef = adminFirestore
    .collection(COLLECTIONS.MANAGED_CLANS)
    .doc(clanId)
    .collection(COLLECTIONS.ESPORTS_TEAMS);

  const teamsSnap = await teamsRef.get();

  if (teamsSnap.empty) {
    return [];
  }

  return teamsSnap.docs.map(
    // [FIX-Error 4] Menambahkan tipe DocumentData pada 'doc'
    (doc: DocumentData) => ({ id: doc.id, ...doc.data() } as EsportsTeam),
  );
}

/**
 * Halaman Pendaftaran Turnamen (Server Component)
 * Menangani pengambilan data dan otentikasi.
 */
export default async function TournamentRegisterPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { tournamentId } = params;

  // 1. Cek sesi user
  // [FIX-Error 1 & 3] Menggunakan getSessionUser()
  const session = await getSessionUser();
  // [FIX-Error 3] Cek session.uid, bukan session.user.uid
  if (!session?.uid) {
    // Jika tidak login, redirect ke halaman auth dengan callback
    return redirect(`/auth?callbackUrl=/tournament/${tournamentId}/register`);
  }

  // [FIX-Error 3] Ambil uid langsung dari session
  const userId = session.uid;

  // 2. Fetch data turnamen
  const tournament = await getTournamentData(tournamentId);
  if (!tournament) {
    return (
      <div className="container mx-auto p-4 py-8 text-center">
        <h1 className="text-2xl font-bold clash-font">
          Turnamen Tidak Ditemukan
        </h1>
        <p className="text-gray-400">
          Turnamen yang Anda cari tidak ada atau telah dihapus.
        </p>
      </div>
    );
  }

  // 3. Fetch data user
  const userProfile = await getUserData(userId);
  if (!userProfile) {
    // Seharusnya tidak terjadi jika user login, tapi sebagai penjagaan
    console.error(
      `Gagal menemukan UserProfile untuk user yang terotentikasi: ${userId}`,
    );
    return redirect('/auth');
  }

  // 4. Fetch data klan dan tim e-sports user
  let managedClan: ManagedClan | null = null;
  let esportsTeams: EsportsTeam[] = [];

  if (userProfile.clanId) {
    // Cek apakah user tergabung dalam klan yang dikelola
    managedClan = await getManagedClanData(userProfile.clanId);
    if (managedClan) {
      // Jika ya, ambil daftar tim e-sports dari klan tersebut
      esportsTeams = await getEsportsTeams(managedClan.id);
    }
  }

  // TODO: Nanti kita fetch data registrasi yang sudah ada (jika diperlukan)

  // 5. Render komponen client dengan data yang sudah di-fetch
  return (
    <div className="container mx-auto max-w-4xl p-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 clash-font">
        Pendaftaran Turnamen
      </h1>
      <h2 className="text-xl text-center text-muted-foreground mb-8">
        {/* [FIX-Error 5] Menggunakan tournament.title, bukan tournament.name */}
        {tournament.title}
      </h2>

      {/* Komponen Client akan dirender di sini.
        Untuk saat ini, kita tampilkan data placeholder.
        Kita akan buat TournamentRegisterClient.tsx selanjutnya.
      */}

      {/* <TournamentRegisterClient 
        tournament={JSON.parse(JSON.stringify(tournament))}
        userProfile={JSON.parse(JSON.stringify(userProfile))}
        managedClan={managedClan ? JSON.parse(JSON.stringify(managedClan)) : null}
        esportsTeams={JSON.parse(JSON.stringify(esportsTeams))}
      /> */}

      {/* Placeholder sementara sampai TournamentRegisterClient dibuat */}
      <div className="bg-background-card p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 border-b border-gray-600 pb-2">
          Data Pendaftaran (Server-side)
        </h3>
        <p>
          <strong>Turnamen ID:</strong> {tournament.id}
        </p>
        <p>
          <strong>User ID:</strong> {userId}
        </p>
        <p>
          <strong>Klan Terkelola:</strong>{' '}
          {managedClan?.name || 'Anda tidak tergabung dalam klan terkelola.'}
        </p>
        <p>
          <strong>Tim E-Sports Ditemukan:</strong> {esportsTeams.length}
        </p>
        {esportsTeams.length > 0 && (
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {esportsTeams.map((team) => (
              <li key={team.id} className="text-sm">
                {team.teamName}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-yellow-400 text-sm">
          Logika UI untuk memilih tim akan diimplementasikan di file: <br />
          <code className="bg-gray-700 px-1 rounded">
            app/tournament/[tournamentId]/register/TournamentRegisterClient.tsx
          </code>
        </p>
      </div>
    </div>
  );
}