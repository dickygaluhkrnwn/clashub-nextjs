import React from 'react';
// [PERBAIKAN] Ganti impor ManagedClan ke RecommendedTeam
import { RecommendedTeam } from '@/lib/types';
import { TeamCard } from '@/app/components/cards';
import { Button } from '@/app/components/ui/Button';
import { RefreshCwIcon } from '@/app/components/icons';

interface ClashubTeamsTabProps {
  isFiltering: boolean;
  // [PERBAIKAN] Ganti tipe props ke RecommendedTeam[]
  filteredClans: RecommendedTeam[];
  clansToShow: RecommendedTeam[];
  showLoadMoreClans: boolean;
  onLoadMoreClans: () => void;
}

/**
 * Komponen untuk me-render konten tab "Tim Clashub".
 * Diekstrak dari TeamHubClient.tsx (fungsi renderClashubTeams).
 */
export const ClashubTeamsTab = ({
  isFiltering,
  filteredClans,
  clansToShow,
  showLoadMoreClans,
  onLoadMoreClans,
}: ClashubTeamsTabProps) => {
  if (isFiltering) {
    return (
      <div className="text-center py-20">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-clash text-white">
        {filteredClans.length} Tim Internal Ditemukan
      </h2>
      {clansToShow.length === 0 ? (
        <p className="text-gray-400 text-center py-10">
          Tidak ada Tim Clashub yang cocok dengan filter Anda.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* [PERBAIKAN] Ganti tipe map ke RecommendedTeam */}
            {clansToShow.map((clan: RecommendedTeam) => (
              <TeamCard
                key={clan.id}
                id={clan.id}
                name={clan.name}
                tag={clan.tag}
                // [PERBAIKAN UTAMA] Ganti placeholder dengan rating asli
                rating={clan.averageRating}
                vision={clan.vision}
                avgTh={clan.avgTh}
                logoUrl={clan.logoUrl}
              />
            ))}
          </div>
          {showLoadMoreClans && (
            <div className="text-center pt-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={onLoadMoreClans}
              >
                Muat Lebih Banyak ({filteredClans.length - clansToShow.length}{' '}
                Tersisa)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};