'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import {
  ManagedClan,
  UserProfile,
  // Tipe data besar (ClanApiCache, CocWarLog, dll.) DIHAPUS
} from '@/lib/types';
// Import Ikon
import {
  UserCircleIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CogsIcon,
  ClockIcon,
  InfoIcon,
  TrophyIcon,
  UserIcon,
  XIcon,
  GlobeIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  MailOpenIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  TrashIcon,
  SettingsIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SwordsIcon,
  BookOpenIcon,
  CalendarCheck2Icon,
  CoinsIcon,
  MenuIcon,
} from '@/app/components/icons';
// Import Komponen UI
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
// Import Tipe Props Server
// (Kita akan ubah Tipe 'ClanManagementProps' di page.tsx nanti)
// import { ClanManagementProps } from '@/app/clan/manage/page';
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
  // --- REFAKTOR PROPS ---
  // Hapus 'initialData'. Kita hanya butuh data 'ManagedClan' dan 'profile'
  // 'page.tsx' (Server Component) akan diubah nanti agar hanya mengirim ini.
  clan: ManagedClan | null;
  profile: UserProfile | null;
  // --- AKHIR REFAKTOR PROPS ---
  serverError: string | null;
}

type ActiveTab =
  | 'summary'
  | 'members'
  | 'requests'
  | 'active-war'
  | 'war-history'
  | 'cwl-history'
  | 'raid'
  | 'settings';

// --- DAFTAR TAB ---

// Tab yang tersedia untuk SEMUA anggota terverifikasi
const MEMBER_TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] =
  [
    { tabName: 'summary', icon: <InfoIcon />, label: 'Ringkasan & Sinkronisasi' },
    { tabName: 'members', icon: <UserIcon />, label: 'Anggota' },
    {
      tabName: 'active-war',
      icon: <SwordsIcon className="text-coc-red" />,
      label: 'Perang Aktif',
    },
    {
      tabName: 'war-history',
      icon: <BookOpenIcon />,
      label: 'Riwayat War Klasik',
    },
    {
      tabName: 'cwl-history',
      icon: <CalendarCheck2Icon className="text-blue-400" />,
      label: 'Riwayat CWL',
    },
    {
      tabName: 'raid',
      icon: <CoinsIcon className="text-yellow-400" />,
      label: 'Ibu Kota Klan',
    },
  ];

// Tab yang hanya untuk MANAGER (Leader/Co-Leader)
const MANAGER_TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] =
  [
    { tabName: 'requests', icon: <MailOpenIcon />, label: 'Permintaan Gabung' },
    { tabName: 'settings', icon: <SettingsIcon />, label: 'Pengaturan Klan' },
  ];
// --- AKHIR DAFTAR TAB ---

