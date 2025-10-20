import { StarIcon } from '@/app/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

// -- Tipe Data untuk Props --
export type TeamCardProps = {
  name: string;
  tag: string;
  rating: number;
  vision: 'Kompetitif' | 'Kasual';
  avgTh: number;
  logoUrl?: string;
  href: string;
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
    title: string;
    status: 'Akan Datang' | 'Live' | 'Selesai';
    thRequirement: string;
    prizePool: string;
    href: string;
};

// -- Tipe Data Baru untuk PlayerCard --
export type PlayerCardProps = {
    name: string;
    tag: string;
    thLevel: number;
    reputation: number;
    role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
    avatarUrl?: string;
    href: string;
};


// -- Komponen TeamCard --
export const TeamCard = ({ name, tag, rating, vision, avgTh, logoUrl = "/images/clan-badge-placeholder.png", href }: TeamCardProps) => {
  const isCompetitive = vision === 'Kompetitif';

  return (
    <div className="card-stone flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Image src={logoUrl} alt={`${name} logo`} width={50} height={50} className="rounded-full border-2 border-coc-gold-dark" />
          <div className="flex-grow">
            <h4 className="text-lg font-bold text-white leading-tight">{name}</h4>
            <p className="text-xs text-gray-400">{tag}</p>
          </div>
          <div className="flex items-center gap-1 text-coc-gold font-bold">
            <StarIcon className="h-4 w-4" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-coc-stone-light/30">
          <span className={`px-2 py-1 text-xs font-bold rounded-sm ${isCompetitive ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
            {vision}
          </span>
          <p className="text-sm font-bold text-gray-300">
            Avg. TH: <span className="text-white">{avgTh.toFixed(1)}</span>
          </p>
        </div>
      </div>
      <Link href={href} className="mt-4">
        <Button variant="secondary" className="w-full">Lihat Profil</Button>
      </Link>
    </div>
  );
};

// -- Komponen PostCard (untuk Knowledge Hub) --
export const PostCard = ({ category, tag, title, author, stats, href }: PostCardProps) => {
    return (
      <Link href={href} className="block group">
        <div className="card-stone h-full flex flex-col">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="px-2 py-1 font-bold bg-coc-red text-white rounded-sm">{category}</span>
              <span className="px-2 py-1 font-semibold bg-coc-stone-light text-coc-gold rounded-sm">{tag}</span>
            </div>
            <h4 className="text-lg font-bold text-white group-hover:text-coc-gold transition-colors">{title}</h4>
          </div>
          <div className="mt-3 pt-3 border-t border-coc-stone-light/30 text-xs text-gray-400">
            <p>Oleh: <span className="font-bold text-coc-gold-dark">{author}</span></p>
            <p>{stats}</p>
          </div>
        </div>
      </Link>
    );
  };

// -- Komponen TournamentCard --
export const TournamentCard = ({ title, status, thRequirement, prizePool, href }: TournamentCardProps) => {
    const statusStyles = {
        'Akan Datang': 'border-coc-gold bg-coc-gold/10',
        'Live': 'border-coc-red bg-coc-red/10 animate-pulse',
        'Selesai': 'border-gray-500 bg-gray-500/10 opacity-70',
    };
    const statusBadgeStyles = {
        'Akan Datang': 'bg-coc-gold text-coc-stone',
        'Live': 'bg-coc-red text-white',
        'Selesai': 'bg-gray-500 text-white',
    };

    return (
        <div className={`card-stone flex flex-col sm:flex-row justify-between items-center p-5 gap-4 border-l-4 ${statusStyles[status]}`}>
            <div className="flex-grow">
                <h4 className="text-xl font-bold text-white">{title}</h4>
                <p className="text-sm text-gray-300">Syarat: <span className="font-bold text-white">{thRequirement}</span></p>
                <p className="text-sm text-gray-300">Hadiah: <span className="font-bold text-coc-gold">{prizePool}</span></p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusBadgeStyles[status]}`}>{status}</span>
                <Button href={href} variant="secondary" className="w-full sm:w-auto">Lihat Detail</Button>
            </div>
        </div>
    );
};

// -- Komponen PlayerCard (BARU) --
export const PlayerCard = ({ name, tag, thLevel, reputation, role, avatarUrl = "/images/placeholder-avatar.png", href }: PlayerCardProps) => {
    
    const roleColors: { [key: string]: string } = {
        'Leader': 'bg-coc-gold text-coc-stone',
        'Co-Leader': 'bg-gray-400 text-coc-stone',
        'Elder': 'bg-sky-400 text-white',
        'Member': 'bg-coc-stone-light border border-sky-400/50 text-sky-300',
        'Free Agent': 'bg-coc-green text-coc-stone'
    };
    
    return (
        <div className="card-stone flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <Image src={avatarUrl} alt={`${name} avatar`} width={50} height={50} className="rounded-full border-2 border-coc-gold-dark" />
                    <div className="flex-grow">
                        <h4 className="text-lg font-bold text-white leading-tight">{name}</h4>
                        <p className="text-xs text-gray-400">{tag}</p>
                    </div>
                </div>
                <div className="space-y-3 pt-3 border-t border-coc-stone-light/30">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-300">Role:</span>
                        <span className={`px-2 py-1 text-xs font-bold rounded-sm ${roleColors[role] || 'bg-gray-600'}`}>{role}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-300">Town Hall:</span>
                        <span className="font-bold text-white">TH {thLevel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-300">Reputasi:</span>
                         <div className="flex items-center gap-1 text-coc-gold font-bold">
                            <StarIcon className="h-4 w-4" />
                            <span>{reputation.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                 <Button href={href} variant="secondary" className="w-full">Lihat CV</Button>
                 <Button variant="primary" className="w-full">Invite</Button>
            </div>
        </div>
    );
};

