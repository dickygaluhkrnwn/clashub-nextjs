'use client';

import { useState } from 'react';
import { TournamentCard, TournamentCardProps } from "@/app/components/cards";
import TournamentFilter from "@/app/components/filters/TournamentFilter";
import { Button } from "@/app/components/ui/Button";

// Data statis untuk turnamen
const dummyTournaments: TournamentCardProps[] = [
    { title: "ClashHub Liga Musim 3", status: 'Akan Datang', thRequirement: "TH 15 - 16", prizePool: "Rp 15.000.000", href: "/tournament/1" },
    { title: "Open TH 14 Cup - Minggu 4", status: 'Live', thRequirement: "TH 13 - 14", prizePool: "Rp 5.000.000", href: "/tournament/2" },
    { title: "War Master Challenge", status: 'Akan Datang', thRequirement: "TH 16 Only", prizePool: "Item In-Game Eksklusif", href: "/tournament/3" },
    { title: "Liga Komunitas Musim 2", status: 'Selesai', thRequirement: "Semua Level", prizePool: "Rp 2.500.000", href: "/tournament/4" },
];

const TournamentPage = () => {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'leagues'>('tournaments');

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
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl md:text-4xl">Turnamen Aktif & Akan Datang</h1>
                        <Button href="/tournament/create" variant="primary">
                            Buat Turnamen
                        </Button>
                    </div>
                    
                    <div className="space-y-6">
                        {dummyTournaments.map(tournament => (
                            <TournamentCard key={tournament.title} {...tournament} />
                        ))}
                    </div>

                     <div className="text-center mt-10">
                        <Button variant="secondary" size="lg">Muat Lebih Banyak</Button>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default TournamentPage;
