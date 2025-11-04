// File: app/clan/manage/components/CwlHistoryTabContent.tsx
// [REFAKTOR TOTAL] Menampilkan data RIWAYAT CWL (Arsip) dari hook SWR
// menggunakan komponen Accordion yang baru.

'use client';

import React, { useState, useCallback } from 'react';

// --- [PERBAIKAN] Impor Tipe yang Benar ---
import {
  ManagedClan,
  FirestoreDocument,
  CwlArchive,
} from '@/lib/types';
import { useManagedClanCWL } from '@/lib/hooks/useManagedClan'; // Hook ini sudah benar di Canvas

// --- [PERBAIKAN] Sesuaikan Ikon ---
import {
  Loader2Icon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CalendarCheck2Icon,
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// --- [PERBAIKAN] Impor komponen baru kita dari Canvas ---
import CwlSeasonAccordion from './CwlSeasonAccordion';

// --- Props Component (Tidak Berubah) ---
interface CwlHistoryTabContentProps {
  clan: ManagedClan; // Hanya menerima ManagedClan
}

// ======================================================================================================
// Main Component: CwlHistoryTabContent
// [PERBAIKAN] Direvisi total untuk menampilkan data Arsip (CwlArchive[])
// ======================================================================================================

const CwlHistoryTabContent: React.FC<CwlHistoryTabContentProps> = ({ clan }) => {
  // --- Hook SWR (Sudah benar mengharapkan CwlArchive[] dari Canvas) ---
  const {
    cwlData, // cwlData sekarang adalah: FirestoreDocument<CwlArchive>[] | null
    isLoading,
    isError: error,
    mutateCWL: refreshCwl, // Ini adalah 'mutate' SWR
  } = useManagedClanCWL(clan.id);

  // State baru untuk melacak proses sinkronisasi (saat tombol 'Muat Ulang' ditekan)
  const [isSyncing, setIsSyncing] = useState(false);

  // --- [PERBAIKAN LOGIKA TOMBOL REFRESH] ---
  // Tombol ini sekarang akan memicu SINKRONISASI (POST) lalu me-refresh data (mutate)
  const handleFullRefresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Panggil API Sinkronisasi (skrip di Canvas) untuk mengambil data baru dari CoC API
      //    dan membersihkan data lama yang kotor (filter 7 ronde).
      await fetch(`/api/clan/manage/${clan.id}/sync/cwl`, {
        method: 'POST',
      });
      
      // 2. Setelah sinkronisasi selesai, panggil mutate (refreshCwl) 
      //    untuk mengambil data baru yang sudah bersih dari database kita.
      await refreshCwl();

    } catch (syncError) {
      console.error("Gagal melakukan sinkronisasi CWL:", syncError);
      // Anda bisa menambahkan notifikasi error di sini jika mau
    } finally {
      setIsSyncing(false);
    }
  }, [clan.id, refreshCwl]);
  // --- [AKHIR PERBAIKAN LOGIKA TOMBOL REFRESH] ---

  // --- TAMPILAN LOADING ---
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        <p className="text-lg font-clash text-white">Memuat Riwayat CWL...</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Mengambil data arsip CWL klan Anda.
        </p>
      </div>
    );
  }

  // --- TAMPILAN ERROR (Tidak Berubah) ---
  if (error) {
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-white">Error Memuat Riwayat CWL</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">
          {error.message}
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={isSyncing} // Nonaktifkan tombol saat syncing
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Menyinkronkan...' : 'Coba Muat Ulang'}
        </Button>
      </div>
    );
  }

  // --- [PERBAIKAN] TAMPILAN EMPTY STATE ---
  // Cek jika data adalah array kosong
  if (!cwlData || cwlData.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <CalendarCheck2Icon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">Tidak Ada Riwayat CWL</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Data arsip CWL untuk klan ini belum ditemukan.
        </p>
        <Button
          onClick={handleFullRefresh}
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={isSyncing} // Nonaktifkan tombol saat syncing
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Data CWL'}
        </Button>
      </div>
    );
  }

  // --- [PERBAIKAN] TAMPILAN UTAMA (RENDER ARSIP) ---

  return (
    <div className="space-y-6">
      {/* Header CWL */}
      <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
        <div>
          <h2 className="text-2xl font-clash text-white flex items-center gap-2">
            <CalendarCheck2Icon className="h-6 w-6 text-coc-gold" />
            Riwayat Clan War League
          </h2>
          <p className="text-gray-400">
            Menampilkan {cwlData.length} arsip musim CWL terakhir.
          </p>
        </div>
        <Button 
          onClick={handleFullRefresh} 
          variant="secondary" 
          size="sm"
          disabled={isSyncing} // Nonaktifkan tombol saat syncing
        >
          {isSyncing ? (
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCwIcon className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Ulang'}
        </Button>
      </div>

      {/* [PERBAIKAN] Daftar Arsip Musim (Accordion) */}
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

