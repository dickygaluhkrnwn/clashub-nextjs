'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types';
// PERBAIKAN 1: Update import path untuk filter
import TeamHubFilter from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { Button } from '@/app/components/ui/Button';
import { ShieldIcon, UserIcon, GlobeIcon, SearchIcon, ClockIcon, AlertTriangleIcon, RefreshCwIcon, StarIcon } from '@/app/components/icons';
import Link from 'next/link';

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6;

// =========================================================================
// 1. KOMPONEN KARTU KLAN PUBLIK
// =========================================================================
interface PublicClanCardProps {
    clan: PublicClanIndex;
}

const PublicClanCard = ({ clan }: PublicClanCardProps) => (
    // Kartu Klan Publik dengan border
    <div className="card-stone p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border border-coc-gold-dark/30 hover:border-coc-gold transition-all duration-200 rounded-lg">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <img // Menggunakan img tag untuk kemudahan error handling fallback
                src={clan.badgeUrls?.large || '/images/clan-badge-placeholder.png'}
                alt={`${clan.name} Badge`}
                className="w-14 h-14 rounded-full border-2 border-coc-gold-dark flex-shrink-0"
                onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/clan-badge-placeholder.png';
                }}
            />
            <div>
                <h3 className="text-xl font-clash text-white">{clan.name}</h3>
                <p className="text-xs text-coc-gold-light font-mono">{clan.tag}</p>
                <p className="text-sm text-gray-400">Level {clan.clanLevel} | {clan.memberCount} Anggota</p>
            </div>
        </div>
        <Link href={`/clan/${encodeURIComponent(clan.tag)}`} passHref className="w-full sm:w-auto">
             <Button variant="secondary" size="sm" className="w-full sm:w-auto">Lihat Profil</Button>
        </Link>
    </div>
);

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


