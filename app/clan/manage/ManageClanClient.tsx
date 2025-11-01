'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, ClanRole, CocWarLog, CwlArchive, RaidArchive, ManagerRole, StandardMemberRole, WarSummary } from '@/lib/types'; // Mengimpor tipe baru
// Import Ikon
import {
    UserCircleIcon, ShieldIcon, AlertTriangleIcon, CogsIcon, ClockIcon, InfoIcon,
    TrophyIcon, UserIcon, XIcon, GlobeIcon,
    RefreshCwIcon, ArrowRightIcon, MailOpenIcon, ThumbsUpIcon, ThumbsDownIcon,
    TrashIcon, SettingsIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, SwordsIcon, BookOpenIcon,
    CalendarCheck2Icon, CoinsIcon, MenuIcon
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
import RaidTabContent from './components/RaidTabContent';

interface ManageClanClientProps {
    initialData: ClanManagementProps | null; // Data lengkap dari Server Component
    serverError: string | null;
    profile: UserProfile | null; // Profile pengguna yang sedang login
}

type ActiveTab = 'summary' | 'members' | 'requests' | 'active-war' | 'war-history' | 'cwl-history' | 'raid' | 'settings';

// --- DAFTAR TAB ---

// Tab yang tersedia untuk SEMUA anggota terverifikasi
const MEMBER_TABS: { tabName: ActiveTab, icon: React.ReactNode, label: string }[] = [
    { tabName: 'summary', icon: <InfoIcon/>, label: "Ringkasan & Sinkronisasi" },
    { tabName: 'members', icon: <UserIcon/>, label: "Anggota" },
    { tabName: 'active-war', icon: <SwordsIcon className="text-coc-red"/>, label: "Perang Aktif" },
    { tabName: 'war-history', icon: <BookOpenIcon/>, label: "Riwayat War Klasik" },
    { tabName: 'cwl-history', icon: <CalendarCheck2Icon className="text-blue-400"/>, label: "Riwayat CWL" },
    { tabName: 'raid', icon: <CoinsIcon className="text-yellow-400"/>, label: "Ibu Kota Klan" },
];

// Tab yang hanya untuk MANAGER (Leader/Co-Leader)
const MANAGER_TABS: { tabName: ActiveTab, icon: React.ReactNode, label: string }[] = [
    { tabName: 'requests', icon: <MailOpenIcon/>, label: "Permintaan Gabung" },
    { tabName: 'settings', icon: <SettingsIcon/>, label: "Pengaturan Klan" },
];
// --- AKHIR DAFTAR TAB ---


// --- FUNGSI UTAMA CLIENT ---
const ManageClanClient = ({ initialData, serverError, profile }: ManageClanClientProps) => {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
    const [isSyncing, setIsSyncing] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State untuk sidebar

    // --- PERBAIKAN: Cek Peran Pengguna ---
    // Gunakan peran dari UserProfile Clashub ('Leader', 'Co-Leader', 'Elder', 'Member', 'Free Agent')
    const isManager = profile?.role === 'Leader' || profile?.role === 'Co-Leader';

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

    // --- PERBAIKAN RUNTIME ERROR (PENYEBAB LOGOUT) ---
    // Kita harus mengaktifkan loading state ini.
    // Jika profile (dari AuthContext) atau initialData (dari server) belum siap,
    // kita harus berhenti di sini agar tidak terjadi crash 'cannot read properties of null'.
    if (!initialData || !profile) {
         // Tampilkan loading atau pesan error yang sesuai
         return (
             <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
                 <div className="flex justify-center items-center h-full flex-col">
                     <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-3" />
                     <p className="text-lg font-clash text-white">Memuat Data Pengguna...</p>
                     <p className="text-sm text-gray-400 font-sans mt-1">
                         Jika Anda terlempar, silakan login kembali.
                     </p>
                 </div>
             </main>
         );
    }
    // --- AKHIR PERBAIKAN RUNTIME ERROR ---

    // Data dari Server Component (sudah divalidasi tidak null)
    const data = initialData;
    const clan = data.clan;
    const cache = data.cache;

    // --- FUNGSI SINKRONISASI MANUAL ---
    const handleSyncManual = async () => {
        // --- PERBAIKAN: Hanya Manager yang bisa sync manual ---
        // Logika ini tetap dipertahankan karena ini mengontrol aksi API
        if (!isManager) {
            showNotification('Hanya Leader/Co-Leader yang dapat melakukan sinkronisasi manual.', 'warning');
            return;
        }

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

    // Utility: Tombol Menu Sidebar (Menggantikan TabButton) - Gaya disesuaikan
    const MenuButton: React.FC<{ tabName: ActiveTab, icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => {
        // Logika untuk anggota biasa yang mencoba mengakses tab Manager
        const isManagerTab = ['requests', 'settings'].includes(tabName);
        if (!isManager && isManagerTab) {
            return null; // Jangan render tombol jika bukan manager
        }
        
        // Menangani penentuan tab aktif. Jika anggota biasa ada di tab terlarang (misal dari URL), pindah ke 'summary'
        if (!isManager && isManagerTab && activeTab === tabName) {
            setActiveTab('summary');
        }
        
        // Ambil jumlah permintaan untuk badge (hanya relevan di tab requests)
        const requestsCount = tabName === 'requests' ? data.joinRequests.length : 0;
        const memberCount = tabName === 'members' ? data.members.length : 0;

        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 group relative ${
                    activeTab === tabName
                    ? 'bg-coc-dark/90 text-coc-gold font-semibold shadow-inner' // Gaya Aktif Baru
                    : 'text-gray-300 hover:bg-coc-dark/60 hover:text-white' // Gaya Default & Hover Baru
                }`}
            >
                {React.cloneElement(icon as React.ReactElement, {
                    className: `h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-150 ${
                        activeTab === tabName ? 'text-coc-gold' : 'text-gray-400 group-hover:text-gray-300' // Warna ikon
                    }`
                })}
                <span>{label}</span>
                {/* Badge Anggota/Permintaan */}
                {requestsCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-coc-red text-white">
                        {requestsCount}
                    </span>
                )}
                {memberCount > 0 && tabName === 'members' && (
                    <span className="ml-auto text-xs text-gray-400">({memberCount})</span>
                )}
            </button>
        );
    };


    // Render Konten Tab Sesuai Pilihan
    const renderContent = () => {
        // Jika anggota mencoba mengakses tab terlarang, tampilkan pesan akses ditolak.
        const forbiddenTabs: ActiveTab[] = ['requests', 'settings'];
        if (!isManager && forbiddenTabs.includes(activeTab)) {
             return (
                 <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                     <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                     <p className="text-xl font-clash text-coc-red">Akses Ditolak</p>
                     <p className="text-sm text-gray-400 font-sans mt-1">Hanya Leader atau Co-Leader yang dapat mengakses tab ini.</p>
                     <Button onClick={() => setActiveTab('summary')} variant="secondary" className="mt-4">
                         Kembali ke Ringkasan
                     </Button>
                 </div>
             );
        }
        
        switch (activeTab) {
            case 'summary':
                // Anggota biasa TIDAK bisa Sync Manual, tombol di komponen anak akan menjadi Refresh
                return (
                    <SummaryTabContent
                        clan={clan}
                        cache={cache}
                        isSyncing={isSyncing}
                        onSync={handleSyncManual} 
                        onRefresh={handleRefreshData}
                        isManager={isManager} 
                    />
                );
            case 'members':
                // isManager dikirim untuk mengontrol tampilan tombol Role Change/Kick
                return (
                    <MemberTabContent
                        clan={clan}
                        cache={cache}
                        members={data.members}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                        isManager={isManager} 
                    />
                );
            case 'requests':
                // Hanya diakses jika isManager (sudah difilter di luar switch)
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
                // --- PERBAIKAN TYPESCRIPT ERROR (TS2322) ---
                // Hapus prop 'currentWar' karena ActiveWarTabContent
                // sekarang mengambil data sendiri dari listener Firestore.
                return (
                    <ActiveWarTabContent
                        clan={clan}
                        // currentWar={cache?.currentWar} <-- DIHAPUS
                        onRefresh={handleRefreshData}
                    />
                );
                // --- AKHIR PERBAIKAN TS ---
            case 'war-history':
                return (
                    <WarHistoryTabContent
                        clanId={clan.id}
                        clanTag={clan.tag}
                        // FIXED: Hapus prop initialWarHistory karena komponen anak sudah mengambil data sendiri
                        onRefresh={handleRefreshData}
                    />
                );
            case 'cwl-history':
                return (
                    <CwlHistoryTabContent
                        clanId={clan.id}
                        initialCwlArchives={data.cwlArchives || []}
                    />
                );
            case 'raid':
                return (
                    <RaidTabContent
                        clan={clan}
                        initialCurrentRaid={cache?.currentRaid}
                        initialRaidArchives={data.raidArchives || []}
                        onRefresh={handleRefreshData}
                    />
                );
            case 'settings':
                // Hanya diakses jika isManager (sudah difilter di luar switch)
                return (
                    <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                        <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                        <p className="text-lg font-clash text-white">Pengaturan Klan</p>
                        <p className="text-sm text-gray-400 font-sans mt-1">Implementasi pengaturan rekrutmen dan transfer kepemilikan akan hadir di Fase 4.</p>
                    </div>
                );
            default:
                setActiveTab('summary');
                return null;
        }
    };
    
    // Gabungkan daftar tab berdasarkan peran
    const visibleTabs = isManager 
        ? [...MEMBER_TABS, ...MANAGER_TABS] 
        : MEMBER_TABS;

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <Notification notification={notification ?? undefined} />

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Klan (Tetap di Atas) */}
                <ClanManagementHeader
                    clan={clan}
                    profile={data.profile}
                    cache={cache}
                />

                {/* Tombol Toggle Sidebar (untuk mobile/tablet) */}
                <div className="lg:hidden mb-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center"
                    >
                        {isSidebarOpen ? <XIcon className="h-5 w-5 mr-2" /> : <MenuIcon className="h-5 w-5 mr-2" />}
                        {isSidebarOpen ? 'Tutup Menu' : 'Buka Menu'}
                    </Button>
                </div>

                {/* Layout Utama: Sidebar + Konten */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Navigasi - Gaya disesuaikan */}
                    <nav className={`lg:w-64 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden'} lg:block transition-all duration-300 ease-in-out`}>
                        {/* Ganti gaya background dan border */}
                        <div className="space-y-2 sticky top-20 bg-coc-dark/70 p-4 rounded-lg border border-coc-gold-dark/30 backdrop-blur-sm">
                            
                            {visibleTabs.map(tab => (
                                <MenuButton 
                                    key={tab.tabName} 
                                    tabName={tab.tabName} 
                                    icon={tab.icon} 
                                    label={tab.tabName === 'members' ? `Anggota (${data.members.length})` : 
                                           tab.tabName === 'requests' ? `Permintaan Gabung (${data.joinRequests.length})` : 
                                           tab.label} 
                                />
                            ))}

                        </div>
                    </nav>

                    {/* Konten Utama */}
                    <section className="flex-grow card-stone p-6 min-h-[70vh] rounded-lg">
                        {renderContent()}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default ManageClanClient;
