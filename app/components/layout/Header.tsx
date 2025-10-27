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
} from '@/app/components/icons';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import { useAuth } from '@/app/context/AuthContext'; // Konteks yang sudah diupdate
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/Button';
import { UserProfile } from '@/lib/types'; // Impor UserProfile untuk type checking
import { ServerUser } from '@/lib/server-auth'; // Impor ServerUser

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

  // Ambil userProfile DAN loading state dari AuthContext
  const { userProfile, loading: authLoading } = useAuth();

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

  // --- PERBAIKAN LOGIKA: Sederhanakan Pengecekan Menu Klan ---
  // Kita perlu membedakan antara ServerUser (sebagian) dan UserProfile (lengkap dari Firestore).
  
  // Type Guard untuk memastikan objek adalah UserProfile lengkap dari Firestore
  const isCompleteUserProfile = (
    profile: UserProfile | ServerUser | null
  ): profile is UserProfile => {
      // Cek minimal: harus punya isVerified, clanId (bisa null), dan role (Clashub internal)
      // ServerUser hanya punya uid, email, displayName.
      return (
          !!profile && 
          'isVerified' in profile && 
          'clanId' in profile &&
          'role' in profile // Tambahkan cek untuk role Clashub
      );
  };

  // Logika untuk menampilkan link 'Klan'
  let showClanLink = false;
  let avatarSrc: string | null = null;
  
  if (isCompleteUserProfile(userProfile)) {
    // Tampilkan Klan jika terverifikasi DAN punya ID klan internal (ManagedClan)
    showClanLink = userProfile.isVerified === true && !!userProfile.clanId;
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
        <div className="absolute right-0 mt-2 w-48 card-stone p-2 shadow-lg rounded-md z-50">
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
                  // PASTIKAN INI MENGARAH KE RUTE DASHBOARD MANAJEMEN BARU
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

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ambil currentUser DAN loading state untuk header utama
  const { currentUser, loading: authLoading } = useAuth();

  // Tampilkan state loading awal jika diperlukan
  // if (authLoading) {
  // 	 // Opsional: Tampilkan skeleton UI atau null selama auth loading awal
  // 	 return <header className="sticky top-0 z-50 h-[68px] bg-coc-stone/80"></header>;
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
                     ? 'bg-coc-gold text-coc-stone shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]'
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

          <div className="relative">
            <button className="text-gray-300 hover:text-coc-gold transition-colors">
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-xs font-bold text-white">
                2
              </span>
            </button>
          </div>

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
