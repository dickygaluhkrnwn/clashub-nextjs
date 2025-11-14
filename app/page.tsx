import { Suspense } from "react";
import HomeHeader from "@/app/components/home/HomeHeader";
import RecommendedTeams from "@/app/components/home/RecommendedTeams";
import LatestStrategies from "@/app/components/home/LatestStrategies";
import CarouselSection from "@/app/components/layout/CarouselSection";
import { CogsIcon } from "@/app/components/icons";

/**
 * Halaman utama (Server Component)
 * Sekarang hanya bertugas mengatur layout dan me-render komponen-komponen utama.
 */
export default function Home() {
  return (
    <>
      {/* 1. Komponen Header dan Info Panel (Statis) */}
      <HomeHeader />

      {/* Main Content Area */}
      <main className="container mx-auto p-4 md:p-8">

        {/* 2. Komponen Rekomendasi Tim (Dinamis / Async) */}
        {/* Dibungkus Suspense agar sisa halaman bisa render sambil menunggu data. */}
        <Suspense fallback={<RecommendedTeamsLoading />}>
          {/* @ts-expect-error: Kita menggunakan Async Server Component di sini. 
            Next.js akan menanganinya dengan Suspense.
          */}
          <RecommendedTeams />
        </Suspense>

        {/* 3. Komponen Strategi Terbaru (Statis) */}
        <LatestStrategies />

      </main>
    </>
  );
}

/**
 * Komponen placeholder loading untuk RecommendedTeams.
 * Ditampilkan selagi data fetching di server berjalan.
 */
const RecommendedTeamsLoading = () => {
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