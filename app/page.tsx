import { Suspense } from 'react';
// [TEKNIS] Paksa rendering dinamis agar data (seperti profil user & war log) selalu fresh setiap kali halaman dibuka
export const dynamic = 'force-dynamic';

import HomeHeader from '@/app/components/home/HomeHeader';
import QuickLinks from '@/app/components/home/QuickLinks';
import RecommendedTeams from '@/app/components/home/RecommendedTeams';
import LatestStrategies from '@/app/components/home/LatestStrategies';
import HomeBanner from '@/app/components/home/HomeBanner';
// Import loader/skeleton untuk UX loading yang lebih halus
import { RecommendedTeamsLoading, LatestStrategiesLoading } from '@/app/components/home/HomeLoaders';

import { getRecentPostsAdmin } from '@/lib/firestore-admin/posts';
import { getActivePromotions } from '@/lib/firestore-admin/clans';

// Impor utilitas backend untuk data fetching yang efisien
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
import {
  getClanApiCacheAdmin,
  getManagedClanDataAdmin,
} from '@/lib/firestore-admin/clans';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import {
  FirestoreDocument,
  UserProfile,
  CocCurrentWar,
  ManagedClan,
} from '@/lib/types';

/**
 * Halaman Utama (Server Component)
 * Desain: Gaming Hub Dashboard.
 */
export default async function Home() {
  // [PERFORMA] Mengambil semua data independen secara paralel
  const [sessionUser, recentPosts, activePromotions] = await Promise.all([
    getSessionUser(),
    getRecentPostsAdmin(8), // Ambil 8 postingan terbaru untuk grid
    getActivePromotions(),  // Ambil promosi klan yang sedang aktif
  ]);

  // Inisialisasi variabel data opsional
  let userProfile: FirestoreDocument<UserProfile> | null = null;
  let currentWar: CocCurrentWar | null = null;
  let managedClan: FirestoreDocument<ManagedClan> | null = null;
  let averageRating: number = 0;

  // Logika pengambilan data personal (jika user login)
  if (sessionUser) {
    userProfile = await getUserProfileAdmin(sessionUser.uid);

    // Jika user mengelola klan, ambil data detail klan tersebut
    if (userProfile?.clanId) {
      const [clanData, clanCache, clanReviews] = await Promise.all([
        getManagedClanDataAdmin(userProfile.clanId),
        getClanApiCacheAdmin(userProfile.clanId),
        getClanReviewsAdmin(userProfile.clanId),
      ]);

      managedClan = clanData;

      if (clanCache && clanCache.currentWar) {
        currentWar = clanCache.currentWar;
      }

      // Hitung rating rata-rata klan
      const totalReviews = clanReviews.length;
      if (totalReviews > 0) {
        averageRating =
          clanReviews.reduce((acc, review) => acc + review.rating, 0) /
          totalReviews;
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0b] text-white selection:bg-coc-gold/30 overflow-x-hidden relative">
      
      {/* --- GLOBAL ATMOSPHERE & BACKGROUNDS --- */}
      {/* 1. Base Dark Texture (Noise/Grain Simulation) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* 2. Primary Spotlight (Top Center - Blue/Magical) */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-gradient-to-b from-[#1a2c4e] via-[#0f1520]/80 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* 3. Secondary Accent Glow (Top Right - Gold/Legendary) */}
      <div className="fixed top-[5%] right-[-5%] w-[400px] h-[400px] bg-coc-gold/5 blur-[150px] rounded-full pointer-events-none z-0" />

      
      {/* [HEADER SECTION] - Dashboard Personalisasi */}
      <div className="relative z-10 w-full border-b border-white/5 bg-[#0f1115]/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-8">
            <HomeHeader
                userProfile={userProfile}
                currentWar={currentWar}
                managedClan={managedClan}
                clanReputation={averageRating}
            />
        </div>
      </div>

      {/* [MAIN CONTENT] */}
      <main className="container mx-auto px-4 md:px-8 py-12 space-y-16 relative z-10">
        
        {/* 1. Quick Links (Menu Cepat - Gaming Grid) */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative">
             {/* Section Title removed from QuickLinks component itself to be cleaner here, handled inside QuickLinks if needed or just implicit */}
             <QuickLinks />
          </div>
        </section>

        {/* 2. Banner Promosi (Jika Ada) */}
        {activePromotions.length > 0 && (
           <section className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
             <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
                <HomeBanner promotions={activePromotions} />
             </div>
           </section>
        )}

        {/* 3. Rekomendasi Clan */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <Suspense fallback={<RecommendedTeamsLoading />}>
            <RecommendedTeams />
          </Suspense>
        </section>

        {/* 4. Strategi Terbaru */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 pb-8">
          <Suspense fallback={<LatestStrategiesLoading />}>
            <LatestStrategies posts={recentPosts} />
          </Suspense>
        </section>

      </main>
    </div>
  );
}