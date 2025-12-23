'use client';

import { CogsIcon, BookOpenIcon } from '@/app/components/icons';
import CarouselSection from '@/app/components/layout/CarouselSection';
import { useLanguage } from '@/lib/hooks/useLanguage';

/**
 * Komponen placeholder loading untuk RecommendedTeams.
 * Menggunakan useLanguage agar judulnya ("Tim Rekomendasi") bisa diterjemahkan.
 */
export const RecommendedTeamsLoading = () => {
  const { t } = useLanguage();

  return (
    <CarouselSection
      title={t.home.recommendedTeams}
      icon={<CogsIcon className="inline-block h-5 w-5 text-coc-gold" />}
    >
      {[...Array(4)].map((_, i) => (
        // [MOBILE UPDATE] Ubah min-width agar pas di layar kecil tanpa gepeng
        <div key={i} className="card-stone p-4 animate-pulse min-w-[240px] md:min-w-[280px] border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            {/* Ukuran logo disesuaikan */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-coc-stone-light/50"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-coc-stone-light/50"></div>
              <div className="h-3 w-1/4 rounded bg-coc-stone-light/50"></div>
            </div>
          </div>
          <div className="h-3 w-full rounded bg-coc-stone-light/50 mb-2"></div>
          <div className="h-3 w-5/6 rounded bg-coc-stone-light/50"></div>
        </div>
      ))}
    </CarouselSection>
  );
};

/**
 * Komponen placeholder loading untuk LatestStrategies.
 * Menggunakan useLanguage agar judulnya ("Strategi Terbaru") bisa diterjemahkan.
 */
export const LatestStrategiesLoading = () => {
  const { t } = useLanguage();

  return (
    <CarouselSection
      title={t.home.latestStrategies}
      icon={<BookOpenIcon className="inline-block h-6 w-6 text-coc-gold" />}
    >
      {[...Array(5)].map((_, i) => (
        // [MOBILE UPDATE] Ubah min-width agar konsisten
        <div key={i} className="card-stone p-4 animate-pulse min-w-[240px] md:min-w-[280px] border border-white/5">
          <div className="flex justify-between items-center mb-3">
            <div className="h-3 w-1/4 rounded bg-coc-stone-light/50"></div>
            <div className="h-3 w-1/3 rounded bg-coc-stone-light/50"></div>
          </div>
          <div className="h-4 w-full rounded bg-coc-stone-light/50 mb-2"></div>
          <div className="h-4 w-3/4 rounded bg-coc-stone-light/50"></div>
        </div>
      ))}
    </CarouselSection>
  );
};