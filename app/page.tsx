import { Suspense } from "react";
import HomeHeader from "@/app/components/home/HomeHeader";
import RecommendedTeams from "@/app/components/home/RecommendedTeams";
import LatestStrategies from "@/app/components/home/LatestStrategies";
import CarouselSection from "@/app/components/layout/CarouselSection";
// [EDIT] Impor CogsIcon dan BookOpenIcon
import { CogsIcon, BookOpenIcon } from "@/app/components/icons";
// [BARU] Impor fungsi data fetching untuk postingan
import { getRecentPostsAdmin } from "@/lib/firestore-admin/posts";

/**
 * Halaman utama (Server Component)
 * [PERBAIKAN] Sekarang async untuk fetch data postingan terbaru.
 */
export default async function Home() {
  
  // [PERBAIKAN] Mengubah dari 4 menjadi 8 postingan agar bisa di-scroll
  const recentPosts = await getRecentPostsAdmin(8);

  return (
    <>
      {/* 1. Komponen Header dan Info Panel (Statis) */}
      <HomeHeader />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 md:p-8">

        {/* 2. Komponen Rekomendasi Tim (Dinamis / Async) */}
        {/* Biarkan komponen ini fetch datanya sendiri, sudah bagus. */}
        <Suspense fallback={<RecommendedTeamsLoading />}>
          {/* [DIHAPUS] Komentar @ts-expect-error sudah tidak diperlukan lagi */}
          <RecommendedTeams />
        </Suspense>

        {/* 3. Komponen Strategi Terbaru (Sekarang Dinamis) */}
        {/* [PERBAIKAN] Dibungkus Suspense dan data di-pass sebagai props. */}
        <Suspense fallback={<LatestStrategiesLoading />}>
          {/* * [DIHAPUS] Komentar @ts-expect-error sudah tidak diperlukan
           * karena LatestStrategies.tsx sekarang menerima props 'posts'.
           */}
          <LatestStrategies posts={recentPosts} />
        </Suspense>

      </main>
    </>
  );
}

/**
 * Komponen placeholder loading untuk RecommendedTeams.
 * (Tidak ada perubahan di sini)
 */
const RecommendedTeamsLoading = () => {
// ... (kode loading tidak berubah) ...
  return (
    <CarouselSection title="Rekomendasi Tim untuk Anda" icon={<CogsIcon className="inline-block h-5 w-5" />}>
      {/* Tampilkan 4 skeleton card */}
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
}

/**
 * [BARU] Komponen placeholder loading untuk LatestStrategies.
 * [PERBAIKAN] Skeleton loading disamakan menjadi 8
 */
const LatestStrategiesLoading = () => {
// ... (kode loading tidak berubah) ...
  return (
    <CarouselSection title="Strategi & Tips Terbaru" icon={<BookOpenIcon className="inline-block h-6 w-6" />}>
      {/* [PERBAIKAN] Tampilkan 8 skeleton card agar konsisten */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card-stone p-4 animate-pulse">
          {/* Skeleton untuk PostCard */}
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
}