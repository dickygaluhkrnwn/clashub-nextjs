'use client'; 

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
// TUGAS: Hapus useSWR, impor hook kustom
// import useSWR from 'swr'; // <-- DIHAPUS
import { useManagedClanWar } from '@/lib/hooks/useManagedClan'; // <-- TUGAS: DIGUNAKAN
import {
    ManagedClan, CocWarLog, CocWarMember, CocWarAttack
} from '@/lib/types';
import {
    SwordsIcon, AlertTriangleIcon, TrophyIcon, ShieldIcon, StarIcon, ClockIcon,
    ArrowRightIcon, RefreshCwIcon, BookOpenIcon, Loader2Icon 
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';

// TUGAS: Fetcher tidak diperlukan di sini lagi
// const fetcher = (url: string) => fetch(url).then((res) => res.json()); // <-- DIHAPUS

// Helper untuk format sisa waktu (Tidak Berubah)
const formatWarTime = (war: CocWarLog): { text: string; isEnded: boolean } => {
    // ... (Logika formatWarTime tetap sama)
    const endTimeStr = war.endTime;
    const endTime = endTimeStr ? (typeof endTimeStr === 'string' ? new Date(endTimeStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/, '$1-$2-$3T$4:$5:$6Z')) : new Date(endTimeStr)) : null;
    
    if (!endTime || isNaN(endTime.getTime())) {
        return { text: 'Waktu Tidak Tersedia', isEnded: false };
    }
    
    const timeRemainingMs = endTime.getTime() - Date.now();
    
    if (timeRemainingMs <= 0) {
        return { text: 'War Selesai', isEnded: true }; 
    }
    
    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return { text: `Sisa Waktu: ${hours}j ${minutes}m ${seconds}d`, isEnded: false };
};


interface ActiveWarTabContentProps {
    clan: ManagedClan;
    // Props currentWar dan onRefresh sudah dihapus (Benar)
}

// ======================================================================================================
// Helper: War Member Row
// (Tidak ada perubahan di sini, biarkan sama persis)
// ======================================================================================================

interface WarMemberRowProps {
// ... (Kode WarMemberRowProps tetap sama)
    member: CocWarMember;
    isOurClan: boolean;
    clanTag: string;
    isCwl: boolean;
}

