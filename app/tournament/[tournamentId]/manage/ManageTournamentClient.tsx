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
  AlertTriangleIcon,
} from '@/app/components/icons';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Impor komponen-komponen tab
import StaffManager from './StaffManager';
import ParticipantManager from './ParticipantManager';
import BracketGenerator from './BracketGenerator';
import ScheduleManager from './ScheduleManager';
import SettingsManager from './components/SettingsManager';

type ActiveTab = 'participants' | 'staff' | 'bracket' | 'settings';
type ErrorType = 'not_found' | 'access_denied';

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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  // --- Handle Error View ---
  if (error) {
    const title = error === 'not_found' ? t.tournamentManage.notFoundTitle : t.tournamentManage.accessDeniedTitle;
    const desc = error === 'not_found' ? t.tournamentManage.notFoundDesc : t.tournamentManage.accessDeniedDesc;

    return (
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh] flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 p-8 rounded-2xl text-center max-w-lg shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertTriangleIcon className="h-8 w-8 text-coc-red" />
          </div>
          <h2 className="text-2xl text-white font-clash mb-3">{title}</h2>
          <p className="text-gray-400 mb-8 font-sans leading-relaxed">{desc}</p>
          <Button href="/my-tournaments" variant="primary" className="shadow-lg shadow-coc-gold/10">
            {t.tournamentManage.btnBackToHub}
          </Button>
        </div>
      </main>
    );
  }

  if (!tournament) return null; 

  const handleRefreshData = () => {
    setNotification({
      message: t.tournamentManage.toastSuccess,
      type: 'info',
      onClose: () => setNotification(null),
    });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const TABS: { tabName: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { tabName: 'participants', icon: <UsersIcon />, label: t.tournamentManage.tabParticipants },
    { tabName: 'staff', icon: <UsersCogIcon />, label: t.tournamentManage.tabStaff },
    { tabName: 'bracket', icon: <TrophyIcon />, label: t.tournamentManage.tabBracket },
    { tabName: 'settings', icon: <SettingsIcon />, label: t.tournamentManage.tabSettings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'participants': return <ParticipantManager tournament={tournament} />;
      case 'staff': return <StaffManager tournament={tournament} isOrganizer={isOrganizer} />;
      case 'bracket': 
        return (
          <div className="space-y-8">
            <BracketGenerator 
              tournament={tournament} 
              onBracketGenerated={handleRefreshData} 
              onTournamentCancelled={handleRefreshData} 
            />
            <div className="border-t border-white/10" />
            <ScheduleManager tournament={tournament} />
          </div>
        );
      case 'settings': return <SettingsManager tournament={tournament} onSettingsSaved={handleRefreshData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      
      {notification && <Notification notification={notification} />}

      <main className="relative z-10 container mx-auto p-4 md:p-8 mt-4">
        
        {/* Header Dashboard */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              {/* [MODIFIKASI] Tombol Back dihapus agar tidak mengganggu layout */}
              
              <div className="flex items-center gap-3">
                 <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 hidden sm:block">
                    <Image 
                      src={tournament.bannerUrl || '/images/baseth12-placeholder.png'} 
                      alt="Banner" 
                      fill 
                      className="object-cover" 
                    />
                 </div>
                 <h1 className="text-xl md:text-2xl font-bold text-white truncate max-w-[200px] md:max-w-md">
                    {tournament.title}
                 </h1>
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-400 border border-white/5">
                    {isOrganizer ? 'Organizer' : 'Staff'}
                 </span>
              </div>
           </div>

           {/* Mobile Menu Toggle */}
           <div className="lg:hidden w-full">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-white"
              >
                 <span className="flex items-center gap-2 font-bold">
                    {isSidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    {isSidebarOpen ? t.tournamentManage.btnCloseMenu : t.tournamentManage.btnToggleMenu}
                 </span>
              </button>
           </div>
        </header>

        {/* Layout Utama */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
           
           {/* Sidebar Navigasi */}
           <nav className={`lg:w-64 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden'} lg:block transition-all duration-300`}>
              <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 sticky top-24 space-y-1 shadow-lg">
                 {TABS.map((tab) => (
                    <button
                      key={tab.tabName}
                      onClick={() => {
                         setActiveTab(tab.tabName);
                         setIsSidebarOpen(false); // Close mobile menu on click
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                         activeTab === tab.tabName
                           ? 'bg-coc-gold text-coc-dark shadow-md'
                           : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                       {React.cloneElement(tab.icon as React.ReactElement, {
                          className: `h-5 w-5 transition-colors ${
                             activeTab === tab.tabName ? 'text-coc-dark' : 'text-gray-500 group-hover:text-white'
                          }`
                       })}
                       {tab.label}
                    </button>
                 ))}
              </div>
           </nav>

           {/* Konten Tab */}
           <section className="flex-grow">
              <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl min-h-[600px]">
                 {renderContent()}
              </div>
           </section>

        </div>
      </main>
    </div>
  );
};

export default ManageTournamentClient;