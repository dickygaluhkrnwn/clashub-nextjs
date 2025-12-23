'use client';

import { StarIcon, TrophyIcon, ShieldIcon, UserIcon } from '@/app/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Tournament } from '@/lib/clashub.types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

// -- Tipe Data untuk Props --
export type TeamCardProps = {
  id: string;
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
  id: string;
  title: string;
  status: Tournament['status'];
  thRequirement: string;
  prizePool: string;
};

export type PlayerCardProps = {
  id: string;
  name: string;
  tag: string;
  thLevel: number;
  reputation: number;
  role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  avatarUrl?: string;
};

// Helper untuk status dan styling turnamen
const getTournamentStatusUI = (status: Tournament['status'], t: any) => {
  switch (status) {
    case 'scheduled':
      return {
        text: t.tournament.cardStatusDraft,
        badge: 'bg-cyan-600/20 text-cyan-300',
        border: 'border-cyan-500',
      };
    case 'registration_open':
      return {
        text: t.tournament.cardStatusRegistering,
        badge: 'bg-green-600/20 text-green-300',
        border: 'border-green-500',
      };
    case 'registration_closed':
      return {
        text: t.cards.statusRegClosed,
        badge: 'bg-yellow-600/20 text-yellow-300',
        border: 'border-yellow-500',
      };
    case 'ongoing':
      return {
        text: t.tournament.cardStatusOngoing,
        badge: 'bg-blue-600/20 text-blue-300 animate-pulse',
        border: 'border-blue-500',
      };
    case 'completed':
      return {
        text: t.tournament.cardStatusCompleted,
        badge: 'bg-purple-600/20 text-purple-300',
        border: 'border-purple-500',
      };
    case 'cancelled':
      return {
        text: t.tournament.cardStatusCancelled,
        badge: 'bg-red-600/20 text-red-300',
        border: 'border-red-500',
      };
    case 'draft':
    default:
      return {
        text: t.tournament.cardStatusDraft,
        badge: 'bg-gray-600/20 text-gray-300',
        border: 'border-gray-500',
      };
  }
};

