'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ShieldIcon,
  TrophyIcon,
  GlobeIcon,
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
    name: 'TeamHub', 
    href: '/clan-hub', 
    icon: ShieldIcon 
  },
  { 
    name: 'Cup', 
    href: '/tournament', 
    icon: TrophyIcon 
  },
  { 
    name: 'Social', 
    href: '/knowledge-hub', 
    icon: GlobeIcon 
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
        - Gradient background halus untuk kedalaman
      */}
      <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <nav className="flex items-center justify-around h-16 px-2 relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full py-1 group touch-manipulation"
              >
                {/* Background Active Indicator (Glow Effect) */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-gradient-to-t from-coc-gold/10 via-transparent to-transparent rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon Wrapper with Animation */}
                <div className={`relative p-1.5 transition-all duration-300 ${isActive ? '-translate-y-1' : 'group-active:scale-90'}`}>
                  <item.icon 
                    className={`h-6 w-6 transition-all duration-300 ${
                      isActive 
                        ? 'text-coc-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] scale-110' 
                        : 'text-gray-400 group-hover:text-gray-200'
                    }`} 
                  />
                  
                  {/* Active Dot Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-coc-gold rounded-full shadow-[0_0_4px_#FFD700]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>

                {/* Label Text */}
                <span 
                  className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                    isActive ? 'text-white translate-y-0 opacity-100' : 'text-gray-500 translate-y-1 opacity-0 scale-0 h-0 w-0 overflow-hidden'
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