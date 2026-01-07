'use client';

import { Button } from '@/app/components/ui/Button';
import {
  ShieldIcon,
  StarIcon,
  UserCircleIcon,
  SwordsIcon,
  UsersIcon,
  TrophyIcon
} from '@/app/components/icons';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  FirestoreDocument,
  UserProfile,
  CocCurrentWar,
  ManagedClan,
} from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface HomeHeaderProps {
  userProfile: FirestoreDocument<UserProfile> | null;
  currentWar: CocCurrentWar | null;
  managedClan: FirestoreDocument<ManagedClan> | null;
  clanReputation: number;
}

// --- Helper Functions ---
function parseISOString(s: string): Date {
  const year = parseInt(s.substring(0, 4), 10);
  const month = parseInt(s.substring(4, 6), 10) - 1;
  const day = parseInt(s.substring(6, 8), 10);
  const hour = parseInt(s.substring(9, 11), 10);
  const minute = parseInt(s.substring(11, 13), 10);
  const second = parseInt(s.substring(13, 15), 10);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function formatWarTime(targetDate: Date): string {
  const now = new Date();
  let difference = targetDate.getTime() - now.getTime();

  if (difference < 0) return '00:00:00';

  const hours = Math.floor(difference / (1000 * 60 * 60));
  difference %= 1000 * 60 * 60;
  const minutes = Math.floor(difference / (1000 * 60));
  difference %= 1000 * 60;
  const seconds = Math.floor(difference / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// --- Components ---

const WarCountdown: React.FC<{
  targetTime: string;
  state: 'preparationDay' | 'inWar' | string;
}> = ({ targetTime, state }) => {
  const targetDate = parseISOString(targetTime);
  const [timeLeft, setTimeLeft] = useState(formatWarTime(targetDate));
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatWarTime(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const textLabel =
    state === 'preparationDay' ? t.dashboard.nextWar : t.dashboard.warEnds;

  return (
    <div className="bg-[#0a0a0b] rounded-xl p-4 my-4 border border-coc-gold/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      {/* Scanning Line Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-coc-gold/5 to-transparent opacity-30 animate-scan" />
      
      <p className="text-center text-coc-gold/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-coc-gold transition-colors">
        {textLabel}
      </p>
      <div className="text-center text-3xl md:text-4xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] tabular-nums">
        {timeLeft}
      </div>
    </div>
  );
};

export default function HomeHeader({
  userProfile,
  currentWar,
  managedClan,
  clanReputation,
}: HomeHeaderProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'clan'>('profile');

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 120,
        damping: 20
      } 
    },
  };

  const tabContentVariants: Variants = {
    enter: { opacity: 0, x: 20, scale: 0.95 },
    center: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 0.95 },
  };

  return (
    <>
      {/* Hero Banner Section */}
      <section className="relative h-auto w-full overflow-hidden border-b-4 border-coc-gold shadow-2xl flex flex-col justify-center bg-[#0a0a0b] group">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:bg-fixed transform scale-105 transition-transform duration-[10s] ease-out group-hover:scale-110"
          style={{ backgroundImage: "url('/images/clash-hero-art.png')" }}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/60 via-transparent to-[#0a0a0b]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/80" />

        {/* Content Container */}
        <div className="relative z-10 container mx-auto flex flex-col items-center justify-center text-center px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl w-full"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl mb-4 md:mb-6 font-clash text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight leading-none">
              {t.home.heroTitle}
            </h1>
            <p className="text-sm md:text-lg text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-sans tracking-wide text-shadow-sm opacity-90">
              {t.home.heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
              <Button 
                href="/clan-hub" 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)] transform hover:-translate-y-1 transition-all font-bold tracking-widest"
              >
                {t.home.ctaButton.toUpperCase()}
              </Button>
              {!userProfile && (
                <Button 
                  href="/auth" 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto backdrop-blur-md bg-white/5 border-white/20 text-white hover:bg-white/10 font-bold tracking-widest hover:border-white/40"
                >
                  GABUNG SEKARANG
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Status Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 mt-8 relative z-20 pb-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Dashboard Panel (War Status) */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants} className="h-full relative overflow-hidden group border border-white/10 bg-[#15171e]/90 backdrop-blur-xl rounded-3xl shadow-2xl">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                <SwordsIcon className="w-64 h-64 text-coc-red" />
              </div>
              
              <div className="p-6 md:p-8 relative z-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                  <h3 className="text-xl md:text-2xl font-clash text-white flex items-center gap-3">
                    <div className="p-2 bg-coc-red/10 rounded-xl border border-coc-red/20">
                        <SwordsIcon className="h-6 w-6 text-coc-red drop-shadow-md" />
                    </div>
                    {t.dashboard.warStatus}
                  </h3>
                  {currentWar && (
                    <span className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-lg ${
                      currentWar.state === 'inWar' ? 'bg-coc-red/10 border-coc-red text-coc-red animate-pulse-slow shadow-coc-red/20' : 
                      currentWar.state === 'preparationDay' ? 'bg-coc-gold/10 border-coc-gold text-coc-gold shadow-coc-gold/20' : 
                      'bg-gray-500/10 border-gray-500 text-gray-400'
                    }`}>
                      {currentWar.state === 'inWar' ? 'LIVE WAR' : currentWar.state === 'preparationDay' ? 'PREPARATION' : 'ENDED'}
                    </span>
                  )}
                </div>

                {currentWar && currentWar.state !== 'notInWar' ? (
                  <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      {/* Clan Kita */}
                      <div className="text-center p-4 bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-2xl border border-white/5 hover:border-coc-gold/30 transition-all duration-300 shadow-lg">
                        <div className="mb-3 inline-flex p-2 rounded-full bg-coc-gold/10 border border-coc-gold/20">
                          <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-coc-gold" />
                        </div>
                        <span className="block text-3xl md:text-4xl font-clash text-white drop-shadow-md">{currentWar.clan.stars}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">{t.dashboard.myStars}</p>
                      </div>
                      
                      {/* VS Stats */}
                      <div className="flex flex-col justify-center items-center px-2">
                        <div className="flex items-end gap-2 mb-2 w-full justify-between px-1">
                          <span className={`text-sm md:text-lg font-bold font-mono ${currentWar.clan.destructionPercentage >= currentWar.opponent.destructionPercentage ? 'text-coc-green' : 'text-gray-500'}`}>
                            {currentWar.clan.destructionPercentage.toFixed(1)}%
                          </span>
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">VS</span>
                          <span className={`text-sm md:text-lg font-bold font-mono ${currentWar.opponent.destructionPercentage > currentWar.clan.destructionPercentage ? 'text-coc-red' : 'text-gray-500'}`}>
                            {currentWar.opponent.destructionPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#0a0a0b] rounded-full overflow-hidden flex ring-1 ring-white/10 shadow-inner relative">
                          <div 
                            className="bg-coc-green h-full shadow-[0_0_10px_currentColor]" 
                            style={{ width: `${currentWar.clan.destructionPercentage}%` }}
                          />
                          {/* Separator */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black z-10 -translate-x-1/2" />
                          <div className="bg-[#1a1d26] h-full flex-1" /> 
                        </div>
                        <p className="text-[9px] text-gray-500 mt-2 uppercase font-bold tracking-widest">Destruction</p>
                      </div>

                      {/* Musuh */}
                      <div className="text-center p-4 bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-2xl border border-white/5 hover:border-coc-red/30 transition-all duration-300 shadow-lg">
                        <div className="mb-3 inline-flex p-2 rounded-full bg-coc-red/10 border border-coc-red/20">
                          <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-coc-red" />
                        </div>
                        <span className="block text-3xl md:text-4xl font-clash text-white drop-shadow-md">{currentWar.opponent.stars}</span>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">{t.dashboard.enemyStars}</p>
                      </div>
                    </div>

                    <WarCountdown
                      targetTime={currentWar.state === 'preparationDay' ? currentWar.startTime : currentWar.endTime}
                      state={currentWar.state}
                    />

                    <div className="flex justify-end">
                      <Button href="/clan/manage" variant="ghost" className="text-xs text-gray-400 hover:text-white flex items-center gap-2 hover:bg-white/5 pr-4 pl-4 rounded-lg">
                        Lihat Detail Perang <span className="text-coc-gold">&rarr;</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 md:py-12 flex flex-col items-center justify-center min-h-[250px] bg-[#0a0a0b]/50 rounded-2xl border border-white/5 border-dashed">
                    <div className="w-20 h-20 rounded-full bg-[#1a1d26] border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                      <ShieldIcon className="w-10 h-10 text-gray-600 opacity-50" />
                    </div>
                    <h4 className="text-white font-clash text-xl mb-2 tracking-wide">
                        {userProfile ? t.dashboard.noWar : t.dashboard.loginToViewWar}
                    </h4>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                      {userProfile ? 'Klanmu sedang tidak dalam perang aktif saat ini.' : 'Masuk untuk melihat status perang klanmu secara realtime.'}
                    </p>
                    <Button 
                      href={userProfile ? '/clan/manage' : '/auth'} 
                      variant="primary"
                      className="shadow-lg shadow-coc-gold/10 px-8 font-bold tracking-wider"
                    >
                      {userProfile ? t.dashboard.viewClanPage : t.dashboard.loginNow}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Identity Card (Tab Switcher) */}
          <div className="lg:col-span-1 h-full">
            <motion.div variants={itemVariants} className="h-full bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative group">
              
              {/* Top Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue to-purple-500 opacity-50" />

              {/* Tab Header */}
              <div className="flex p-1.5 m-4 bg-[#0a0a0b] rounded-xl border border-white/5 shadow-inner">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    activeTab === 'profile' 
                      ? 'bg-[#1a1d26] text-white shadow-md border border-white/10' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('clan')}
                  className={`flex-1 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    activeTab === 'clan' 
                      ? 'bg-[#1a1d26] text-coc-blue shadow-md border border-coc-blue/20' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  My Clan
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-grow relative px-6 pb-6 flex items-center justify-center">
                <AnimatePresence mode='wait'>
                  {activeTab === 'profile' ? (
                    <motion.div
                      key="profile"
                      variants={tabContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      {userProfile ? (
                        <>
                          <div className="relative group/avatar cursor-pointer">
                            <div className="absolute inset-0 bg-coc-gold blur-2xl opacity-10 group-hover/avatar:opacity-30 transition-opacity rounded-full"></div>
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-white/10 to-transparent border border-white/10 relative z-10 backdrop-blur-sm">
                              <Image
                                src={userProfile.avatarUrl || '/images/placeholder-avatar.png'}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className="rounded-full bg-[#0a0a0b] object-cover h-full w-full border-2 border-[#1a1d26]"
                              />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#0a0a0b] text-coc-gold text-[10px] font-bold px-2.5 py-1 rounded-lg border border-coc-gold/30 shadow-lg z-20 flex items-center gap-1">
                              TH {userProfile.thLevel || '?'}
                            </div>
                          </div>
                          
                          <div className="w-full">
                            <h4 className="text-xl font-clash text-white tracking-wide truncate">{userProfile.displayName}</h4>
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0b] border border-white/10">
                               <div className={`w-1.5 h-1.5 rounded-full ${userProfile.role === 'Leader' ? 'bg-coc-red' : 'bg-coc-green'}`} />
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                 {userProfile.role}
                               </p>
                            </div>
                          </div>
                          
                          <Button href="/profile" variant="outline" size="sm" className="w-full mt-2 border-white/10 hover:bg-white/5 hover:border-white/20 text-xs font-bold tracking-wider">
                            VIEW FULL STATS
                          </Button>
                        </>
                      ) : (
                        <div className="py-8 w-full flex flex-col items-center">
                          <div className="p-4 bg-white/5 rounded-full border border-white/5 mb-4">
                             <UserCircleIcon className="w-12 h-12 text-gray-600" />
                          </div>
                          <p className="text-gray-400 text-xs font-medium mb-6 max-w-[200px] leading-relaxed">{t.dashboard.loginToViewProfile}</p>
                          <Button href="/auth" variant="primary" size="sm" className="w-full shadow-lg shadow-coc-gold/10">LOGIN AKUN</Button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="clan"
                      variants={tabContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col items-center justify-center text-center space-y-4"
                    >
                      {managedClan ? (
                        <>
                          <div className="relative group/badge">
                            <div className="absolute inset-0 bg-coc-blue blur-2xl opacity-10 group-hover/badge:opacity-30 transition-opacity rounded-full"></div>
                            <Image
                              src={managedClan.logoUrl || '/images/clan-badge-placeholder.png'}
                              alt="Clan Badge"
                              width={96}
                              height={96}
                              className="relative z-10 drop-shadow-2xl transform group-hover/badge:scale-110 transition-transform duration-300"
                            />
                          </div>
                          
                          <div className="w-full">
                            <h3 className="text-xl font-clash text-white truncate px-2 tracking-wide">{managedClan.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mb-3 tracking-widest opacity-70">{managedClan.tag}</p>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-[#0a0a0b] border border-white/5 px-2 py-1.5 rounded-lg flex flex-col items-center justify-center">
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Level</p>
                                <p className="text-white font-bold text-sm">{managedClan.clanLevel}</p>
                              </div>
                              <div className="bg-[#0a0a0b] border border-white/5 px-2 py-1.5 rounded-lg flex flex-col items-center justify-center">
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Members</p>
                                <p className="text-white font-bold text-sm">{managedClan.memberCount}/50</p>
                              </div>
                            </div>
                          </div>

                          <Button href={`/clan/internal/${managedClan.id}`} variant="outline" size="sm" className="w-full mt-2 border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 hover:border-coc-blue/50 text-xs font-bold tracking-wider">
                            CLAN DASHBOARD
                          </Button>
                        </>
                      ) : (
                        <div className="py-8 w-full flex flex-col items-center">
                          <div className="p-4 bg-white/5 rounded-full border border-white/5 mb-4">
                             <ShieldIcon className="w-12 h-12 text-gray-600 opacity-50" />
                          </div>
                          <p className="text-gray-400 text-xs font-medium mb-6 max-w-[200px] leading-relaxed">Kamu belum terhubung dengan klan manapun.</p>
                          <Button href="/clan-hub" variant="secondary" size="sm" className="w-full bg-[#1a1d26] hover:bg-[#252833] border-white/10 text-white">CARI KLAN</Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.section>
    </>
  );
}