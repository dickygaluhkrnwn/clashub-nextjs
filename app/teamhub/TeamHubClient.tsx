// File: app/teamhub/TeamHubClient.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types';
import TeamHubFilter from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { Button } from '@/app/components/ui/Button';
import { ShieldIcon, UserIcon, GlobeIcon, SearchIcon, ClockIcon, AlertTriangleIcon, RefreshCwIcon } from '@/app/components/icons';
import Link from 'next/link';

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6;

// =========================================================================
// 1. KOMPONEN KARTU KLAN PUBLIK (TIDAK BERUBAH)
// =========================================================================
interface PublicClanCardProps {
    clan: PublicClanIndex;
}

const PublicClanCard = ({ clan }: PublicClanCardProps) => (
    <div className="card-stone p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:border-coc-gold transition-all duration-200">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <img 
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
    initialPublicClans: PublicClanIndex[]; 
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
    const [publicClansCache] = useState<PublicClanIndex[]>(initialPublicClans);

    const [visibleClansCount, setVisibleClansCount] = useState(ITEMS_PER_LOAD); 
    const [visiblePlayersCount, setVisiblePlayersCount] = useState(ITEMS_PER_LOAD);
    
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
    
    const [publicClanTag, setPublicClanTag] = useState('');
    const [publicClanResult, setPublicClanResult] = useState<PublicClanIndex | null>(null);
    const [isSearching, setIsSearching] = useState(false);
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
                (5.0 >= clanFilters.reputation) &&
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
    
    const clansToShow = useMemo(() => filteredClans.slice(0, visibleClansCount), [filteredClans, visibleClansCount]);
    const playersToShow = useMemo(() => filteredPlayers.slice(0, visiblePlayersCount), [filteredPlayers, visiblePlayersCount]);

    const showLoadMoreClans = visibleClansCount < filteredClans.length;
    const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;

    const handlePublicClanSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const rawTag = publicClanTag.toUpperCase().trim();
        if (!rawTag) return;

        setIsSearching(true);
        setPublicSearchError(null);
        setPublicClanResult(null);
        
        const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        const encodedTag = encodeURIComponent(tagToSearch); 

        try {
            const response = await fetch(`/api/coc/search-clan?clanTag=${encodedTag}`);
            const result = await response.json();
            
            if (!response.ok) {
                const errorMessage = result.message || 'Gagal mengambil data klan publik.';
                if (response.status === 404) {
                    setPublicSearchError(`Klan dengan tag ${tagToSearch} tidak ditemukan di CoC API.`);
                } else {
                    setPublicSearchError(errorMessage);
                }
                return;
            }
            setPublicClanResult(result.clan);
        } catch (error) {
            console.error('Error fetching public clan:', error);
            setPublicSearchError((error as Error).message || 'Terjadi kesalahan saat mencari klan.');
        } finally {
            setIsSearching(false);
        }
    }, [publicClanTag]);

    const clansToDisplay = useMemo(() => {
        if (publicClanResult) {
            return [publicClanResult];
        }
        return publicClansCache; 
    }, [publicClanResult, publicClansCache]);

    const TabButton = ({ tab, label, icon: Icon }: { tab: ActiveTab, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <button
            onClick={() => { 
                setActiveTab(tab); 
                setClanFilters({ ...clanFilters, searchTerm: '' }); 
                setPlayerFilters({ ...playerFilters, searchTerm: '' });
                setPublicSearchError(null);
                setPublicClanResult(null); 
            }}
            className={`flex items-center gap-2 py-3 px-6 font-clash text-lg transition-all duration-200 
                ${activeTab === tab 
                    ? 'bg-coc-gold-dark text-white border-b-4 border-coc-gold' 
                    : 'bg-coc-stone/50 text-gray-400 hover:bg-coc-stone/80 hover:text-white'
                }`}
        >
            <Icon className="h-5 w-5" />
            {label}
        </button>
    );

    // =========================================================================
    // PERBAIKAN UTAMA: PISAHKAN LOGIKA RENDER UNTUK SETIAP KONTEN TAB
    // =========================================================================
    const renderContent = () => {
        // --- KONTEN UNTUK TAB DENGAN SIDEBAR (TIM & PEMAIN) ---
        if (activeTab === 'clashubTeams' || activeTab === 'players') {
            return (
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Kolom Filter (Sidebar) */}
                    <div className="lg:col-span-1">
                        {activeTab === 'clashubTeams' && (
                            <TeamHubFilter filters={clanFilters} onFilterChange={handleClanFilterChange as any} />
                        )}
                        {activeTab === 'players' && (
                            <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange as any} />
                        )}
                    </div>
                    
                    {/* Kolom Hasil */}
                    <div className="lg:col-span-3 card-stone p-6 min-h-[50vh]">
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
        
        // --- KONTEN UNTUK TAB PENCARIAN PUBLIK (LAYOUT BERBEDA) ---
        if (activeTab === 'publicClans') {
            return renderPublicClansSearch();
        }
        
        return null;
    };
    
    const renderClashubTeams = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-clash text-white">{filteredClans.length} Tim Internal Ditemukan</h2>
            {clansToShow.length === 0 ? (
                <p className="text-gray-400 text-center py-10">Tidak ada Tim Clashub yang cocok dengan filter Anda.</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {clansToShow.map(clan => (
                             <Link key={clan.id} href={`/team/${clan.id}`} passHref>
                                <div className="card-stone-light p-4 flex flex-col hover:border-coc-gold transition-all duration-200 cursor-pointer">
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
                                <div className="card-stone-light p-4 flex flex-col hover:border-coc-gold transition-all duration-200 cursor-pointer">
                                    <h3 className="text-xl font-clash text-white">{player.displayName || player.name}</h3>
                                    <p className="text-coc-gold text-lg font-mono">{player.playerTag}</p>
                                    <p className="text-sm text-gray-400">Role: {player.role} | TH: {player.thLevel}</p>
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
    
    const renderPublicClansSearch = () => (
        <section className="space-y-6">
            {/* Form Pencarian */}
            <div className="card-stone p-6">
                 <h2 className="text-3xl font-clash text-white mb-4">Pencarian Klan Publik CoC</h2>
                 <form onSubmit={handlePublicClanSearch} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Masukkan #CLANTAG (cth: #2G8PU0GLJ)"
                        value={publicClanTag}
                        onChange={(e) => setPublicClanTag(e.target.value)}
                        className="flex-grow p-3 bg-coc-stone/70 border border-coc-gold-dark/50 rounded-md text-white placeholder-gray-500 font-sans focus:outline-none focus:border-coc-gold"
                    />
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSearching || !publicClanTag}
                        className={`w-full sm:w-auto ${isSearching ? 'animate-pulse' : ''}`}
                    >
                        <SearchIcon className={`h-5 w-5 mr-2 ${isSearching ? 'hidden' : 'inline'}`} />
                        {isSearching ? 'Mencari...' : 'Cari Klan'}
                    </Button>
                </form>
            </div>

            {/* Area Hasil & Cache */}
            <div className="card-stone p-6 min-h-[40vh] space-y-4">
                 {publicSearchError && (
                    <div className="p-4 bg-coc-red/10 border border-coc-red/50 text-coc-red rounded-lg flex items-center gap-3">
                        <AlertTriangleIcon className="h-6 w-6"/>
                        <span className="font-sans">{publicSearchError}</span>
                    </div>
                )}
                
                {clansToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {clansToDisplay.map(clan => (
                            <PublicClanCard key={clan.tag} clan={clan} />
                        ))}
                    </div>
                ) : !isSearching && (
                     <p className="text-gray-400 text-center py-10">
                        {publicClanResult === null && !publicSearchError ? 'Daftar klan publik (cache) akan muncul di sini. Gunakan pencarian tag untuk hasil real-time.' : ''}
                    </p>
                )}
                 <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50">
                    <ClockIcon className="h-3 w-3 inline mr-1"/> Data klan publik di-cache dan diperbarui secara berkala.
                </div>
            </div>
        </section>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="text-center">
                <h1 className="text-4xl font-clash text-white">Hub Komunitas Clashub</h1>
                <p className="text-lg text-gray-400 mt-2">Temukan Tim Clashub Internal, cari Klan Publik, atau rekrut Pemain baru.</p>
            </header>

            <div className="flex border-b-2 border-coc-stone overflow-x-auto">
                <TabButton tab="clashubTeams" label="Tim Clashub" icon={ShieldIcon} />
                <TabButton tab="publicClans" label="Pencarian Klan" icon={GlobeIcon} />
                <TabButton tab="players" label="Cari Pemain" icon={UserIcon} />
            </div>
            
            {/* Panggil fungsi render utama untuk menampilkan konten yang sesuai */}
            {renderContent()}
        </div>
    );
};

export default TeamHubClient;