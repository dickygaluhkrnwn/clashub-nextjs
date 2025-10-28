'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RaidArchive, CocRaidLog, CocRaidMember, ManagedClan } from '@/lib/types'; // Pastikan tipe diimpor dengan benar
// BARU: Import Ikon ArrowUp/Down untuk sorting
import { CoinsIcon, RefreshCwIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, StarIcon, UserIcon, ShieldIcon, SwordsIcon, TrophyIcon, ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons'; // Pastikan ikon diimpor
import { Button } from '@/app/components/ui/Button';

// --- TIPE SORTIR BARU ---
type RaidSortKey = 'endTime' | 'capitalTotalLoot' | 'totalAttacks' | 'raidId';
type SortDirection = 'asc' | 'desc';
// -----------------------

// Tipe data dengan ID wajib untuk riwayat (digunakan di client)
interface RaidArchiveWithId extends RaidArchive {
    // Memastikan ID ada setelah dibaca dari Firestore
    id: string; 
}

interface RaidTabContentProps {
    clan: ManagedClan;
    initialCurrentRaid: CocRaidLog | null | undefined; // Raid yang sedang berjalan atau terbaru
    initialRaidArchives: RaidArchiveWithId[]; // Riwayat raid dari Server Component
    onRefresh: () => void; // Fungsi refresh data
}

// ======================================================================================================
// Helper Functions
// ======================================================================================================

// Helper untuk format tanggal (lebih robust)
const formatDate = (dateInput: Date | string | undefined, includeTime: boolean = true): string => {
    if (!dateInput) return 'N/A';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return 'Invalid Date'; 
        
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};

// Helper untuk format angka
const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('id-ID');
};

// ======================================================================================================
// Sub-Components
// ======================================================================================================

