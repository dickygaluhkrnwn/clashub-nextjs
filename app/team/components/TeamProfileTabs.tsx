'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import { Team, UserProfile } from '@/lib/types';
import { StarIcon, ShieldIcon, UserIcon, TrophyIcon } from '@/app/components/icons'; 

interface CompetitionHistoryItem {
    tournament: string;
    rank: string;
    date: string;
    prize: string;
}

interface TeamProfileTabsProps {
    team: Team;
    members: UserProfile[];
    competitionHistory: CompetitionHistoryItem[];
    // PERBAIKAN: Hapus getRankColor dari props
    // getRankColor: (rank: string) => string; 
}

/**
 * @function getRankColor (Dipindahkan ke sini sebagai helper lokal)
 * Menentukan kelas warna Tailwind berdasarkan peringkat kompetisi.
 */
const getRankColor = (rank: string) => {
    if (rank.includes('Juara')) return 'text-coc-gold';
    return 'text-gray-400';
};


/**
 * @component TeamProfileTabs (Client Component)
 * Menangani tab navigasi dan konten tab menggunakan useState.
 */
// PERBAIKAN: Hapus getRankColor dari destrukturisasi props
const TeamProfileTabs: React.FC<TeamProfileTabsProps> = ({ team, members, competitionHistory }) => {
    // State untuk mengontrol tab yang aktif
    const [activeTab, setActiveTab] = useState<'visi' | 'riwayat' | 'anggota'>('visi'); 
    const isCompetitive = team.vision === 'Kompetitif';

    return (
        <div className="space-y-6">
            {/* Navigasi Tombol */}
            {/* Navigasi tombol tab ini tidak dibungkus card agar border-b bisa terlihat di bawah card utama */}
            <div className="flex border-b-2 border-coc-gold-dark/20 overflow-x-auto custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('visi')}
                    // Mengganti font-supercell dengan font-clash
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'visi' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Visi & Aturan
                </button>
                <button 
                    onClick={() => setActiveTab('riwayat')}
                     // Mengganti font-supercell dengan font-clash
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'riwayat' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Riwayat Kompetisi
                </button>
                <button 
                    onClick={() => setActiveTab('anggota')}
                     // Mengganti font-supercell dengan font-clash
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'anggota' ? 'text-coc-gold border-b-2 border-coc-gold' : 'text-gray-400 hover:text-white'}`}
                >
                    Anggota ({members.length})
                </button>
            </div>

            {/* --- Konten Tab Dibungkus dalam Card untuk Styling yang Konsisten --- */}
            
            {/* Content: Visi & Aturan */}
            {activeTab === 'visi' && (
                // PERBAIKAN: Tambahkan wrapper card-stone di sini
                <div className="card-stone p-6 space-y-6">
                    {/* Menggunakan font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2">Visi Tim</h3>
                    <p className="text-gray-300">
                        {isCompetitive
                            ? team.recruitingStatus === 'Open' 
                                ? "Tim War Clan League yang berfokus pada meta TH 16 dan strategi serangan 3-bintang. Kami mencari pemain berkomitmen tinggi yang siap bertarung di liga Master ke atas."
                                : "Tim profesional dengan roster tetap. Mencari sparring partner dan fokus pada kompetisi tier 1."
                            : "Tim kasual yang berfokus pada kesenangan, donasi teratur, dan partisipasi War santai. Cocok untuk pemain yang ingin tumbuh tanpa tekanan."
                        }
                    </p>

                    {/* Menggunakan font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6">Aturan Tim</h3>
                    <ul className="text-gray-300 space-y-3 list-none p-0">
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Wajib hadir saat War, jika absen harus izin 24 jam sebelumnya.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Donasi *troops* sesuai permintaan dan minimal rasio 1:2.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Komunikasi aktif wajib di Discord.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Persyaratan TH Minimum: **TH 15+**</li>
                    </ul>
                </div>
            )}
            
            {/* Content: Riwayat Kompetisi */}
            {activeTab === 'riwayat' && (
                // PERBAIKAN: Tambahkan wrapper card-stone di sini
                <div className="card-stone p-6 space-y-6">
                    {/* Menggunakan font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2">Riwayat Turnamen Resmi</h3>
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
                                        {/* PERBAIKAN: Menggunakan fungsi getRankColor lokal */}
                                        <td className="p-3 font-bold">{item.tournament}</td>
                                        <td className={`p-3 font-bold ${getRankColor(item.rank)}`}>{item.rank}</td>
                                        <td className="p-3 text-gray-400">{item.date}</td>
                                        <td className="p-3 text-coc-gold">{item.prize}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Menggunakan font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6">Pencapaian War Klan</h3>
                    <p className="text-gray-300">
                        Total Kemenangan War: <strong className='text-coc-gold'>450</strong> | Rekor Kemenangan Beruntun: <strong className='text-coc-red'>35</strong>
                    </p>
                </div>
            )}

            {/* Content: Anggota Tim */}
            {activeTab === 'anggota' && (
                // PERBAIKAN: Tambahkan wrapper card-stone di sini
                <div className="card-stone p-6 space-y-6">
                    {/* Menggunakan font-clash */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2">Daftar Roster ({members.length}/50)</h3>
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

export default TeamProfileTabs;
