'use client';

import { useState } from 'react';
import { TeamCard, PlayerCard, TeamCardProps, PlayerCardProps } from "@/app/components/cards";
import TeamHubFilter from "@/app/components/filters/TeamHubFilter";
import PlayerHubFilter from "@/app/components/filters/PlayerHubFilter";
import { Button } from "@/app/components/ui/Button";

// Data statis untuk tim
const dummyTeams: TeamCardProps[] = [
    { name: "Clash Elites Pro", tag: "#ELITEPRO", rating: 4.9, vision: "Kompetitif", avgTh: 15.2, href: "/team/1" },
    { name: "No Drama Casuals", tag: "#NODRAMA", rating: 4.5, vision: "Kasual", avgTh: 12.0, href: "/team/2" },
    { name: "War Legends", tag: "#WARLEGEND", rating: 4.8, vision: "Kompetitif", avgTh: 16.0, href: "/team/3" },
    { name: "Phoenix Reborn", tag: "#PHOENIX", rating: 4.7, vision: "Kompetitif", avgTh: 14.8, href: "/team/4" },
    { name: "Chill Clashers", tag: "#CHILL", rating: 4.3, vision: "Kasual", avgTh: 11.5, href: "/team/5" },
    { name: "Elite Destroyers", tag: "#DESTROY", rating: 4.9, vision: "Kompetitif", avgTh: 15.8, href: "/team/6" },
];

// Data statis untuk pemain (BARU)
const dummyPlayers: PlayerCardProps[] = [
    { name: "Lord Z", tag: "#P20C8Y9L", thLevel: 16, reputation: 4.7, role: 'Leader', href: "/player/1" },
    { name: "Helix", tag: "#A1B2C3D4", thLevel: 15, reputation: 4.5, role: 'Free Agent', href: "/player/2" },
    { name: "Xena", tag: "#XENA-TAG", thLevel: 16, reputation: 4.9, role: 'Co-Leader', href: "/player/3" },
    { name: "Ghost", tag: "#GHOST-TAG", thLevel: 15, reputation: 4.2, role: 'Elder', href: "/player/4" },
    { name: "Blaze", tag: "#BLAZE-TAG", thLevel: 15, reputation: 4.6, role: 'Member', href: "/player/5" },
    { name: "Rookie", tag: "#ROOKIE-TAG", thLevel: 14, reputation: 4.1, role: 'Free Agent', href: "/player/6" },
];

const TeamHubPage = () => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Navigasi Tab */}
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
                
                {/* Kolom Filter (Dinamis) */}
                <div className="lg:col-span-1">
                    {activeTab === 'teams' ? <TeamHubFilter /> : <PlayerHubFilter />}
                </div>

                {/* Kolom Hasil Pencarian (Dinamis) */}
                <div className="lg:col-span-3">
                    {activeTab === 'teams' && (
                        <div>
                            <h1 className="text-3xl md:text-4xl mb-6">{dummyTeams.length} Tim Ditemukan</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {dummyTeams.map(team => <TeamCard key={team.tag} {...team} />)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'players' && (
                         <div>
                            <h1 className="text-3xl md:text-4xl mb-6">{dummyPlayers.length} Pemain Ditemukan</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {dummyPlayers.map(player => <PlayerCard key={player.tag} {...player} />)}
                            </div>
                        </div>
                    )}
                    
                    <div className="text-center mt-10">
                        <Button variant="secondary" size="lg">Muat Lebih Banyak</Button>
                    </div>
                </div>

            </section>
        </main>
    );
};

export default TeamHubPage;

