// File: app/tournament/[tournamentId]/manage/page.tsx
// Deskripsi: [FASE 5] Halaman "Control Room" untuk panitia.
// Server Component untuk validasi keamanan dan pengiriman data ke Client Component.

import React from 'react'; 
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { AlertTriangleIcon } from '@/app/components/icons';

// [PERBAIKAN] Impor Client Component yang baru
import ManageTournamentClient from './ManageTournamentClient';

// =========================================================================
// Server Component (Data Fetching & Validasi Keamanan)
// =========================================================================

// Komponen Error Sederhana
const ErrorDisplay = ({ message }: { message: string }) => (
  <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
    <div className="flex justify-center items-center">
      <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
        <h2 className="text-2xl text-coc-red font-clash mb-4">Akses Ditolak</h2>
        <p className="text-gray-300 mb-6 font-sans">{message}</p>
        <Button href="/my-tournaments" variant="primary">
          Kembali ke Hub
        </Button>
      </div>
    </div>
  </main>
);

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
  const tournament = await getTournamentByIdAdmin(tournamentId);
  if (!tournament) {
    return <ErrorDisplay message="Turnamen tidak ditemukan." />;
  }

  // 3. Validasi Keamanan (ROADMAP FASE 5)
  // Hanya bisa diakses oleh organizerUid ATAU committeeUids
  const isOrganizer = tournament.organizerUid === sessionUser.uid;
  const isCommittee = tournament.committeeUids.includes(sessionUser.uid);

  if (!isOrganizer && !isCommittee) {
    return (
      <ErrorDisplay message="Anda bukan panitia atau organizer turnamen ini." />
    );
  }

  // 4. Render Client Component dengan data turnamen
  return (
    <ManageTournamentClient tournament={tournament} isOrganizer={isOrganizer} />
  );
}