// --- FUNGSI UTAMA CLIENT ---
const ManageClanClient = ({
  clan, // Props sudah diubah
  serverError,
  profile, // Props sudah diubah
}: ManageClanClientProps) => {
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  // HAPUS: isSyncing tidak lagi dikelola di sini
  // const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Cek Peran Pengguna
  const isManager = profile?.role === 'Leader' || profile?.role === 'Co-Leader';

  const showNotification = (
    message: string,
    type: NotificationProps['type']
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // HAPUS: Fungsi handleRefreshData.
  // Refresh/Mutate akan ditangani oleh SWR hooks di dalam komponen anak.

  // HAPUS: Fungsi handleSyncManual.
  // Logika sinkronisasi akan pindah ke 'SummaryTabContent'

  // --- TAMPILAN ERROR / AKSES DITOLAK ---
  if (serverError) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <Notification notification={notification ?? undefined} />
        <div className="flex justify-center items-center">
          <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
            <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
            <h2 className="text-2xl text-coc-red font-clash mb-4">
              Akses Ditolak
            </h2>
            <p className="text-gray-300 mb-6 font-sans">{serverError}</p>
            <Button href="/profile" variant="primary">
              Kembali ke Profil
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // --- PERBAIKAN RUNTIME ERROR (PENYEBAB LOGOUT) ---
  // Ubah 'initialData' menjadi 'clan'
  if (!clan || !profile) {
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

  // HAPUS: const data = initialData;
  // HAPUS: const cache = data.cache;
  // 'clan' dan 'profile' sekarang didapat langsung dari props.

  // Utility: Tombol Menu Sidebar (Menggantikan TabButton) - Gaya disesuaikan
  const MenuButton: React.FC<{
    tabName: ActiveTab;
    icon: React.ReactNode;
    label: string;
  }> = ({ tabName, icon, label }) => {
    // Logika untuk anggota biasa yang mencoba mengakses tab Manager
    const isManagerTab = ['requests', 'settings'].includes(tabName);
    if (!isManager && isManagerTab) {
      return null; // Jangan render tombol jika bukan manager
    }

    // Menangani penentuan tab aktif.
    if (!isManager && isManagerTab && activeTab === tabName) {
      setActiveTab('summary');
    }

    // HAPUS: Logika 'requestsCount' dan 'memberCount'.
    // Data ini tidak lagi tersedia di komponen parent ini.

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
            activeTab === tabName
              ? 'text-coc-gold'
              : 'text-gray-400 group-hover:text-gray-300' // Warna ikon
          }`,
        })}
        <span>{label}</span>
        {/* HAPUS: Badge Anggota/Permintaan */}
      </button>
    );
  };

  // Render Konten Tab Sesuai Pilihan
  const renderContent = () => {
    // Filter akses tab manager
    const forbiddenTabs: ActiveTab[] = ['requests', 'settings'];
    if (!isManager && forbiddenTabs.includes(activeTab)) {
      return (
        <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
          <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
          <p className="text-xl font-clash text-coc-red">Akses Ditolak</p>
          <p className="text-sm text-gray-400 font-sans mt-1">
            Hanya Leader atau Co-Leader yang dapat mengakses tab ini.
          </p>
          <Button
            onClick={() => setActiveTab('summary')}
            variant="secondary"
            className="mt-4"
          >
            Kembali ke Ringkasan
          </Button>
        </div>
      );
    }

    // --- REFAKTOR PROPS UNTUK SEMUA KOMPONEN ANAK ---
    // Kita hanya passing 'clan' (ManagedClan) atau 'clan.id' dan 'profile'.
    // Komponen anak akan memanggil SWR hooks mereka sendiri.
    switch (activeTab) {
      case 'summary':
        return (
          <SummaryTabContent
            clan={clan}
            isManager={isManager}
            onAction={showNotification}
            // Hapus: cache, isSyncing, onSync, onRefresh
          />
        );
      case 'members':
        return (
          <MemberTabContent
            clan={clan}
            userProfile={profile} // Pass profile langsung
            onAction={showNotification}
            isManager={isManager}
            // Hapus: cache, members, onRefresh
          />
        );
      case 'requests':
        return (
          <RequestTabContent
            clan={clan}
            userProfile={profile} // Pass profile langsung
            onAction={showNotification}
            // Hapus: joinRequests, onRefresh
          />
        );
      case 'active-war':
        return (
          <ActiveWarTabContent
            clan={clan}
            // Hapus: currentWar, onRefresh
          />
        );
      case 'war-history':
        return (
          <WarHistoryTabContent
            clan={clan} // PERBAIKAN: Ganti clanId dan clanTag
            // Hapus: onRefresh
          />
        );
      case 'cwl-history':
        return (
          <CwlHistoryTabContent
            clan={clan} // PERBAIKAN: Ganti clanId
            // Hapus: initialCwlArchives
          />
        );
      case 'raid':
        return (
          <RaidTabContent
            clan={clan}
            // Hapus: initialCurrentRaid, initialRaidArchives, onRefresh
          />
        );
      case 'settings':
        // (Tidak berubah, ini adalah placeholder)
        return (
          <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
            <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
            <p className="text-lg font-clash text-white">Pengaturan Klan</p>
            <p className="text-sm text-gray-400 font-sans mt-1">
              Implementasi pengaturan rekrutmen dan transfer kepemilikan akan
              hadir di Fase 4.
            </p>
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
        {/* REFAKTOR: Hapus prop 'cache'. Ini akan error, dan akan kita perbaiki selanjutnya. */}
        <ClanManagementHeader
          clan={clan}
          profile={profile}
          // Hapus: cache={cache}
        />

        {/* Tombol Toggle Sidebar (untuk mobile/tablet) */}
        <div className="lg:hidden mb-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center"
          >
            {isSidebarOpen ? (
              <XIcon className="h-5 w-5 mr-2" />
            ) : (
              <MenuIcon className="h-5 w-5 mr-2" />
            )}
            {isSidebarOpen ? 'Tutup Menu' : 'Buka Menu'}
          </Button>
        </div>

        {/* Layout Utama: Sidebar + Konten */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigasi - Gaya disesuaikan */}
          <nav
            className={`lg:w-64 flex-shrink-0 ${
              isSidebarOpen ? 'block' : 'hidden'
            } lg:block transition-all duration-300 ease-in-out`}
          >
            <div className="space-y-2 sticky top-20 bg-coc-dark/70 p-4 rounded-lg border border-coc-gold-dark/30 backdrop-blur-sm">
              {visibleTabs.map((tab) => (
                <MenuButton
                  key={tab.tabName}
                  tabName={tab.tabName}
                  icon={tab.icon}
                  // REFAKTOR: Gunakan label statis, hapus hitungan
                  label={tab.label}
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

