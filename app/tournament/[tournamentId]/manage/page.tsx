import React from 'react'; 
import { redirect, notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import ManageTournamentClient from './ManageTournamentClient';

export default async function ManageTournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { tournamentId } = params;

  // 1. Ambil Sesi User
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/auth?callbackUrl=/tournament/${tournamentId}/manage`);
  }

  // 2. Ambil Data Turnamen
  const tournamentData = await getTournamentByIdAdmin(tournamentId);
  
  if (!tournamentData) {
    notFound();
  }

  const tournament = JSON.parse(JSON.stringify(tournamentData)) as FirestoreDocument<Tournament>;

  // 3. Validasi Keamanan (Organizer / Committee)
  const isOrganizer = tournament.organizerUid === sessionUser.uid;
  const isCommittee = tournament.committeeUids?.includes(sessionUser.uid) || false;

  if (!isOrganizer && !isCommittee) {
    // Jika user bukan panitia, redirect atau tampilkan error state
    return <ManageTournamentClient error="access_denied" />;
  }

  // 4. Render Client Component
  return (
    <ManageTournamentClient tournament={tournament} isOrganizer={isOrganizer} />
  );
}