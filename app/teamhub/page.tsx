'use client';

import { useState, useEffect } from 'react';
import { TeamCard, PlayerCard } from "@/app/components/cards";
import TeamHubFilter from "@/app/components/filters/TeamHubFilter";
import PlayerHubFilter from "@/app/components/filters/PlayerHubFilter";
import { Button } from "@/app/components/ui/Button";
// Impor "kamus" data dan "jembatan" kita
import { Team, Player } from '@/lib/types';
import { getTeams, getPlayers } from '@/lib/firestore';

// Hapus data statis 'dummyTeams' dan 'dummyPlayers'

const TeamHubPage = () => {
    const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
    
    // State baru untuk menampung data dinamis dan status loading
    const [teams, setTeams] = useState<Team[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // useEffect akan berjalan satu kali saat komponen pertama kali dimuat
    useEffect(() => {
        // Buat fungsi async di dalam useEffect untuk mengambil data
        const fetchInitialData = async () => {
            setIsLoading(true); // Mulai loading
            try {
                // Ambil data tim dan pemain dari Firestore
                const fetchedTeams = await getTeams();
                const fetchedPlayers = await getPlayers();
                setTeams(fetchedTeams);
                setPlayers(fetchedPlayers);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
                // Di sini Anda bisa menambahkan state untuk menampilkan pesan error di UI
            } finally {
                setIsLoading(false); // Selesai loading, baik berhasil maupun gagal
            }
        };

        fetchInitialData();
    }, []); // Array kosong berarti efek ini hanya berjalan sekali

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
                    {isLoading ? (
                        // Tampilkan pesan loading jika data sedang diambil
                        <div className="text-center py-20">
                            <h2 className="text-2xl text-coc-gold">Memuat Data...</h2>
                        </div>
                    ) : (
                        // Tampilkan konten jika loading selesai
                        <>
                            {activeTab === 'teams' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{teams.length} Tim Ditemukan</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {/* Gunakan data 'teams' dari state untuk me-render kartu */}
                                        {teams.map(team => <TeamCard key={team.id} {...team} href={`/team/${team.id}`} />)}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'players' && (
                                <div>
                                    <h1 className="text-3xl md:text-4xl mb-6">{players.length} Pemain Ditemukan</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {/* Gunakan data 'players' dari state */}
                                        {players.map(player => <PlayerCard key={player.id} {...player} href={`/player/${player.id}`} />)}
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
