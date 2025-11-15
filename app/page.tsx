import { Suspense } from 'react';
// [BARU] Paksa rendering dinamis untuk memastikan cookie selalu dibaca
export const dynamic = 'force-dynamic';

import HomeHeader from '@/app/components/home/HomeHeader';
// [BARU] Impor komponen QuickLinks
import QuickLinks from '@/app/components/home/QuickLinks';
import RecommendedTeams from '@/app/components/home/RecommendedTeams';
import LatestStrategies from '@/app/components/home/LatestStrategies';
import CarouselSection from '@/app/components/layout/CarouselSection';
import { CogsIcon, BookOpenIcon } from '@/app/components/icons';
import { getRecentPostsAdmin } from '@/lib/firestore-admin/posts';

// Impor untuk data fetching header yang BENAR
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
import {
  getClanApiCacheAdmin,
  getManagedClanDataAdmin,
} from '@/lib/firestore-admin/clans';
// [BARU] Impor getClanReviewsAdmin untuk mengambil data Reputasi
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import {
  FirestoreDocument,
  UserProfile,
  CocCurrentWar,
  Tournament,
  ManagedClan,
  ClanReview, // [BARU] Impor tipe ClanReview
} from '@/lib/types';

/**
 * Halaman utama (Server Component)
 * [PERBAIKAN] Sekarang mengambil data untuk Header dan Body
 */
export default async function Home() {
  // Data fetching diparalelkan untuk performa
  const [sessionUser, recentPosts] = await Promise.all([
    getSessionUser(),
    getRecentPostsAdmin(8), // Ambil 8 postingan terbaru
  ]);

  // Variabel untuk data header (default null)
  let userProfile: FirestoreDocument<UserProfile> | null = null;
  let currentWar: CocCurrentWar | null = null;
  let managedClan: FirestoreDocument<ManagedClan> | null = null;
  // [BARU] Variabel untuk menyimpan Reputasi Klan
  let averageRating: number = 0;

  // 1. Ambil data Profil Pengguna (jika login)
  if (sessionUser) {
    userProfile = await getUserProfileAdmin(sessionUser.uid);

    // 2. Ambil data Klan & War (jika user punya klan terkelola)
    if (userProfile?.clanId) {
      // [PERBAIKAN] Ambil data klan, cache, DAN ulasan (reputasi) secara paralel
      const [clanData, clanCache, clanReviews] = await Promise.all([
        getManagedClanDataAdmin(userProfile.clanId),
        getClanApiCacheAdmin(userProfile.clanId),
        getClanReviewsAdmin(userProfile.clanId), // [BARU] Ambil ulasan
      ]);

      managedClan = clanData; // Simpan data klan (untuk "The Golden Army")

      // Pastikan currentWar ada dan bukan null/undefined
      if (clanCache && clanCache.currentWar) {
        currentWar = clanCache.currentWar; // Simpan data war (untuk "Status War")
      }

      // [BARU] Hitung Reputasi (sama seperti di halaman internal)
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
      {/* 1. Komponen Header sekarang menerima data dinamis yang BENAR */}
      <HomeHeader
        userProfile={userProfile}
        currentWar={currentWar}
        managedClan={managedClan}
        clanReputation={averageRating} // [BARU] Teruskan reputasi sebagai prop
      />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 md:p-8">
        {/* [BARU] Menambahkan Tautan Cepat di sini */}
        <QuickLinks />

        {/* 2. Komponen Rekomendasi Tim (Sudah Dinamis) */}
        <Suspense fallback={<RecommendedTeamsLoading />}>
          <RecommendedTeams />
        </Suspense>

        {/* 3. Komponen Strategi Terbaru (Sudah Dinamis) */}
        <Suspense fallback={<LatestStrategiesLoading />}>
          <LatestStrategies posts={recentPosts} />
        </Suspense>
      </main>
    </>
  );
}

/**
 * Komponen placeholder loading untuk RecommendedTeams.
 */
const RecommendedTeamsLoading = () => {
  return (
    <CarouselSection
      // [PERBAIKAN JUDUL] Diubah sesuai permintaan
      title="Rekomendasi Clan"
      icon={<CogsIcon className="inline-block h-5 w-5" />}
    >
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card-stone p-4 animate-pulse">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-lg bg-coc-stone-light/50"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded bg-coc-stone-light/50"></div>
              <div className="h-4 w-1/4 rounded bg-coc-stone-light/50"></div>
            </div>
          </div>
          <div className="h-4 w-full rounded bg-coc-stone-light/50 mb-2"></div>
          <div className="h-4 w-5/6 rounded bg-coc-stone-light/50"></div>
          <div className="flex justify-between items-center mt-4">
            <div className="h-5 w-1/3 rounded bg-coc-stone-light/50"></div>
            <div className="h-8 w-1/4 rounded-lg bg-coc-stone-light/50"></div>
          </div>
        </div>
      ))}
    </CarouselSection>
  );
};

/**
 * Komponen placeholder loading untuk LatestStrategies.
 */
const LatestStrategiesLoading = () => {
  return (
    <CarouselSection
      // [PERBAIKAN JUDUL] Diubah sesuai permintaan
      title="Strategi & Tips"
      icon={<BookOpenIcon className="inline-block h-6 w-6" />}
    >
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card-stone p-4 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-1/4 rounded bg-coc-stone-light/50"></div>
            <div className="h-4 w-1/3 rounded bg-coc-stone-light/50"></div>
          </div>
          <div className="h-5 w-full rounded bg-coc-stone-light/50 mb-2"></div>
          <div className="h-5 w-3/4 rounded bg-coc-stone-light/50"></div>
          <div className="flex justify-between items-center mt-4">
            <div className="h-4 w-1/2 rounded bg-coc-stone-light/50"></div>
            <div className="h-4 w-1/3 rounded bg-coc-stone-light/50"></div>
          </div>
        </div>
      ))}
    </CarouselSection>
  );
};