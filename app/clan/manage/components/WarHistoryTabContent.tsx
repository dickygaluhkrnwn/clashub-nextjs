import React, { useState, useEffect } from 'react';
import { WarArchive } from '@/lib/types';
import { BookOpenIcon, ClockIcon, StarIcon, SwordsIcon, AlertTriangleIcon, RefreshCwIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Tipe data yang akan ditampilkan dalam daftar riwayat
interface WarSummary {
    id: string; // ID Dokumen
    opponentName: string;
    teamSize: number;
    result: 'win' | 'lose' | 'tie' | 'unknown'; // Dibatasi oleh Union Type
    ourStars: number;
    opponentStars: number;
    ourDestruction: number;
    opponentDestruction: number;
    endTime: Date;
}

interface WarHistoryTabContentProps {
    clanId: string; // ID Internal Klan Firestore
    clanTag: string; // Tag Klan CoC
    onRefresh: () => void;
}

// ======================================================================================================
// Helper: Tampilan Baris Riwayat War
// ======================================================================================================

const WarHistoryRow: React.FC<{ war: WarSummary }> = ({ war }) => {
    const resultClass = war.result === 'win' ? 'bg-coc-green text-black' : war.result === 'lose' ? 'bg-coc-red text-white' : 'bg-coc-blue text-white';

    // Format tanggal
    const formattedDate = war.endTime.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
        <tr className="hover:bg-coc-stone/20 transition-colors cursor-pointer">
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
                {/* Di masa depan, tombol ini akan membuka modal detail War */}
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

/**
 * @component WarHistoryTabContent
 * Menampilkan arsip War Classic yang telah selesai.
 */
const WarHistoryTabContent: React.FC<WarHistoryTabContentProps> = ({ clanId, clanTag, onRefresh }) => {
    // Tipe data state diubah menjadi WarSummary[]
    const [history, setHistory] = useState<WarSummary[] | null>(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDetail, setShowDetail] = useState<boolean>(false);
    const [selectedWar, setSelectedWar] = useState<WarArchive | null>(null);
    
    // --- SIMULASI PENGAMBILAN DATA (HARUS DIGANTI DENGAN FETCH API WAR ARCHIVES NYATA) ---
    useEffect(() => {
        const fetchWarHistory = async () => {
            setIsLoading(true);
            setError(null);
            
            // SIMULASI data dari Arsip Perang CSV
            // PERBAIKAN: Memastikan result menggunakan tipe 'win' | 'lose' | 'tie'
            const mockData: WarSummary[] = [
                {
                    id: 'w1', opponentName: 'DIETARY', teamSize: 15, result: 'lose', 
                    ourStars: 45, opponentStars: 45, 
                    ourDestruction: 100, opponentDestruction: 100, endTime: new Date('2025-10-12T05:00:00Z')
                },
                {
                    id: 'w2', opponentName: 'PREDATOR ™', teamSize: 20, result: 'tie', 
                    ourStars: 60, opponentStars: 60, 
                    ourDestruction: 100, opponentDestruction: 100, endTime: new Date('2025-10-22T08:00:00Z')
                },
                {
                    id: 'w3', opponentName: 'SURXONSILA 75', teamSize: 15, result: 'win', 
                    ourStars: 45, opponentStars: 43, 
                    ourDestruction: 100, opponentDestruction: 97.8, endTime: new Date('2025-10-20T12:00:00Z')
                },
                // Tambahkan lebih banyak data simulasi di sini
            ].sort((a, b) => b.endTime.getTime() - a.endTime.getTime()); // Urutkan terbaru dulu

            await new Promise(resolve => setTimeout(resolve, 500)); // Simulasi delay
            setHistory(mockData);
            setIsLoading(false);
        };
        
        fetchWarHistory();
    }, [clanId]); // Refresh saat clanId berubah

    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <RefreshCwIcon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
                <p className="text-lg font-clash text-white">Memuat Riwayat Perang...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-coc-red">Error Memuat Data</p>
                <p className="text-sm text-gray-400 font-sans mt-1">{error}</p>
            </div>
        );
    }

    if (!history || history.length === 0) {
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

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                    <thead className="bg-coc-stone/70 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-20">Hasil</th>
                            <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">Lawan</th>
                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-20">Ukuran</th>
                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">Bintang / Persen</th>
                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-32">Selesai</th>
                            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-coc-gold-dark/10">
                        {history.map(war => (
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
