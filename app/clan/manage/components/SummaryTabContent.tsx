import React from 'react';
import { ManagedClan, ClanApiCache, TopPerformerPlayer } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { 
    RefreshCwIcon, ClockIcon, InfoIcon, SwordsIcon, ArrowUpIcon, ArrowDownIcon, CoinsIcon, TrophyIcon
} from '@/app/components/icons';
import TopPerformersCard from './TopPerformersCard';
import { formatNumber } from '@/lib/th-utils'; // formatNumber sekarang diexport dari sini

interface SummaryTabContentProps {
    clan: ManagedClan;
    cache: ClanApiCache | null;
    isSyncing: boolean;
    onSync: () => void;
    onRefresh: () => void; // Diteruskan dari parent untuk refresh data setelah sinkronisasi
}

/**
 * Komponen konten untuk Tab Ringkasan di halaman Manajemen Klan.
 * Menampilkan kontrol sinkronisasi dan data Top Performers.
 */
const SummaryTabContent: React.FC<SummaryTabContentProps> = ({ 
    clan, cache, isSyncing, onSync, onRefresh 
}) => {
    
    // Logika Sinkronisasi
    const isCacheStale = !cache || (new Date(cache.lastUpdated || 0).getTime() < Date.now() - 3600000); 

    // Data Top Performers (ambil dari cache, yang seharusnya sudah diisi oleh API Sync)
    const topPerformers = cache?.topPerformers;
    const warState = cache?.currentWar && 'state' in cache.currentWar ? (cache.currentWar as any).state : 'notInWar';
    const warStatusText = warState === 'inWar' ? 'WAR AKTIF' : warState === 'preparation' ? 'PERSIAPAN WAR' : warState === 'ended' ? 'WAR TERAKHIR' : 'TIDAK DALAM WAR';
    const warStatusClass = warState === 'inWar' ? 'text-coc-red' : warState === 'preparation' ? 'text-coc-blue' : 'text-coc-green';

    // FIX 1: Mengganti nama properti dari API Cache (asumsi: promotions/demotions)
    // Menggunakan fallback array kosong untuk menghindari masalah iterasi.
    const promotions = topPerformers?.promotions || [];
    const demotions = topPerformers?.demotions || [];
    const PROMOTION_LIMIT = 3; // Hardcode berdasarkan logika Apps Script
    const DEMOTION_LIMIT = 3; // Hardcode berdasarkan logika Apps Script

    // FIX 2: Mengatasi error property 'donations' and 'loot' pada TopPerformerPlayer
    // Menggunakan asumsi tipe TopPerformerPlayer, lalu mengakses value melalui 'value' atau 'donations'/'loot'
    // Menggunakan 'as any' untuk mengakses properti yang mungkin belum ada di lib/types.ts
    const topDonatorData = topPerformers?.topDonator as any;
    const topRaidLooterData = topPerformers?.topRaidLooter as any;
    
    const donatorValue = topDonatorData?.donations ?? topDonatorData?.value ?? 0;
    const looterValue = topRaidLooterData?.loot ?? topRaidLooterData?.value ?? 0;


    return (
        <div className="space-y-8">
            
            {/* Bagian 1: Kontrol Sinkronisasi & Info Internal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel Sinkronisasi */}
                <div className="card-stone p-6 space-y-4">
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" /> Kontrol Sinkronisasi
                    </h3>
                    <p className="text-sm text-gray-300 font-sans">
                        Sinkronisasi menarik data Anggota, War Log, CWL Archive, dan Raid Log terbaru. Tekan tombol di bawah untuk memperbarui data di dashboard.
                    </p>
                    <Button 
                        onClick={onSync} 
                        variant={isCacheStale ? 'primary' : 'secondary'}
                        disabled={isSyncing}
                        className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
                    >
                        <RefreshCwIcon className={`inline h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sedang Sinkronisasi...' : 'Sinkronisasi Manual Sekarang'}
                    </Button>
                </div>
                
                {/* Panel Info Internal */}
                <div className="card-stone p-6 space-y-3">
                    <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                        <InfoIcon className="h-5 w-5" /> Info Internal
                    </h3>
                    <p className="text-sm text-gray-300"><span className="font-bold">ID Internal:</span> {clan.id}</p>
                    <p className="text-sm text-gray-300"><span className="font-bold">UID Owner:</span> {clan.ownerUid}</p>
                    <p className="text-sm text-gray-300"><span className="font-bold">Status Rekrutmen:</span> <span className="text-coc-green capitalize">{clan.recruitingStatus}</span></p>
                    <p className="text-sm text-gray-300"><span className="font-bold">Total Anggota Clashub:</span> {clan.memberCount}</p>
                    <p className="text-sm text-gray-300"><span className="font-bold">Status War Aktif:</span> <span className={`${warStatusClass} font-semibold`}>{warStatusText}</span></p>
                </div>
            </div>

            {/* Bagian 2: Top Performers (Berupa kartu) */}
            <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/50 pb-2 flex items-center gap-3">
                <TrophyIcon className="h-6 w-6 text-coc-gold" /> Performa Terbaik Terakhir (Cache)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Kartu 1: Promosi */}
                <TopPerformersCard
                    title="Kandidat Promosi"
                    icon={<ArrowUpIcon className="h-6 w-6 text-coc-green" />}
                    className="bg-coc-green/10 border border-coc-green/30 text-coc-green"
                    value={promotions.length}
                    description={`Member yang siap dipromosikan ke Elder (Min ${PROMOTION_LIMIT} Sukses)`}
                    isPlayerList={true}
                    players={promotions}
                />
                
                {/* Kartu 2: Demosi */}
                <TopPerformersCard
                    title="Risiko Demosi"
                    icon={<ArrowDownIcon className="h-6 w-6 text-coc-red" />}
                    className="bg-coc-red/10 border border-coc-red/30 text-coc-red"
                    value={demotions.length}
                    description={`Elder yang berisiko didemosi ke Member (Min ${DEMOTION_LIMIT} Penalti)`}
                    isPlayerList={true}
                    players={demotions}
                />
                
                {/* Kartu 3: Top Donator */}
                <TopPerformersCard
                    title="Top Donator"
                    icon={<CoinsIcon className="h-6 w-6 text-coc-gold" />}
                    className="bg-coc-gold/10 border border-coc-gold/30 text-coc-gold"
                    value={topDonatorData?.name || 'N/A'}
                    description={`Total Donasi: ${formatNumber(donatorValue)}`}
                />

                {/* Kartu 4: Top Raid Looter */}
                <TopPerformersCard
                    title="Top Raid Looter"
                    icon={<SwordsIcon className="h-6 w-6 text-coc-blue" />}
                    className="bg-coc-blue/10 border border-coc-blue/30 text-coc-blue"
                    value={topRaidLooterData?.name || 'N/A'}
                    description={`Total Loot Raid: ${formatNumber(looterValue)}`}
                />
            </div>

            {/* Bagian 3: Detail War Aktif (Placeholder - Akan dibuat Tab terpisah) */}
            <div className="card-stone p-6">
                <h3 className="text-xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
                    <SwordsIcon className="h-5 w-5 text-coc-red" /> Ringkasan War Aktif (Detail)
                </h3>
                <p className="text-gray-400 mt-3">Detail War Aktif akan dipindahkan ke tab khusus di Fase 2, untuk saat ini gunakan War Log dari COC API.</p>
            </div>
            
        </div>
    );
};

export default SummaryTabContent;
