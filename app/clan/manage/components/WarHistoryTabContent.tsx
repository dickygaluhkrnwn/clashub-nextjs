import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WarSummary, WarResult } from '@/lib/types'; 
// [BARU] Import fungsi pengambilan data dari Client SDK
// FirestoreDocument kini diekspor dari lib/firestore
import { getWarSummaries, FirestoreDocument } from '@/lib/firestore'; 
// FIXED: Hapus Loader2Icon yang tidak ter-ekspor. Kita akan menggunakan RefreshCwIcon sebagai spinner.
import { BookOpenIcon, ClockIcon, StarIcon, SwordsIcon, AlertTriangleIcon, RefreshCwIcon, ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import WarDetailModal from './WarDetailModal'; 

interface WarHistoryTabContentProps {
    clanId: string; // ID Internal Klan Firestore
    clanTag: string; // Tag Klan CoC
    onRefresh: () => void;
    // initialWarHistory dihapus karena komponen akan mengambil data sendiri
}

// Definisikan tipe untuk kolom yang dapat diurutkan
type SortKey = keyof WarSummary | 'none';
type SortDirection = 'asc' | 'desc';

// ======================================================================================================
// Helper: Tampilan Baris Riwayat War
// ======================================================================================================

interface WarHistoryRowProps {
    war: FirestoreDocument<WarSummary>; // Menggunakan FirestoreDocument<WarSummary>
    onViewDetails: (warId: string) => void;
}

const WarHistoryRow: React.FC<WarHistoryRowProps> = ({ war, onViewDetails }) => {
    // Menentukan kelas CSS berdasarkan hasil war
    const resultClass = 
        war.result === 'win' ? 'bg-coc-green text-black' : 
        war.result === 'lose' ? 'bg-coc-red text-white' : 
        war.result === 'tie' ? 'bg-coc-blue text-white' : 
        'bg-gray-600 text-white';

    // Pastikan war.endTime adalah objek Date sebelum pemformatan
    const formattedDate = (war.endTime instanceof Date ? war.endTime : new Date(war.endTime)).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    
    // Menggunakan properti hasDetails yang sudah tersedia di WarSummary
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
                {/* --- Kontrol tombol berdasarkan hasDetails --- */}
                <Button 
                    size="sm" 
                    variant="secondary" // FIXED: Menggunakan variant yang valid ('secondary') untuk menghindari error 2322
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

const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({ clanId, clanTag, onRefresh }) => {
    const [history, setHistory] = useState<FirestoreDocument<WarSummary>[]>([]); 
    const [isLoading, setIsLoading] = useState(true); // State Loading
    const [error, setError] = useState<string | null>(null);

    const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
    
    const [sort, setSort] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });
    
    // --- FUNGSI PENGAMBILAN DATA BARU ---
    const fetchWarHistory = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Menggunakan fungsi Client SDK yang baru
            const data = await getWarSummaries(clanId, 50);
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch war history:", err);
            setError("Gagal memuat riwayat perang dari database.");
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    }, [clanId]);

    // Panggil fetchWarHistory saat komponen dimuat atau clanId berubah
    useEffect(() => {
        if (clanId) {
            fetchWarHistory();
        }
    }, [clanId, fetchWarHistory]); 
    
    // Fungsi untuk membuka Modal Detail
    const handleViewDetails = useCallback((warId: string) => {
        setSelectedWarId(warId);
    }, []);

    // Fungsi untuk menutup Modal Detail
    const handleCloseModal = useCallback(() => {
        setSelectedWarId(null);
    }, []);

    // Menggabungkan onRefresh prop dengan fetchWarHistory untuk tombol "Muat Ulang"
    const handleFullRefresh = useCallback(() => {
        onRefresh(); // Memanggil sync di page.tsx
        // Tunggu sebentar (delay simulasi) lalu refresh data lokal
        setTimeout(() => {
            fetchWarHistory();
        }, 3000); 
    }, [onRefresh, fetchWarHistory]);

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
            let valueA: any = a[sort.key as keyof WarSummary];
            let valueB: any = b[sort.key as keyof WarSummary];
            let comparison = 0;

            if (sort.key === 'result') {
                comparison = resultOrder[valueA as WarResult] - resultOrder[valueB as WarResult];
            } else if (sort.key === 'opponentName' || sort.key === 'id') {
                comparison = String(valueA).localeCompare(String(valueB));
            } else if (sort.key === 'endTime') {
                 // endTime di state kini dipastikan berupa Date karena dimapping di fetchWarHistory
                comparison = valueA.getTime() - valueB.getTime();
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
    const getSortIcon = (key: SortKey) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
    };

    const getHeaderClasses = (key: SortKey) => 
        `px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
            sort.key === key ? 'text-white' : ''
        }`;
    

    // --- TAMPILAN LOADING ---
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <RefreshCwIcon className="h-8 w-8 text-coc-gold animate-spin mb-3" /> {/* FIXED: Menggunakan RefreshCwIcon sebagai fallback spinner */}
                <p className="text-lg font-clash text-white">Memuat Riwayat War...</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Mengambil data arsip War Classic terbaru.</p>
            </div>
        );
    }
    
    // --- TAMPILAN ERROR ---
    if (error) {
         return (
            <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">Error Memuat Data</p>
                <p className="text-sm text-gray-400 font-sans mt-1">{error}</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Coba Muat Ulang
                </Button>
            </div>
        );
    }

    // --- TAMPILAN EMPTY STATE ---
    if (!sortedHistory || sortedHistory.length === 0) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <BookOpenIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                <p className="text-lg font-clash text-white">Riwayat War Kosong</p>
                <p className="text-sm text-gray-400 font-sans mt-1">Belum ada arsip War Classic yang tersimpan di database.</p>
                <Button onClick={handleFullRefresh} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Sinkronisasi Ulang Klan
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
                    <RefreshCwIcon className='h-4 w-4 mr-2'/> Muat Ulang & Sinkronisasi
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
                clanId={clanId}
                onClose={handleCloseModal}
            />

        </div>
    );
};

export default WarHistoryTabContent;
