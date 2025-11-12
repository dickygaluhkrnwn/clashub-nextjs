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
import { TrophyIcon, CogsIcon } from '../components/icons';

// Definisikan Props untuk Client Component
interface TournamentClientProps {
  initialTournaments: FirestoreDocument<
    Omit<Tournament, 'thRequirement'> & { thRequirement?: ThRequirement }
  >[];
  error: string | null;
}

// --- [HAPUS Fase 8.3] ---
// Tipe dan fungsi translateStatus dipindahkan ke cards.tsx
// type TournamentStatusUI = ...
// const translateStatus = (...) => { ... }
// --- [AKHIR HAPUS] ---

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

  const [tournamentFilters, setTournamentFiltersState] =
    useState<TournamentFilters>({
      status: 'Semua Status',
      thLevel: 'Semua Level',
      prize: 'all',
    });

  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(
    ITEMS_PER_LOAD_TOURNAMENT,
  );
  const [isFiltering, setIsFiltering] = useState(false);

  // [BARU: Fase 7.4] Pemicu Cron Job Lokal
  useEffect(() => {
    // Panggil API trigger di background saat halaman dimuat
    // Ini berfungsi sebagai cron-job tiruan di localhost
    const triggerUpdateStates = async () => {
      try {
        // TODO: HAPUS INI SAAT DEPLOYMENT PRODUCTION
        // Di production, ini akan diganti oleh Vercel Cron / GitHub Actions
        // yang memanggil /api/tournaments/cron?secret=...
        console.log('[Dev Trigger] Memanggil update status turnamen...');
        await fetch('/api/tournaments/update-states', { method: 'POST' });
        console.log('[Dev Trigger] Update status selesai.');
        // Kita tidak perlu me-refresh data di sini,
        // karena data yang ditampilkan adalah initialProps dari server
        // yang dimuat SETELAH trigger ini (pada navigasi berikutnya).
      } catch (error) {
        console.warn('[Dev Trigger] Gagal memicu update status:', error);
      }
    };

    triggerUpdateStates();
  }, []); // Hanya berjalan sekali saat komponen mount

  const setTournamentFilters = (newFilters: TournamentFilters) => {
    setIsFiltering(true);
    setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
    setTimeout(() => {
      setTournamentFiltersState(newFilters);
      setIsFiltering(false);
    }, 50);
  };

  // [UPDATE FASE 12.2] Logika filter diperbarui untuk menyembunyikan 'draft'
  // dan 'cancelled' dari tampilan default.
  const filteredTournaments = useMemo(() => {
    return allTournaments.filter((tournament) => {
      const { status: filterStatus, thLevel, prize } = tournamentFilters;

      // --- [FIX FASE 12.2] Filter Wajib ---
      // JANGAN PERNAH tampilkan turnamen 'draft' di list publik
      if (tournament.status === 'draft') {
        return false;
      }
      // --- Akhir Fix ---

      // 1. Filter Status
      if (filterStatus === 'Semua Status') {
        // [FIX FASE 12.2] Sembunyikan 'cancelled' dari "Semua Status"
        if (tournament.status === 'cancelled') return false;
      } else if (filterStatus === 'Akan Datang') {
        const isUpcoming =
          tournament.status === 'scheduled' ||
          tournament.status === 'registration_open' ||
          // tournament.status === 'draft' || // [FIX FASE 12.2] Dihapus
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

      // 2. Filter TH (Defensif)
      let thMatch = false;
      if (thLevel === 'Semua Level') {
        thMatch = true;
      } else if (tournament.thRequirement) {
        const thReq = tournament.thRequirement;
        const filterIsRange = thLevel.includes(' - ');
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

  const isLoading = false;

  // [PERBAIKAN] Ganti <> dengan <div> dan tambahkan kelas layout
  return (
    <div className="container mx-auto p-4 md:p-8 mt-10">
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
        <div className="lg:col-span-1">
          <TournamentFilter
            filters={tournamentFilters}
            onFilterChange={setTournamentFilters}
          />
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'tournaments' && (
            <>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl md:text-4xl flex items-center gap-2">
                  <TrophyIcon className="h-8 w-8 text-coc-gold-dark" />
                  Turnamen Aktif & Akan Datang
                </h1>
                <Button href="/tournament/create" variant="primary">
                  Buat Turnamen
                </Button>
              </div>

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
                      // [FIX V2] Gunakan helper baru yang sudah defensif
                      thRequirement={formatThRequirementToString(
                        tournament.thRequirement, // Ini bisa undefined
                      )}
                      // [PERBAIKAN FASE 8.3] Kirim status mentah
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
  );
};

export default TournamentClient;