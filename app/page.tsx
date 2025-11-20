import { Suspense } from 'react';
// [BARU] Paksa rendering dinamis untuk memastikan cookie selalu dibaca
export const dynamic = 'force-dynamic';

import HomeHeader from '@/app/components/home/HomeHeader';
import QuickLinks from '@/app/components/home/QuickLinks';
import RecommendedTeams from '@/app/components/home/RecommendedTeams';
import LatestStrategies from '@/app/components/home/LatestStrategies';
import HomeBanner from '@/app/components/home/HomeBanner';
// Import loader dari file Client Component yang baru
import { RecommendedTeamsLoading, LatestStrategiesLoading } from '@/app/components/home/HomeLoaders';

import { getRecentPostsAdmin } from '@/lib/firestore-admin/posts';
import { getActivePromotions } from '@/lib/firestore-admin/clans';

// Impor untuk data fetching header yang BENAR
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
 * Halaman utama (Server Component)
 */
export default async function Home() {
  // Data fetching diparalelkan untuk performa
  const [sessionUser, recentPosts, activePromotions] = await Promise.all([
    getSessionUser(),
    getRecentPostsAdmin(8), // Ambil 8 postingan terbaru
    getActivePromotions(),  // Ambil promosi aktif
  ]);

  // Variabel untuk data header (default null)
  let userProfile: FirestoreDocument<UserProfile> | null = null;
  let currentWar: CocCurrentWar | null = null;
  let managedClan: FirestoreDocument<ManagedClan> | null = null;
  let averageRating: number = 0;

  // 1. Ambil data Profil Pengguna (jika login)
  if (sessionUser) {
    userProfile = await getUserProfileAdmin(sessionUser.uid);

    // 2. Ambil data Klan & War (jika user punya klan terkelola)
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

      const totalReviews = clanReviews.length;
      if (totalReviews > 0) {
        averageRating =
          clanReviews.reduce((acc, review) => acc + review.rating, 0) /
          totalReviews;
      }
    }
  }

  return (
    <>
      {/* 1. Komponen Header (Dashboard User) */}
      <HomeHeader
        userProfile={userProfile}
        currentWar={currentWar}
        managedClan={managedClan}
        clanReputation={averageRating}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 pb-4 md:px-8 md:pb-8">
        
        {/* [POSISI 1] QuickLinks (Tautan Cepat COC) - Sekarang Paling Atas */}
        <div className="mt-12">
          <QuickLinks />
        </div>

        {/* [POSISI 2] Banner Promosi - Sekarang di Tengah (Bawah QuickLinks) */}
        {activePromotions.length > 0 && (
           <HomeBanner promotions={activePromotions} />
        )}

        {/* [POSISI 3] Rekomendasi Clan */}
        <Suspense fallback={<RecommendedTeamsLoading />}>
          <RecommendedTeams />
        </Suspense>

        {/* [POSISI 4] Strategi Terbaru */}
        <Suspense fallback={<LatestStrategiesLoading />}>
          <LatestStrategies posts={recentPosts} />
        </Suspense>
      </main>
    </>
  );
}