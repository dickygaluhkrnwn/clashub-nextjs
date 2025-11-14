'use client';

import { useState, useCallback, useMemo } from 'react';
// [PERBAIKAN] Impor tipe RecommendedTeam
import { ManagedClan, Player, PublicClanIndex, RecommendedTeam } from '@/lib/types';

// --- [IMPOR DIHAPUS] ---
// (Tidak ada perubahan di sini)

// Button tetap dibutuhkan untuk 'Load More'
import { Button } from '@/app/components/ui/Button';
// Ikon-ikon ini tetap dibutuhkan untuk TeamHubTabNavigation
import { ShieldIcon, UserIcon, GlobeIcon } from '@/app/components/icons';

// --- [IMPOR BARU DARI KOMPONEN HASIL REFACTOR] ---
import { TeamHubHeader } from './components/TeamHubHeader';
import { TeamHubTabNavigation } from './components/TeamHubTabNavigation';
import { TeamHubFilterBar } from './components/TeamHubFilterBar';
import { ClashubTeamsTab } from './components/ClashubTeamsTab';
import { PlayersTab } from './components/PlayersTab';
import { PublicClansTab } from './components/PublicClansTab';
// --- [AKHIR IMPOR BARU] ---

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6;

// =========================================================================
// (Komponen PublicClanCard sudah dipindah)
// =========================================================================

// =========================================================================
// 2. MAIN COMPONENT & LOGIC
// =========================================================================
interface TeamHubClientProps {
  // [PERBAIKAN #1] Ganti tipe props dari ManagedClan[] ke RecommendedTeam[]
  initialClans: RecommendedTeam[];
  initialPlayers: Player[];
  initialPublicClans: PublicClanIndex[]; // Cache Klan Publik
}

// --- [JENIS DIEKSPOR] ---
export type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

export type ManagedClanFilters = {
  searchTerm: string;
  vision: ManagedClan['vision'] | 'all';
  reputation: number;
  thLevel: number;
};
export type PlayerFilters = {
  searchTerm: string;
  role: Player['role'] | 'all';
  reputation: number;
  thLevel: number;
};
// --- [AKHIR JENIS DIEKSPOR] ---

