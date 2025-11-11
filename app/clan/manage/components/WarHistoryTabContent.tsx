'use client';

import React, { useState, useMemo, useCallback } from 'react';
// --- [MODIFIKASI] Impor tipe ManagedClan, WarSummary, WarResult, FirestoreDocument, dan WarArchive ---
import {
  ManagedClan,
  WarSummary,
  WarResult,
  FirestoreDocument,
  WarArchive,
} from '@/lib/types';

// --- [MODIFIKASI] Impor hook SWR dan fetcher util ---
// [PERBAIKAN BUG 3] Impor KeyedMutator agar kita bisa memanggil mutate dari SWR
import useSWR, { KeyedMutator } from 'swr';
import { useManagedClanWarLog } from '@/lib/hooks/useManagedClan';
import {
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  SwordsIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2Icon,
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import WarDetailModal from './WarDetailModal';

// Helper fetcher sederhana untuk SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface WarHistoryTabContentProps {
  // Props sekarang hanya menerima objek clan lengkap
  clan: ManagedClan;
}

// Definisikan tipe untuk kolom yang dapat diurutkan
type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// =TAHAP 5: SUB-KOMPONEN WarHistoryRow (TIDAK BERUBAH) =====================
// Komponen ini sudah siap menerima prop 'hasDetails'
interface WarHistoryRowProps {
  war: FirestoreDocument<WarSummary>; // Menerima WarSummary (yang sudah digabung)
  onViewDetails: (warId: string) => void;
}

const WarHistoryRow: React.FC<WarHistoryRowProps> = ({ war, onViewDetails }) => {
  const resultClass =
    war.result === 'win'
      ? 'bg-coc-green text-black'
      : war.result === 'lose'
      ? 'bg-coc-red text-white'
      : war.result === 'tie'
      ? 'bg-coc-blue text-white'
      : 'bg-gray-600 text-white';

  // Data dari SWR/API mungkin string, jadi kita pastikan itu objek Date
  const endTimeDate =
    war.endTime instanceof Date ? war.endTime : new Date(war.endTime);

  const formattedDate =
    endTimeDate.getTime() === 0 || isNaN(endTimeDate.getTime())
      ? 'Invalid Date'
      : endTimeDate.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

  // Logika kunci ada di sini
  const hasDetails = war.hasDetails === true;

  return (
    <tr className="hover:bg-coc-stone/20 transition-colors" key={war.id}>
      {/* Kolom Hasil */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <span
          className={`inline-block font-bold text-xs px-3 py-1 rounded-full ${resultClass}`}
        >
          {war.result.toUpperCase()}
        </span>
      </td>

      {/* Kolom Lawan */}
      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
        {war.opponentName || 'Klan Lawan Tidak Diketahui'}
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

      {/* Kolom Aksi (Logika dinamis berdasarkan hasDetails) */}
      <td className="px-3 py-3 whitespace-nowrap text-center w-[120px]">
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasDetails}
          title={
            hasDetails
              ? 'Lihat detail serangan dan pemain.'
              : 'Hanya ringkasan log tersedia (Data arsip tidak ditemukan).'
          }
          className={`text-xs ${
            !hasDetails
              ? 'bg-gray-700 hover:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-coc-gold hover:bg-coc-gold-dark text-black'
          }`}
          onClick={hasDetails ? () => onViewDetails(war.id) : undefined}
        >
          {hasDetails ? 'Lihat Detail' : 'Ringkasan Saja'}
        </Button>
      </td>
    </tr>
  );
};
// ======================================================================================================

