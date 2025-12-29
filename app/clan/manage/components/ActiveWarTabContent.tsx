'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useManagedClanWar } from '@/lib/hooks/useManagedClan';
import {
  ManagedClan,
  CocWarLog,
  CocWarMember,
  CocCurrentWar,
  CocWarAttack,
  WarArchive
} from '@/lib/clashub.types';
import {
  SwordsIcon,
  AlertTriangleIcon,
  TrophyIcon,
  ShieldIcon,
  StarIcon,
  RefreshCwIcon,
  Loader2Icon,
  ArrowRightIcon,
  ClockIcon
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage';
import WarDetailModal from './WarDetailModal';

// Helper untuk format sisa waktu
const formatWarTime = (war: CocWarLog | CocCurrentWar, t: any): { text: string; isEnded: boolean } => {
  const endTimeStr = war.endTime;
  const endTime = endTimeStr ? (typeof endTimeStr === 'string' ? new Date(endTimeStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/, '$1-$2-$3T$4:$5:$6Z')) : new Date(endTimeStr)) : null;
  
  if (!endTime || isNaN(endTime.getTime())) {
    return { text: 'N/A', isEnded: false };
  }
  
  const timeRemainingMs = endTime.getTime() - Date.now();
  
  if (timeRemainingMs <= 0) {
    return { text: t.clanWar.statusEnded, isEnded: true };
  }
  
  const totalSeconds = Math.floor(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { text: `${hours}h ${minutes}m ${seconds}s`, isEnded: false };
};

// Visual Bar Persentase
const DestructionBar = ({ percentage, colorClass }: { percentage: number, colorClass: string }) => (
  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10 mt-1 shadow-inner relative">
    <div 
      className={`h-full ${colorClass} transition-all duration-1000 ease-out relative`} 
      style={{ width: `${percentage}%` }}
    >
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]" />
    </div>
  </div>
);

interface ActiveWarTabContentProps {
  clan: ManagedClan;
}

// ======================================================================================================
// Main Component: ActiveWarTabContent
// ======================================================================================================

