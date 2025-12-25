import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament, UserProfile, ManagedClan } from '@/lib/clashub.types';
import { DocumentData } from 'firebase-admin/firestore';
import TournamentRegisterClient from './TournamentRegisterClient';

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
  Object.keys(data).forEach((key) => {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = data[key].toDate();
    }
  });

  return { id: tournamentSnap.id, ...data } as Tournament;
}

async function getUserData(userId: string): Promise<UserProfile | null> {
  const userRef = adminFirestore.collection(COLLECTIONS.USERS).doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return null;
  }
  return userSnap.data() as UserProfile;
}

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

export default async function TournamentRegisterPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { tournamentId } = params;

  // 1. Cek Sesi
  const session = await getSessionUser();
  if (!session?.uid) {
    return redirect(`/auth?callbackUrl=/tournament/${tournamentId}/register`);
  }

  // 2. Fetch Data
  const tournament = await getTournamentData(tournamentId);
  if (!tournament) notFound();

  const userProfile = await getUserData(session.uid);
  if (!userProfile) return redirect('/auth');

  // Validasi Kepemilikan Klan (Opsional tapi bagus untuk pre-fetch)
  if (userProfile.clanId) {
    await getManagedClanData(userProfile.clanId);
  }

  // 3. Render Client
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8 mt-4 md:mt-8">
      <TournamentRegisterClient
        tournament={JSON.parse(JSON.stringify(tournament))}
      />
    </div>
  );
}