const WarMemberRow: React.FC<WarMemberRowProps> = ({ member, isOurClan, clanTag, isCwl }) => {
    // ... (Kode WarMemberRow tetap sama)
    const bestAttackReceived = member.bestOpponentAttack;
    const attacksDone = member.attacks?.length || 0;
    const maxAttacks = isCwl ? 1 : 2;
    let defenseStatus = 'Belum Diserang';
    let defenseStars = 0;
    let defenseDestruction = 0;

    if (bestAttackReceived) {
        defenseStars = bestAttackReceived.stars;
        defenseDestruction = bestAttackReceived.destructionPercentage;
        if (defenseStars === 3) {
            defenseStatus = 'Hancur (3 Bintang)';
        } else {
            defenseStatus = `${defenseStars} Bintang Diterima`;
        }
    }

    let attackSummary = '-';
    if (isOurClan && attacksDone > 0) {
        attackSummary = `${attacksDone} / ${maxAttacks} Serangan`;
    } else if (!isOurClan && bestAttackReceived) {
        attackSummary = `Diserang: ${bestAttackReceived.stars}⭐ (${bestAttackReceived.destructionPercentage.toFixed(2)}%)`;
    }

    const starColorClass = defenseStars === 3 ? 'text-coc-red' : defenseStars > 0 ? 'text-coc-gold' : 'text-gray-500';

    return (
        <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
            {/* Posisi Peta */}
            <td className="px-3 py-2 text-center text-sm font-clash text-white">{member.mapPosition}</td>

            {/* Pemain */}
            <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-white">
                <div className="flex items-center space-x-3">
                    <Image
                        src={getThImage(member.townhallLevel)}
                        alt={`TH ${member.townhallLevel}`}
                        width={28}
                        height={28}
                        className="rounded-full"
                    />
                    <div>
                        <p className="font-clash text-base truncate max-w-[150px]">{member.name}</p>
                        <p className="text-gray-500 text-xs font-mono">{member.tag}</p>
                    </div>
                </div>
            </td>

            {/* Serangan Dilakukan */}
            <td className="px-3 py-2 text-center text-sm text-gray-300">
                {isOurClan ? attackSummary : '-'}
            </td>

            {/* Pertahanan */}
            <td className="px-3 py-2 text-center text-sm">
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border ${starColorClass} border-current`}>
                    <StarIcon className="w-3 h-3" />
                    <span>{defenseStars} ⭐</span>
                </div>
            </td>

            {/* Detail Pertahanan */}
            <td className="px-3 py-2 text-center text-xs text-gray-400">
                {defenseDestruction.toFixed(2)}%
            </td>

            {/* Aksi */}
            <td className="px-3 py-2 text-center w-[120px]">
                {isOurClan && member.attacks && member.attacks.length > 0 ? (
                    <Button size="sm" variant="secondary" className="text-xs">
                        Lihat {member.attacks.length} Serangan
                    </Button>
                ) : (
                    <span className="text-gray-600">-</span>
                )}
            </td>
        </tr>
    );
};

// ======================================================================================================
// Main Component: ActiveWarTabContent
// ======================================================================================================

const ActiveWarTabContent: React.FC<ActiveWarTabContentProps> = ({
    clan 
}) => {
    
    // TUGAS: Ganti SWR manual dengan hook kustom
    const {
        warData: currentWar, // Ganti 'data' menjadi 'warData' dan alias ke 'currentWar'
        isError: error,      // Ganti 'error' menjadi 'isError' dan alias ke 'error'
        isLoading,
        mutateWar: refreshWar // Ganti 'mutate' menjadi 'mutateWar' dan alias ke 'refreshWar'
    } = useManagedClanWar(clan.id); // <-- PANGGIL HOOK YANG BENAR

    const [timeInfo, setTimeInfo] = useState({ text: 'N/A', isEnded: true });
    const isCwl = !!currentWar?.warTag;

    // --- Effect untuk update waktu tersisa ---
    useEffect(() => {
        if (!currentWar) {
            setTimeInfo({ text: 'N/A', isEnded: true });
            return;
        }
        setTimeInfo(formatWarTime(currentWar));
        const timer = setInterval(() => {
            setTimeInfo(formatWarTime(currentWar));
        }, 1000);
        return () => clearInterval(timer);
    }, [currentWar]);
    

    // --- TAMPILAN LOADING ---
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <Loader2Icon className="h-12 w-12 text-coc-green/50 mb-3 animate-spin" />
                <p className="text-lg font-clash text-white">Memuat Data Perang Aktif...</p>
                <p className="text-sm text-gray-400 font-sans">Menyinkronkan dengan server Clash of Clans...</p>
            </div>
        );
    }
    
    // --- TAMPILAN ERROR ---
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">Gagal Memuat Data Perang</p>
                <p className="text-sm text-gray-400 font-sans max-w-md mx-auto">
                    Terjadi kesalahan: {error.message || 'Unknown error'}
                </p>
                {/* TUGAS: Pastikan memanggil refreshWar() */}
                <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Coba Lagi
                </Button>
            </div>
        );
    }

    // --- TAMPILAN TIDAK ADA WAR ---
    if (!currentWar) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <AlertTriangleIcon className="h-12 w-12 text-coc-green/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada War Klasik atau CWL Aktif</p>
                <p className="text-sm text-gray-400 font-sans max-w-md mx-auto">
                    Data perang aktif ('preparation' atau 'inWar') tidak ditemukan.
                    Jika perang baru saja dimulai, data akan muncul otomatis di sini.
                </p>
                {/* TUGAS: Pastikan memanggil refreshWar() */}
                <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Muat Ulang Data
                </Button>
            </div>
        );
    }

    // --- TAMPILAN JIKA WAR DITEMUKAN ---
    const ourClan = currentWar.clan.tag === clan.tag ? currentWar.clan : currentWar.opponent;
    const opponentClan = currentWar.opponent.tag !== clan.tag ? currentWar.opponent : currentWar.clan;

    let headerClass = '';
    let statusText = '';
    let borderClass = 'border-coc-red/50 bg-coc-red/10';

    if (currentWar.state === 'preparation') {
        statusText = 'Masa Persiapan';
        headerClass = 'text-coc-blue';
        borderClass = 'border-coc-blue/50 bg-coc-blue/10';
    } else if (currentWar.state === 'inWar') {
        statusText = 'Sedang Berperang';
        headerClass = 'text-coc-red';
        borderClass = 'border-coc-red/50 bg-coc-red/10';
    }


    return (
        <div className="space-y-6">

            {/* War Header Info */}
            <div className={`card-stone p-6 border-4 ${borderClass} rounded-lg`}>
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h2 className={`text-3xl font-clash ${headerClass} flex items-center gap-3`}>
                            <SwordsIcon className="h-8 w-8" />
                            {ourClan.name} vs {opponentClan.name}
                        </h2>
                        
                        <p className="text-gray-300 mt-1">
                            Status: <span className={`font-semibold capitalize ${headerClass}`}>{statusText}</span> | Tipe: {isCwl ? 'CWL' : 'Classic War'} ({ourClan.members.length} vs {opponentClan.members.length})
                        </p>
                    </div>
                        
                    <div className="text-right flex flex-col gap-2">
                            <p className={`text-lg font-clash ${timeInfo.isEnded ? headerClass : 'text-white'}`}>
                                {timeInfo.text}
                            </p>
                            {/* TUGAS: Pastikan memanggil refreshWar() */}
                            <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                                <RefreshCwIcon className='h-3 w-3 mr-1'/> Refresh Data
                            </Button>
                    </div>
                </div>

                {/* Skor Ringkasan */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t border-coc-gold/30 pt-4">
                    {/* Skor Kita */}
                    <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-gold/30">
                        <p className="text-xs text-gray-400 font-clash uppercase">Total Bintang Kita / Persentase Hancur</p>
                        <p className="text-3xl font-bold text-coc-gold flex items-center justify-center gap-1 mt-1">
                            <StarIcon className="h-7 w-7 text-coc-gold" /> {ourClan.stars}
                            <span className="text-lg text-gray-300 ml-2">({ourClan.destructionPercentage.toFixed(2)}%)</span>
                        </p>
                    </div>
                    {/* Skor Lawan */}
                    <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-red/30">
                        <p className="text-xs text-gray-400 font-clash uppercase">Total Bintang Lawan / Persentase Hancur</p>
                        <p className="text-3xl font-bold text-coc-red flex items-center justify-center gap-1 mt-1">
                            <StarIcon className="h-7 w-7 text-coc-red" /> {opponentClan.stars}
                            <span className="text-lg text-gray-300 ml-2">({opponentClan.destructionPercentage.toFixed(2)}%)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detail Anggota War */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Kolom Klan Kita */}
                <div className="space-y-4">
                    <h3 className="text-xl font-clash text-white border-b border-coc-gold-dark/50 pb-2 flex items-center gap-2">
                        <ShieldIcon className="h-6 w-6 text-coc-gold" /> Daftar {ourClan.name}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                            <thead className="bg-coc-stone/70 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">#</th>
                                    <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Serangan</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider" colSpan={2}>Pertahanan Terbaik</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coc-gold-dark/10">
                                {ourClan.members.map(member => (
                                    <WarMemberRow key={member.tag} member={member} isOurClan={true} clanTag={clan.tag} isCwl={isCwl}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Klan Lawan */}
                <div className="space-y-4">
                    <h3 className="text-xl font-clash text-white border-b border-coc-red/50 pb-2 flex items-center gap-2">
                        <TrophyIcon className="h-6 w-6 text-coc-red" /> Daftar {opponentClan.name}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-coc-red/20 text-xs">
                            <thead className="bg-coc-stone/70 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">#</th>
                                    <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Pemain</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Diserang</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider" colSpan={2}>Bintang Terbaik</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coc-red/10">
                                {opponentClan.members.map(member => (
                                    <WarMemberRow key={member.tag} member={member} isOurClan={false} clanTag={clan.tag} isCwl={isCwl}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Akhir Detail Anggota War */}

        </div>
    );
};

export default ActiveWarTabContent;

