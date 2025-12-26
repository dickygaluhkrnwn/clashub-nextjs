'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
// Import Tipe Data
import { ManagedClan, UserProfile } from '@/lib/clashub.types';
// Import Ikon
import {
  UserCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  TrophyIcon,
  UserIcon,
  XIcon,
  GlobeIcon,
  RefreshCwIcon,
  MailOpenIcon,
  SettingsIcon,
  SwordsIcon,
  BookOpenIcon,
  CalendarCheck2Icon,
  CoinsIcon,
  LogOutIcon,
  IconSparkle,
  MenuIcon
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
// Import useLanguage
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
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  // Sidebar state mainly for desktop collapse if needed, but we use persistent sidebar for desktop now
  // and horizontal scroll for mobile
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Cek Peran Pengguna
  const isManager = profile?.role === 'Leader' || profile?.role === 'Co-Leader';

  // DAFTAR TAB DINAMIS
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
        t.clanManage.leaderLeaveError,
        'error',
      );
      return;
    }

    setIsLeaving(true);
    showNotification(t.clanManage.processing, 'info');

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

      showNotification(t.clanManage.leaveSuccess, 'success');
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
      <main className="min-h-screen bg-coc-dark flex items-center justify-center p-4">
        <Notification notification={notification ?? undefined} />
        <div className="max-w-lg w-full bg-black/30 backdrop-blur-xl border border-coc-red/30 rounded-xl p-8 text-center shadow-2xl">
          <div className="bg-coc-red/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-coc-red/50">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
          </div>
          <h2 className="text-2xl text-white font-clash mb-4">
            {t.clanManage.accessDenied}
          </h2>
          <p className="text-gray-300 mb-8 font-sans leading-relaxed">
            {serverError}
          </p>
          <Button href="/profile" variant="primary" className="w-full justify-center">
            {t.clanManage.backToProfile}
          </Button>
        </div>
      </main>
    );
  }

  // --- LOADING STATE ---
  if (!clan || !profile) {
    return (
      <main className="min-h-screen bg-coc-dark flex flex-col items-center justify-center p-4">
        <RefreshCwIcon className="h-12 w-12 text-coc-gold animate-spin mb-4" />
        <p className="text-lg font-clash text-white tracking-wide">{t.clanManage.loadingUserData}</p>
        <p className="text-sm text-gray-500 font-sans mt-2">
          {t.clanManage.reloginNote}
        </p>
      </main>
    );
  }

  // Gabungkan daftar tab berdasarkan peran
  const visibleTabs = isManager
    ? [...MEMBER_TABS, ...MANAGER_TABS]
    : MEMBER_TABS;

  // Utility: Tombol Menu (Sidebar & Mobile Pill)
  const MenuButton = ({ tabName, icon, label, mobile = false }: { tabName: ActiveTab; icon: React.ReactNode; label: string, mobile?: boolean }) => {
    const isActive = activeTab === tabName;
    
    // Style untuk Mobile (Horizontal Pill)
    if (mobile) {
      return (
        <button
          onClick={() => setActiveTab(tabName)}
          className={`
            flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
            ${isActive 
              ? 'bg-coc-gold text-black shadow-lg shadow-coc-gold/20 scale-105' 
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          <span className={`mr-2 ${isActive ? 'text-black' : 'text-gray-400'}`}>
             {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
          </span>
          {label}
        </button>
      );
    }

    // Style untuk Desktop (Sidebar Item)
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`
          w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden
          ${isActive
            ? 'bg-coc-gold/10 text-coc-gold border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
          }
        `}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-coc-gold rounded-r-full" />
        )}
        
        <span className={`flex-shrink-0 mr-3 transition-colors ${isActive ? 'text-coc-gold' : 'text-gray-500 group-hover:text-gray-300'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
        </span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  // Render Konten Tab Sesuai Pilihan
  const renderContent = () => {
    const forbiddenTabs: ActiveTab[] = ['requests', 'settings', 'promotion'];
    
    if (!isManager && forbiddenTabs.includes(activeTab)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
          <div className="bg-coc-red/10 p-4 rounded-full mb-4">
            <AlertTriangleIcon className="h-12 w-12 text-coc-red" />
          </div>
          <h3 className="text-xl font-clash text-white mb-2">{t.clanManage.tabAccessDenied}</h3>
          <p className="text-gray-400 max-w-md mb-6">{t.clanManage.tabAccessDeniedDesc}</p>
          <Button onClick={() => setActiveTab('summary')} variant="secondary">
            {t.clanManage.backToSummary}
          </Button>
        </div>
      );
    }

    switch (activeTab) {
      case 'summary':
        return <SummaryTabContent clan={clan} isManager={isManager} onAction={showNotification} />;
      case 'members':
        return <MemberTabContent clan={clan} userProfile={profile} onAction={showNotification} isManager={isManager} />;
      case 'requests':
        return <RequestTabContent clan={clan} userProfile={profile} onAction={showNotification} />;
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
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm p-8 text-center">
            <div className="bg-coc-gold/10 p-4 rounded-full mb-4">
              <SettingsIcon className="h-12 w-12 text-coc-gold" />
            </div>
            <h3 className="text-xl font-clash text-white mb-2">{t.clanManage.settingsTitle}</h3>
            <p className="text-gray-400 max-w-md">{t.clanManage.settingsDesc}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-coc-dark text-white selection:bg-coc-gold/30 pb-20">
      <Notification notification={notification ?? undefined} />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10">
        
        {/* Header Section */}
        <div className="mb-8">
          <ClanManagementHeader clan={clan} profile={profile} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- MOBILE NAVIGATION (Unified Control) --- */}
          <div className="lg:hidden sticky top-[72px] z-30 -mx-4 px-4 bg-coc-dark/80 backdrop-blur-lg border-b border-white/5 py-3 overflow-x-auto no-scrollbar mask-gradient-right">
            <div className="flex gap-3 min-w-max">
              {visibleTabs.map((tab) => (
                <MenuButton key={tab.tabName} {...tab} mobile />
              ))}
            </div>
          </div>

          {/* --- DESKTOP SIDEBAR --- */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-xl">
              <div className="space-y-1">
                <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Main Menu
                </p>
                {visibleTabs.filter(t => !MANAGER_TABS.includes(t)).map((tab) => (
                  <MenuButton key={tab.tabName} {...tab} />
                ))}
              </div>

              {isManager && (
                <div className="mt-6 space-y-1">
                  <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Management
                  </p>
                  {visibleTabs.filter(t => MANAGER_TABS.some(m => m.tabName === t.tabName)).map((tab) => (
                    <MenuButton key={tab.tabName} {...tab} />
                  ))}
                </div>
              )}

              <div className="my-4 border-t border-white/5 mx-2"></div>

              <div className="space-y-1">
                <Button
                  href={`/clan/internal/${clan.id}`}
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <UserCircleIcon className="h-5 w-5 mr-3" />
                  {t.clanManage.viewClanProfile}
                </Button>

                {profile.role !== 'Leader' && (
                  <Button
                    onClick={() => setIsLeaveModalOpen(true)}
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOutIcon className="h-5 w-5 mr-3" />
                    {t.clanManage.leaveClan}
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* --- CONTENT AREA --- */}
          <section className="flex-grow min-w-0">
            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 lg:p-8 min-h-[600px] shadow-2xl relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-coc-gold/5 rounded-full blur-[100px] -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
              
              {renderContent()}
            </div>
          </section>

        </div>
      </div>

      {/* --- LEAVE MODAL --- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-coc-red/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-coc-red/30">
                <LogOutIcon className="h-8 w-8 text-coc-red" />
              </div>
              
              <h3 className="text-xl font-clash text-white mb-2">
                {t.clanManage.leaveTitle}
              </h3>
              
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {t.clanManage.leaveConfirm} <span className="text-white font-semibold">{clan.name}</span>?
                <br />
                <span className="text-coc-red/80 mt-2 block">{t.clanManage.leaveImportant}</span>
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsLeaveModalOpen(false)}
                  disabled={isLeaving}
                >
                  {t.clanManage.cancel}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleConfirmLeave}
                  disabled={isLeaving}
                >
                  {isLeaving ? <RefreshCwIcon className="animate-spin h-4 w-4" /> : t.clanManage.confirmLeave}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- AI ASSISTANT FAB --- */}
      {isManager && (
        <>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="fixed z-40 bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-coc-gold to-orange-500 text-black shadow-lg shadow-orange-500/20 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
            aria-label="Gemini Assistant"
          >
            <IconSparkle className="h-7 w-7 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </button>

          <GeminiAssistantModal
            clanId={clan.id}
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
          />
        </>
      )}
    </main>
  );
};

export default ManageClanClient;