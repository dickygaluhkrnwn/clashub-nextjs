import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import { Team, UserProfile } from '@/lib/types';
import { getTeamById, getTeamMembers } from '@/lib/firestore';
// Menggunakan ikon-ikon yang sudah diperbarui: ArrowLeftIcon, ShieldIcon, ClockIcon, dan UserIcon
import { ArrowLeftIcon, StarIcon, ShieldIcon, UserIcon, GlobeIcon, DiscordIcon, ClockIcon, TrophyIcon } from '@/app/components/icons'; 

// Definisikan tipe untuk parameter rute dinamis
interface TeamDetailPageProps {
    params: {
        teamId: string;
    };
}

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: TeamDetailPageProps): Promise<Metadata> {
    const teamId = params.teamId;
    const team = await getTeamById(teamId); 

    if (!team) {
        return { title: "Tim Tidak Ditemukan | Clashub" };
    }

    return {
        title: `Clashub | Profil Tim: ${team.name} (${team.tag})`,
        description: `Lihat profil publik, reputasi ${team.rating} ★, dan persyaratan rekrutmen tim ${team.name} di Clash of Clans.`,
    };
}

/**
 * @component TeamDetailPage (Server Component)
 * Menampilkan detail lengkap profil tim.
 */
const TeamDetailPage = async ({ params }: TeamDetailPageProps) => {
    const teamId = params.teamId;

    // Mengambil data tim dan anggota secara paralel
    const [team, members] = await Promise.all([
        getTeamById(teamId),
        getTeamMembers(teamId)
    ]);

    if (!team) {
        notFound(); 
    }

    // Penyiapan Data
    const { name, tag, rating, vision, avgTh, website, discordId } = team; 
    const isCompetitive = vision === 'Kompetitif';
    const isFull = members.length >= 50; 

    // Data dummy untuk Riwayat Kompetisi (sesuai prototipe HTML)
    const competitionHistory = [
        { tournament: "ClashHub Liga Musim 2", rank: "Juara 3", date: "Sep 2025", prize: "Rp 5.000.000" },
        { tournament: "TH 15 Open Cup", rank: "Peringkat 9", date: "Mei 2025", prize: "-" },
    ];
    
    // Data dummy untuk Event Terdekat (sesuai prototipe HTML)
    const upcomingEvent = {
        name: "War Clan Berikutnya",
        date: "7 Oktober",
        time: "20:00 WIB (Persiapan)",
    };

    const getRankColor = (rank: string) => {
        if (rank.includes('Juara')) return 'text-coc-gold';
        return 'text-gray-400';
    };

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Profil Tim */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6">
                <div className="flex items-center gap-4">
                    <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali
                    </Button>
                    
                    <div>
                        <h1 className="text-3xl md:text-4xl text-white font-supercell m-0">{name}</h1>
                        <p className="text-sm text-gray-400 font-bold mb-1">{tag}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitive ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                            {vision} (TH Avg: {avgTh.toFixed(1)})
                        </span>
                    </div>
                </div>
                
                {/* Tombol Aksi - Kondisional */}
                {isFull ? (
                    <span className="px-4 py-2 bg-coc-red/50 text-coc-red border border-coc-red rounded-lg text-sm font-bold">Roster Penuh</span>
                ) : (
                    <Button href={`/team/${teamId}/join`} variant="primary" size="lg">
                        Kirim Permintaan Bergabung
                    </Button>
                )}
            </header>

            {/* Layout Utama Profil */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Kolom Kiri: Statistik & Kontak */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6">
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <StarIcon className="h-5 w-5"/> Reputasi Tim
                    </h3>
                    <div className="text-center">
                        <p className="text-5xl font-supercell text-coc-gold my-1">{rating.toFixed(1)} <StarIcon className="inline h-8 w-8"/></p>
                        <p className="text-sm text-gray-400">(Berdasarkan 120 Ulasan)</p>
                        <Link href={`/team/${teamId}/reviews`} className="text-sm text-coc-gold hover:underline mt-2 inline-block">Lihat Semua Ulasan</Link>
                    </div>

                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ShieldIcon className="h-5 w-5"/> Ringkasan Statistik
                    </h3>
                    <ul className="text-sm space-y-2">
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><ShieldIcon className="h-4 w-4 text-coc-gold-dark"/> Rata-rata TH:</span> <strong className='text-white'>{avgTh.toFixed(1)}</strong></li>
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><UserIcon className="h-4 w-4 text-coc-gold-dark"/> Anggota:</span> <strong className='text-white'>{members.length}/50</strong></li> 
                        <li className="flex justify-between text-gray-300"><span className='font-bold flex items-center gap-2'><TrophyIcon className="h-4 w-4 text-coc-gold-dark"/> Trofi Tim:</span> <strong className='text-white'>45.000</strong></li>
                    </ul>

                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        <ClockIcon className="h-5 w-5"/> Event Terdekat
                    </h3>
                    <div className="bg-coc-stone/50 p-4 rounded-lg text-center border border-coc-gold-dark/20">
                        <p className="font-bold text-gray-300 mb-1">{upcomingEvent.name}:</p>
                        <p className="font-supercell text-2xl text-coc-gold">{upcomingEvent.date}</p>
                        <p className="text-xs text-gray-400">{upcomingEvent.time}</p>
                    </div>

                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
                        Kontak & Sosial
                    </h3>
                    <ul className="text-sm space-y-2">
                        {website ? (
                            <li className="flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-coc-gold-dark"/> <a href={website} target="_blank" rel="noopener noreferrer" className='text-coc-gold hover:underline'>{website}</a></li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</li>
                        )}
                        {discordId ? (
                            <li className="flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-coc-gold-dark"/> <span className='text-gray-300'>{discordId}</span></li>
                        ) : (
                            <li className="text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Discord belum diatur</li>
                        )}
                    </ul>
                </aside>

                {/* Kolom Kanan: Detail Visi, Riwayat & Anggota */}
                <section className="lg:col-span-3 space-y-8">
                    
                    {/* Tab Navigation (Client Side Interactivity) */}
                    <div className="card-stone p-6">
                        <TeamProfileTabs 
                            team={team} 
                            members={members} 
                            competitionHistory={competitionHistory}
                            getRankColor={getRankColor}
                        />
                    </div>
                </section>
            </section>
        </main>
    );
};

