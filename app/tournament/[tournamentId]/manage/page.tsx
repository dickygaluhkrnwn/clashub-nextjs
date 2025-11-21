import React from 'react'; 
import { redirect } from 'next/navigation';
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
    redirect('/auth'); // Wajib login
  }

  // 2. Ambil Data Turnamen
  const tournamentData = await getTournamentByIdAdmin(tournamentId);
  
  // Serialisasi data untuk Client Component (menghindari warning date object)
  const tournament = tournamentData ? JSON.parse(JSON.stringify(tournamentData)) as FirestoreDocument<Tournament> : null;

  // 3. Cek Keberadaan Data
  if (!tournament) {
    // Kirim state error 'not_found' ke client
    return <ManageTournamentClient error="not_found" />;
  }

  // 4. Validasi Keamanan
  // Hanya bisa diakses oleh organizerUid ATAU committeeUids
  const isOrganizer = tournament.organizerUid === sessionUser.uid;
  const isCommittee = tournament.committeeUids?.includes(sessionUser.uid) || false;

  if (!isOrganizer && !isCommittee) {
    // Kirim state error 'access_denied' ke client
    return <ManageTournamentClient error="access_denied" />;
  }

  // 5. Render Client Component (Sukses)
  return (
    <ManageTournamentClient tournament={tournament} isOrganizer={isOrganizer} />
  );
}