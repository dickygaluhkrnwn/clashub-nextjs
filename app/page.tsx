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
    <div className="flex flex-col min-h-screen">
      {/* [HEADER SECTION] */}
      <HomeHeader
        userProfile={userProfile}
        currentWar={currentWar}
        managedClan={managedClan}
        clanReputation={averageRating}
      />

      {/* [MAIN CONTENT]
        - pb-4 md:pb-8: Jarak ke footer dikurangi agar lebih rapat
        - -mt-6: Memberikan sedikit overlap ke atas untuk menyatukan desain
      */}
      <main className="container mx-auto px-4 md:px-8 pb-4 md:pb-8 space-y-8 md:space-y-10 -mt-6 relative z-10">
        
        {/* 1. Quick Links (Menu Cepat) */}
        <div className="bg-coc-stone-light/60 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/5 shadow-lg">
          <QuickLinks />
        </div>

        {/* 2. Banner Promosi (Jika Ada) */}
        {activePromotions.length > 0 && (
           <div className="w-full overflow-hidden rounded-2xl shadow-stone border border-coc-gold/20">
             <HomeBanner promotions={activePromotions} />
           </div>
        )}

        {/* 3. Rekomendasi Clan */}
        <Suspense fallback={<RecommendedTeamsLoading />}>
          <RecommendedTeams />
        </Suspense>

        {/* 4. Strategi Terbaru */}
        <Suspense fallback={<LatestStrategiesLoading />}>
          <LatestStrategies posts={recentPosts} />
        </Suspense>

      </main>
    </div>
  );
}