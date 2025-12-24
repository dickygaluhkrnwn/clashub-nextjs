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
    <div className="w-full space-y-6 mb-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 animate-pulse">
                <CogsIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-xl font-clash text-white tracking-wide opacity-50 animate-pulse">{t.home.recommendedTeams}</h3>
        </div>
        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
      </div>
      
      {/* Cards Scroll Container Skeleton (Matches Native Scroll Layout) */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[280px] md:w-[320px] h-[200px] p-5 rounded-2xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/5 relative overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
            
            {/* Header: Logo & Name */}
            <div className="flex items-start gap-4 mb-5 border-b border-white/5 pb-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
                <div className="h-4 w-16 rounded bg-white/5 mt-2" />
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
               <div className="h-10 rounded-lg bg-white/5" />
               <div className="h-10 rounded-lg bg-white/5" />
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
    <div className="w-full space-y-6 mb-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 animate-pulse">
                <BookOpenIcon className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-xl font-clash text-white tracking-wide opacity-50 animate-pulse">{t.home.latestStrategies}</h3>
        </div>
        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Cards Scroll Container Skeleton */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[280px] md:w-[320px] h-[180px] p-5 rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-white/5 relative overflow-hidden flex flex-col"
          >
             {/* Shimmer Effect */}
             <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
             
             {/* Content */}
             <div className="flex-grow space-y-3">
                <div className="flex gap-2 mb-2">
                    <div className="h-5 w-16 rounded bg-white/10" />
                    <div className="h-5 w-12 rounded bg-white/5" />
                </div>
                <div className="h-6 w-full rounded bg-white/10" />
                <div className="h-6 w-2/3 rounded bg-white/10" />
             </div>

             {/* Footer */}
             <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end">
                <div className="space-y-1">
                    <div className="h-2 w-8 rounded bg-white/5" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                </div>
                <div className="h-3 w-16 rounded bg-white/5" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};