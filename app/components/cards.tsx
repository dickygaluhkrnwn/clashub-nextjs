import { StarIcon } from '@/app/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

// -- Tipe Data untuk Props --
export type TeamCardProps = {
  id: string; // ID diperlukan untuk membuat link
  name: string;
  tag: string;
  rating: number;
  vision: 'Kompetitif' | 'Kasual';
  avgTh: number;
  logoUrl?: string;
};

export type PostCardProps = {
  category: string;
  tag: string;
  title: string;
  author: string;
  stats: string;
  href: string;
};

export type TournamentCardProps = {
  id: string; // ID diperlukan untuk membuat link
  title: string;
  // [PERBAIKAN ERROR 1] Menambahkan 'Dibatalkan' agar cocok dengan TournamentClient.tsx
  status: 'Akan Datang' | 'Live' | 'Selesai' | 'Dibatalkan';
  thRequirement: string;
  prizePool: string;
};

export type PlayerCardProps = {
  id: string; // ID diperlukan untuk membuat link
  name: string;
  tag: string;
  thLevel: number;
  reputation: number;
  role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  avatarUrl?: string;
};

// -- Komponen TeamCard --
export const TeamCard = ({
  id,
  name,
  tag,
  rating,
  vision,
  avgTh,
  logoUrl = '/images/clan-badge-placeholder.png',
}: TeamCardProps) => {
  const isCompetitive = vision === 'Kompetitif';

  return (
    <div className="card-stone flex flex-col justify-between h-full p-5 transition-transform hover:scale-[1.02] duration-300">
      <div>
        <div className="flex items-start gap-4 mb-4 border-b border-coc-gold-dark/20 pb-4">
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            width={64} // Ukuran diperbesar sedikit untuk estetika
            height={64} // Ukuran diperbesar sedikit untuk estetika
            sizes="64px"
            quality={75}
            className="rounded-full border-3 border-coc-gold object-cover flex-shrink-0 w-16 h-16 shadow-lg"
          />
          <div className="flex-grow min-w-0">
            {/* Menambahkan font-clash */}
            <h4 className="font-clash text-xl text-white leading-tight truncate">
              {name}
            </h4>
            <p className="text-sm text-gray-400 font-mono">{tag}</p>
            <div className="flex items-center gap-1 text-coc-gold font-bold text-lg mt-1">
              <StarIcon className="h-4 w-4 fill-current" />
              <span className="font-sans">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-300">Visi:</span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                isCompetitive
                  ? 'bg-coc-red text-white'
                  : 'bg-coc-green text-coc-stone'
              }`}
            >
              {vision}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-300">Rata-rata TH:</span>
            <p className="text-base font-clash text-white">
              {avgTh.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
      {/* PERBAIKAN: Mengubah link dari /team/[id] ke /clan/internal/[clanId] */}
      <Link href={`/clan/internal/${id}`} className="mt-5">
        <Button variant="secondary" className="w-full">
          Lihat Profil Tim
        </Button>
      </Link>
    </div>
  );
};

// -- Komponen PostCard (untuk Knowledge Hub) --
export const PostCard = ({
  category,
  tag,
  title,
  author,
  stats,
  href,
}: PostCardProps) => {
  return (
    <Link href={href} className="block group h-full">
      <div className="card-stone h-full flex flex-col p-5 hover:bg-coc-stone-light/90 transition-colors duration-200">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
            <span className="px-2 py-1 font-bold bg-coc-red text-white rounded-sm">
              {category}
            </span>
            <span className="px-2 py-1 font-semibold bg-coc-stone-light text-coc-gold rounded-sm border border-coc-gold-dark/30">
              {tag}
            </span>
          </div>
          {/* Menambahkan font-clash */}
          <h4 className="font-clash text-lg text-white group-hover:text-coc-gold transition-colors mb-3">
            {title}
          </h4>
        </div>
        <div className="mt-auto pt-3 border-t border-coc-stone-light/30 text-xs text-gray-400 font-sans">
          <p>
            Oleh: <span className="font-bold text-coc-gold-dark">{author}</span>
          </p>
          <p>{stats}</p>
        </div>
      </div>
    </Link>
  );
};

// -- Komponen TournamentCard --
export const TournamentCard = ({
  id,
  title,
  status,
  thRequirement,
  prizePool,
}: TournamentCardProps) => {
  const statusStyles: { [key in TournamentCardProps['status']]: string } = {
    'Akan Datang': 'border-coc-gold bg-coc-gold/10',
    Live: 'border-coc-red bg-coc-red/10 animate-pulse',
    Selesai: 'border-gray-500 bg-gray-500/10 opacity-70',
    // [PERBAIKAN ERROR 1] Styling untuk status Dibatalkan
    Dibatalkan: 'border-gray-500 bg-gray-500/10 opacity-70',
  };
  const statusBadgeStyles: { [key in TournamentCardProps['status']]: string } = {
    'Akan Datang': 'bg-coc-gold text-coc-stone',
    Live: 'bg-coc-red text-white',
    Selesai: 'bg-gray-500 text-white',
    // [PERBAIKAN ERROR 1] Styling untuk badge Dibatalkan
    Dibatalkan: 'bg-gray-500 text-white',
  };

  return (
    <div
      className={`card-stone flex flex-col sm:flex-row justify-between items-center p-6 gap-4 border-l-4 ${
        statusStyles[status] || statusStyles['Selesai']
      } transition-shadow hover:shadow-xl rounded-lg`}
    >
      <div className="flex-grow w-full sm:w-auto">
        {/* Menambahkan font-clash */}
        <h4 className="font-clash text-xl text-white leading-snug">{title}</h4>
        <div className="text-sm text-gray-300 space-y-1 mt-2 font-sans">
          <p>
            Syarat: <span className="font-bold text-white">{thRequirement}</span>
          </p>
          <p>
            Hadiah: <span className="font-bold text-coc-gold">{prizePool}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full text-center font-sans ${
            statusBadgeStyles[status] || statusBadgeStyles['Selesai']
          }`}
        >
          {status}
        </span>
        <Button href={`/tournament/${id}`} variant="secondary" className="w-full sm:w-auto">
          Lihat Detail
        </Button>
      </div>
    </div>
  );
};

