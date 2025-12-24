'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ShieldIcon,
  TrophyIcon,
  BookOpenIcon,
  UserCircleIcon
} from '@/app/components/icons';

// Definisi menu item untuk navigasi bawah
const navItems = [
  { 
    name: 'Home', 
    href: '/', 
    icon: HomeIcon 
  },
  { 
    name: 'Clans', 
    href: '/clan-hub', 
    icon: ShieldIcon 
  },
  { 
    name: 'Tourney', 
    href: '/tournament', 
    icon: TrophyIcon 
  },
  { 
    name: 'Learn', 
    href: '/knowledge-hub', 
    icon: BookOpenIcon 
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: UserCircleIcon 
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Container Utama:
        - Glassmorphism effect (backdrop-blur)
        - Border atas transparan
        - Padding safe-area untuk iPhone modern
      */}
      <div className="bg-coc-stone/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full py-1"
              >
                {/* Background Active Indicator (Glow) */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-gradient-to-t from-coc-gold/10 to-transparent rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon Wrapper */}
                <div className={`relative p-1.5 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                  <item.icon 
                    className={`h-6 w-6 transition-colors duration-300 ${
                      isActive ? 'text-coc-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : 'text-gray-500'
                    }`} 
                  />
                  
                  {/* Active Dot Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-coc-gold rounded-full shadow-[0_0_4px_#FFD700]"
                    />
                  )}
                </div>

                {/* Label Text */}
                <span 
                  className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}