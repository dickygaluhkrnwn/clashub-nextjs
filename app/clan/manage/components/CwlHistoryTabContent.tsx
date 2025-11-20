'use client';

import React, { useState, useCallback } from 'react';

import {
  ManagedClan,
  FirestoreDocument,
  CwlArchive,
} from '@/lib/types';
import { useManagedClanCWL } from '@/lib/hooks/useManagedClan';

import {
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CalendarCheck2Icon,
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

import CwlSeasonAccordion from './CwlSeasonAccordion';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface CwlHistoryTabContentProps {
  clan: ManagedClan;
}

// ======================================================================================================
// Main Component: CwlHistoryTabContent
// ======================================================================================================

const CwlHistoryTabContent: React.FC<CwlHistoryTabContentProps> = ({ clan }) => {
  const { t } = useLanguage(); // [BARU] Init Language Hook

  const {
    cwlData,
    isLoading,
    isError: error,
    mutateCWL: refreshCwl,
  } = useManagedClanCWL(clan.id);

  // State untuk pelacakan proses sinkronisasi
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFullRefresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Panggil API Sinkronisasi
      await fetch(`/api/clan/manage/${clan.id}/sync/cwl`, {
        method: 'POST',
      });
      
      // 2. Refresh SWR
      await refreshCwl();

    } catch (syncError) {
      console.error("Gagal melakukan sinkronisasi CWL:", syncError);
    } finally {
      setIsSyncing(false);
    }
  }, [clan.id, refreshCwl]);

  // --- TAMPILAN LOADING ---
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        <p className="text-lg font-clash text-white">{t.common.loading}</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {t.clanManage.loadingUserData}
        </p>
      </div>
    );
  }

  // --- TAMPILAN ERROR ---
  if (error) {
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-white">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">
          {error.message}
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? t.clanManage.syncing : t.clanManage.reloadCache}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN EMPTY STATE ---
  if (!cwlData || cwlData.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <CalendarCheck2Icon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">{t.clanCwl.noCwlHistory}</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {/* Fallback text atau kosongkan jika tidak perlu */}
          {t.common.noData}
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? t.clanManage.syncing : t.clanManage.syncManualNow}
        </Button>
      </div>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="space-y-6">
      {/* Header CWL */}
      <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
        <div>
          <h2 className="text-2xl font-clash text-white flex items-center gap-2">
            <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
            {t.clanCwl.tabTitle}
          </h2>
          <p className="text-gray-400">
            {/* Menggunakan format: "5 Season" */}
            {cwlData.length} {t.clanCwl.seasonHeader}
          </p>
        </div>
        <Button 
          onClick={handleFullRefresh} 
          variant="secondary" 
          size="sm"
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? t.clanManage.syncing : t.clanManage.reloadCache}
        </Button>
      </div>

      {/* Daftar Arsip Musim (Accordion) */}
      <div className="space-y-4">
        {cwlData.map((archive, index) => (
          <CwlSeasonAccordion
            key={archive.id}
            archive={archive}
            ourClanTag={clan.tag}
            // Buka arsip pertama (terbaru) secara default
            isDefaultOpen={index === 0} 
          />
        ))}
      </div>
    </div>
  );
};

export default CwlHistoryTabContent;