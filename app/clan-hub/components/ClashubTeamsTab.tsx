'use client';

import React from 'react';
import { RecommendedTeam } from '@/lib/types';
import { TeamCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { RefreshCwIcon, ShieldIcon } from '@/app/components/icons';
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
      <div className="text-center py-32 flex flex-col items-center justify-center opacity-70">
        <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-4" />
        <h2 className="text-xl font-clash text-white tracking-wide">{t.common.filtering}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-2">
          <ShieldIcon className="w-6 h-6 text-coc-gold" />
          <span>{t.clanHub.teamsFound.replace('{count}', filteredClans.length.toString())}</span>
        </h2>
      </div>

      {clansToShow.length === 0 ? (
        <div className="py-20 text-center bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <ShieldIcon className="h-16 w-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 text-lg font-medium">
            {t.clanHub.noTeamsMatch}
          </p>
          <p className="text-sm text-gray-500 mt-2">Coba ubah filter pencarian Anda</p>
        </div>
      ) : (
        <>
          {/* [RESPONSIVE GRID] Mobile: 1 kolom, Tablet: 2, Desktop XL: 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {clansToShow.map((clan: RecommendedTeam) => (
              <div key={clan.id} className="transition-transform duration-200 hover:-translate-y-1">
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
            <div className="text-center pt-8 pb-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={onLoadMoreClans}
                className="shadow-lg shadow-black/30 border border-white/10"
              >
                {t.common.loadMore} ({filteredClans.length - clansToShow.length}{' '}
                {t.common.remaining})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};