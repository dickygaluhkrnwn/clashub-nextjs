'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ManagedClan,
  WarSummary,
  FirestoreDocument,
  WarArchive,
} from '@/lib/clashub.types';
import useSWR from 'swr';
import { useManagedClanWarLog } from '@/lib/hooks/useManagedClan';
import {
  BookOpenIcon,
  StarIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2Icon,
  TrophyIcon,
  ShieldIcon,
  SwordsIcon,
  ArrowRightIcon,
  CalendarIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import WarDetailModal from './WarDetailModal';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Helper fetcher sederhana untuk SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface WarHistoryTabContentProps {
  clan: ManagedClan;
}

// [FIX] Definisikan WarResult secara lokal jika tidak ada di library
type WarResult = 'win' | 'lose' | 'tie' | 'unknown';

type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// ======================================================================================================
// SUB-KOMPONEN: WarHistoryCard
// ======================================================================================================
interface WarHistoryCardProps {
  war: FirestoreDocument<WarSummary>;
  onViewDetails: (warId: string) => void;
  t: any;
  locale: string;
}

const WarHistoryCard: React.FC<WarHistoryCardProps> = ({ war, onViewDetails, t, locale }) => {
  const getResultLabel = (result: string) => {
    switch (result) {
      case 'win': return t.clanWar.resultWin;
      case 'lose': return t.clanWar.resultLose;
      case 'tie': return t.clanWar.resultDraw;
      default: return result ? result.toUpperCase() : 'UNKNOWN';
    }
  };

  // [FIX] Handle case where war.result is undefined
  const resultLabel = getResultLabel(war.result || 'unknown');
  
  let cardBorderClass = 'border-l-4 border-l-gray-500 border-white/5';
  let resultTextColor = 'text-gray-400';
  let resultBgColor = 'bg-gray-500/10';
  let glowColor = 'from-gray-500/5';

  if (war.result === 'win') {
    cardBorderClass = 'border-l-4 border-l-coc-green border-white/5';
    resultTextColor = 'text-coc-green';
    resultBgColor = 'bg-coc-green/10';
    glowColor = 'from-coc-green/10';
  } else if (war.result === 'lose') {
    cardBorderClass = 'border-l-4 border-l-coc-red border-white/5';
    resultTextColor = 'text-coc-red';
    resultBgColor = 'bg-coc-red/10';
    glowColor = 'from-coc-red/10';
  } else if (war.result === 'tie') {
     cardBorderClass = 'border-l-4 border-l-coc-gold border-white/5';
     resultTextColor = 'text-coc-gold';
     resultBgColor = 'bg-coc-gold/10';
     glowColor = 'from-coc-gold/10';
  }

  // [FIX] Validasi endTime agar tidak crash jika undefined
  const endTimeDate = war.endTime ? (war.endTime instanceof Date ? war.endTime : new Date(war.endTime)) : new Date(0);
  const formattedDate =
    endTimeDate.getTime() === 0 || isNaN(endTimeDate.getTime())
      ? 'Invalid Date'
      : endTimeDate.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  const hasDetails = war.hasDetails === true;

  return (
    <div 
        className={`group relative flex flex-col md:flex-row items-stretch gap-4 p-0 rounded-xl bg-[#15171e]/60 backdrop-blur-md transition-all duration-300 hover:shadow-lg overflow-hidden border-y border-r border-white/5 ${cardBorderClass}`}
    >
        {/* Glow Effect Background */}
        <div className={`absolute inset-0 bg-gradient-to-r ${glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

        {/* Date & Result Column */}
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center p-4 md:w-32 md:bg-black/20 md:border-r border-white/5 shrink-0 relative z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${resultBgColor} ${resultTextColor} border-current shadow-sm`}>
                {resultLabel}
            </span>
            <div className="flex items-center gap-1.5 mt-0 md:mt-2 text-[10px] text-gray-500 font-mono">
                <CalendarIcon className="w-3 h-3 opacity-70" />
                <span>{formattedDate}</span>
            </div>
        </div>

        {/* Match Info */}
        <div className="flex-grow p-4 md:py-4 md:px-6 relative z-10 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-4 md:gap-12">
                {/* Us */}
                <div className="flex-1 text-right">
                    <p className="text-sm md:text-lg font-clash text-white truncate drop-shadow-sm">Us</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="text-coc-gold font-bold text-lg md:text-2xl font-mono">{war.ourStars || 0}</span>
                        <StarIcon className="w-4 h-4 md:w-5 md:h-5 fill-coc-gold text-coc-gold drop-shadow-md" />
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-mono">{(war.ourDestruction || 0).toFixed(1)}%</p>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center shrink-0">
                    <SwordsIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600 group-hover:text-white transition-colors duration-300" />
                    <span className="text-[9px] md:text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                        {war.teamSize}v{war.teamSize}
                    </span>
                </div>

                {/* Enemy */}
                <div className="flex-1 text-left">
                    <p className="text-sm md:text-lg font-clash text-white truncate drop-shadow-sm">{war.opponentName || 'Unknown'}</p>
                    <div className="flex items-center justify-start gap-1.5 mt-1">
                        <StarIcon className="w-4 h-4 md:w-5 md:h-5 fill-coc-red text-coc-red drop-shadow-md" />
                        <span className="text-coc-red font-bold text-lg md:text-2xl font-mono">{war.opponentStars || 0}</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-mono">{(war.opponentDestruction || 0).toFixed(1)}%</p>
                </div>
            </div>
        </div>

        {/* Action Button Area */}
        <div className="p-4 md:w-40 flex items-center justify-center md:border-l border-white/5 relative z-10 bg-black/10">
            {hasDetails ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(war.id)}
                    className="w-full text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group/btn"
                >
                    Details <ArrowRightIcon className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
            ) : (
                <span className="text-gray-600 text-[10px] italic cursor-not-allowed">No Details</span>
            )}
        </div>
    </div>
  );
};

