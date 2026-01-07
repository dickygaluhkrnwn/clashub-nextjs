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
  CheckCircleIcon,
  HelpCircleIcon,
  CogsIcon,
  MegaphoneIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckIcon
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
import { usePWA } from '@/lib/hooks/usePWA';

// Icon Download sederhana untuk tombol install
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

// Mapping Nav Items dengan Icon
const navItems = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Team Hub', href: '/clan-hub', icon: ShieldIcon },
  { name: 'Tournament', href: '/tournament', icon: TrophyIcon },
  { name: 'Knowledge Hub', href: '/knowledge-hub', icon: BookOpenIcon },
];

// --- [KOMPONEN BARU] Notification Item UI ---
const NotificationItem = ({ notif, onClick }: { notif: Notification; onClick: () => void }) => {
  // Helper: Tentukan Style berdasarkan Tipe
  const getStyle = () => {
    switch (notif.type) {
      case 'announcement':
        return {
          icon: <MegaphoneIcon className="h-4 w-4 text-black" />,
          bgIcon: 'bg-coc-gold',
          borderHover: 'group-hover:border-coc-gold/50',
          bgHover: 'hover:bg-coc-gold/5',
          textTitle: 'text-coc-gold'
        };
      case 'system_alert':
        return {
          icon: <AlertTriangleIcon className="h-4 w-4 text-white" />,
          bgIcon: 'bg-coc-red',
          borderHover: 'group-hover:border-coc-red/50',
          bgHover: 'hover:bg-coc-red/5',
          textTitle: 'text-coc-red'
        };
      case 'tournament':
        return {
          icon: <TrophyIcon className="h-4 w-4 text-white" />,
          bgIcon: 'bg-purple-500',
          borderHover: 'group-hover:border-purple-500/50',
          bgHover: 'hover:bg-purple-500/5',
          textTitle: 'text-purple-400'
        };
      case 'join_approved':
      case 'review_request':
        return {
          icon: <CheckCircleIcon className="h-4 w-4 text-white" />,
          bgIcon: 'bg-coc-green',
          borderHover: 'group-hover:border-coc-green/50',
          bgHover: 'hover:bg-coc-green/5',
          textTitle: 'text-coc-green'
        };
      default:
        return {
          icon: <InfoIcon className="h-4 w-4 text-white" />,
          bgIcon: 'bg-coc-blue',
          borderHover: 'group-hover:border-coc-blue/50',
          bgHover: 'hover:bg-coc-blue/5',
          textTitle: 'text-coc-blue'
        };
    }
  };

  const style = getStyle();
  const timeString = new Date(notif.createdAt).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left flex items-start gap-4 p-4 transition-all border-l-2 group ${
          notif.read
            ? 'border-transparent opacity-60 hover:opacity-100 hover:bg-white/5'
            : `${style.borderHover} ${style.bgHover} border-transparent hover:border-l-4 bg-[#1a1a1a]`
        }`}
      >
        {/* Icon Container */}
        <div className={`flex-shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center shadow-lg ${style.bgIcon} ${!notif.read ? 'animate-pulse-slow' : 'grayscale opacity-70'}`}>
          {style.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge NEW jika belum dibaca */}
          {!notif.read && (
            <span className="inline-block px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded mb-1 uppercase tracking-wider shadow-sm">
              New
            </span>
          )}
          
          <p className={`text-sm leading-snug mb-1.5 font-sans ${notif.read ? 'text-gray-400' : 'text-white'}`}>
            {notif.message}
          </p>
          
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
            {timeString}
          </span>
        </div>
      </button>
    </li>
  );
};

// --- [UPDATE] Notification Bell ---
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { currentUser } = useAuth();
  // [UPDATE] Menggunakan markAllAsRead dari hook yang baru
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

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

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah dropdown tertutup
    markAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all focus:outline-none active:scale-95 ${isOpen ? 'text-coc-gold bg-white/5 ring-1 ring-coc-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-[10px] font-bold text-white border border-[#1a1a1a] animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[90vw] md:w-80 max-h-[60vh] md:max-h-[400px] overflow-y-auto bg-[#121212]/95 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-white/5 custom-scrollbar">
          
          {/* Header Notifikasi */}
          <div className="p-4 border-b border-white/5 sticky top-0 bg-[#121212]/95 backdrop-blur z-20 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <h4 className="font-clash text-lg text-white tracking-wide uppercase">Notifikasi</h4>
              {unreadCount > 0 && (
                 <span className="text-[10px] font-bold text-coc-gold bg-coc-gold/10 px-2 py-0.5 rounded-full border border-coc-gold/20 tracking-wider shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                    {unreadCount} NEW
                 </span>
              )}
            </div>
            
            {/* Tombol Mark All Read */}
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-colors border border-white/5 hover:border-white/10"
                title="Tandai semua sudah dibaca"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span className="font-bold tracking-tight">MARK ALL</span>
              </button>
            )}
          </div>
          
          {/* State Loading */}
          {isLoading && (
            <div className="p-8 text-center text-gray-500 animate-pulse text-sm">
              <div className="w-8 h-8 bg-white/10 rounded-full mx-auto mb-2 border border-white/5"></div>
              Memuat info terbaru...
            </div>
          )}
          
          {/* State Kosong */}
          {!isLoading && notifications.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-3 text-gray-500">
              <div className="p-4 rounded-full bg-white/5 border border-white/5">
                <BellIcon className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">Tidak ada notifikasi baru</p>
            </div>
          )}
          
          {/* List Notifikasi */}
          <ul className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <NotificationItem 
                key={`${notif.id}-${notif.type}`} 
                notif={notif} 
                onClick={() => handleNotifClick(notif)} 
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Komponen menu dropdown profil pengguna
const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [isTournamentManager, setIsTournamentManager] = useState(false);
  
  const { isInstallable, installApp } = usePWA();

  // Pengecekan status Global Admin
  const isGlobalAdmin = userProfile && 'isGlobalAdmin' in userProfile ? !!userProfile.isGlobalAdmin : false;

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
        className={`h-10 w-10 flex items-center justify-center rounded-full bg-black/40 border transition-all overflow-hidden focus:outline-none active:scale-95 ${isOpen ? 'border-coc-gold shadow-[0_0_15px_rgba(255,215,0,0.4)] ring-2 ring-coc-gold/20' : 'border-white/10 hover:border-coc-gold/50'}`}
      >
        <img
          src={avatarSrc || '/images/placeholder-avatar.png'}
          alt="User Avatar"
          className="h-full w-full object-cover bg-[#0a0a0b]"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/placeholder-avatar.png';
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
          {/* Header Profil dengan Efek Gradient */}
          <div className="p-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
             <div className="absolute inset-0 bg-coc-gold/5 blur-xl pointer-events-none" />
             <p className="text-sm font-bold text-white truncate font-clash tracking-wide relative z-10">
               {userProfile && 'displayName' in userProfile ? userProfile.displayName : 'User'}
             </p>
             <p className="text-xs text-gray-500 truncate font-mono mt-0.5 relative z-10">{currentUser?.email}</p>
          </div>
          
          <ul className="p-2 space-y-1">
            <li>
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
              >
                <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-gold/20 text-gray-400 group-hover:text-coc-gold transition-colors shadow-inner">
                    <UserCircleIcon className="h-4 w-4" />
                </div>
                <span className="font-medium">Profil Saya</span>
              </Link>
            </li>

            {showClanLink && (
              <li>
                <Link
                  href="/clan/manage"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-blue/20 text-gray-400 group-hover:text-coc-blue transition-colors shadow-inner">
                    <ShieldIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Klan Saya</span>
                </Link>
              </li>
            )}

            {isTournamentManager && (
              <li>
                <Link
                  href="/my-tournaments"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-gold/20 text-gray-400 group-hover:text-coc-gold transition-colors shadow-inner">
                    <TrophyIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Manajemen Turnamen</span>
                </Link>
              </li>
            )}

            {/* Menu Install App untuk Mobile */}
            {isInstallable && (
              <li>
                <button
                  onClick={() => {
                    installApp();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-coc-gold hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-gold/20 text-coc-gold/80 group-hover:text-coc-gold transition-colors shadow-inner">
                    <DownloadIcon className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Install App</span>
                </button>
              </li>
            )}

            {/* Divider Halus */}
            <div className="my-1.5 border-t border-white/5 mx-2"></div>

            {/* Menu Panduan Aplikasi */}
            <li>
              <Link
                href="/guide"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
              >
                <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-500/20 text-gray-400 group-hover:text-purple-400 transition-colors shadow-inner">
                    <HelpCircleIcon className="h-4 w-4" />
                </div>
                <span className="font-medium">Panduan Aplikasi</span>
              </Link>
            </li>

            {/* Menu Master Admin - Hanya muncul untuk Global Admin */}
            {isGlobalAdmin && (
              <li>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors group border border-transparent hover:border-white/5"
                >
                  <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-red/20 text-gray-400 group-hover:text-coc-red transition-colors shadow-inner">
                      <CogsIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-coc-red group-hover:text-white">Master Admin</span>
                </Link>
              </li>
            )}

            <div className="my-1.5 border-t border-white/5 mx-2"></div>

            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-coc-red/10 hover:text-red-300 rounded-xl transition-colors group border border-transparent hover:border-coc-red/20"
              >
                <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-coc-red/20 text-gray-400 group-hover:text-coc-red transition-colors shadow-inner">
                    <LogOutIcon className="h-4 w-4" />
                </div>
                <span className="font-bold">Keluar</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const pathname = usePathname();
  const { currentUser, loading: authLoading } = useAuth();
  const { isInstallable, installApp } = usePWA();

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0f1115]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-16 md:h-[72px] transition-all duration-300">
        {/* Top Highlight Line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
        
        <div className="container mx-auto flex items-center justify-between h-full px-4 md:px-8">
          
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center gap-3 z-20 group relative"
          >
            <div className="absolute inset-0 bg-coc-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <div className="relative h-8 w-8 md:h-10 md:w-10 transition-transform group-hover:scale-110 duration-300 drop-shadow-md">
                <Image
                src="/images/logoClashub.png"
                alt="Clashub Logo"
                fill
                sizes="(max-width: 768px) 32px, 40px"
                className="object-contain"
                priority
                />
            </div>
            <span
              className="font-clash text-xl md:text-2xl text-white tracking-wide group-hover:text-coc-gold transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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
                      px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 relative overflow-hidden group
                      ${
                        pathname === item.href
                          ? 'text-coc-gold bg-coc-gold/10 border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                      }
                    `}
              >
                <item.icon className={`h-4 w-4 transition-colors ${pathname === item.href ? 'text-coc-gold' : 'text-gray-500 group-hover:text-white'}`} />
                {item.name}
                
                {/* Efek Hover Glow Halus */}
                {pathname !== item.href && (
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-coc-gold transition-all duration-300 group-hover:w-full opacity-50 shadow-[0_0_10px_currentColor]"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* [DESKTOP] Tombol Install App (PWA) */}
            {isInstallable && (
                <Button 
                    onClick={installApp} 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex items-center gap-2 bg-coc-gold/5 text-coc-gold border border-coc-gold/20 hover:bg-coc-gold/10 mr-2 transition-all hover:shadow-[0_0_10px_rgba(255,215,0,0.15)] font-bold tracking-wide rounded-xl"
                >
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden lg:inline">INSTALL APP</span>
                    <span className="lg:hidden">INSTALL</span>
                </Button>
            )}

            {/* Desktop Only Tools */}
            <div className="hidden md:flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>

            {/* Notification & Search */}
            <div className="flex items-center gap-1 md:gap-2">
                <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5 focus:outline-none active:scale-95 border border-transparent hover:border-white/10">
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
                <Button href="/auth" variant="primary" size="sm" className="min-w-[100px] shadow-lg shadow-coc-gold/10 ml-2 hover:shadow-coc-gold/30 transition-all font-bold tracking-wider">
                  LOGIN
                </Button>
              ))}
            
            {authLoading && (
              <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse ring-1 ring-white/10 ml-2 border border-white/5"></div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;