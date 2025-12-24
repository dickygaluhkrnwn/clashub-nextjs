'use client';

import { Button } from '@/app/components/ui/Button';
import {
  ShieldIcon,
  PercentageIcon,
  StarIcon,
  UserCircleIcon,
  // Menggunakan icon yang sudah ada
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
import { motion, Variants, AnimatePresence } from 'framer-motion';

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
    <div className="bg-black/40 rounded-xl p-3 my-4 border border-coc-gold/20 shadow-inner relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold/50 to-transparent animate-pulse" />
      <p className="text-center text-coc-gold/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-coc-gold transition-colors">
        {textLabel}
      </p>
      <div className="text-center text-3xl md:text-4xl font-mono font-bold text-white tracking-widest drop-shadow-md tabular-nums">
        {timeLeft}
      </div>
    </div>
  );
};

// --- Animation Variants ---
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
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function HomeHeader({
  userProfile,
  currentWar,
  managedClan,
  clanReputation,
}: HomeHeaderProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'clan'>('profile');

  return (
    <>
      {/* Hero Banner Section 
          [FIX FINAL] 
          1. h-auto: Tinggi mengikuti konten, tidak dipaksa min-h besar.
          2. py-16 / py-24: Padding atas bawah seimbang.
          3. flex-grow dihapus karena height auto.
      */}
      <section className="relative h-auto w-full overflow-hidden border-b-4 border-coc-gold shadow-2xl flex flex-col justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-hero-banner bg-cover bg-center md:bg-fixed transform scale-105"
          style={{ backgroundImage: "url('/images/clash-hero-art.png')" }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-coc-stone via-coc-stone/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-coc-stone/60 via-transparent to-coc-stone/90" />
        <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-black/40" />

        {/* Content Container */}
        <div className="relative z-10 container mx-auto flex flex-col items-center justify-center text-center px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl w-full"
          >
            <h1 className="text-3xl md:text-5xl lg:text-7xl mb-3 md:mb-4 font-clash text-white drop-shadow-[0_0_25px_rgba(255,215,0,0.2)] tracking-tight">
              {t.home.heroTitle}
            </h1>
            <p className="text-sm md:text-lg text-gray-200 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed font-light tracking-wide text-shadow-sm">
              {t.home.heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 w-full max-w-md mx-auto">
              <Button 
                href="/clan-hub" 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transform hover:-translate-y-1 transition-all font-bold"
              >
                {t.home.ctaButton.toUpperCase()}
              </Button>
              {!userProfile && (
                <Button 
                  href="/auth" 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto backdrop-blur-md bg-white/5 border-white/30 text-white hover:bg-white/10 font-medium"
                >
                  GABUNG SEKARANG
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Status Section 
          [FIX FINAL] 
          1. -mt dihapus total. Diganti mt-8 agar ada jarak.
          2. Section ini sekarang fisik berada DI BAWAH banner, bukan menimpa.
      */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 mt-8 relative z-20 pb-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Dashboard Panel (War Status) */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants} className="card-stone h-full relative overflow-hidden group border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <ShieldIcon className="w-64 h-64 text-coc-gold" />
              </div>
              
              <div className="p-5 md:p-6 relative z-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-lg md:text-xl font-clash text-white flex items-center gap-2">
                    <ShieldIcon className="h-5 w-5 md:h-6 md:w-6 text-coc-blue drop-shadow-md" />
                    {t.dashboard.warStatus}
                  </h3>
                  {currentWar && (
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full border ${
                      currentWar.state === 'inWar' ? 'bg-coc-red/20 border-coc-red text-coc-red animate-pulse-slow' : 
                      currentWar.state === 'preparationDay' ? 'bg-coc-gold/20 border-coc-gold text-coc-gold' : 
                      'bg-gray-500/20 border-gray-500 text-gray-400'
                    }`}>
                      {currentWar.state === 'inWar' ? 'LIVE WAR' : currentWar.state === 'preparationDay' ? 'PREPARATION' : 'ENDED'}
                    </span>
                  )}
                </div>

                {currentWar && currentWar.state !== 'notInWar' ? (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 items-center">
                      {/* Clan Kita */}
                      <div className="text-center p-2 md:p-3 bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-white/5 hover:border-coc-gold/30 transition-colors">
                        <div className="mb-2 inline-flex p-1.5 md:p-2 rounded-full bg-coc-gold/10">
                          <StarIcon className="w-4 h-4 md:w-5 md:h-5 text-coc-gold" />
                        </div>
                        <span className="block text-xl md:text-3xl font-clash text-white">{currentWar.clan.stars}</span>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.dashboard.myStars}</p>
                      </div>
                      
                      {/* VS Stats */}
                      <div className="flex flex-col justify-center items-center">
                        <div className="flex items-end gap-1 mb-1">
                          <span className={`text-base md:text-xl font-bold ${currentWar.clan.destructionPercentage >= currentWar.opponent.destructionPercentage ? 'text-coc-green' : 'text-gray-400'}`}>
                            {currentWar.clan.destructionPercentage.toFixed(1)}%
                          </span>
                          <span className="text-[10px] md:text-xs text-gray-500 mb-1">vs</span>
                          <span className={`text-base md:text-xl font-bold ${currentWar.opponent.destructionPercentage > currentWar.clan.destructionPercentage ? 'text-coc-red' : 'text-gray-400'}`}>
                            {currentWar.opponent.destructionPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-coc-green h-full" 
                            style={{ width: `${currentWar.clan.destructionPercentage}%` }}
                          />
                          <div className="bg-gray-700 h-full flex-1" /> 
                        </div>
                        <p className="text-[8px] md:text-[10px] text-gray-500 mt-2 uppercase font-bold">Destruction</p>
                      </div>

                      {/* Musuh */}
                      <div className="text-center p-2 md:p-3 bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-white/5 hover:border-coc-red/30 transition-colors">
                        <div className="mb-2 inline-flex p-1.5 md:p-2 rounded-full bg-coc-red/10">
                          <StarIcon className="w-4 h-4 md:w-5 md:h-5 text-coc-red" />
                        </div>
                        <span className="block text-xl md:text-3xl font-clash text-white">{currentWar.opponent.stars}</span>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.dashboard.enemyStars}</p>
                      </div>
                    </div>

                    <WarCountdown
                      targetTime={currentWar.state === 'preparationDay' ? currentWar.startTime : currentWar.endTime}
                      state={currentWar.state}
                    />

                    <div className="flex justify-end">
                      <Button href="/clan/manage" variant="ghost" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                        Lihat Detail Perang &rarr;
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-10 flex flex-col items-center justify-center min-h-[200px] md:min-h-[250px]">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <ShieldIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-600 opacity-50" />
                    </div>
                    <h4 className="text-white font-clash text-base md:text-lg mb-2">{userProfile ? t.dashboard.noWar : t.dashboard.loginToViewWar}</h4>
                    <p className="text-gray-400 text-xs md:text-sm max-w-xs mx-auto mb-6">
                      {userProfile ? 'Klanmu sedang tidak dalam perang aktif saat ini.' : 'Masuk untuk melihat status perang klanmu secara realtime.'}
                    </p>
                    <Button 
                      href={userProfile ? '/clan/manage' : '/auth'} 
                      variant="primary"
                      className="shadow-lg shadow-coc-gold/10"
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
            <motion.div variants={itemVariants} className="card-stone h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              
              {/* Tab Header */}
              <div className="flex p-1 m-3 md:m-4 bg-black/40 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    activeTab === 'profile' 
                      ? 'bg-coc-gold text-coc-stone shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('clan')}
                  className={`flex-1 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    activeTab === 'clan' 
                      ? 'bg-coc-blue text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  My Clan
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-grow relative overflow-hidden px-4 pb-4 md:px-6 md:pb-6">
                <AnimatePresence mode='wait'>
                  {activeTab === 'profile' ? (
                    <motion.div
                      key="profile"
                      variants={tabContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-3 md:space-y-4"
                    >
                      {userProfile ? (
                        <>
                          <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-coc-gold blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-coc-gold via-yellow-500 to-coc-stone relative z-10">
                              <Image
                                src={userProfile.avatarUrl || '/images/placeholder-avatar.png'}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className="rounded-full bg-coc-stone object-cover h-full w-full border-2 border-coc-stone"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-coc-stone text-coc-gold text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg border border-coc-gold/30 shadow-sm z-20">
                              TH {userProfile.thLevel || '?'}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg md:text-xl font-clash text-white">{userProfile.displayName}</h4>
                            <p className="text-[10px] md:text-xs text-coc-gold/80 font-bold uppercase tracking-widest border-t border-white/10 pt-2 mt-1 inline-block">
                              {userProfile.role}
                            </p>
                          </div>
                          <Button href="/profile" variant="outline" size="sm" className="w-full mt-2 md:mt-4 border-white/10 hover:bg-white/5 text-xs">
                            Lihat Statistik Lengkap
                          </Button>
                        </>
                      ) : (
                        <div className="py-6 md:py-8">
                          <UserCircleIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 text-xs md:text-sm mb-4">{t.dashboard.loginToViewProfile}</p>
                          <Button href="/auth" variant="primary" size="sm">Login Akun</Button>
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
                      className="h-full flex flex-col items-center justify-center text-center space-y-3 md:space-y-4"
                    >
                      {managedClan ? (
                        <>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-coc-blue blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <Image
                              src={managedClan.logoUrl || '/images/clan-badge-placeholder.png'}
                              alt="Clan Badge"
                              width={70}
                              height={70}
                              className="relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 md:w-20 md:h-20"
                            />
                          </div>
                          
                          <div className="w-full">
                            <h3 className="text-lg md:text-xl font-clash text-white truncate px-4">{managedClan.name}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 font-mono mb-2 md:mb-3">{managedClan.tag}</p>
                            
                            <div className="flex justify-center gap-2 text-[10px] md:text-xs">
                              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                                Lvl <span className="text-white font-bold">{managedClan.clanLevel}</span>
                              </span>
                              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300">
                                <span className="text-white font-bold">{managedClan.memberCount}</span>/50 Member
                              </span>
                            </div>
                          </div>

                          <Button href={`/clan/internal/${managedClan.id}`} variant="outline" size="sm" className="w-full mt-2 md:mt-4 border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 text-xs">
                            Dashboard Klan
                          </Button>
                        </>
                      ) : (
                        <div className="py-6 md:py-8">
                          <ShieldIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-3 opacity-50" />
                          <p className="text-gray-400 text-xs md:text-sm mb-4">Kamu belum terhubung dengan klan manapun.</p>
                          <Button href="/clan-hub" variant="secondary" size="sm">Cari Klan</Button>
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