'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types';
// PERBAIKAN 1: Update import path untuk filter
import TeamHubFilter from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { Button } from '@/app/components/ui/Button';
import {
  ShieldIcon,
  UserIcon,
  GlobeIcon,
  SearchIcon,
  ClockIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  StarIcon,
} from '@/app/components/icons';
import Link from 'next/link';
// IMPORT BARU: Import PlayerCard dan TeamCard dari cards.tsx
import { PlayerCard, TeamCard } from '@/app/components/cards';

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6;

// =========================================================================
// 1. KOMPONEN KARTU KLAN PUBLIK (Disesuaikan agar konsisten dengan TeamCard)
// =========================================================================
interface PublicClanCardProps {
  clan: PublicClanIndex;
}

const PublicClanCard = ({ clan }: PublicClanCardProps) => {
  // Menghitung rata-rata TH sederhana (hanya untuk tampilan umum)
  const avgThDisplay =
    clan.memberCount > 0
      ? (clan.clanPoints / clan.memberCount / 100).toFixed(1)
      : 'N/A';

  // Link Klan Publik In-Game
  const cocProfileUrl = `/clan/${encodeURIComponent(clan.tag)}`;

  return (
    // Menggunakan gaya card-stone dan efek hover yang sama
    <div className="card-stone flex flex-col justify-between h-full p-5 transition-transform hover:scale-[1.02] duration-300">
      <div>
        <div className="flex items-start gap-4 mb-4 border-b border-coc-gold-dark/20 pb-4">
          <img // Menggunakan img tag untuk kemudahan error handling fallback
            src={clan.badgeUrls?.large || '/images/clan-badge-placeholder.png'}
            alt={`${clan.name} Badge`}
            // Ukuran disesuaikan agar sama dengan Image di TeamCard
            className="w-16 h-16 rounded-full border-3 border-coc-gold object-cover flex-shrink-0 shadow-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/clan-badge-placeholder.png';
            }}
          />
          <div className="flex-grow min-w-0">
            <h4 className="font-clash text-xl text-white leading-tight truncate">
              {clan.name}
            </h4>
            <p className="text-sm text-coc-gold-dark font-mono">{clan.tag}</p>
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1 font-sans">
              <ShieldIcon className="h-4 w-4 fill-current text-coc-gold" />
              <span>Level {clan.clanLevel}</span>
            </div>
          </div>
        </div>

        {/* Detail Statistik Klan Publik */}
        <div className="space-y-3 pt-4 font-sans text-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Anggota:</span>
            <span className="font-bold text-white">{clan.memberCount}/50</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Tipe Rekrutmen:</span>
            <span className="font-bold text-coc-green capitalize">
              {clan.type || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Poin Klan:</span>
            <span className="font-bold text-white">
              {clan.clanPoints?.toLocaleString() || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      {/* Tombol ke halaman Clan Publik */}
      <Link href={cocProfileUrl} className="mt-5">
        <Button variant="primary" className="w-full">
          Lihat Profil CoC
        </Button>
      </Link>
    </div>
  );
};

// =========================================================================
// 2. MAIN COMPONENT & LOGIC
// =========================================================================
interface TeamHubClientProps {
  initialClans: ManagedClan[];
  initialPlayers: Player[];
  initialPublicClans: PublicClanIndex[]; // Cache Klan Publik
}

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

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

