'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TournamentCard } from '@/app/components/cards';
import TournamentFilter, {
  TournamentFilters,
} from '@/app/components/filters/TournamentFilter';
import { Button } from '@/app/components/ui/Button';
import {
  Tournament,
  FirestoreDocument,
  ThRequirement,
} from '@/lib/clashub.types';
import { 
  TrophyIcon, 
  CogsIcon, 
  FilterIcon, 
  EditIcon,
  AlertTriangleIcon,
  RefreshCwIcon
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; 

// Definisikan Props untuk Client Component
interface TournamentClientProps {
  initialTournaments: FirestoreDocument<
    Omit<Tournament, 'thRequirement'> & { thRequirement?: ThRequirement }
  >[];
  error: string | null;
}

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD_TOURNAMENT = 5;

const TournamentClient = ({
  initialTournaments,
  error: serverError,
}: TournamentClientProps) => {
  const { t } = useLanguage(); 
  
  const [allTournaments] = useState(initialTournaments);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');

  // [PERBAIKAN FINAL] Hapus 'as any'. Sekarang tipe datanya sudah string dan kompatibel.
  const [tournamentFilters, setTournamentFiltersState] = useState<TournamentFilters>({
    status: t.tournament.filterStatusAll, 
    thLevel: t.clanHub.filterAllTh,
    prize: 'all',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(ITEMS_PER_LOAD_TOURNAMENT);
  const [isFiltering, setIsFiltering] = useState(false);

  // Helper untuk format TH Requirement dengan i18n
  const formatThRequirementToString = useCallback((thReq: ThRequirement | undefined): string => {
    if (!thReq) {
      return 'N/A';
    }
    switch (thReq.type) {
      case 'uniform':
        return `TH ${thReq.allowedLevels[0]} Only`;
      case 'mixed':
        return `Mixed TH (${thReq.allowedLevels.slice(0, 2).join(', ')}...)`; 
      case 'any':
      default:
        if (thReq.minLevel === 1 && thReq.maxLevel === 17) return t.clanHub.filterAllTh;
        if (thReq.minLevel === thReq.maxLevel) return `TH ${thReq.minLevel} Only`;
        return `TH ${thReq.minLevel} - ${thReq.maxLevel}`;
    }
  }, [t]);

  // [Fase 7.4] Pemicu Cron Job Lokal
  useEffect(() => {
    const triggerUpdateStates = async () => {
      try {
        console.log('[Dev Trigger] Calling tournament state update...');
        await fetch('/api/tournaments/update-states', { method: 'POST' });
      } catch (error) {
        console.warn('[Dev Trigger] Failed to trigger state update:', error);
      }
    };

    triggerUpdateStates();
  }, []);

  const setTournamentFilters = (newFilters: TournamentFilters) => {
    setIsFiltering(true);
    setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
    setIsFilterOpen(false);
    setTimeout(() => {
      setTournamentFiltersState(newFilters);
      setIsFiltering(false);
    }, 50);
  };

  // [LOGIKA FILTER]
  const filteredTournaments = useMemo(() => {
    return allTournaments.filter((tournament) => {
      const { status: filterStatus, thLevel, prize } = tournamentFilters;

      // Filter Wajib
      if (tournament.status === 'draft') {
        return false;
      }

      // 1. Filter Status (Menggunakan t.* untuk perbandingan dinamis)
      if (filterStatus === t.tournament.filterStatusAll) {
        if (tournament.status === 'cancelled') return false;
      } else if (filterStatus === t.tournament.filterStatusUpcoming) {
        const isUpcoming =
          tournament.status === 'scheduled' ||
          tournament.status === 'registration_open' ||
          tournament.status === 'registration_closed';
        if (!isUpcoming) return false;
      } else if (filterStatus === t.tournament.filterStatusOngoing) {
        if (tournament.status !== 'ongoing') return false;
      } else if (filterStatus === t.tournament.filterStatusCompleted) {
        const isFinished =
          tournament.status === 'completed' ||
          tournament.status === 'cancelled';
        if (!isFinished) return false;
      }

      // 2. Filter TH
      let thMatch = false;
      if (thLevel === t.clanHub.filterAllTh) {
        thMatch = true;
      } else if (tournament.thRequirement) {
        const thReq = tournament.thRequirement;
        // Parsing string "TH 10 - 12" atau "TH 15"
        const filterThParts = thLevel
          .replace(/TH /g, '')
          .split(' - ')
          .map(Number);
        const filterThNum = filterThParts[0];

        if (thReq.type === 'any') {
          const filterMax = filterThParts[1] || filterThParts[0];
          thMatch = thReq.minLevel <= filterMax && thReq.maxLevel >= filterThNum;
        } else if (thReq.type === 'uniform') {
          const filterMax = filterThParts[1] || filterThParts[0];
          thMatch =
            thReq.allowedLevels[0] >= filterThNum &&
            thReq.allowedLevels[0] <= filterMax;
        } else if (thReq.type === 'mixed') {
          const filterMax = filterThParts[1] || filterThParts[0];
          thMatch = thReq.allowedLevels.some(
            (lvl) => lvl >= filterThNum && lvl <= filterMax,
          );
        }
      } else {
        thMatch = false;
      }
      if (!thMatch) return false;

      // 3. Filter Hadiah
      let prizeMatch = true;
      if (prize === 'cash') {
        prizeMatch =
          tournament.prizePool.toLowerCase().includes('rp') ||
          tournament.prizePool.toLowerCase().includes('juta') ||
          tournament.prizePool.toLowerCase().includes('cash') ||
          tournament.prizePool.toLowerCase().includes('$');
      } else if (prize === 'item') {
        prizeMatch =
          tournament.prizePool.toLowerCase().includes('item') ||
          tournament.prizePool.toLowerCase().includes('pass') ||
          tournament.prizePool.toLowerCase().includes('skin');
      }

      return prizeMatch;
    });
  }, [allTournaments, tournamentFilters, t]);

  const handleLoadMoreTournaments = () => {
    setVisibleTournamentsCount(
      (prevCount) => prevCount + ITEMS_PER_LOAD_TOURNAMENT,
    );
  };

  const tournamentsToShow = useMemo(
    () => filteredTournaments.slice(0, visibleTournamentsCount),
    [filteredTournaments, visibleTournamentsCount],
  );
  const showLoadMoreTournaments =
    visibleTournamentsCount < filteredTournaments.length;

  return (
    <div className="relative">
      <div className="container mx-auto p-4 md:p-8 mt-10">
        {/* Tab Navigation */}
        <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              setActiveTab('tournaments');
              setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
            }}
            className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${
              activeTab === 'tournaments'
                ? 'text-coc-gold border-b-2 border-coc-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.navigation.tournaments} 
          </button>
          <button
            onClick={() => setActiveTab('leagues')}
            className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${
              activeTab === 'leagues'
                ? 'text-coc-gold border-b-2 border-coc-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.clanCwl.leagueLabel} & {t.clanCwl.rankLabel} 
          </button>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Responsif */}
          <div className="lg:col-span-1 space-y-4">
             {/* Tombol Toggle Filter (Hanya Mobile) */}
             <div className="lg:hidden">
                <Button
                  variant="secondary"
                  className="w-full flex justify-between items-center py-3"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <span className="flex items-center gap-2">
                    <FilterIcon className="h-5 w-5" />
                    {isFilterOpen ? t.clanHub.hideFilter : t.clanHub.showFilter} 
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
             </div>

             {/* Wrapper Filter */}
             <div className={`${isFilterOpen ? 'block animate-fade-in' : 'hidden'} lg:block`}>
                <TournamentFilter
                  filters={tournamentFilters}
                  onFilterChange={setTournamentFilters}
                />
             </div>
          </div>

          {/* Konten Utama */}
          <div className="lg:col-span-3">
            {activeTab === 'tournaments' && (
              <>
                {isFiltering ? (
                  <div className="text-center py-20 card-stone rounded-lg">
                    <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-clash text-coc-gold">
                      {t.common.filtering} 
                    </h3>
                  </div>
                ) : serverError ? (
                  <div className="text-center py-20 card-stone p-6 rounded-lg">
                    <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
                    <h3 className="text-xl font-clash text-coc-red mb-2">
                      {t.tournament.errorTitle} 
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        {t.tournament.errorDesc}
                    </p>
                    <Button href="/tournament" variant="secondary" size="sm">
                        <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.tournament.btnTryAgain}
                    </Button>
                  </div>
                ) : tournamentsToShow.length === 0 ? (
                  <div className="text-center py-10 card-stone p-6 rounded-lg">
                    <TrophyIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-xl font-clash text-gray-400">
                      {t.tournament.noTournaments} 
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t.tournament.noTournamentsDesc} 
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {tournamentsToShow.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        id={tournament.id}
                        title={tournament.title}
                        thRequirement={formatThRequirementToString(
                          tournament.thRequirement,
                        )}
                        status={tournament.status}
                        prizePool={tournament.prizePool}
                      />
                    ))}
                  </div>
                )}

                {showLoadMoreTournaments && (
                  <div className="text-center mt-10">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleLoadMoreTournaments}
                      disabled={isFiltering}
                    >
                      {t.common.loadMore} 
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'leagues' && (
              <div className="text-center py-20 card-stone rounded-lg">
                <h2 className="text-2xl font-clash text-coc-gold">
                  {t.clanCwl.leagueLabel} (Development)
                </h2>
                <p className="text-gray-400 mt-2">
                  Feature coming soon.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FAB Buat Turnamen */}
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Button
          href="/tournament/create"
          variant="primary"
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-coc-stone"
          title={t.clanEsports.createTeam} // Gunakan key 'create' sementara
        >
          <EditIcon className="h-7 w-7 text-coc-gold" />
        </Button>
      </div>
    </div>
  );
};

export default TournamentClient;