const TeamHubClient = ({
  initialClans,
  initialPlayers,
  initialPublicClans,
}: TeamHubClientProps) => {
  // --- [STATE MANAGEMENT] ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');
  // [PERBAIKAN #2] Ganti tipe state dari ManagedClan[] ke RecommendedTeam[]
  const [allClans] = useState<RecommendedTeam[]>(initialClans);
  const [allPlayers] = useState<Player[]>(
    initialPlayers.map((p: Player) => ({
      ...p,
      name: p.displayName || p.name,
    })),
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [publicClansCache] = useState<PublicClanIndex[]>(() =>
    [...initialPublicClans].sort(
      (a, b) => (b.clanLevel || 0) - (a.clanLevel || 0),
    ),
  );

  // State Paginasi
  const [visibleClansCount, setVisibleClansCount] = useState(ITEMS_PER_LOAD);
  const [visiblePlayersCount, setVisiblePlayersCount] =
    useState(ITEMS_PER_LOAD);
  const [visiblePublicClansCount, setVisiblePublicClansCount] =
    useState(ITEMS_PER_LOAD);

  // State Filter
  const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({
    searchTerm: '',
    vision: 'all',
    reputation: 0, // [PERBAIKAN] Ganti default dari 3.0 ke 0
    thLevel: 0,
  });
  const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
    searchTerm: '',
    role: 'all',
    reputation: 0, // [PERBAIKAN] Ganti 3.0 ke 0 (untuk filter pemain)
    thLevel: 0,
  });

  // State Pencarian Klan Publik
  const [publicClanTag, setPublicClanTag] = useState('');
  const [publicClanResult, setPublicClanResult] =
    useState<PublicClanIndex | null>(null);
  const [isSearchingPublicClan, setIsSearchingPublicClan] = useState(false);
  const [publicSearchError, setPublicSearchError] = useState<string | null>(
    null,
  );
  // --- [AKHIR STATE MANAGEMENT] ---

  // --- [MEMOIZED LOGIC] ---
  const filteredClans = useMemo(() => {
    return allClans
      .filter((clan: RecommendedTeam) => { // [PERBAIKAN #3] Ganti tipe ke RecommendedTeam
        const searchTermLower = clanFilters.searchTerm.toLowerCase();
        const visionMatch =
          clanFilters.vision === 'all' || clan.vision === clanFilters.vision;
        const clanName = clan.name ?? '';
        const clanTag = clan.tag ?? '';

        // [BARU] Logika filter untuk reputasi/rating
        const ratingMatch = clan.averageRating >= clanFilters.reputation;
        const thMatch = clan.avgTh >= clanFilters.thLevel;

        return (
          (clanName.toLowerCase().includes(searchTermLower) ||
            clanTag.toLowerCase().includes(searchTermLower)) &&
          visionMatch &&
          thMatch &&
          ratingMatch // <-- [BARU] Terapkan filter rating
        );
      })
      // [PERBAIKAN #4] Urutkan berdasarkan rating asli, bukan avgTh
      .sort((a: RecommendedTeam, b: RecommendedTeam) => b.averageRating - a.averageRating);
  }, [allClans, clanFilters]);

  const filteredPlayers = useMemo(() => {
    return allPlayers
      .filter((player: Player) => {
        const name = player.displayName || player.inGameName || player.name || '';
        const tag = player.playerTag || player.tag || '';
        const searchTermLower = playerFilters.searchTerm.toLowerCase();
        return (
          (name.toLowerCase().includes(searchTermLower) ||
            tag.toLowerCase().includes(searchTermLower)) &&
          (playerFilters.role === 'all' || player.role === playerFilters.role) &&
          (player.reputation ?? 0) >= playerFilters.reputation &&
          player.thLevel >= playerFilters.thLevel
        );
      })
      .sort((a: Player, b: Player) => (b.reputation || 0) - (a.reputation || 0));
  }, [allPlayers, playerFilters]);

  const publicClansDataSource = publicClansCache;

  // Data yang akan ditampilkan (setelah dipaginasi)
  const clansToShow = useMemo(
    () => filteredClans.slice(0, visibleClansCount),
    [filteredClans, visibleClansCount],
  );
  const playersToShow = useMemo(
    () => filteredPlayers.slice(0, visiblePlayersCount),
    [filteredPlayers, visiblePlayersCount],
  );
  const publicClansToShow = useMemo(
    () => publicClansDataSource.slice(0, visiblePublicClansCount),
    [publicClansDataSource, visiblePublicClansCount],
  );

  // Tampilkan tombol "Load More"
  const showLoadMoreClans = visibleClansCount < filteredClans.length;
  const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;
  const showLoadMorePublicClans =
    visiblePublicClansCount < publicClansDataSource.length;

  // Data untuk tab klan publik (logika dari file asli)
  const clansToDisplayPublic = useMemo(() => {
    if (publicClanResult) {
      return [publicClanResult];
    }
    if (publicClanTag.trim() && !publicSearchError) {
      return [];
    }
    return publicClansToShow;
  }, [publicClanResult, publicClanTag, publicSearchError, publicClansToShow]);
  // --- [AKHIR MEMOIZED LOGIC] ---

  // --- [HANDLER FUNCTIONS] ---
  // (Semua handler tetap di sini)
  const handleClanFilterChange = (newFilters: ManagedClanFilters) => {
    setIsFiltering(true);
    setVisibleClansCount(ITEMS_PER_LOAD);
    setTimeout(() => {
      setClanFilters(newFilters);
      setIsFiltering(false);
    }, 50);
  };

  const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
    setIsFiltering(true);
    setVisiblePlayersCount(ITEMS_PER_LOAD);
    setTimeout(() => {
      setPlayerFilters(newFilters);
      setIsFiltering(false);
    }, 50);
  };

  const handleLoadMoreClans = () => {
    setVisibleClansCount((prevCount) => prevCount + ITEMS_PER_LOAD);
  };

  const handleLoadMorePlayers = () => {
    setVisiblePlayersCount((prevCount) => prevCount + ITEMS_PER_LOAD);
  };

  const handleLoadMorePublicClans = () => {
    setVisiblePublicClansCount((prevCount) => prevCount + ITEMS_PER_LOAD);
  };

  const handlePublicClanSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const rawTag = publicClanTag.toUpperCase().trim();
      if (!rawTag) {
        setPublicClanResult(null);
        setPublicSearchError(null);
        setVisiblePublicClansCount(ITEMS_PER_LOAD);
        return;
      }

      console.log('[handlePublicClanSearch] Starting tag search...');
      setIsSearchingPublicClan(true);
      setPublicSearchError(null);
      setPublicClanResult(null);

      const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
      const encodedTag = encodeURIComponent(tagToSearch);

      try {
        const response = await fetch(
          `/api/coc/search-clan?clanTag=${encodedTag}`,
        );
        let result: any;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error(
            `Failed to parse response from server. Status: ${response.status}`,
          );
        }

        if (!response.ok) {
          const errorMessage =
            result.error ||
            result.message ||
            'Gagal mengambil data klan publik.';
          setPublicSearchError(
            response.status === 404
              ? `Klan dengan tag ${tagToSearch} tidak ditemukan di CoC API.`
              : errorMessage,
          );
          return;
        }

        if (result && result.clan) {
          setPublicClanResult(result.clan);
        } else {
          setPublicSearchError('Format respons dari server tidak valid.');
        }
      } catch (error) {
        setPublicSearchError(
          (error instanceof Error ? error.message : String(error)) ||
            'Terjadi kesalahan saat mencari klan.',
        );
      } finally {
        setIsSearchingPublicClan(false);
        console.log('[handlePublicClanSearch] Tag search finished.');
      }
    },
    [publicClanTag],
  );

  // --- [HANDLER BARU UNTUK TAB] ---
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    // Reset semua state filter dan pagination saat berganti tab
    setClanFilters({
      searchTerm: '',
      vision: 'all',
      reputation: 0, // [PERBAIKAN] Ganti 3.0 ke 0
      thLevel: 0,
    });
    setPlayerFilters({
      searchTerm: '',
      role: 'all',
      reputation: 0, // [PERBAIKAN] Ganti 3.0 ke 0 (untuk filter pemain)
      thLevel: 0,
    });
    setPublicClanTag('');
    setPublicSearchError(null);
    setPublicClanResult(null);
    setVisibleClansCount(ITEMS_PER_LOAD);
    setVisiblePlayersCount(ITEMS_PER_LOAD);
    setVisiblePublicClansCount(ITEMS_PER_LOAD);
  }, []); // Dependensi kosong karena hanya setter state
  // --- [AKHIR HANDLER FUNCTIONS] ---

  // =========================================================================
  // RENDER LOGIC
  // =========================================================================

  // --- [MAIN RETURN (REFACTORED)] ---
  return (
    <>
      {/* 1. Render Header Statis */}
      <TeamHubHeader />

      <div className="container mx-auto space-y-8 p-4 md:p-8">
        {/* 2. Render Navigasi Tab */}
        <TeamHubTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* 3. Render Konten Tab yang Aktif */}
        {activeTab === 'publicClans' ? (
          // --- Konten Tab Klan Publik (Tanpa Sidebar) ---
          <PublicClansTab
            publicClanTag={publicClanTag}
            onPublicClanTagChange={setPublicClanTag}
            onSearchSubmit={handlePublicClanSearch}
            isSearching={isSearchingPublicClan}
            searchError={publicSearchError}
            clansToDisplay={clansToDisplayPublic}
            isSearchResult={!!publicClanResult} // True jika kita sedang menampilkan hasil tag search
            totalCacheCount={publicClansDataSource.length}
            // Logika 'showLoadMore' dari file asli
            showLoadMore={
              !publicClanResult &&
              !publicClanTag.trim() &&
              showLoadMorePublicClans
            }
            onLoadMore={handleLoadMorePublicClans}
            visibleCount={visiblePublicClansCount}
          />
        ) : (
          // --- Konten Tab Tim Clashub & Pemain (Dengan Sidebar) ---
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:items-start">
            {/* 3a. Render Sidebar Filter */}
            <TeamHubFilterBar
              activeTab={activeTab}
              clanFilters={clanFilters}
              onClanFilterChange={handleClanFilterChange as any}
              playerFilters={playerFilters}
              onPlayerFilterChange={handlePlayerFilterChange as any}
            />

            {/* 3b. Render Konten Utama (Hasil Filter) */}
            <div className="lg:col-span-3 card-stone p-6 min-h-[50vh] rounded-lg">
              {activeTab === 'clashubTeams' && (
                <ClashubTeamsTab
                  isFiltering={isFiltering}
                  filteredClans={filteredClans} // <-- [PERBAIKAN] Data sudah berisi rating
                  clansToShow={clansToShow} // <-- [PERBAIKAN] Data sudah berisi rating
                  showLoadMoreClans={showLoadMoreClans}
                  onLoadMoreClans={handleLoadMoreClans}
                />
              )}
              {activeTab === 'players' && (
                <PlayersTab
                  isFiltering={isFiltering}
                  filteredPlayers={filteredPlayers}
                  playersToShow={playersToShow}
                  showLoadMorePlayers={showLoadMorePlayers}
                  onLoadMorePlayers={handleLoadMorePlayers}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default TeamHubClient;