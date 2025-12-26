'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { CocRaidLog, CocRaidMember, ManagedClan } from '@/lib/clashub.types';
import { useManagedClanRaid } from '@/lib/hooks/useManagedClan';
import {
  CoinsIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  UserIcon,
  ShieldIcon,
  SwordsIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2Icon,
  AlertTriangleIcon,
  StarIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage';

type RaidSortKey = 'endTime' | 'capitalTotalLoot' | 'totalAttacks' | 'id';
type SortDirection = 'asc' | 'desc';

interface RaidTabContentProps {
  clan: ManagedClan;
}

// --- Helper Functions ---
const formatDate = (dateInput: Date | string | undefined, locale: string, includeTime: boolean = true): string => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString(locale, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
};

// --- Sub-Components ---

// 1. Tabel Anggota (Enhanced Visuals)
const RaidMemberTable: React.FC<{ members: CocRaidMember[] | undefined | null, t: any }> = ({ members, t }) => {
  if (!members || members.length === 0) {
    return <p className="text-gray-500 font-sans italic text-sm my-4 text-center">{t.common.noData}</p>;
  }

  const sortedMembers = useMemo(() => {
    return [...(members || [])].sort((a, b) => (b.capitalResourcesLooted || 0) - (a.capitalResourcesLooted || 0));
  }, [members]);

  // Top 3 Badge Colors
  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-coc-gold text-black border-coc-gold";
    if (index === 1) return "bg-gray-300 text-black border-gray-400";
    if (index === 2) return "bg-orange-700 text-white border-orange-800";
    return "bg-white/5 text-gray-400 border-white/10";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#151515] mt-4">
      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-2 p-2">
         {sortedMembers.slice(0, 10).map((member, index) => (
             <div key={member.tag || index} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border ${getRankBadge(index)}`}>
                         {index + 1}
                     </div>
                     <div>
                         <p className="text-sm font-medium text-white">{member.name}</p>
                         <p className="text-xs text-gray-500">{member.attacks} Atk</p>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="text-coc-gold font-mono font-bold text-sm">{formatNumber(member.capitalResourcesLooted)}</p>
                     <p className="text-[10px] text-gray-500 uppercase">Loot</p>
                 </div>
             </div>
         ))}
         {sortedMembers.length > 10 && (
             <p className="text-center text-xs text-gray-500 pt-2">And {sortedMembers.length - 10} more...</p>
         )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-xs">
            <thead className="bg-black/40 text-gray-400 font-clash uppercase tracking-wider">
            <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3 text-left">{t.clanRaid.colPlayer}</th>
                <th className="px-4 py-3 text-center">{t.clanRaid.colAttacks}</th>
                <th className="px-4 py-3 text-right">{t.clanRaid.colLoot}</th>
                <th className="px-4 py-3 text-right">Contribution</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
            {sortedMembers.map((member, index) => {
                const maxLoot = sortedMembers[0]?.capitalResourcesLooted || 1;
                const percent = ((member.capitalResourcesLooted || 0) / maxLoot) * 100;
                
                return (
                <tr key={member.tag || index} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border ${getRankBadge(index)}`}>
                            {index + 1}
                        </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                        {member.name || 'Unknown'}
                        {index === 0 && <span className="ml-2 text-[10px] bg-coc-gold/20 text-coc-gold px-1.5 py-0.5 rounded border border-coc-gold/30">MVP</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                        <span className={member.attacks === ((member.attackLimit ?? 0) + (member.bonusAttackLimit ?? 0)) ? 'text-coc-green font-bold' : 'text-gray-400'}>
                            {member.attacks ?? 0}
                        </span>
                        <span className="text-gray-600 text-[10px] mx-1">/</span>
                        <span className="text-gray-500">
                            {(member.attackLimit ?? 0) + (member.bonusAttackLimit ?? 0)}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-coc-gold font-bold">
                        {formatNumber(member.capitalResourcesLooted)}
                    </td>
                    <td className="px-4 py-3 text-right w-32">
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-coc-gold" style={{ width: `${percent}%` }} />
                        </div>
                    </td>
                </tr>
                );
            })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. Ringkasan Raid (Dashboard Style)
const CurrentRaidSummary: React.FC<{ raid: CocRaidLog | null | undefined, t: any, locale: string }> = ({ raid, t, locale }) => {
  if (!raid) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm border-dashed">
        <div className="bg-black/30 p-4 rounded-full mb-4">
            <CoinsIcon className="h-12 w-12 text-gray-600" />
        </div>
        <p className="text-gray-400 font-clash text-lg mb-1">{t.clanRaid.noData}</p>
        <p className="text-xs text-gray-500">{t.clanRaid.noDataDesc}</p>
      </div>
    );
  }

  const isOngoing = raid.state === 'ongoing';
  const endDate = new Date(raid.endTime);
  const formattedDate = formatDate(raid.endTime, locale, false);

  return (
    <div className="bg-gradient-to-br from-[#2a1a3a] to-[#151515] rounded-3xl p-1 border border-purple-500/20 shadow-2xl relative overflow-hidden group">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[url('/images/stone-texture.png')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className={`absolute top-0 right-0 w-80 h-80 ${isOngoing ? 'bg-green-500/10' : 'bg-purple-500/10'} rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2`} />
      
      <div className="bg-[#151515]/80 backdrop-blur-md rounded-[20px] p-6 md:p-8 h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded-xl border ${isOngoing ? 'bg-green-500/20 border-green-500/30' : 'bg-purple-500/20 border-purple-500/30'}`}>
                        <CoinsIcon className={`h-6 w-6 ${isOngoing ? 'text-green-400' : 'text-purple-400'}`} />
                    </div>
                    <h3 className="text-2xl font-clash text-white tracking-wide">
                        {isOngoing ? "Ongoing Raid Weekend" : "Raid Weekend Summary"}
                    </h3>
                </div>
                <p className="text-sm text-gray-400 font-mono flex items-center gap-2 ml-1">
                    <ClockIcon className="h-3 w-3" />
                    {formattedDate}
                </p>
            </div>
            
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-lg ${
                isOngoing ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-green-900/20 animate-pulse' 
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-purple-900/20'
            }`}>
                {isOngoing ? t.clanRaid.statusOngoing : t.clanRaid.statusEnded}
            </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Total Loot */}
            <div className="bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-2xl">
                <div className="bg-[#1a1a1a] p-5 rounded-2xl h-full flex flex-col items-center text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{t.clanRaid.labelTotalLoot}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <CoinsIcon className="h-5 w-5 text-coc-gold" />
                        <span className="text-2xl md:text-3xl font-clash text-white">{formatNumber(raid.capitalTotalLoot)}</span>
                    </div>
                    <span className="text-[10px] text-coc-gold bg-coc-gold/10 px-2 py-0.5 rounded border border-coc-gold/20">Capital Gold</span>
                </div>
            </div>

            {/* Medals */}
            <div className="bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-2xl">
                <div className="bg-[#1a1a1a] p-5 rounded-2xl h-full flex flex-col items-center text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{t.clanRaid.labelMedals}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <TrophyIcon className="h-5 w-5 text-purple-400" />
                        <span className="text-2xl md:text-3xl font-clash text-white">
                            {formatNumber((raid.offensiveReward || 0) + (raid.defensiveReward || 0))}
                        </span>
                    </div>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Raid Medals</span>
                </div>
            </div>

            {/* Attacks */}
            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{t.clanRaid.labelTotalAttacks}</p>
                <div className="flex items-center gap-2">
                    <SwordsIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-xl md:text-2xl font-clash text-white">{formatNumber(raid.totalAttacks)}</span>
                </div>
            </div>

            {/* Destroyed */}
            <div className="bg-[#0f0f0f] p-5 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{t.clanRaid.labelEnemyDistricts}</p>
                <div className="flex items-center gap-2">
                    <ShieldIcon className="h-5 w-5 text-coc-red" />
                    <span className="text-xl md:text-2xl font-clash text-white">{formatNumber(raid.enemyDistrictsDestroyed)}</span>
                </div>
            </div>
        </div>

        {/* Member Table Expander */}
        <div className="border-t border-white/5 pt-4">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-coc-gold" />
                    {t.clanRaid.labelParticipants} <span className="text-xs text-gray-600 bg-black/30 px-1.5 py-0.5 rounded">{raid.members?.length || 0}</span>
                </h4>
             </div>
             <RaidMemberTable members={raid.members} t={t} />
        </div>
      </div>
    </div>
  );
};


// ======================================================================================================
// Main Component: RaidTabContent
// ======================================================================================================

const RaidTabContent: React.FC<RaidTabContentProps> = ({ clan }) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const {
    currentRaid,
    raidArchives,
    isLoading,
    isError: error,
    mutateRaid
  } = useManagedClanRaid(clan.id);
  
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: RaidSortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });

  const handleRefreshClick = useCallback(() => {
    mutateRaid();
  }, [mutateRaid]);

  const toggleArchiveDetails = (raidId: string) => {
    setSelectedArchiveId(prevId => (prevId === raidId ? null : raidId));
  };

  const handleSort = useCallback((key: RaidSortKey) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const sortedArchives = useMemo(() => {
    const data = [...(raidArchives || [])]; 
    data.sort((a, b) => {
      let comparison = 0;
      const dir = sort.direction === 'asc' ? 1 : -1;
      let valueA: any;
      let valueB: any;

      if (sort.key === 'endTime') {
        valueA = a.endTime instanceof Date ? a.endTime.getTime() : new Date(a.endTime || 0).getTime();
        valueB = b.endTime instanceof Date ? b.endTime.getTime() : new Date(b.endTime || 0).getTime();
        comparison = valueA - valueB; 
        if (valueA === 0 && valueB === 0) comparison = 0;
      } else {
        valueA = a[sort.key === 'id' ? 'id' : sort.key] ?? 0;
        valueB = b[sort.key === 'id' ? 'id' : sort.key] ?? 0;
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          comparison = valueA.localeCompare(valueB);
        } else {
          comparison = (valueA as number) - (valueB as number);
        }
        comparison *= dir;
      }
      return sort.key === 'endTime' ? (sort.direction === 'desc' ? -1 : 1) * comparison : comparison;
    });
    return data;
  }, [raidArchives, sort]);

  const getSortIcon = (key: RaidSortKey) => {
    if (sort.key !== key) return null;
    return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
  };

  const getHeaderClasses = (key: RaidSortKey, align: 'left' | 'center' | 'right') =>
    `py-4 px-6 text-${align} text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer transition-colors hover:text-white select-none ${
      sort.key === key ? 'text-coc-gold' : ''
    }`;

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">{t.common.loading}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-4">{error.message}</p>
        <Button onClick={handleRefreshClick} variant="secondary" size="sm">
          <RefreshCwIcon className='h-4 w-4 mr-2' /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      {/* --- HEADER BANNER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900/20 to-transparent p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <CoinsIcon className="h-8 w-8 text-purple-300" />
                </div>
                <div>
                    <h2 className="text-3xl font-clash text-white tracking-wide">
                        {t.clanRaid.tabTitle}
                    </h2>
                    <p className="text-purple-200/60 font-sans text-sm">
                        Track your Clan Capital weekends performance.
                    </p>
                </div>
            </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
            <div className="hidden md:block text-right mr-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Last Update</p>
                <p className="text-sm text-white font-mono">
                    {currentRaid ? new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
            </div>
            <Button
                variant="secondary"
                onClick={handleRefreshClick}
                disabled={isLoading}
                className="bg-black/40 border-white/10 hover:bg-white/10 backdrop-blur-md h-12 px-6"
            >
                <RefreshCwIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>

      {/* --- CURRENT RAID SECTION --- */}
      <section>
        <CurrentRaidSummary raid={currentRaid} t={t} locale={locale} />
      </section>

      {/* --- RAID HISTORY SECTION --- */}
      <section>
        <div className="flex items-center gap-3 mb-6 px-2 border-l-4 border-purple-500 pl-4">
            <ClockIcon className="h-6 w-6 text-purple-400" />
            <h3 className="text-2xl font-clash text-white tracking-wide">
                {t.clanRaid.historyTitle}
            </h3>
        </div>
        
        {!sortedArchives || sortedArchives.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <CoinsIcon className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-clash">{t.clanRaid.noHistory}</p>
          </div>
        ) : (
          <div className="bg-[#151515] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-black/40 border-b border-white/5">
                <tr>
                  <th className={getHeaderClasses('endTime', 'left') + ' pl-8'} onClick={() => handleSort('endTime')}>
                    <div className="flex items-center gap-2">
                        {t.clanRaid.statusEnded} {getSortIcon('endTime')}
                    </div>
                  </th>
                  <th className={getHeaderClasses('capitalTotalLoot', 'right')} onClick={() => handleSort('capitalTotalLoot')}>
                    <div className="flex items-center justify-end gap-2">
                        {t.clanRaid.colLoot} {getSortIcon('capitalTotalLoot')}
                    </div>
                  </th>
                  <th className={getHeaderClasses('totalAttacks', 'center')} onClick={() => handleSort('totalAttacks')}>
                    <div className="flex items-center justify-center gap-2">
                        Attacks {getSortIcon('totalAttacks')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedArchives.map(raid => (
                  <React.Fragment key={raid.id}>
                    <tr
                      className={`transition-all cursor-pointer group ${selectedArchiveId === raid.id ? 'bg-purple-500/5' : 'hover:bg-white/[0.02]'}`}
                      onClick={() => toggleArchiveDetails(raid.id)}
                    >
                      <td className="py-5 px-8 font-medium text-white/90 group-hover:text-white">
                        {formatDate(raid.endTime, locale, false)}
                      </td>
                      <td className="py-5 px-6 text-right font-mono text-coc-gold text-base tracking-wide">
                        {formatNumber(raid.capitalTotalLoot)}
                      </td>
                      <td className="py-5 px-6 text-center text-gray-400">
                        {formatNumber(raid.totalAttacks)}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedArchiveId === raid.id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'}`}>
                            {selectedArchiveId === raid.id ? (
                            <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                            )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Detail */}
                    {selectedArchiveId === raid.id && (
                      <tr className="bg-[#0f0f0f] shadow-inner border-y border-purple-500/10">
                        <td colSpan={4} className="p-0">
                            <div className="p-6 md:p-8 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
                                            <UserIcon className="h-5 w-5 text-coc-gold" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">
                                            Raid Performance
                                        </h4>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-400 font-mono">
                                        <span className="px-3 py-1 bg-white/5 rounded border border-white/5">
                                            Loot: {formatNumber(raid.capitalTotalLoot)}
                                        </span>
                                        <span className="px-3 py-1 bg-white/5 rounded border border-white/5">
                                            Districts: {formatNumber(raid.enemyDistrictsDestroyed)}
                                        </span>
                                    </div>
                                </div>
                                <RaidMemberTable members={raid.members} t={t} />
                            </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RaidTabContent;