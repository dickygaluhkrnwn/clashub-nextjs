import React, { useState } from 'react';
import Image from 'next/image';
import {
    ManagedClan, CocWarLog, CocWarMember, CocWarAttack
} from '@/lib/types';
import {
    SwordsIcon, AlertTriangleIcon, TrophyIcon, ShieldIcon, StarIcon, ClockIcon,
    ArrowRightIcon, RefreshCwIcon
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';

interface ActiveWarTabContentProps {
    clan: ManagedClan;
    currentWar: CocWarLog | null | undefined;
    onRefresh: () => void;
}

// ======================================================================================================
// Helper: War Member Row
// ======================================================================================================

interface WarMemberRowProps {
    member: CocWarMember;
    isOurClan: boolean;
    clanTag: string;
}

const WarMemberRow: React.FC<WarMemberRowProps> = ({ member, isOurClan, clanTag }) => {
    // Cari attack terbaik yang diterima (jika ada)
    const bestAttackReceived = member.bestOpponentAttack;

    // Total serangan yang dilakukan (hanya untuk klan kita)
    const attacksDone = member.attacks?.length || 0;
    // --- PERBAIKAN: Deteksi tipe war untuk max attacks ---
    // Sementara kita belum punya tipe war eksplisit di CocWarLog, kita bisa coba tebak dari teamSize
    // CWL biasanya 15v15 atau 30v30, Classic bisa bervariasi
    // Atau kita bisa asumsikan 2 untuk Classic sementara
    const isPotentiallyCWL = member.attacks?.length === 1 && member.opponentAttacks <= 1; // Heuristik sederhana
    const maxAttacks = isPotentiallyCWL ? 1 : 2; // Default 2 untuk Classic

    // Tentukan status serangan/pertahanan
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

    // Tampilan persentase serangan terbaik yang dilakukan (Jika klan kita)
    let attackSummary = '-';
    if (isOurClan && attacksDone > 0) {
        attackSummary = `${attacksDone} / ${maxAttacks} Serangan`;
    } else if (!isOurClan && bestAttackReceived) {
        // Tampilan status pertahanan lawan
        attackSummary = `Diserang: ${bestAttackReceived.stars}⭐ (${bestAttackReceived.destructionPercentage.toFixed(2)}%)`;
    }

    const starColorClass = defenseStars === 3 ? 'text-coc-red' : defenseStars > 0 ? 'text-coc-gold' : 'text-gray-500';


    return (
        <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
            {/* Kolom Posisi Peta */}
            <td className="px-3 py-2 text-center text-sm font-clash text-white">{member.mapPosition}</td>

            {/* Kolom Pemain (TH, Nama, Tag) */}
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

            {/* Kolom Serangan Dilakukan (Jika klan kita) */}
            <td className="px-3 py-2 text-center text-sm text-gray-300">
                {isOurClan ? attackSummary : '-'}
            </td>

            {/* Kolom Pertahanan / Serangan Terbaik Lawan */}
            <td className="px-3 py-2 text-center text-sm">
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border ${starColorClass} border-current`}>
                    <StarIcon className="w-3 h-3" />
                    <span>{defenseStars} ⭐</span>
                </div>
            </td>

            {/* Kolom Detail Pertahanan */}
            <td className="px-3 py-2 text-center text-xs text-gray-400">
                 {defenseDestruction.toFixed(2)}%
            </td>

            {/* Kolom Aksi / Target (Serangan yang Dilakukan Klan Kita) */}
            <td className="px-3 py-2 text-center w-[120px]">
                {isOurClan && member.attacks && member.attacks.length > 0 ? (
                    <Button size="sm" variant="secondary" className="text-xs"> {/* PERBAIKAN: size="xs" diganti menjadi size="sm" */}
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

/**
 * @component ActiveWarTabContent
 * Menampilkan detail penuh dari War Aktif klan.
 */
const ActiveWarTabContent: React.FC<ActiveWarTabContentProps> = ({
    clan, currentWar, onRefresh
}) => {

    // Periksa status war
    const war = currentWar;
    // --- PERBAIKAN LOGIKA isWarActive ---
    // Tetap tampilkan jika statusnya 'preparation' atau 'inWar'
    const isWarActive = war && (war.state === 'preparation' || war.state === 'inWar');

    if (!war || !isWarActive) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <AlertTriangleIcon className="h-12 w-12 text-coc-green/50 mb-3" />
                <p className="text-lg font-clash text-white">Tidak Ada War Klasik atau CWL Aktif</p>
                <p className="text-sm text-gray-400 font-sans">
                    Data perang aktif (status 'inWar' atau 'preparation') tidak ditemukan di cache. Silakan sinkronisasi jika ada perang baru.
                </p>
                <Button onClick={onRefresh} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Muat Ulang Data
                </Button>
            </div>
        );
    }

    // Tentukan klan kita dan lawan
    const ourClan = war.clan.tag === clan.tag ? war.clan : war.opponent;
    const opponentClan = war.opponent.tag !== clan.tag ? war.opponent : war.clan;

    // --- HAPUS LOGIKA WAKTU TERSISA ---
    // const endTime = new Date(war.endTime);
    // const timeRemainingMs = endTime.getTime() - Date.now();
    // const hoursRemaining = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    // const minutesRemaining = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
    // const timeRemainingText = timeRemainingMs > 0 ?
    //     `${hoursRemaining} jam ${minutesRemaining} menit` : 'War Selesai';

    const headerClass = war.state === 'preparation' ? 'text-coc-blue' : 'text-coc-red';
    // --- Teks Status Dinamis ---
    const statusText = war.state === 'preparation' ? 'Masa Persiapan' : 'Sedang Berperang';

    return (
        <div className="space-y-6">

            {/* War Header Info */}
            <div className="card-stone p-6 border-4 border-coc-red/50 bg-coc-red/10 rounded-lg">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h2 className={`text-3xl font-clash ${headerClass} flex items-center gap-3`}>
                            <SwordsIcon className="h-8 w-8" />
                            {ourClan.name} vs {opponentClan.name}
                        </h2>
                        {/* --- PERBAIKAN: Gabungkan Status ke sini --- */}
                        <p className="text-gray-300 mt-1">
                            Status: <span className={`font-semibold capitalize ${war.state === 'preparation' ? 'text-blue-400' : 'text-red-400'}`}>{statusText}</span> | Tipe: {war.warTag ? 'CWL' : 'Classic War'} ({ourClan.members.length} vs {opponentClan.members.length})
                        </p>
                    </div>
                     {/* --- HAPUS BAGIAN WAKTU TERSISA --- */}
                    {/* <div className="text-right"> ... </div> */}
                    {/* --- Tambahkan Tombol Refresh di sini jika diinginkan --- */}
                     <div className="text-right">
                         <Button onClick={onRefresh} variant="secondary" size="sm">
                             <RefreshCwIcon className='h-3 w-3 mr-1'/> Refresh
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
                                    <WarMemberRow key={member.tag} member={member} isOurClan={true} clanTag={clan.tag}/>
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
                                    <WarMemberRow key={member.tag} member={member} isOurClan={false} clanTag={clan.tag}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ActiveWarTabContent;
