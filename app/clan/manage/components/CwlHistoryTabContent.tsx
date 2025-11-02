// File: app/clan/manage/components/CwlHistoryTabContent.tsx
// Deskripsi: REFAKTOR: Menampilkan data CWL SAAT INI (League Group) dari hook SWR.
// Logika lama (menampilkan arsip/history) telah diganti sesuai roadmap.

'use client';

import React, { useState, useMemo, useCallback } from 'react';
// --- TUGAS: Import Tipe Baru ---
import { ManagedClan, CocLeagueGroup, CocLeagueGroupClan } from '@/lib/types';
import { useManagedClanCWL } from '@/lib/hooks/useManagedClan';

// --- TUGAS: Standarisasi Ikon ---
import {
    Loader2Icon, // Menggantikan Loader2
    AlertTriangleIcon,
    RefreshCwIcon,
    CalendarCheck2Icon, // Menggantikan Calendar
    ArrowRightIcon, // Menggantikan ChevronRight
    ArrowLeftIcon, // Menggantikan ArrowLeft
    UserIcon, // PERBAIKAN: Mengganti UsersIcon ke UserIcon
    CheckIcon, // Menggantikan Check
    XIcon // Menggantikan X
} from '@/app/components/icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button'; // Import Button

// --- Tipe Baru ---
type CwlSortKey = 'name' | 'level' | 'totalStars' | 'totalDestruction' | 'none';
type SortDirection = 'asc' | 'desc';

// --- Props Component (DIUBAH) ---
interface CwlHistoryTabContentProps {
    clan: ManagedClan; // Hanya menerima ManagedClan
}

// --- Component Pembantu: Menampilkan Detail Roster Klan ---
interface CwlRosterModalProps {
    clan: CocLeagueGroupClan | null;
    onClose: () => void;
}

