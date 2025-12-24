'use client';

import {
  CoinsIcon,
  TrophyIcon,
  CalendarCheck2Icon,
  ShieldIcon,
} from '@/app/components/icons/clash';
import { UserCircleIcon } from '@/app/components/icons/ui-user';
import { BookOpenIcon, LinkIcon } from '@/app/components/icons/ui-general';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { motion, Variants } from 'framer-motion';

// Konfigurasi animasi container
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Konfigurasi animasi item individual
const item: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

export default function QuickLinks() {
  const { t } = useLanguage();

  const quickLinks = [
    {
      title: t.quickLinks.store,
      href: 'https://store.supercell.com/id/clashofclans?gameSlug=clashofclans',
      icon: CoinsIcon,
      color: 'text-coc-gold',
      bg: 'bg-coc-gold/10 border-coc-gold/20',
    },
    {
      title: t.quickLinks.cocId,
      href: 'https://id.supercell.com/id/clashofclans/',
      icon: UserCircleIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20',
    },
    {
      title: t.quickLinks.esports,
      href: 'https://esports.clashofclans.com/',
      icon: TrophyIcon,
      color: 'text-coc-gold-dark',
      bg: 'bg-yellow-600/10 border-yellow-600/20',
    },
    {
      title: t.quickLinks.events,
      href: 'https://event.supercell.com/clashofclans/en',
      icon: CalendarCheck2Icon,
      color: 'text-coc-green',
      bg: 'bg-coc-green/10 border-coc-green/20',
    },
    {
      title: t.quickLinks.news,
      href: 'https://supercell.com/en/games/clashofclans/',
      icon: BookOpenIcon,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10 border-purple-400/20',
    },
    {
      title: t.quickLinks.support,
      href: 'https://supercell.com/en/support/',
      icon: ShieldIcon,
      color: 'text-gray-400',
      bg: 'bg-gray-400/10 border-gray-400/20',
    },
  ];

  return (
    <section className="w-full mb-8">
      {/* Header Disederhanakan (Sesuai gaya Strategi & Tips) */}
      <div className="flex items-center gap-2 mb-4 mt-2 md:mt-4 px-1">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-clash text-white tracking-wide drop-shadow-md">
          <LinkIcon className="h-5 w-5 md:h-6 md:w-6 text-coc-gold drop-shadow-md" />
          {t.quickLinks.title}
        </h2>
      </div>

      {/* Grid Menu Responsive */}
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
      >
        {quickLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <motion.a
              key={link.href}
              variants={item}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(0,0,0,0.4)] active:scale-95 shadow-lg"
            >
              {/* Decorative Background Glow */}
              <div className={`absolute -top-10 -right-10 w-20 h-20 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors duration-500`} />
              
              {/* Icon Container with specific color bg */}
              <div className={`relative z-10 p-3 rounded-xl ${link.bg} border group-hover:scale-110 transition-transform duration-300 shadow-inner ring-1 ring-white/5`}>
                <IconComponent className={`h-6 w-6 md:h-7 md:w-7 ${link.color} drop-shadow-md`} />
              </div>
              
              {/* Label */}
              <span className="relative z-10 text-[10px] md:text-xs font-bold text-gray-400 group-hover:text-white font-sans uppercase tracking-wider text-center transition-colors line-clamp-1">
                {link.title}
              </span>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}