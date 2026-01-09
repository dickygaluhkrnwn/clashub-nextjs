'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XIcon,
  StarIcon,
  ShieldIcon,
  TrophyIcon,
  SwordsIcon,
  ClockIcon,
  CrosshairIcon,
  ArrowRightIcon,
  ArrowDownIcon
} from '@/app/components/icons';
import {
  WarArchive,
  CocWarMember,
  CocWarAttack,
  ManagedClan,
} from '@/lib/clashub.types';
import Image from 'next/image';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface WarDetailModalProps {
  clan: ManagedClan;
  warData: WarArchive | null;
  onClose: () => void;
}

// =========================================================================
// HELPER: Visual Bar Persentase
// =========================================================================
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

// =========================================================================
// HELPER: Detail Serangan Individual
// =========================================================================
const AttackDetailItem = ({ attack, defenderName, thLevel, t }: { attack: CocWarAttack, defenderName: string, thLevel: number, t: any }) => {
    const isThreeStar = attack.stars === 3;
    return (
        <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 text-xs mb-1 last:mb-0 hover:bg-black/60 transition-colors">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Image src={getThImage(thLevel)} width={20} height={20} alt="TH" className="opacity-90" />
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-300 font-bold truncate max-w-[100px]">{defenderName}</span>
                    <span className="text-[9px] text-gray-500">{t.clanWar.colDestruction}: {attack.destructionPercentage}%</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <span className={`font-bold ${isThreeStar ? 'text-coc-green' : 'text-coc-gold'}`}>{attack.stars}</span>
                <StarIcon className={`w-3 h-3 ${isThreeStar ? 'fill-coc-green' : 'fill-coc-gold'}`} />
            </div>
        </div>
    );
};

// =========================================================================
// COMPONENT: Kartu Base Pemain (War Map Node)
// =========================================================================
interface WarMapNodeProps {
  member: CocWarMember;
  isMyClan: boolean;
  opponentRoster: Map<string, CocWarMember>;
  t: any;
}

