import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// FIX 1: Import ClanRole dari lib/types
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, ClanRole, CocWarLog, CwlArchive } from '@/lib/types';
import { 
    UserCircleIcon, ShieldIcon, AlertTriangleIcon, CogsIcon, ClockIcon, InfoIcon, 
    TrophyIcon, UserIcon, XIcon, GlobeIcon, 
    RefreshCwIcon, ArrowRightIcon, MailOpenIcon, ThumbsUpIcon, ThumbsDownIcon, 
    TrashIcon, SettingsIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, SwordsIcon, BookOpenIcon,
    CalendarCheck2Icon // Import icon baru untuk CWL
} from '@/app/components/icons'; 
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { ClanManagementProps } from '@/app/clan/manage/page'; 
// --- Komponen yang Diimpor Setelah Refactoring ---
import ClanManagementHeader from './components/ClanManagementHeader';
import SummaryTabContent from './components/SummaryTabContent';
import MemberTabContent from './components/MemberTabContent'; 
import RequestTabContent from './components/RequestTabContent'; 
// FASE 2 & 3: Komponen Baru
import ActiveWarTabContent from './components/ActiveWarTabContent'; 
import WarHistoryTabContent from './components/WarHistoryTabContent'; 
import CwlHistoryTabContent from './components/CwlHistoryTabContent'; // BARU: Komponen Riwayat CWL

interface ManageClanClientProps {
    initialData: ClanManagementProps | null; // Data lengkap dari Server Component
    serverError: string | null;
    profile: UserProfile | null;
}

// PERBAIKAN: Menambahkan 'cwl-history' (Fase 3)
type ActiveTab = 'summary' | 'members' | 'requests' | 'active-war' | 'war-history' | 'cwl-history' | 'settings';

// --- FUNGSI UTAMA CLIENT ---

/**
 * @component ManageClanClient
 * Menangani tampilan manajemen klan (Leader/Co-Leader yang terverifikasi).
 * Menyediakan tombol sinkronisasi manual dan tampilan multi-tab.
 */
const ManageClanClient = ({ initialData, serverError, profile }: ManageClanClientProps) => {
    const router = useRouter();
    
    // State untuk tab aktif dan sinkronisasi
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    const [isSyncing, setIsSyncing] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };
    
    // Fungsi refresh untuk Client Component (memuat ulang Server Component)
    const handleRefreshData = () => {
        router.refresh();
        showNotification('Memuat ulang data dari server...', 'info');
    };

    // --- TAMPILAN ERROR / AKSES DITOLAK ---
    if (serverError) {
        // ... (Kode error tetap sama) ...
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
        
    // Asumsi: Jika tidak ada serverError, initialData dijamin ada oleh Server Component
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

            // Setelah sukses, kita refresh router untuk memuat data terbaru dari Server Component
            showNotification(`Sinkronisasi berhasil! Anggota disinkronkan: ${result.memberCount}`, 'success');
            router.refresh(); 

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat memanggil API sinkronisasi.";
            showNotification(errorMessage, 'error');
        } finally {
            setIsSyncing(false);
        }
    };
    // --- END FUNGSI SINKRONISASI MANUAL ---
    
    // Utility: Tombol untuk Tab
    const TabButton: React.FC<{ tabName: ActiveTab, icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => (
        <Button
            variant={activeTab === tabName ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tabName)}
            size="sm"
            className="w-full justify-start md:w-auto md:min-w-[150px]"
        >
            {icon}
            <span className="ml-2">{label}</span>
        </Button>
    );
    
    // Komponen Konten Tab
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
            case 'war-history': // KASUS WAR CLASSIC HISTORY
                return (
                    <WarHistoryTabContent
                        clanId={clan.id}
                        clanTag={clan.tag}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'cwl-history': // BARU: KASUS CWL HISTORY
                return (
                    <CwlHistoryTabContent
                        clanId={clan.id}
                        initialCwlArchives={data.cwlArchives || []} // Sediakan data CWL Archives dari props data
                    />
                );
            case 'settings':
                return (
                    <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                        <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                        <p className="text-lg font-clash text-white">Pengaturan Klan</p>
                        <p className="text-sm text-gray-400 font-sans mt-1">Implementasi pengaturan rekrutmen dan transfer kepemilikan akan hadir di Fase 3.</p>
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
                    profile={data.profile} // PERBAIKAN: Ganti userProfile menjadi profile
                    cache={cache} 
                />

                {/* Navigasi Tab */}
                <div className="flex flex-wrap gap-3 border-b border-coc-gold-dark/30 pb-4">
                    <TabButton tabName="summary" icon={<InfoIcon className="h-5 w-5"/>} label="Ringkasan & Sinkronisasi" />
                    <TabButton tabName="members" icon={<UserIcon className="h-5 w-5"/>} label={`Anggota (${data.members.length})`} />
                    <TabButton tabName="active-war" icon={<SwordsIcon className="h-5 w-5 text-coc-red"/>} label="Perang Aktif" /> 
                    <TabButton tabName="war-history" icon={<BookOpenIcon className="h-5 w-5"/>} label="Riwayat War Klasik" /> 
                    <TabButton tabName="cwl-history" icon={<CalendarCheck2Icon className="h-5 w-5 text-blue-400"/>} label="Riwayat CWL" /> {/* TOMBOL BARU CWL */}
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
