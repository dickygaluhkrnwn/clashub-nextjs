'use client';

import React from 'react';
import { TopPerformerPlayer } from '@/lib/clashub.types'; // Pastikan path import tipe benar
import { ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface TopPerformersCardProps {
  title: string;
  icon: React.ReactNode;
  value: number | string;
  description: string;
  className: string;
  players?: TopPerformerPlayer[];
  isPlayerList?: boolean;
}

const TopPerformersCard: React.FC<TopPerformersCardProps> = ({ 
  title, icon, value, description, className, players, isPlayerList = false 
}) => {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString(locale);
    }
    return val;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${className}`}>
      {/* Background Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-colors" />
      
      <div className="p-5 flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-clash uppercase tracking-wider opacity-90">{title}</h3>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          </div>
          
          {isPlayerList && players && players.length > 0 ? (
            <div className="space-y-3 min-h-[80px]">
              {players.slice(0, 3).map((player, index) => (
                <div key={player.tag} className="flex items-center text-sm group/item cursor-default hover:bg-white/5 p-1 rounded-lg transition-colors -mx-1">
                  <span className="flex items-center justify-center w-5 h-5 mr-3 text-[10px] font-bold font-mono rounded bg-black/30 text-white/80 border border-white/5 group-hover/item:bg-black/50 transition-colors">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium flex-1 text-white/90 font-clash tracking-wide">{player.name}</span>
                  
                  {/* Indikator Naik/Turun */}
                  {(title.toLowerCase().includes('promosi') || title.toLowerCase().includes('promotion')) && (
                    <ArrowUpIcon className="h-3 w-3 text-coc-green ml-1 opacity-80" />
                  )}
                  {(title.toLowerCase().includes('demosi') || title.toLowerCase().includes('demotion')) && (
                    <ArrowDownIcon className="h-3 w-3 text-coc-red ml-1 opacity-80" />
                  )}
                </div>
              ))}
              
              {players.length > 3 && (
                <p className="text-[10px] text-white/40 mt-2 pl-9 font-mono uppercase tracking-widest">
                  +{players.length - 3} {t.common.remaining.toLowerCase()}...
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2 min-h-[80px] flex flex-col justify-center">
              <p className="text-4xl font-clash tracking-tight truncate drop-shadow-sm text-white" title={String(value)}>
                {formatValue(value)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[10px] font-medium opacity-60 font-mono uppercase tracking-wider leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopPerformersCard;