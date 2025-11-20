'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ManagedClan,
  WarSummary,
  WarResult,
  FirestoreDocument,
  WarArchive,
} from '@/lib/types';
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
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import WarDetailModal from './WarDetailModal';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

// Helper fetcher sederhana untuk SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface WarHistoryTabContentProps {
  clan: ManagedClan;
}

// Definisikan tipe untuk kolom yang dapat diurutkan
type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// ======================================================================================================
// SUB-KOMPONEN: WarHistoryRow
// ======================================================================================================
interface WarHistoryRowProps {
  war: FirestoreDocument<WarSummary>;
  onViewDetails: (warId: string) => void;
  t: any; // [BARU] Props translation
  locale: string; // [BARU] Locale string
}

const WarHistoryRow: React.FC<WarHistoryRowProps> = ({ war, onViewDetails, t, locale }) => {
  // [i18n] Mapping hasil perang ke teks terjemahan
  const getResultLabel = (result: string) => {
    switch (result) {
      case 'win': return t.clanWar.resultWin;
      case 'lose': return t.clanWar.resultLose;
      case 'tie': return t.clanWar.resultDraw;
      default: return result.toUpperCase();
    }
  };

  const resultLabel = getResultLabel(war.result);

  const resultClass =
    war.result === 'win'
      ? 'bg-coc-green text-black'
      : war.result === 'lose'
      ? 'bg-coc-red text-white'
      : war.result === 'tie'
      ? 'bg-coc-blue text-white'
      : 'bg-gray-600 text-white';

  const endTimeDate =
    war.endTime instanceof Date ? war.endTime : new Date(war.endTime);

  // [i18n] Format tanggal dinamis
  const formattedDate =
    endTimeDate.getTime() === 0 || isNaN(endTimeDate.getTime())
      ? 'Invalid Date'
      : endTimeDate.toLocaleDateString(locale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

  const hasDetails = war.hasDetails === true;

  return (
    <tr className="hover:bg-coc-stone/20 transition-colors" key={war.id}>
      {/* Kolom Hasil */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <span
          className={`inline-block font-bold text-xs px-3 py-1 rounded-full ${resultClass}`}
        >
          {resultLabel.toUpperCase()}
        </span>
      </td>

      {/* Kolom Lawan */}
      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
        {war.opponentName || t.clanWar.privateLog || 'Unknown'}
      </td>

      {/* Kolom Ukuran Tim */}
      <td className="px-3 py-3 whitespace-nowrap text-center text-gray-300">
        {war.teamSize} vs {war.teamSize}
      </td>

      {/* Kolom Bintang & Persen */}
      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-coc-gold font-bold flex items-center">
            {war.ourStars} <StarIcon className="h-4 w-4 ml-1 fill-coc-gold" />
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-coc-red font-bold flex items-center">
            {war.opponentStars}{' '}
            <StarIcon className="h-4 w-4 ml-1 fill-coc-red" />
          </span>
        </div>
        <span className="text-xs text-gray-400 block mt-0.5">
          {(war.ourDestruction || 0).toFixed(2)}% vs{' '}
          {(war.opponentDestruction || 0).toFixed(2)}%
        </span>
      </td>

      {/* Kolom Tanggal Selesai */}
      <td className="px-3 py-3 whitespace-nowrap text-center text-xs text-gray-400">
        {formattedDate}
      </td>

      {/* Kolom Aksi */}
      <td className="px-3 py-3 whitespace-nowrap text-center w-[120px]">
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasDetails}
          title={
            hasDetails
              ? t.clanWar.viewDetails
              : t.clanWar.noWarHistory // Fallback tooltip
          }
          className={`text-xs ${
            !hasDetails
              ? 'bg-gray-700 hover:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-coc-gold hover:bg-coc-gold-dark text-black'
          }`}
          onClick={hasDetails ? () => onViewDetails(war.id) : undefined}
        >
          {/* [i18n] Summary = Ringkasan (mengambil dari profile tabSummary) */}
          {hasDetails ? t.clanWar.viewDetails : t.profile.tabSummary}
        </Button>
      </td>
    </tr>
  );
};

// ======================================================================================================
// Main Component: WarHistoryTabContent
// ======================================================================================================

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({
  clan,
}) => {
  const { t } = useLanguage(); // [BARU] Init Language Hook
  
  // Deteksi locale sederhana
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

  // State
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

  // Merge & Sort Logic
  const mergedAndSortedHistory = useMemo(() => {
    if (!historySummaries) return [];

    const mergedData = [...historySummaries];
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
        // [i18n] Fallback alert
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

  // Helper Sortir
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

  const getHeaderClasses = useCallback(
    (key: SortKey) =>
      `px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
        sort.key === key ? 'text-white' : ''
      }`,
    [sort]
  );

  const isLoading = isLoadingWarLog || isLoadingArchives;
  const isError = isErrorWarLog || isErrorArchives;

  // --- Render States ---
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        <p className="text-lg font-clash text-white">{t.common.loading}</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {t.clanManage.msgReloading}
        </p>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (isErrorWarLog || isErrorArchives)?.message;
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-white">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">
          {errorMessage || t.common.error}
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm" className="mt-4">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  if (!mergedAndSortedHistory || mergedAndSortedHistory.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <BookOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">{t.clanWar.noWarHistory}</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
           {/* Empty description fallback */}
           War history will appear here once data is synced.
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm" className="mt-4">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
        <h2 className="text-2xl font-clash text-white flex items-center gap-2">
          <BookOpenIcon className="h-6 w-6 text-coc-gold" /> {t.clanWar.tabTitleHistory}
        </h2>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> {t.clanWar.updateLog}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-coc-gold-dark/20">
        <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
          <thead className="bg-coc-stone/70 sticky top-0">
            <tr>
              <th
                className={getHeaderClasses('result') + ' w-20'}
                onClick={() => handleSort('result')}
              >
                <div className="flex items-center justify-center">
                  {t.clanWar.colResult} {getSortIcon('result')}
                </div>
              </th>

              <th
                className={getHeaderClasses('opponentName') + ' text-left'}
                onClick={() => handleSort('opponentName')}
              >
                <div className="flex items-center justify-start">
                  {t.clanWar.colEnemy} {getSortIcon('opponentName')}
                </div>
              </th>

              <th
                className={getHeaderClasses('teamSize') + ' w-20'}
                onClick={() => handleSort('teamSize')}
              >
                <div className="flex items-center justify-center">
                  {t.clanWar.colTeamSize} {getSortIcon('teamSize')}
                </div>
              </th>

              <th
                className={getHeaderClasses('ourStars')}
                onClick={() => handleSort('ourStars')}
              >
                <div className="flex items-center justify-center">
                  {t.clanWar.colStars} {getSortIcon('ourStars')}
                </div>
              </th>

              <th
                className={getHeaderClasses('endTime') + ' w-32'}
                onClick={() => handleSort('endTime')}
              >
                <div className="flex items-center justify-center">
                  {t.clanWar.colDate} {getSortIcon('endTime')}
                </div>
              </th>

              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-24">
                {t.clanMembers.colActions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-gold-dark/10">
            {mergedAndSortedHistory.map((war) => (
              <WarHistoryRow
                key={war.id}
                war={war}
                onViewDetails={handleViewDetails}
                t={t}
                locale={currentLocale}
              />
            ))}
          </tbody>
        </table>
      </div>

      <WarDetailModal
        warData={selectedWarData}
        clan={clan}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default WarHistoryTabContent;