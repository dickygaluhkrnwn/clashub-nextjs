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
  TrophyIcon,
  HomeIcon,
  BookOpenIcon,
  CheckCircleIcon
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
import { usePWA } from '@/lib/hooks/usePWA'; // [BARU] Import hook PWA

// [BARU] Icon Download sederhana untuk tombol install
const DownloadIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

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
        className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 border border-white/10 hover:border-coc-gold/50 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-coc-gold/50"
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
        <div className="absolute right-0 mt-3 w-64 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-white/5 bg-black/20">
             <p className="text-sm font-bold text-white truncate">
               {userProfile && 'displayName' in userProfile ? userProfile.displayName : 'User'}
             </p>
             <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
          <ul className="p-2 space-y-1">
            <li>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-gold/20 text-gray-400 group-hover:text-coc-gold transition-colors">
                    <UserCircleIcon className="h-4 w-4" />
                </div>
                <span>Profil Saya</span>
              </Link>
            </li>

            {showClanLink && (
              <li>
                <Link
                  href="/clan/manage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-blue/20 text-gray-400 group-hover:text-coc-blue transition-colors">
                    <ShieldIcon className="h-4 w-4" />
                  </div>
                  <span>Klan Saya</span>
                </Link>
              </li>
            )}

            {isTournamentManager && (
              <li>
                <Link
                  href="/my-tournaments"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-gold/20 text-gray-400 group-hover:text-coc-gold transition-colors">
                    <TrophyIcon className="h-4 w-4" />
                  </div>
                  <span>Manajemen Turnamen</span>
                </Link>
              </li>
            )}

            <div className="my-1 border-t border-white/5"></div>

            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-coc-red/10 hover:text-red-300 rounded-xl transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-red/20 text-gray-400 group-hover:text-coc-red transition-colors">
                    <LogOutIcon className="h-4 w-4" />
                </div>
                <span>Keluar</span>
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
        className="text-gray-400 hover:text-coc-gold transition-colors relative p-2 rounded-full hover:bg-white/5 focus:outline-none active:scale-95"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-[10px] font-bold text-white border border-[#1a1a1a] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[90vw] md:w-80 max-h-[60vh] md:max-h-[400px] overflow-y-auto bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-white/5 sticky top-0 bg-[#1a1a1a]/95 backdrop-blur z-10 flex justify-between items-center">
            <h4 className="font-clash text-lg text-white tracking-wide">Notifikasi</h4>
            {unreadCount > 0 && (
               <span className="text-[10px] font-bold text-coc-gold bg-coc-gold/10 px-2 py-0.5 rounded-full border border-coc-gold/20 tracking-wider uppercase">
                  {unreadCount} Baru
               </span>
            )}
          </div>
          
          {isLoading && (
            <div className="p-8 text-center text-gray-500 animate-pulse text-sm">
              <div className="w-8 h-8 bg-white/10 rounded-full mx-auto mb-2"></div>
              Memuat...
            </div>
          )}
          
          {!isLoading && notifications.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-3 text-gray-500">
              <div className="p-4 rounded-full bg-white/5">
                <BellIcon className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm">Tidak ada notifikasi baru</p>
            </div>
          )}
          
          <ul className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <li key={notif.id}>
                <button
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-4 p-4 transition-all ${
                    notif.read
                      ? 'bg-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                      : 'bg-coc-gold/5 hover:bg-coc-gold/10 border-l-2 border-coc-gold pl-[14px]' // Compensate padding for border
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notif.read ? (
                      <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-coc-gold shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug mb-1 ${notif.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">
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
  const { isInstallable, installApp } = usePWA(); // [BARU] Hook PWA digunakan

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 shadow-lg h-16 md:h-[72px] transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between h-full px-4 md:px-8">
          
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-3 z-20 group"
          >
            <div className="relative h-8 w-8 md:h-10 md:w-10 transition-transform group-hover:scale-110 duration-300">
                <Image
                src="/images/logoClashub.png"
                alt="Clashub Logo"
                fill
                sizes="(max-width: 768px) 32px, 40px"
                className="object-contain drop-shadow-md"
                priority
                />
            </div>
            <span
              className="font-clash text-xl md:text-2xl text-white tracking-wide group-hover:text-coc-gold transition-colors duration-300"
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
                      px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2
                      ${
                        pathname === item.href
                          ? 'text-coc-gold bg-coc-gold/10 border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
              >
                {/* Icon kecil di sebelah teks menu */}
                <item.icon className={`h-4 w-4 ${pathname === item.href ? 'text-coc-gold' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* [BARU] Tombol Install App (PWA) */}
            {isInstallable && (
                <Button 
                    onClick={installApp} 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex items-center gap-2 bg-coc-gold/10 text-coc-gold border border-coc-gold/20 hover:bg-coc-gold/20 mr-2"
                >
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden lg:inline">Install App</span>
                    <span className="lg:hidden">Install</span>
                </Button>
            )}

            {/* Desktop Only Tools */}
            <div className="hidden md:flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>

            {/* Notification & Search (Visible on Mobile too) */}
            <div className="flex items-center gap-1 md:gap-2">
                <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 focus:outline-none">
                  <SearchIcon className="h-5 w-5" />
                </button>
                <NotificationBell />
            </div>

            {/* Divider Vertical */}
            <div className="hidden md:block w-px h-6 bg-white/10 mx-1"></div>

            {/* Profile Dropdown / Login Button */}
            {!authLoading &&
              (currentUser ? (
                <UserProfileDropdown />
              ) : (
                <Button href="/auth" variant="primary" size="sm" className="min-w-[90px] shadow-lg shadow-coc-gold/10 ml-2">
                  Login
                </Button>
              ))}
            
            {authLoading && (
              <div className="h-9 w-9 rounded-full bg-white/5 animate-pulse ring-1 ring-white/10 ml-2"></div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;