// File: app/tournament/[tournamentId]/page.tsx
// Deskripsi: Halaman Server Component untuk menampilkan detail satu turnamen.
// (Sesuai Peta Pengembangan - Tahap 4, Poin 1)

import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import {
  getTournamentByIdAdmin,
} from '@/lib/firestore-admin/tournaments';
import { Tournament, FirestoreDocument } from '@/lib/types';
// import TournamentDetailClient from './TournamentDetailClient'; // <-- Akan kita buat di langkah selanjutnya

// --- [BARU] Tipe untuk Props Halaman Dinamis ---
type TournamentPageProps = {
  params: { tournamentId: string };
};

// --- [BARU] Fungsi generateMetadata (Server Component) ---
// Ini akan mengambil data turnamen dan mengatur judul <head> HTML
export async function generateMetadata(
  { params }: TournamentPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const tournamentId = params.tournamentId;
  const tournament = await getTournamentByIdAdmin(tournamentId);

  if (!tournament) {
    // Jika tidak ditemukan, kita tidak set metadata khusus
    return {
      title: 'Clashub | Turnamen Tidak Ditemukan',
    };
  }

  // Jika ditemukan, set judul halaman secara dinamis
  return {
    title: `Clashub | ${tournament.title}`,
    description: `Lihat detail, aturan, dan daftar peserta untuk ${tournament.title}.`,
    // TODO: Kita bisa tambahkan openGraph image menggunakan tournament.bannerUrl di sini
    // openGraph: {
    //   images: [tournament.bannerUrl],
    // },
  };
}

// --- [BARU] Komponen Halaman (Server Component) ---
/**
 * @component TournamentDetailPage
 * Server Component yang mengambil data turnamen (by ID) dan memberikannya
 * ke Client Component untuk di-render.
 */
const TournamentDetailPage = async ({ params }: TournamentPageProps) => {
  // 1. Ambil data turnamen dari Firestore menggunakan Admin SDK
  const tournament = await getTournamentByIdAdmin(params.tournamentId);

  // 2. Handle jika Turnamen tidak ditemukan (404)
  if (!tournament) {
    notFound(); // Ini akan menampilkan halaman 404.tsx dari Next.js
  }

  // 3. Render Komponen Klien (yang akan kita buat selanjutnya)
  // dan berikan data turnamen sebagai props.
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* [Placeholder] 
        Komponen Klien <TournamentDetailClient /> akan kita buat 
        di langkah selanjutnya (Tahap 4, Poin 2) untuk menampilkan data ini.
      */}
      {/* <TournamentDetailClient tournament={tournament} /> */}

      {/* Placeholder sementara sampai kita buat Client Component */}
      <div className="rounded-lg border border-dashed border-yellow-500 bg-yellow-50 p-8 text-center dark:bg-yellow-900/20">
        <p className="font-semibold text-yellow-700 dark:text-yellow-300">
          [Placeholder] UI untuk `TournamentDetailClient.tsx` akan
          muncul di sini.
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Berhasil memuat data untuk: {tournament.title} (ID:{' '}
          {tournament.id})
        </p>
      </div>
    </main>
  );
};

export default TournamentDetailPage;