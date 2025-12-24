'use client';

import { Button } from '@/app/components/ui/Button';
import {
  ShieldIcon,
  PercentageIcon,
  StarIcon,
  UserCircleIcon,
  BellIcon
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
import { motion, Variants } from 'framer-motion';

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
    <div className="bg-black/40 rounded-xl p-3 my-4 border border-coc-gold/20 shadow-inner relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold/50 to-transparent animate-pulse" />
      <p className="text-center text-coc-gold/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1">
        {textLabel}
      </p>
      <div className="text-center text-3xl md:text-4xl font-mono font-bold text-white tracking-widest drop-shadow-md">
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
      stiffness: 120 
    } 
  },
};

export default function HomeHeader({
  userProfile,
  currentWar,
  managedClan,
  clanReputation,
}: HomeHeaderProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Banner Section */}
      <section className="relative h-[450px] md:h-[550px] w-full overflow-hidden border-b-4 border-coc-gold shadow-2xl">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-hero-banner bg-cover bg-center"
          style={{ backgroundImage: "url('/images/clash-hero-art.png')" }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-coc-stone via-coc-stone/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-coc-stone/60 via-transparent to-coc-stone" />

        {/* Content Container */}
        {/* [FIX] pb-32 md:pb-40: Padding bawah besar agar konten teks NAIK ke atas dan tidak tertutup kartu */}
        <div className="relative z-10 container mx-auto h-full flex flex-col items-center justify-center text-center px-4 pt-16 pb-32 md:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl w-full"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl mb-4 font-clash text-white drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              {t.home.heroTitle}
            </h1>
            <p className="text-base md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              {t.home.heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
              <Button 
                href="/clan-hub" 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] transform hover:-translate-y-1 transition-all"
              >
                {t.home.ctaButton.toUpperCase()}
              </Button>
              {!userProfile && (
                <Button 
                  href="/auth" 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto backdrop-blur-md bg-white/5 border-white/30 text-white hover:bg-white/10"
                >
                  GABUNG SEKARANG
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Status Section (Floating Overlay) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-20 pb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Dashboard Panel (War Status) */}
          <div className="lg:col-span-2">
            <motion.div variants={itemVariants} className="card-stone p-6 relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldIcon className="w-32 h-32 text-coc-gold" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <h3 className="text-xl font-clash text-white flex items-center gap-2">
                    <ShieldIcon className="h-6 w-6 text-coc-blue" />
                    {t.dashboard.warStatus}
                  </h3>
                  {currentWar && (
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${
                      currentWar.state === 'inWar' ? 'bg-coc-red/20 border-coc-red text-coc-red' : 
                      currentWar.state === 'preparationDay' ? 'bg-coc-gold/20 border-coc-gold text-coc-gold' : 
                      'bg-gray-500/20 border-gray-500 text-gray-400'
                    }`}>
                      {currentWar.state === 'inWar' ? 'LIVE' : currentWar.state === 'preparationDay' ? 'PREP' : 'ENDED'}
                    </span>
                  )}
                </div>

                {currentWar && currentWar.state !== 'notInWar' ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-black/20 rounded-xl border border-white/5">
                        <StarIcon className="w-6 h-6 text-coc-gold mx-auto mb-1" />
                        <span className="text-2xl font-clash text-white">{currentWar.clan.stars}</span>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{t.dashboard.myStars}</p>
                      </div>
                      
                      <div className="text-center p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col justify-center">
                        <PercentageIcon className={`w-6 h-6 mx-auto mb-1 ${
                          currentWar.clan.destructionPercentage > currentWar.opponent.destructionPercentage ? 'text-coc-green' : 'text-coc-red'
                        }`} />
                        <span className="text-xl font-clash text-white">
                          {currentWar.clan.destructionPercentage.toFixed(1)}%
                        </span>
                        <p className="text-[10px] text-gray-400 uppercase font-bold text-center w-full truncate">vs {currentWar.opponent.destructionPercentage.toFixed(1)}%</p>
                      </div>

                      <div className="text-center p-3 bg-black/20 rounded-xl border border-white/5">
                        <StarIcon className="w-6 h-6 text-coc-red mx-auto mb-1" />
                        <span className="text-2xl font-clash text-white">{currentWar.opponent.stars}</span>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{t.dashboard.enemyStars}</p>
                      </div>
                    </div>

                    <WarCountdown
                      targetTime={currentWar.state === 'preparationDay' ? currentWar.startTime : currentWar.endTime}
                      state={currentWar.state}
                    />

                    <Button href="/clan/manage" variant="secondary" className="w-full">
                      {t.dashboard.viewWarDetails}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShieldIcon className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 mb-6">{userProfile ? t.dashboard.noWar : t.dashboard.loginToViewWar}</p>
                    <Button 
                      href={userProfile ? '/clan/manage' : '/auth'} 
                      variant="outline"
                      className="border-coc-gold text-coc-gold hover:bg-coc-gold/10"
                    >
                      {userProfile ? t.dashboard.viewClanPage : t.dashboard.loginNow}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column (Combined Identity + Announcements) */}
          <div className="space-y-6">
            
            {/* 2. Combined Identity Card (Profile + Clan) */}
            <motion.div variants={itemVariants} className="card-stone p-0 relative overflow-hidden flex flex-col h-full">
              {/* Bagian Atas: Profil User */}
              <div className="p-6 relative text-center">
                 <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-coc-gold to-transparent" />
                 {userProfile ? (
                    <>
                      <div className="relative inline-block mb-3">
                        <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-b from-coc-gold to-coc-stone">
                          <Image
                            src={userProfile.avatarUrl || '/images/placeholder-avatar.png'}
                            alt="Avatar"
                            width={80}
                            height={80}
                            className="rounded-full bg-coc-stone object-cover h-full w-full"
                          />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-coc-gold text-coc-stone text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-coc-stone">
                          TH {userProfile.thLevel || '-'}
                        </div>
                      </div>
                      <h4 className="text-lg font-clash text-white">{userProfile.displayName}</h4>
                      <p className="text-xs text-coc-gold/80 font-bold uppercase tracking-wider">{userProfile.role}</p>
                    </>
                 ) : (
                    <div className="py-4">
                      <UserCircleIcon className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">{t.dashboard.loginToViewProfile}</p>
                    </div>
                 )}
              </div>

              {/* Divider Visual */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Bagian Bawah: Info Klan */}
              <div className="p-4 bg-black/20 flex-grow">
                {managedClan ? (
                  <div className="flex items-center gap-4">
                    <Image
                      src={managedClan.logoUrl || '/images/clan-badge-placeholder.png'}
                      alt="Clan Badge"
                      width={48}
                      height={48}
                      className="rounded-xl drop-shadow-md"
                    />
                    <div className="overflow-hidden">
                      <h3 className="text-base font-clash text-white truncate">{managedClan.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mb-1">{managedClan.tag}</p>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] bg-coc-stone border border-coc-gold/30 text-coc-gold px-1.5 py-0.5 rounded">Lvl {managedClan.clanLevel}</span>
                         <span className="text-[10px] text-gray-400">{managedClan.memberCount}/50 Member</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500 mb-2">Belum bergabung dengan klan?</p>
                    <Button href="/clan-hub" variant="outline" size="sm" className="w-full text-xs h-8">Cari Klan</Button>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                 <Button href="/profile" variant="ghost" className="flex-1 text-xs h-8 text-gray-300 hover:text-white">Profile</Button>
                 {managedClan && (
                    <Button href={`/clan/internal/${managedClan.id}`} variant="ghost" className="flex-1 text-xs h-8 text-coc-gold hover:bg-coc-gold/10">Clan Page</Button>
                 )}
              </div>
            </motion.div>

            {/* 3. Announcements (Revamped) */}
            <motion.div variants={itemVariants} className="card-stone p-4 flex items-start gap-4 hover:bg-coc-stone-light/80 transition-colors cursor-pointer group">
              <div className="p-3 rounded-full bg-coc-red/10 border border-coc-red/30 shrink-0 group-hover:scale-110 transition-transform">
                 <BellIcon className="h-6 w-6 text-coc-red animate-pulse" />
              </div>
              <div className="flex-1">
                 <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    Pengumuman
                    <span className="w-2 h-2 rounded-full bg-coc-red animate-ping" />
                 </h3>
                 <div className="space-y-2">
                    <div className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                       🔥 <span className="text-white font-medium">Pendaftaran Liga Musim 3</span> telah dibuka! Segera daftarkan klanmu sebelum slot penuh.
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">Diperbarui: 2 jam lalu</div>
                 </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.section>
    </>
  );
}