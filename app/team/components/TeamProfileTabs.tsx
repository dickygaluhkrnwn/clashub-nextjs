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
}

/**
 * @function getRankColor (Helper lokal)
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
const TeamProfileTabs: React.FC<TeamProfileTabsProps> = ({ team, members, competitionHistory }) => {
    // State untuk mengontrol tab yang aktif
    const [activeTab, setActiveTab] = useState<'visi' | 'riwayat' | 'anggota'>('visi');
    const isCompetitive = team.vision === 'Kompetitif';

    return (
        <div className="space-y-6">
            {/* Navigasi Tombol Tab */}
            <div className="flex border-b-2 border-coc-gold-dark/20 overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('visi')}
                    // Tambahkan subtle background hover untuk inactive tabs
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'visi'
                        ? 'text-coc-gold border-b-2 border-coc-gold'
                        : 'text-gray-400 hover:text-white hover:bg-coc-stone-light/30 rounded-t-md' // Added hover background
                        }`}
                >
                    Visi & Aturan
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    // Tambahkan subtle background hover untuk inactive tabs
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'riwayat'
                        ? 'text-coc-gold border-b-2 border-coc-gold'
                        : 'text-gray-400 hover:text-white hover:bg-coc-stone-light/30 rounded-t-md' // Added hover background
                        }`}
                >
                    Riwayat Kompetisi
                </button>
                <button
                    onClick={() => setActiveTab('anggota')}
                     // Tambahkan subtle background hover untuk inactive tabs
                    className={`px-6 py-3 font-clash text-lg whitespace-nowrap transition-colors ${activeTab === 'anggota'
                        ? 'text-coc-gold border-b-2 border-coc-gold'
                        : 'text-gray-400 hover:text-white hover:bg-coc-stone-light/30 rounded-t-md' // Added hover background
                        }`}
                >
                    Anggota ({members.length})
                </button>
            </div>

            {/* --- Konten Tab --- */}

            {/* Content: Visi & Aturan */}
            {activeTab === 'visi' && (
                <div className="card-stone p-6 space-y-6 rounded-lg"> {/* Added rounded-lg */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2"> {/* Added flex items-center gap-2 */}
                         {/* Optional Icon: Maybe ShieldIcon or similar */}
                        Visi Tim
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed"> {/* Added text-sm leading-relaxed */}
                        {isCompetitive
                            ? team.recruitingStatus === 'Open'
                                ? "Tim War Clan League yang berfokus pada meta TH 16 dan strategi serangan 3-bintang. Kami mencari pemain berkomitmen tinggi yang siap bertarung di liga Master ke atas."
                                : "Tim profesional dengan roster tetap. Mencari sparring partner dan fokus pada kompetisi tier 1."
                            : "Tim kasual yang berfokus pada kesenangan, donasi teratur, dan partisipasi War santai. Cocok untuk pemain yang ingin tumbuh tanpa tekanan."
                        }
                    </p>

                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6 flex items-center gap-2"> {/* Added flex items-center gap-2 */}
                        {/* Optional Icon */}
                        Aturan Tim
                    </h3>
                    <ul className="text-gray-300 space-y-3 list-none p-0 text-sm"> {/* Added text-sm */}
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 flex-shrink-0 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Wajib hadir saat War, jika absen harus izin 24 jam sebelumnya.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 flex-shrink-0 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Donasi *troops* sesuai permintaan dan minimal rasio 1:2.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 flex-shrink-0 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Komunikasi aktif wajib di Discord.</li>
                        <li className='flex items-start gap-2'><StarIcon className={`h-4 w-4 mt-1 flex-shrink-0 ${isCompetitive ? 'text-coc-red' : 'text-coc-green'}`}/> Persyaratan TH Minimum: <strong className="text-white">TH 15+</strong></li> {/* Made strong white */}
                    </ul>
                </div>
            )}

            {/* Content: Riwayat Kompetisi */}
            {activeTab === 'riwayat' && (
                <div className="card-stone p-6 space-y-6 rounded-lg"> {/* Added rounded-lg */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2"> {/* Added flex items-center gap-2 */}
                        <TrophyIcon className="h-5 w-5"/> Riwayat Turnamen Resmi
                    </h3>
                    <div className="overflow-x-auto custom-scrollbar -mx-3"> {/* Added negative margin to align table better */}
                        <table className="min-w-full text-left border-collapse">
                            {/* Tambahkan background pada header tabel */}
                            <thead className="bg-coc-stone/30">
                                <tr className='text-gray-400 uppercase text-xs border-b-2 border-coc-gold-dark/30'> {/* Thicker border */}
                                    <th className="p-3 font-semibold">Turnamen</th>
                                    <th className="p-3 font-semibold">Peringkat</th>
                                    <th className="p-3 font-semibold">Tanggal</th>
                                    <th className="p-3 font-semibold">Hadiah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {competitionHistory.map((item, index) => (
                                    <tr key={index} className='border-b border-coc-gold-dark/10 hover:bg-coc-stone-light/50 transition-colors text-sm'>
                                        <td className="p-3 font-medium text-white">{item.tournament}</td>
                                        <td className={`p-3 font-bold ${getRankColor(item.rank)}`}>{item.rank}</td>
                                        <td className="p-3 text-gray-400">{item.date}</td>
                                        <td className="p-3 text-coc-gold font-semibold">{item.prize}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6 flex items-center gap-2"> {/* Added flex items-center gap-2 */}
                         {/* Optional Icon */}
                        Pencapaian War Klan
                    </h3>
                    <p className="text-gray-300 text-sm"> {/* Added text-sm */}
                        Total Kemenangan War: <strong className='text-coc-gold font-clash text-base'>450</strong> | Rekor Kemenangan Beruntun: <strong className='text-coc-red font-clash text-base'>35</strong>
                    </p>
                </div>
            )}

            {/* Content: Anggota Tim */}
            {activeTab === 'anggota' && (
                <div className="card-stone p-6 space-y-6 rounded-lg"> {/* Added rounded-lg */}
                    <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2"> {/* Added flex items-center gap-2 */}
                        <UserIcon className="h-5 w-5"/> Daftar Roster ({members.length}/50)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.length === 0 ? (
                            <p className="text-gray-400 col-span-full text-center py-4">Tim ini belum memiliki anggota yang terdaftar di Clashub.</p>
                        ) : (
                            members.map((member) => (
                                <div key={member.uid} className="flex items-center gap-3 p-3 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30 hover:border-coc-gold transition-all duration-200 shadow-sm hover:shadow-md"> {/* Tweaked borders and shadow */}
                                    <Image
                                        src={member.avatarUrl || '/images/placeholder-avatar.png'}
                                        alt={`${member.displayName} Avatar`}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover border-2 border-coc-gold-dark flex-shrink-0" /* Thicker border */
                                    />
                                    <div className="flex-grow min-w-0"> {/* Added min-w-0 for better truncation */}
                                        <Link href={`/player/${member.uid}`} className="font-semibold text-white hover:text-coc-gold transition-colors truncate block">{member.displayName}</Link> {/* Added truncate */}
                                        <p className="text-xs text-gray-400 truncate">TH {member.thLevel} | {member.playerTag}</p> {/* Added truncate */}
                                    </div>
                                     {/* Styling badge peran lebih konsisten */}
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded whitespace-nowrap ${
                                        member.role === 'Leader' ? 'bg-coc-gold text-coc-stone'
                                        : member.role === 'Co-Leader' ? 'bg-gray-400 text-coc-stone'
                                        : member.role === 'Elder' ? 'bg-sky-500 text-white' // Elder color adjusted
                                        : 'bg-coc-stone-light text-gray-300' // Member color adjusted
                                    }`}>
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
