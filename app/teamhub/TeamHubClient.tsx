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
            return (
                (team.name.toLowerCase().includes(searchTermLower) || team.tag.toLowerCase().includes(searchTermLower)) &&
                visionMatch &&
                team.rating >= teamFilters.reputation &&
                team.avgTh >= teamFilters.thLevel
            );
        });
    }, [allTeams, teamFilters]);

    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
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
        }, 50);
    };

    const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
        setIsFiltering(true);
        setVisiblePlayersCount(ITEMS_PER_LOAD); // Reset pagination saat filter berubah
        setTimeout(() => {
            setPlayerFilters(newFilters);
            setIsFiltering(false);
        }, 50);
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
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => {
                        setActiveTab('teams');
                        // Reset filter & pagination lawan saat ganti tab
                        handlePlayerFilterChange({ searchTerm: '', role: 'all', reputation: 3.0, thLevel: 9 });
                        setVisiblePlayersCount(ITEMS_PER_LOAD);
                    }}
                    className={`px-6 py-3 font-supercell text-lg whitespace-nowrap transition-colors ${activeTab === 'teams' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Tim
                </button>
                <button
                    onClick={() => {
                        setActiveTab('players');
                         // Reset filter & pagination lawan saat ganti tab
                        handleTeamFilterChange({ searchTerm: '', vision: 'all', reputation: 3.0, thLevel: 9 }); // Default vision ke 'all' saat reset
                        setVisibleTeamsCount(ITEMS_PER_LOAD);
                    }}
                    className={`px-6 py-3 font-supercell text-lg whitespace-nowrap transition-colors ${activeTab === 'players' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Pemain
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                <div className="lg:col-span-1">
                    {activeTab === 'teams'
                        ? <TeamHubFilter filters={teamFilters} onFilterChange={handleTeamFilterChange} />
                        : <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange} />
                    }
                </div>

                <div className="lg:col-span-3">
                    {isFiltering ? (
                        <div className="text-center py-20">
                           <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                           <h2 className="text-xl text-coc-gold">Memfilter...</h2>
                       </div>
                    ) : isLoading ? (
                        <div className="text-center py-20">
                            <h2 className="text-2xl text-coc-gold animate-pulse">Memuat Data...</h2>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 card-stone p-6">
                            <h2 className="text-2xl text-coc-red">{error}</h2>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'teams' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredTeams.length} Tim Ditemukan</h1>
                                    {teamsToShow.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10 card-stone">Tidak ada tim yang cocok dengan filter Anda.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {/* Render teamsToShow */}
                                            {teamsToShow.map(team => <TeamCard key={team.id} {...team} />)}
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
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredPlayers.length} Pemain Ditemukan</h1>
                                     {playersToShow.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10 card-stone">Tidak ada pemain yang cocok dengan filter Anda.</p>
                                     ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                             {/* Render playersToShow */}
                                            {playersToShow.map(player => (
                                                <PlayerCard
                                                    key={player.id}
                                                    id={player.id}
                                                    name={player.displayName || player.name}
                                                    tag={player.playerTag || player.tag}
                                                    thLevel={player.thLevel}
                                                    reputation={player.reputation ?? 0}
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
