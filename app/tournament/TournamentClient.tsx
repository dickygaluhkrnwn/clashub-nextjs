'use client';

// [Fase 7.4] Tambahkan useEffect
// [Fase 12.2] Perbaiki logika filter `useMemo`
// [Fase 8.3] Hapus translateStatus, biarkan Card yang urus
import { useState, useMemo, useEffect } from 'react';
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
// [MODIFIKASI] Menambahkan import ikon yang dibutuhkan (Filter, Edit)
import { TrophyIcon, CogsIcon, FilterIcon, EditIcon } from '@/app/components/icons';

// Definisikan Props untuk Client Component
interface TournamentClientProps {
  initialTournaments: FirestoreDocument<
    Omit<Tournament, 'thRequirement'> & { thRequirement?: ThRequirement }
  >[];
  error: string | null;
}

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD_TOURNAMENT = 5;

// Helper untuk data V1/V2
const formatThRequirementToString = (
  thReq: ThRequirement | undefined,
): string => {
  if (!thReq) {
    return 'N/A (Data Lama)';
  }
  switch (thReq.type) {
    case 'uniform':
      return `TH ${thReq.allowedLevels[0]} Only`;
    case 'mixed':
      return `TH Campuran (${thReq.allowedLevels.slice(0, 2).join(', ')}...)`;
    case 'any':
    default:
      if (thReq.minLevel === 1 && thReq.maxLevel === 17) return 'Semua Level TH';
      if (thReq.minLevel === thReq.maxLevel) return `TH ${thReq.minLevel} Only`;
      return `TH ${thReq.minLevel} - ${thReq.maxLevel}`;
  }
};

const TournamentClient = ({
  initialTournaments,
  error: serverError,
}: TournamentClientProps) => {
  const [allTournaments] = useState(initialTournaments);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>(
    'tournaments',
  );

  // State untuk filter turnamen
  const [tournamentFilters, setTournamentFiltersState] =
    useState<TournamentFilters>({
      status: 'Semua Status',
      thLevel: 'Semua Level',
      prize: 'all',
    });

  // [MODIFIKASI FASE 3] State untuk toggle filter di mobile
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(
    ITEMS_PER_LOAD_TOURNAMENT,
  );
  const [isFiltering, setIsFiltering] = useState(false);

  // [BARU: Fase 7.4] Pemicu Cron Job Lokal
  useEffect(() => {
    const triggerUpdateStates = async () => {
      try {
        console.log('[Dev Trigger] Memanggil update status turnamen...');
        await fetch('/api/tournaments/update-states', { method: 'POST' });
        console.log('[Dev Trigger] Update status selesai.');
      } catch (error) {
        console.warn('[Dev Trigger] Gagal memicu update status:', error);
      }
    };

    triggerUpdateStates();
  }, []);

  const setTournamentFilters = (newFilters: TournamentFilters) => {
    setIsFiltering(true);
    setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
    // [MODIFIKASI] Tutup filter otomatis di mobile setelah memilih
    setIsFilterOpen(false);
    setTimeout(() => {
      setTournamentFiltersState(newFilters);
      setIsFiltering(false);
    }, 50);
  };

  // [UPDATE FASE 12.2] Logika filter diperbarui
  const filteredTournaments = useMemo(() => {
    return allTournaments.filter((tournament) => {
      const { status: filterStatus, thLevel, prize } = tournamentFilters;

      // --- [FIX FASE 12.2] Filter Wajib ---
      if (tournament.status === 'draft') {
        return false;
      }

      // 1. Filter Status
      if (filterStatus === 'Semua Status') {
        if (tournament.status === 'cancelled') return false;
      } else if (filterStatus === 'Akan Datang') {
        const isUpcoming =
          tournament.status === 'scheduled' ||
          tournament.status === 'registration_open' ||
          tournament.status === 'registration_closed';
        if (!isUpcoming) return false;
      } else if (filterStatus === 'Live') {
        if (tournament.status !== 'ongoing') return false;
      } else if (filterStatus === 'Selesai') {
        const isFinished =
          tournament.status === 'completed' ||
          tournament.status === 'cancelled';
        if (!isFinished) return false;
      }

      // 2. Filter TH
      let thMatch = false;
      if (thLevel === 'Semua Level') {
        thMatch = true;
      } else if (tournament.thRequirement) {
        const thReq = tournament.thRequirement;
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
          tournament.prizePool.toLowerCase().includes('cash');
      } else if (prize === 'item') {
        prizeMatch =
          tournament.prizePool.toLowerCase().includes('item') ||
          tournament.prizePool.toLowerCase().includes('eksklusif');
      }

      return prizeMatch;
    });
  }, [allTournaments, tournamentFilters]);

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
            Daftar Turnamen
          </button>
          <button
            onClick={() => setActiveTab('leagues')}
            className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${
              activeTab === 'leagues'
                ? 'text-coc-gold border-b-2 border-coc-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Liga & Klasemen
          </button>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Responsif */}
          <div className="lg:col-span-1 space-y-4">
             {/* [MODIFIKASI] Tombol Toggle Filter (Hanya Mobile) */}
             <div className="lg:hidden">
                <Button
                  variant="secondary"
                  className="w-full flex justify-between items-center py-3"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <span className="flex items-center gap-2">
                    <FilterIcon className="h-5 w-5" />
                    {isFilterOpen ? 'Sembunyikan Filter' : 'Filter Turnamen'}
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

             {/* [MODIFIKASI] Wrapper Filter (Collapsible di Mobile) */}
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
                {/* [MODIFIKASI] Hapus Judul 'Turnamen Aktif' agar langsung tampil card */}
                
                {isFiltering ? (
                  <div className="text-center py-20 card-stone rounded-lg">
                    <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-clash text-coc-gold">
                      Menerapkan Filter...
                    </h3>
                  </div>
                ) : serverError ? (
                  <div className="text-center py-20 card-stone p-6 rounded-lg">
                    <h3 className="text-xl font-clash text-coc-red">
                      {serverError}
                    </h3>
                  </div>
                ) : tournamentsToShow.length === 0 ? (
                  <div className="text-center py-10 card-stone p-6 rounded-lg">
                    <h3 className="text-xl font-clash text-gray-400">
                      Tidak ada turnamen yang ditemukan.
                    </h3>
                    <p className="text-sm text-gray-500">
                      Coba ubah kriteria filter Anda.
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
                      Muat Lebih Banyak Turnamen
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'leagues' && (
              <div className="text-center py-20 card-stone rounded-lg">
                <h2 className="text-2xl font-clash text-coc-gold">
                  Klasemen Liga (Development)
                </h2>
                <p className="text-gray-400 mt-2">
                  Fitur ini sedang dalam pengembangan.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* [FITUR BARU] Floating Action Button (FAB) Buat Turnamen */}
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Button
          href="/tournament/create"
          variant="primary"
          // Styling bulat sempurna seperti di Knowledge Hub
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-110 transition-all duration-300 border-2 border-coc-gold bg-coc-stone"
          title="Buat Turnamen Baru"
        >
          <EditIcon className="h-7 w-7 text-coc-gold" />
        </Button>
      </div>
    </div>
  );
};

export default TournamentClient;