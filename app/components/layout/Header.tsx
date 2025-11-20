'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  UserCircleIcon,
  ShieldIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '@/app/components/icons';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import LanguageSwitcher from '@/app/components/ui/LanguageSwitcher'; // Import Component
import { useAuth } from '@/app/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/Button';
import { UserProfile, Notification } from '@/lib/clashub.types';
import { ServerUser } from '@/lib/server-auth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getManagedTournamentsForUserClient } from '@/lib/firestore/tournaments';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Team Hub', href: '/clan-hub' },
  { name: 'Tournament', href: '/tournament' },
  { name: 'Knowledge Hub', href: '/knowledge-hub' },
];

// Komponen menu dropdown profil pengguna
const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // [OLD CODE LOGIC RESTORED]
  // Menggunakan logika state yang sama dengan versi lama
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [isTournamentManager, setIsTournamentManager] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Gagal untuk logout:', error);
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

  useEffect(() => {
    // Reset status saat user berganti atau logout
    setIsTournamentManager(false);

    if (currentUser?.uid) {
      getManagedTournamentsForUserClient(currentUser.uid)
        .then((tournaments) => {
          if (tournaments.length > 0) {
            setIsTournamentManager(true);
          }
        })
        .catch((err) => {
          console.error('Gagal memeriksa status manajer turnamen:', err);
        });
    }
  }, [currentUser?.uid]);

  // [LOGIKA LAMA DIKEMBALIKAN - LEBIH KETAT & STABIL]
  // Pengecekan tipe yang ketat untuk memastikan semua properti ada sebelum render
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

  // [LOGIKA LAMA DIKEMBALIKAN]
  // Hanya tampilkan link klan jika Verified DAN punya ClanTag
  if (isCompleteUserProfile(userProfile)) {
    showClanLink = userProfile.isVerified === true && !!userProfile.clanTag;
    avatarSrc = userProfile.avatarUrl || null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center rounded-full bg-coc-stone-light hover:ring-2 hover:ring-coc-gold transition-all"
      >
        <img
          src={avatarSrc || '/images/placeholder-avatar.png'}
          alt="User Avatar"
          className="rounded-full h-8 w-8 object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/placeholder-avatar.png';
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 card-stone p-2 shadow-lg rounded-md z-50 border border-coc-gold/20">
          <ul className="space-y-1">
            <li>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
              >
                <UserCircleIcon className="h-5 w-5 text-coc-gold" />
                <span>Profil Saya</span>
              </Link>
            </li>

            {/* Tampilkan Link "Klan" secara kondisional (Logic Lama) */}
            {showClanLink && (
              <li>
                <Link
                  href="/clan/manage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
                >
                  <ShieldIcon className="h-5 w-5 text-coc-blue" />
                  <span>Klan</span>
                </Link>
              </li>
            )}

            {isTournamentManager && (
              <li>
                <Link
                  href="/my-tournaments"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-300 hover:bg-coc-gold/10 hover:text-white rounded-md"
                >
                  <TrophyIcon className="h-5 w-5 text-coc-orange" />
                  <span>Manajemen Turnamen</span>
                </Link>
              </li>
            )}

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

// Komponen Lonceng Notifikasi Dinamis (TIDAK BERUBAH)
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentUser } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();

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

  if (!currentUser) {
    return null;
  }

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.url) {
      router.push(notif.url);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-300 hover:text-coc-gold transition-colors relative p-1"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-[10px] font-bold text-white border border-coc-stone">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto card-stone shadow-xl rounded-md z-50 border border-coc-gold/20 scrollbar-thin scrollbar-thumb-coc-gold/30 scrollbar-track-transparent">
          <div className="p-3 border-b border-coc-gold-dark/30 sticky top-0 bg-coc-stone/95 backdrop-blur z-10 flex justify-between items-center">
            <h4 className="font-clash text-lg text-white">Notifikasi</h4>
            {unreadCount > 0 && (
               <span className="text-xs text-coc-gold">{unreadCount} baru</span>
            )}
          </div>
          
          {isLoading && (
            <div className="p-6 text-center text-gray-400 animate-pulse">
              Memuat notifikasi...
            </div>
          )}
          
          {!isLoading && notifications.length === 0 && (
            <div className="p-6 text-center flex flex-col items-center gap-2 text-gray-400">
              <BellIcon className="h-8 w-8 opacity-20" />
              <p className="text-sm">Tidak ada notifikasi baru</p>
            </div>
          )}
          
          <ul className="divide-y divide-coc-gold-dark/20">
            {notifications.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-3 p-3 transition-colors ${
                    notif.read
                      ? 'bg-transparent hover:bg-coc-stone-light/20 opacity-70'
                      : 'bg-coc-blue/5 hover:bg-coc-blue/15 border-l-2 border-coc-blue'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notif.read ? (
                      <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-coc-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm line-clamp-2 ${notif.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {new Date(notif.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, loading: authLoading } = useAuth();

  // Effect untuk menutup menu saat route berubah
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Effect untuk mencegah scroll body saat menu terbuka
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-coc-stone/95 backdrop-blur-md border-b border-coc-gold-dark/30 shadow-lg h-[72px]">
        <div className="container mx-auto flex items-center justify-between h-full px-4">
          
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3 z-20 hover:opacity-90 transition-opacity group"
          >
            <div className="relative h-10 w-10 md:h-12 md:w-12 transition-transform group-hover:scale-105">
                <Image
                src="/images/logoClashub.png"
                alt="Clashub Logo"
                fill
                sizes="(max-width: 768px) 40px, 48px"
                className="object-contain drop-shadow-md"
                priority
                />
            </div>
            <span
              className="font-clash text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-b from-coc-gold to-coc-gold-dark drop-shadow-sm"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              CLASHUB
            </span>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                      px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all duration-300
                      ${
                        pathname === item.href
                          ? 'text-coc-gold bg-coc-stone-light/50 shadow-[0_0_10px_rgba(255,215,0,0.1)] border border-coc-gold/20'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Aksi Pengguna Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
                {/* Tambahkan LanguageSwitcher Di Sini */}
                <LanguageSwitcher />
                <ThemeToggle />
                <button className="p-2 text-gray-300 hover:text-coc-gold transition-colors rounded-full hover:bg-white/5">
                <SearchIcon className="h-5 w-5" />
                </button>
                <NotificationBell />
            </div>

            <div className="w-px h-8 bg-gradient-to-b from-transparent via-coc-gold-dark/40 to-transparent"></div>

            {!authLoading &&
              (currentUser ? (
                <UserProfileDropdown />
              ) : (
                <Button href="/auth" variant="primary" size="sm" className="min-w-[100px]">
                  Login
                </Button>
              ))}
            
            {authLoading && (
              <div className="h-9 w-9 rounded-full bg-coc-stone-light animate-pulse ring-1 ring-white/10"></div>
            )}
          </div>

          {/* Tombol Menu Mobile */}
          <div className="md:hidden flex items-center gap-4 z-20">
            {/* Tampilkan Lonceng di Header Mobile juga agar mudah diakses */}
            {!isMenuOpen && <NotificationBell />}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-coc-gold transition-colors p-1 active:scale-95"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XIcon className="h-8 w-8" />
              ) : (
                <MenuIcon className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Overlay Mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[72px] z-40 bg-coc-stone/95 backdrop-blur-xl border-t border-white/5 md:hidden flex flex-col animate-fade-in">
          <nav className="flex flex-col p-6 gap-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`
                    flex items-center justify-between p-4 rounded-xl text-lg font-bold border transition-all
                    ${
                    pathname === item.href
                        ? 'text-coc-gold bg-coc-gold/10 border-coc-gold/30 shadow-[inset_0_0_15px_rgba(255,215,0,0.1)]'
                        : 'text-gray-300 border-transparent hover:bg-white/5 hover:text-white'
                    }
                `}
              >
                {item.name}
                {pathname === item.href && <div className="h-2 w-2 rounded-full bg-coc-gold shadow-[0_0_8px_#FFD700]"></div>}
              </Link>
            ))}

            <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Aksi Mobile */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-gray-400 text-sm font-medium">Preferensi</span>
                    <div className="flex items-center gap-4">
                        {/* Tambahkan LanguageSwitcher Mobile Di Sini */}
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <button className="flex items-center gap-2 text-gray-300 hover:text-coc-gold transition-colors">
                            <SearchIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {!authLoading && (
                    currentUser ? (
                        <div className="mt-2">
                           <div className="bg-coc-stone-light/30 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                     <div className="h-10 w-10 rounded-full bg-coc-stone-light flex items-center justify-center ring-1 ring-coc-gold/30">
                                        <UserCircleIcon className="h-6 w-6 text-gray-400"/>
                                     </div>
                                     <div>
                                        <p className="text-white font-bold">Menu Akun</p>
                                        <p className="text-xs text-gray-400">Kelola profil & klan</p>
                                     </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {/* Kita render menu dropdown versi mobile yang diexpand */}
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-300 text-sm">
                                        <UserCircleIcon className="h-5 w-5"/> Profil Saya
                                    </Link>
                                    {/* [LOGIKA LAMA KEMBALI] Menu ini tidak muncul jika logika isCompleteUserProfile gagal */}
                                    <Link href="/clan/manage" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-300 text-sm">
                                        <ShieldIcon className="h-5 w-5"/> Klan Saya
                                    </Link>
                                     <Link href="/my-tournaments" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-gray-300 text-sm">
                                        <TrophyIcon className="h-5 w-5"/> Turnamen
                                     </Link>
                                    <button 
                                        onClick={() => {
                                            signOut(auth);
                                            setIsMenuOpen(false);
                                            router.push('/');
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-coc-red/10 text-red-400 text-sm w-full text-left mt-2 border-t border-white/5 pt-4"
                                    >
                                        <LogOutIcon className="h-5 w-5"/> Logout
                                    </button>
                                </div>
                           </div>
                        </div>
                    ) : (
                        <Button
                        href="/auth"
                        variant="primary"
                        size="lg"
                        className="w-full justify-center shadow-lg shadow-coc-gold/10"
                        onClick={() => setIsMenuOpen(false)}
                        >
                        Login / Register
                        </Button>
                    )
                )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;