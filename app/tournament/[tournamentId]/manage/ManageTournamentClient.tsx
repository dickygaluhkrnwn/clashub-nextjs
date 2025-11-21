'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import {
  ChevronLeftIcon,
  UsersIcon,
  UsersCogIcon,
  TrophyIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  AlertTriangleIcon, // [BARU] Untuk tampilan error
} from '@/app/components/icons';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

// Impor komponen-komponen tab
import StaffManager from './StaffManager';
import ParticipantManager from './ParticipantManager';
import BracketGenerator from './BracketGenerator';
import ScheduleManager from './ScheduleManager';
import SettingsManager from './components/SettingsManager';

type ActiveTab = 'participants' | 'staff' | 'bracket' | 'settings';
type ErrorType = 'not_found' | 'access_denied';

// [MODIFIKASI] Props sekarang opsional karena bisa jadi hanya menerima error
interface ManageTournamentClientProps {
  tournament?: FirestoreDocument<Tournament>;
  isOrganizer?: boolean;
  error?: ErrorType;
}

const ManageTournamentClient: React.FC<ManageTournamentClientProps> = ({
  tournament,
  isOrganizer = false,
  error,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // --- [BARU] Handle Error View dengan i18n ---
  if (error) {
    const title = error === 'not_found' ? t.tournamentManage.notFoundTitle : t.tournamentManage.accessDeniedTitle;
    const desc = error === 'not_found' ? t.tournamentManage.notFoundDesc : t.tournamentManage.accessDeniedDesc;

    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
        <div className="flex justify-center items-center">
          <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
            <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
            <h2 className="text-2xl text-coc-red font-clash mb-4">{title}</h2>
            <p className="text-gray-300 mb-6 font-sans">{desc}</p>
            <Button href="/my-tournaments" variant="primary">
              {t.tournamentManage.btnBackToHub}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Jika tidak ada error, tournament PASTI ada (karena logic di page.tsx)
  if (!tournament) return null; 

  const handleRefreshData = () => {
    setNotification({
      message: t.tournamentManage.toastSuccess, // [i18n]
      type: 'info',
      onClose: () => setNotification(null),
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] = [
    {
      tabName: 'participants',
      icon: <UsersIcon />,
      label: t.tournamentManage.tabParticipants, // [i18n]
    },
    {
      tabName: 'staff',
      icon: <UsersCogIcon />,
      label: t.tournamentManage.tabStaff, // [i18n]
    },
    {
      tabName: 'bracket',
      icon: <TrophyIcon />,
      label: t.tournamentManage.tabBracket, // [i18n]
    },
    {
      tabName: 'settings',
      icon: <SettingsIcon />,
      label: t.tournamentManage.tabSettings, // [i18n]
    },
  ];

  const MenuButton: React.FC<{
    tabName: ActiveTab;
    icon: React.ReactNode;
    label: string;
  }> = ({ tabName, icon, label }) => {
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

  const renderContent = () => {
    switch (activeTab) {
      case 'participants':
        return <ParticipantManager tournament={tournament} />;
      case 'staff':
        return (
          <StaffManager tournament={tournament} isOrganizer={isOrganizer} />
        );
      case 'bracket':
        return (
          <React.Fragment>
            <BracketGenerator
              tournament={tournament}
              onBracketGenerated={handleRefreshData}
              onTournamentCancelled={handleRefreshData}
            />
            <ScheduleManager tournament={tournament} />
          </React.Fragment>
        );
      case 'settings':
        return (
          <SettingsManager
            tournament={tournament}
            onSettingsSaved={handleRefreshData}
          />
        );
      default:
        setActiveTab('participants');
        return null;
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      <Notification notification={notification ?? undefined} />

      <div className="space-y-8">
        {/* Header Halaman */}
        <div className="flex items-center justify-between gap-4">
          <Button href="/my-tournaments" variant="secondary" size="sm">
            <ChevronLeftIcon className="h-5 w-5 mr-1.5" />
            {t.tournamentManage.btnBack} {/* [i18n] */}
          </Button>

          <div className="flex items-center gap-3">
            <Image
              src={tournament.bannerUrl || '/images/baseth12-placeholder.png'}
              alt="Banner"
              width={100}
              height={40}
              className="rounded-md object-cover hidden sm:block"
            />
            <h1 className="font-clash text-xl md:text-3xl text-white text-right truncate">
              {tournament.title}
            </h1>
          </div>
        </div>

        {/* Tombol Toggle Sidebar (Mobile) */}
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
            {isSidebarOpen ? t.tournamentManage.btnCloseMenu : t.tournamentManage.btnToggleMenu} {/* [i18n] */}
          </Button>
        </div>

        {/* Layout Utama */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigasi */}
          <nav
            className={`lg:w-56 flex-shrink-0 ${
              isSidebarOpen ? 'block' : 'hidden'
            } lg:block transition-all duration-300 ease-in-out`}
          >
            <div className="space-y-2 sticky top-20 bg-coc-dark/70 p-4 rounded-lg border border-coc-gold-dark/30 backdrop-blur-sm">
              {TABS.map((tab) => (
                <MenuButton
                  key={tab.tabName}
                  tabName={tab.tabName}
                  icon={tab.icon}
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

export default ManageTournamentClient;