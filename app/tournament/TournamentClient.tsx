'use client';

import { useState, useMemo } from 'react';
import { TournamentCard } from '@/app/components/cards';
// Import tipe filter dari komponen filter
import TournamentFilter, {
  TournamentFilters,
} from '@/app/components/filters/TournamentFilter';
import { Button } from '@/app/components/ui/Button';
// [PERBAIKAN] Impor FirestoreDocument karena kita menerimanya dari server
import { Tournament, FirestoreDocument } from '@/lib/types';
import { TrophyIcon, CogsIcon } from '../components/icons'; // Import CogsIcon

// Definisikan Props untuk Client Component
interface TournamentClientProps {
  // [PERBAIKAN] Tipe diubah agar cocok dengan output Admin SDK (dari page.tsx)
  initialTournaments: FirestoreDocument<Tournament>[];
  error: string | null;
}

// --- Tipe untuk Status Terjemahan ---
type TournamentStatusUI = 'Akan Datang' | 'Live' | 'Selesai';

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD_TOURNAMENT = 5; // Tampilkan 5 turnamen per load

const TournamentClient = ({
  initialTournaments,
  error: serverError,
}: TournamentClientProps) => {
  // [PERBAIKAN] Tipe state diubah agar cocok dengan props
  const [allTournaments] =
    useState<FirestoreDocument<Tournament>[]>(initialTournaments);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>(
    'tournaments',
  );

  // State untuk filter turnamen (nilai default)
  const [tournamentFilters, setTournamentFiltersState] =
    useState<TournamentFilters>({
      status: 'Semua Status',
      thLevel: 'Semua Level',
      prize: 'all',
    });

  // --- State Pagination ---
  const [visibleTournamentsCount, setVisibleTournamentsCount] = useState(
    ITEMS_PER_LOAD_TOURNAMENT,
  );
  // --- End State Pagination ---

  // Simulasi loading/filtering (untuk UX saat filter diubah)
  const [isFiltering, setIsFiltering] = useState(false);

  // --- Handler Filter Diperbarui ---
  const setTournamentFilters = (newFilters: TournamentFilters) => {
    setIsFiltering(true);
    setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT); // Reset pagination saat filter berubah
    setTimeout(() => {
      setTournamentFiltersState(newFilters); // Update state filter yang sebenarnya
      setIsFiltering(false);
    }, 50); // Delay
  };
  // --- End Handler Filter ---

  // Logika Filtering Nyata menggunakan useMemo
  const filteredTournaments = useMemo(() => {
    // Hapus setIsFiltering dari sini karena sudah ditangani di handler
    return allTournaments.filter((tournament) => {
      // 1. Dapatkan status filter (Bahasa Indonesia, cth: "Akan Datang")
      const { status, thLevel, prize } = tournamentFilters;

      // =================================================================
      // [FIX ERROR TS2367]
      // Terjemahkan filter B. Indonesia ke status DB B. Inggris
      // =================================================================
      let statusDB: Tournament['status'] | 'Semua Status' = 'Semua Status'; // <-- Inisialisasi default
      if (status === 'Akan Datang') {
        statusDB = 'UPCOMING';
      } else if (status === 'Live') {
        statusDB = 'ONGOING';
      } else if (status === 'Selesai') {
        statusDB = 'COMPLETED';
      }
      // Jika status === 'Semua Status', statusDB akan tetap 'Semua Status'

      // 3. Lakukan perbandingan
      const statusMatch =
        statusDB === 'Semua Status' || tournament.status === statusDB;

      // =================================================================
      // [FIX BERHASIL]
      // Logika filter TH ini sekarang berfungsi karena:
      // 1. Tipe data 'tournament' adalah FirestoreDocument<Tournament>
      // 2. Tipe 'Tournament' (di lib/clashub.types.ts) SUDAH memiliki 'thRequirement'
      // =================================================================
      let thMatch = thLevel === 'Semua Level';
      if (!thMatch && tournament.thRequirement) {
        if (tournament.thRequirement.includes('-')) {
          // Cek range (e.g., "TH 15 - 16")
          const [min, max] = tournament.thRequirement
            .replace(/TH /g, '')
            .split(' - ')
            .map(Number);
          // Ambil angka pertama dari filter (misal "15" dari "TH 15 - 16" atau "13" dari "TH 13")
          const filterThNum = parseInt(thLevel.replace(/\D/g, ''), 10);
          if (!isNaN(filterThNum)) {
            thMatch = filterThNum >= min && filterThNum <= max;
          }
        } else if (thLevel.includes('-')) {
          // Jika filter adalah range tapi data single TH
          const [filterMin, filterMax] = thLevel
            .replace(/TH /g, '')
            .split(' - ')
            .map(Number);
          const dataTh = parseInt(
            tournament.thRequirement.replace(/\D/g, ''),
            10,
          );
          if (!isNaN(dataTh)) {
            thMatch = dataTh >= filterMin && dataTh <= filterMax;
          }
        } else {
          // Cek single TH (e.g., "TH 16 Only" vs "TH 16")
          // [PERBAIKAN LOGIKA FILTER] Cek kesamaan string langsung, bukan 'includes'
          thMatch = tournament.thRequirement === thLevel;
        }
      }

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

      return statusMatch && thMatch && prizeMatch;
    });
  }, [allTournaments, tournamentFilters]);

  // --- Fungsi Load More ---
  const handleLoadMoreTournaments = () => {
    setVisibleTournamentsCount(
      (prevCount) => prevCount + ITEMS_PER_LOAD_TOURNAMENT,
    );
  };
  // --- End Fungsi Load More ---

  // --- Logika Slice & Show Button ---
  const tournamentsToShow = useMemo(
    () => filteredTournaments.slice(0, visibleTournamentsCount),
    [filteredTournaments, visibleTournamentsCount],
  );
  const showLoadMoreTournaments =
    visibleTournamentsCount < filteredTournaments.length;
  // --- End Logika Slice & Show Button ---

  const isLoading = false; // Asumsi data awal sudah dari server

  // --- [BARU] Helper Function for Status Translation ---
  const translateStatus = (
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED',
  ): TournamentStatusUI => {
    switch (status) {
      case 'UPCOMING':
        return 'Akan Datang';
      case 'ONGOING':
        return 'Live';
      case 'COMPLETED':
        return 'Selesai';
      default:
        return 'Akan Datang'; // Fallback
    }
  };

  return (
    <>
      {/* Navigasi Tab */}
      <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex overflow-x-auto custom-scrollbar">
        <button
          onClick={() => {
            setActiveTab('tournaments');
            // Reset pagination jika kembali ke tab ini (opsional)
            setVisibleTournamentsCount(ITEMS_PER_LOAD_TOURNAMENT);
          }}
          // Menggunakan font-clash untuk tombol tab
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
          // Menggunakan font-clash untuk tombol tab
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
        {/* Kolom Filter */}
        <div className="lg:col-span-1">
          <TournamentFilter
            filters={tournamentFilters}
            onFilterChange={setTournamentFilters} // Handler sudah termasuk reset pagination
          />
        </div>

        {/* Kolom Konten Utama */}
        <div className="lg:col-span-3">
          {activeTab === 'tournaments' && (
            <>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                {/* Judul akan otomatis font-clash */}
                <h1 className="text-3xl md:text-4xl flex items-center gap-2">
                  <TrophyIcon className="h-8 w-8 text-coc-gold-dark" />
                  Turnamen Aktif & Akan Datang
                </h1>
                <Button href="/tournament/create" variant="primary">
                  Buat Turnamen
                </Button>
              </div>

              {/* State Loading/Filtering/Error */}
              {isFiltering ? (
                <div className="text-center py-20 card-stone rounded-lg">
                  <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                  {/* Menggunakan font-clash */}
                  <h3 className="text-xl font-clash text-coc-gold">
                    Menerapkan Filter...
                  </h3>
                </div>
              ) : serverError ? (
                <div className="text-center py-20 card-stone p-6 rounded-lg">
                  {/* Menggunakan font-clash */}
                  <h3 className="text-xl font-clash text-coc-red">
                    {serverError}
                  </h3>
                </div>
              ) : tournamentsToShow.length === 0 ? (
                <div className="text-center py-10 card-stone p-6 rounded-lg">
                  {/* Menggunakan font-clash */}
                  <h3 className="text-xl font-clash text-gray-400">
                    Tidak ada turnamen yang ditemukan.
                  </h3>
                  <p className="text-sm text-gray-500">
                    Coba ubah kriteria filter Anda.
                  </p>
                </div>
              ) : (
                // Daftar Turnamen
                <div className="space-y-6">
                  {/* Render tournamentsToShow */}
                  {tournamentsToShow.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      // [PERBAIKAN] Menggunakan helper 'translateStatus'
                      // dan memastikan semua props yang dibutuhkan 'TournamentCardProps' ada.
                      id={tournament.id}
                      title={tournament.title}
                      thRequirement={tournament.thRequirement}
                      status={translateStatus(tournament.status)}
                      prizePool={tournament.prizePool}
                    />
                  ))}
                </div>
              )}

              {/* Tombol Load More Tournaments */}
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

          {/* Placeholder Tab Liga */}
          {activeTab === 'leagues' && (
            <div className="text-center py-20 card-stone rounded-lg">
              {/* Menggunakan font-clash untuk judul */}
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
    </>
  );
};

export default TournamentClient;