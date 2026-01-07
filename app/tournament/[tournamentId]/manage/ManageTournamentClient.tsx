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
  ShieldIcon
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
      <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh] flex items-center justify-center bg-[#0a0a0b]">
        <div className="bg-[#15171e] backdrop-blur-md border border-red-500/30 p-10 rounded-3xl text-center max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.2)]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
          </div>
          <h2 className="text-2xl text-white font-clash mb-3 uppercase tracking-wide">{title}</h2>
          <p className="text-gray-400 mb-8 font-sans leading-relaxed">{desc}</p>
          <Button href="/my-tournaments" variant="primary" className="shadow-lg shadow-coc-gold/10 w-full font-bold">
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
    { tabName: 'participants', icon: <UsersIcon className="h-5 w-5" />, label: t.tournamentManage.tabParticipants },
    { tabName: 'bracket', icon: <TrophyIcon className="h-5 w-5" />, label: t.tournamentManage.tabBracket },
    { tabName: 'staff', icon: <UsersCogIcon className="h-5 w-5" />, label: t.tournamentManage.tabStaff },
    { tabName: 'settings', icon: <SettingsIcon className="h-5 w-5" />, label: t.tournamentManage.tabSettings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'participants': return <ParticipantManager tournament={tournament} />;
      case 'staff': return <StaffManager tournament={tournament} isOrganizer={isOrganizer} />;
      case 'bracket': 
        return (
          <div className="space-y-12">
            <BracketGenerator 
              tournament={tournament} 
              onBracketGenerated={handleRefreshData} 
              onTournamentCancelled={handleRefreshData} 
            />
            <div className="border-t border-white/5" />
            <ScheduleManager tournament={tournament} />
          </div>
        );
      case 'settings': return <SettingsManager tournament={tournament} onSettingsSaved={handleRefreshData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-coc-gold/5 blur-[150px] pointer-events-none z-0" />
      
      {notification && <Notification notification={notification} />}

      <main className="relative z-10 container mx-auto p-4 md:p-8 mt-6 max-w-7xl">
        
        {/* Header Dashboard */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#15171e]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold opacity-50" />
           <div className="absolute inset-0 bg-gradient-to-r from-coc-gold/5 via-transparent to-transparent opacity-30" />

           <div className="flex items-center gap-5 relative z-10">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                 <Image 
                   src={tournament.bannerUrl || '/images/baseth12-placeholder.png'} 
                   alt="Banner" 
                   fill 
                   className="object-cover" 
                 />
              </div>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${isOrganizer ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20' : 'bg-coc-blue/10 text-coc-blue border-coc-blue/20'}`}>
                       {isOrganizer ? 'Lead Organizer' : 'Tournament Staff'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">{tournament.status.replace('_', ' ').toUpperCase()}</span>
                 </div>
                 <h1 className="text-xl md:text-3xl font-bold text-white leading-tight font-clash tracking-wide drop-shadow-md">
                   {tournament.title}
                 </h1>
              </div>
           </div>

           {/* Mobile Menu Toggle */}
           <div className="lg:hidden w-full relative z-10">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                 <span className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    {isSidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    {isSidebarOpen ? t.tournamentManage.btnCloseMenu : t.tournamentManage.btnToggleMenu}
                 </span>
              </button>
           </div>
        </header>

        {/* Layout Utama */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
           
           {/* Sidebar Navigasi (Command Deck) */}
           <nav className={`lg:w-72 flex-shrink-0 w-full ${isSidebarOpen ? 'block' : 'hidden'} lg:block transition-all duration-300 z-20`}>
              <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sticky top-24 space-y-2 shadow-2xl">
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mb-2">Management Console</p>
                 {TABS.map((tab) => {
                    const isActive = activeTab === tab.tabName;
                    return (
                    <button
                      key={tab.tabName}
                      onClick={() => {
                         setActiveTab(tab.tabName);
                         setIsSidebarOpen(false); 
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden ${
                         isActive
                           ? 'bg-gradient-to-r from-coc-gold/20 to-transparent text-coc-gold border border-coc-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                           : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                       {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-coc-gold" />}
                       <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {tab.icon}
                       </div>
                       <span className="tracking-wide">{tab.label}</span>
                    </button>
                 )})}
              </div>
           </nav>

           {/* Konten Tab */}
           <section className="flex-grow w-full">
              <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {renderContent()}
              </div>
           </section>

        </div>
      </main>
    </div>
  );
};

export default ManageTournamentClient;