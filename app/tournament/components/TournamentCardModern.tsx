'use client';

import React from 'react';
import Link from 'next/link';
import { Tournament } from '@/lib/clashub.types';
import { TrophyIcon, UsersIcon, ClockIcon, ArrowRightIcon } from '@/app/components/icons';
import { format } from 'date-fns';

interface TournamentCardModernProps {
  tournament: Tournament;
  thRequirementText: string;
}

export const TournamentCardModern = ({ tournament, thRequirementText }: TournamentCardModernProps) => {
  const { id, title, bannerUrl, prizePool, status, participantCount, participantCountCurrent, tournamentStartsAt } = tournament;

  // Status Styling
  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'registration_open': return 'bg-coc-green text-coc-stone-dark shadow-[0_0_10px_#4ade80]';
      case 'ongoing': return 'bg-coc-red text-white animate-pulse shadow-[0_0_10px_#ef4444]';
      case 'completed': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (s: string) => {
    if (s === 'registration_open') return 'OPEN';
    if (s === 'registration_closed') return 'CLOSED';
    if (s === 'ongoing') return 'LIVE';
    if (s === 'completed') return 'ENDED';
    return s;
  };

  const startDate = new Date(tournamentStartsAt);
  const formattedDate = !isNaN(startDate.getTime()) ? format(startDate, 'dd MMM') : 'TBA';

  return (
    <Link href={`/tournament/${id}`} className="group relative block h-full">
      {/* Container Kartu */}
      <div className="relative h-full overflow-hidden rounded-2xl bg-coc-dark-blue border border-white/10 transition-all duration-300 hover:border-coc-gold/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] hover:-translate-y-1">
        
        {/* Banner Image Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerUrl || '/images/banner-teamhub.png'} 
            alt={title} 
            className="h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coc-dark-blue via-coc-dark-blue/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-5">
          
          {/* Top Row: Status & Date */}
          <div className="flex justify-between items-start mb-4">
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(status)}`}>
               {getStatusLabel(status)}
             </span>
             <div className="flex items-center gap-1 text-xs text-coc-gold font-mono bg-black/40 px-2 py-1 rounded border border-coc-gold/20">
                <ClockIcon className="h-3 w-3" />
                {formattedDate}
             </div>
          </div>

          {/* Title & TH */}
          <div className="mb-4 flex-grow">
            <h3 className="font-clash text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-coc-gold transition-colors line-clamp-2">
              {title}
            </h3>
            <p className="mt-1 text-xs text-gray-400 font-sans flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-coc-blue"></span>
               {thRequirementText}
            </p>
          </div>

          {/* Prize Pool (Highlight) */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-coc-gold/10 to-transparent border-l-4 border-coc-gold">
             <p className="text-[10px] text-coc-gold uppercase tracking-widest font-bold mb-0.5">Prize Pool</p>
             <p className="text-xl font-clash font-bold text-white text-shadow-sm">{prizePool}</p>
          </div>

          {/* Footer Info */}
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
             <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <UsersIcon className="h-4 w-4" />
                <span>{participantCountCurrent}/{participantCount} Teams</span>
             </div>
             
             <span className="flex items-center text-xs font-bold text-coc-gold opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                JOIN NOW <ArrowRightIcon className="ml-1 h-3 w-3" />
             </span>
          </div>

        </div>
      </div>
    </Link>
  );
};