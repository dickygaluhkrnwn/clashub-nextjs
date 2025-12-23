// [BARU] "use client" diperlukan untuk logic countdown (useEffect, useState) dan useLanguage
'use client';

import { Button } from '@/app/components/ui/Button';
import {
  TrophyIcon,
  ShieldIcon,
  PercentageIcon,
  StarIcon,
} from '@/app/components/icons';
import Image from 'next/image';
// [BARU] Impor untuk countdown
import { useState, useEffect } from 'react';
// [BARU] Impor tipe data yang diterima dari app/page.tsx
import {
  FirestoreDocument,
  UserProfile,
  CocCurrentWar,
  ManagedClan,
} from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

// [PERBAIKAN] Mendefinisikan props, MENAMBAHKAN clanReputation
interface HomeHeaderProps {
  userProfile: FirestoreDocument<UserProfile> | null;
  currentWar: CocCurrentWar | null;
  managedClan: FirestoreDocument<ManagedClan> | null;
  clanReputation: number; // [BARU] Menerima reputasi klan
}

// [BARU] Helper function untuk mengubah string ISO 8601 dari API
function parseISOString(s: string): Date {
  // Format: "20230120T100000.000Z"
  const year = parseInt(s.substring(0, 4), 10);
  const month = parseInt(s.substring(4, 6), 10) - 1; // Bulan di JS (0-11)
  const day = parseInt(s.substring(6, 8), 10);
  const hour = parseInt(s.substring(9, 11), 10);
  const minute = parseInt(s.substring(11, 13), 10);
  const second = parseInt(s.substring(13, 15), 10);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

// [BARU] Helper function untuk format countdown "HH:MM:SS"
function formatWarTime(targetDate: Date): string {
  const now = new Date();
  let difference = targetDate.getTime() - now.getTime();

  if (difference < 0) {
    return '00:00:00'; // Waktu sudah habis
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  difference %= 1000 * 60 * 60;
  const minutes = Math.floor(difference / (1000 * 60));
  difference %= 1000 * 60;
  const seconds = Math.floor(difference / 1000);

  // Format HH:MM:SS
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// [BARU] Komponen Client untuk Countdown Timer
const WarCountdown: React.FC<{
  targetTime: string;
  state: 'preparationDay' | 'inWar' | string;
}> = ({ targetTime, state }) => {
  const targetDate = parseISOString(targetTime);
  const [timeLeft, setTimeLeft] = useState(formatWarTime(targetDate));
  const { t } = useLanguage();

  useEffect(() => {
    // Update timer setiap detik
    const timer = setInterval(() => {
      setTimeLeft(formatWarTime(targetDate));
    }, 1000);

    // Bersihkan interval saat komponen unmount
    return () => clearInterval(timer);
  }, [targetTime]); // Hanya re-run jika targetTime berubah

  const textLabel =
    state === 'preparationDay' ? t.dashboard.nextWar : t.dashboard.warEnds;

  return (
    <div className="bg-black/20 rounded-lg p-2 md:p-3 my-3 border border-white/5">
      <p className="text-center text-gray-400 text-xs md:text-sm font-sans uppercase tracking-widest mb-1">
        {textLabel}
      </p>
      <div className="text-center text-3xl md:text-4xl font-clash text-coc-gold-dark tracking-wide">
        {timeLeft}
      </div>
    </div>
  );
};

// [PERBAIKAN] Komponen sekarang menerima props dinamis
export default function HomeHeader({
  userProfile,
  currentWar,
  managedClan,
  clanReputation, // [BARU] Terima prop reputasi
}: HomeHeaderProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Banner Section (Mobile Optimized) */}
      <section className="relative h-[320px] md:h-[450px] bg-hero-banner bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        
        <div className="relative z-10 p-6 max-w-4xl w-full flex flex-col items-center animate-fade-in-up">
          {/* [FIX] Kembalikan ke text-white solid agar paling cerah dan kontras */}
          <h1 className="text-3xl md:text-6xl mb-3 md:mb-5 font-clash tracking-wide text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            {t.home.heroTitle}
          </h1>
          <p className="text-sm md:text-xl text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button href="/clan-hub" variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-coc-gold/20">
                {t.home.ctaButton.toUpperCase()}
            </Button>
            {/* Tampilkan tombol gabung jika belum login */}
            {!userProfile && (
                <Button href="/auth" variant="secondary" size="lg" className="w-full sm:w-auto bg-black/40 border-white/20 hover:bg-black/60">
                    GABUNG SEKARANG
                </Button>
            )}
          </div>
        </div>
      </section>

      {/* Dashboard Status Section */}
      {/* [LAYOUT FIX] Mengganti -mt-8 (overlap) menjadi mt-6 (spacing) agar tidak menimpa banner */}
      <section className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mt-6 relative z-20 px-4 pb-8">
        
        {/* Kolom Kiri & Tengah (Status Panel) */}
        {/* [MOBILE REORDER] Menggunakan 'contents' di mobile agar children bisa diurutkan ulang dengan flex/grid parent */}
        <div className="contents md:grid md:grid-cols-2 md:gap-6 lg:col-span-2">
          
          {/* ========== [BLOK 1: STATUS WAR (DINAMIS)] ========== */}
          {/* Order 3 di Mobile: Status War paling bawah dari 3 utama */}
          <div className="card-stone p-5 md:p-6 flex flex-col justify-between shadow-xl border-t border-white/10 order-3 md:order-none">
            <h3 className="text-lg md:text-xl mb-4 text-center border-b border-white/10 pb-3 flex items-center justify-center font-clash tracking-wide">
              <ShieldIcon className="h-5 w-5 mr-2 text-coc-blue" /> {t.dashboard.warStatus}
            </h3>
            
            {currentWar && currentWar.state !== 'notInWar' ? (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mb-2">
                  <div className="bg-black/20 p-2 md:p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center">
                    <StarIcon className="text-2xl md:text-3xl text-coc-gold mb-1 filter drop-shadow-sm" />
                    <span className="block text-lg md:text-xl font-bold font-clash text-white">
                      {currentWar.clan.stars || 0}
                    </span>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">
                      {t.dashboard.myStars}
                    </p>
                  </div>
                  
                  <div className="bg-black/20 p-2 md:p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center">
                    <PercentageIcon className={`text-2xl md:text-3xl mb-1 filter drop-shadow-sm ${(currentWar.clan.destructionPercentage || 0) > (currentWar.opponent.destructionPercentage || 0) ? 'text-coc-green' : 'text-gray-400'}`} />
                    <span className="block text-lg md:text-xl font-bold font-clash text-white">
                      {(currentWar.clan.destructionPercentage || 0).toFixed(1)}%
                    </span>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">
                      {t.dashboard.destruction}
                    </p>
                  </div>

                  <div className="bg-black/20 p-2 md:p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center">
                    <StarIcon className="text-2xl md:text-3xl text-coc-red mb-1 filter drop-shadow-sm" />
                    <span className="block text-lg md:text-xl font-bold font-clash text-white">
                      {currentWar.opponent.stars || 0}
                    </span>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">
                      {t.dashboard.enemyStars}
                    </p>
                  </div>
                </div>
                
                <WarCountdown
                  targetTime={
                    currentWar.state === 'preparationDay'
                      ? currentWar.startTime
                      : currentWar.endTime
                  }
                  state={currentWar.state}
                />
                
                <Button
                  href={`/clan/manage`}
                  variant="secondary"
                  className="w-full mt-auto py-3 text-sm font-bold bg-white/5 hover:bg-white/10 border-white/10"
                >
                  {t.dashboard.viewWarDetails}
                </Button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                <ShieldIcon className="h-12 w-12 text-gray-600 mb-3 opacity-50" />
                <p className="text-gray-400 font-sans text-sm mb-6 max-w-[200px]">
                  {userProfile
                    ? t.dashboard.noWar
                    : t.dashboard.loginToViewWar}
                </p>
                <Button
                  href={userProfile ? '/clan/manage' : '/auth'}
                  variant="outline"
                  className="w-full border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10"
                >
                  {userProfile ? t.dashboard.viewClanPage : t.dashboard.loginNow}
                </Button>
              </div>
            )}
          </div>

          {/* ========== [BLOK 2: INFO KLAN PENGGUNA (ROMBAK UI)] ========== */}
          {/* Order 2 di Mobile: Info Klan di tengah */}
          <div className="card-stone p-5 md:p-6 flex flex-col justify-between shadow-xl border-t border-white/10 order-2 md:order-none">
            {managedClan ? (
              <>
                <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                  <div className="relative">
                    <Image
                        src={
                        managedClan.logoUrl ||
                        '/images/clan-badge-placeholder.png'
                        }
                        alt="Clan Badge"
                        width={60}
                        height={60}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-contain drop-shadow-lg"
                    />
                    {/* Badge level kecil di pojok */}
                    <div className="absolute -bottom-1 -right-1 bg-coc-stone text-[10px] px-1.5 py-0.5 rounded border border-coc-gold text-coc-gold font-bold">
                        {/* [FIX] Ganti level menjadi clanLevel */}
                        LVL {managedClan.clanLevel || 1}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-lg md:text-xl font-clash truncate">{managedClan.name}</h3>
                    <p className="text-xs md:text-sm text-coc-gold/80 font-bold font-mono tracking-wider">
                      {managedClan.tag}
                    </p>
                  </div>
                </div>

                {/* Daftar Statistik Klan Vertical yang lebih compact */}
                <div className="flex flex-col space-y-2 flex-grow justify-center mb-4">
                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <p className="text-xs uppercase text-gray-400 font-bold tracking-wider flex items-center gap-2">
                        <StarIcon className="h-3 w-3 text-coc-gold"/> {t.dashboard.reputation}
                    </p>
                    <span className="font-bold text-lg text-white font-clash">
                      {(clanReputation || 0).toFixed(1)} <span className="text-coc-gold">★</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <p className="text-xs uppercase text-gray-400 font-bold tracking-wider flex items-center gap-2">
                        <TrophyIcon className="h-3 w-3 text-coc-blue"/> {t.dashboard.avgTh}
                    </p>
                    <span className="font-bold text-lg text-white font-clash">
                      TH {(managedClan.avgTh || 0).toFixed(1)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <p className="text-xs uppercase text-gray-400 font-bold tracking-wider flex items-center gap-2">
                        <ShieldIcon className="h-3 w-3 text-gray-400"/> {t.dashboard.members}
                    </p>
                    <span className="font-bold text-lg text-white font-clash">
                      {managedClan.memberCount || 0}<span className="text-gray-500 text-sm">/50</span>
                    </span>
                  </div>
                </div>

                <Button
                  href={`/clan/internal/${managedClan.id}`}
                  variant="primary"
                  className="w-full mt-auto shadow-md"
                >
                  {t.dashboard.viewClanPage}
                </Button>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-4">
                <h3 className="text-lg font-clash mb-3 text-white">{t.dashboard.manageClanTitle}</h3>
                <p className="text-gray-400 font-sans text-sm mb-6 leading-relaxed">
                  {t.dashboard.manageClanDesc}
                </p>
                <Button
                  href={userProfile ? '/clan/manage' : '/auth'}
                  variant="primary"
                  className="w-full shadow-lg shadow-coc-gold/10"
                >
                  {userProfile ? t.dashboard.startManaging : t.dashboard.loginToStart}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (Side Info) */}
        {/* [MOBILE REORDER] Menggunakan 'contents' di mobile */}
        <div className="contents md:flex md:flex-col md:gap-6">
          
          {/* ========== [BLOK 3: RINGKASAN PROFIL (DINAMIS)] ========== */}
          {/* Order 1 di Mobile: Profil Paling Atas */}
          <div className="card-stone p-5 md:p-6 text-center shadow-xl border-t border-white/10 relative overflow-hidden order-1 md:order-none">
            {/* Hiasan background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold to-transparent opacity-50"></div>
            
            <h3 className="text-lg mb-4 font-clash tracking-wide">{t.dashboard.profileSummary}</h3>
            
            {userProfile ? (
              <>
                <div className="relative inline-block mb-3">
                    <Image
                    src={userProfile.avatarUrl || '/images/placeholder-avatar.png'}
                    alt="Avatar Pengguna"
                    width={80}
                    height={80}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-coc-stone-light object-cover shadow-lg relative z-10"
                    />
                    {/* Ring animasi sederhana */}
                    <div className="absolute inset-0 rounded-full border-4 border-coc-gold/30 animate-pulse z-0"></div>
                </div>
                
                {/* Gunakan displayName dari UserProfile (sesuai interface) */}
                <h4 className="text-xl font-bold text-white mb-1 truncate px-2">{userProfile.displayName}</h4>
                <p className="text-coc-gold text-xs font-bold uppercase tracking-widest mb-6 border border-coc-gold/20 rounded-full py-1 px-3 inline-block bg-coc-gold/5">
                    {userProfile.role}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.dashboard.thLevel}</p>
                    <span className="text-xl md:text-2xl font-bold text-white font-clash block">
                      {userProfile.thLevel || '-'}
                    </span>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t.dashboard.reputation}</p>
                    <span className="text-xl md:text-2xl font-bold text-coc-gold font-clash block">
                      {(userProfile.reputation || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <a
                  href="/profile"
                  className="block mt-auto text-sm text-coc-gold hover:text-white transition-colors font-bold tracking-wide py-2 hover:bg-white/5 rounded-lg"
                >
                  {t.dashboard.viewFullProfile} &rarr;
                </a>
              </>
            ) : (
              // Tampilan jika pengguna belum login
              <div className="flex-grow flex flex-col items-center justify-center py-6">
                <p className="text-gray-400 font-sans text-sm mb-6">
                  {t.dashboard.loginToViewProfile}
                </p>
                <Button href="/auth" variant="primary" className="w-full shadow-lg">
                  {t.dashboard.loginOrRegister}
                </Button>
              </div>
            )}
          </div>

          {/* ========== [BLOK 4: PENGUMUMAN (STATIS)] ========== */}
          {/* Order 4 di Mobile: Pengumuman Terakhir */}
          <div className="card-stone p-5 md:p-6 shadow-lg order-4 md:order-none">
            <h3 className="text-lg mb-4 border-b border-white/10 pb-2 font-clash flex items-center gap-2">
              <span className="text-coc-gold">📢</span> {t.dashboard.importantAnnouncements}
            </h3>
            <div className="space-y-3 font-sans">
              <a
                href="#"
                className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-colors border border-transparent hover:border-white/10 group"
              >
                <p className="text-sm text-gray-200 font-medium group-hover:text-coc-gold transition-colors">
                  Pembukaan Pendaftaran Liga Musim 3!
                </p>
                <span className="text-[10px] text-gray-500 mt-1 block uppercase tracking-wider">2 hari lalu</span>
              </a>
              <a
                href="#"
                className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-colors border border-transparent hover:border-white/10 group"
              >
                <p className="text-sm text-gray-200 font-medium group-hover:text-coc-gold transition-colors">
                  Update Game Terbaru: TH 17 Resmi Dirilis.
                </p>
                <span className="text-[10px] text-gray-500 mt-1 block uppercase tracking-wider">5 jam lalu</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}