const TeamHubClient = ({ initialClans, initialPlayers, initialPublicClans }: TeamHubClientProps) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');
    const [allClans] = useState<ManagedClan[]>(initialClans);
    const [allPlayers] = useState<Player[]>(initialPlayers);
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Cache diurutkan berdasarkan level klan (descending)
    const [publicClansCache] = useState<PublicClanIndex[]>(() =>
        [...initialPublicClans].sort((a, b) => (b.clanLevel || 0) - (a.clanLevel || 0))
    );

    const [visibleClansCount, setVisibleClansCount] = useState(ITEMS_PER_LOAD);
    const [visiblePlayersCount, setVisiblePlayersCount] = useState(ITEMS_PER_LOAD);
    const [visiblePublicClansCount, setVisiblePublicClansCount] = useState(ITEMS_PER_LOAD);

    const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({
        searchTerm: '',
        vision: 'all',
        reputation: 3.0,
        thLevel: 9,
    });
    const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
        searchTerm: '',
        role: 'all',
        reputation: 3.0,
        thLevel: 9,
    });

    // States for Public Clan Tag Search
    const [publicClanTag, setPublicClanTag] = useState('');
    const [publicClanResult, setPublicClanResult] = useState<PublicClanIndex | null>(null);
    const [isSearchingPublicClan, setIsSearchingPublicClan] = useState(false);
    const [publicSearchError, setPublicSearchError] = useState<string | null>(null);


    const filteredClans = useMemo(() => {
        return allClans.filter(clan => {
            const searchTermLower = clanFilters.searchTerm.toLowerCase();
            const visionMatch = clanFilters.vision === 'all' || clan.vision === clanFilters.vision;
            const clanName = clan.name ?? '';
            const clanTag = clan.tag ?? '';
            return (
                (clanName.toLowerCase().includes(searchTermLower) || clanTag.toLowerCase().includes(searchTermLower)) &&
                visionMatch &&
                clan.avgTh >= clanFilters.thLevel
            );
        });
    }, [allClans, clanFilters]);


    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
            const name = player.displayName || player.inGameName || player.name || '';
            const tag = player.playerTag || player.tag || '';
            const searchTermLower = playerFilters.searchTerm.toLowerCase();
            return (
                (name.toLowerCase().includes(searchTermLower) || tag.toLowerCase().includes(searchTermLower)) &&
                (playerFilters.role === 'all' || player.role === playerFilters.role) &&
                (player.reputation ?? 0) >= playerFilters.reputation &&
                player.thLevel >= playerFilters.thLevel
            );
        });
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
        setVisibleClansCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };

    const handleLoadMorePlayers = () => {
        setVisiblePlayersCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };

     const handleLoadMorePublicClans = () => {
         setVisiblePublicClansCount(prevCount => prevCount + ITEMS_PER_LOAD);
     };

    // Sliced data based on visibility count
    const clansToShow = useMemo(() => filteredClans.slice(0, visibleClansCount), [filteredClans, visibleClansCount]);
    const playersToShow = useMemo(() => filteredPlayers.slice(0, visiblePlayersCount), [filteredPlayers, visiblePlayersCount]);
    // Paginated cache data
    const publicClansToShow = useMemo(() => publicClansDataSource.slice(0, visiblePublicClansCount), [publicClansDataSource, visiblePublicClansCount]);


    // Determine if "Load More" button should be shown
    const showLoadMoreClans = visibleClansCount < filteredClans.length;
    const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;
    const showLoadMorePublicClans = visiblePublicClansCount < publicClansDataSource.length;


    // --- Public Clan Tag Search Logic ---
    const handlePublicClanSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const rawTag = publicClanTag.toUpperCase().trim();
        if (!rawTag) {
            // If search is cleared, reset to show cache view
            setPublicClanResult(null);
            setPublicSearchError(null);
            setVisiblePublicClansCount(ITEMS_PER_LOAD); // Reset pagination for cache
            return;
        }

        console.log("[handlePublicClanSearch] Starting tag search...");
        setIsSearchingPublicClan(true);
        setPublicSearchError(null);
        setPublicClanResult(null);

        const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        const encodedTag = encodeURIComponent(tagToSearch);

        try {
            const response = await fetch(`/api/coc/search-clan?clanTag=${encodedTag}`);
            let result: any;
            try { result = await response.json(); } catch (jsonError) { throw new Error(`Failed to parse response from server. Status: ${response.status}`); }

            if (!response.ok) {
                const errorMessage = result.error || result.message || 'Gagal mengambil data klan publik.';
                setPublicSearchError(response.status === 404 ? `Klan dengan tag ${tagToSearch} tidak ditemukan di CoC API.` : errorMessage);
                return;
            }

            if (result && result.clan) {
                setPublicClanResult(result.clan); // Set the specific result
            } else {
                 setPublicSearchError("Format respons dari server tidak valid.");
            }

        } catch (error) {
            setPublicSearchError((error instanceof Error ? error.message : String(error)) || 'Terjadi kesalahan saat mencari klan.');
        } finally {
            setIsSearchingPublicClan(false);
            console.log("[handlePublicClanSearch] Tag search finished.");
        }
    }, [publicClanTag]);

    // Determine which clans to display in the Public Clans tab (CACHE MODE)
    const clansToDisplayPublic = useMemo(() => {
        // 1. Jika ada hasil pencarian tag spesifik, tampilkan itu saja
        if (publicClanResult) { return [publicClanResult]; }
        // 2. Jika input tag aktif (ada di kolom) TAPI tidak ada hasil spesifik, tampilkan array kosong (loading/error)
        if (publicClanTag.trim() && !publicSearchError) { return []; } 
        // 3. Default: Tampilkan cache yang sudah dipaginasi
        return publicClansToShow; 
    }, [publicClanResult, publicClanTag, publicSearchError, publicClansToShow]);


    // --- Tab Button Component ---
    const TabButton = ({ tab, label, icon: Icon }: { tab: ActiveTab, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <button
            onClick={() => {
                setActiveTab(tab);
                // Reset states relevant to other tabs
                setClanFilters({ searchTerm: '', vision: 'all', reputation: 3.0, thLevel: 9 });
                setPlayerFilters({ searchTerm: '', role: 'all', reputation: 3.0, thLevel: 9 });
                setPublicClanTag(''); // Clear search tag
                setPublicSearchError(null);
                setPublicClanResult(null);
                // Reset pagination for all lists
                setVisibleClansCount(ITEMS_PER_LOAD);
                setVisiblePlayersCount(ITEMS_PER_LOAD);
                setVisiblePublicClansCount(ITEMS_PER_LOAD);
            }}
            className={`flex items-center gap-2 py-3 px-6 font-clash text-lg transition-all duration-200 whitespace-nowrap
                ${activeTab === tab ? 'bg-coc-gold-dark text-white border-b-4 border-coc-gold' : 'bg-coc-stone/50 text-gray-400 hover:bg-coc-stone/80 hover:text-white'}`}
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
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filter Column (Sidebar) */}
                    <div className="lg:col-span-1">
                        {activeTab === 'clashubTeams' && (
                            <TeamHubFilter filters={clanFilters} onFilterChange={handleClanFilterChange as any} />
                        )}
                        {activeTab === 'players' && (
                            <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange as any} />
                        )}
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-3 card-stone p-6 min-h-[50vh] rounded-lg">
                        {isFiltering ? (
                            <div className="text-center py-20">
                                <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                                <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
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
            <h2 className="text-3xl font-clash text-white">{filteredClans.length} Tim Internal Ditemukan</h2>
            {clansToShow.length === 0 ? (
                <p className="text-gray-400 text-center py-10">Tidak ada Tim Clashub yang cocok dengan filter Anda.</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {clansToShow.map(clan => (
                             // PERBAIKAN 2: Ganti link ManagedClan ke route baru
                             <Link key={clan.id} href={`/clan/internal/${clan.id}`} passHref>
                                  {/* Tim Card dengan border */}
                                  <div className="card-stone-light p-4 flex flex-col border border-coc-gold-dark/30 hover:border-coc-gold transition-all duration-200 cursor-pointer rounded-lg">
                                       <h3 className="text-xl font-clash text-white">{clan.name} <span className="text-coc-gold text-lg">({clan.tag})</span></h3>
                                       <p className="text-sm text-gray-400">Visi: {clan.vision} | Avg TH: {clan.avgTh}</p>
                                  </div>
                             </Link>
                        ))}
                    </div>
                    {showLoadMoreClans && (
                        <div className="text-center pt-6">
                            <Button variant="secondary" size="lg" onClick={handleLoadMoreClans}>
                                Muat Lebih Banyak ({filteredClans.length - visibleClansCount} Tersisa)
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // Render Player Cards (UI sudah diperbaiki)
    const renderPlayers = () => (
         <div className="space-y-6">
             <h2 className="text-3xl font-clash text-white">{filteredPlayers.length} Pemain Ditemukan</h2>
             {playersToShow.length === 0 ? (
                 <p className="text-gray-400 text-center py-10">Tidak ada Pemain yang cocok dengan filter Anda.</p>
             ) : (
                 <>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {playersToShow.map(player => (
                              <Link key={player.id} href={`/player/${player.id}`} passHref>
                                   {/* Card Pemain dengan border dan avatar */}
                                   <div className="card-stone-light p-4 flex items-center gap-4 border border-coc-gold-dark/30 hover:border-coc-gold transition-all duration-200 cursor-pointer rounded-lg">
                                       <Image
                                           src={player.avatarUrl || '/images/placeholder-avatar.png'}
                                           alt={`${player.displayName || player.name}'s Avatar`}
                                           width={56} // Ukuran avatar 56x56
                                           height={56}
                                           className="w-14 h-14 rounded-full border-2 border-coc-gold-dark flex-shrink-0"
                                       />
                                       <div className="flex-grow">
                                            <h3 className="text-lg font-clash text-white leading-tight">{player.displayName || player.name}</h3>
                                            <p className="text-coc-gold text-sm font-mono truncate">{player.playerTag || 'No Tag'}</p>
                                            <div className="flex items-center text-xs text-gray-400 mt-1 gap-2 flex-wrap">
                                                <span>TH: {player.thLevel || '?'}</span>
                                                <span className="capitalize">Role: {player.role || 'N/A'}</span>
                                                {/* Menampilkan Reputasi jika ada */}
                                                {player.reputation != null && (
                                                    <span className="flex items-center gap-0.5">
                                                        <StarIcon className="h-3 w-3 text-coc-gold"/> {player.reputation.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                       </div>
                                   </div>
                              </Link>
                         ))}
                     </div>
                     {showLoadMorePlayers && (
                         <div className="text-center pt-6">
                             <Button variant="secondary" size="lg" onClick={handleLoadMorePlayers}>
                                 Muat Lebih Banyak ({filteredPlayers.length - visiblePlayersCount} Tersisa)
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
                 <h2 className="text-3xl font-clash text-white mb-4">Pencarian Klan Publik CoC</h2>
                 <form onSubmit={handlePublicClanSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                     <div className="flex-grow">
                          <label htmlFor="public-clan-tag-search" className="block text-sm font-bold text-gray-300 mb-2 font-sans">Cari berdasarkan Tag</label>
                          <input id="public-clan-tag-search" type="text" placeholder="Masukkan #CLANTAG (cth: #2G8PU0GLJ)" value={publicClanTag} onChange={(e) => setPublicClanTag(e.target.value)}
                              className="w-full p-3 bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md text-white placeholder-gray-500 font-sans focus:outline-none focus:border-coc-gold"/>
                     </div>
                     <Button type="submit" variant="primary" disabled={isSearchingPublicClan} className={`w-full sm:w-auto flex-shrink-0 ${isSearchingPublicClan ? 'animate-pulse' : ''}`}>
                         <SearchIcon className={`h-5 w-5 mr-2 ${isSearchingPublicClan ? 'hidden' : 'inline'}`} />
                         {isSearchingPublicClan ? 'Mencari...' : 'Cari Tag'}
                     </Button>
                 </form>
            </div>

            {/* Area Hasil & Cache */}
            <div className="card-stone p-6 min-h-[40vh] space-y-4 rounded-lg">
                 {isSearchingPublicClan && ( // Tampilkan loading HANYA saat search by tag
                     <div className="text-center py-20">
                         <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                         <h2 className="text-xl font-clash text-coc-gold">Mencari klan berdasarkan tag...</h2>
                     </div>
                 )}
                 {publicSearchError && !isSearchingPublicClan && publicClanTag.trim() && ( // Tampilkan error jika ada dan tag tidak kosong
                     <div className="p-4 bg-coc-red/10 border border-coc-red/50 text-coc-red rounded-lg flex items-center gap-3">
                         <AlertTriangleIcon className="h-6 w-6"/>
                         <span className="font-sans">{publicSearchError}</span>
                     </div>
                 )}

                 {/* Tampilkan hasil (pencarian tag atau cache) */}
                 {!isSearchingPublicClan && clansToDisplayPublic.length > 0 && (
                     <>
                         <h3 className="text-2xl font-clash text-white pb-2 border-b border-coc-gold-dark/30">
                              {publicClanResult ? 'Hasil Pencarian Tag' : `Daftar Klan Publik (Cache - ${publicClansDataSource.length} total)`}
                         </h3>
                         <div className="grid grid-cols-1 gap-4">
                             {clansToDisplayPublic.map(clan => (
                                 <PublicClanCard key={clan.tag} clan={clan} />
                             ))}
                         </div>
                         {/* Tombol Load More untuk Cache (jika tidak ada hasil search tag) */}
                         {!publicClanResult && !publicClanTag.trim() && showLoadMorePublicClans && (
                              <div className="text-center pt-6">
                                  <Button variant="secondary" size="lg" onClick={handleLoadMorePublicClans}>
                                      Muat Lebih Banyak ({publicClansDataSource.length - visiblePublicClansCount} Tersisa)
                                  </Button>
                              </div>
                         )}
                     </>
                 )}

                 {/* Pesan jika tidak ada hasil */}
                 {!isSearchingPublicClan && clansToDisplayPublic.length === 0 && !publicSearchError && (
                     <p className="text-gray-400 text-center py-10">
                         {publicClanTag.trim()
                             ? 'Tidak ada klan ditemukan untuk tag tersebut.' // Pesan jika search tag tapi 0 hasil
                             : 'Tidak ada klan publik di cache saat ini.' // Pesan default jika cache kosong
                         }
                     </p>
                 )}
                 {/* Footer Info */}
                 <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50">
                      <ClockIcon className="h-3 w-3 inline mr-1"/> Data klan publik di-cache dan diperbarui secara berkala.
                 </div>
            </div>
        </section>
    );

    // --- Main Return ---
    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            <header className="text-center">
                <h1 className="text-4xl font-clash text-white">Hub Komunitas Clashub</h1>
                <p className="text-lg text-gray-400 mt-2">Temukan Tim Clashub Internal, cari Klan Publik, atau rekrut Pemain baru.</p>
            </header>

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-coc-stone overflow-x-auto custom-scrollbar rounded-t-lg">
                <TabButton tab="clashubTeams" label="Tim Clashub" icon={ShieldIcon} />
                <TabButton tab="publicClans" label="Pencarian Klan" icon={GlobeIcon} />
                <TabButton tab="players" label="Cari Pemain" icon={UserIcon} />
            </div>

            {/* Render active tab content */}
            {renderContent()}
        </div>
    );
};

export default TeamHubClient;
