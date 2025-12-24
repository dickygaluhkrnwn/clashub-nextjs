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
import { motion } from 'framer-motion';

// Konfigurasi animasi container
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Konfigurasi animasi item individual
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function QuickLinks() {
  const { t } = useLanguage();

  const quickLinks = [
    {
      title: t.quickLinks.store,
      href: 'https://store.supercell.com/id/clashofclans?gameSlug=clashofclans',
      icon: CoinsIcon,
      color: 'text-coc-gold',
    },
    {
      title: t.quickLinks.cocId,
      href: 'https://id.supercell.com/id/clashofclans/',
      icon: UserCircleIcon,
      color: 'text-blue-400',
    },
    {
      title: t.quickLinks.esports,
      href: 'https://esports.clashofclans.com/',
      icon: TrophyIcon,
      color: 'text-coc-gold-dark',
    },
    {
      title: t.quickLinks.events,
      href: 'https://event.supercell.com/clashofclans/en',
      icon: CalendarCheck2Icon,
      color: 'text-coc-green',
    },
    {
      title: t.quickLinks.news,
      href: 'https://supercell.com/en/games/clashofclans/',
      icon: BookOpenIcon,
      color: 'text-purple-400',
    },
    {
      title: t.quickLinks.support,
      href: 'https://supercell.com/en/support/',
      icon: ShieldIcon,
      color: 'text-gray-400',
    },
  ];

  return (
    <section className="mb-0">
      {/* Header Kecil untuk Quick Links */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <LinkIcon className="h-5 w-5 text-coc-gold" />
        <h2 className="text-lg font-clash text-white tracking-wide">
          {t.quickLinks.title}
        </h2>
      </div>

      {/* Grid Menu Responsive */}
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
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
              className="card-stone p-3 md:p-4 flex flex-col items-center justify-center text-center rounded-xl hover:bg-coc-stone-light/90 hover:border-coc-gold/30 transition-all duration-300 group border border-white/5 active:scale-95 touch-manipulation relative overflow-hidden"
            >
              {/* Efek Hover Halus */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <IconComponent className={`h-8 w-8 md:h-9 md:w-9 mb-2 drop-shadow-md transition-transform group-hover:scale-110 ${link.color}`} />
              
              <span className="text-[10px] md:text-xs font-bold text-gray-400 group-hover:text-white font-sans leading-tight transition-colors">
                {link.title}
              </span>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}