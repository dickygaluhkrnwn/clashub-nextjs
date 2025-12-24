'use client';

import React from 'react';
import { RecommendedTeam } from '@/lib/types';
import { TeamCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { RefreshCwIcon, ShieldIcon, Loader2Icon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ClashubTeamsTabProps {
  isFiltering: boolean;
  filteredClans: RecommendedTeam[];
  clansToShow: RecommendedTeam[];
  showLoadMoreClans: boolean;
  onLoadMoreClans: () => void;
}

export const ClashubTeamsTab = ({
  isFiltering,
  filteredClans,
  clansToShow,
  showLoadMoreClans,
  onLoadMoreClans,
}: ClashubTeamsTabProps) => {
  const { t } = useLanguage();

  if (isFiltering) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-4 rounded-full bg-coc-gold/10 border border-coc-gold/20 animate-pulse">
            <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin" />
        </div>
        <h2 className="text-lg font-clash text-gray-400 tracking-wide animate-pulse">{t.common.filtering}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-coc-gold/10 border border-coc-gold/20">
            <ShieldIcon className="w-6 h-6 text-coc-gold" />
          </div>
          <span className="tracking-wide">{t.clanHub.teamsFound.replace('{count}', filteredClans.length.toString())}</span>
        </h2>
      </div>

      {clansToShow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/5 rounded-3xl border border-white/5 border-dashed text-center">
          <div className="p-6 rounded-full bg-white/5 mb-6">
            <ShieldIcon className="h-16 w-16 text-gray-500 opacity-50" />
          </div>
          <h3 className="text-xl font-clash text-white mb-2 tracking-wide">
            {t.clanHub.noTeamsMatch}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Coba sesuaikan filter pencarian Anda untuk menemukan hasil yang lebih relevan.
          </p>
        </div>
      ) : (
        <>
          {/* [RESPONSIVE GRID] Mobile: 1 kolom, Tablet: 2, Desktop XL: 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clansToShow.map((clan: RecommendedTeam, index) => (
              <div 
                key={clan.id} 
                className="h-full animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  <TeamCard
                    id={clan.id}
                    name={clan.name}
                    tag={clan.tag}
                    rating={clan.averageRating}
                    vision={clan.vision}
                    avgTh={clan.avgTh}
                    logoUrl={clan.logoUrl}
                  />
              </div>
            ))}
          </div>
          
          {showLoadMoreClans && (
            <div className="flex justify-center pt-8 pb-12">
              <Button
                variant="outline"
                size="lg"
                onClick={onLoadMoreClans}
                className="group border-white/10 hover:border-coc-gold/50 text-gray-300 hover:text-white min-w-[200px]"
              >
                {t.common.loadMore} 
                <span className="ml-2 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full group-hover:bg-coc-gold group-hover:text-black transition-colors">
                    {filteredClans.length - clansToShow.length}
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};