'use client';

import React, { useState, useCallback } from 'react';

import {
  ManagedClan,
} from '@/lib/clashub.types';
import { useManagedClanCWL } from '@/lib/hooks/useManagedClan';

import {
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CalendarCheck2Icon,
  TrophyIcon,
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

import CwlSeasonAccordion from './CwlSeasonAccordion';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CwlHistoryTabContentProps {
  clan: ManagedClan;
}

// ======================================================================================================
// Main Component: CwlHistoryTabContent
// ======================================================================================================

const CwlHistoryTabContent: React.FC<CwlHistoryTabContentProps> = ({ clan }) => {
  const { t } = useLanguage();

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
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="relative">
            <div className="absolute inset-0 bg-coc-blue/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2Icon className="h-10 w-10 text-coc-blue animate-spin relative z-10" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse mt-4 font-mono tracking-wider">{t.common.loading}</p>
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
        <p className="text-xl font-clash text-white mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto mb-6">
          {error.message}
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          size="sm"
          disabled={isSyncing}
          className="bg-white/5 hover:bg-white/10 border-white/10"
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
        <div className="bg-[#15171e] p-6 rounded-full mb-6 relative group border border-white/5 shadow-xl">
            <div className="absolute inset-0 bg-coc-gold/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CalendarCheck2Icon className="h-16 w-16 text-coc-gold/50 relative z-10 group-hover:text-coc-gold transition-colors" />
        </div>
        <h2 className="text-2xl font-clash text-white mb-2 tracking-wide">{t.clanCwl.noCwlHistory}</h2>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed font-sans">
          {t.common.noData}
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          disabled={isSyncing}
          className="bg-white/5 hover:bg-white/10 border border-white/10"
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header CWL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#15171e]/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-coc-blue/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-coc-blue/10 rounded-xl border border-coc-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <TrophyIcon className="h-6 w-6 text-coc-blue" />
            </div>
            <div>
                <h2 className="text-2xl font-clash text-white tracking-wide">
                    {t.clanCwl.tabTitle}
                </h2>
                <p className="text-coc-blue/80 font-medium text-xs font-mono uppercase tracking-widest ml-0.5">
                    {cwlData.length} {t.clanCwl.seasonHeader} Archived
                </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
            <Button 
                onClick={handleFullRefresh} 
                variant="secondary" 
                size="sm" 
                disabled={isSyncing}
                className="bg-black/20 border-white/10 hover:bg-white/10 backdrop-blur-md shadow-lg"
            >
                {isSyncing ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin text-coc-blue" />
                ) : (
                <RefreshCwIcon className="h-4 w-4 mr-2 text-coc-blue" />
                )}
                {isSyncing ? t.clanManage.syncing : t.clanManage.reloadCache}
            </Button>
        </div>
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