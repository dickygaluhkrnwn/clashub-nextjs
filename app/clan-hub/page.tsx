// File: app/clan-hub/page.tsx
import TeamHubClient from './TeamHubClient';
import { getPlayers, getPublicClansForHub } from '@/lib/firestore';
import {
  getManagedClansAdmin,
  getActivePromotions,
} from '@/lib/firestore-admin/clans';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import {
  Player,
  PublicClanIndex,
  RecommendedTeam,
  Promotion,
} from '@/lib/clashub.types';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clashub | Hub Tim & Pencarian Klan',
  description:
    'Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.',
};

const ClanHubPage = async () => {
  let initialClans: RecommendedTeam[] = [];
  let initialPlayers: Player[] = [];
  let initialPublicClans: PublicClanIndex[] = [];
  let promotions: Promotion[] = [];
  let loadError: string | null = null;

  try {
    // Mengambil data secara paralel
    // getManagedClansAdmin() di dalamnya sudah menggunakan 'docToDataAdmin'
    // dari utils.ts, sehingga Timestamp sudah dikonversi menjadi Date.
    // Next.js App Router BISA menerima object Date, jadi ini AMAN.
    const [clans, players, publicClans, activePromotions] = await Promise.all([
      getManagedClansAdmin(),
      getPlayers(),
      getPublicClansForHub(),
      getActivePromotions(),
    ]);

    // Menghitung rating rata-rata (Server-Side Logic)
    // Kita tetap mempertahankan logika ini agar rating muncul di UI
    const clansWithRating: RecommendedTeam[] = await Promise.all(
      clans.map(async (clan) => {
        try {
          const reviews = await getClanReviewsAdmin(clan.id);
          let averageRating = 0;
          if (reviews.length > 0) {
            const totalRating = reviews.reduce(
              (acc, review) => acc + review.rating,
              0
            );
            averageRating = totalRating / reviews.length;
          }
          return {
            ...clan,
            averageRating: averageRating,
          };
        } catch (e) {
          console.error(`Failed to fetch reviews for clan ${clan.id}`, e);
          return { ...clan, averageRating: 0 };
        }
      })
    );

    // Assign data langsung tanpa serialisasi manual
    initialClans = clansWithRating;
    initialPlayers = players;
    initialPublicClans = publicClans;
    promotions = activePromotions;

  } catch (err) {
    console.error('Error fetching data on server:', err);
    loadError = 'Gagal memuat daftar hub klan. Silakan coba lagi.';
  }

  if (loadError) {
    return (
      <main>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
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

  return (
    <main>
      <TeamHubClient
        initialClans={initialClans}
        initialPlayers={initialPlayers}
        initialPublicClans={initialPublicClans}
        promotions={promotions}
      />
    </main>
  );
};

export default ClanHubPage;