// Komponen Tabel Anggota Raid
const RaidMemberTable: React.FC<{ members: CocRaidMember[] | undefined | null }> = ({ members }) => {
    if (!members || members.length === 0) {
        return <p className="text-gray-400 font-sans italic text-sm my-3">Data partisipasi anggota tidak tersedia untuk raid ini.</p>;
    }

    // Urutkan anggota berdasarkan total jarahan (tertinggi dulu)
    const sortedMembers = useMemo(() => {
        return [...members].sort((a, b) => (b.capitalResourcesLooted || 0) - (a.capitalResourcesLooted || 0));
    }, [members]);

    return (
        <div className="overflow-x-auto mt-4 rounded-md border border-coc-gold-dark/20">
            <table className="min-w-full divide-y divide-coc-gold-dark/30">
                <thead className="bg-black/30">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">Nama Pemain</th>
                        <th className="px-4 py-2 text-right text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">Serangan Digunakan</th>
                        <th className="px-4 py-2 text-right text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">Total Jarahan</th>
                    </tr>
                </thead>
                <tbody className="bg-black/10 divide-y divide-coc-gold-dark/20">
                    {sortedMembers.map((member, index) => (
                        <tr key={member.tag || index} className="hover:bg-black/20 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{index + 1}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans">{member.name || 'Nama Tdk Tersedia'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans text-right">
                                {member.attacks ?? 'N/A'} / { (member.attackLimit ?? 0) + (member.bonusAttackLimit ?? 0)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans text-right">{formatNumber(member.capitalResourcesLooted)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Komponen Ringkasan Raid Aktif/Terbaru
const CurrentRaidSummary: React.FC<{ raid: CocRaidLog | null | undefined }> = ({ raid }) => {
    // [CODE AS IS]
    if (!raid) {
        return (
            <div className="p-6 text-center bg-coc-dark/30 rounded-lg border border-coc-gold-dark/20">
                <CoinsIcon className="h-10 w-10 text-coc-gold/50 mx-auto mb-2" />
                <p className="text-gray-400 font-sans">Tidak ada data Raid Capital aktif atau terbaru.</p>
                <p className="text-xs text-gray-500 font-sans mt-1">Data akan muncul setelah sinkronisasi berikutnya jika ada raid aktif/selesai.</p>
            </div>
        );
    }

    return (
        <div className="bg-coc-dark/30 rounded-lg p-6 space-y-4 border border-coc-gold-dark/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-xl font-clash text-coc-gold flex items-center mb-2 sm:mb-0">
                        <CoinsIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                        {raid.state === 'ongoing' ? 'Raid Sedang Berlangsung' : 'Raid Terbaru Selesai'}
                    </h3>
                    <span className={`text-xs font-sans px-2 py-1 rounded ${raid.state === 'ongoing' ? 'bg-green-600/70 text-white' : 'bg-gray-600/70 text-gray-200'}`}>
                        {raid.state === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                    </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Info Waktu & Jarahan */}
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ClockIcon className="h-3 w-3 mr-1"/>Mulai</p>
                    <p className="font-sans text-white">{formatDate(raid.startTime)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ClockIcon className="h-3 w-3 mr-1"/>Selesai</p>
                    <p className="font-sans text-white">{formatDate(raid.endTime)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><CoinsIcon className="h-3 w-3 mr-1"/>Total Jarahan Klan</p>
                    <p className="font-sans text-white font-bold text-lg">{formatNumber(raid.capitalTotalLoot)}</p>
                </div>
                {/* Info Serangan & Distrik */}
                    <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                        <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><SwordsIcon className="h-3 w-3 mr-1"/>Total Serangan Klan</p>
                        <p className="font-sans text-white">{formatNumber(raid.totalAttacks)}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                        <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ShieldIcon className="h-3 w-3 mr-1"/>Distrik Musuh Hancur</p>
                        <p className="font-sans text-white">{formatNumber(raid.enemyDistrictsDestroyed)}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                        <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><TrophyIcon className="h-3 w-3 mr-1"/>Medali (Offense/Defense)</p>
                        <p className="font-sans text-white">{formatNumber(raid.offensiveReward)} / {formatNumber(raid.defensiveReward)}</p>
                    </div>
                </div>
                {/* Tabel Partisipasi Anggota */}
                <div className="mt-6"> {/* Beri jarak atas */}
                        <h4 className="text-md font-clash text-coc-gold mb-2 flex items-center"><UserIcon className="h-4 w-4 mr-1"/> Partisipasi Anggota</h4>
                        <RaidMemberTable members={raid.members} />
                </div>
            </div>
    );
};

// Komponen Item Riwayat Raid (Collapsible) - Dipertahankan untuk detail saat diklik
const RaidHistoryItemDetail: React.FC<{ raid: RaidArchiveWithId, isSelected: boolean, onClick: (id: string) => void }> = ({ raid, isSelected, onClick }) => {
    return (
        <div className="border border-coc-gold-dark/30 rounded-lg overflow-hidden bg-coc-dark/20 shadow-sm transition-all duration-300 ease-in-out">
            {/* Header Button */}
            <button
                onClick={() => onClick(raid.id)}
                className="w-full flex justify-between items-center p-4 bg-black/20 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-coc-gold/50 transition-colors duration-150 text-left"
                aria-expanded={isSelected}
                aria-controls={`raid-details-${raid.id}`}
            >
                <div className="flex items-center space-x-3">
                    <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0"/>
                    <div>
                        <p className="font-clash text-coc-gold text-base">Raid Selesai: {formatDate(raid.endTime)}</p>
                        <p className="text-xs text-gray-400 font-sans mt-1">
                            <span className="mr-3 inline-flex items-center"><CoinsIcon className="h-3 w-3 mr-1"/>Total Jarahan: <strong className="text-white ml-1">{formatNumber(raid.capitalTotalLoot)}</strong></span> |
                            <span className="ml-3 inline-flex items-center"><SwordsIcon className="h-3 w-3 mr-1"/>Total Serangan: <strong className="text-white ml-1">{formatNumber(raid.totalAttacks)}</strong></span>
                        </p>
                    </div>
                </div>
                {isSelected ? <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0"/> : <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0"/>}
            </button>
            {/* Konten Detail (jika terpilih) */}
            {isSelected && (
                <div
                    id={`raid-details-${raid.id}`}
                    className="p-4 bg-black/10 border-t border-coc-gold-dark/30"
                    role="region"
                >
                    <h4 className="text-md font-clash text-coc-gold mb-2 flex items-center"><UserIcon className="h-4 w-4 mr-1"/> Detail Partisipasi Anggota</h4>
                    <RaidMemberTable members={raid.members} />
                    {/* Di sini bisa ditambahkan detail lain jika diperlukan, misal log serangan/pertahanan */}
                </div>
            )}
        </div>
    );
};


// ======================================================================================================
// Main Component: RaidTabContent
// ======================================================================================================

const RaidTabContent: React.FC<RaidTabContentProps> = ({
    clan,
    initialCurrentRaid,
    initialRaidArchives,
    onRefresh
}) => {
    const [loading, setLoading] = useState(false);
    // State untuk data raid, diinisialisasi dari props
    const [currentRaid, setCurrentRaid] = useState<CocRaidLog | null | undefined>(initialCurrentRaid);
    const [raidArchives, setRaidArchives] = useState<RaidArchiveWithId[]>(initialRaidArchives || []);
    // State untuk mengontrol ekspansi detail riwayat
    const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
    // State Sortir BARU
    const [sort, setSort] = useState<{ key: RaidSortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });


    // Efek untuk memperbarui state jika props awal berubah (misalnya setelah refresh)
    useEffect(() => {
        setCurrentRaid(initialCurrentRaid);
        setRaidArchives(initialRaidArchives || []);
        // Reset loading state jika refresh selesai (opsional, tergantung implementasi parent)
        setLoading(false); 
    }, [initialCurrentRaid, initialRaidArchives]);

    // Handler untuk tombol refresh
    const handleRefreshClick = () => {
        setLoading(true);
        onRefresh(); // Memanggil fungsi refresh yang diteruskan dari parent (ManageClanClient)
        // Parent akan memuat ulang data Server Component, yang kemudian memperbarui props di sini via useEffect
    };

    // Handler untuk membuka/menutup detail riwayat raid
    const toggleArchiveDetails = (raidId: string) => {
        setSelectedArchiveId(prevId => (prevId === raidId ? null : raidId));
    };

    // --- FUNGSI SORTIR UTAMA ---
    const handleSort = useCallback((key: RaidSortKey) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    }, []);

    // --- LOGIKA SORTIR DATA (Riwayat Raid) ---
    const sortedArchives = useMemo(() => {
        const data = [...raidArchives];

        data.sort((a, b) => {
            let comparison = 0;
            const dir = sort.direction === 'asc' ? 1 : -1;

            let valueA: any;
            let valueB: any;

            if (sort.key === 'endTime') {
                // Ambil nilai Date dari endTime
                valueA = a.endTime instanceof Date ? a.endTime.getTime() : new Date(a.endTime || 0).getTime();
                valueB = b.endTime instanceof Date ? b.endTime.getTime() : new Date(b.endTime || 0).getTime();
                
                // Urutan default (terbaru di atas) sudah terbalik, jadi biarkan comparison murni.
                comparison = valueA - valueB; 

                // Jika endTime adalah default, biarkan comparison = 0
                if (valueA === 0 && valueB === 0) comparison = 0;
                
            } else {
                // Untuk angka (Loot, Attacks) atau String (raidId)
                valueA = a[sort.key] ?? 0;
                valueB = b[sort.key] ?? 0;

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    comparison = valueA.localeCompare(valueB);
                } else {
                    comparison = (valueA as number) - (valueB as number);
                }
                
                comparison *= dir; // Terapkan arah sortir
            }

            // Untuk endTime, kita perlu membalik perbandingan di luar switch
            if (sort.key === 'endTime' && sort.direction === 'desc') {
                return comparison * -1; // Terbaru di atas
            } else if (sort.key === 'endTime' && sort.direction === 'asc') {
                 return comparison; // Terlama di atas
            }
            
            return comparison;
        });

        return data;
    }, [raidArchives, sort]);

    // Menentukan ikon sortir
    const getSortIcon = (key: RaidSortKey) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
    };

    // Menentukan kelas CSS untuk header sortable
    const getHeaderClasses = (key: RaidSortKey, align: 'left' | 'center' | 'right') =>
        `py-3 px-4 text-${align} text-xs font-extrabold text-gray-400 uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
            sort.key === key ? 'text-white bg-gray-700/50' : ''
        }`;


    // --- RENDER UTAMA KOMPONEN ---
    return (
        <div className="space-y-6">
            {/* Header Tab & Tombol Refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-clash text-coc-gold flex items-center">
                    <CoinsIcon className="h-7 w-7 mr-2" />
                    Ibu Kota Klan (Raid)
                </h2>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshClick}
                    disabled={loading}
                    className="flex items-center w-full sm:w-auto" // Responsif
                >
                    <RefreshCwIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Memuat Ulang...' : 'Refresh Data'}
                </Button>
            </div>

            {/* Bagian Raid Terbaru */}
            <section aria-labelledby="current-raid-heading">
                <h3 id="current-raid-heading" className="text-lg font-clash text-white mb-3 border-b border-coc-gold-dark/20 pb-1">
                    Ringkasan Raid Terbaru / Sedang Berjalan
                </h3>
                <CurrentRaidSummary raid={currentRaid} />
            </section>

            {/* Bagian Riwayat Raid */}
            <section aria-labelledby="raid-history-heading">
                <h3 id="raid-history-heading" className="text-lg font-clash text-white mb-3 border-b border-coc-gold-dark/20 pb-1">
                    Riwayat Raid Capital
                </h3>
                {/* Kondisi Loading / Empty State */}
                {loading && raidArchives.length === 0 && (
                    <p className="text-gray-400 font-sans italic text-center py-4">Memuat riwayat raid...</p>
                )}
                {!loading && raidArchives.length === 0 && (
                    <p className="text-gray-400 font-sans italic text-center py-4">Belum ada riwayat raid yang diarsipkan atau data belum dimuat.</p>
                )}
                {/* Daftar Riwayat (Menggunakan Tabel untuk Sortir) */}
                {raidArchives.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    {/* Kolom Tanggal Selesai (Default Sort) */}
                                    <th 
                                        className={getHeaderClasses('endTime', 'left') + ' w-40'}
                                        onClick={() => handleSort('endTime')}
                                    >
                                        <div className="flex items-center">
                                            <ClockIcon className="h-3 w-3 mr-1"/> Selesai {getSortIcon('endTime')}
                                        </div>
                                    </th>
                                    {/* Kolom Total Jarahan (Sortable) */}
                                    <th 
                                        className={getHeaderClasses('capitalTotalLoot', 'right') + ' w-40'}
                                        onClick={() => handleSort('capitalTotalLoot')}
                                    >
                                        <div className="flex items-center justify-end">
                                            Total Loot {getSortIcon('capitalTotalLoot')}
                                        </div>
                                    </th>
                                    {/* Kolom Total Serangan (Sortable) */}
                                    <th 
                                        className={getHeaderClasses('totalAttacks', 'center') + ' w-24'}
                                        onClick={() => handleSort('totalAttacks')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Attacks {getSortIcon('totalAttacks')}
                                        </div>
                                    </th>
                                    {/* Kolom Detail (Non-Sortable) */}
                                    <th className="py-3 px-4 text-center text-xs font-extrabold text-gray-400 uppercase tracking-wider w-20">
                                        Partisipasi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {sortedArchives.map(raid => (
                                    <tr
                                        key={raid.id}
                                        className="bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer"
                                        onClick={() => toggleArchiveDetails(raid.id)}
                                    >
                                        {/* Tanggal Selesai */}
                                        <td className="py-3 px-4 text-sm font-semibold text-gray-300">
                                            {formatDate(raid.endTime, false)}
                                        </td>
                                        {/* Total Jarahan */}
                                        <td className="py-3 px-4 text-right text-sm font-bold text-yellow-500">
                                            {formatNumber(raid.capitalTotalLoot)}
                                        </td>
                                        {/* Total Serangan */}
                                        <td className="py-3 px-4 text-center text-sm font-semibold text-gray-300">
                                            {formatNumber(raid.totalAttacks)}
                                        </td>
                                        {/* Detail */}
                                        <td className="py-3 px-4 text-center">
                                            {selectedArchiveId === raid.id ? 
                                                <ChevronUpIcon className="w-4 h-4 text-yellow-500 mx-auto" /> : 
                                                <ChevronDownIcon className="w-4 h-4 text-gray-400 mx-auto" />
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Konten Detail (di luar tabel utama) */}
                        {selectedArchiveId && (
                            <div className="mt-4">
                                {raidArchives.map(raid => 
                                    raid.id === selectedArchiveId && (
                                        <div key={raid.id} className="p-4 border border-coc-gold-dark/30 rounded-lg bg-black/50">
                                            <h4 className="text-md font-clash text-coc-gold mb-2 flex items-center"><UserIcon className="h-4 w-4 mr-1"/> Detail Partisipasi Anggota</h4>
                                            <RaidMemberTable members={raid.members} />
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RaidTabContent;
