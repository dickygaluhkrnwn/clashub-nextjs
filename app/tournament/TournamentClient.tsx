'use client';

import { useState } from 'react';
import { TournamentCard } from "@/app/components/cards";
import TournamentFilter from "@/app/components/filters/TournamentFilter";
import { Button } from "@/app/components/ui/Button";
import { Tournament } from '@/lib/types';
import { Metadata } from 'next';

// Definisikan Props untuk Client Component
interface TournamentClientProps {
    initialTournaments: Tournament[];
    error: string | null;
}

const TournamentClient = ({ initialTournaments, error }: TournamentClientProps) => {
    // Data dimuat dari props
    const [tournaments] = useState<Tournament[]>(initialTournaments);
    const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Logika filter (akan dikembangkan nanti)
    const handleApplyFilter = () => {
        // Logika ini hanya simulasi loading/applying filter di sisi client
        setIsFiltering(true);
        setTimeout(() => setIsFiltering(false), 500); 
    };

    // Karena data sudah dimuat di server, isLoading di sini hanya mengacu pada filtering.
    const isLoading = false; 

    return (
        <>
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
                    {/* Teruskan callback ke filter component */}
                    <TournamentFilter onApplyFilter={handleApplyFilter} />
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
                            
                            {/* Menampilkan status saat filter sedang diterapkan */}
                            {isFiltering ? (
                                <div className="text-center py-10">
                                    <h3 className="text-xl text-coc-gold animate-pulse">Menerapkan Filter...</h3>
                                </div>
                            ) : error ? (
                                <div className="text-center py-20 card-stone p-6">
                                    <h3 className="text-xl text-coc-red">{error}</h3>
                                </div>
                            ) : tournaments.length === 0 ? (
                                <div className="text-center py-10">
                                    <h3 className="text-xl text-gray-400">Tidak ada turnamen yang ditemukan.</h3>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Menampilkan data dari props */}
                                    {tournaments.map(tournament => (
                                        <TournamentCard 
                                            key={tournament.id} 
                                            {...tournament} 
                                        />
                                    ))}
                                </div>
                            )}

                             <div className="text-center mt-10">
                                <Button variant="secondary" size="lg" disabled={isLoading || isFiltering}>Muat Lebih Banyak</Button>
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
        </>
    );
};

export default TournamentClient;
