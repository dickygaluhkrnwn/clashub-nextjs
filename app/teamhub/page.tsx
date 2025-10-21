'use client';

import { useState, useEffect, useMemo } from 'react';
import { TeamCard, PlayerCard } from "@/app/components/cards";
import TeamHubFilter from "@/app/components/filters/TeamHubFilter";
import PlayerHubFilter from "@/app/components/filters/PlayerHubFilter";
import { Button } from "@/app/components/ui/Button";
import { Team, Player } from '@/lib/types';
import { getTeams, getPlayers } from '@/lib/firestore';

// Definisikan tipe untuk state filter agar lebih mudah dikelola
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

const TeamHubPage = () => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    
    // State untuk data mentah dari Firestore
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    
    // State untuk filter yang diangkat dari komponen anak
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

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDataForTab = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (activeTab === 'teams' && allTeams.length === 0) {
                    const fetchedTeams = await getTeams();
                    setAllTeams(fetchedTeams);
                } else if (activeTab === 'players' && allPlayers.length === 0) {
                    const fetchedPlayers = await getPlayers();
                    setAllPlayers(fetchedPlayers);
                }
            } catch (err) {
                console.error("Gagal mengambil data:", err);
                setError("Tidak dapat memuat data. Periksa koneksi internet Anda.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDataForTab();
    }, [activeTab, allTeams.length, allPlayers.length]);

    // Gunakan useMemo untuk memfilter data hanya saat data atau filter berubah
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
        // Logika filter untuk pemain
        return allPlayers.filter(player => {
            // PERBAIKAN: Tambahkan pengecekan keamanan dan akses properti yang benar ('displayName')
            // Kita menggunakan 'as any' untuk sementara agar bisa mengakses properti yang tidak ada di tipe 'Player'
            const name = (player as any).displayName || '';
            const tag = (player as any).playerTag || player.tag || '';

            const searchTermLower = playerFilters.searchTerm.toLowerCase();
            return (
                (name.toLowerCase().includes(searchTermLower) || tag.toLowerCase().includes(searchTermLower)) &&
                (playerFilters.role === 'all' || player.role === playerFilters.role) &&
                player.reputation >= playerFilters.reputation &&
                player.thLevel >= playerFilters.thLevel
            );
        });
    }, [allPlayers, playerFilters]);


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex">
                <button 
                    onClick={() => setActiveTab('teams')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'teams' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Tim
                </button>
                <button 
                    onClick={() => setActiveTab('players')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'players' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Pemain
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <div className="lg:col-span-1">
                    {/* Mengirim state filter dan fungsi updater sebagai props */}
                    {activeTab === 'teams' 
                        ? <TeamHubFilter filters={teamFilters} onFilterChange={setTeamFilters} /> 
                        : <PlayerHubFilter filters={playerFilters} onFilterChange={setPlayerFilters} />
                    }
                </div>

                <div className="lg:col-span-3">
                    {isLoading ? (
                        <div className="text-center py-20">
                            <h2 className="text-2xl text-coc-gold animate-pulse">Memuat Data...</h2>
                        </div>
                    ) : error ? (
                         <div className="text-center py-20 card-stone">
                            <h2 className="text-2xl text-coc-red">{error}</h2>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'teams' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredTeams.length} Tim Ditemukan</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredTeams.map(team => <TeamCard key={team.id} {...team} />)}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'players' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{filteredPlayers.length} Pemain Ditemukan</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {/* PERBAIKAN: Petakan properti yang benar ('displayName', 'playerTag') ke props 'PlayerCard' */}
                                        {filteredPlayers.map(player => {
                                            const playerData = player as any;
                                            return (
                                                <PlayerCard 
                                                    key={playerData.id} 
                                                    id={playerData.id}
                                                    name={playerData.displayName} // Mapping dari displayName -> name
                                                    tag={playerData.playerTag || playerData.tag} // Mapping dari playerTag -> tag
                                                    thLevel={playerData.thLevel}
                                                    reputation={playerData.reputation}
                                                    role={playerData.role}
                                                    avatarUrl={playerData.avatarUrl}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            <div className="text-center mt-10">
                                <Button variant="secondary" size="lg">Muat Lebih Banyak</Button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default TeamHubPage;


