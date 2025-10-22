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
    vision: 'Kompetitif' | 'Kasual' | 'all';
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


const TeamHubClient = ({ initialTeams, initialPlayers }: TeamHubClientProps) => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    const [allTeams] = useState<Team[]>(initialTeams);
    const [allPlayers] = useState<Player[]>(initialPlayers);

    // BARU: State untuk loading filter
    const [isFiltering, setIsFiltering] = useState(false);

    const [teamFilters, setTeamFilters] = useState<TeamFilters>({
        searchTerm: '',
        vision: 'Kompetitif',
        reputation: 3.0,
        thLevel: 9,
    });
    const [playerFilters, setPlayerFilters] = useState<PlayerFilters>({
        searchTerm: '',
        role: 'all',
        reputation: 3.0,
        thLevel: 9,
    });

    const isLoading = false;
    const error = null;

    // BARU: Handler filter yang diperbarui untuk Team
    const handleTeamFilterChange = (newFilters: TeamFilters) => {
        setIsFiltering(true);
        setTimeout(() => {
            setTeamFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    // BARU: Handler filter yang diperbarui untuk Player
    const handlePlayerFilterChange = (newFilters: PlayerFilters) => {
        setIsFiltering(true);
        setTimeout(() => {
            setPlayerFilters(newFilters);
            setIsFiltering(false);
        }, 50); // Delay singkat untuk UX
    };

    const filteredTeams = useMemo(() => {
        return allTeams.filter(team => {
            const searchTermLower = teamFilters.searchTerm.toLowerCase();
            return (
                (team.name.toLowerCase().includes(searchTermLower) || team.tag.toLowerCase().includes(searchTermLower)) &&
                (teamFilters.vision === 'all' || team.vision === teamFilters.vision) &&
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


    return (
        <>
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex">
                <button
                    onClick={() => {
                        setActiveTab('teams');
                        // Reset filter lawan saat ganti tab
                        handlePlayerFilterChange({ searchTerm: '', role: 'all', reputation: 3.0, thLevel: 9 });
                    }}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'teams' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Tim
                </button>
                <button
                    onClick={() => {
                        setActiveTab('players');
                         // Reset filter lawan saat ganti tab
                        handleTeamFilterChange({ searchTerm: '', vision: 'Kompetitif', reputation: 3.0, thLevel: 9 });
                    }}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'players' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Pemain
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                <div className="lg:col-span-1">
                    {activeTab === 'teams'
                        // BARU: Gunakan handler filter baru
                        ? <TeamHubFilter filters={teamFilters} onFilterChange={handleTeamFilterChange} />
                        : <PlayerHubFilter filters={playerFilters} onFilterChange={handlePlayerFilterChange} />
                    }
                </div>

                <div className="lg:col-span-3">
                    {/* BARU: Tampilkan loading state saat memfilter */}
                    {isFiltering ? (
                        <div className="text-center py-20">
                           <CogsIcon className="h-10 w-10 text-coc-gold animate-spin mx-auto mb-4" />
                           <h2 className="text-xl text-coc-gold">Memfilter...</h2>
                       </div>
                    ) : isLoading ? (
                        // Loading awal (jika diperlukan lagi nanti)
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
                                    {filteredTeams.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10">Tidak ada tim yang cocok dengan filter Anda.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {filteredTeams.map(team => <TeamCard key={team.id} {...team} />)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'players' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredPlayers.length} Pemain Ditemukan</h1>
                                     {filteredPlayers.length === 0 ? (
                                         <p className="text-gray-400 text-center py-10">Tidak ada pemain yang cocok dengan filter Anda.</p>
                                     ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {filteredPlayers.map(player => (
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
                                </div>
                            )}

                            <div className="text-center mt-10">
                                {/* Tombol Muat Lebih Banyak tetap disabled sementara */}
                                <Button variant="secondary" size="lg" disabled={true}>Muat Lebih Banyak</Button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

export default TeamHubClient;

