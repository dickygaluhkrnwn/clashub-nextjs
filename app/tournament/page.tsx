'use client';

import { useState, useEffect } from 'react'; // <-- IMPOR useEffect
import { TournamentCard } from "@/app/components/cards";
import TournamentFilter from "@/app/components/filters/TournamentFilter";
import { Button } from "@/app/components/ui/Button";
import { Tournament } from '@/lib/types'; // <-- IMPOR TIPE
import { getTournaments } from '@/lib/firestore'; // <-- IMPOR FUNGSI FETCH

const TournamentPage = () => {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');
    
    // State baru untuk data dan status loading
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Efek untuk memuat data turnamen
    useEffect(() => {
        const fetchTournamentsData = async () => {
            setIsLoading(true);
            try {
                const fetchedTournaments = await getTournaments();
                setTournaments(fetchedTournaments);
            } catch (error) {
                console.error("Failed to fetch tournaments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Hanya jalankan fetch jika di tab 'tournaments' saat ini.
        // Kita bisa mengoptimalkannya lebih lanjut di Sprint 4, tapi untuk sekarang cukup di sini.
        if (activeTab === 'tournaments') {
            fetchTournamentsData();
        } else {
             setIsLoading(false); // Jika di tab 'leagues', anggap loading selesai (untuk data statis)
        }
    }, [activeTab]);


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
             {/* Navigasi Tab */}
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex">
                <button 
                    onClick={() => setActiveTab('tournaments')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'tournaments' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Daftar Turnamen
                </button>
                <button 
                    onClick={() => setActiveTab('leagues')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'leagues' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}>
                    Liga & Klasemen
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Kolom Filter */}
                <div className="lg:col-span-1">
                    <TournamentFilter />
                </div>

                {/* Kolom Konten Utama */}
                <div className="lg:col-span-3">
                    {activeTab === 'tournaments' && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl md:text-4xl">Turnamen Aktif & Akan Datang</h1>
                                <Button href="/tournament/create" variant="primary">
                                    Buat Turnamen
                                </Button>
                            </div>
                            
                            {isLoading ? (
                                <div className="text-center py-10">
                                    <h3 className="text-xl text-coc-gold">Memuat daftar turnamen...</h3>
                                </div>
                            ) : tournaments.length === 0 ? (
                                <div className="text-center py-10">
                                    <h3 className="text-xl text-gray-400">Tidak ada turnamen yang ditemukan.</h3>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* MENGGANTI DUMMY DATA DENGAN DATA FIRESTORE */}
                                    {tournaments.map(tournament => (
                                        <TournamentCard 
                                            key={tournament.id} 
                                            {...tournament} 
                                            // Asumsi TournamentCardProps kompatibel dengan Tournament interface
                                            href={`/tournament/${tournament.id}`} 
                                        />
                                    ))}
                                </div>
                            )}

                             <div className="text-center mt-10">
                                <Button variant="secondary" size="lg" disabled={isLoading}>Muat Lebih Banyak</Button>
                            </div>
                        </>
                    )}
                    
                    {activeTab === 'leagues' && (
                         <div className="text-center py-20">
                            <h2 className="text-2xl text-coc-gold">Klasemen Liga (Development)</h2>
                            <p className="text-gray-400 mt-2">Halaman ini akan diimplementasikan di Sprint 4.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default TournamentPage;