// -- Komponen TeamCard (Modern Revamp) --
export const TeamCard = ({
  id,
  name,
  tag,
  rating,
  vision,
  avgTh,
  logoUrl = '/images/clan-badge-placeholder.png',
}: TeamCardProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  
  const isCompetitive = vision === 'Kompetitif'; 
  const displayVision = isCompetitive ? t.clanHub.visionCompetitive : t.clanHub.visionCasual;

  return (
    <div className="flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-b from-coc-stone to-[#1a1a1a] border border-white/10 hover:border-coc-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
      <div>
        {/* Header Card */}
        <div className="flex items-start gap-4 mb-5 pb-4 border-b border-white/5 relative">
          <div className="relative flex-shrink-0">
             <div className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center p-1 border border-white/5 group-hover:border-coc-gold/20 transition-colors">
                <Image
                    src={logoUrl}
                    alt={`${name} logo`}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-[#1a1a1a] text-[10px] px-2 py-0.5 rounded-full border border-coc-gold text-coc-gold font-bold shadow-sm flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current" /> {rating.toFixed(1)}
            </div>
          </div>
          
          <div className="flex-grow min-w-0 pt-1">
            <h4 className="font-clash text-lg text-white leading-tight truncate group-hover:text-coc-gold transition-colors tracking-wide">
              {name}
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">{tag}</p>
            
            {/* Visi Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isCompetitive
                  ? 'bg-coc-red/10 text-coc-red border border-coc-red/20'
                  : 'bg-coc-green/10 text-coc-green border border-coc-green/20'
              }`}
            >
              {displayVision}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col bg-black/20 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                <TrophyIcon className="w-3 h-3 text-coc-blue opacity-80"/> {t.cards.avgTh}
            </span>
            <span className="font-bold text-white text-sm font-clash tracking-wide">
              TH {avgTh.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
          
          <div className="flex flex-col bg-black/20 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                <StarIcon className="w-3 h-3 text-coc-gold opacity-80"/> {t.cards.reputation}
            </span>
            <span className="font-bold text-coc-gold text-sm font-clash tracking-wide">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tombol Action */}
      <Link href={`/clan/internal/${id}`} className="mt-auto block w-full group/btn">
        <Button variant="secondary" className="w-full justify-center text-sm py-3 bg-[#252525] border-white/5 group-hover/btn:bg-[#333] group-hover/btn:text-white transition-colors">
          {t.cards.viewClan}
        </Button>
      </Link>
    </div>
  );
};

// -- Komponen PostCard (Modern Revamp) --
export const PostCard = ({
  category,
  tag,
  title,
  author,
  stats,
  href,
}: PostCardProps) => {
  const { t } = useLanguage();

  return (
    <Link href={href} className="block group h-full">
      <div className="flex flex-col h-full p-5 rounded-2xl bg-gradient-to-br from-coc-stone to-[#1a1a1a] border border-white/10 hover:border-coc-gold/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-wider font-bold">
            <span className="px-2 py-1 bg-coc-red/20 text-coc-red border border-coc-red/20 rounded">
              {category}
            </span>
            <span className="px-2 py-1 bg-coc-gold/10 text-coc-gold border border-coc-gold/20 rounded">
              {tag}
            </span>
          </div>
          <h4 className="font-clash text-lg md:text-xl text-white group-hover:text-coc-gold transition-colors mb-4 line-clamp-2 leading-snug">
            {title}
          </h4>
        </div>
        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end text-xs text-gray-500 font-sans">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest opacity-70">{t.cards.by}</span>
            <span className="text-gray-300 font-bold group-hover:text-white transition-colors">{author}</span>
          </div>
          <span className="opacity-70 font-mono">{stats}</span>
        </div>
      </div>
    </Link>
  );
};

// -- Komponen TournamentCard (Modern Revamp) --
export const TournamentCard = ({
  id,
  title,
  status,
  thRequirement,
  prizePool,
}: TournamentCardProps) => {
  const { t } = useLanguage();
  const { text: statusText, badge: badgeClass, border: borderClass } =
    getTournamentStatusUI(status, t); 

  return (
    <div
      className={`relative flex flex-col sm:flex-row justify-between items-center p-6 gap-6 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-coc-stone border border-white/5 hover:border-white/10 transition-all hover:shadow-2xl overflow-hidden group`}
    >
      {/* Decorative colored bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderClass.replace('border-', 'bg-')}`} />

      <div className="flex-grow w-full sm:min-w-0 z-10 pl-2">
        <div className="flex items-center gap-3 mb-2">
            <span
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider font-sans border border-white/5 ${badgeClass}`}
            >
                {statusText}
            </span>
        </div>
        <h4 className="font-clash text-xl md:text-2xl text-white leading-tight break-words group-hover:text-coc-gold transition-colors">
          {title}
        </h4>
        <div className="flex flex-wrap gap-4 mt-3 text-sm font-sans text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldIcon className="w-4 h-4 text-gray-500"/>
            <span>{t.cards.requirements}: <span className="text-gray-200 font-bold">{thRequirement}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrophyIcon className="w-4 h-4 text-coc-gold"/>
            <span>{t.cards.prizePool}: <span className="text-coc-gold font-bold">{prizePool}</span></span>
          </div>
        </div>
      </div>
      
      <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:flex-shrink-0 z-10">
        <Button href={`/tournament/${id}`} variant="secondary" className="w-full sm:w-auto justify-center bg-white/5 border-white/10 hover:bg-white/10">
          {t.tournament.btnDetail}
        </Button>
      </div>
    </div>
  );
};

// -- Komponen PlayerCard (Modern Revamp) --
export const PlayerCard = ({
  id,
  name,
  tag,
  thLevel,
  reputation,
  role,
  avatarUrl = '/images/placeholder-avatar.png',
}: PlayerCardProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const roleColors: { [key: string]: string } = {
    Leader: 'text-coc-gold border-coc-gold/30 bg-coc-gold/10',
    'Co-Leader': 'text-gray-300 border-gray-500/30 bg-gray-500/10',
    Elder: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
    Member: 'text-gray-400 border-gray-600/30 bg-gray-600/5',
    'Free Agent': 'text-coc-green border-coc-green/30 bg-coc-green/10',
  };

  return (
    <div className="flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-b from-coc-stone to-[#1a1a1a] border border-white/10 hover:border-coc-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
      <div>
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/5">
          <div className="relative">
             <Image
                src={avatarUrl}
                alt={`${name} avatar`}
                width={64}
                height={64}
                className="rounded-full border-2 border-white/10 object-cover w-16 h-16 shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            {/* TH Level Badge */}
            <div className="absolute -bottom-1 -right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded border border-white/20 text-white font-bold backdrop-blur-sm">
                TH {thLevel}
            </div>
          </div>
          
          <div className="flex-grow min-w-0">
            <h4 className="font-clash text-lg text-white leading-tight truncate group-hover:text-coc-gold transition-colors tracking-wide">
              {name}
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">{tag}</p>
            
            {/* Role Badge */}
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${
                roleColors[role] || 'text-gray-500 border-gray-700 bg-gray-800'
              }`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3 mb-5">
          <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
            <span className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-coc-gold"/> {t.cards.reputation}
            </span>
            <span className="font-bold text-coc-gold text-base font-clash">
              {reputation.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      <Link href={`/player/${id}`} className="mt-auto block w-full group/btn">
        <Button variant="secondary" className="w-full justify-center text-sm py-3 bg-[#252525] border-white/5 group-hover/btn:bg-[#333] group-hover/btn:text-white transition-colors">
          {t.cards.viewPlayer}
        </Button>
      </Link>
    </div>
  );
};