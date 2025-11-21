import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
// [PERBAIKAN] Gunakan clashub.types agar konsisten dengan modul lain
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import TournamentDetailClient from './TournamentDetailClient';

// --- Tipe untuk Props Halaman Dinamis ---
type TournamentPageProps = {
  params: { tournamentId: string };
};

// --- Konfigurasi Cache (ISR) ---
// Revalidate data setiap 60 detik
export const revalidate = 60;

// --- Fungsi generateMetadata (Server Component) ---
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

// --- Komponen Halaman Utama (Server Component) ---
const TournamentDetailPage = async ({ params }: TournamentPageProps) => {
  // 1. Ambil data turnamen dari Firestore (Admin SDK)
  // Casting ke tipe yang benar jika perlu, atau biarkan inferensi
  const tournamentData = await getTournamentByIdAdmin(params.tournamentId);

  // 2. Handle 404
  if (!tournamentData) {
    notFound();
  }

  // 3. Serialisasi Data untuk Client Component
  // Firestore Timestamp tidak bisa langsung dikirim ke Client Component.
  // Kita parse(stringify) untuk mengubahnya menjadi string/JSON plain object.
  const serializedTournament = JSON.parse(JSON.stringify(tournamentData)) as FirestoreDocument<Tournament>;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* Render Client Component dengan data yang sudah aman */}
      <TournamentDetailClient tournament={serializedTournament} />
    </main>
  );
};

export default TournamentDetailPage;