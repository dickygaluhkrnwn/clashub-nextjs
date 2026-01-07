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
import { AlertTriangleIcon, RefreshCwIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Clashub | Team Hub & Recruitment',
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
    loadError = 'Gagal memuat data Team Hub. Silakan coba lagi.';
  }

  if (loadError) {
    return (
      <main className="min-h-screen pt-32 pb-10 flex items-center justify-center bg-[#0a0a0b] relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-red/10 via-transparent to-transparent pointer-events-none z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center py-16 p-8 max-w-lg mx-auto rounded-3xl bg-[#15171e] border border-red-500/30 backdrop-blur-md shadow-2xl">
            <div className="inline-flex p-5 rounded-full bg-red-500/10 border border-red-500/20 mb-6 animate-pulse-slow">
               <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
            </div>
            <h1 className="text-3xl md:text-4xl text-white font-clash mb-3 tracking-wide uppercase">
              System Error
            </h1>
            <p className="text-red-400 font-medium mb-6 font-mono text-sm border-y border-red-500/10 py-2">
               {loadError}
            </p>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Jalur komunikasi ke markas terganggu. Data tim dan pemain tidak dapat dimuat saat ini.
            </p>
            <Button href="/" variant="secondary" className="border-white/10 hover:bg-white/5">
               Kembali ke Home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0b] pb-20 selection:bg-coc-gold/30">
      <TeamHubClient
        initialClans={initialClans}
        initialPlayers={initialPlayers}
        initialPublicClans={initialPublicClans}
      />
    </main>
  );
};

export default ClanHubPage;