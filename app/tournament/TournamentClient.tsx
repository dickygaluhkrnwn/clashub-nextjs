'use client';

import { useState, useMemo } from 'react';
import { TournamentCard } from "@/app/components/cards";
// Import tipe filter dari komponen filter
import TournamentFilter, { TournamentFilters } from "@/app/components/filters/TournamentFilter"; 
import { Button } from "@/app/components/ui/Button";
import { Tournament } from '@/lib/types';
import { TrophyIcon } from '../components/icons';

// Definisikan Props untuk Client Component
interface TournamentClientProps {
    initialTournaments: Tournament[];
    error: string | null;
}

const TournamentClient = ({ initialTournaments, error: serverError }: TournamentClientProps) => {
    // Data dimuat dari props
    const [allTournaments] = useState<Tournament[]>(initialTournaments);
    const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');
    
    // State untuk filter turnamen (nilai default)
    const [tournamentFilters, setTournamentFilters] = useState<TournamentFilters>({
        status: 'Semua Status',
        thLevel: 'Semua Level',
        prize: 'all',
    });

    // Simulasi loading/filtering (untuk UX saat filter diubah)
    const [isFiltering, setIsFiltering] = useState(false);
    
    // Logika Filtering Nyata menggunakan useMemo
    const filteredTournaments = useMemo(() => {
        // Memicu simulasi loading sebentar (meskipun useMemo cepat)
        setIsFiltering(true);
        setTimeout(() => setIsFiltering(false), 50);

        return allTournaments.filter(tournament => {
            const { status, thLevel, prize } = tournamentFilters;

            // Filter 1: Status
            const statusMatch = status === 'Semua Status' || tournament.status === status;

            // Filter 2: TH Level
            // Memastikan thRequirement di data mengandung string filter (misal: "TH 15 - 16" mengandung "TH 15 - 16")
            const thMatch = thLevel === 'Semua Level' || tournament.thRequirement.includes(thLevel);

            // Filter 3: Prize (Berbasis konvensi PrizePool di data)
            let prizeMatch = true;
            if (prize === 'cash') {
                // Mencari indikasi uang tunai ('Rp', '$', 'Cash')
                prizeMatch = tournament.prizePool.toLowerCase().includes('rp') || 
                             tournament.prizePool.toLowerCase().includes('juta');
            } else if (prize === 'item') {
                 // Mencari indikasi item/eksklusif
                prizeMatch = tournament.prizePool.toLowerCase().includes('item') || 
                             tournament.prizePool.toLowerCase().includes('eksklusif');
            }

            return statusMatch && thMatch && prizeMatch;
        });
    }, [allTournaments, tournamentFilters]); 

    // Tidak ada state isLoading tambahan yang diperlukan untuk data awal (sudah di SSR)
    const isLoading = false; 

    return (
        <>
            {/* Navigasi Tab */}
            <div className="mb-8 border-b-2 border-coc-gold-dark/20 flex">
                <button 
                    onClick={() => setActiveTab('tournaments')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'tournaments' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Daftar Turnamen
                </button>
                <button 
                    onClick={() => setActiveTab('leagues')}
                    className={`px-6 py-3 font-supercell text-lg transition-colors ${activeTab === 'leagues' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Liga & Klasemen
                </button>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Kolom Filter */}
                <div className="lg:col-span-1">
                    {/* Meneruskan state dan handler filter */}
                    <TournamentFilter 
                        filters={tournamentFilters} 
                        onFilterChange={setTournamentFilters} 
                    />
                </div>

                {/* Kolom Konten Utama */}
                <div className="lg:col-span-3">
                    {activeTab === 'tournaments' && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl md:text-4xl flex items-center gap-2">
                                    <TrophyIcon className='h-8 w-8 text-coc-gold-dark'/>
                                    Turnamen Aktif & Akan Datang
                                </h1>
                                <Button href="/tournament/create" variant="primary">
                                    Buat Turnamen
                                </Button>
                            </div>
                            
                            {/* Menampilkan status saat filter sedang diterapkan */}
                            {isFiltering ? (
                                <div className="text-center py-10">
                                    <h3 className="text-xl text-coc-gold animate-pulse">Menerapkan Filter...</h3>
                                </div>
                            ) : serverError ? (
                                <div className="text-center py-20 card-stone p-6">
                                    <h3 className="text-xl text-coc-red">{serverError}</h3>
                                </div>
                            ) : filteredTournaments.length === 0 ? (
                                <div className="text-center py-10 card-stone p-6">
                                    <h3 className="text-xl text-gray-400">Tidak ada turnamen yang ditemukan.</h3>
                                    <p className='text-sm text-gray-500'>Coba ubah kriteria filter Anda.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Menampilkan data yang sudah difilter */}
                                    {filteredTournaments.map(tournament => (
                                        <TournamentCard 
                                            key={tournament.id} 
                                            {...tournament} 
                                        />
                                    ))}
                                </div>
                            )}

                             <div className="text-center mt-10">
                                {/* Tombol Muat Lebih Banyak, tetap statis untuk saat ini */}
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