// -- Komponen PlayerCard --
export const PlayerCard = ({
  id,
  name,
  tag,
  thLevel,
  reputation,
  role,
  avatarUrl = '/images/placeholder-avatar.png',
}: PlayerCardProps) => {
  const roleColors: { [key: string]: string } = {
    Leader: 'bg-coc-gold text-coc-stone',
    'Co-Leader': 'bg-gray-400 text-coc-stone',
    Elder: 'bg-sky-400 text-white',
    Member: 'bg-coc-stone-light border border-sky-400/50 text-sky-300',
    'Free Agent': 'bg-coc-green text-coc-stone',
  };

  return (
    <div className="card-stone flex flex-col justify-between h-full p-5 transition-transform hover:scale-[1.02] duration-300">
      <div>
        <div className="flex items-center gap-4 mb-4 border-b border-coc-gold-dark/20 pb-4">
          <Image
            src={avatarUrl}
            alt={`${name} avatar`}
            width={64} // Ukuran diperbesar sedikit untuk estetika
            height={64} // Ukuran diperbesar sedikit untuk estetika
            sizes="64px"
            quality={75}
            className="rounded-full border-3 border-coc-gold object-cover flex-shrink-0 w-16 h-16 shadow-lg"
          />
          <div className="flex-grow min-w-0">
            {/* Menambahkan font-clash */}
            <h4 className="font-clash text-xl text-white leading-tight truncate">
              {name}
            </h4>
            <p className="text-xs text-gray-400 font-mono">{tag}</p>
          </div>
        </div>
        <div className="space-y-3 pt-4 font-sans">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-300">Role Clashub:</span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full font-sans ${
                roleColors[role] || 'bg-gray-600'
              }`}
            >
              {role}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-300">Town Hall:</span>
            <span className="font-bold text-white font-clash text-lg">
              TH {thLevel}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-300">Reputasi:</span>
            <div className="flex items-center gap-1 text-coc-gold font-bold font-sans">
              <StarIcon className="h-4 w-4 fill-current" />
              <span>{reputation.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <Button href={`/player/${id}`} variant="secondary" className="w-full">
          Lihat CV
        </Button>
        <Button variant="primary" className="w-full">
          Invite
        </Button>
      </div>
    </div>
  );
};