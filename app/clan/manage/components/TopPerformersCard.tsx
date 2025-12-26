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
    <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      {/* Background Glow Effect */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="p-5 flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-clash uppercase tracking-wider opacity-90">{title}</h3>
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm shadow-inner">
              {icon}
            </div>
          </div>
          
          {isPlayerList && players && players.length > 0 ? (
            <div className="space-y-3">
              {players.slice(0, 3).map((player, index) => (
                <div key={player.tag} className="flex items-center text-sm group cursor-default">
                  <span className="flex items-center justify-center w-5 h-5 mr-3 text-xs font-bold rounded bg-black/20 text-white/70 group-hover:bg-black/40 transition-colors">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium flex-1">{player.name}</span>
                  
                  {/* Indikator Naik/Turun */}
                  {(title.includes('Promosi') || title.includes('Promotion')) && (
                    <ArrowUpIcon className="h-3 w-3 text-coc-green ml-1 opacity-80" />
                  )}
                  {(title.includes('Demosi') || title.includes('Demotion')) && (
                    <ArrowDownIcon className="h-3 w-3 text-coc-red ml-1 opacity-80" />
                  )}
                </div>
              ))}
              
              {players.length > 3 && (
                <p className="text-xs text-white/50 mt-2 pl-8 font-medium">
                  +{players.length - 3} {t.common.remaining.toLowerCase()}...
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-3xl font-clash tracking-tight truncate" title={String(value)}>
                {formatValue(value)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs font-medium opacity-70 font-sans leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopPerformersCard;