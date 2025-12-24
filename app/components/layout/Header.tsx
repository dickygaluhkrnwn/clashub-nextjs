'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  BellIcon,
  SearchIcon,
  LogOutIcon,
  UserCircleIcon,
  ShieldIcon,
  CheckCircleIcon,
  TrophyIcon,
  HomeIcon,
  BookOpenIcon
} from '@/app/components/icons';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import LanguageSwitcher from '@/app/components/ui/LanguageSwitcher';
import { useAuth } from '@/app/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/Button';
import { UserProfile, Notification } from '@/lib/clashub.types';
import { ServerUser } from '@/lib/server-auth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getManagedTournamentsForUserClient } from '@/lib/firestore/tournaments';

// Mapping Nav Items dengan Icon (Hanya digunakan untuk Desktop sekarang)
const navItems = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Team Hub', href: '/clan-hub', icon: ShieldIcon },
  { name: 'Tournament', href: '/tournament', icon: TrophyIcon },
  { name: 'Knowledge Hub', href: '/knowledge-hub', icon: BookOpenIcon },
];

// Komponen menu dropdown profil pengguna (Desktop)
const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center rounded-full bg-coc-stone-light hover:ring-2 hover:ring-coc-gold transition-all overflow-hidden"
      >
        <img
          src={avatarSrc || '/images/placeholder-avatar.png'}
          alt="User Avatar"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/placeholder-avatar.png';
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 card-stone p-2 shadow-lg rounded-md z-50 border border-coc-gold/20 animate-in fade-in zoom-in-95 duration-100">
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

            <div className="my-1 border-t border-white/10"></div>

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

// Komponen Lonceng Notifikasi
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
        className="text-gray-300 hover:text-coc-gold transition-colors relative p-1.5 rounded-full hover:bg-white/5"
      >
        <BellIcon className="h-6 w-6 md:h-5 md:w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-[10px] font-bold text-white border border-coc-stone animate-bounce-short">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 md:mt-2 w-[85vw] md:w-80 max-h-[60vh] md:max-h-[400px] overflow-y-auto card-stone shadow-xl rounded-lg z-50 border border-coc-gold/20 scrollbar-thin scrollbar-thumb-coc-gold/30 scrollbar-track-transparent">
          <div className="p-3 border-b border-coc-gold-dark/30 sticky top-0 bg-coc-stone/95 backdrop-blur z-10 flex justify-between items-center">
            <h4 className="font-clash text-lg text-white">Notifikasi</h4>
            {unreadCount > 0 && (
               <span className="text-xs text-coc-gold bg-coc-gold/10 px-2 py-0.5 rounded-full border border-coc-gold/20">{unreadCount} baru</span>
            )}
          </div>
          
          {isLoading && (
            <div className="p-6 text-center text-gray-400 animate-pulse text-sm">
              Memuat notifikasi...
            </div>
          )}
          
          {!isLoading && notifications.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-3 text-gray-400">
              <BellIcon className="h-10 w-10 opacity-20" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          )}
          
          <ul className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-3 p-4 md:p-3 transition-colors ${
                    notif.read
                      ? 'bg-transparent hover:bg-coc-stone-light/20 opacity-70'
                      : 'bg-coc-blue/5 hover:bg-coc-blue/10 border-l-2 border-coc-blue'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notif.read ? (
                      <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-coc-blue shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] md:text-xs text-gray-500 mt-1.5 block">
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
  const { currentUser, loading: authLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 bg-coc-stone/95 backdrop-blur-md border-b border-white/5 shadow-lg h-16 md:h-[72px] transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between h-full px-4 md:px-6">
          
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3 z-20 hover:opacity-90 transition-opacity group"
          >
            <div className="relative h-9 w-9 md:h-11 md:w-11 transition-transform group-hover:scale-105">
                <Image
                src="/images/logoClashub.png"
                alt="Clashub Logo"
                fill
                sizes="(max-width: 768px) 36px, 44px"
                className="object-contain drop-shadow-md"
                priority
                />
            </div>
            <span
              className="font-clash text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-b from-coc-gold to-coc-gold-dark drop-shadow-sm tracking-wide"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              CLASHUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                      px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2
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

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <button className="p-2 text-gray-300 hover:text-coc-gold transition-colors rounded-full hover:bg-white/5">
                  <SearchIcon className="h-5 w-5" />
                </button>
                <NotificationBell />
            </div>

            <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

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

          {/* Mobile Actions (Clean - Only Notification Bell) */}
          <div className="md:hidden flex items-center gap-3 z-20">
            <NotificationBell />
            {/* Note: Tidak ada lagi menu hamburger di sini, digantikan oleh MobileNav di bawah layar */}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;