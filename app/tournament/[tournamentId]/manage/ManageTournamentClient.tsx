'use client';

// File: app/tournament/[tournamentId]/manage/ManageTournamentClient.tsx
// Deskripsi: [FILE BARU] Client Component untuk layout tab manajemen turnamen.
// Dipisahkan dari page.tsx untuk mengatasi error "use client".

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
} from '@/app/components/icons';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';

// Impor komponen-komponen tab
import StaffManager from './StaffManager';
import ParticipantManager from './ParticipantManager';
import BracketGenerator from './BracketGenerator';
import ScheduleManager from './ScheduleManager';

type ActiveTab = 'participants' | 'staff' | 'bracket' | 'settings';

interface ManageTournamentClientProps {
  tournament: FirestoreDocument<Tournament>;
  isOrganizer: boolean;
}

const ManageTournamentClient: React.FC<ManageTournamentClientProps> = ({
  tournament,
  isOrganizer,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const handleRefreshData = () => {
    setNotification({
      message: 'Data sedang diperbarui...',
      type: 'info',
      onClose: () => setNotification(null),
    });
    // Di aplikasi nyata, ini akan memanggil 'mutate()' dari SWR atau 'refetch()' dari React Query
    // Untuk saat ini, kita bisa reload (meski kurang ideal) atau biarkan notifikasi
    // window.location.reload(); // Opsi refresh paksa
    console.log('Refreshing data...');
  };

  const TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] = [
    {
      tabName: 'participants',
      icon: <UsersIcon />,
      label: 'Peserta',
    },
    {
      tabName: 'staff',
      icon: <UsersCogIcon />,
      label: 'Staf & Panitia',
    },
    {
      tabName: 'bracket',
      icon: <TrophyIcon />,
      label: 'Bracket & Jadwal',
    },
    {
      tabName: 'settings',
      icon: <SettingsIcon />,
      label: 'Pengaturan',
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
            />
            <ScheduleManager tournament={tournament} />
          </React.Fragment>
        );
      case 'settings':
        return (
          <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
            <SettingsIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
            <p className="text-lg font-clash text-white">Pengaturan Turnamen</p>
            <p className="text-sm text-gray-400 font-sans mt-1">
              Fitur untuk mengedit turnamen akan hadir di sini.
            </p>
          </div>
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
        {/* Header Halaman (Tombol Kembali & Judul) */}
        <div className="flex items-center justify-between gap-4">
          <Button href="/my-tournaments" variant="secondary" size="sm">
            <ChevronLeftIcon className="h-5 w-5 mr-1.5" />
            Kembali ke Hub
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

        {/* Layout Utama (Sidebar + Konten) */}
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