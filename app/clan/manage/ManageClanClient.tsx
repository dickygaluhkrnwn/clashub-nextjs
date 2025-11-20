'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import { ManagedClan, UserProfile } from '@/lib/clashub.types';
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
  LogOutIcon,
  IconSparkle, 
} from '@/app/components/icons';
// Import Komponen UI
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
// --- Komponen Tab Konten ---
import ClanManagementHeader from './components/ClanManagementHeader';
import SummaryTabContent from './components/SummaryTabContent';
import MemberTabContent from './components/MemberTabContent';
import RequestTabContent from './components/RequestTabContent';
import ActiveWarTabContent from './components/ActiveWarTabContent';
import WarHistoryTabContent from './components/WarHistoryTabContent';
import CwlHistoryTabContent from './components/CwlHistoryTabContent';
import RaidTabContent from './components/RaidTabContent';
import EsportsTabContent from './components/EsportsTabContent';
import PromotionTabContent from './components/PromotionTabContent';
import GeminiAssistantModal from './components/GeminiAssistantTab';
// [BARU] Import useLanguage
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ManageClanClientProps {
  clan: ManagedClan | null;
  profile: UserProfile | null;
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
  | 'esports' 
  | 'promotion' 
  | 'settings';

// --- FUNGSI UTAMA CLIENT ---
const ManageClanClient = ({
  clan,
  serverError,
  profile,
}: ManageClanClientProps) => {
  const { t } = useLanguage(); // [BARU] Init Hook
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false); 
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Cek Peran Pengguna
  const isManager = profile?.role === 'Leader' || profile?.role === 'Co-Leader';

  // [BARU] DAFTAR TAB DINAMIS (Di dalam komponen agar akses 't')
  const MEMBER_TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] =
    [
      { tabName: 'summary', icon: <InfoIcon />, label: t.clanManage.tabSummary },
      { tabName: 'members', icon: <UserIcon />, label: t.clanManage.tabMembers },
      {
        tabName: 'active-war',
        icon: <SwordsIcon className="text-coc-red" />,
        label: t.clanManage.tabActiveWar,
      },
      {
        tabName: 'war-history',
        icon: <BookOpenIcon />,
        label: t.clanManage.tabWarHistory,
      },
      {
        tabName: 'cwl-history',
        icon: <CalendarCheck2Icon className="text-blue-400" />,
        label: t.clanManage.tabCwlHistory,
      },
      {
        tabName: 'raid',
        icon: <CoinsIcon className="text-yellow-400" />,
        label: t.clanManage.tabRaid,
      },
      {
        tabName: 'esports',
        icon: <TrophyIcon />,
        label: t.clanManage.tabEsports,
      },
    ];

  const MANAGER_TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] =
    [
      { tabName: 'requests', icon: <MailOpenIcon />, label: t.clanManage.tabRequests },
      { tabName: 'promotion', icon: <GlobeIcon />, label: t.clanManage.tabPromotion },
      { tabName: 'settings', icon: <SettingsIcon />, label: t.clanManage.tabSettings },
    ];

  const showNotification = (
    message: string,
    type: NotificationProps['type'],
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // Handler untuk Keluar Klan
  const handleConfirmLeave = async () => {
    if (!clan || !profile || profile.role === 'Leader') {
      showNotification(
        t.clanManage.leaderLeaveError, // [TERJEMAHAN]
        'error',
      );
      return;
    }

    setIsLeaving(true);
    showNotification(t.clanManage.processing, 'info'); // [TERJEMAHAN]

    try {
      const response = await fetch(`/api/clan/manage/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || t.clanManage.leaveError);
      }

      showNotification(t.clanManage.leaveSuccess, 'success'); // [TERJEMAHAN]
      setIsLeaveModalOpen(false);
      router.push('/profile');
    } catch (err) {
      showNotification((err as Error).message, 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  // --- TAMPILAN ERROR / AKSES DITOLAK ---
  if (serverError) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <Notification notification={notification ?? undefined} />
        <div className="flex justify-center items-center">
          <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
            <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
            <h2 className="text-2xl text-coc-red font-clash mb-4">
              {t.clanManage.accessDenied} {/* [TERJEMAHAN] */}
            </h2>
            <p className="text-gray-300 mb-6 font-sans">
               {/* Jika error dari server spesifik, tampilkan, jika tidak gunakan generic */}
               {/* Kita bisa combine: t.clanManage.accessDeniedDesc + " (" + serverError + ")" */}
               {serverError} 
            </p>
            <Button href="/profile" variant="primary">
              {t.clanManage.backToProfile} {/* [TERJEMAHAN] */}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // --- PERBAIKAN RUNTIME ERROR (PENYEBAB LOGOUT) ---
  if (!clan || !profile) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <div className="flex justify-center items-center h-full flex-col">
          <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-3" />
          <p className="text-lg font-clash text-white">{t.clanManage.loadingUserData}</p> {/* [TERJEMAHAN] */}
          <p className="text-sm text-gray-400 font-sans mt-1">
            {t.clanManage.reloginNote} {/* [TERJEMAHAN] */}
          </p>
        </div>
      </main>
    );
  }

  // Utility: Tombol Menu Sidebar
  const MenuButton: React.FC<{
    tabName: ActiveTab;
    icon: React.ReactNode;
    label: string;
  }> = ({ tabName, icon, label }) => {
    const isManagerTab = [
      'requests',
      'settings',
      'promotion',
    ].includes(tabName);
    if (!isManager && isManagerTab) {
      return null;
    }

    if (!isManager && isManagerTab && activeTab === tabName) {
      setActiveTab('summary');
    }

    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 group relative ${
          activeTab === tabName
            ? 'bg-coc-dark/90 text-coc-gold font-semibold shadow-inner'
            : 'text-gray-300 hover:bg-coc-dark/60 hover:text-white'
        }`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-150 ${
            activeTab === tabName
              ? 'text-coc-gold'
              : 'text-gray-400 group-hover:text-gray-300'
          }`,
        })}
        <span>{label}</span>
      </button>
    );
  };

  // Render Konten Tab Sesuai Pilihan
  const renderContent = () => {
    const forbiddenTabs: ActiveTab[] = [
      'requests',
      'settings',
      'promotion',
    ];
    if (!isManager && forbiddenTabs.includes(activeTab)) {
      return (
        <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
          <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
          <p className="text-xl font-clash text-coc-red">{t.clanManage.tabAccessDenied}</p>
          <p className="text-sm text-gray-400 font-sans mt-1">
            {t.clanManage.tabAccessDeniedDesc}
          </p>
          <Button
            onClick={() => setActiveTab('summary')}
            variant="secondary"
            className="mt-4"
          >
            {t.clanManage.backToSummary}
          </Button>
        </div>
      );
    }

    // Komponen anak akan memanggil SWR hooks mereka sendiri.
    switch (activeTab) {
      case 'summary':
        return (
          <SummaryTabContent
            clan={clan}
            isManager={isManager}
            onAction={showNotification}
          />
        );
      case 'members':
        return (
          <MemberTabContent
            clan={clan}
            userProfile={profile} 
            onAction={showNotification}
            isManager={isManager}
          />
        );
      case 'requests':
        return (
          <RequestTabContent
            clan={clan}
            userProfile={profile}
            onAction={showNotification}
          />
        );
      case 'active-war':
        return <ActiveWarTabContent clan={clan} />;
      case 'war-history':
        return <WarHistoryTabContent clan={clan} />;
      case 'cwl-history':
        return <CwlHistoryTabContent clan={clan} />;
      case 'raid':
        return <RaidTabContent clan={clan} />;
      case 'esports':
        return <EsportsTabContent clan={clan} onAction={showNotification} />;
      case 'promotion':
        return <PromotionTabContent clan={clan} onAction={showNotification} />;
      case 'settings':
        return (
          <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
            <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
            <p className="text-lg font-clash text-white">{t.clanManage.settingsTitle}</p>
            <p className="text-sm text-gray-400 font-sans mt-1">
              {t.clanManage.settingsDesc}
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

      <div className="space-y-8">
        {/* Header Klan (Tetap di Atas) */}
        {/* NOTE: ClanManagementHeader juga harus diupdate nanti */}
        <ClanManagementHeader clan={clan} profile={profile} />

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
            {isSidebarOpen ? t.clanManage.closeMenu : t.clanManage.openMenu}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigasi */}
          <nav
            className={`lg:w-56 flex-shrink-0 ${
              isSidebarOpen ? 'block' : 'hidden'
            } lg:block transition-all duration-300 ease-in-out`}
          >
            <div className="space-y-2 sticky top-20 bg-coc-dark/70 p-4 rounded-lg border border-coc-gold-dark/30 backdrop-blur-sm">
              {visibleTabs.map((tab) => (
                <MenuButton
                  key={tab.tabName}
                  tabName={tab.tabName}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}

              {/* Link Profil Klan */}
              <div className="pt-2 my-2 border-t border-coc-gold-dark/30"></div>
              <Button
                href={`/clan/internal/${clan.id}`}
                variant="ghost" 
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 group text-gray-300 hover:bg-coc-dark/60 hover:text-white"
              >
                <UserCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-gray-300" />
                <span>{t.clanManage.viewClanProfile}</span>
              </Button>

              {/* Tombol Keluar Klan */}
              {profile.role !== 'Leader' && (
                <>
                  <div className="pt-2 my-2 border-t border-coc-gold-dark/30"></div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsLeaveModalOpen(true)} 
                    className="w-full flex items-center justify-start px-4 text-sm font-medium"
                  >
                    <LogOutIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{t.clanManage.leaveClan}</span>
                  </Button>
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

      {/* Modal Konfirmasi Keluar */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-xl card-stone shadow-xl border-2 border-coc-red/50">
            {/* Tombol Close Modal */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setIsLeaveModalOpen(false)}
              disabled={isLeaving}
            >
              <XIcon className="h-5 w-5" />
            </Button>

            <div className="flex flex-col items-center p-6 pt-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coc-red/20 border-2 border-coc-red">
                <AlertTriangleIcon
                  className="h-10 w-10 text-coc-red"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-clash text-white">{t.clanManage.leaveTitle}</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    {t.clanManage.leaveConfirm}{' '}
                    <strong className="font-bold text-white">
                      {clan.name}
                    </strong>{' '}
                    ?
                  </p>
                  <p className="mt-3 text-base font-bold text-coc-yellow/80">
                    {t.clanManage.leaveImportant}
                  </p>
                  <p className="text-sm text-gray-300 bg-coc-stone-dark/30 p-3 rounded-md">
                    {t.clanManage.leaveNote}
                  </p>
                </div>
              </div>
            </div>
            {/* Tombol Aksi Modal */}
            <div className="flex justify-between gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={isLeaving}
              >
                {t.clanManage.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOutIcon className="h-4 w-4 mr-2" />
                )}
                {isLeaving ? t.clanManage.processing : t.clanManage.confirmLeave}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tombol Floating & Modal AI */}
      {isManager && (
        <Button
          variant="primary"
          size="lg" 
          className="fixed z-40 bottom-6 right-6 rounded-full shadow-lg p-4 h-16 w-16" 
          onClick={() => setIsAiModalOpen(true)}
          aria-label="Buka Asisten AI"
        >
          <IconSparkle className="h-8 w-8" />
        </Button>
      )}

      <GeminiAssistantModal
        clanId={clan.id}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </main>
  );
};

export default ManageClanClient;