const WarMapNode: React.FC<WarMapNodeProps> = ({ member, isMyClan, opponentRoster, t }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const thImage = getThImage(member.townhallLevel);

  // --- Analisis Serangan (Offense) ---
  const myAttacks = member.attacks || [];
  const attacksUsed = myAttacks.length;
  const totalStarsGained = myAttacks.reduce((sum: number, atk: CocWarAttack) => sum + (atk.stars || 0), 0);
  
  // --- Analisis Pertahanan (Defense) ---
  const bestDefense = useMemo(() => {
    let bestStars = 0;
    let bestDestruction = 0;
    let isAttacked = false;

    opponentRoster.forEach((opponent) => {
        if (opponent.attacks) {
            opponent.attacks.forEach((atk) => {
                if (atk.defenderTag === member.tag) {
                    isAttacked = true;
                    if (atk.stars > bestStars || (atk.stars === bestStars && atk.destructionPercentage > bestDestruction)) {
                        bestStars = atk.stars;
                        bestDestruction = atk.destructionPercentage;
                    }
                }
            });
        }
    });

    return isAttacked ? { stars: bestStars, destruction: bestDestruction } : null;
  }, [member.tag, opponentRoster]);

  const isThreeStarred = bestDefense?.stars === 3;
  const isFresh = !bestDefense;

  return (
    <div 
        className={`relative group transition-all duration-300 ${isExpanded ? 'z-20 scale-105' : 'z-10 hover:scale-[1.02]'}`}
        onClick={() => setIsExpanded(!isExpanded)}
    >
        {/* Connector Line (Visual) */}
        <div className={`absolute top-1/2 w-4 h-[2px] bg-white/10 ${isMyClan ? '-right-4' : '-left-4'} hidden md:block`} />

        <div className={`
            relative overflow-hidden rounded-xl border-2 shadow-xl bg-[#151515] cursor-pointer transition-colors
            ${isThreeStarred 
                ? 'border-coc-red/40 shadow-coc-red/10 grayscale-[0.3]' 
                : isFresh 
                    ? 'border-coc-gold/40 shadow-coc-gold/10' 
                    : 'border-white/20' 
            }
        `}>
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-[url('/images/stone-texture.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            
            {/* Header: Map Position & Name */}
            <div className={`
                flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white
                ${isMyClan ? 'bg-gradient-to-r from-coc-blue/80 to-transparent' : 'bg-gradient-to-l from-coc-red/80 to-transparent'}
            `}>
                <span className="drop-shadow-md">#{member.mapPosition} {member.name}</span>
                <span className="font-mono text-[10px] opacity-70">{member.tag}</span>
            </div>

            <div className="p-3 flex items-center gap-4 relative">
                {/* TH Image with Stars Overlay (Defense Status) */}
                <div className="relative flex-shrink-0">
                    <Image 
                        src={thImage} 
                        width={50} 
                        height={50} 
                        alt={`TH ${member.townhallLevel}`} 
                        className={`drop-shadow-2xl ${isThreeStarred ? 'opacity-80 grayscale' : ''}`}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-black/80 rounded-md border border-white/20 px-1 py-0.5 text-[10px] font-bold text-white shadow-lg">
                        TH{member.townhallLevel}
                    </div>
                    
                    {/* Stars Lost Indicator */}
                    {bestDefense && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                            <div className="flex gap-[-2px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                {[...Array(3)].map((_, i) => (
                                    <StarIcon 
                                        key={i} 
                                        className={`w-4 h-4 ${i < bestDefense.stars ? 'fill-coc-gold text-coc-gold' : 'fill-gray-700 text-gray-800'}`} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Offense Stats (Attacks Used) */}
                <div className="flex-grow flex flex-col justify-center space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-bold">
                            <SwordsIcon className="w-3 h-3" />
                            Attacks:
                        </div>
                        <div className="flex gap-1">
                            {[...Array(2)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full border border-white/20 ${i < attacksUsed ? (isMyClan ? 'bg-coc-green' : 'bg-coc-red') : 'bg-transparent'}`} 
                                />
                            ))}
                        </div>
                    </div>
                    
                    {attacksUsed > 0 && (
                        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded border border-white/5">
                            <StarIcon className="w-3 h-3 fill-coc-gold text-coc-gold" />
                            <span className="text-sm font-bold text-white">{totalStarsGained}</span>
                            <span className="text-[10px] text-gray-500 ml-1">stars gained</span>
                        </div>
                    )}
                </div>

                {/* Expand Indicator */}
                {attacksUsed > 0 && (
                    <div className={`absolute right-2 bottom-2 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                         <ArrowDownIcon className="w-3 h-3" />
                    </div>
                )}
            </div>

            {/* Expandable Details */}
            {isExpanded && attacksUsed > 0 && (
                <div className="px-3 pb-3 pt-1 bg-black/20 border-t border-white/5 animate-in slide-in-from-top-2">
                    <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-widest">Attack Log</div>
                    {myAttacks.map((atk, idx) => {
                        const defender = opponentRoster.get(atk.defenderTag || '');
                        return (
                            <AttackDetailItem 
                                key={idx} 
                                attack={atk} 
                                defenderName={defender?.name || 'Unknown'} 
                                thLevel={defender?.townhallLevel || 0} 
                                t={t} 
                            />
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

// =========================================================================
// KOMPONEN UTAMA: WarDetailModal
// =========================================================================

const WarDetailModal: React.FC<WarDetailModalProps> = ({
  clan,
  warData,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  // [PERBAIKAN] State mounted untuk portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const isOpen = !!warData;

  const opponentMembersMap = useMemo(() => {
    const map = new Map<string, CocWarMember>();
    if (warData?.opponent.members) {
      (warData.opponent.members as CocWarMember[]).forEach((member) => {
        if (member.tag) map.set(member.tag, member);
      });
    }
    return map;
  }, [warData]);

  const ourMembersMap = useMemo(() => {
    const map = new Map<string, CocWarMember>();
    if (warData?.clan.members) {
      (warData.clan.members as CocWarMember[]).forEach((member) => {
        if (member.tag) map.set(member.tag, member);
      });
    }
    return map;
  }, [warData]);

  const ourMembers = useMemo(
    () => warData?.clan.members?.sort((a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition) || [],
    [warData]
  );
  const opponentMembers = useMemo(
    () => warData?.opponent.members?.sort((a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition) || [],
    [warData]
  );

  if (!isOpen || !warData || !mounted) return null;

  const warEndTimeDate = warData.warEndTime instanceof Date ? warData.warEndTime : new Date(warData.warEndTime);
  const resultLabel = warData.result === 'win' ? t.clanWar.resultWin : warData.result === 'lose' ? t.clanWar.resultLose : t.clanWar.resultDraw;
  const ourClanName = warData.clan.name;
  const oppClanName = warData.opponent.name;

  // [PERBAIKAN] Konten modal dipisah untuk Portal
  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
        {/* Container Utama: Full Screen di Mobile, Max Size di Desktop */}
        <div
          className="w-full h-full md:max-w-[1600px] md:h-[95vh] flex flex-col bg-[#050505] md:border border-white/10 md:rounded-3xl shadow-2xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
            {/* --- Background Ambience --- */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute -top-1/4 -left-1/4 w-[800px] h-[800px] ${warData.result === 'win' ? 'bg-coc-blue/10' : 'bg-coc-red/10'} rounded-full blur-[150px] opacity-20`} />
                <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-coc-red/10 rounded-full blur-[150px] opacity-20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            {/* --- HEADER (Fixed Top) --- */}
            <div className="flex-shrink-0 relative z-20 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/10 shadow-xl">
                {/* Top Bar */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
                    <span className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <SwordsIcon className="w-3 h-3" />
                        {warData.teamSize}v{warData.teamSize} • {warEndTimeDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Button size="sm" variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white h-8 w-8 p-0 rounded-full hover:bg-white/10">
                        <XIcon className="h-5 w-5" />
                    </Button>
                </div>

                {/* Score Display (Compact Responsive) */}
                <div className="flex items-center justify-between px-4 py-4 md:px-12 md:py-6">
                    {/* Left Side (Us) */}
                    <div className="flex flex-col items-start w-[40%]">
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <h2 className="text-lg md:text-3xl font-clash text-white tracking-wide truncate max-w-[120px] md:max-w-xs leading-none">{ourClanName}</h2>
                            <p className="hidden md:block text-xs text-coc-blue font-bold tracking-wider px-1.5 py-0.5 bg-coc-blue/10 rounded border border-coc-blue/20">LVL {warData.clan.clanLevel}</p>
                        </div>
                        <div className="w-full max-w-[200px]">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-5xl font-clash text-white">{warData.clan.stars}</span>
                                <span className="text-xs md:text-sm text-gray-400 font-mono">{warData.clan.destructionPercentage.toFixed(2)}%</span>
                            </div>
                            <DestructionBar percentage={warData.clan.destructionPercentage} colorClass="bg-coc-blue shadow-[0_0_10px_#2B60DE]" />
                        </div>
                    </div>

                    {/* Center (VS) */}
                    <div className="flex flex-col items-center justify-center w-[20%]">
                        <div className="relative mb-1">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl md:text-8xl font-clash text-white/5 italic">VS</span>
                            <div className={`text-xl md:text-3xl font-bold uppercase tracking-widest ${
                                warData.result === 'win' ? 'text-coc-green' : warData.result === 'lose' ? 'text-coc-red' : 'text-coc-gold'
                            }`}>
                                {resultLabel}
                            </div>
                        </div>
                    </div>

                    {/* Right Side (Enemy) */}
                    <div className="flex flex-col items-end w-[40%] text-right">
                        <div className="flex items-center gap-2 md:gap-3 mb-1 flex-row-reverse">
                            <h2 className="text-lg md:text-3xl font-clash text-white tracking-wide truncate max-w-[120px] md:max-w-xs leading-none">{oppClanName}</h2>
                            <p className="hidden md:block text-xs text-coc-red font-bold tracking-wider px-1.5 py-0.5 bg-coc-red/10 rounded border border-coc-red/20">LVL {warData.opponent.clanLevel}</p>
                        </div>
                        <div className="w-full max-w-[200px] flex flex-col items-end">
                            <div className="flex items-baseline gap-2 flex-row-reverse">
                                <span className="text-2xl md:text-5xl font-clash text-white">{warData.opponent.stars}</span>
                                <span className="text-xs md:text-sm text-gray-400 font-mono">{warData.opponent.destructionPercentage.toFixed(2)}%</span>
                            </div>
                            <DestructionBar percentage={warData.opponent.destructionPercentage} colorClass="bg-coc-red shadow-[0_0_10px_#FF0000]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BATTLEFIELD MAP (Scrollable Content) --- */}
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#0a0a0a] relative">
                {/* Center Divider Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent -translate-x-1/2 z-0 hidden md:block" />
                
                <div className="grid grid-cols-2 min-h-full">
                    {/* Left Territory (Us) */}
                    <div className="flex flex-col p-2 md:p-6 gap-3 md:gap-4 relative z-10 border-r border-white/5 md:border-none">
                        <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 py-2 mb-2 text-center md:text-left shadow-lg">
                            <h3 className="text-coc-blue font-clash text-sm md:text-lg tracking-wider flex items-center justify-center md:justify-start gap-2">
                                <ShieldIcon className="w-4 h-4" /> OUR TERRITORY
                            </h3>
                        </div>
                        {ourMembers.map((member) => (
                            <WarMapNode 
                                key={member.tag} 
                                member={member} 
                                isMyClan={true} 
                                opponentRoster={opponentMembersMap} 
                                t={t} 
                            />
                        ))}
                    </div>

                    {/* Right Territory (Enemy) */}
                    <div className="flex flex-col p-2 md:p-6 gap-3 md:gap-4 relative z-10">
                        <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 py-2 mb-2 text-center md:text-right shadow-lg">
                            <h3 className="text-coc-red font-clash text-sm md:text-lg tracking-wider flex items-center justify-center md:justify-end gap-2">
                                ENEMY TERRITORY <CrosshairIcon className="w-4 h-4" />
                            </h3>
                        </div>
                        {opponentMembers.map((member) => (
                            <WarMapNode 
                                key={member.tag} 
                                member={member} 
                                isMyClan={false} 
                                opponentRoster={ourMembersMap} 
                                t={t} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  // Render menggunakan Portal
  return createPortal(modalContent, document.body);
};

export default WarDetailModal;