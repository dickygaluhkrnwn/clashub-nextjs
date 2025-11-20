'use client'; 

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useManagedClanWar } from '@/lib/hooks/useManagedClan';
import {
    ManagedClan, 
    CocWarLog, 
    CocWarMember, 
    CocCurrentWar 
} from '@/lib/types';
import {
    SwordsIcon, AlertTriangleIcon, TrophyIcon, ShieldIcon, StarIcon,
    RefreshCwIcon, Loader2Icon 
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

// Helper untuk format sisa waktu
// [MODIFIKASI] Menambahkan parameter 't' untuk terjemahan
const formatWarTime = (war: CocWarLog | CocCurrentWar, t: any): { text: string; isEnded: boolean } => {
    const endTimeStr = war.endTime;
    const endTime = endTimeStr ? (typeof endTimeStr === 'string' ? new Date(endTimeStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/, '$1-$2-$3T$4:$5:$6Z')) : new Date(endTimeStr)) : null;
    
    if (!endTime || isNaN(endTime.getTime())) {
        return { text: 'N/A', isEnded: false };
    }
    
    const timeRemainingMs = endTime.getTime() - Date.now();
    
    if (timeRemainingMs <= 0) {
        return { text: t.clanWar.statusEnded, isEnded: true }; // [i18n]
    }
    
    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // [i18n] Format: "Sisa Waktu: ... " atau "War Ends In: ..."
    return { text: `${t.dashboard.warEnds} ${hours}h ${minutes}m ${seconds}s`, isEnded: false };
};


interface ActiveWarTabContentProps {
    clan: ManagedClan;
}

// ======================================================================================================
// Helper: War Member Row
// ======================================================================================================

interface WarMemberRowProps {
    member: CocWarMember;
    isOurClan: boolean;
    clanTag: string;
    isCwl: boolean;
    t: any; // [BARU] Props translation
}

