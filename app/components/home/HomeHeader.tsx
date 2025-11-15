// [BARU] "use client" diperlukan untuk logic countdown (useEffect, useState)
'use client';

import { Button } from '@/app/components/ui/Button';
import {
  TrophyIcon,
  SkullIcon,
  PercentageIcon,
  ShieldIcon,
  StarIcon, // [BARU] Impor StarIcon
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

  useEffect(() => {
    // Update timer setiap detik
    const timer = setInterval(() => {
      setTimeLeft(formatWarTime(targetDate));
    }, 1000);

    // Bersihkan interval saat komponen unmount
    return () => clearInterval(timer);
  }, [targetTime]); // Hanya re-run jika targetTime berubah

  const textLabel =
    state === 'preparationDay' ? 'War Berikutnya Dimulai:' : 'War Berakhir Dalam:';

  return (
    <>
      <p className="text-center text-gray-400 text-sm font-sans">
        {textLabel}
      </p>
      <div className="text-center text-4xl font-clash text-coc-gold-dark my-2">
        {timeLeft}
      </div>
    </>
  );
};

// [PERBAIKAN] Komponen sekarang menerima props dinamis
export default function HomeHeader({
  userProfile,
  currentWar,
  managedClan,
  clanReputation, // [BARU] Terima prop reputasi
}: HomeHeaderProps) {
  return (
    <>
      {/* Hero Banner Section (Tidak Berubah) */}
      <section className="relative h-[400px] bg-hero-banner bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 p-4">
          <h1 className="text-4xl md:text-5xl mb-4">
            Pusat Strategi & Komunitas E-sports CLASH OF CLANS
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Pimpin Klan Anda menuju Kemenangan! Temukan tim, strategi, dan
            analisis turnamen terbaik.
          </p>
          <Button href="/clan-hub" variant="primary" size="lg">
            TEMUKAN TIM SEKARANG!
          </Button>
        </div>
      </section>

      {/* Top Section - [PERBAIKAN UI] Menambahkan container, padding (px, py) untuk spasi dari tepi layar dan banner */}
      <section className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12 py-8 px-4">
        {/* Kolom Kiri & Tengah (Status Panel) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* ========== [BLOK 1: STATUS WAR (DINAMIS)] ========== */}
          {/* Card ini tidak diubah */}
          <div className="card-stone p-6 flex flex-col justify-between">
            <h3 className="text-xl mb-4 text-center border-b-2 border-coc-gold-dark/30 pb-2 flex items-center justify-center">
              <ShieldIcon className="h-5 w-5 mr-2" /> STATUS WAR CLAN
            </h3>
            {currentWar && currentWar.state !== 'notInWar' ? (
              <>
                <div className="grid grid-cols-3 gap-4 text-center my-4">
                  <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                    <StarIcon className="mx-auto text-3xl text-coc-gold mb-2" />
                    <span className="block text-xl font-bold font-clash text-white">
                      {currentWar.clan.stars || 0}
                    </span>
                    <p className="text-xs text-gray-400 uppercase font-sans">
                      Bintang Kita
                    </p>
                  </div>
                  <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                    <StarIcon className="mx-auto text-3xl text-coc-red mb-2" />
                    <span className="block text-xl font-bold font-clash text-white">
                      {currentWar.opponent.stars || 0}
                    </span>
                    <p className="text-xs text-gray-400 uppercase font-sans">
                      Bintang Musuh
                    </p>
                  </div>
                  <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                    <PercentageIcon className="mx-auto text-3xl text-coc-green mb-2" />
                    <span className="block text-xl font-bold font-clash text-white">
                      {(currentWar.clan.destructionPercentage || 0).toFixed(2)}%
                    </span>
                    <p className="text-xs text-gray-400 uppercase font-sans">
                      Destruction
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
                  className="w-full mt-4"
                >
                  Lihat Detail War
                </Button>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center my-4">
                <p className="text-gray-400 font-sans mb-4">
                  {userProfile
                    ? 'Klan Anda sedang tidak dalam war.'
                    : 'Login dan kelola klan Anda untuk melihat status war.'}
                </p>
                <Button
                  href={userProfile ? '/clan/manage' : '/auth'}
                  variant="secondary"
                  className="w-full mt-4"
                >
                  {userProfile ? 'Lihat Halaman Klan' : 'Login Sekarang'}
                </Button>
              </div>
            )}
          </div>

          {/* ========== [BLOK 2: INFO KLAN PENGGUNA (ROMBAK UI)] ========== */}
          <div className="card-stone p-6 flex flex-col justify-between">
            {/* Cek jika pengguna sudah mengelola klan */}
            {managedClan ? (
              <>
                {/* Header Info Klan (Logo, Nama, Tag) - Tidak berubah */}
                <div className="flex items-center gap-4 border-b border-coc-gold-dark/30 pb-4 mb-4">
                  <Image
                    src={
                      managedClan.logoUrl ||
                      '/images/clan-badge-placeholder.png'
                    }
                    alt="Clan Badge"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg border-2 border-coc-gold object-cover flex-shrink-0 shadow-lg"
                  />
                  <div>
                    <h3 className="text-xl">{managedClan.name}</h3>
                    <p className="text-sm text-coc-gold-dark font-bold font-mono">
                      {managedClan.tag}
                    </p>
                  </div>
                </div>

                {/* ============================================================
                  [ROMBAK UI] Mengganti Grid 2x2 menjadi Daftar Vertikal 1x4
                  - Menggunakan `space-y-4` untuk jarak
                  - Menggunakan `flex justify-between` untuk layout per baris
                  - Font angka diperbesar ke `text-2xl`
                  - Menambah `justify-center` agar daftar terpusat secara vertikal
                  ============================================================
                */}
                <div className="flex flex-col space-y-4 flex-grow justify-center py-2">
                  {/* [BARU] Item Reputasi */}
                  <div className="flex justify-between items-baseline bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/20">
                    <p className="text-sm uppercase text-gray-400 font-sans">
                      Reputasi Clan
                    </p>
                    <span className="font-bold text-2xl text-coc-gold font-clash">
                      {(clanReputation || 0).toFixed(1)} ★
                    </span>
                  </div>

                  {/* [BARU] Item Rata-rata TH */}
                  <div className="flex justify-between items-baseline bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/20">
                    <p className="text-sm uppercase text-gray-400 font-sans">
                      Rata-rata TH
                    </p>
                    <span className="font-bold text-2xl text-coc-gold font-clash">
                      TH {(managedClan.avgTh || 0).toFixed(1)}
                    </span>
                  </div>

                  {/* [BARU] Item Anggota */}
                  <div className="flex justify-between items-baseline bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/20">
                    <p className="text-sm uppercase text-gray-400 font-sans">
                      Anggota
                    </p>
                    <span className="font-bold text-2xl text-coc-gold font-clash">
                      {managedClan.memberCount || 0}/50
                    </span>
                  </div>

                  {/* [BARU] Item War Wins */}
                  <div className="flex justify-between items-baseline bg-coc-stone/50 p-3 rounded-lg border border-coc-gold-dark/20">
                    <p className="text-sm uppercase text-gray-400 font-sans">
                      War Wins
                    </p>
                    <span className="font-bold text-2xl text-gray-500 font-clash">
                      N/A
                    </span>
                  </div>
                </div>
                {/* ============================================================
                  [AKHIR ROMBAK UI]
                  ============================================================
                */}

                <Button
                  // [DINAMIS] Link ke halaman klan internal
                  href={`/clan/internal/${managedClan.id}`}
                  variant="secondary"
                  className="w-full mt-4"
                >
                  Lihat Halaman Klan
                </Button>
              </>
            ) : (
              // Tampilan jika pengguna belum mengelola klan
              <div className="flex-grow flex flex-col items-center justify-center text-center my-4">
                <h3 className="text-xl mb-4">KELOLA KLAN ANDA</h3>
                <p className="text-gray-400 font-sans mb-4">
                  Tautkan dan kelola klan Anda untuk membuka fitur analisis
                  perang, manajemen anggota, dan lainnya.
                </p>
                <Button
                  href={userProfile ? '/clan/manage' : '/auth'}
                  variant="primary"
                  className="w-full mt-4"
                >
                  {userProfile ? 'Mulai Kelola Klan' : 'Login untuk Mulai'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (Side Info) */}
        <div className="space-y-6 md:space-y-8">
          {/* ========== [BLOK 3: RINGKASAN PROFIL (DINAMIS)] ========== */}
          <div className="card-stone p-6 text-center">
            {/* [PERBAIKAN JUDUL] Diubah sesuai permintaan */}
            <h3 className="text-xl mb-4">RINGKASAN PROFIL </h3>
            {/* Cek jika pengguna sudah login */}
            {userProfile ? (
              <>
                <Image
                  // [DINAMIS] Avatar
                  src={
                    userProfile.avatarUrl || '/images/placeholder-avatar.png'
                  }
                  alt="Avatar Pengguna"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold object-cover"
                />
                <div className="flex justify-around mt-4 font-clash">
                  <div>
                    <p className="text-xs text-gray-400 font-sans">TH LEVEL</p>
                    {/* [DINAMIS] TH Level */}
                    <span className="text-2xl font-bold text-white">
                      {userProfile.thLevel || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-sans">REPUTASI</p>
                    {/* [DINAMIS] Reputasi */}
                    <span className="text-2xl font-bold text-coc-gold">
                      {/* [PERBAIKAN] Tambahkan fallback 0 sebelum .toFixed() */}
                      {(userProfile.reputation || 0).toFixed(1)} ★
                    </span>
                  </div>
                </div>
                <a
                  href="/profile"
                  className="block mt-4 text-sm text-coc-gold hover:underline font-sans"
                >
                  Lihat Profil Lengkap &rarr;
                </a>
              </>
            ) : (
              // Tampilan jika pengguna belum login
              <div className="flex-grow flex flex-col items-center justify-center py-4">
                <p className="text-gray-400 font-sans mb-4">
                  Login untuk melihat ringkasan profil dan E-Sports CV Anda.
                </p>
                <Button href="/auth" variant="primary" className="w-full">
                  Login atau Daftar
                </Button>
              </div>
            )}
          </div>

          {/* ========== [BLOK 4: PENGUMUMAN (STATIS - Sesuai Peta)] ========== */}
          <div className="card-stone p-6">
            <h3 className="text-lg mb-4 border-b border-coc-gold-dark/30 pb-2">
              PENGUMUMAN PENTING
            </h3>
            <div className="space-y-4 font-sans">
              <a
                href="/news/1"
                className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors"
              >
                <p className="text-gray-300">
                  Pembukaan Pendaftaran Liga Musim 3!
                </p>
                <span className="text-xs text-gray-400">2 hari lalu</span>
              </a>
              <a
                href="/news/2"
                className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors"
              >
                <p className="text-gray-300">
                  Update Game Terbaru: TH 17 Resmi Dirilis.
                </p>
                <span className="text-xs text-gray-400">5 jam lalu</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}