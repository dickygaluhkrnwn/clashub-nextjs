import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, ClanRole, CocWarLog, CwlArchive, RaidArchive } from '@/lib/types'; // BARU: Tambah RaidArchive
// Import Ikon
import { 
    UserCircleIcon, ShieldIcon, AlertTriangleIcon, CogsIcon, ClockIcon, InfoIcon, 
    TrophyIcon, UserIcon, XIcon, GlobeIcon, 
    RefreshCwIcon, ArrowRightIcon, MailOpenIcon, ThumbsUpIcon, ThumbsDownIcon, 
    TrashIcon, SettingsIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, SwordsIcon, BookOpenIcon,
    CalendarCheck2Icon, CoinsIcon // BARU: Tambah CoinsIcon
} from '@/app/components/icons'; 
// Import Komponen UI
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
// Import Tipe Props Server
import { ClanManagementProps } from '@/app/clan/manage/page'; 
// --- Komponen Tab Konten ---
import ClanManagementHeader from './components/ClanManagementHeader';
import SummaryTabContent from './components/SummaryTabContent';
import MemberTabContent from './components/MemberTabContent'; 
import RequestTabContent from './components/RequestTabContent'; 
import ActiveWarTabContent from './components/ActiveWarTabContent'; 
import WarHistoryTabContent from './components/WarHistoryTabContent'; 
import CwlHistoryTabContent from './components/CwlHistoryTabContent'; 
import RaidTabContent from './components/RaidTabContent'; // BARU: Komponen Raid

interface ManageClanClientProps {
    initialData: ClanManagementProps | null; // Data lengkap dari Server Component
    serverError: string | null;
    profile: UserProfile | null;
}

// BARU: Menambahkan 'raid' (Fase 3.2)
type ActiveTab = 'summary' | 'members' | 'requests' | 'active-war' | 'war-history' | 'cwl-history' | 'raid' | 'settings';

// --- FUNGSI UTAMA CLIENT ---
const ManageClanClient = ({ initialData, serverError, profile }: ManageClanClientProps) => {
    const router = useRouter();
    
    // State
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    const [isSyncing, setIsSyncing] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };
    
    const handleRefreshData = () => {
        router.refresh();
        showNotification('Memuat ulang data dari server...', 'info');
    };

    // --- TAMPILAN ERROR / AKSES DITOLAK ---
    if (serverError) {
        return (
            <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
                <Notification notification={notification ?? undefined} />
                <div className="flex justify-center items-center">
                    <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
                        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4"/>
                        <h2 className="text-2xl text-coc-red font-clash mb-4">Akses Ditolak</h2>
                        <p className="text-gray-300 mb-6 font-sans">
                            {serverError}
                        </p>
                        <Button href="/profile" variant="primary">
                            Kembali ke Profil
                        </Button>
                    </div>
                </div>
            </main>
        );
    }
        
    // Data dari Server Component
    const data = initialData!;
    const clan = data.clan; 
    const cache = data.cache;
    
    // --- FUNGSI SINKRONISASI MANUAL ---
    const handleSyncManual = async () => {
        setIsSyncing(true);
        showNotification(`Memulai sinkronisasi klan ${clan.name}. Harap tunggu...`, 'info');
        
        try {
            const response = await fetch(`/api/coc/sync-managed-clan?clanId=${clan.id}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Request-UID': data.profile.uid, 
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Sinkronisasi gagal. Cek API Key atau status klan.'); 
            }

            showNotification(`Sinkronisasi berhasil! Anggota disinkronkan: ${result.memberCount}`, 'success');
            router.refresh(); 

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat memanggil API sinkronisasi.";
            showNotification(errorMessage, 'error');
        } finally {
            setIsSyncing(false);
        }
    };
    
    // Utility: Tombol untuk Tab
    const TabButton: React.FC<{ tabName: ActiveTab, icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => (
        <Button
            variant={activeTab === tabName ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tabName)}
            size="sm"
            className="w-full justify-start md:w-auto md:min-w-[150px]" // Responsif
        >
            {icon}
            <span className="ml-2">{label}</span>
        </Button>
    );
    
    // Render Konten Tab Sesuai Pilihan
    const renderContent = () => {
        switch (activeTab) {
            case 'summary':
                return (
                    <SummaryTabContent
                        clan={clan}
                        cache={cache}
                        isSyncing={isSyncing}
                        onSync={handleSyncManual}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'members':
                return (
                    <MemberTabContent
                        clan={clan}
                        cache={cache}
                        members={data.members}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'requests':
                return (
                    <RequestTabContent
                        clan={clan}
                        joinRequests={data.joinRequests}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'active-war': 
                return (
                    <ActiveWarTabContent 
                        clan={clan}
                        currentWar={cache?.currentWar}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'war-history': 
                return (
                    <WarHistoryTabContent
                        clanId={clan.id}
                        clanTag={clan.tag}
                        onRefresh={handleRefreshData} 
                        // Note: Data war archives diambil client-side di dalam komponen ini
                    />
                );
            case 'cwl-history': 
                return (
                    <CwlHistoryTabContent
                        clanId={clan.id}
                        initialCwlArchives={data.cwlArchives || []} 
                        // Note: Komponen ini menerima data awal dari server
                    />
                );
            case 'raid': // BARU: KASUS RAID
                return (
                     <RaidTabContent
                        clan={clan}
                        initialCurrentRaid={cache?.currentRaid} // Ambil raid terbaru dari cache
                        initialRaidArchives={data.raidArchives || []} // Ambil riwayat raid dari props data
                        onRefresh={handleRefreshData} 
                     />
                );
            case 'settings':
                return (
                    <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                        <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                        <p className="text-lg font-clash text-white">Pengaturan Klan</p>
                        <p className="text-sm text-gray-400 font-sans mt-1">Implementasi pengaturan rekrutmen dan transfer kepemilikan akan hadir di Fase 4.</p>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} />

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Klan */}
                <ClanManagementHeader 
                    clan={clan} 
                    profile={data.profile} 
                    cache={cache} 
                />

                {/* Navigasi Tab */}
                <div className="flex flex-wrap gap-3 border-b border-coc-gold-dark/30 pb-4">
                    <TabButton tabName="summary" icon={<InfoIcon className="h-5 w-5"/>} label="Ringkasan & Sinkronisasi" />
                    <TabButton tabName="members" icon={<UserIcon className="h-5 w-5"/>} label={`Anggota (${data.members.length})`} />
                    <TabButton tabName="active-war" icon={<SwordsIcon className="h-5 w-5 text-coc-red"/>} label="Perang Aktif" /> 
                    <TabButton tabName="war-history" icon={<BookOpenIcon className="h-5 w-5"/>} label="Riwayat War Klasik" /> 
                    <TabButton tabName="cwl-history" icon={<CalendarCheck2Icon className="h-5 w-5 text-blue-400"/>} label="Riwayat CWL" /> 
                    <TabButton tabName="raid" icon={<CoinsIcon className="h-5 w-5 text-yellow-400"/>} label="Ibu Kota Klan" /> {/* TOMBOL BARU RAID */}
                    <TabButton tabName="requests" icon={<MailOpenIcon className="h-5 w-5"/>} label={`Permintaan Gabung (${data.joinRequests.length})`} />
                    <TabButton tabName="settings" icon={<SettingsIcon className="h-5 w-5"/>} label="Pengaturan Klan" />
                </div>
                
                {/* Konten Tab */}
                <section className="card-stone p-6 min-h-[50vh] rounded-lg">
                    {renderContent()}
                </section>
                
            </div>
        </main>
    );
};

export default ManageClanClient;

