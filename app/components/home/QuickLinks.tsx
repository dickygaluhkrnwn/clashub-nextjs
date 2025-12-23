'use client';

import {
  CoinsIcon,
  TrophyIcon,
  CalendarCheck2Icon,
  ShieldIcon,
} from '@/app/components/icons/clash';
import { UserCircleIcon } from '@/app/components/icons/ui-user';
// [BARU] Impor BookOpenIcon dan LinkIcon
import { BookOpenIcon, LinkIcon } from '@/app/components/icons/ui-general';
import { useLanguage } from '@/lib/hooks/useLanguage';

/**
 * Komponen Tautan Cepat (Quick Links)
 * Menampilkan 6 tautan penting CoC di Halaman Utama.
 */
export default function QuickLinks() {
  const { t } = useLanguage();

  // Daftar tautan dipindah ke dalam komponen untuk akses 't'
  const quickLinks = [
    {
      title: t.quickLinks.store,
      href: 'https://store.supercell.com/id/clashofclans?gameSlug=clashofclans',
      icon: CoinsIcon,
    },
    {
      title: t.quickLinks.cocId,
      href: 'https://id.supercell.com/id/clashofclans/',
      icon: UserCircleIcon,
    },
    {
      title: t.quickLinks.esports,
      href: 'https://esports.clashofclans.com/',
      icon: TrophyIcon,
    },
    {
      title: t.quickLinks.events,
      href: 'https://event.supercell.com/clashofclans/en',
      icon: CalendarCheck2Icon,
    },
    {
      title: t.quickLinks.news,
      href: 'https://supercell.com/en/games/clashofclans/',
      icon: BookOpenIcon,
    },
    {
      title: t.quickLinks.support,
      href: 'https://supercell.com/en/support/',
      icon: ShieldIcon,
    },
  ];

  return (
    // Section wrapper
    <section className="mb-8 md:mb-12">
      <h2 className="flex items-center gap-2 text-xl font-clash text-white mb-4 px-1">
        <LinkIcon className="h-6 w-6 text-coc-gold" />
        {t.quickLinks.title}
      </h2>

      {/* [MOBILE OPTIMIZATION]
         Grid Layout:
         - Mobile: grid-cols-3 (Icon Only / Text Small) atau grid-cols-2 (Safe). 
           Kita pakai grid-cols-3 agar compact dan mirip menu aplikasi native.
         - Tablet: grid-cols-3
         - Desktop: grid-cols-6
      */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
        {quickLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              // Style card: Padding dikurangi di mobile (p-3) agar muat 3 kolom
              className="card-stone p-3 md:p-4 flex flex-col items-center justify-center text-center rounded-xl hover:bg-coc-stone-light/70 transition-all duration-200 border border-white/5 active:scale-95 touch-manipulation"
            >
              {/* Ikon: Ukuran responsif */}
              <IconComponent className="h-8 w-8 md:h-10 md:w-10 text-coc-gold mb-2 drop-shadow-md" />
              
              {/* Judul: Font size responsif */}
              <span className="text-[10px] md:text-sm font-bold text-gray-300 font-sans leading-tight">
                {link.title}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}