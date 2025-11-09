// File: app/tournament/[tournamentId]/manage/page.tsx
// Deskripsi: [FASE 5] Halaman "Control Room" untuk panitia.
// Berisi Server Component untuk validasi keamanan dan Client Component untuk layout tab.

import React, { useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import {
  ChevronLeftIcon,
  UsersIcon,
  UsersCogIcon,
  TrophyIcon,
  SettingsIcon,
  AlertTriangleIcon,
  MenuIcon,
  XIcon,
} from '@/app/components/icons';
import Image from 'next/image';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification'; // <-- [FASE 5] Impor Notifikasi

// =========================================================================
// Client Component (Untuk mengelola State Tab)
// Kita meniru pola dari ManageClanClient.tsx
// =========================================================================
'use client';

type ActiveTab = 'participants' | 'staff' | 'bracket' | 'settings';

// [FASE 5] Impor komponen-komponen baru
import StaffManager from './StaffManager';
import ParticipantManager from './ParticipantManager';
import BracketGenerator from './BracketGenerator'; // <-- [FASE 5] Impor BracketGenerator
import ScheduleManager from './ScheduleManager'; // <-- [FASE 5] Tambahkan impor ini

interface ManageTournamentClientProps {
  tournament: FirestoreDocument<Tournament>;
  isOrganizer: boolean; // <-- [FASE 5] Tambahkan prop ini
}

const ManageTournamentClient: React.FC<ManageTournamentClientProps> = ({
  tournament,
  isOrganizer, // <-- [FASE 5] Ambil prop ini
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // [FASE 5] State Notifikasi untuk handle refresh
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  // [FASE 5] Fungsi untuk handle refresh (e.g., SWR revalidate)
  // Untuk saat ini, kita hanya tampilkan notifikasi
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

  // Daftar Tab untuk Manajemen Turnamen
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

  // Utility: Tombol Menu Sidebar (dikutip dari ManageClanClient)
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

  // Render Konten Tab Sesuai Pilihan
  const renderContent = () => {
    switch (activeTab) {
      case 'participants':
        // [FASE 5] Ganti placeholder dengan komponen ParticipantManager
        return <ParticipantManager tournament={tournament} />;
      case 'staff':
        // [FASE 5] Ganti placeholder dengan komponen StaffManager
        return (
          <StaffManager tournament={tournament} isOrganizer={isOrganizer} />
        );
      case 'bracket':
        // [FASE 5] Ganti placeholder dengan komponen BracketGenerator
        return (
          // [FASE 5] Bungkus dalam Fragment agar bisa merender 2 komponen
          <React.Fragment>
            <BracketGenerator
              tournament={tournament}
              onBracketGenerated={handleRefreshData}
            />
            {/* [FASE 5] Tambahkan ScheduleManager di bawah generator */}
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
      {/* [FASE 5] Tambahkan komponen Notifikasi di level client */}
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

// =========================================================================
// Server Component (Data Fetching & Validasi Keamanan)
// =========================================================================

// Komponen Error Sederhana
const ErrorDisplay = ({ message }: { message: string }) => (
  <main className="container mx-auto p-4 md:p-8 mt-10 min-h-[60vh]">
    <div className="flex justify-center items-center">
      <div className="card-stone p-8 max-w-lg text-center rounded-lg border-2 border-coc-red/50 bg-coc-red/10">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
        <h2 className="text-2xl text-coc-red font-clash mb-4">Akses Ditolak</h2>
        <p className="text-gray-300 mb-6 font-sans">{message}</p>
        <Button href="/my-tournaments" variant="primary">
          Kembali ke Hub
        </Button>
      </div>
    </div>
  </main>
);

export default async function ManageTournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { tournamentId } = params;

  // 1. Ambil Sesi User
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/auth'); // Wajib login
  }

  // 2. Ambil Data Turnamen
  const tournament = await getTournamentByIdAdmin(tournamentId);
  if (!tournament) {
    return <ErrorDisplay message="Turnamen tidak ditemukan." />;
  }

  // 3. Validasi Keamanan (ROADMAP FASE 5)
  // Hanya bisa diakses oleh organizerUid ATAU committeeUids
  const isOrganizer = tournament.organizerUid === sessionUser.uid;
  const isCommittee = tournament.committeeUids.includes(sessionUser.uid);

  if (!isOrganizer && !isCommittee) {
    return (
      <ErrorDisplay message="Anda bukan panitia atau organizer turnamen ini." />
    );
  }

  // 4. Render Client Component dengan data turnamen
  // [FASE 5] Kirim prop isOrganizer ke client component
  return (
    <ManageTournamentClient tournament={tournament} isOrganizer={isOrganizer} />
  );
}