const WarMemberRow: React.FC<WarMemberRowProps> = ({ member, isOurClan, clanTag, isCwl, t }) => {
    const bestAttackReceived = member.bestOpponentAttack;
    const attacksDone = member.attacks?.length || 0;
    const maxAttacks = isCwl ? 1 : 2;
    let defenseStatus = t.clanWar.colResult; // Placeholder text default
    let defenseStars = 0;
    let defenseDestruction = 0;

    if (bestAttackReceived) {
        defenseStars = bestAttackReceived.stars;
        defenseDestruction = bestAttackReceived.destructionPercentage;
        if (defenseStars === 3) {
            defenseStatus = '3 Stars'; // Bisa di-i18n jika perlu detail
        } else {
            defenseStatus = `${defenseStars} Stars`;
        }
    }

    let attackSummary = '-';
    if (isOurClan && attacksDone > 0) {
        // [i18n] Gunakan format ringkas agar tabel tidak terlalu lebar
        attackSummary = `${attacksDone} / ${maxAttacks}`; 
    } else if (!isOurClan && bestAttackReceived) {
        attackSummary = `${bestAttackReceived.stars}⭐ (${bestAttackReceived.destructionPercentage.toFixed(0)}%)`;
    }

    const starColorClass = defenseStars === 3 ? 'text-coc-red' : defenseStars > 0 ? 'text-coc-gold' : 'text-gray-500';

    return (
        <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
            {/* Posisi Peta */}
            <td className="px-3 py-2 text-center text-sm font-clash text-white">{member.mapPosition}</td>

            {/* Pemain */}
            <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-white">
                <div className="flex items-center space-x-3">
                    <div className="relative w-8 h-8 flex-shrink-0">
                        <Image
                            src={getThImage(member.townhallLevel)}
                            alt={`TH ${member.townhallLevel}`}
                            width={28}
                            height={28}
                            className="rounded-full"
                        />
                    </div>
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
                         {/* [i18n] View Details */}
                        {t.clanWar.viewDetails}
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
    const { t } = useLanguage(); // [BARU] Init Language

    const {
        warData: currentWar,
        isError: error,
        isLoading,
        mutateWar: refreshWar
    } = useManagedClanWar(clan.id);

    const [timeInfo, setTimeInfo] = useState({ text: 'N/A', isEnded: true });
    const isCwl = !!currentWar?.warTag;

    // --- Effect untuk update waktu tersisa ---
    useEffect(() => {
        if (!currentWar) {
            setTimeInfo({ text: 'N/A', isEnded: true });
            return;
        }
        // [PERBAIKAN] Pass 't' ke helper function
        setTimeInfo(formatWarTime(currentWar, t));
        const timer = setInterval(() => {
            if (currentWar) {
                setTimeInfo(formatWarTime(currentWar, t));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [currentWar, t]);
    

    // --- TAMPILAN LOADING ---
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <Loader2Icon className="h-12 w-12 text-coc-green/50 mb-3 animate-spin" />
                <p className="text-lg font-clash text-white">{t.common.loading}</p>
            </div>
        );
    }
    
    // --- TAMPILAN ERROR ---
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">{t.common.error}</p>
                <p className="text-sm text-gray-400 font-sans max-w-md mx-auto">
                    {(error as Error).message || 'Unknown error'}
                </p>
                <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
                </Button>
            </div>
        );
    }

    // --- TAMPILAN TIDAK ADA WAR ---
    if (!currentWar) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center space-y-4">
                <AlertTriangleIcon className="h-12 w-12 text-coc-green/50 mb-3" />
                <p className="text-lg font-clash text-white">{t.clanWar.noActiveWar}</p>
                <p className="text-sm text-gray-400 font-sans max-w-md mx-auto">
                   {t.clanManage.clanSafeDesc}
                </p>
                <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
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
        statusText = t.clanWar.statusPrep; // [i18n]
        headerClass = 'text-coc-blue';
        borderClass = 'border-coc-blue/50 bg-coc-blue/10';
    } else if (currentWar.state === 'inWar') {
        statusText = t.clanWar.statusBattle; // [i18n]
        headerClass = 'text-coc-red';
        borderClass = 'border-coc-red/50 bg-coc-red/10';
    } else if (currentWar.state === 'warEnded') {
        statusText = t.clanWar.statusEnded; // [i18n]
    }

    return (
        <div className="space-y-6">

            {/* War Header Info */}
            <div className={`card-stone p-6 border-4 ${borderClass} rounded-lg`}>
                {/* [PERBAIKAN UTAMA] Tambahkan 'md:flex-nowrap' untuk mencegah wrapping layout di desktop */}
                <div className="flex justify-between items-start flex-wrap md:flex-nowrap gap-4">
                    <div>
                        <h2 className={`text-3xl font-clash ${headerClass} flex items-center gap-3`}>
                            <SwordsIcon className="h-8 w-8" />
                            {ourClan.name} vs {opponentClan.name}
                        </h2>
                        
                        <p className="text-gray-300 mt-1">
                            Status: <span className={`font-semibold capitalize ${headerClass}`}>{statusText}</span> | Tipe: {isCwl ? 'CWL' : 'Classic War'} ({ourClan.members.length} vs {opponentClan.members.length})
                        </p>
                    </div>
                        
                    <div className="text-right flex flex-col gap-2 shrink-0">
                        <p className={`text-lg font-clash ${timeInfo.isEnded ? headerClass : 'text-white'}`}>
                            {timeInfo.text}
                        </p>
                        <Button onClick={() => refreshWar()} variant="secondary" size="sm">
                            <RefreshCwIcon className='h-3 w-3 mr-1'/> {t.clanManage.reloadCache}
                        </Button>
                    </div>
                </div>

                {/* Skor Ringkasan */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t border-coc-gold/30 pt-4">
                    {/* Skor Kita */}
                    <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-gold/30">
                        <p className="text-xs text-gray-400 font-clash uppercase">{t.dashboard.myStars} / {t.dashboard.destruction}</p>
                        <p className="text-3xl font-bold text-coc-gold flex items-center justify-center gap-1 mt-1">
                            <StarIcon className="h-7 w-7 text-coc-gold" /> {ourClan.stars}
                            <span className="text-lg text-gray-300 ml-2">({ourClan.destructionPercentage.toFixed(2)}%)</span>
                        </p>
                    </div>
                    {/* Skor Lawan */}
                    <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-red/30">
                        <p className="text-xs text-gray-400 font-clash uppercase">{t.dashboard.enemyStars} / {t.dashboard.destruction}</p>
                        <p className="text-3xl font-bold text-coc-red flex items-center justify-center gap-1 mt-1">
                            <StarIcon className="h-7 w-7 text-coc-red" /> {opponentClan.stars}
                            <span className="text-lg text-gray-300 ml-2">({opponentClan.destructionPercentage.toFixed(2)}%)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detail Anggota War */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Kolom Klan Kita */}
                <div className="space-y-4">
                    <h3 className="text-xl font-clash text-white border-b border-coc-gold-dark/50 pb-2 flex items-center gap-2">
                        <ShieldIcon className="h-6 w-6 text-coc-gold" /> {t.clanWar.colTeamSize} {ourClan.name}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                            <thead className="bg-coc-stone/70 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">#</th>
                                    <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">{t.clanMembers.colPlayer}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">{t.clanWar.colAttacks}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider" colSpan={2}>{t.clanWar.colStars}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">{t.clanMembers.colActions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coc-gold-dark/10">
                                {ourClan.members.map((member: CocWarMember) => (
                                    <WarMemberRow key={member.tag} member={member} isOurClan={true} clanTag={clan.tag} isCwl={isCwl} t={t}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Kolom Klan Lawan */}
                <div className="space-y-4">
                    <h3 className="text-xl font-clash text-white border-b border-coc-red/50 pb-2 flex items-center gap-2">
                        <TrophyIcon className="h-6 w-6 text-coc-red" /> {t.clanWar.colTeamSize} {opponentClan.name}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-coc-red/20 text-xs">
                            <thead className="bg-coc-stone/70 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">#</th>
                                    <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">{t.clanMembers.colPlayer}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">{t.clanWar.colAttacks}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider" colSpan={2}>{t.clanWar.colStars}</th>
                                    <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">{t.clanMembers.colActions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-coc-red/10">
                                {opponentClan.members.map((member: CocWarMember) => (
                                    <WarMemberRow key={member.tag} member={member} isOurClan={false} clanTag={clan.tag} isCwl={isCwl} t={t}/>
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