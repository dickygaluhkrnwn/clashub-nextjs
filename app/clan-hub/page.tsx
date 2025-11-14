// File: app/clan-hub/page.tsx
// PERBAIKAN 1: Mengganti import path dari "./TeamHubClient" menjadi "../clan-hub/TeamHubClient"
import TeamHubClient from './TeamHubClient';
// [PERBAIKAN] Mengganti getManagedClans (client) dengan getManagedClansAdmin (admin)
import { getPlayers, getPublicClansForHub } from '@/lib/firestore';
import { getManagedClansAdmin } from '@/lib/firestore-admin/clans'; // <-- [PERBAIKAN] Impor admin
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews'; // <-- [BARU] Impor ulasan admin
// [PERBAIKAN] Menggunakan tipe data ManagedClan dan PublicClanIndex yang baru, DAN RecommendedTeam
import {
  ManagedClan,
  Player,
  PublicClanIndex,
  RecommendedTeam, // <-- [BARU] Impor tipe yang diperkaya
  FirestoreDocument,
} from '@/lib/types';
import { Metadata } from 'next';

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
  title: 'Clashub | Hub Tim & Pencarian Klan',
  description:
    'Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.',
};

// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
// FIX: Ganti nama komponen menjadi ClanHubPage untuk konsistensi
const ClanHubPage = async () => {
  // [PERBAIKAN] Inisialisasi array untuk Klan Publik dan ubah initialClans
  let initialClans: RecommendedTeam[] = []; // <-- [PERBAIKAN] Gunakan tipe RecommendedTeam
  let initialPlayers: Player[] = [];
  let initialPublicClans: PublicClanIndex[] = []; // BARU: Menampung cache klan publik
  let loadError: string | null = null;

  // Menggunakan Promise.all untuk mengambil semua data secara paralel
  try {
    // [PERBAIKAN KRITIS] Mengganti getManagedClans() dengan getManagedClansAdmin()
    const [clans, players, publicClans] = await Promise.all([
      getManagedClansAdmin(), // <-- [PERBAIKAN] Mengambil ManagedClan (Admin SDK)
      getPlayers(), // Mengambil daftar Player
      getPublicClansForHub(), // MENGAMBIL SEMUA KLAN PUBLIK (ARRAY)
    ]);

    // [BARU] Hitung averageRating untuk setiap klan (ManagedClan)
    const clansWithRating: RecommendedTeam[] = await Promise.all(
      clans.map(async (clan) => {
        const reviews = await getClanReviewsAdmin(clan.id);
        let averageRating = 0;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce(
            (acc, review) => acc + review.rating,
            0,
          );
          averageRating = totalRating / reviews.length;
        }
        return {
          ...clan,
          averageRating: averageRating,
        };
      }),
    );

    // [PERBAIKAN] Menyimpan hasil yang sudah diperkaya ke initialClans
    initialClans = clansWithRating; // <-- [PERBAIKAN] Simpan data dengan rating
    initialPlayers = players;
    initialPublicClans = publicClans;
  } catch (err) {
    console.error('Error fetching data on server:', err);
    loadError = 'Gagal memuat daftar hub klan. Silakan coba lagi.';
  }

  // Jika ada error fatal, tampilkan pesan error yang di-render oleh server
  if (loadError) {
    return (
      // PENYESUAIAN UI: Menghapus container/padding dari sini
      <main className="mt-10">
        {/* Menambahkan wrapper layout standar di dalam pesan error */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
            {/* Menggunakan font-clash untuk judul error */}
            <h1 className="text-3xl text-coc-red font-clash mb-4">
              Kesalahan Server
            </h1>
            <h2 className="text-xl text-gray-300">{loadError}</h2>
            <p className="text-sm text-gray-500 mt-4">
              Data tim dan pemain tidak dapat dimuat saat ini. Coba lagi dalam
              beberapa saat.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Meneruskan SEMUA data yang sudah di-fetch ke Client Component
  // [PERBAIKAN] Mengirim initialClans (sekarang RecommendedTeam[])
  return (
    // PENYESUAIAN UI: Menghapus container/padding dari sini dan memindahkannya ke Client Component
    <main className="mt-10">
      <TeamHubClient
        initialClans={initialClans} // <-- [PERBAIKAN] Data sekarang berisi rating
        initialPlayers={initialPlayers}
        initialPublicClans={initialPublicClans} // BARU: Data untuk tab Pencarian Klan Publik
      />
    </main>
  );
};

export default ClanHubPage;