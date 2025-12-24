'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CocWarLog,
  CocWarMember,
  CocCurrentWar,
} from '@/lib/types';
import {
  SwordsIcon,
  StarIcon,
  ShieldIcon,
  TrophyIcon,
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';

/**
 * @function formatWarTime
 * Helper untuk format sisa waktu
 */
const formatWarTime = (
  war: CocWarLog | CocCurrentWar,
): { text: string; isEnded: boolean } => {
  const endTimeStr = war.endTime;
  const endTime = endTimeStr
    ? typeof endTimeStr === 'string'
      ? new Date(
          endTimeStr.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/,
            '$1-$2-$3T$4:$5:$6Z',
          ),
        )
      : new Date(endTimeStr)
    : null;

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

  return {
    text: `${hours}j ${minutes}m ${seconds}d`,
    isEnded: false,
  };
};

// ======================================================================================================
// Helper: War Member Row
// ======================================================================================================

interface WarMemberRowProps {
  member: CocWarMember;
  isOurClan: boolean;
  isCwl: boolean;
}

const WarMemberRow: React.FC<WarMemberRowProps> = ({
  member,
  isOurClan,
  isCwl,
}) => {
  const bestAttackReceived = member.bestOpponentAttack;
  const attacksDone = member.attacks?.length || 0;
  const maxAttacks = isCwl ? 1 : 2;
  let defenseStars = 0;
  let defenseDestruction = 0;

  if (bestAttackReceived) {
    defenseStars = bestAttackReceived.stars;
    defenseDestruction = bestAttackReceived.destructionPercentage;
  }

  let attackSummary = (
    <span className="text-gray-600">-</span>
  );

  if (isOurClan) {
    if (attacksDone > 0) {
       // Visual bar untuk serangan
       const attackColor = attacksDone === maxAttacks ? 'bg-coc-green' : 'bg-coc-orange';
       attackSummary = (
         <div className="flex flex-col items-center gap-1">
             <span className="text-xs font-bold text-white">{attacksDone}/{maxAttacks}</span>
             <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${attackColor}`} style={{ width: `${(attacksDone / maxAttacks) * 100}%` }} />
             </div>
         </div>
       );
    }
  } else if (!isOurClan && bestAttackReceived) {
    attackSummary = (
        <div className="flex flex-col items-center text-xs">
            <span className="text-coc-red font-bold">Diserang</span>
            <span className="text-gray-400">{bestAttackReceived.stars}⭐ ({bestAttackReceived.destructionPercentage.toFixed(0)}%)</span>
        </div>
    );
  }

  const starColorClass =
    defenseStars === 3
      ? 'text-coc-red drop-shadow-md'
      : defenseStars > 0
        ? 'text-coc-gold'
        : 'text-gray-600 opacity-50';

  return (
    <tr className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
      {/* Posisi Peta */}
      <td className="px-4 py-3 text-center text-sm font-mono text-gray-500 group-hover:text-white transition-colors">
        {member.mapPosition}.
      </td>

      {/* Pemain */}
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0">
            <Image
              src={getThImage(member.townhallLevel)}
              alt={`TH ${member.townhallLevel}`}
              width={40}
              height={40}
              className="rounded-lg shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 bg-black/80 text-[8px] md:text-[10px] px-1 rounded text-white border border-white/20">
                {member.townhallLevel}
            </div>
          </div>
          <div>
            <p className="font-clash text-sm md:text-base text-white truncate max-w-[120px] md:max-w-[180px]">
              {member.name}
            </p>
            <p className="text-gray-500 text-[10px] font-mono">{member.tag}</p>
          </div>
        </div>
      </td>

      {/* Serangan Dilakukan */}
      <td className="px-4 py-3 text-center">
        {isOurClan ? attackSummary : '-'}
      </td>

      {/* Pertahanan */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <StarIcon className={`w-4 h-4 ${starColorClass}`} />
          <span className={`text-sm font-bold ${defenseStars === 3 ? 'text-coc-red' : 'text-gray-300'}`}>
            {defenseStars}
          </span>
        </div>
      </td>

      {/* Detail Pertahanan */}
      <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono">
        {defenseDestruction.toFixed(1)}%
      </td>
    </tr>
  );
};

// ======================================================================================================
// Main Component: CurrentWarDisplay
// ======================================================================================================

interface CurrentWarDisplayProps {
  currentWar: CocCurrentWar;
  ourClanTag: string; // Tag klan "kita" (Tim 1) untuk menentukan sisi
}

const CurrentWarDisplay: React.FC<CurrentWarDisplayProps> = ({
  currentWar,
  ourClanTag,
}) => {
  const [timeInfo, setTimeInfo] = useState({ text: '...', isEnded: true });
  const isCwl = !!currentWar?.warTag;

  // --- Effect untuk update waktu tersisa ---
  useEffect(() => {
    if (!currentWar) {
      setTimeInfo({ text: 'N/A', isEnded: true });
      return;
    }
    setTimeInfo(formatWarTime(currentWar));
    const timer = setInterval(() => {
      if (currentWar) {
        setTimeInfo(formatWarTime(currentWar));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentWar]);

  // --- TAMPILAN JIKA WAR DITEMUKAN ---
  // Tentukan mana 'ourClan' dan 'opponentClan' berdasarkan ourClanTag
  const ourClan =
    currentWar.clan.tag === ourClanTag
      ? currentWar.clan
      : currentWar.opponent;
  const opponentClan =
    currentWar.opponent.tag === ourClanTag
      ? currentWar.opponent
      : currentWar.clan;

  let statusText = '';
  let statusBadgeClass = 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  let accentColor = 'border-white/10';

  if (currentWar.state === 'preparation') {
    statusText = 'Persiapan';
    statusBadgeClass = 'bg-coc-blue/20 text-coc-blue border-coc-blue/30';
    accentColor = 'border-coc-blue/30';
  } else if (currentWar.state === 'inWar') {
    statusText = 'Sedang Berlangsung';
    statusBadgeClass = 'bg-coc-gold/20 text-coc-gold border-coc-gold/30 animate-pulse';
    accentColor = 'border-coc-gold/30';
  } else if (currentWar.state === 'warEnded') {
    statusText = 'Berakhir';
    statusBadgeClass = 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  }

  // Menghitung persentase bar skor
  const totalPossibleStars = ourClan.members.length * 3;
  const ourProgress = (ourClan.stars / totalPossibleStars) * 100;
  const opponentProgress = (opponentClan.stars / totalPossibleStars) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. WAR HEADER CARD */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#252525] to-[#1a1a1a] border ${accentColor} shadow-2xl`}>
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-transparent to-coc-red opacity-50" />
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
            <SwordsIcon className="w-64 h-64 text-white" />
        </div>

        <div className="p-6 md:p-8 relative z-10">
            {/* Top Bar: Status & Time */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                    {statusText}
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-mono text-sm bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                    <span>Sisa Waktu:</span>
                    <span className="text-white font-bold">{timeInfo.text}</span>
                </div>
            </div>

            {/* Scoreboard Utama */}
            <div className="flex items-center justify-between gap-4">
                
                {/* Tim Kita */}
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg md:text-2xl font-clash text-white truncate mb-1">{ourClan.name}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-coc-gold" />
                        <span className="text-3xl md:text-5xl font-clash text-white drop-shadow-md">{ourClan.stars}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1">{ourClan.destructionPercentage.toFixed(2)}% Hancur</p>
                </div>

                {/* VS Badge */}
                <div className="shrink-0 flex flex-col items-center px-2">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center shadow-lg">
                        <span className="font-clash text-xl md:text-2xl text-gray-500 italic">VS</span>
                    </div>
                </div>

                {/* Tim Lawan */}
                <div className="flex-1 text-center md:text-right">
                    <h3 className="text-lg md:text-2xl font-clash text-coc-red truncate mb-1">{opponentClan.name}</h3>
                    <div className="flex items-center justify-center md:justify-end gap-2">
                         <span className="text-3xl md:text-5xl font-clash text-white drop-shadow-md">{opponentClan.stars}</span>
                         <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-coc-red" />
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1">{opponentClan.destructionPercentage.toFixed(2)}% Hancur</p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-8 flex gap-2 h-2 rounded-full bg-gray-800 overflow-hidden relative">
                 {/* Center Line Marker */}
                 <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                 
                 {/* Our Bar (Left to Right) */}
                 <div 
                    className="h-full bg-gradient-to-r from-coc-blue/50 to-coc-blue" 
                    style={{ width: '50%', transform: `scaleX(${ourProgress / 100})`, transformOrigin: 'left', transition: 'transform 1s ease-out' }} 
                 />
                 
                 {/* Opponent Bar (Right to Left visual trick - actually just filling from right?) */}
                 {/* Actually simpler to just use two bars meeting in middle or stacked. Let's use two separate bars under the names for clarity */}
            </div>
            {/* Visual Bar Separated */}
            <div className="flex gap-4 mt-2">
                <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-coc-gold" style={{ width: `${Math.min(ourProgress, 100)}%` }} />
                </div>
                <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden flex justify-end">
                    <div className="h-full bg-coc-red" style={{ width: `${Math.min(opponentProgress, 100)}%` }} />
                </div>
            </div>
        </div>
      </div>

      {/* 2. DETAIL ANGGOTA & STATISTIK */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Kolom Klan Kita */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-clash text-white flex items-center gap-2">
               <ShieldIcon className="h-5 w-5 text-coc-gold" /> 
               {ourClan.name}
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
                {ourClan.members.length} Pemain
            </span>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-xs md:text-sm">
                <thead className="bg-black/30">
                    <tr>
                    <th className="px-4 py-3 text-center text-gray-500 font-bold w-10">#</th>
                    <th className="px-4 py-3 text-left text-coc-gold font-bold">Pemain</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">Atk</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">Def</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {ourClan.members.map((member: CocWarMember) => (
                    <WarMemberRow
                        key={member.tag}
                        member={member}
                        isOurClan={true}
                        isCwl={isCwl}
                    />
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* Kolom Klan Lawan */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-clash text-gray-300 flex items-center gap-2">
               <TrophyIcon className="h-5 w-5 text-coc-red" /> 
               {opponentClan.name}
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
                {opponentClan.members.length} Pemain
            </span>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden shadow-lg opacity-90">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-xs md:text-sm">
                <thead className="bg-black/30">
                    <tr>
                    <th className="px-4 py-3 text-center text-gray-500 font-bold w-10">#</th>
                    <th className="px-4 py-3 text-left text-coc-red-light font-bold">Pemain</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">Atk</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">Def</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-bold">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {opponentClan.members.map((member: CocWarMember) => (
                    <WarMemberRow
                        key={member.tag}
                        member={member}
                        isOurClan={false}
                        isCwl={isCwl}
                    />
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CurrentWarDisplay;