// ======================================================================================================
// Main Component: WarHistoryTabContent
// ======================================================================================================

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({
  clan,
}) => {
  const { t } = useLanguage();
  
  const currentLocale = t.common.loading === 'Loading...' ? 'en-US' : 'id-ID';

  // --- Fetch Data ---
  const {
    warLogData: historySummaries,
    isLoading: isLoadingWarLog,
    isError: isErrorWarLog,
    mutateWarLog: refreshHistory,
  } = useManagedClanWarLog(clan.id);

  const {
    data: warArchives,
    error: isErrorArchives,
    isLoading: isLoadingArchives,
    mutate: mutateWarArchives,
  } = useSWR<FirestoreDocument<WarArchive>[]>(
    `/api/clan/manage/${clan.id}/war-archive`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (err) => {
        console.error('[SWR WarArchive Error]', err);
      },
    }
  );

  const [selectedWarData, setSelectedWarData] = useState<WarArchive | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'endTime',
    direction: 'desc',
  });

  const archiveMap = useMemo(() => {
    const map = new Map<string, FirestoreDocument<WarArchive>>();
    if (warArchives) {
      for (const archive of warArchives) {
        map.set(archive.id, archive);
      }
    }
    return map;
  }, [warArchives]);

  const mergedAndSortedHistory = useMemo(() => {
    if (!historySummaries) return [];

    const mergedData = [...historySummaries];
    // [FIX] Menggunakan tipe WarResult yang didefinisikan lokal
    const resultOrder: Record<WarResult, number> = {
      win: 4,
      tie: 3,
      lose: 2,
      unknown: 1,
    };

    mergedData.sort((a, b) => {
      const sortKey = sort.key;
      if (sortKey === 'none') return 0;

      let valueA: any = a[sortKey];
      let valueB: any = b[sortKey];
      let comparison = 0;

      if (sortKey === 'result') {
        comparison =
          resultOrder[valueA as WarResult] - resultOrder[valueB as WarResult];
      } else if (sortKey === 'opponentName' || sortKey === 'id') {
        comparison = String(valueA).localeCompare(String(valueB));
      } else if (sortKey === 'endTime') {
        // [FIX] Validasi tanggal sebelum di-sort
        const dateA = valueA ? (valueA instanceof Date ? valueA : new Date(valueA)) : new Date(0);
        const dateB = valueB ? (valueB instanceof Date ? valueB : new Date(valueB)) : new Date(0);
        comparison = dateA.getTime() - dateB.getTime();
      } else {
        if (valueA === undefined || valueA === null)
          return sort.direction === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null)
          return sort.direction === 'asc' ? 1 : -1;
        comparison = valueA - valueB;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return mergedData;
  }, [historySummaries, sort]);

  const handleViewDetails = useCallback(
    (warId: string) => {
      const fullArchiveData = archiveMap.get(warId);
      if (fullArchiveData) {
        setSelectedWarData(fullArchiveData);
      } else {
        // Fallback or fetch on demand if needed
        alert(t.common.loading); 
      }
    },
    [archiveMap, t]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedWarData(null);
  }, []);

  const handleFullRefresh = useCallback(() => {
    refreshHistory();
    if (mutateWarArchives) {
      mutateWarArchives();
    }
  }, [refreshHistory, mutateWarArchives]);

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const getSortIcon = useCallback(
    (key: SortKey) => {
      if (sort.key !== key) return null;
      return sort.direction === 'asc' ? (
        <ArrowUpIcon className="h-3 w-3 ml-1" />
      ) : (
        <ArrowDownIcon className="h-3 w-3 ml-1" />
      );
    },
    [sort]
  );

  const isLoading = isLoadingWarLog || isLoadingArchives;
  const isError = isErrorWarLog || isErrorArchives;

  // --- Render States ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px]">
        <div className="relative">
            <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin relative z-10" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse mt-4 font-mono">{t.common.loading}</p>
        <p className="text-xs text-gray-600 mt-2">{t.clanManage.msgReloading}</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (isErrorWarLog || isErrorArchives)?.message;
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-6">
          {errorMessage || t.common.error}
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#15171e]/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden ring-1 ring-white/5">
         <div className="absolute top-0 right-0 w-64 h-64 bg-coc-red/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-coc-red/10 rounded-xl border border-coc-red/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <BookOpenIcon className="h-6 w-6 text-coc-red" />
                </div>
                <div>
                    <h2 className="text-2xl font-clash text-white tracking-wide">
                        {t.clanWar.tabTitleHistory}
                    </h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">
                        Archive of past Classic Wars
                    </p>
                </div>
            </div>
         </div>

         <div className="relative z-10 flex gap-3">
             {/* Sort Buttons */}
             <div className="hidden md:flex bg-[#0a0a0b] rounded-lg p-1 border border-white/5 shadow-inner">
                <button 
                    onClick={() => handleSort('endTime')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${sort.key === 'endTime' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Date {getSortIcon('endTime')}
                </button>
                <button 
                    onClick={() => handleSort('result')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${sort.key === 'result' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Result {getSortIcon('result')}
                </button>
             </div>

             <Button 
                onClick={handleFullRefresh} 
                variant="ghost" 
                size="sm" 
                className="bg-black/20 border-white/10 hover:bg-white/10 backdrop-blur-md text-gray-400 hover:text-white"
             >
                <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanWar.updateLog}
             </Button>
         </div>
      </div>

      {/* --- CONTENT LIST --- */}
      <div className="space-y-4">
        {!mergedAndSortedHistory || mergedAndSortedHistory.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
             <ShieldIcon className="h-16 w-16 text-gray-600 mb-4 opacity-50" />
             <p className="text-gray-400 font-clash text-xl tracking-wide">{t.clanWar.noWarHistory}</p>
             <p className="text-gray-600 text-sm mt-2 font-mono">Data will appear after synchronization.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 gap-3">
              {mergedAndSortedHistory.map((war) => (
                <WarHistoryCard
                  key={war.id}
                  war={war}
                  onViewDetails={handleViewDetails}
                  t={t}
                  locale={currentLocale}
                />
              ))}
           </div>
        )}
      </div>

      {/* Detail Modal */}
      <WarDetailModal
        warData={selectedWarData}
        clan={clan}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default WarHistoryTabContent;