export default TeamDetailPage;

/**
 * @component TeamProfileTabs (Client Component)
 * Menangani tab navigasi dan konten tab.
 */
// PERBAIKAN: Impor useState di sini
import React, { useState } from 'react'; 

interface TeamProfileTabsProps {
    team: Team;
    members: UserProfile[];
    competitionHistory: { tournament: string, rank: string, date: string, prize: string }[];
    getRankColor: (rank: string) => string;
}

const TeamProfileTabs = ({ team, members, competitionHistory, getRankColor }: TeamProfileTabsProps) => {
    'use client';
    const [activeTab, setActiveTab] = useState<'visi' | 'riwayat' | 'anggota'>('visi'); 
    const isCompetitive = team.vision === 'Kompetitif';

    return (
        <div className="space-y-6">
            {/* Navigasi Tombol */}
            <div className="flex border-b-2 border-coc-gold-dark/20 overflow-x-auto custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('visi')}
                    className={`px-6 py-3 font-supercell text-lg whitespace-nowrap transition-colors ${activeTab === 'visi' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Visi & Aturan
                </button>
                <button 
                    onClick={() => setActiveTab('riwayat')}
                    className={`px-6 py-3 font-supercell text-lg whitespace-nowrap transition-colors ${activeTab === 'riwayat' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Riwayat Kompetisi
                </button>
                <button 
                    onClick={() => setActiveTab('anggota')}
                    className={`px-6 py-3 font-supercell text-lg whitespace-nowrap transition-colors ${activeTab === 'anggota' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Anggota ({members.length})
                </button>
            </div>

            {/* Content: Visi & Aturan */}
            {activeTab === 'visi' && (
                <div className="space-y-6">
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2">Visi Tim</h3>
                    <p className="text-gray-300">
                        {isCompetitive
                            ? "Menjadi salah satu tim war terbaik di Asia, berfokus pada meta TH 16 dan strategi serangan 3-bintang yang inovatif. Kami mencari pemain berkomitmen tinggi."
                            : "Tim kasual yang berfokus pada kesenangan, donasi teratur, dan partisipasi War santai. Cocok untuk pemain yang ingin tumbuh tanpa tekanan."
                        }
                    </p>

                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 mt-6">Aturan Tim</h3>
                    <ul className="text-gray-300 space-y-3 list-none p-0">
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Wajib hadir saat War, jika absen harus izin 24 jam sebelumnya.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Donasi *troops* sesuai permintaan dan minimal rasio 1:2.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Diskusi strategi wajib di Discord 30 menit sebelum war dimulai.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Persyaratan TH Minimum: **TH 15+**</li>
                    </ul>
                </div>
            )}
            
            {/* Content: Riwayat Kompetisi */}
            {activeTab === 'riwayat' && (
                <div className="space-y-6">
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2">Riwayat Turnamen Resmi</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className='text-gray-400 uppercase text-xs border-b border-coc-gold-dark/30'>
                                    <th className="p-3">Turnamen</th>
                                    <th className="p-3">Peringkat</th>
                                    <th className="p-3">Tanggal</th>
                                    <th className="p-3">Hadiah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {competitionHistory.map((item, index) => (
                                    <tr key={index} className='border-b border-coc-gold-dark/10 hover:bg-coc-stone/50 transition-colors text-sm'>
                                        <td className="p-3 font-bold">{item.tournament}</td>
                                        <td className={`p-3 font-bold ${getRankColor(item.rank)}`}>{item.rank}</td>
                                        <td className="p-3 text-gray-400">{item.date}</td>
                                        <td className="p-3 text-coc-gold">{item.prize}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2 mt-6">Pencapaian War Klan</h3>
                    <p className="text-gray-300">
                        Total Kemenangan War: <strong className='text-coc-gold'>450</strong> | Rekor Kemenangan Beruntun: <strong className='text-coc-red'>35</strong>
                    </p>
                </div>
            )}

            {/* Content: Anggota Tim */}
            {activeTab === 'anggota' && (
                <div className="space-y-6">
                    <h3 className="text-xl text-coc-gold-dark font-supercell border-b border-coc-gold-dark/30 pb-2">Daftar Roster ({members.length}/50)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.length === 0 ? (
                            <p className="text-gray-400 col-span-full">Tim ini belum memiliki anggota yang terdaftar di Clashub.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.uid} className="flex items-center gap-3 p-3 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/10 hover:border-coc-gold transition-all">
                                    <Image 
                                        src={member.avatarUrl || '/images/placeholder-avatar.png'} 
                                        alt={`${member.displayName} Avatar`} 
                                        width={40} 
                                        height={40} 
                                        className="rounded-full object-cover border border-coc-gold-dark flex-shrink-0"
                                    />
                                    <div className="flex-grow">
                                        <Link href={`/player/${member.uid}`} className="font-bold text-white hover:text-coc-gold transition-colors">{member.displayName}</Link>
                                        <p className="text-xs text-gray-400">TH {member.thLevel} | {member.playerTag}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${member.role === 'Leader' ? 'bg-coc-gold text-coc-stone' : member.role === 'Co-Leader' ? 'bg-gray-400 text-coc-stone' : 'bg-coc-stone-light text-gray-300'}`}>
                                        {member.role || 'Member'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
