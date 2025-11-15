import {
  CoinsIcon,
  TrophyIcon,
  CalendarCheck2Icon,
  ShieldIcon,
} from '@/app/components/icons/clash';
import { UserCircleIcon } from '@/app/components/icons/ui-user';
// [BARU] Impor BookOpenIcon dan LinkIcon
import { BookOpenIcon, LinkIcon } from '@/app/components/icons/ui-general';

// Daftar tautan
const quickLinks = [
  {
    title: 'CoC Store',
    href: 'https://store.supercell.com/id/clashofclans?gameSlug=clashofclans',
    icon: CoinsIcon,
  },
  {
    title: 'CoC ID',
    href: 'https://id.supercell.com/id/clashofclans/',
    icon: UserCircleIcon,
  },
  {
    title: 'E-Sports',
    href: 'https://esports.clashofclans.com/',
    icon: TrophyIcon,
  },
  {
    title: 'Events',
    href: 'https://event.supercell.com/clashofclans/en',
    icon: CalendarCheck2Icon,
  },
  {
    title: 'Blog/Berita',
    href: 'https://supercell.com/en/games/clashofclans/',
    icon: BookOpenIcon,
  },
  {
    title: 'Bantuan',
    href: 'https://supercell.com/en/support/',
    icon: ShieldIcon,
  },
];

/**
 * Komponen Tautan Cepat (Quick Links)
 * Menampilkan 6 tautan penting CoC di Halaman Utama.
 */
export default function QuickLinks() {
  return (
    // Section wrapper dengan margin-bottom untuk spasi
    <section className="mb-12">
      {/*
        [BARU] Menambahkan Judul Section
        Style-nya disamakan dengan judul section lain (spt. di internal clan page)
      */}
      <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 mb-6 flex items-center gap-2">
        <LinkIcon className="h-6 w-6 text-coc-gold" />
        Tautan Cepat
      </h2>

      {/* Grid Responsif:
        - HP (default): 2 kolom
        - Tablet (md): 3 kolom
        - Desktop (lg): 6 kolom
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {quickLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <a
              key={link.title}
              href={link.href}
              target="_blank" // Buka di tab baru
              rel="noopener noreferrer"
              // Style card yang Anda minta, mirip "Bintang Kita"
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