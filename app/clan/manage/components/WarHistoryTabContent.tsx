'use client';

import React, { useState, useMemo, useCallback } from 'react';
// --- TUGAS: Hapus import tipe manual, ganti dengan ManagedClan ---
import { ManagedClan, WarSummary, WarResult, FirestoreDocument } from '@/lib/types';
// --- TUGAS: Hapus import Firestore manual ---
// import { firestore } from '@/lib/firebase'; 
// import { COLLECTIONS } from '@/lib/firestore-collections'; 
// import {
//  collection, query, orderBy, limit, getDocs, Timestamp, DocumentData, QueryDocumentSnapshot
// } from 'firebase/firestore';
// --- TUGAS: Hapus parseCocDate ---
// import { parseCocDate } from '@/lib/th-utils';

// --- TUGAS: Impor hook SWR dan Loader ---
import { useManagedClanWarLog } from '@/lib/hooks/useManagedClan';
import { 
    BookOpenIcon, ClockIcon, StarIcon, SwordsIcon, AlertTriangleIcon, 
    RefreshCwIcon, ArrowUpIcon, ArrowDownIcon, Loader2Icon // <-- Loader2Icon ditambah
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import WarDetailModal from './WarDetailModal';

// --- TUGAS: Hapus definisi FirestoreDocument (sudah diimpor dari global) ---
// export type FirestoreDocument<T> = T & { id: string };

interface WarHistoryTabContentProps {
    // --- TUGAS: Ubah props menjadi clan: ManagedClan ---
    clan: ManagedClan;
    // clanId: string; // <-- DIHAPUS
    // clanTag: string; // <-- DIHAPUS
    // onRefresh: () => void; // <-- DIHAPUS
}

// Definisikan tipe untuk kolom yang dapat diurutkan
type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// ======================================================================================================
// Helper: Tampilan Baris Riwayat War (Tidak Berubah)
// ======================================================================================================

interface WarHistoryRowProps {
    war: FirestoreDocument<WarSummary>;
    onViewDetails: (warId: string) => void;
}

const WarHistoryRow: React.FC<WarHistoryRowProps> = ({ war, onViewDetails }) => {
    const resultClass =
        war.result === 'win' ? 'bg-coc-green text-black' :
        war.result === 'lose' ? 'bg-coc-red text-white' :
        war.result === 'tie' ? 'bg-coc-blue text-white' :
        'bg-gray-600 text-white';

    // Data dari SWR/API mungkin string, jadi kita pastikan itu objek Date
    const endTimeDate = war.endTime instanceof Date ? war.endTime : new Date(war.endTime);

    const formattedDate = (endTimeDate.getTime() === 0 || isNaN(endTimeDate.getTime()))
        ? 'Invalid Date'
        : endTimeDate.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    
    const hasDetails = war.hasDetails === true;

    return (
        <tr className="hover:bg-coc-stone/20 transition-colors" key={war.id}>
            {/* Kolom Hasil */}
            <td className="px-3 py-3 whitespace-nowrap text-center">
                <span className={`inline-block font-bold text-xs px-3 py-1 rounded-full ${resultClass}`}>
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
                        {war.opponentStars} <StarIcon className="h-4 w-4 ml-1 fill-coc-red" />
                    </span>
                </div>
                <span className="text-xs text-gray-400 block mt-0.5">
                    {(war.ourDestruction || 0).toFixed(2)}% vs {(war.opponentDestruction || 0).toFixed(2)}%
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
                    title={hasDetails ? "Lihat detail serangan dan pemain." : "Hanya ringkasan log tersedia (Data lama)."}
                    className={`text-xs ${!hasDetails ? 'bg-gray-700 hover:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-coc-gold hover:bg-coc-gold-dark text-black'}`}
                    onClick={hasDetails ? () => onViewDetails(war.id) : undefined}
                >
                    {hasDetails ? 'Lihat Detail' : 'Ringkasan Saja'}
                </Button>
            </td>
        </tr>
    );
};

// ======================================================================================================
// Main Component: WarHistoryTabContent
// ======================================================================================================

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({ clan }) => {
    // --- TUGAS: Ganti state manual dengan hook SWR ---
    const { 
        warLogData: history, 
        isLoading, 
        isError: error, 
        mutateWarLog: refreshHistory 
    } = useManagedClanWarLog(clan.id);
    // --- AKHIR PENGGANTIAN STATE ---
    
    const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
    const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });

    // Fungsi untuk membuka Modal Detail
    const handleViewDetails = useCallback((warId: string) => {
        setSelectedWarId(warId);
    }, []);

    // Fungsi untuk menutup Modal Detail
    const handleCloseModal = useCallback(() => {
        setSelectedWarId(null);
    }, []);

    // --- TUGAS: Perbarui handleFullRefresh untuk menggunakan mutate SWR ---
    const handleFullRefresh = useCallback(() => {
        refreshHistory();
    }, [refreshHistory]);
    // --- AKHIR PERBARUAN ---

    // --- FUNGSI SORTIR UTAMA ---
    const handleSort = useCallback((key: SortKey) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    }, []);

    // --- LOGIKA SORTIR DATA ---
    const sortedHistory = useMemo(() => {
        if (!history) return [];

        const sortedData = [...history];
        const resultOrder: Record<WarResult, number> = { 'win': 4, 'tie': 3, 'lose': 2, 'unknown': 1 };

        sortedData.sort((a, b) => {
            const sortKey = sort.key; 
            if (sortKey === 'none') return 0;

            let valueA: any = a[sortKey];
            let valueB: any = b[sortKey];

            let comparison = 0;

            if (sortKey === 'result') {
                comparison = resultOrder[valueA as WarResult] - resultOrder[valueB as WarResult];
            } else if (sortKey === 'opponentName' || sortKey === 'id') {
                comparison = String(valueA).localeCompare(String(valueB));
            } else if (sortKey === 'endTime') {
                const dateA = valueA instanceof Date ? valueA : new Date(valueA);
                const dateB = valueB instanceof Date ? valueB : new Date(valueB);
                comparison = dateA.getTime() - dateB.getTime();
            } else {
                if (valueA === undefined || valueA === null) return sort.direction === 'asc' ? -1 : 1;
                if (valueB === undefined || valueB === null) return sort.direction === 'asc' ? 1 : -1;
                comparison = valueA - valueB;
            }

            return sort.direction === 'asc' ? comparison : -comparison;
        });

        return sortedData;
    }, [history, sort]); 

    // --- HELPER UNTUK TAMPILAN HEADER SORT ---
    // --- PERBAIKAN: Bungkus dengan useCallback ---
    const getSortIcon = useCallback((key: SortKey) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
    }, [sort]); // Tambahkan dependensi 'sort'

    const getHeaderClasses = useCallback((key: SortKey) =>
        `px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
            sort.key === key ? 'text-white' : ''
        }`
    , [sort]); // Tambahkan dependensi 'sort'
    // --- AKHIR PERBAIKAN ---


    // --- TAMPILAN LOADING (TUGAS: Gunakan isLoading dari SWR) ---
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
                <p className="text-lg font-clash text-white">Memuat Riwayat War...</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Mengambil data arsip War Classic terbaru.</p>
            </div>
        );
    }

    // --- TAMPILAN ERROR (TUGAS: Gunakan 'error' dari SWR) ---
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">Error Memuat Data</p>
                <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">{error.message}</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Coba Muat Ulang
                </Button>
            </div>
        );
    }

    // --- TAMPILAN EMPTY STATE (TUGAS: Gunakan 'sortedHistory' dari SWR) ---
    if (!sortedHistory || sortedHistory.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <BookOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Riwayat War Kosong</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Belum ada arsip War Classic yang tersimpan di database.</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Sinkronisasi Ulang Klan
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
                <h2 className="text-2xl font-clash text-white flex items-center gap-2">
                    <BookOpenIcon className="h-6 w-6 text-coc-gold" /> Riwayat War Klasik
                </h2>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> Muat Ulang & Sinkronisasi
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
                        {sortedHistory.map(war => (
                            <WarHistoryRow key={war.id} war={war} onViewDetails={handleViewDetails} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tempat untuk War Detail Modal */}
            <WarDetailModal
                warId={selectedWarId}
                clanId={clan.id} // <-- TUGAS: Diperbarui untuk menggunakan clan.id dari props
                onClose={handleCloseModal}
            />

        </div>
    );
};

export default WarHistoryTabContent;

