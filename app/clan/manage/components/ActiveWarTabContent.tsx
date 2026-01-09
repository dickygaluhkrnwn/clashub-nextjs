'use client';

import React, { useState, useEffect } from 'react';
import { useManagedClanWar } from '@/lib/hooks/useManagedClan';
import {
  ManagedClan,
  CocWarLog,
  CocCurrentWar,
  CocWarMember,
  WarArchive,
  CocWarAttack // <--- Menambahkan CocWarAttack di sini
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
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage';
import WarDetailModal from './WarDetailModal';

// Helper untuk format sisa waktu (Logic Stabil)
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

// Visual Bar Persentase (Gaming UI)
const DestructionBar = ({ percentage, colorClass, shadowClass }: { percentage: number, colorClass: string, shadowClass: string }) => (
  <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 mt-2 shadow-inner relative">
    <div 
      className={`h-full ${colorClass} transition-all duration-1000 ease-out relative`} 
      style={{ width: `${percentage}%` }}
    >
        <div className={`absolute right-0 top-0 bottom-0 w-[2px] bg-white/80 ${shadowClass}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
    </div>
  </div>
);

interface ActiveWarTabContentProps {
  clan: ManagedClan;
}

const ActiveWarTabContent: React.FC<ActiveWarTabContentProps> = ({
  clan 
}) => {
  const { t } = useLanguage();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- LOGIC STABIL: Menggunakan hook dan state check yang sederhana ---
  const {
    warData: currentWar,
    isError: error,
    isLoading,
    mutateWar: refreshWar
  } = useManagedClanWar(clan.id);

  const [timeInfo, setTimeInfo] = useState({ text: 'Loading...', isEnded: true });
  // Logic stabil untuk deteksi CWL
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
        <div className="relative">
            <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2Icon className="h-12 w-12 text-coc-gold animate-spin relative z-10" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse mt-4 font-clash tracking-wider">{t.common.loading}</p>
      </div>
    );
  }
  
  // --- TAMPILAN ERROR ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white tracking-wide mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-6">
          {(error as Error).message || 'Unknown error'}
        </p>
        <Button onClick={() => refreshWar()} variant="secondary" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10">
          <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN TIDAK ADA WAR (LOGIC STABIL) ---
  // Kita pakai check sederhana `!currentWar` agar tidak false negative pada CWL
  if (!currentWar || currentWar.state === 'notInWar') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
        <div className="bg-[#15171e] p-6 rounded-full mb-6 border border-white/5 shadow-xl">
            <ShieldIcon className="h-16 w-16 text-coc-green/50 opacity-80" />
        </div>
        <h2 className="text-2xl font-clash text-white mb-2 tracking-wide">{t.clanWar.noActiveWar}</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed font-sans">
           {t.clanManage.clanSafeDesc}
        </p>
        <Button onClick={() => refreshWar()} variant="secondary" className="bg-white/5 hover:bg-white/10 border border-white/10">
          <RefreshCwIcon className='h-4 w-4 mr-2'/> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN JIKA WAR DITEMUKAN (GAMING UI) ---
  // Menggunakan data yang sudah divalidasi keberadaannya
  // Fallback ke currentWar.clan jika opponent undefined (kadang terjadi di CWL preparation awal)
  const ourClan = currentWar.clan.tag === clan.tag ? currentWar.clan : currentWar.opponent;
  const opponentClan = currentWar.opponent && currentWar.opponent.tag !== clan.tag ? currentWar.opponent : (currentWar.clan.tag !== clan.tag ? currentWar.clan : currentWar.opponent);

  // Jika data opponent benar-benar rusak/kosong (edge case), tampilkan error state yang cantik
  if (!ourClan || !opponentClan) {
      return (
        <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
            <AlertTriangleIcon className="h-10 w-10 text-coc-gold mx-auto mb-4" />
            <p className="text-white">War data incomplete. Please refresh.</p>
            <Button onClick={() => refreshWar()} variant="ghost" className="mt-4"><RefreshCwIcon className="mr-2 h-4 w-4"/> Refresh</Button>
        </div>
      )
  }

  let statusText = '';
  let statusBadgeClass = '';
  let containerBorderClass = '';
  let glowColorClass = '';

  if (currentWar.state === 'preparation') {
    statusText = t.clanWar.statusPrep;
    statusBadgeClass = 'bg-coc-blue/10 text-coc-blue border-coc-blue/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    containerBorderClass = 'border-coc-blue/20 hover:border-coc-blue/40';
    glowColorClass = 'bg-coc-blue/10';
  } else if (currentWar.state === 'inWar') {
    statusText = t.clanWar.statusBattle;
    statusBadgeClass = 'bg-coc-red/10 text-coc-red border-coc-red/30 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    containerBorderClass = 'border-coc-red/20 hover:border-coc-red/40';
    glowColorClass = 'bg-coc-red/10';
  } else if (currentWar.state === 'warEnded') {
    statusText = t.clanWar.statusEnded;
    statusBadgeClass = 'bg-coc-gold/10 text-coc-gold border-coc-gold/30';
    containerBorderClass = 'border-coc-gold/20 hover:border-coc-gold/40';
    glowColorClass = 'bg-coc-gold/10';
  }

  // Hitung Quick Stats (Safe Access)
  const attacksUsed = ourClan.attacks || 0;
  const opponentAttacksUsed = opponentClan.attacks || 0;
  const totalMembers = currentWar.teamSize || ourClan.members?.length || 0;
  const maxAttacksPerClan = totalMembers * (currentWar.attacksPerMember || (isCwl ? 1 : 2));
  const attackPercentage = maxAttacksPerClan > 0 ? Math.round((attacksUsed / maxAttacksPerClan) * 100) : 0;
  const opponentAttackPercentage = maxAttacksPerClan > 0 ? Math.round((opponentAttacksUsed / maxAttacksPerClan) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* --- WAR DASHBOARD CARD --- */}
      <div className={`relative overflow-hidden rounded-3xl border bg-[#15171e]/80 backdrop-blur-xl shadow-2xl transition-all duration-500 ${containerBorderClass}`}>
        
        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className={`absolute -top-32 -left-32 w-96 h-96 ${glowColorClass} rounded-full blur-[120px]`} />
            <div className={`absolute -bottom-32 -right-32 w-96 h-96 ${glowColorClass} rounded-full blur-[120px] opacity-50`} />
        </div>

        {/* --- HEADER SECTION --- */}
        <div className="relative z-10 border-b border-white/10 bg-black/20 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${statusBadgeClass}`}>
                    {statusText}
                </span>
                <span className="text-gray-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <ShieldIcon className="w-3 h-3" />
                    {currentWar.teamSize} vs {currentWar.teamSize} • {isCwl ? 'CWL' : 'Classic'}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-[#0a0a0b]/60 ${timeInfo.isEnded ? 'text-gray-500' : 'text-coc-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]'}`}>
                    <ClockIcon className="h-4 w-4" />
                    <span className="font-mono text-sm font-bold tracking-wide">{timeInfo.text}</span>
                </div>
                <Button onClick={() => refreshWar()} variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-white rounded-full hover:bg-white/10 border border-transparent hover:border-white/10 transition-all">
                    <RefreshCwIcon className='h-4 w-4'/>
                </Button>
            </div>
        </div>

        {/* --- SCOREBOARD SECTION --- */}
        <div className="relative z-10 px-6 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
            
            {/* Our Clan */}
            <div className="flex-1 w-full flex flex-col md:items-start items-center">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-coc-blue/5 rounded-2xl border border-coc-blue/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative group">
                        <div className="absolute inset-0 bg-coc-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <ShieldIcon className="h-10 w-10 md:h-12 md:w-12 text-coc-blue relative z-10" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-2xl md:text-3xl font-clash text-white tracking-wide truncate max-w-[180px] md:max-w-xs leading-none drop-shadow-lg">
                            {ourClan.name}
                        </h2>
                        <span className="text-[10px] md:text-xs text-coc-blue font-bold tracking-[0.2em] uppercase mt-1 block opacity-80">Level {ourClan.clanLevel}</span>
                    </div>
                </div>
                
                {/* Stats Our Clan */}
                <div className="w-full max-w-[320px] bg-[#0a0a0b]/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-coc-blue/50" />
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-2">
                            <StarIcon className="h-7 w-7 fill-coc-gold text-coc-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]" />
                            <span className="text-4xl font-clash text-white">{ourClan.stars}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-400 mb-1 tracking-wider">{ourClan.destructionPercentage.toFixed(2)}%</span>
                    </div>
                    <DestructionBar percentage={ourClan.destructionPercentage} colorClass="bg-coc-blue" shadowClass="shadow-[0_0_15px_#2B60DE]" />
                    <div className="mt-3 flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span>Attacks: <span className="text-gray-300">{attacksUsed}</span>/{maxAttacksPerClan}</span>
                        <span className={`${attackPercentage === 100 ? 'text-coc-green' : ''}`}>{attackPercentage}% Done</span>
                    </div>
                </div>
            </div>

            {/* VS Badge */}
            <div className="shrink-0 relative py-4 md:py-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-[60px]" />
                <div className="relative z-10 bg-[#0a0a0b] border border-white/10 p-5 rounded-full backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                    <SwordsIcon className="h-10 w-10 md:h-12 md:w-12 text-coc-gold animate-pulse-slow drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
                </div>
            </div>

            {/* Opponent Clan */}
            <div className="flex-1 w-full flex flex-col md:items-end items-center">
                <div className="flex items-center gap-4 mb-4 flex-row-reverse text-right">
                    <div className="p-3 bg-coc-red/5 rounded-2xl border border-coc-red/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative group">
                        <div className="absolute inset-0 bg-coc-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <ShieldIcon className="h-10 w-10 md:h-12 md:w-12 text-coc-red relative z-10" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl md:text-3xl font-clash text-white tracking-wide truncate max-w-[180px] md:max-w-xs leading-none drop-shadow-lg">
                            {opponentClan.name}
                        </h2>
                        <span className="text-[10px] md:text-xs text-coc-red font-bold tracking-[0.2em] uppercase mt-1 block opacity-80">Level {opponentClan.clanLevel}</span>
                    </div>
                </div>

                {/* Stats Opponent */}
                <div className="w-full max-w-[320px] bg-[#0a0a0b]/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-coc-red/50" />
                    <div className="flex justify-between items-end mb-3 flex-row-reverse">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <StarIcon className="h-7 w-7 fill-coc-red text-coc-red drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                            <span className="text-4xl font-clash text-white">{opponentClan.stars}</span>
                        </div>
                        <span className="text-sm font-mono text-gray-400 mb-1 tracking-wider">{opponentClan.destructionPercentage.toFixed(2)}%</span>
                    </div>
                    <DestructionBar percentage={opponentClan.destructionPercentage} colorClass="bg-coc-red" shadowClass="shadow-[0_0_15px_#FF0000]" />
                    <div className="mt-3 flex justify-end gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <span className={`${opponentAttackPercentage === 100 ? 'text-coc-red' : ''}`}>{opponentAttackPercentage}% Done</span>
                        <span>Attacks: <span className="text-gray-300">{opponentAttacksUsed}</span>/{maxAttacksPerClan}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FOOTER ACTION --- */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black/60 to-transparent border-t border-white/5 flex justify-center">
            <Button 
                onClick={() => setIsDetailModalOpen(true)}
                variant="primary"
                size="lg"
                className="w-full md:w-auto px-10 py-7 text-lg font-clash tracking-wide shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:shadow-[0_0_50px_rgba(255,215,0,0.3)] transition-all transform hover:-translate-y-1 rounded-2xl group border border-coc-gold/20"
            >
                {t.clanManage.viewWarDetails} 
                <ArrowRightIcon className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>

      {/* --- QUICK STATS GRID (Gaming HUD Style) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-[#15171e]/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg group hover:border-white/10 transition-colors">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.15em] mb-2 group-hover:text-coc-gold transition-colors">Total Attacks</p>
            <p className="text-3xl font-clash text-white drop-shadow-md">{attacksUsed + opponentAttacksUsed}</p>
         </div>
         <div className="bg-[#15171e]/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg group hover:border-white/10 transition-colors">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.15em] mb-2 group-hover:text-coc-gold transition-colors">Avg. Destruction</p>
            <p className="text-3xl font-clash text-coc-gold drop-shadow-md">{((ourClan.destructionPercentage + opponentClan.destructionPercentage) / 2).toFixed(1)}%</p>
         </div>
         <div className="bg-[#15171e]/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg group hover:border-white/10 transition-colors">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.15em] mb-2 group-hover:text-coc-green transition-colors">3-Star Attacks</p>
            <p className="text-3xl font-clash text-coc-green drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]">
                {(ourClan.members?.reduce((sum: number, m: CocWarMember) => sum + (m.attacks?.filter((a: CocWarAttack) => a.stars === 3).length || 0), 0) || 0)}
            </p>
         </div>
         <div className="bg-[#15171e]/60 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-lg group hover:border-white/10 transition-colors">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.15em] mb-2 group-hover:text-coc-blue transition-colors">Defended Stars</p>
            <p className="text-3xl font-clash text-coc-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                {(ourClan.members?.reduce((sum: number, m: CocWarMember) => sum + (3 - (m.bestOpponentAttack?.stars || 0)), 0) || 0)}
            </p>
         </div>
      </div>

      {/* Detail Modal Pop-up (Akan kita buat setelah ini) */}
      {isDetailModalOpen && (
        <WarDetailModal 
            clan={clan} 
            warData={currentWar as unknown as WarArchive} // Casting aman karena struktur mirip
            onClose={() => setIsDetailModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ActiveWarTabContent;