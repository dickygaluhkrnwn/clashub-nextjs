import { StarIcon } from '@/app/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/Button'; // <-- PERBAIKAN DI SINI

// -- Tipe Data untuk Props --
type TeamCardProps = {
  name: string;
  tag: string;
  rating: number;
  vision: 'Kompetitif' | 'Kasual';
  avgTh: number;
  logoUrl?: string;
  href: string;
};

type PostCardProps = {
    category: string;
    tag: string;
    title: string;
    author: string;
    stats: string;
    href: string;
  };

// -- Komponen TeamCard --
export const TeamCard = ({ name, tag, rating, vision, avgTh, logoUrl = "/images/clan-badge-placeholder.png", href }: TeamCardProps) => {
  const isCompetitive = vision === 'Kompetitif';

  return (
    <div className="card-stone flex flex-col justify-between">
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

