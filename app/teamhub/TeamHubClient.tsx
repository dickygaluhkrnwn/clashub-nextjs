'use client';

// Impor React (diperlukan untuk useState)
import React, { useState, useMemo, useEffect } from 'react';
import { TeamCard, PlayerCard } from "@/app/components/cards";
import TeamHubFilter from "@/app/components/filters/TeamHubFilter";
import PlayerHubFilter from "@/app/components/filters/PlayerHubFilter";
import { Button } from "@/app/components/ui/Button";
import { Team, Player, UserProfile } from '@/lib/types';
// Impor ikon untuk loading (opsional)
import { CogsIcon } from '@/app/components/icons';

export type TeamFilters = {
    searchTerm: string;
    vision: 'Kompetitif' | 'Kasual' | 'all'; // Tambahkan 'all' jika diperlukan filter reset
    reputation: number;
    thLevel: number;
};

export type PlayerFilters = {
    searchTerm: string;
    role: Player['role'] | 'all';
    reputation: number;
    thLevel: number;
};

interface TeamHubClientProps {
    initialTeams: Team[];
    initialPlayers: Player[];
}

// --- Konstanta Pagination ---
const ITEMS_PER_LOAD = 6; // Tampilkan 6 item per halaman/klik

const TeamHubClient = ({ initialTeams, initialPlayers }: TeamHubClientProps) => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    const [allTeams] = useState<Team[]>(initialTeams);
    const [allPlayers] = useState<Player[]>(initialPlayers);

    const [isFiltering, setIsFiltering] = useState(false);

    // --- State Pagination ---
    const [visibleTeamsCount, setVisibleTeamsCount] = useState(ITEMS_PER_LOAD);
    const [visiblePlayersCount, setVisiblePlayersCount] = useState(ITEMS_PER_LOAD);
    // --- End State Pagination ---

    const [teamFilters, setTeamFilters] = useState<TeamFilters>({
        searchTerm: '',
        vision: 'Kompetitif', // Default kompetitif
        reputation: 3.0,
        thLevel: 9,
    });
    const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
        searchTerm: '',
        role: 'all',
        reputation: 3.0,
        thLevel: 9,
    });

    const isLoading = false; // Asumsi data awal sudah dari server
    const error = null; // Asumsi tidak ada error awal

    // Fungsi filter (tidak berubah, hanya memfilter semua data)
     const filteredTeams = useMemo(() => {
        return allTeams.filter(team => {
            const searchTermLower = teamFilters.searchTerm.toLowerCase();
            // Pastikan vision filter 'all' berfungsi
            const visionMatch = teamFilters.vision === 'all' || team.vision === teamFilters.vision;
            
            // PERBAIKAN UTAMA: Tambahkan fallback string kosong (?? '') untuk menghindari error toLowerCase() pada null/undefined
            const teamName = team.name ?? '';
            const teamTag = team.tag ?? '';

            return (
                (teamName.toLowerCase().includes(searchTermLower) || teamTag.toLowerCase().includes(searchTermLower)) &&
                visionMatch &&
                team.rating >= teamFilters.reputation &&
                team.avgTh >= teamFilters.thLevel
            );
        });
    }, [allTeams, teamFilters]);

    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
            // Menggunakan nullish coalescing untuk fallback jika displayName/name null
            const name = player.displayName || player.name || '';
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

    // Handler filter diperbarui untuk mereset pagination
    const handleTeamFilterChange = (newFilters: TeamFilters) => {
        setIsFiltering(true);
        setVisibleTeamsCount(ITEMS_PER_LOAD); // Reset pagination saat filter berubah
        setTimeout(() => {
            setTeamFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
        setIsFiltering(true);
        setVisiblePlayersCount(ITEMS_PER_LOAD); // Reset pagination saat filter berubah
        setTimeout(() => {
            setPlayerFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    // --- Fungsi Load More ---
    const handleLoadMoreTeams = () => {
        setVisibleTeamsCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };

    const handleLoadMorePlayers = () => {
        setVisiblePlayersCount(prevCount => prevCount + ITEMS_PER_LOAD);
    };
    // --- End Fungsi Load More ---


    // --- Logika untuk menampilkan item sesuai pagination ---
    const teamsToShow = useMemo(() => filteredTeams.slice(0, visibleTeamsCount), [filteredTeams, visibleTeamsCount]);
    const playersToShow = useMemo(() => filteredPlayers.slice(0, visiblePlayersCount), [filteredPlayers, visiblePlayersCount]);
    // --- End Logika ---

    // --- Logika untuk menampilkan tombol Load More ---
    const showLoadMoreTeams = visibleTeamsCount < filteredTeams.length;
    const showLoadMorePlayers = visiblePlayersCount < filteredPlayers.length;
    // --- End Logika ---


    return (
        <>
            {/* Navigasi Tab */}
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => {
                        setActiveTab('teams');
                        // Reset filter & pagination lawan saat ganti tab
                        handlePlayerFilterChange({ searchTerm: '', role: 'all', reputation: 3.0, thLevel: 9 });
                        setVisiblePlayersCount(ITEMS_PER_LOAD);
                    }}
                    // Menggunakan font-clash untuk tombol tab
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'teams' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Tim
                </button>
                <button
                    onClick={() => {
                        setActiveTab('players');
                         // Reset filter & pagination lawan saat ganti tab
                        handleTeamFilterChange({ searchTerm: '', vision: 'all', reputation: 3.0, thLevel: 9 }); // Default vision ke 'all' saat reset
                        setVisibleTeamsCount(ITEMS_PER_LOAD);
                    }}
                     // Menggunakan font-clash untuk tombol tab
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'players' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Pemain
                </button>
            </div>

            {/* Layout Utama: Filter + Hasil */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Kolom Filter (Sidebar) */}
                <div className="lg:col-span-1">
                    {activeTab === 'teams'
                        ? <TeamHubFilter filters={teamFilters} onFilterChange={handleTeamFilterChange} />
                        : <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange} />
                    }
                </div>

                {/* Kolom Hasil Pencarian */}
                <div className="lg:col-span-3">
                    {/* State Loading/Filtering */}
                    {isFiltering ? (
                        <div className="text-center py-20 card-stone rounded-lg">
                           <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                           {/* Menggunakan font-clash untuk teks loading */}
                           <h2 className="text-xl font-clash text-coc-gold">Memfilter...</h2>
                       </div>
                    ) : isLoading ? ( // isLoading saat ini selalu false karena data dari server
                        <div className="text-center py-20 card-stone rounded-lg">
                             {/* Menggunakan font-clash untuk teks loading */}
                            <h2 className="text-2xl font-clash text-coc-gold animate-pulse">Memuat Data...</h2>
                        </div>
                    ) : error ? ( // error saat ini selalu null karena ditangani di server
                        <div className="text-center py-20 card-stone p-6 rounded-lg">
                            <h2 className="text-2xl text-coc-red">{error}</h2>
                        </div>
                    ) : (
                        // Konten Hasil
                        <>
                            {activeTab === 'teams' && (
                                <div>
                                    {/* Judul akan otomatis font-clash */}
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredTeams.length} Tim Ditemukan</h1>
                                    {teamsToShow.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10 card-stone rounded-lg">Tidak ada tim yang cocok dengan filter Anda.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {/* Render teamsToShow */}
                                            {teamsToShow.map(team => <TeamCard key={team.id} id={team.id} name={team.name} tag={team.tag} rating={team.rating} vision={team.vision} avgTh={team.avgTh} logoUrl={team.logoUrl} />)}
                                        </div>
                                    )}
                                     {/* Tombol Load More Teams */}
                                     {showLoadMoreTeams && (
                                        <div className="text-center mt-10">
                                            <Button variant="secondary" size="lg" onClick={handleLoadMoreTeams} disabled={isFiltering}>
                                                Muat Lebih Banyak Tim
                                            </Button>
                                        </div>
                                     )}
                                </div>
                            )}

                            {activeTab === 'players' && (
                                <div>
                                     {/* Judul akan otomatis font-clash */}
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredPlayers.length} Pemain Ditemukan</h1>
                                     {playersToShow.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10 card-stone rounded-lg">Tidak ada pemain yang cocok dengan filter Anda.</p>
                                     ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                             {/* Render playersToShow */}
                                            {playersToShow.map(player => (
                                                <PlayerCard
                                                    key={player.id}
                                                    id={player.id}
                                                    // Menggunakan nullish coalescing untuk fallback
                                                    name={player.displayName || player.name || 'Nama Tidak Diketahui'}
                                                    tag={player.playerTag || player.tag || '#?????'}
                                                    thLevel={player.thLevel}
                                                    reputation={player.reputation ?? 0} // Default reputasi 0 jika null
                                                    role={player.role}
                                                    avatarUrl={player.avatarUrl}
                                                />
                                            ))}
                                        </div>
                                     )}
                                      {/* Tombol Load More Players */}
                                     {showLoadMorePlayers && (
                                        <div className="text-center mt-10">
                                            <Button variant="secondary" size="lg" onClick={handleLoadMorePlayers} disabled={isFiltering}>
                                                Muat Lebih Banyak Pemain
                                            </Button>
                                        </div>
                                     )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

export default TeamHubClient;
