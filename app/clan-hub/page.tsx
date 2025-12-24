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
import { AlertTriangleIcon } from '@/app/components/icons';

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
      <main className="min-h-screen pt-32 pb-10 flex items-center justify-center bg-coc-dark">
        <div className="container mx-auto px-4">
          <div className="text-center py-12 p-6 max-w-lg mx-auto rounded-2xl bg-coc-red/10 border border-coc-red/30 backdrop-blur-md">
            <div className="inline-flex p-4 rounded-full bg-coc-red/20 mb-4">
               <AlertTriangleIcon className="h-8 w-8 text-coc-red" />
            </div>
            <h1 className="text-2xl md:text-3xl text-white font-clash mb-2 tracking-wide">
              Kesalahan Server
            </h1>
            <p className="text-coc-red/80 font-medium mb-4">{loadError}</p>
            <p className="text-sm text-gray-400">
              Data tim dan pemain tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.
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