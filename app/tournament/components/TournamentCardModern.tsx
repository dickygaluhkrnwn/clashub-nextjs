'use client';

import React from 'react';
import Link from 'next/link';
import { Tournament } from '@/lib/clashub.types';
import { TrophyIcon, UsersIcon, ClockIcon, ArrowRightIcon, ShieldIcon } from '@/app/components/icons';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TournamentCardModernProps {
  tournament: Tournament;
  thRequirementText: string;
}

export const TournamentCardModern = ({ tournament, thRequirementText }: TournamentCardModernProps) => {
  const { id, title, bannerUrl, prizePool, status, participantCount, participantCountCurrent, tournamentStartsAt } = tournament;

  // Status Styling - Gaming Neon Glows
  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'registration_open': return 'bg-coc-green/10 text-coc-green border-coc-green/50 shadow-[0_0_10px_rgba(74,222,128,0.2)]';
      case 'ongoing': return 'bg-coc-red/10 text-coc-red border-coc-red/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      case 'completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/50';
      case 'scheduled': return 'bg-coc-blue/10 text-coc-blue border-coc-blue/50';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusLabel = (s: string) => {
    if (s === 'registration_open') return 'OPEN REG';
    if (s === 'registration_closed') return 'CLOSED';
    if (s === 'ongoing') return 'LIVE NOW';
    if (s === 'completed') return 'ENDED';
    if (s === 'scheduled') return 'UPCOMING';
    return s.replace('_', ' ').toUpperCase();
  };

  // Safe date formatting
  const startDate = new Date(tournamentStartsAt);
  const formattedDate = !isNaN(startDate.getTime()) 
    ? format(startDate, 'dd MMM yyyy', { locale: idLocale }) 
    : 'TBA';

  return (
    <Link href={`/tournament/${id}`} className="group relative block h-full">
      {/* Container Kartu - Gaming Glass Panel */}
      <div className="relative h-full overflow-hidden rounded-3xl bg-[#15171e] border border-white/10 transition-all duration-500 hover:border-coc-gold/50 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-1 flex flex-col group/card">
        
        {/* Banner Image Background */}
        <div className="relative h-48 w-full overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0b]" /> {/* Placeholder bg */}
          <img 
            src={bannerUrl || '/images/banner-teamhub.png'} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover/card:opacity-100"
          />
          {/* Gradient Overlay for Text Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#15171e] via-[#15171e]/40 to-transparent opacity-100" />
          
          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${getStatusStyle(status)}`}>
               {getStatusLabel(status)}
             </span>
          </div>

          {/* Date Badge */}
          <div className="absolute top-4 right-4 z-10">
             <div className="flex items-center gap-1.5 text-xs text-white font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                <ClockIcon className="h-3.5 w-3.5 text-coc-gold" />
                <span className="uppercase tracking-wide">{formattedDate}</span>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 flex flex-grow flex-col p-6 pt-2">
          
          {/* Title & TH */}
          <div className="mb-6">
            <h3 className="font-clash text-2xl font-bold text-white leading-tight group-hover:text-coc-gold transition-colors line-clamp-2 drop-shadow-sm mb-3">
              {title}
            </h3>
            <div className="flex items-center gap-2">
               <div className="px-2.5 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <ShieldIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">{thRequirementText}</span>
               </div>
            </div>
          </div>

          {/* Prize Pool (Highlight) */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-coc-gold/10 to-transparent border border-coc-gold/20 relative overflow-hidden group-hover:border-coc-gold/40 transition-colors">
             <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold shadow-[0_0_10px_#FFD700]" />
             <div className="flex items-center gap-3">
                <div className="p-2 bg-coc-gold/20 rounded-lg text-coc-gold">
                   <TrophyIcon className="h-5 w-5 drop-shadow-md" />
                </div>
                <div>
                    <p className="text-[9px] text-coc-gold uppercase tracking-widest font-bold opacity-80">Prize Pool</p>
                    <p className="text-xl font-clash font-bold text-white text-shadow-sm leading-none mt-0.5">{prizePool}</p>
                </div>
             </div>
          </div>

          {/* Footer Info */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
             <div className="flex items-center gap-2 text-xs text-gray-400 font-medium bg-[#0a0a0b] px-3 py-1.5 rounded-lg border border-white/5">
                <UsersIcon className="h-3.5 w-3.5 text-coc-blue" />
                <span className="tracking-wide font-mono">
                   <span className="text-white font-bold">{participantCountCurrent}</span>
                   <span className="mx-1 opacity-50">/</span>
                   {participantCount} Teams
                </span>
             </div>
             
             <span className="flex items-center text-xs font-bold text-coc-gold uppercase tracking-widest opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                Join Event <ArrowRightIcon className="ml-1 h-3 w-3" />
             </span>
          </div>

        </div>
      </div>
    </Link>
  );
};