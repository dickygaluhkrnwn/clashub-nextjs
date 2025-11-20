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
    // Section wrapper (Spacing/jarak antar section akan diperbaiki di app/page.tsx)
    <section className="mb-12">
      {/*
        [PERBAIKAN 1] Teks judul diubah menjadi dinamis.
        [PERBAIKAN 2] className disederhanakan (hanya flex) agar mengambil
        style h2 global dari globals.css, sehingga senada dengan section lain.
      */}
      <h2 className="flex items-center gap-2">
        <LinkIcon className="h-6 w-6 text-coc-gold" />
        {t.quickLinks.title}
      </h2>

      {/* [PERBAIKAN 3] Menambahkan 'mt-4' agar jarak dari judul ke grid 
        konsisten seperti di CarouselSection.tsx 
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mt-4">
        {quickLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <a
              key={link.href} // Gunakan href sebagai key karena title bisa berubah bahasa
              href={link.href}
              target="_blank" // Buka di tab baru
              rel="noopener noreferrer"
              // Style card
              className="card-stone p-4 flex flex-col items-center justify-center text-center rounded-lg hover:bg-coc-stone-light/70 transition-colors duration-200"
            >
              {/* Ikon */}
              <IconComponent className="h-10 w-10 text-coc-gold mb-2" />
              {/* Judul */}
              <span className="text-sm font-semibold text-white font-sans">
                {link.title}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}