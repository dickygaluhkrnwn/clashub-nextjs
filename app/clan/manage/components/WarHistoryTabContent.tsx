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
  ArrowRightIcon
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
      default: return result.toUpperCase();
    }
  };

  const resultLabel = getResultLabel(war.result);
  
  let cardBorderColor = 'border-white/10';
  let resultTextColor = 'text-gray-400';
  let resultBgColor = 'bg-gray-500/10';

  if (war.result === 'win') {
    cardBorderColor = 'border-coc-green/30 hover:border-coc-green/50';
    resultTextColor = 'text-coc-green';
    resultBgColor = 'bg-coc-green/10';
  } else if (war.result === 'lose') {
    cardBorderColor = 'border-coc-red/30 hover:border-coc-red/50';
    resultTextColor = 'text-coc-red';
    resultBgColor = 'bg-coc-red/10';
  } else if (war.result === 'tie') {
     cardBorderColor = 'border-coc-gold/30 hover:border-coc-gold/50';
     resultTextColor = 'text-coc-gold';
     resultBgColor = 'bg-coc-gold/10';
  }

  const endTimeDate = war.endTime instanceof Date ? war.endTime : new Date(war.endTime);
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
        className={`group relative flex flex-col md:flex-row items-center gap-4 p-5 rounded-2xl border bg-[#1a1a1a] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardBorderColor}`}
    >
        {/* Result Badge (Mobile: Top Right, Desktop: Left) */}
        <div className={`absolute top-4 right-4 md:static md:w-24 flex-shrink-0 flex flex-col items-center justify-center`}>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${resultBgColor} ${resultTextColor} ${cardBorderColor}`}>
                {resultLabel}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 font-mono hidden md:block">{formattedDate}</span>
        </div>

        {/* VS Info */}
        <div className="flex-grow w-full md:w-auto flex items-center justify-between gap-4 md:gap-8">
            {/* Us */}
            <div className="flex-1 text-center md:text-right">
                <p className="text-sm md:text-base font-clash text-white truncate mb-1">Us</p>
                <div className="flex items-center justify-center md:justify-end gap-1 text-coc-gold font-bold text-lg md:text-xl">
                    {war.ourStars} <StarIcon className="w-4 h-4 md:w-5 md:h-5 fill-coc-gold" />
                </div>
                <p className="text-xs text-gray-500 font-mono">{(war.ourDestruction || 0).toFixed(1)}%</p>
            </div>

            {/* VS Icon */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2">
                <span className="text-xl font-clash text-gray-600 italic">VS</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{war.teamSize}v{war.teamSize}</span>
            </div>

            {/* Enemy */}
            <div className="flex-1 text-center md:text-left">
                <p className="text-sm md:text-base font-clash text-white truncate mb-1">{war.opponentName || 'Unknown'}</p>
                <div className="flex items-center justify-center md:justify-start gap-1 text-coc-red font-bold text-lg md:text-xl">
                    <StarIcon className="w-4 h-4 md:w-5 md:h-5 fill-coc-red" /> {war.opponentStars}
                </div>
                <p className="text-xs text-gray-500 font-mono">{(war.opponentDestruction || 0).toFixed(1)}%</p>
            </div>
        </div>

        {/* Action Button */}
        <div className="w-full md:w-auto flex justify-center md:justify-end mt-2 md:mt-0">
            <Button
                variant="secondary"
                size="sm"
                disabled={!hasDetails}
                onClick={hasDetails ? () => onViewDetails(war.id) : undefined}
                className={`w-full md:w-auto bg-white/5 border border-white/10 hover:bg-white/10 ${!hasDetails ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {hasDetails ? (
                    <>
                        {t.clanWar.viewDetails} <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </>
                ) : (
                    <span className="text-gray-500 italic text-xs">No Details</span>
                )}
            </Button>
        </div>
        
        {/* Date for Mobile (Bottom Center) */}
        <div className="md:hidden text-[10px] text-gray-600 font-mono mt-2">
            {formattedDate}
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
        const dateA = valueA instanceof Date ? valueA : new Date(valueA);
        const dateB = valueB instanceof Date ? valueB : new Date(valueB);
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
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">{t.common.loading}</p>
        <p className="text-xs text-gray-600 mt-2">{t.clanManage.msgReloading}</p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (isErrorWarLog || isErrorArchives)?.message;
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-4">
          {errorMessage || t.common.error}
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-coc-red/10 to-transparent p-6 rounded-2xl border border-coc-red/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-coc-red/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-coc-red/20 rounded-lg border border-coc-red/30">
                    <BookOpenIcon className="h-6 w-6 text-coc-red" />
                </div>
                <h2 className="text-2xl font-clash text-white tracking-wide">
                    {t.clanWar.tabTitleHistory}
                </h2>
            </div>
            <p className="text-gray-400 text-sm ml-1 max-w-lg">
                Archive of past Classic Wars.
            </p>
         </div>

         <div className="relative z-10 flex gap-3">
             {/* Sort Buttons (Desktop Only for simplicity, or add mobile dropdown) */}
             <div className="hidden md:flex bg-black/30 rounded-lg p-1 border border-white/5">
                <button 
                    onClick={() => handleSort('endTime')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${sort.key === 'endTime' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Date {getSortIcon('endTime')}
                </button>
                <button 
                    onClick={() => handleSort('result')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${sort.key === 'result' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Result {getSortIcon('result')}
                </button>
             </div>

             <Button 
                onClick={handleFullRefresh} 
                variant="secondary" 
                size="sm"
                className="bg-black/40 border-white/10 hover:bg-white/10 backdrop-blur-md"
             >
                <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanWar.updateLog}
             </Button>
         </div>
      </div>

      {/* --- CONTENT LIST --- */}
      <div className="space-y-4">
        {!mergedAndSortedHistory || mergedAndSortedHistory.length === 0 ? (
           <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
             <ShieldIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
             <p className="text-gray-400 font-clash text-lg">{t.clanWar.noWarHistory}</p>
             <p className="text-gray-500 text-sm mt-1">Data will appear after synchronization.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 gap-4">
              {mergedAndSortedHistory.map((war) => (
                // [FIX] Menggunakan WarHistoryCard, bukan WarHistoryRow
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