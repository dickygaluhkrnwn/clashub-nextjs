// File: app/clan-hub/page.tsx
import TeamHubClient from './TeamHubClient';
import { getPlayers, getPublicClansForHub } from '@/lib/firestore';
import { getManagedClansAdmin } from '@/lib/firestore-admin/clans';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import {
  Player,
  PublicClanIndex,
  RecommendedTeam,
} from '@/lib/clashub.types';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clashub | Hub Tim & Pencarian Klan',
  description:
    'Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.',
};

// Paksa dynamic rendering karena data bergantung pada update Firestore realtime/sering
export const dynamic = 'force-dynamic';

const ClanHubPage = async () => {
  let initialClans: RecommendedTeam[] = [];
  let initialPlayers: Player[] = [];
  let initialPublicClans: PublicClanIndex[] = [];
  let loadError: string | null = null;

  try {
    const [clans, players, publicClans] = await Promise.all([
      getManagedClansAdmin(),
      getPlayers(),
      getPublicClansForHub(),
    ]);

    // Menghitung rating rata-rata (Server-Side Logic)
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

    initialClans = clansWithRating;
    initialPlayers = players;
    initialPublicClans = publicClans;

  } catch (err) {
    console.error('Error fetching data on server:', err);
    loadError = 'Gagal memuat daftar hub klan. Silakan coba lagi.';
  }

  if (loadError) {
    return (
      <main className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto border border-coc-red/30">
            <h1 className="text-2xl md:text-3xl text-coc-red font-clash mb-4">
              Kesalahan Server
            </h1>
            <h2 className="text-lg md:text-xl text-gray-300">{loadError}</h2>
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
    <main className="min-h-screen bg-coc-dark pb-20">
      <TeamHubClient
        initialClans={initialClans}
        initialPlayers={initialPlayers}
        initialPublicClans={initialPublicClans}
      />
    </main>
  );
};

export default ClanHubPage;