const ActiveWarTabContent: React.FC<ActiveWarTabContentProps> = ({
  clan 
}) => {
  const { t } = useLanguage();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    warData: currentWar,
    isError: error,
    isLoading,
    mutateWar: refreshWar
  } = useManagedClanWar(clan.id);

  const [timeInfo, setTimeInfo] = useState({ text: 'Loading...', isEnded: true });
  // [FIX] Optional chaining untuk warTag
  const isCwl = !!currentWar?.warTag;

  // --- Effect untuk update waktu tersisa ---
  useEffect(() => {
    if (!currentWar) {
      setTimeInfo({ text: 'N/A', isEnded: true });
      return;
    }
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
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">{t.common.loading}</p>
      </div>
    );
  }
  
  // --- TAMPILAN ERROR ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-xl font-clash text-white">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-4">
          {(error as Error).message || 'Unknown error'}
        </p>
        <Button onClick={() => refreshWar()} variant="secondary" size="sm">
          <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN TIDAK ADA WAR ---
  // [FIX] Menambahkan pengecekan struktur data (clan/opponent) untuk mencegah crash
  if (!currentWar || currentWar.state === 'notInWar' || !currentWar.clan || !currentWar.opponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
        <div className="bg-white/5 p-6 rounded-full mb-6">
            <ShieldIcon className="h-16 w-16 text-coc-green/50 opacity-80" />
        </div>
        <h2 className="text-2xl font-clash text-white mb-2">{t.clanWar.noActiveWar}</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
           {t.clanManage.clanSafeDesc}
        </p>
        <Button onClick={() => refreshWar()} variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10">
          <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN JIKA WAR DITEMUKAN ---
  // Pada titik ini, currentWar.clan dan currentWar.opponent dijamin ada oleh guard clause di atas
  const ourClan = currentWar.clan.tag === clan.tag ? currentWar.clan : currentWar.opponent;
  const opponentClan = currentWar.opponent.tag !== clan.tag ? currentWar.opponent : currentWar.clan;

  let statusText = '';
  let statusBadgeClass = '';
  let containerBorderClass = '';

  if (currentWar.state === 'preparation') {
    statusText = t.clanWar.statusPrep;
    statusBadgeClass = 'bg-coc-blue/20 text-coc-blue border-coc-blue/30';
    containerBorderClass = 'border-coc-blue/30 shadow-[0_0_30px_rgba(0,0,255,0.1)]';
  } else if (currentWar.state === 'inWar') {
    statusText = t.clanWar.statusBattle;
    statusBadgeClass = 'bg-coc-red/20 text-coc-red border-coc-red/30 animate-pulse';
    containerBorderClass = 'border-coc-red/30 shadow-[0_0_30px_rgba(255,0,0,0.1)]';
  } else if (currentWar.state === 'warEnded') {
    statusText = t.clanWar.statusEnded;
    statusBadgeClass = 'bg-coc-gold/20 text-coc-gold border-coc-gold/30';
    containerBorderClass = 'border-coc-gold/30';
  }

  // Hitung Quick Stats
  const attacksUsed = ourClan.attacks || 0;
  // [FIX] Optional chaining pada ourClan.members untuk mencegah crash jika array member kosong
  const totalMembers = currentWar.teamSize || ourClan.members?.length || 0;
  const maxAttacks = totalMembers * (currentWar.attacksPerMember || (isCwl ? 1 : 2));
  const attackPercentage = maxAttacks > 0 ? Math.round((attacksUsed / maxAttacks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* --- WAR DASHBOARD CARD --- */}
      <div className={`relative overflow-hidden rounded-3xl border bg-[#151515] ${containerBorderClass}`}>
        
        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute -top-24 -left-24 w-96 h-96 ${currentWar.state === 'inWar' ? 'bg-coc-red/10' : 'bg-coc-blue/10'} rounded-full blur-[100px]`} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] opacity-20" />
        </div>

        {/* --- HEADER SECTION --- */}
        <div className="relative z-10 border-b border-white/10 bg-white/[0.02] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${statusBadgeClass}`}>
                    {statusText}
                </span>
                <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">
                    {currentWar.teamSize} vs {currentWar.teamSize} • {isCwl ? 'CWL' : 'Classic'}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                    <ClockIcon className={`h-4 w-4 ${timeInfo.isEnded ? 'text-gray-500' : 'text-coc-gold'}`} />
                    <span className="font-mono text-sm font-bold">{timeInfo.text}</span>
                </div>
                <Button onClick={() => refreshWar()} variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                    <RefreshCwIcon className='h-4 w-4'/>
                </Button>
            </div>
        </div>

        {/* --- SCOREBOARD SECTION --- */}
        <div className="relative z-10 px-6 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            
            {/* Our Clan */}
            <div className="flex-1 w-full text-center md:text-left flex flex-col md:items-start items-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-coc-blue/10 rounded-xl border border-coc-blue/30 shadow-[0_0_20px_rgba(0,0,255,0.15)]">
                        <ShieldIcon className="h-8 w-8 md:h-10 md:w-10 text-coc-blue" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-2xl md:text-4xl font-clash text-white tracking-wide truncate max-w-[200px] md:max-w-xs leading-none">
                            {ourClan.name}
                        </h2>
                        <span className="text-[10px] md:text-xs text-coc-blue font-bold tracking-[0.2em] uppercase">Level {ourClan.clanLevel}</span>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="w-full max-w-[280px] mt-4 bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2">
                            <StarIcon className="h-6 w-6 fill-coc-gold text-coc-gold drop-shadow-md" />
                            <span className="text-3xl md:text-4xl font-bold text-white">{ourClan.stars}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-400 mb-1">{ourClan.destructionPercentage.toFixed(2)}%</span>
                    </div>
                    <DestructionBar percentage={ourClan.destructionPercentage} colorClass="bg-coc-blue shadow-[0_0_15px_#2B60DE]" />
                    <div className="mt-3 flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span>Attacks: {attacksUsed}/{maxAttacks}</span>
                        <span>{attackPercentage}% Done</span>
                    </div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="shrink-0 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-[40px]" />
                <div className="relative z-10 bg-black/60 border border-white/20 p-4 rounded-full backdrop-blur-md shadow-2xl">
                    <SwordsIcon className="h-8 w-8 md:h-12 md:w-12 text-coc-gold animate-pulse-slow" />
                </div>
            </div>

            {/* Opponent Clan */}
            <div className="flex-1 w-full text-center md:text-right flex flex-col md:items-end items-center">
                <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <div className="p-3 bg-coc-red/10 rounded-xl border border-coc-red/30 shadow-[0_0_20px_rgba(255,0,0,0.15)]">
                        <ShieldIcon className="h-8 w-8 md:h-10 md:w-10 text-coc-red" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl md:text-4xl font-clash text-white tracking-wide truncate max-w-[200px] md:max-w-xs leading-none">
                            {opponentClan.name}
                        </h2>
                        <span className="text-[10px] md:text-xs text-coc-red font-bold tracking-[0.2em] uppercase">Level {opponentClan.clanLevel}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="w-full max-w-[280px] mt-4 bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between items-end mb-2 flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <StarIcon className="h-6 w-6 fill-coc-red text-coc-red drop-shadow-md" />
                            <span className="text-3xl md:text-4xl font-bold text-white">{opponentClan.stars}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-400 mb-1">{opponentClan.destructionPercentage.toFixed(2)}%</span>
                    </div>
                    <DestructionBar percentage={opponentClan.destructionPercentage} colorClass="bg-coc-red shadow-[0_0_15px_#FF0000]" />
                    <div className="mt-3 flex justify-end text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span>Attacks: {opponentClan.attacks || 0}/{maxAttacks}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FOOTER ACTION --- */}
        <div className="relative z-10 p-4 bg-black/40 border-t border-white/5 flex justify-center">
            <Button 
                onClick={() => setIsDetailModalOpen(true)}
                variant="primary"
                size="lg"
                className="w-full md:w-auto px-8 py-6 text-lg font-bold shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all transform hover:-translate-y-1"
            >
                {t.clanManage.viewWarDetails} <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </div>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-[#151515] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Attacks</p>
            <p className="text-2xl font-clash text-white">{attacksUsed + (opponentClan.attacks || 0)}</p>
         </div>
         <div className="bg-[#151515] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Avg. Destruction</p>
            <p className="text-2xl font-clash text-coc-gold">{((ourClan.destructionPercentage + opponentClan.destructionPercentage) / 2).toFixed(1)}%</p>
         </div>
         <div className="bg-[#151515] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">3-Star Attacks</p>
            <p className="text-2xl font-clash text-coc-green">
                {/* [FIX] Optional chaining pada members dan attacks */}
                {(ourClan.members?.reduce((sum: number, m: CocWarMember) => sum + (m.attacks?.filter(a => a.stars === 3).length || 0), 0) || 0)}
            </p>
         </div>
         <div className="bg-[#151515] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Defended Stars</p>
            <p className="text-2xl font-clash text-coc-blue">
                {/* [FIX] Optional chaining pada members */}
                {(ourClan.members?.reduce((sum: number, m: CocWarMember) => sum + (3 - (m.bestOpponentAttack?.stars || 0)), 0) || 0)}
            </p>
         </div>
      </div>

      {/* Detail Modal Pop-up */}
      {isDetailModalOpen && (
        <WarDetailModal 
            clan={clan} 
            warData={currentWar as unknown as WarArchive} // Casting sementara karena struktur mirip
            onClose={() => setIsDetailModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ActiveWarTabContent;