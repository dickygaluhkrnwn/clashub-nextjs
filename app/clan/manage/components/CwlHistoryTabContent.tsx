// File: app/clan/manage/components/CwlHistoryTabContent.tsx
// Deskripsi: Menampilkan riwayat Clan War League (CWL) berdasarkan data arsip Firestore.

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CwlArchive, CocWarLog } from '@/lib/types'; // Asumsi CwlArchive diimpor dari lib/types
import { Loader2, Calendar, ChevronRight, Scale, X, Check, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale'; // Untuk format bahasa Indonesia

// Helper Type untuk data yang sudah di-hydrate dari Firestore
type CwlArchiveWithId = CwlArchive & { id: string };

// --- Props Component ---
interface CwlHistoryTabContentProps {
    clanId: string;
    // Kita akan mendapatkan data awal dari Server Component (page.tsx)
    initialCwlArchives: CwlArchiveWithId[];
}

// --- Component Pembantu: Menampilkan Detail Perang Harian CWL ---
interface CwlWarDetailProps {
    round: CocWarLog;
    clanTag: string; // Tag klan kita, untuk identifikasi
    roundIndex: number; // Index ronde (Hari ke-X)
}

const CwlWarDetail: React.FC<CwlWarDetailProps> = ({ round, clanTag, roundIndex }) => {
    // Tentukan klan kita dan lawan
    const ourClan = round.clan.tag === clanTag ? round.clan : round.opponent;
    const opponentClan = round.clan.tag === clanTag ? round.opponent : round.clan;

    // Hitung rata-rata TH klan kita (placeholder, karena CocWarClanInfo tidak punya avgTh)
    const ourAvgTh = (ourClan.members.reduce((sum, m) => sum + m.townhallLevel, 0) / ourClan.members.length) || 0;
    const opponentAvgTh = (opponentClan.members.reduce((sum, m) => sum + m.townhallLevel, 0) / opponentClan.members.length) || 0;

    const warDate = round.endTime ? format(new Date(round.endTime), 'EEEE, dd MMM yyyy', { locale: id }) : 'Tanggal Tidak Diketahui';

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700/50 mb-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-3">
                <h4 className="text-xl font-bold text-yellow-400">Hari Ke-{roundIndex + 1}</h4>
                <span className={`text-sm font-medium ${round.result === 'win' ? 'text-green-400' : round.result === 'lose' ? 'text-red-400' : 'text-blue-400'}`}>
                    Hasil: {round.result ? round.result.toUpperCase() : 'UNKNOWN'}
                </span>
            </div>

            {/* Ringkasan Perang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Klan Kita */}
                <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col justify-between">
                    <p className="font-semibold text-white mb-2 flex items-center">
                        ⚔️ Kita: {ourClan.name}
                    </p>
                    <div className="space-y-1">
                        <p className="text-gray-300">Bintang: <span className="font-bold text-yellow-400">{ourClan.stars}</span></p>
                        <p className="text-gray-300">Persen Hancur: <span className="font-bold">{ourClan.destructionPercentage.toFixed(2)}%</span></p>
                        <p className="text-gray-300">Rata-rata TH: {ourAvgTh.toFixed(1)}</p>
                    </div>
                </div>

                {/* Klan Lawan */}
                <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col justify-between">
                    <p className="font-semibold text-white mb-2 flex items-center">
                        🔥 Lawan: {opponentClan.name}
                    </p>
                    <div className="space-y-1">
                        <p className="text-gray-300">Bintang: <span className="font-bold text-yellow-400">{opponentClan.stars}</span></p>
                        <p className="text-gray-300">Persen Hancur: <span className="font-bold">{opponentClan.destructionPercentage.toFixed(2)}%</span></p>
                        <p className="text-gray-300">Rata-rata TH: {opponentAvgTh.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            {/* Tabel Detail Serangan (Sederhana) */}
            <div className="mt-4 overflow-x-auto">
                <h5 className="text-lg font-semibold text-white mb-2">Detail Serangan Klan Kita ({ourClan.attacks || 0} Attacks)</h5>
                <table className="min-w-full text-left text-sm text-gray-300">
                    <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                        <tr>
                            <th scope="col" className="px-3 py-2">No.</th>
                            <th scope="col" className="px-3 py-2">Pemain</th>
                            <th scope="col" className="px-3 py-2">TH</th>
                            <th scope="col" className="px-3 py-2">Serangan</th>
                            <th scope="col" className="px-3 py-2 text-center">Bintang (Max)</th>
                            <th scope="col" className="px-3 py-2 text-center">% Hancur (Max)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ourClan.members.map((member, index) => {
                            const maxAttack = member.attacks?.reduce((max, attack) => attack.destructionPercentage > max.destructionPercentage ? attack : max, member.attacks[0]);
                            
                            // Gunakan serangan terbaik sebagai representasi performa
                            const bestAttack = member.attacks?.reduce((best, attack) => {
                                if (!best) return attack;
                                if (attack.stars > best.stars) return attack;
                                if (attack.stars === best.stars && attack.destructionPercentage > best.destructionPercentage) return attack;
                                return best;
                            }, null as (typeof member.attacks[0] | null));

                            return (
                                <tr key={member.tag} className="border-b border-gray-700 hover:bg-gray-700/70">
                                    <td className="px-3 py-2 font-medium text-white">{member.mapPosition}</td>
                                    <td className="px-3 py-2">{member.name}</td>
                                    <td className="px-3 py-2 text-center text-yellow-300">{member.townhallLevel}</td>
                                    <td className="px-3 py-2 text-center">{member.attacks?.length || 0}</td>
                                    <td className="px-3 py-2 text-center">
                                        {bestAttack?.stars !== undefined ? (
                                            <span className={`font-bold ${bestAttack.stars === 3 ? 'text-green-400' : bestAttack.stars > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {bestAttack.stars} ⭐
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-center">{bestAttack?.destructionPercentage !== undefined ? `${bestAttack.destructionPercentage.toFixed(2)}%` : '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
};
// --- END Component Pembantu: CwlWarDetail ---


const CwlHistoryTabContent: React.FC<CwlHistoryTabContentProps> = ({ clanId, initialCwlArchives }) => {
    // State untuk daftar arsip (seperti daftar musim)
    const [cwlArchives, setCwlArchives] = useState<CwlArchiveWithId[]>(initialCwlArchives);
    // State untuk arsip CWL yang sedang dilihat detailnya (satu musim)
    const [selectedSeason, setSelectedSeason] = useState<CwlArchiveWithId | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fungsi fetch data jika diperlukan (misalnya refresh atau load more)
    const fetchCwlArchives = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Catatan: API Route untuk ini BELUM ADA (akan dibuat di langkah selanjutnya)
            // Untuk saat ini, kita gunakan initial data yang dikirim dari Server Component
            // Jika Anda mengaktifkan fetching, URL akan seperti ini:
            // const response = await fetch(`/api/clan/manage/${clanId}/cwl-archives`);
            // if (!response.ok) throw new Error('Gagal mengambil data arsip CWL.');
            // const data = await response.json();
            // setCwlArchives(data);
        } catch (err) {
            console.error(err);
            setError('Terjadi kesalahan saat memuat data arsip CWL.');
        } finally {
            setIsLoading(false);
        }
    }, [clanId]);


    // Efek untuk update state lokal jika initial data berubah (meskipun jarang terjadi)
    useEffect(() => {
        if (initialCwlArchives.length > 0) {
            setCwlArchives(initialCwlArchives);
        } else {
            // Jika tidak ada data awal, coba fetch (opsional)
            // fetchCwlArchives(); 
        }
    }, [initialCwlArchives]);


    // Menghitung ringkasan musim (total win/loss/tie)
    const getSeasonSummary = (rounds: CocWarLog[]) => {
        let wins = 0;
        let losses = 0;
        let ties = 0;
        let totalStars = 0;
        let totalDestruction = 0;
        let totalWarCount = 0;

        rounds.forEach(round => {
            if (round.result === 'win') wins++;
            else if (round.result === 'lose') losses++;
            else if (round.result === 'tie') ties++;
            
            // Asumsi round.clan selalu klan kita saat diarsip di rounds[]
            const ourClan = round.clan; 
            totalStars += ourClan.stars;
            totalDestruction += ourClan.destructionPercentage;
            totalWarCount++;
        });

        const avgDestruction = totalWarCount > 0 ? (totalDestruction / totalWarCount).toFixed(2) : '0.00';

        return { wins, losses, ties, totalStars, avgDestruction, totalWarCount };
    };

    // --- Tampilan Detail Per Musim ---
    if (selectedSeason) {
        const { wins, losses, ties, totalStars, avgDestruction } = getSeasonSummary(selectedSeason.rounds);

        return (
            <div className="p-4 sm:p-6 bg-gray-900 min-h-[500px]">
                {/* Header Detail Musim */}
                <button
                    onClick={() => setSelectedSeason(null)}
                    className="flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Kembali ke Daftar Musim
                </button>

                <div className="bg-gray-800 p-5 rounded-xl shadow-xl mb-6">
                    <h2 className="text-3xl font-extrabold text-white mb-2">
                        Riwayat CWL: {selectedSeason.season}
                    </h2>
                    <p className="text-sm text-gray-400">
                        Total Perang: {selectedSeason.rounds.length}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Menang</p>
                            <p className="text-xl font-bold text-green-400">{wins}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Kalah</p>
                            <p className="text-xl font-bold text-red-400">{losses}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Seri</p>
                            <p className="text-xl font-bold text-blue-400">{ties}</p>
                        </div>
                    </div>
                    <div className="mt-4 border-t border-gray-700 pt-3">
                        <p className="text-sm text-gray-300">Total Bintang: <span className="font-bold text-yellow-400">{totalStars}</span></p>
                        <p className="text-sm text-gray-300">Rata-rata % Hancur per War: <span className="font-bold">{avgDestruction}%</span></p>
                    </div>
                </div>

                {/* Daftar Perang Harian */}
                <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Log Pertempuran Harian</h3>
                <div className="space-y-4">
                    {selectedSeason.rounds
                        .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()) // Urutkan berdasarkan waktu selesai (Hari ke-1, 2, ...)
                        .map((round, index) => (
                            <CwlWarDetail
                                key={index}
                                round={round}
                                clanTag={selectedSeason.clanTag}
                                roundIndex={index}
                            />
                        ))}
                </div>
            </div>
        );
    }

    // --- Tampilan Daftar Musim CWL ---
    return (
        <div className="p-4 sm:p-6 bg-gray-900 min-h-[500px]">
            <h1 className="text-3xl font-extrabold text-white mb-6 border-b border-gray-700 pb-2">
                Riwayat Clan War League
            </h1>

            {isLoading && (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                    <span className="ml-3 text-white">Memuat Arsip CWL...</span>
                </div>
            )}

            {error && (
                <div className="text-red-500 bg-red-900/50 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {!isLoading && cwlArchives.length === 0 && (
                <div className="text-center p-8 bg-gray-800 rounded-xl">
                    <Calendar className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                    <p className="text-lg text-gray-400">Belum ada arsip CWL yang ditemukan untuk Klan ini.</p>
                    <p className="text-sm text-gray-500 mt-1">Data akan muncul setelah sinkronisasi bulanan CWL pertama.</p>
                </div>
            )}

            {!isLoading && cwlArchives.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cwlArchives.map(archive => {
                        const { wins, losses, ties, totalWarCount } = getSeasonSummary(archive.rounds);
                        const warLeague = archive.rounds[0]?.clan?.warLeague?.name || 'Unknown League';
                        
                        // Gunakan tanggal terakhir dari rounds sebagai representasi end date
                        const lastRound = archive.rounds.length > 0 ? archive.rounds[archive.rounds.length - 1] : null;
                        const endDate = lastRound?.endTime ? format(new Date(lastRound.endTime), 'dd MMM yyyy', { locale: id }) : 'N/A';
                        
                        return (
                            <div
                                key={archive.id}
                                className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700/50 hover:border-yellow-500 transition-all cursor-pointer"
                                onClick={() => setSelectedSeason(archive)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-yellow-400 mb-1">Musim {archive.season}</h2>
                                        <p className="text-xs text-gray-400 font-semibold">{warLeague}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                </div>
                                
                                <div className="mt-4">
                                    <p className="text-sm text-gray-300 flex items-center mb-1">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                                        Selesai: {endDate}
                                    </p>
                                    <p className="text-sm text-gray-300 flex items-center">
                                        <Scale className="w-4 h-4 mr-2 text-gray-500" />
                                        Jumlah War: {totalWarCount}
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-3 text-center border-t border-gray-700 pt-3">
                                    <div>
                                        <p className="text-xs text-gray-400">W</p>
                                        <p className="text-lg font-bold text-green-400">{wins}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">L</p>
                                        <p className="text-lg font-bold text-red-400">{losses}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">T</p>
                                        <p className="text-lg font-bold text-blue-400">{ties}</p>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CwlHistoryTabContent;
