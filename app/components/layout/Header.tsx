'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
// Menggunakan ShieldIcon
import {
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  UserCircleIcon,
  ShieldIcon,
  CheckCircleIcon, // <-- Tambahkan ikon notif
  TrophyIcon, // <-- [FASE 4] Tambahkan TrophyIcon
} from '@/app/components/icons';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import { useAuth } from '@/app/context/AuthContext'; // Konteks yang sudah diupdate
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/Button';
import { UserProfile, Notification } from '@/lib/clashub.types'; // <-- Tambahkan Notifikasi
import { ServerUser } from '@/lib/server-auth'; // Impor ServerUser
import { useNotifications } from '@/lib/hooks/useNotifications'; // <-- Import hook notifikasi

// [FIX FASE 2] Impor fungsi baru dari file store turnamen (client)
import { getManagedTournamentsForUserClient } from '@/lib/firestore/tournaments';

const navItems = [
  { name: 'Home', href: '/' },
  // PERBAIKAN KRITIS: Mengganti '/teamhub' menjadi '/clan-hub'
  { name: 'Team Hub', href: '/clan-hub' },
  { name: 'Tournament', href: '/tournament' },
  { name: 'Knowledge Hub', href: '/knowledge-hub' },
];

// Komponen menu dropdown profil pengguna (disesuaikan)
const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // [FIX FASE 2] Ambil 'currentUser' (untuk uid) selain 'userProfile'
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  // [FIX FASE 2] State baru untuk melacak status manajer turnamen
  const [isTournamentManager, setIsTournamentManager] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Gagal untuk logout:', error);
      // Ganti alert dengan cara lain jika perlu, karena alert diblokir
      console.error('Gagal melakukan logout. Silakan coba lagi.');
    } finally {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // [BARU - FASE 2] useEffect untuk memeriksa status manajer turnamen
  useEffect(() => {
    // Reset status saat user berganti atau logout
    setIsTournamentManager(false);

    if (currentUser?.uid) {
      // Panggil fungsi client-side yang kita buat di lib/firestore/tournaments.ts
      getManagedTournamentsForUserClient(currentUser.uid)
        .then((tournaments) => {
          // Jika user mengelola > 0 turnamen, tampilkan link
          if (tournaments.length > 0) {
            setIsTournamentManager(true);
          }
        })
        .catch((err) => {
          // Jangan blok UI, cukup log error di konsol
          console.error('Gagal memeriksa status manajer turnamen:', err);
        });
    }
  }, [currentUser?.uid]); // Dependensi effect adalah currentUser.uid

  // --- PERBAIKAN LOGIKA: Sederhanakan Pengecekan Menu Klan ---
  // ... (sisa logika type guard tidak berubah)
  const isCompleteUserProfile = (
    profile: UserProfile | ServerUser | null,
  ): profile is UserProfile => {
    return (
      !!profile &&
      'isVerified' in profile &&
      'clanId' in profile &&
      'role' in profile
    );
  };

  let showClanLink = false;
  let avatarSrc: string | null = null;

  if (isCompleteUserProfile(userProfile)) {
    showClanLink = userProfile.isVerified === true && !!userProfile.clanTag;
    avatarSrc = userProfile.avatarUrl || null;
  }
  // --- AKHIR PERBAIKAN LOGIKA ---

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center rounded-full bg-coc-stone-light hover:ring-2 hover:ring-coc-gold transition-all"
      >
        {/* Fallback ke placeholder jika avatarSrc null atau kosong */}
        <img
          src={avatarSrc || '/images/placeholder-avatar.png'}
          alt="User Avatar"
          className="rounded-full h-8 w-8 object-cover"
          onError={(e) => {
            // Fallback jika avatarUrl gagal dimuat
            e.currentTarget.onerror = null; // Prevent infinite loop
            e.currentTarget.src = '/images/placeholder-avatar.png';
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 card-stone p-2 shadow-lg rounded-md z-50">
          <ul className="space-y-1">
            <li>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
              >
                <UserCircleIcon className="h-5 w-5" />
                <span>Profil Saya</span>
              </Link>
            </li>

            {/* Tampilkan Link "Klan" secara kondisional */}
            {showClanLink && (
              <li>
                <Link
                  // PENTING: Jika clanId tidak ada, ini akan diarahkan ke /clan/manage tanpa ID.
                  // Namun, page.tsx akan menangani redirect/error jika clanId tidak ditemukan.
                  href="/clan/manage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
                >
                  {/* Menggunakan ShieldIcon */}
                  <ShieldIcon className="h-5 w-5" />
                  <span>Klan</span>
                </Link>
              </li>
            )}

            {/* --- [PERBAIKAN FASE 2] --- */}
            {/* Tautan Manajemen Turnamen (Render Bersyarat) */}
            {isTournamentManager && (
              <li>
                <Link
                  href="/my-tournaments"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
                >
                  <TrophyIcon className="h-5 w-5" />
                  <span>Manajemen Turnamen</span>
                </Link>
              </li>
            )}
            {/* --- [AKHIR PERBAIKAN FASE 2] --- */}

            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-coc-red/10 hover:text-red-300 rounded-md"
              >
                <LogOutIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

// --- [KOMPONEN BARU: TAHAP 1.5] ---
// Komponen Lonceng Notifikasi Dinamis
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentUser } = useAuth(); // Hanya cek login
  const { notifications, unreadCount, isLoading, markAsRead } =
    useNotifications(); // Gunakan hook

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Jangan tampilkan lonceng jika user belum login
  if (!currentUser) {
    return null;
  }

  const handleNotifClick = (notif: Notification) => {
    // Tandai sudah dibaca (optimistic update)
    if (!notif.read) {
      markAsRead(notif.id);
    }
    // Arahkan ke URL
    if (notif.url) {
      router.push(notif.url);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-300 hover:text-coc-gold transition-colors relative"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 md:w-80 max-h-[400px] overflow-y-auto card-stone shadow-lg rounded-md z-50">
          <div className="p-3 border-b border-coc-gold-dark/30">
            <h4 className="font-clash text-lg text-white">Notifikasi</h4>
          </div>
          {isLoading && (
            <div className="p-4 text-center text-gray-400">
              Memuat notifikasi...
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Tidak ada notifikasi baru.
            </div>
          )}
          <ul className="divide-y divide-coc-gold-dark/20">
            {notifications.map((notif) => (
              <li key={notif.id}>
                <a
                  href={notif.url || '#'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNotifClick(notif);
                  }}
                  className={`flex items-start gap-3 p-3 transition-colors ${
                    notif.read
                      ? 'opacity-60 hover:bg-coc-stone-light/30'
                      : 'bg-coc-blue/10 hover:bg-coc-blue/20'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notif.read ? (
                      <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <div className="h-4 w-4 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-coc-blue"></span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- [KOMPONEN HEADER UTAMA: TAHAP 1.5] ---
const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ambil currentUser DAN loading state untuk header utama
  const { currentUser, loading: authLoading } = useAuth();

  // Tampilkan state loading awal jika diperlukan
  // if (authLoading) {
  //    // Opsional: Tampilkan skeleton UI atau null selama auth loading awal
  //   return <header className="sticky top-0 z-50 h-[68px] bg-coc-stone/80"></header>;
  // }

  return (
    <header className="sticky top-0 z-50 bg-coc-stone/80 backdrop-blur-sm border-b-2 border-coc-gold-dark/30 animate-header-glow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo - Menerapkan font-clash */}
        <Link
          href="/"
          className="font-clash text-3xl text-coc-gold z-20"
          style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}
        >
          CLASHUB
        </Link>

        {/* Navigasi Utama (Desktop) */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                    px-4 py-2 rounded-md text-sm font-bold transition-all duration-300
                    ${
                      pathname === item.href
                        ? 'bg-coc-gold text-coc-stone shadow-lg shadow-coc-gold/20' // <-- [PERBAIKAN] Mengganti inset shadow dengan drop shadow
                        : 'text-gray-300 hover:bg-coc-stone-light/50 hover:text-white'
                    }
                  `}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Aksi Pengguna (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <button className="text-gray-300 hover:text-coc-gold transition-colors">
            <SearchIcon className="h-6 w-6" />
          </button>

          {/* --- [PERUBAHAN TAHAP 1.5] --- */}
          {/* Ganti ikon statis dengan komponen dinamis */}
          <NotificationBell />
          {/* --- [AKHIR PERUBAHAN] --- */}

          <div className="w-px h-6 bg-coc-gold-dark/50"></div>

          {/* Render tombol login atau menu profil secara kondisional */}
          {/* Tambahkan cek authLoading di sini juga */}
          {!authLoading &&
            (currentUser ? (
              <UserProfileDropdown />
            ) : (
              <Button href="/auth" variant="primary" size="md">
                Login
              </Button>
            ))}
          {/* Opsional: Tampilkan placeholder/spinner jika loading */}
          {authLoading && (
            <div className="h-9 w-9 rounded-full bg-coc-stone-light animate-pulse"></div>
          )}
        </div>

        {/* Tombol Menu Mobile */}
        <div className="md:hidden z-20">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-300 hover:text-coc-gold"
          >
            {isMenuOpen ? (
              <XIcon className="h-7 w-7" />
            ) : (
              <MenuIcon className="h-7 w-7" />
            )}
          </button>
        </div>

        {/* Menu Overlay Mobile */}
        {isMenuOpen && (
          <div className="absolute inset-0 bg-coc-stone/95 backdrop-blur-md flex flex-col items-center justify-center md:hidden">
            <nav className="flex flex-col items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-2xl font-bold ${
                    pathname === item.href
                      ? 'text-coc-gold'
                      : 'text-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex items-center gap-6">
              <ThemeToggle />
              <button className="text-gray-300 hover:text-coc-gold transition-colors">
                <SearchIcon className="h-7 w-7" />
              </button>

              {/* --- [PERUBAHAN TAHAP 1.5 (Mobile)] --- */}
              <NotificationBell />
              {/* --- [AKHIR PERUBAHAN] --- */}

              {/* Logika kondisional untuk mobile */}
              {!authLoading && ( // Cek loading juga di mobile
                currentUser ? (
                  <UserProfileDropdown />
                ) : (
                  <Button
                    href="/auth"
                    variant="primary"
                    size="md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Button>
                )
              )}
              {/* Opsional: Placeholder loading mobile */}
              {authLoading && (
                <div className="h-9 w-9 rounded-full bg-coc-stone-light animate-pulse"></div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;