const CwlRosterModal: React.FC<CwlRosterModalProps> = ({ clan, onClose }) => {
    if (!clan) return null;

    // Urutkan anggota berdasarkan TH (tertinggi ke terendah)
    const sortedMembers = [...clan.members].sort((a, b) => b.townHallLevel - a.townHallLevel);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-coc-dark-blue border border-coc-gold-dark/50 rounded-lg shadow-xl w-full max-w-lg m-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between p-4 border-b border-coc-gold-dark/30">
                    <div className="flex items-center gap-3">
                        <Image
                            src={clan.badgeUrls.medium}
                            alt={clan.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                        />
                        <div>
                            <h3 className="text-xl font-clash text-white">{clan.name}</h3>
                            <p className="text-sm text-gray-400">Level {clan.clanLevel} | {clan.members.length} Anggota Roster</p>
                        </div>
                    </div>
                    {/* PERBAIKAN: Ganti variant="ghost" dan size="icon" */}
                    <Button variant="link" size="sm" onClick={onClose} className="text-gray-400 hover:text-white p-2">
                        <XIcon className="w-5 h-5" />
                    </Button>
                </div>
                
                {/* Konten (Daftar Anggota) */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-coc-dark-blue">
                            <tr>
                                <th className="py-2 px-3 text-left font-clash text-coc-gold uppercase">Pemain</th>
                                <th className="py-2 px-3 text-center font-clash text-coc-gold uppercase">TH</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-coc-gold-dark/10">
                            {sortedMembers.map((member) => (
                                <tr key={member.tag} className="hover:bg-coc-stone/20">
                                    <td className="py-2 px-3 text-white">{member.name}</td>
                                    <td className="py-2 px-3 text-center text-coc-gold font-bold">{member.townHallLevel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// ======================================================================================================
// Main Component: CwlHistoryTabContent
// REFAKTOR TOTAL: Sekarang menampilkan CocLeagueGroup (CWL Saat Ini)
// ======================================================================================================

const CwlHistoryTabContent: React.FC<CwlHistoryTabContentProps> = ({ clan }) => {
    // --- TUGAS: Ganti state manual dengan hook SWR ---
    const { 
        cwlData, 
        isLoading, 
        isError: error, 
        mutateCWL: refreshCwl 
    } = useManagedClanCWL(clan.id);
    // --- AKHIR TUGAS ---

    const [selectedClan, setSelectedClan] = useState<CocLeagueGroupClan | null>(null);
    
    // TODO: State Sortir (Belum diimplementasikan untuk CocLeagueGroup,
    // tapi kita bisa tambahkan jika diperlukan untuk tabel klan)
    const [sort, setSort] = useState<{ key: CwlSortKey, direction: SortDirection }>({ key: 'none', direction: 'desc' });

    // --- TUGAS: Handler Refresh Baru ---
    const handleFullRefresh = useCallback(() => {
        refreshCwl();
    }, [refreshCwl]);
    
    // --- TAMPILAN LOADING ---
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
                <p className="text-lg font-clash text-white">Memuat Data CWL Saat Ini...</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Mengambil data League Group klan Anda.</p>
            </div>
        );
    }

    // --- TAMPILAN ERROR ---
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">Error Memuat Data CWL</p>
                <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">{error.message}</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Coba Muat Ulang
                </Button>
            </div>
        );
    }

    // --- TAMPILAN EMPTY STATE (TIDAK DALAM CWL) ---
    if (!cwlData || cwlData.state === 'notInWar') { // 'notInWar' mungkin tidak ada, tapi '!cwlData' cukup
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <CalendarCheck2Icon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Sedang dalam CWL</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Klan Anda saat ini tidak terdaftar di Clan War League.</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Muat Ulang
                </Button>
            </div>
        );
    }
    
    // --- TAMPILAN UTAMA (JIKA DATA CWL ADA) ---

    // Format Musim (Contoh: "2024-07" -> "Juli 2024")
    const formattedSeason = cwlData.season ? format(new Date(cwlData.season + '-02'), 'MMMM yyyy', { locale: id }) : 'Musim Tidak Diketahui';

    // Tentukan status
    let statusText = 'Selesai';
    let statusColor = 'text-coc-green';
    if (cwlData.state === 'preparation') {
        statusText = 'Masa Persiapan';
        statusColor = 'text-coc-blue';
    } else if (cwlData.state === 'inWar') {
        statusText = 'Sedang Berperang';
        statusColor = 'text-coc-red';
    }

    // Data Ronde (War Tags)
    const rounds = cwlData.rounds || [];
    
    // Data Klan (Peserta Grup)
    const clans = cwlData.clans || [];

    return (
        <div className="space-y-6">
            {/* Header CWL */}
            <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
                <div>
                    <h2 className="text-2xl font-clash text-white flex items-center gap-2">
                        <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
                        Clan War League Saat Ini
                    </h2>
                    <p className="text-gray-400">
                        Musim: <span className="font-bold text-white">{formattedSeason}</span> | 
                        Status: <span className={`font-bold ${statusColor}`}>{statusText}</span>
                    </p>
                </div>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Muat Ulang
                </Button>
            </div>

            {/* Daftar Klan di Grup */}
            <div className="space-y-4">
                <h3 className="text-xl font-clash text-white flex items-center gap-2">
                    {/* PERBAIKAN: Ganti UsersIcon ke UserIcon */}
                    <UserIcon className="h-6 w-6 text-coc-gold" /> 
                    Grup Liga ({clans.length} Klan)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-coc-gold-dark/20">
                    <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                        <thead className="bg-coc-stone/70 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Klan</th>
                                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Level</th>
                                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Anggota</th>
                                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-coc-gold-dark/10">
                            {clans.map(c => (
                                <tr key={c.tag} className="hover:bg-coc-stone/20">
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={c.badgeUrls.medium}
                                                alt={c.name}
                                                width={32}
                                                height={32}
                                                className="rounded"
                                            />
                                            <span className="font-semibold text-white">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-300">{c.clanLevel}</td>
                                    <td className="px-3 py-2 text-center text-gray-300">{c.members.length}</td>
                                    <td className="px-3 py-2 text-center">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="text-xs"
                                            onClick={() => setSelectedClan(c)}
                                        >
                                            Lihat Roster
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Daftar Ronde Perang */}
            <div className="space-y-4">
                <h3 className="text-xl font-clash text-white">Ronde Perang ({rounds.length} Hari)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {rounds.map((round, index) => (
                        <div key={index} className="card-stone p-4 rounded-lg border border-coc-gold-dark/30">
                            <h4 className="font-clash text-coc-gold">Hari Ke-{index + 1}</h4>
                            <p className="text-sm text-gray-400 mt-1">
                                {round.warTags.length} Pertempuran
                            </p>
                            {/* Di Tahap 3, kita bisa membuat warTag ini bisa diklik untuk fetch detail CocWarLog */}
                            <ul className="text-xs text-gray-500 mt-2 space-y-1 font-mono">
                                {round.warTags.map(tag => (
                                    <li key={tag} className="truncate">
                                        {tag === '#0' ? 'Belum Dimulai' : tag}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Roster */}
            <CwlRosterModal
                clan={selectedClan}
                onClose={() => setSelectedClan(null)}
            />
        </div>
    );
};

export default CwlHistoryTabContent;

