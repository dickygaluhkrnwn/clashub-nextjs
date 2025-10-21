'use client';

import { useState, useMemo, useEffect } from 'react';
import { TeamCard, PlayerCard } from "@/app/components/cards";
import TeamHubFilter from "@/app/components/filters/TeamHubFilter";
import PlayerHubFilter from "@/app/components/filters/PlayerHubFilter";
import { Button } from "@/app/components/ui/Button";
import { Team, Player } from '@/lib/types';
import { getPlayers } from '@/lib/firestore'; // Dipertahankan untuk fetch data pemain saat tab di-switch

// Definisikan tipe untuk state filter agar lebih mudah dikelola (Dipindahkan dari page.tsx)
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

// Definisikan Props untuk Client Component
interface TeamHubClientProps {
    initialTeams: Team[];
    initialPlayers: Player[];
}


const TeamHubClient = ({ initialTeams, initialPlayers }: TeamHubClientProps) => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    
    // Data dimuat dari props
    const [allTeams] = useState<Team[]>(initialTeams);
    // Data pemain juga dimuat dari props, namun kita siapkan state untuk load-on-demand
    const [allPlayers, setAllPlayers] = useState<Player[]>(initialPlayers);
    
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

    const [isLoading, setIsLoading] = useState(false);
    // Error hanya akan muncul jika fetching data player on-demand gagal
    const [error, setError] = useState<string | null>(null);

    // EFEK BARU: Handle lazy load data player jika tab diganti
    useEffect(() => {
        const fetchPlayersOnDemand = async () => {
            if (activeTab === 'players' && allPlayers.length === 0) {
                setIsLoading(true);
                setError(null);
                try {
                    const fetchedPlayers = await getPlayers();
                    setAllPlayers(fetchedPlayers);
                } catch (err) {
                    console.error("Gagal mengambil data pemain:", err);
                    setError("Tidak dapat memuat data pemain. Coba refresh.");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        // Jika tab 'teams' dimuat, kita tidak perlu fetching karena data sudah di SSR.
        // Jika tab 'players' yang aktif dan belum ada data, kita fetch.
        if (activeTab === 'players') {
            fetchPlayersOnDemand();
        }
    }, [activeTab, allPlayers.length]);


    // Logika Filtering - Tetap di Client Component menggunakan useMemo (sesuai kebutuhan Anda)
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
            // Kita harus menggunakan Player Tag dari DB, yang telah kita perbaiki di Server Component.
            // Data dari Firestore (users) seharusnya memiliki displayName dan playerTag.
            const name = (player as any).displayName || player.name || '';
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
        <>
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex">
                <button 
                    onClick={() => {
                        setActiveTab('teams');
                        // Opsional: reset filter pemain saat beralih ke tim
                        setPlayerFilters({ searchTerm: '', role: 'all', reputation: 3.0, thLevel: 9 });
                    }}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'teams' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Tim
                </button>
                <button 
                    onClick={() => {
                        setActiveTab('players');
                        // Opsional: reset filter tim saat beralih ke pemain
                        setTeamFilters({ searchTerm: '', vision: 'Kompetitif', reputation: 3.0, thLevel: 9 });
                    }}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'players' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Cari Pemain
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <div className="lg:col-span-1">
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
                         <div className="text-center py-20 card-stone p-6">
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
                                        {filteredPlayers.map(player => {
                                            const playerData = player as any;
                                            return (
                                                <PlayerCard 
                                                    key={playerData.id} 
                                                    id={playerData.id}
                                                    name={playerData.displayName || playerData.name} // DisplayName atau Fallback
                                                    tag={playerData.playerTag || playerData.tag} 
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
                                <Button variant="secondary" size="lg" disabled={isLoading}>Muat Lebih Banyak</Button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

export default TeamHubClient;
