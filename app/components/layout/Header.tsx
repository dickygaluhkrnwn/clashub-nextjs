'use client'; // Diperlukan untuk menggunakan hooks seperti usePathname dan useState

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BellIcon, SearchIcon, MenuIcon, XIcon } from '@/app/components/icons';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Team Hub', href: '/teamhub' },
  { name: 'Tournament', href: '/tournament' },
  { name: 'Knowledge Hub', href: '/knowledge-hub' },
];

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-coc-stone/80 backdrop-blur-sm border-b-2 border-coc-gold-dark/30 animate-header-glow">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="font-supercell text-3xl text-coc-gold z-20" style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}>
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
                ${pathname === item.href
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

          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-coc-stone-light hover:ring-2 hover:ring-coc-gold transition-all">
            <img src="/images/placeholder-avatar.png" alt="User Avatar" className="rounded-full h-8 w-8 object-cover" />
          </button>
        </div>

        {/* Tombol Menu Mobile */}
        <div className="md:hidden z-20">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300 hover:text-coc-gold">
                {isMenuOpen ? <XIcon className="h-7 w-7" /> : <MenuIcon className="h-7 w-7" />}
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
                          className={`text-2xl font-bold ${pathname === item.href ? 'text-coc-gold' : 'text-gray-300'}`}
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
                    <button className="h-10 w-10 flex items-center justify-center rounded-full bg-coc-stone-light">
                        <img src="/images/placeholder-avatar.png" alt="User Avatar" className="rounded-full h-9 w-9 object-cover" />
                    </button>
                 </div>
            </div>
        )}

      </div>
    </header>
  );
};

export default Header;

