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
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        border: 'border-cyan-500',
      };
    case 'registration_open':
      return {
        text: t.tournament.cardStatusRegistering,
        badge: 'bg-coc-green/10 text-coc-green border-coc-green/20',
        border: 'border-coc-green',
      };
    case 'registration_closed':
      return {
        text: t.cards.statusRegClosed,
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        border: 'border-yellow-500',
      };
    case 'ongoing':
      return {
        text: t.tournament.cardStatusOngoing,
        badge: 'bg-coc-blue/10 text-coc-blue border-coc-blue/20 animate-pulse',
        border: 'border-coc-blue',
      };
    case 'completed':
      return {
        text: t.tournament.cardStatusCompleted,
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        border: 'border-purple-500',
      };
    case 'cancelled':
      return {
        text: t.tournament.cardStatusCancelled,
        badge: 'bg-coc-red/10 text-coc-red border-coc-red/20',
        border: 'border-coc-red',
      };
    case 'draft':
    default:
      return {
        text: t.tournament.cardStatusDraft,
        badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
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
    <div className="flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-b from-[#1a1d26] to-[#0f1115] border border-white/10 hover:border-coc-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group relative overflow-hidden">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-coc-gold/50 transition-all duration-500" />
      
      <div>
        {/* Header Card */}
        <div className="flex items-start gap-4 mb-5 pb-4 border-b border-white/5 relative">
          <div className="relative flex-shrink-0">
             <div className="w-16 h-16 rounded-xl bg-[#0a0a0b] flex items-center justify-center p-1 border border-white/5 group-hover:border-coc-gold/20 transition-colors shadow-inner">
                <Image
                    src={logoUrl}
                    alt={`${name} logo`}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-[#1a1a1a] text-[10px] px-2 py-0.5 rounded-full border border-coc-gold/30 text-coc-gold font-bold shadow-sm flex items-center gap-1">
                <StarIcon className="w-3 h-3 fill-current" /> {rating.toFixed(1)}
            </div>
          </div>
          
          <div className="flex-grow min-w-0 pt-1">
            <h4 className="font-clash text-lg text-white leading-tight truncate group-hover:text-coc-gold transition-colors tracking-wide drop-shadow-sm">
              {name}
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2 tracking-wide font-bold opacity-70">{tag}</p>
            
            {/* Visi Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                isCompetitive
                  ? 'bg-coc-red/10 text-coc-red border-coc-red/20'
                  : 'bg-coc-green/10 text-coc-green border-coc-green/20'
              }`}
            >
              {displayVision}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col bg-[#0a0a0b] p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5 tracking-wider">
                <TrophyIcon className="w-3 h-3 text-coc-blue opacity-80"/> {t.cards.avgTh}
            </span>
            <span className="font-bold text-white text-sm font-clash tracking-wide pl-4 border-l-2 border-coc-blue/30">
              TH {avgTh.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
          
          <div className="flex flex-col bg-[#0a0a0b] p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5 tracking-wider">
                <StarIcon className="w-3 h-3 text-coc-gold opacity-80"/> {t.cards.reputation}
            </span>
            <span className="font-bold text-coc-gold text-sm font-clash tracking-wide pl-4 border-l-2 border-coc-gold/30">
              {rating.toFixed(1)} / 5.0
            </span>
          </div>
        </div>
      </div>
      
      {/* Tombol Action */}
      <Link href={`/clan/internal/${id}`} className="mt-auto block w-full group/btn">
        <Button variant="secondary" className="w-full justify-center text-xs py-3 bg-[#1a1a1a] border-white/10 group-hover/btn:bg-[#252525] group-hover/btn:text-white transition-all shadow-none hover:shadow-lg font-bold tracking-widest">
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
      <div className="flex flex-col h-full p-6 rounded-2xl bg-gradient-to-br from-[#1a1d26] to-[#0f1115] border border-white/10 hover:border-coc-gold/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
        {/* Background Glow on Hover */}
        <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex-grow relative z-10">
          <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-wider font-bold">
            <span className="px-2 py-1 bg-coc-red/10 text-coc-red border border-coc-red/20 rounded-md">
              {category}
            </span>
            <span className="px-2 py-1 bg-coc-gold/10 text-coc-gold border border-coc-gold/20 rounded-md">
              {tag}
            </span>
          </div>
          <h4 className="font-clash text-lg md:text-xl text-white group-hover:text-coc-gold transition-colors mb-4 line-clamp-2 leading-snug drop-shadow-sm">
            {title}
          </h4>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end text-xs text-gray-500 font-sans relative z-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{t.cards.by}</span>
            <span className="text-gray-300 font-bold group-hover:text-white transition-colors flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> {author}
            </span>
          </div>
          <span className="opacity-70 font-mono text-[10px] bg-[#0a0a0b] px-2 py-1 rounded border border-white/5">{stats}</span>
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
      className={`relative flex flex-col sm:flex-row justify-between items-center p-6 gap-6 rounded-2xl bg-gradient-to-r from-[#15171e] to-[#1a1d26] border border-white/5 hover:border-white/10 transition-all hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden group`}
    >
      {/* Decorative colored bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${borderClass.replace('border-', 'bg-')} shadow-[0_0_15px_currentColor]`} />

      <div className="flex-grow w-full sm:min-w-0 z-10 pl-4">
        <div className="flex items-center gap-3 mb-3">
            <span
              className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${badgeClass} shadow-sm`}
            >
                {statusText}
            </span>
        </div>
        <h4 className="font-clash text-xl md:text-2xl text-white leading-tight break-words group-hover:text-coc-gold transition-colors drop-shadow-md">
          {title}
        </h4>
        <div className="flex flex-wrap gap-4 mt-4 text-sm font-sans text-gray-400">
          <div className="flex items-center gap-2 bg-[#0a0a0b] px-3 py-1.5 rounded-lg border border-white/5">
            <ShieldIcon className="w-4 h-4 text-gray-500"/>
            <span className="text-xs uppercase font-bold tracking-wide text-gray-500">{t.cards.requirements}: <span className="text-gray-200">{thRequirement}</span></span>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0a0b] px-3 py-1.5 rounded-lg border border-white/5">
            <TrophyIcon className="w-4 h-4 text-coc-gold"/>
            <span className="text-xs uppercase font-bold tracking-wide text-gray-500">{t.cards.prizePool}: <span className="text-coc-gold">{prizePool}</span></span>
          </div>
        </div>
      </div>
      
      <div className="w-full sm:w-auto mt-4 sm:mt-0 sm:flex-shrink-0 z-10">
        <Button href={`/tournament/${id}`} variant="secondary" className="w-full sm:w-auto justify-center bg-white/5 border-white/10 hover:bg-white/10 hover:text-white px-8 font-bold tracking-wider text-xs">
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
    Leader: 'text-coc-red border-coc-red/30 bg-coc-red/10 shadow-[0_0_10px_rgba(220,38,38,0.2)]',
    'Co-Leader': 'text-coc-gold border-coc-gold/30 bg-coc-gold/10 shadow-[0_0_10px_rgba(255,215,0,0.2)]',
    Elder: 'text-coc-blue border-coc-blue/30 bg-coc-blue/10',
    Member: 'text-gray-400 border-gray-600/30 bg-gray-600/5',
    'Free Agent': 'text-coc-green border-coc-green/30 bg-coc-green/10',
  };

  return (
    <div className="flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-b from-[#1a1d26] to-[#0f1115] border border-white/10 hover:border-coc-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group relative overflow-hidden">
      
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-coc-blue/50 transition-all duration-500" />

      <div>
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/5">
          <div className="relative">
             <div className="p-0.5 rounded-full bg-gradient-to-b from-white/10 to-transparent">
                <Image
                    src={avatarUrl}
                    alt={`${name} avatar`}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-[#15171e] object-cover w-16 h-16 shadow-lg group-hover:scale-105 transition-transform duration-300 bg-[#0a0a0b]"
                />
             </div>
            {/* TH Level Badge */}
            <div className="absolute -bottom-1 -right-1 bg-[#0a0a0b] text-[9px] px-2 py-0.5 rounded-full border border-white/20 text-white font-bold backdrop-blur-sm shadow-md flex items-center gap-0.5">
               <span className="text-coc-gold">TH</span> {thLevel}
            </div>
          </div>
          
          <div className="flex-grow min-w-0">
            <h4 className="font-clash text-lg text-white leading-tight truncate group-hover:text-coc-gold transition-colors tracking-wide drop-shadow-sm">
              {name}
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2 font-bold opacity-70 tracking-wide">{tag}</p>
            
            {/* Role Badge */}
            <span
              className={`inline-block px-2.5 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${
                roleColors[role] || 'text-gray-500 border-gray-700 bg-gray-800'
              }`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3 mb-5">
          <div className="flex justify-between items-center bg-[#0a0a0b] p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <span className="text-gray-500 text-[10px] font-bold uppercase flex items-center gap-2 tracking-wider">
                <StarIcon className="w-4 h-4 text-coc-gold opacity-80"/> {t.cards.reputation}
            </span>
            <div className="flex items-center gap-1">
                <span className="font-bold text-white text-base font-clash tracking-wide">
                {reputation.toFixed(1)}
                </span>
                <span className="text-[10px] text-gray-600 font-bold">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>
      
      <Link href={`/player/${id}`} className="mt-auto block w-full group/btn">
        <Button variant="secondary" className="w-full justify-center text-xs py-3 bg-[#1a1a1a] border-white/10 group-hover/btn:bg-[#252525] group-hover/btn:text-white transition-all shadow-none hover:shadow-lg font-bold tracking-widest">
          {t.cards.viewPlayer}
        </Button>
      </Link>
    </div>
  );
};