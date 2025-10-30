import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WarArchive, WarSummary, WarResult } from '@/lib/types';
import { BookOpenIcon, ClockIcon, StarIcon, SwordsIcon, AlertTriangleIcon, RefreshCwIcon, ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

interface WarHistoryTabContentProps {
    clanId: string; // ID Internal Klan Firestore
    clanTag: string; // Tag Klan CoC
    onRefresh: () => void;
    // --- PERUBAHAN: Menerima data riwayat dari server ---
    initialWarHistory: WarSummary[];
}

// Definisikan tipe untuk kolom yang dapat diurutkan
type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// ======================================================================================================
// Helper: Tampilan Baris Riwayat War
// ======================================================================================================

const WarHistoryRow: React.FC<{ war: WarSummary }> = ({ war }) => {
    const resultClass = war.result === 'win' ? 'bg-coc-green text-black' : war.result === 'lose' ? 'bg-coc-red text-white' : 'bg-coc-blue text-white';

    // --- PERBAIKAN: Konversi string ISO (dari props) ke Date untuk pemformatan ---
    // Kita bisa asumsikan 'war.endTime' di sini sudah dikonversi menjadi Date oleh komponen utama
    const formattedDate = (war.endTime instanceof Date ? war.endTime : new Date(war.endTime)).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
        // TODO: Tambahkan onClick untuk menampilkan Detail War (Fase selanjutnya)
        <tr className="hover:bg-coc-stone/20 transition-colors cursor-pointer" key={war.id}>
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
                    {/* Bintang Kita */}
                    <span className="text-coc-gold font-bold flex items-center">
                        {war.ourStars} <StarIcon className="h-4 w-4 ml-1 fill-coc-gold" />
                    </span>
                    <span className="text-gray-500">|</span>
                    {/* Bintang Lawan */}
                    <span className="text-coc-red font-bold flex items-center">
                        {war.opponentStars} <StarIcon className="h-4 w-4 ml-1 fill-coc-red" />
                    </span>
                </div>
                <span className="text-xs text-gray-400 block mt-0.5">
                    {war.ourDestruction.toFixed(2)}% vs {war.opponentDestruction.toFixed(2)}%
                </span>
            </td>
            
            {/* Kolom Tanggal Selesai */}
            <td className="px-3 py-3 whitespace-nowrap text-center text-xs text-gray-400">
                <span className="font-mono">{formattedDate}</span>
            </td>

            {/* Kolom Aksi */}
            <td className="px-3 py-3 whitespace-nowrap text-center w-[120px]">
                <Button size="sm" variant="secondary" className="text-xs">
                    Lihat Detail
                </Button>
            </td>
        </tr>
    );
};

// ======================================================================================================
// Main Component: WarHistoryTabContent
// ======================================================================================================

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({ clanId, clanTag, onRefresh, initialWarHistory }) => {
    
    // --- PERUBAHAN: State diinisialisasi dari props dan mengonversi endTime ke Date ---
    const [history, setHistory] = useState<WarSummary[]>(
        initialWarHistory.map(war => ({
            ...war,
            endTime: new Date(war.endTime), // Konversi string ISO ke Date
        }))
    ); 
    
    // --- PERUBAHAN: Hapus state isLoading dan error ---
    // const [isLoading, setIsLoading] = useState(true); // Dihapus
    // const [error, setError] = useState<string | null>(null); // Dihapus
    
    const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });
    
    // --- FUNGSI SORTIR UTAMA --- (Tetap sama)
    const handleSort = useCallback((key: SortKey) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    }, []);

    // --- PERUBAHAN: Hapus fetchWarHistory dan mockData ---
    // const fetchWarHistory = useCallback(...) // Dihapus

    // --- PERUBAHAN: Ganti useEffect fetch data dengan useEffect untuk update dari props ---
    useEffect(() => {
        // Jika props initialWarHistory berubah (misalnya setelah onRefresh), update state
        setHistory(initialWarHistory.map(war => ({
            ...war,
            endTime: new Date(war.endTime),
        })));
    }, [initialWarHistory]); // Bergantung pada initialWarHistory

    // --- LOGIKA SORTIR DATA ---
    const sortedHistory = useMemo(() => {
        if (!history) return [];

        // Buat salinan untuk menghindari mutasi state
        const sortedData = [...history];

        // WarResult 'win' > 'tie' > 'lose' > 'unknown'
        const resultOrder: Record<WarResult, number> = { 'win': 4, 'tie': 3, 'lose': 2, 'unknown': 1 };

        sortedData.sort((a, b) => {
            let valueA: any = a[sort.key as keyof WarSummary];
            let valueB: any = b[sort.key as keyof WarSummary];
            let comparison = 0;

            if (sort.key === 'result') {
                // Logika khusus untuk WarResult
                comparison = resultOrder[valueA as WarResult] - resultOrder[valueB as WarResult];
            } else if (sort.key === 'opponentName' || sort.key === 'id') {
                // Logika khusus untuk string
                comparison = String(valueA).localeCompare(String(valueB));
            } else if (sort.key === 'endTime') {
                 // Logika khusus untuk Date (state 'history' sudah dipastikan berisi Date)
                comparison = valueA.getTime() - valueB.getTime();
            } else {
                // Logika umum untuk angka (stars, destruction, teamSize)
                if (valueA === undefined || valueA === null) return sort.direction === 'asc' ? -1 : 1;
                if (valueB === undefined || valueB === null) return sort.direction === 'asc' ? 1 : -1;
                comparison = valueA - valueB;
            }

            return sort.direction === 'asc' ? comparison : -comparison;
        });

        return sortedData;
    }, [history, sort]);

    // --- HELPER UNTUK TAMPILAN HEADER SORT --- (Tetap sama)
    const getSortIcon = (key: SortKey) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
    };

    const getHeaderClasses = (key: SortKey) => 
        `px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
            sort.key === key ? 'text-white' : ''
        }`;
    

    // --- PERUBAHAN: Hapus tampilan isLoading dan error ---
    // if (isLoading) { ... } // Dihapus
    // if (error) { ... } // Dihapus

    // --- PERUBAHAN: Kondisi empty state sekarang berdasarkan sortedHistory ---
    if (!sortedHistory || sortedHistory.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <BookOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Riwayat War Kosong</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Belum ada arsip War Classic yang tersimpan di database.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-coc-gold-dark/50 pb-3">
                <h2 className="text-2xl font-clash text-white flex items-center gap-2">
                    <BookOpenIcon className="h-6 w-6 text-coc-gold" /> Riwayat War Klasik
                </h2>
                <Button onClick={onRefresh} variant="secondary" size="sm">
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Muat Ulang
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
                            <WarHistoryRow key={war.id} war={war} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TODO: Implementasikan Modal untuk Detail War jika WarHistoryRow diklik */}
        </div>
    );
};

export default WarHistoryTabContent;

