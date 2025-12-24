'use client';

import { CogsIcon, BookOpenIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

/**
 * Skeleton Loader untuk Recommended Teams
 * Menggunakan layout Grid yang konsisten dengan desain baru.
 */
export const RecommendedTeamsLoading = () => {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <CogsIcon className="h-5 w-5 text-coc-gold" />
        <h3 className="text-xl font-clash text-white tracking-wide">{t.home.recommendedTeams}</h3>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-stone p-4 rounded-xl border border-white/5 bg-coc-stone-light/40 relative overflow-hidden">
            {/* Shimmer Effect Global */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-5/6 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Loader untuk Latest Strategies
 */
export const LatestStrategiesLoading = () => {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 px-1 mb-2">
        <BookOpenIcon className="h-5 w-5 text-coc-gold" />
        <h3 className="text-xl font-clash text-white tracking-wide">{t.home.latestStrategies}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-stone p-0 rounded-xl border border-white/5 bg-coc-stone-light/40 overflow-hidden relative h-[280px]">
             {/* Shimmer Effect Global */}
             <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
             
             {/* Image Placeholder */}
             <div className="h-40 bg-white/5 w-full" />
             
             {/* Content Placeholder */}
             <div className="p-4 space-y-3">
               <div className="h-5 w-3/4 rounded bg-white/10" />
               <div className="h-3 w-full rounded bg-white/5" />
               <div className="flex gap-2 pt-2">
                 <div className="h-6 w-16 rounded-full bg-white/5" />
                 <div className="h-6 w-16 rounded-full bg-white/5" />
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};