const TeamHubClient = ({
  initialClans,
  initialPlayers,
  initialPublicClans,
}: TeamHubClientProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');
  const [allClans] = useState<ManagedClan[]>(initialClans);

  // FIX TS7022/TS2448/TS7006: Inisialisasi state dengan memetakan initialPlayers, bukan allPlayers (dirinya sendiri).
  const [allPlayers] = useState<Player[]>(
    initialPlayers.map((p: Player) => ({
      ...p,
      name: p.displayName || p.name,
    }))
  );

  const [isFiltering, setIsFiltering] = useState(false);

  // Cache diurutkan berdasarkan level klan (descending)
  const [publicClansCache] = useState<PublicClanIndex[]>(() =>
    [...initialPublicClans].sort(
      (a, b) => (b.clanLevel || 0) - (a.clanLevel || 0)
    )
  );

  const [visibleClansCount, setVisibleClansCount] = useState(ITEMS_PER_LOAD);
  const [visiblePlayersCount, setVisiblePlayersCount] =
    useState(ITEMS_PER_LOAD);
  const [visiblePublicClansCount, setVisiblePublicClansCount] =
    useState(ITEMS_PER_LOAD);

  const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({
    searchTerm: '',
    vision: 'all',
    reputation: 3.0,
    // --- [PERBAIKAN BUG CLAN HUB v2] ---
    // Mengubah thLevel default dari 1 ke 0 agar klan dengan avgTh: 0 ikut tampil
    thLevel: 0,
    // --- [AKHIR PERBAIKAN v2] ---
  });
  const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
    searchTerm: '',
    role: 'all',
    reputation: 3.0,
    // --- [PERBAIKAN BUG CLAN HUB v2] ---
    // Mengubah thLevel default dari 1 ke 0 agar pemain TH rendah ikut tampil
    thLevel: 0,
    // --- [AKHIR PERBAIKAN v2] ---
  });

  // States for Public Clan Tag Search
  const [publicClanTag, setPublicClanTag] = useState('');
  const [publicClanResult, setPublicClanResult] =
    useState<PublicClanIndex | null>(null);
  const [isSearchingPublicClan, setIsSearchingPublicClan] = useState(false);
  const [publicSearchError, setPublicSearchError] = useState<string | null>(
    null
  );

  const filteredClans = useMemo(() => {
    return allClans
      .filter((clan: ManagedClan) => {
        const searchTermLower = clanFilters.searchTerm.toLowerCase();
        const visionMatch =
          clanFilters.vision === 'all' || clan.vision === clanFilters.vision;
        const clanName = clan.name ?? '';
        const clanTag = clan.tag ?? '';
        return (
          (clanName.toLowerCase().includes(searchTermLower) ||
            clanTag.toLowerCase().includes(searchTermLower)) &&
          visionMatch &&
          clan.avgTh >= clanFilters.thLevel
        );
      })
      .sort((a: ManagedClan, b: ManagedClan) => b.avgTh - a.avgTh); // Sortir ManagedClan berdasarkan TH tertinggi
  }, [allClans, clanFilters]);

  const filteredPlayers = useMemo(() => {
    return allPlayers
      .filter((player: Player) => {
        // FIX TS7006
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
      .sort((a: Player, b: Player) => (b.reputation || 0) - (a.reputation || 0)); // FIX TS7006
  }, [allPlayers, playerFilters]);

  // Data source untuk klan publik adalah cache
  const publicClansDataSource = publicClansCache;

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

  // Sliced data based on visibility count
  const clansToShow = useMemo(
    () => filteredClans.slice(0, visibleClansCount),
    [filteredClans, visibleClansCount]
  );
  const playersToShow = useMemo(
    () => filteredPlayers.slice(0, visiblePlayersCount),
    [filteredPlayers, visiblePlayersCount]
  );
  // Paginated cache data
  const publicClansToShow = useMemo(
    () => publicClansDataSource.slice(0, visiblePublicClansCount),
    [publicClansDataSource, visiblePublicClansCount]
  );

  // Determine if "Load More" button should be shown
  const showLoadMoreClans = visibleClansCount < filteredClans.length;
  const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;
  const showLoadMorePublicClans =
    visiblePublicClansCount < publicClansDataSource.length;

  // --- Public Clan Tag Search Logic ---
  const handlePublicClanSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const rawTag = publicClanTag.toUpperCase().trim();
      if (!rawTag) {
        // If search is cleared, reset to show cache view
        setPublicClanResult(null);
        setPublicSearchError(null);
        setVisiblePublicClansCount(ITEMS_PER_LOAD); // Reset pagination for cache
        return;
      }

      console.log('[handlePublicClanSearch] Starting tag search...');
      setIsSearchingPublicClan(true);
      setPublicSearchError(null);
      setPublicClanResult(null);

      const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
      const encodedTag = encodeURIComponent(tagToSearch);

      try {
        const response = await fetch(`/api/coc/search-clan?clanTag=${encodedTag}`);
        let result: any;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error(
            `Failed to parse response from server. Status: ${response.status}`
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
              : errorMessage
          );
          return;
        }

        if (result && result.clan) {
          setPublicClanResult(result.clan); // Set the specific result
        } else {
          setPublicSearchError('Format respons dari server tidak valid.');
        }
      } catch (error) {
        setPublicSearchError(
          (error instanceof Error ? error.message : String(error)) ||
            'Terjadi kesalahan saat mencari klan.'
        );
      } finally {
        setIsSearchingPublicClan(false);
        console.log('[handlePublicClanSearch] Tag search finished.');
      }
    },
    [publicClanTag]
  );

  // Determine which clans to display in the Public Clans tab (CACHE MODE)
  const clansToDisplayPublic = useMemo(() => {
    // 1. Jika ada hasil pencarian tag spesifik, tampilkan itu saja
    if (publicClanResult) {
      return [publicClanResult];
    }
    // 2. Jika input tag aktif (ada di kolom) TAPI tidak ada hasil spesifik, tampilkan array kosong (loading/error)
    if (publicClanTag.trim() && !publicSearchError) {
      return [];
    }
    // 3. Default: Tampilkan cache yang sudah dipaginasi
    return publicClansToShow;
  }, [publicClanResult, publicClanTag, publicSearchError, publicClansToShow]);

  // --- Tab Button Component ---
  const TabButton = ({
    tab,
    label,
    icon: Icon,
  }: {
    tab: ActiveTab;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
  }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        // Reset states relevant to other tabs
        setClanFilters({
          searchTerm: '',
          vision: 'all',
          reputation: 3.0,
          thLevel: 0, // [PERBAIKAN v2] Pastikan reset juga ke 0
        });
        setPlayerFilters({
          searchTerm: '',
          role: 'all',
          reputation: 3.0,
          thLevel: 0, // [PERBAIKAN v2] Pastikan reset juga ke 0
        });
        setPublicClanTag(''); // Clear search tag
        setPublicSearchError(null);
        setPublicClanResult(null);
        // Reset pagination for all lists
        setVisibleClansCount(ITEMS_PER_LOAD);
        setVisiblePlayersCount(ITEMS_PER_LOAD);
        setVisiblePublicClansCount(ITEMS_PER_LOAD);
      }}
      className={`flex items-center gap-2 py-3 px-6 font-clash text-lg transition-all duration-200 whitespace-nowrap
    
            ${
        activeTab === tab
          ? 'bg-coc-gold-dark text-white border-b-4 border-coc-gold'
          : 'bg-coc-stone/50 text-gray-400 hover:bg-coc-stone/80 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" /> {label}
    </button>
  );

  // =========================================================================
  // RENDER LOGIC SEPARATION
  // =========================================================================
  const renderContent = () => {
    // --- Content for Tabs with Sidebar (Teams & Players) ---
    if (activeTab === 'clashubTeams' || activeTab === 'players') {
      return (
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:items-start">
          {/* Filter Column (Sidebar) */}
          {/* The filter components themselves already have sticky positioning */}
          {/* PERBAIKAN: Menambahkan lg:self-start */}
          <div className="lg:col-span-1 lg:self-start">
            {activeTab === 'clashubTeams' && (
              <TeamHubFilter
                filters={clanFilters}
                onFilterChange={handleClanFilterChange as any}
              />
            )}
            {activeTab === 'players' && (
              <PlayerHubFilter
                filters={playerFilters}
                onFilterChange={handlePlayerFilterChange as any}
              />
            )}
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3 card-stone p-6 min-h-[50vh] rounded-lg">
            {isFiltering ? (
              <div className="text-center py-20">
                <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-clash text-coc-gold">
                  Memfilter...
                </h2>
              </div>
            ) : (
              <>
                {activeTab === 'clashubTeams' && renderClashubTeams()}
                {activeTab === 'players' && renderPlayers()}
              </>
            )}
          </div>
        </section>
      );
    }

    // --- Content for Public Search Tab (CACHE MODE) ---
    if (activeTab === 'publicClans') {
      return renderPublicClansContent();
    }

    return null;
  };

  // --- Render Functions for Each Tab's Content ---
  const renderClashubTeams = () => (
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
          {/* Menggunakan grid 3 kolom untuk TeamCard agar terlihat rapi */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clansToShow.map((clan: ManagedClan) => (
              // Menggunakan TeamCard yang sudah diperbaiki dari cards.tsx
              <TeamCard
                key={clan.id}
                id={clan.id}
                name={clan.name}
                tag={clan.tag}
                // Placeholder rating
                rating={5.0}
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
                onClick={handleLoadMoreClans}
              >
                Muat Lebih Banyak ({filteredClans.length - visibleClansCount}{' '}
                Tersisa)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Player Cards
  const renderPlayers = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-clash text-white">
        {filteredPlayers.length} Pemain Ditemukan
      </h2>
      {playersToShow.length === 0 ? (
        <p className="text-gray-400 text-center py-10">
          Tidak ada Pemain yang cocok dengan filter Anda.
        </p>
      ) : (
        <>
          {/* Menggunakan grid 3 kolom untuk PlayerCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {playersToShow.map((player: Player) => (
              // FIX TS7006
              // Menggunakan PlayerCard dari cards.tsx
              <PlayerCard
                key={player.id}
                id={player.id}
                name={player.displayName || player.name}
                tag={player.playerTag || player.tag}
                thLevel={player.thLevel}
                reputation={player.reputation || 5.0}
                role={player.role || 'Free Agent'}
                avatarUrl={player.avatarUrl}
              />
            ))}
          </div>
          {showLoadMorePlayers && (
            <div className="text-center pt-6">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLoadMorePlayers}
              >
                Muat Lebih Banyak ({filteredPlayers.length - visiblePlayersCount}{' '}
                Tersisa)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Render Konten Klan Publik (Mode Cache)
  const renderPublicClansContent = () => (
    <section className="space-y-6">
      {/* Search Form by Tag */}
      <div className="card-stone p-6 rounded-lg">
        <h2 className="text-3xl font-clash text-white mb-4">
          Pencarian Klan Publik CoC
        </h2>
        <form
          onSubmit={handlePublicClanSearch}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-grow">
            <label
              htmlFor="public-clan-tag-search"
              className="block text-sm font-bold text-gray-300 mb-2 font-sans"
            >
              Cari berdasarkan Tag
            </label>
            <input
              id="public-clan-tag-search"
              type="text"
              placeholder="Masukkan #CLANTAG (cth: #2G8PU0GLJ)"
              value={publicClanTag}
              onChange={(e) => setPublicClanTag(e.target.value)}
              className="w-full p-3 bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md text-white placeholder-gray-500 font-sans focus:outline-none focus:border-coc-gold"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isSearchingPublicClan}
            className={`w-full sm:w-auto flex-shrink-0 ${
              isSearchingPublicClan ? 'animate-pulse' : ''
            }`}
          >
            <SearchIcon
              className={`h-5 w-5 mr-2 ${
                isSearchingPublicClan ? 'hidden' : 'inline'
              }`}
            />
            {isSearchingPublicClan ? 'Mencari...' : 'Cari Tag'}
          </Button>
        </form>
      </div>

      {/* Area Hasil & Cache */}
      <div className="card-stone p-6 min-h-[40vh] space-y-4 rounded-lg">
        {isSearchingPublicClan && ( // Tampilkan loading HANYA saat search by tag
          <div className="text-center py-20">
            <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-clash text-coc-gold">
              Mencari klan berdasarkan tag...
            </h2>
          </div>
        )}
        {publicSearchError &&
          !isSearchingPublicClan &&
          publicClanTag.trim() && ( // Tampilkan error jika ada dan tag tidak kosong
            <div className="p-4 bg-coc-red/10 border border-coc-red/50 text-coc-red rounded-lg flex items-center gap-3">
              <AlertTriangleIcon className="h-6 w-6" />
              <span className="font-sans">{publicSearchError}</span>
            </div>
          )}

        {/* Tampilkan hasil (pencarian tag atau cache) */}
        {!isSearchingPublicClan && clansToDisplayPublic.length > 0 && (
          <>
            <h3 className="text-2xl font-clash text-white pb-2 border-b border-coc-gold-dark/30">
              {publicClanResult
                ? 'Hasil Pencarian Tag'
                : `Daftar Klan Publik (Cache - ${publicClansDataSource.length} total)`}
            </h3>
            {/* [PERBAIKAN UI] Grid dinamis: 1 kolom jika hasil search, 3 kolom jika cache */}
            <div
              className={`grid gap-6 ${
                publicClanResult
                  ? 'grid-cols-1'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              }`}
            >
              {clansToDisplayPublic.map((clan: PublicClanIndex) => (
                // Menggunakan PublicClanCard yang sudah disesuaikan
                <PublicClanCard key={clan.tag} clan={clan} />
              ))}
            </div>
            {/* Tombol Load More untuk Cache (jika tidak ada hasil search tag) */}
            {!publicClanResult &&
              !publicClanTag.trim() &&
              showLoadMorePublicClans && (
                <div className="text-center pt-6">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleLoadMorePublicClans}
                  >
                    Muat Lebih Banyak (
                    {publicClansDataSource.length - visiblePublicClansCount}{' '}
                    Tersisa)
                  </Button>
                </div>
              )}
          </>
        )}

        {/* Pesan jika tidak ada hasil */}
        {!isSearchingPublicClan &&
          clansToDisplayPublic.length === 0 &&
          !publicSearchError && (
            <p className="text-gray-400 text-center py-10">
              {publicClanTag.trim()
                ? 'Tidak ada klan ditemukan untuk tag tersebut.' // Pesan jika search tag tapi 0 hasil
                : 'Tidak ada klan publik di cache saat ini.' // Pesan default jika cache kosong
              }
            </p>
          )}
        {/* Footer Info */}
        <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50">
          <ClockIcon className="h-3 w-3 inline mr-1" /> Data klan publik
          di-cache dan diperbarui secara berkala.
        </div>
      </div>
    </section>
  );

  // --- Main Return ---
  return (
    // [PERBAIKAN HEADER]
    // 1. Menggunakan React Fragment (<>) sebagai wrapper level atas
    // 2. Menambahkan <section> banner baru di atas .container
    <>
      {/* [PERBAIKAN HEADER] Banner baru meniru app/page.tsx, menggunakan bg-teamhub-banner */}
      {/* [PERBAIKAN POSISI] Mengganti bg-center menjadi bg-top agar tidak terpotong */}
      <section className="relative h-[400px] bg-teamhub-banner bg-cover bg-top bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 p-4">
          {/* Mengambil teks dari <header> lama */}
          <h1 className="text-4xl md:text-5xl mb-4">Hub Komunitas Clashub</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Temukan Tim Clashub Internal, cari Klan Publik, atau rekrut Pemain
            baru.
          </p>
          {/* Tombol dihilangkan karena kita sudah berada di halaman ini */}
        </div>
      </section>

      {/* Konten halaman yang ada (dimulai dengan .container) */}
      {/* [PERBAIKAN HEADER] mt-10 dihapus dari container, karena banner sudah memberi jarak */}
      <div className="container mx-auto space-y-8 p-4 md:p-8">
        {/* [PERBAIKAN HEADER] <header> lama yang text-center DIHAPUS DARI SINI */}
        {/* <header className="text-center"> ... </header> */}

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-coc-stone overflow-x-auto custom-scrollbar rounded-t-lg">
          <TabButton
            tab="clashubTeams"
            label="Tim Clashub"
            icon={ShieldIcon}
          />
          <TabButton
            tab="publicClans"
            label="Pencarian Klan"
            icon={GlobeIcon}
          />
          <TabButton tab="players" label="Cari Pemain" icon={UserIcon} />
        </div>

        {/* Render active tab content */}
        {renderContent()}
      </div>
    </>
  );
};

export default TeamHubClient;