// ======================================================================================================
// Main Component: WarHistoryTabContent (MODIFIED)
// ======================================================================================================

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({
  clan,
}) => {
  // --- [MODIFIKASI] Fetch 2 Sumber Data ---
  // SUMBER 1: Data Ringkasan (Log Perang) - Cepat & Selalu ada
  const {
    warLogData: historySummaries, // Ganti nama ke 'historySummaries'
    isLoading: isLoadingWarLog,
    isError: isErrorWarLog,
    mutateWarLog: refreshHistory, // Tetap gunakan fungsi mutate ini
  } = useManagedClanWarLog(clan.id);

  // SUMBER 2: Data Arsip Detail (Firestore) - Data lengkap hasil arsip
  const {
    data: warArchives, // Ini adalah Array<FirestoreDocument<WarArchive>>
    error: isErrorArchives,
    isLoading: isLoadingArchives,
    // [PERBAIKAN BUG 3] Ambil fungsi 'mutate' dari hook SWR kedua
    mutate: mutateWarArchives,
  } = useSWR<FirestoreDocument<WarArchive>[]>(
    `/api/clan/manage/${clan.id}/war-archive`, // API route baru (Langkah 4)
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (err) => {
        console.error('[SWR WarArchive Error]', err);
      },
    }
  );
  // --- [AKHIR MODIFIKASI FETCH] ---

  // State Modal diubah untuk menyimpan objek data lengkap
  const [selectedWarData, setSelectedWarData] = useState<WarArchive | null>(
    null
  );

  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'endTime',
    direction: 'desc',
  });

  // Buat Map dari arsip detail untuk lookup cepat
  // Map ini HANYA digunakan untuk MENGAMBIL data saat di-klik, BUKAN untuk logika merge
  const archiveMap = useMemo(() => {
    const map = new Map<string, FirestoreDocument<WarArchive>>();
    if (warArchives) {
      for (const archive of warArchives) {
        // ID Dokumen adalah 'endTime' ISO string
        map.set(archive.id, archive);
      }
    }
    return map;
  }, [warArchives]);

  // --- [PERBAIKAN BUG 2] Gabungkan data Ringkasan + Arsip, lalu urutkan ---
  const mergedAndSortedHistory = useMemo(() => {
    // Gunakan historySummaries sebagai sumber kebenaran utama
    if (!historySummaries) return [];

    // [PERBAIKAN BUG 2]
    // Kita tidak perlu "merge" secara manual. Data 'historySummaries'
    // dari hook 'useManagedClanWarLog' sudah berisi flag 'hasDetails'
    // yang benar dari API 'warlog/route.ts' (baris 82).
    // Kita langsung gunakan 'historySummaries'.
    const mergedData = [...historySummaries];

    // 2. LOGIKA SORTIR (Sama seperti sebelumnya, tapi menggunakan mergedData)
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
  }, [historySummaries, sort]); // [PERBAIKAN BUG 2] 'archiveMap' dihapus dari dependensi
  // --- [AKHIR PERBAIKAN BUG 2] ---

  // Handler Modal diubah untuk menggunakan data lengkap dari 'archiveMap'
  const handleViewDetails = useCallback(
    (warId: string) => {
      // Ambil data lengkap dari Map arsip
      const fullArchiveData = archiveMap.get(warId);
      if (fullArchiveData) {
        setSelectedWarData(fullArchiveData);
      } else {
        console.error(
          'Gagal membuka detail: Data arsip tidak ditemukan di map. ID:',
          warId
        );
        // Fallback jika SWR 'warArchives' belum termuat (jarang terjadi)
        alert(
          'Data detail sedang dimuat. Silakan coba lagi dalam beberapa detik.'
        );
      }
    },
    [archiveMap]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedWarData(null);
  }, []);

  // --- [PERBAIKAN BUG 3] Tombol Refresh sekarang me-refresh KEDUA hook SWR ---
  const handleFullRefresh = useCallback(() => {
    console.log('[WarHistoryTab] Refreshing data...');
    // 1. Refresh data ringkasan (dari warlog/route.ts)
    refreshHistory();
    // 2. Refresh data arsip detail (dari war-archive/route.ts)
    // Kita panggil mutate SWR kedua
    if (mutateWarArchives) {
      // 'mutateWarArchives' adalah fungsi mutate() dari useSWR
      mutateWarArchives();
    }
  }, [refreshHistory, mutateWarArchives]); // Tambahkan mutateWarArchives ke dependensi
  // --- [AKHIR PERBAIKAN BUG 3] ---

  // Fungsi sortir (tidak berubah)
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // Helper sortir (tidak berubah)
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

  // Tampilan Loading & Error digabung
  const isLoading = isLoadingWarLog || isLoadingArchives;
  const error = isErrorWarLog || isErrorArchives;

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
        <p className="text-lg font-clash text-white">Memuat Riwayat War...</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Mengambil data arsip War Classic terbaru.
        </p>
      </div>
    );
  }

  if (error) {
    const errorMessage = (isErrorWarLog || isErrorArchives).message;
    return (
      <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-white">Error Memuat Data</p>
        <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">
          {errorMessage}
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm" className="mt-4">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> Coba Muat Ulang
        </Button>
      </div>
    );
  }
  // --- [AKHIR MODIFIKASI] ---

  // Tampilan Empty State (menggunakan data gabungan)
  if (!mergedAndSortedHistory || mergedAndSortedHistory.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <BookOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">Riwayat War Kosong</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Belum ada arsip War Classic yang tersimpan di database.
        </p>
        <Button onClick={handleFullRefresh} variant="secondary" size="sm" className="mt-4">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> Sinkronisasi Ulang Klan
        </Button>
      </div>
    );
  }

  // Tampilan Tabel Utama (RENDER)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
        <h2 className="text-2xl font-clash text-white flex items-center gap-2">
          <BookOpenIcon className="h-6 w-6 text-coc-gold" /> Riwayat War Klasik
        </h2>
        {/* [PERBAIKAN BUG 3] Tombol ini sekarang memanggil handleFullRefresh yang sudah diperbarui */}
        <Button onClick={handleFullRefresh} variant="secondary" size="sm">
          <RefreshCwIcon className="h-4 w-4 mr-2" /> Muat Ulang & Sinkronisasi
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-coc-gold-dark/20">
        <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
          <thead className="bg-coc-stone/70 sticky top-0">
            <tr>
              {/* Kolom Hasil (Sortable) */}
              <th
                className={getHeaderClasses('result') + ' w-20'}
                onClick={() => handleSort('result')}
              >
                <div className="flex items-center justify-center">
                  Hasil {getSortIcon('result')}
                </div>
              </th>

              {/* Kolom Lawan (Sortable) */}
              <th
                className={getHeaderClasses('opponentName') + ' text-left'}
                onClick={() => handleSort('opponentName')}
              >
                <div className="flex items-center justify-start">
                  Lawan {getSortIcon('opponentName')}
                </div>
              </th>

              {/* Kolom Ukuran Tim (Sortable) */}
              <th
                className={getHeaderClasses('teamSize') + ' w-20'}
                onClick={() => handleSort('teamSize')}
              >
                <div className="flex items-center justify-center">
                  Ukuran {getSortIcon('teamSize')}
                </div>
              </th>

              {/* Kolom Bintang (Sortable - Stars) */}
              <th
                className={getHeaderClasses('ourStars')}
                onClick={() => handleSort('ourStars')}
              >
                <div className="flex items-center justify-center">
                  Bintang / Persen {getSortIcon('ourStars')}
                </div>
              </th>

              {/* Kolom Tanggal Selesai (Sortable - Default) */}
              <th
                className={getHeaderClasses('endTime') + ' w-32'}
                onClick={() => handleSort('endTime')}
              >
                <div className="flex items-center justify-center">
                  Selesai {getSortIcon('endTime')}
                </div>
              </th>

              {/* Kolom Aksi (Non-Sortable) */}
              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-24">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coc-gold-dark/10">
            {/* [PERBAIKAN BUG 2] Gunakan 'mergedAndSortedHistory' */}
            {mergedAndSortedHistory.map((war) => (
              <WarHistoryRow
                key={war.id}
                war={war}
                onViewDetails={handleViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Kirim data lengkap ke Modal */}
      <WarDetailModal
        warData={selectedWarData} // Kirim objek WarArchive lengkap
        clan={clan} // Kirim objek ManagedClan lengkap
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default WarHistoryTabContent;