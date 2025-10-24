'use client';

import { useState, useCallback, useMemo } from 'react';
// PERBAIKAN #1: Mengganti Team dengan ManagedClan
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types';
// PERBAIKAN #2: Mengganti filter component lama dengan yang terbaru (tidak diubah di Client ini)
import TeamHubFilter from '@/app/components/filters/TeamHubFilter';
import PlayerHubFilter from '@/app/components/filters/PlayerHubFilter';
import { Button } from '@/app/components/ui/Button';
import { ShieldIcon, UserIcon, GlobeIcon, SearchIcon, ClockIcon, AlertTriangleIcon, CogsIcon } from '@/app/components/icons';
import Link from 'next/link';

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6;

// =========================================================================
// 1. KOMPONEN KARTU KLAN PUBLIK (BARU)
// =========================================================================

interface PublicClanCardProps {
    clan: PublicClanIndex;
}

const PublicClanCard = ({ clan }: PublicClanCardProps) => (
    <div className="card-stone p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:border-coc-gold transition-all duration-200">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Menggunakan URL Badge klan dari API */}
            <img 
                src={clan.badgeUrls?.large || '/images/clan-badge-placeholder.png'} 
                alt={`${clan.name} Badge`} 
                className="w-14 h-14 rounded-full border-2 border-coc-gold-dark flex-shrink-0"
                onError={(e) => {
                    // Penanganan error gambar
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
        {/* Link ke halaman profil klan publik baru: /clan/[clanTag] */}
        <Link href={`/clan/${encodeURIComponent(clan.tag)}`} passHref className="w-full sm:w-auto">
             <Button variant="secondary" size="sm" className="w-full sm:w-auto">Lihat Profil</Button>
        </Link>
    </div>
);


// =========================================================================
// 2. MAIN COMPONENT & LOGIC
// =========================================================================

interface TeamHubClientProps {
    // PERBAIKAN #3: Mengganti initialTeams menjadi initialClans DAN MENAMBAH initialPublicClans
    initialClans: ManagedClan[]; 
    initialPlayers: Player[];
    initialPublicClans: PublicClanIndex[]; // BARU: Data dari Server Component
}

type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

// Definisi ulang filter (karena Filter Component Anda memiliki struktur filter yang berbeda)
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


/**
 * @component TeamHubClient
 * Menampilkan tab untuk Tim Clashub, Pencarian Klan Publik, dan Pemain.
 */
const TeamHubClient = ({ initialClans, initialPlayers, initialPublicClans }: TeamHubClientProps) => { // Menerima prop baru
    // PERBAIKAN #4: Menambahkan tab 'publicClans'
    const [activeTab, setActiveTab] = useState<ActiveTab>('clashubTeams');
    const [allClans] = useState<ManagedClan[]>(initialClans); // Mengganti allTeams
    const [allPlayers] = useState<Player[]>(initialPlayers);
    const [isFiltering, setIsFiltering] = useState(false);

    // BARU: State untuk Klan Publik (berasal dari cache Server Component)
    const [publicClansCache] = useState<PublicClanIndex[]>(initialPublicClans);

    // --- State Pagination ---
    const [visibleClansCount, setVisibleClansCount] = useState(ITEMS_PER_LOAD); // Mengganti visibleTeamsCount
    const [visiblePlayersCount, setVisiblePlayersCount] = useState(ITEMS_PER_LOAD);
    
    // --- State Filter Internal ---
    const [clanFilters, setClanFilters] = useState<ManagedClanFilters>({ // Mengganti teamFilters
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
    
    // --- State Pencarian Publik (CARI TAG LANGSUNG) ---
    // Logika ini hanya untuk pencarian langsung (bukan filter/list)
    const [publicClanTag, setPublicClanTag] = useState('');
    const [publicClanResult, setPublicClanResult] = useState<PublicClanIndex | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [publicSearchError, setPublicSearchError] = useState<string | null>(null);

    // --- FUNGSI FILTER (ManagedClans) ---
    const filteredClans = useMemo(() => {
        return allClans.filter(clan => {
            const searchTermLower = clanFilters.searchTerm.toLowerCase();
            const visionMatch = clanFilters.vision === 'all' || clan.vision === clanFilters.vision;
            
            const clanName = clan.name ?? '';
            const clanTag = clan.tag ?? '';

            // Menggunakan avgTh dari ManagedClan
            return (
                (clanName.toLowerCase().includes(searchTermLower) || clanTag.toLowerCase().includes(searchTermLower)) &&
                visionMatch &&
                // PERBAIKAN: Menggunakan rating placeholder 5.0 (karena ManagedClan tidak punya rating)
                (5.0 >= clanFilters.reputation) && 
                clan.avgTh >= clanFilters.thLevel
            );
        });
    }, [allClans, clanFilters]); // Mengganti teamFilters

    // --- FUNGSI FILTER (Players) ---
    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
             // Menggunakan nullish coalescing untuk fallback jika displayName/name null
            const name = player.displayName || player.inGameName || player.name || ''; // Ditambahkan inGameName
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
    
    // --- HANDLER FILTER ---
    const handleClanFilterChange = (newFilters: ManagedClanFilters) => {
        setIsFiltering(true);
        setVisibleClansCount(ITEMS_PER_LOAD); // Reset pagination
        setTimeout(() => {
            setClanFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
        setIsFiltering(true);
        setVisiblePlayersCount(ITEMS_PER_LOAD); // Reset pagination
        setTimeout(() => {
            setPlayerFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    // --- FUNGSI LOAD MORE ---
    const handleLoadMoreClans = () => { // Mengganti handleLoadMoreTeams
        setVisibleClansCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };

    const handleLoadMorePlayers = () => {
        setVisiblePlayersCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };
    
    // --- Logika untuk menampilkan item sesuai pagination ---
    const clansToShow = useMemo(() => filteredClans.slice(0, visibleClansCount), [filteredClans, visibleClansCount]);
    const playersToShow = useMemo(() => filteredPlayers.slice(0, visiblePlayersCount), [filteredPlayers, visiblePlayersCount]);

    // --- Logika untuk menampilkan tombol Load More ---
    const showLoadMoreClans = visibleClansCount < filteredClans.length;
    const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;


    // --- FUNGSI PENCARIAN PUBLIK (Fase 2.3) ---
    const handlePublicClanSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        // Tag harus dimulai dengan '#'
        const rawTag = publicClanTag.toUpperCase().trim();
        if (!rawTag) return;

        setIsSearching(true);
        setPublicSearchError(null);
        setPublicClanResult(null);
        
        // Pastikan Tag diawali dengan '#'
        const tagToSearch = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
        const encodedTag = encodeURIComponent(tagToSearch); 

        try {
            const response = await fetch(`/api/coc/search-clan?clanTag=${encodedTag}`);
            const result = await response.json();
            
            if (!response.ok) {
                // Tangani error berdasarkan status dan body API Route
                const errorMessage = result.message || 'Gagal mengambil data klan publik.';
                if (response.status === 404) {
                    setPublicSearchError(`Klan dengan tag ${tagToSearch} tidak ditemukan.`);
                } else {
                    setPublicSearchError(errorMessage);
                }
                return;
            }

            // Jika sukses, set hasil pencarian
            setPublicClanResult(result.clan);
            
        } catch (error) {
            console.error('Error fetching public clan:', error);
            setPublicSearchError((error as Error).message || 'Terjadi kesalahan saat mencari klan.');
        } finally {
            setIsSearching(false);
        }
    }, [publicClanTag]);


    // Logika untuk menampilkan daftar klan publik (cache) atau hasil pencarian
    const clansToDisplay = useMemo(() => {
        // Jika pengguna sudah mencari klan secara manual, tampilkan hasilnya
        if (publicClanResult) {
            return [publicClanResult];
        }
        // Jika tidak ada pencarian spesifik, tampilkan cache dari SSR
        return publicClansCache; 
    }, [publicClanResult, publicClansCache]);

    // Render Tab Header
    const TabButton = ({ tab, label, icon: Icon }: { tab: ActiveTab, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
        <button
            onClick={() => { 
                setActiveTab(tab); 
                // Reset search/filter state saat pindah tab
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

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-4xl font-clash text-white text-center">Hub Komunitas Clashub</h1>
            <p className="text-center text-gray-400 font-sans">Temukan **Tim Clashub Internal**, cari **Klan Publik**, atau rekrut **Pemain**.</p>

            {/* Tab Navigation (Menggantikan Navigasi Tab lama) */}
            <div className="flex border-b-2 border-coc-stone overflow-x-auto">
                <TabButton tab="clashubTeams" label="Tim Clashub (Internal)" icon={ShieldIcon} />
                <TabButton tab="publicClans" label="Pencarian Klan Publik" icon={GlobeIcon} />
                <TabButton tab="players" label="Cari Pemain" icon={UserIcon} />
            </div>

            {/* Layout Utama: Filter + Hasil */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Kolom Filter (Sidebar) - Hanya tampilkan jika bukan tab Pencarian Publik */}
                <div className="lg:col-span-1">
                    {activeTab === 'clashubTeams' && (
                        <TeamHubFilter filters={clanFilters} onFilterChange={handleClanFilterChange as any} />
                    )}
                    {activeTab === 'players' && (
                        <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange as any} />
                    )}
                    {activeTab === 'publicClans' && (
                        <div className="card-stone p-4 space-y-4">
                            <h3 className="text-xl font-clash text-white border-b border-coc-gold/30 pb-2">Filter Cache Publik</h3>
                            <p className="text-sm text-gray-400">Saat ini, cache klan publik hanya menampilkan daftar klan terpopuler dari sinkronisasi terakhir. Gunakan pencarian tag untuk hasil *real-time*.</p>
                             {/* Placeholder Filter Publik (untuk masa depan) */}
                             <Button variant="secondary" disabled className="w-full">Filter Lanjutan (Segera Hadir)</Button>
                        </div>
                    )}
                </div>

                {/* Kolom Hasil Pencarian */}
                <div className={`lg:col-span-${activeTab === 'publicClans' ? '3' : '3'} ${activeTab === 'publicClans' ? 'lg:col-start-2 lg:col-span-2' : ''}`}>
                    <div className="card-stone p-6 min-h-[50vh] space-y-6">
                    {isFiltering ? (
                        <div className="text-center py-20">
                            <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
                        </div>
                    ) : (
                        <>
                            {/* -------------------- TAB: TIM CLASHUB -------------------- */}
                            {activeTab === 'clashubTeams' && (
                                <div className="space-y-6">
                                    <h1 className="text-3xl md:text-4xl font-clash mb-6 text-white">{filteredClans.length} Tim Internal Ditemukan</h1>
                                    
                                    {clansToShow.length === 0 ? (
                                        <p className="text-gray-400 text-center py-10 card-stone rounded-lg">Tidak ada Tim Clashub yang cocok dengan filter Anda.</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {clansToShow.map(clan => (
                                                    <Link key={clan.id} href={`/team/${clan.id}`} passHref>
                                                        <div className="card-stone p-4 flex flex-col hover:border-coc-gold transition-all duration-200 cursor-pointer">
                                                            <h3 className="text-xl font-clash text-white">{clan.name} <span className="text-coc-gold text-lg">({clan.tag})</span></h3>
                                                            <p className="text-sm text-gray-400">Visi: {clan.vision} | Avg TH: {clan.avgTh}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                            {/* Tombol Load More Clans */}
                                            {showLoadMoreClans && (
                                                <div className="text-center pt-6">
                                                    <Button variant="secondary" size="lg" onClick={handleLoadMoreClans} disabled={isFiltering}>
                                                        Muat Lebih Banyak Tim ({filteredClans.length - visibleClansCount} Tersisa)
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* -------------------- TAB: PENCARIAN KLAN PUBLIK -------------------- */}
                            {activeTab === 'publicClans' && (
                                <div className="space-y-6">
                                    <h1 className="text-3xl md:text-4xl font-clash mb-6 text-white">Pencarian Klan Publik CoC</h1>
                                    {/* Form Pencarian Langsung */}
                                    <form onSubmit={handlePublicClanSearch} className="flex flex-col sm:flex-row gap-4 p-4 card-stone/50 rounded-lg shadow-inner">
                                        <input
                                            type="text"
                                            placeholder="#CLANTAG (cth: #PQL2G08J) atau Nama Klan"
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
                                            {isSearching ? 'Mencari...' : 'Cari Klan CoC'}
                                        </Button>
                                    </form>

                                    {/* Hasil Pencarian & Cache List */}
                                    <div className="pt-4 space-y-4">
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
                                        ) : (
                                            <p className="text-gray-400 text-center py-10">
                                                {publicClanResult ? 'Klan tidak ditemukan berdasarkan Tag.' : 'Daftar Klan Publik terpopuler (cache) akan muncul di sini, atau lakukan pencarian langsung menggunakan Tag.'}
                                            </p>
                                        )}

                                    </div>
                                    <div className="text-xs text-gray-500 pt-4 border-t border-coc-stone/50">
                                        <ClockIcon className="h-3 w-3 inline mr-1"/> Data klan publik di-cache dan diperbarui secara berkala. Pencarian langsung menggunakan Tag adalah *real-time*.
                                    </div>
                                </div>
                            )}

                            {/* -------------------- TAB: CARI PEMAIN -------------------- */}
                            {activeTab === 'players' && (
                                <div className="space-y-6">
                                    <h1 className="text-3xl md:text-4xl font-clash mb-6 text-white">{filteredPlayers.length} Pemain Ditemukan</h1>

                                    {playersToShow.length === 0 ? (
                                        <p className="text-gray-400 text-center py-10 card-stone rounded-lg">Tidak ada Pemain Clashub yang cocok dengan filter Anda.</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {playersToShow.map(player => (
                                                    <Link key={player.id} href={`/player/${player.id}`} passHref>
                                                        <div className="card-stone p-4 flex flex-col hover:border-coc-gold transition-all duration-200 cursor-pointer">
                                                            {/* Placeholder card content for player */}
                                                            <h3 className="text-xl font-clash text-white">{player.displayName || player.name} <span className="text-coc-gold text-lg">({player.playerTag})</span></h3>
                                                            <p className="text-sm text-gray-400">Role: {player.role} | TH: {player.thLevel}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                            {/* Tombol Load More Players */}
                                            {showLoadMorePlayers && (
                                                <div className="text-center pt-6">
                                                    <Button variant="secondary" size="lg" onClick={handleLoadMorePlayers} disabled={isFiltering}>
                                                        Muat Lebih Banyak Pemain ({filteredPlayers.length - visiblePlayersCount} Tersisa)
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TeamHubClient;
