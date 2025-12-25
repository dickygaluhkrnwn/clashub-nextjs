import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import TournamentDetailClient from './TournamentDetailClient';

type TournamentPageProps = {
  params: { tournamentId: string };
};

// ISR Revalidation (60 detik)
export const revalidate = 60;

export async function generateMetadata(
  { params }: TournamentPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const tournamentId = params.tournamentId;
  const tournament = await getTournamentByIdAdmin(tournamentId);

  if (!tournament) {
    return {
      title: 'Clashub | Turnamen Tidak Ditemukan',
    };
  }

  return {
    title: `Clashub | ${tournament.title}`,
    description: `Lihat detail, aturan, dan daftar peserta untuk ${tournament.title}. Total Hadiah: ${tournament.prizePool}.`,
  };
}

const TournamentDetailPage = async ({ params }: TournamentPageProps) => {
  const tournamentData = await getTournamentByIdAdmin(params.tournamentId);

  if (!tournamentData) {
    notFound();
  }

  // Serialisasi Data (Penting untuk Client Component)
  const serializedTournament = JSON.parse(JSON.stringify(tournamentData)) as FirestoreDocument<Tournament>;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 mt-4 md:mt-8">
      <TournamentDetailClient tournament={serializedTournament} />
    </main>
  );
};

export default TournamentDetailPage;