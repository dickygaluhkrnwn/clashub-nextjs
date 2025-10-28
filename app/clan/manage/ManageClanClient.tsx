'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import { ManagedClan, ClanApiCache, UserProfile, JoinRequest, ClanRole, CocWarLog, CwlArchive, RaidArchive } from '@/lib/types';
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

    // --- Kondisi jika initialData null (seharusnya tidak terjadi jika serverError null) ---
    if (!initialData || !profile) {
         // Tampilkan loading atau pesan error yang sesuai
         return (
             <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
                 <div className="flex justify-center items-center">
                    <p>Memuat data klan...</p> {/* Atau komponen loading */}
                 </div>
             </main>
         );
    }

    // Data dari Server Component (sudah divalidasi tidak null)
    const data = initialData;
    const clan = data.clan;
    const cache = data.cache;

    // --- FUNGSI SINKRONISASI MANUAL ---
    const handleSyncManual = async () => {
        // --- PERBAIKAN: Hanya Manager yang bisa sync manual ---
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
    const MenuButton: React.FC<{ tabName: ActiveTab, icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 group ${
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
        </button>
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
                        onSync={handleSyncManual} // Fungsi sync sudah ada pengecekan peran
                        onRefresh={handleRefreshData}
                        isManager={isManager} // Kirim status manager ke komponen anak jika diperlukan
                    />
                );
            case 'members':
                return (
                    <MemberTabContent
                        clan={clan}
                        cache={cache}
                        members={data.members}
                        userProfile={data.profile} // Kirim profile pengguna saat ini
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                        isManager={isManager} // Kirim status manager
                    />
                );
            // --- PERBAIKAN: Hanya tampilkan jika Manager ---
            case 'requests':
                 return isManager ? (
                    <RequestTabContent
                        clan={clan}
                        joinRequests={data.joinRequests}
                        userProfile={data.profile}
                        onAction={showNotification}
                        onRefresh={handleRefreshData}
                    />
                 ) : null; // Atau tampilkan pesan akses ditolak jika perlu
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
            case 'raid':
                return (
                     <RaidTabContent
                         clan={clan}
                         initialCurrentRaid={cache?.currentRaid} // Ambil raid terbaru dari cache
                         initialRaidArchives={data.raidArchives || []} // Ambil riwayat raid dari props data
                         onRefresh={handleRefreshData}
                     />
                );
            // --- PERBAIKAN: Hanya tampilkan jika Manager ---
            case 'settings':
                 return isManager ? (
                    <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                        <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
                        <p className="text-lg font-clash text-white">Pengaturan Klan</p>
                        <p className="text-sm text-gray-400 font-sans mt-1">Implementasi pengaturan rekrutmen dan transfer kepemilikan akan hadir di Fase 4.</p>
                    </div>
                 ) : null; // Atau tampilkan pesan akses ditolak
            default:
                 // --- PERBAIKAN: Default ke Summary jika tab tidak valid ---
                 setActiveTab('summary'); // Set tab kembali ke summary
                 return null; // Jangan render apa-apa sementara
        }
    };

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
                            {/* --- MENU YANG SELALU ADA --- */}
                            <MenuButton tabName="summary" icon={<InfoIcon/>} label="Ringkasan & Sinkronisasi" />
                            <MenuButton tabName="members" icon={<UserIcon/>} label={`Anggota (${data.members.length})`} />
                            <MenuButton tabName="active-war" icon={<SwordsIcon className="text-coc-red"/>} label="Perang Aktif" />
                            <MenuButton tabName="war-history" icon={<BookOpenIcon/>} label="Riwayat War Klasik" />
                            <MenuButton tabName="cwl-history" icon={<CalendarCheck2Icon className="text-blue-400"/>} label="Riwayat CWL" />
                            <MenuButton tabName="raid" icon={<CoinsIcon className="text-yellow-400"/>} label="Ibu Kota Klan" />

                            {/* --- MENU KHUSUS MANAGER --- */}
                            {isManager && (
                                <>
                                    <MenuButton tabName="requests" icon={<MailOpenIcon/>} label={`Permintaan Gabung (${data.joinRequests.length})`} />
                                    <MenuButton tabName="settings" icon={<SettingsIcon/>} label="Pengaturan Klan" />
                                </>
                            )}
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

