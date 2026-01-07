'use client';

import React from 'react';
import { ShieldIcon, LogInIcon, LogOutIcon, BanIcon } from '@/app/components/icons';
import { FirestoreDocument } from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface TeamHistoryCardProps {
  clanHistory: FirestoreDocument<DocumentData>[];
}

/**
 * Komponen Card "Riwayat Tim".
 * Desain: Timeline List Glassmorphism dengan Gaming Aesthetics.
 */
export const TeamHistoryCard = ({ clanHistory }: TeamHistoryCardProps) => {
  const { t } = useLanguage();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'join': return <LogInIcon className="h-4 w-4" />;
      case 'leave': return <LogOutIcon className="h-4 w-4" />;
      case 'kicked': return <BanIcon className="h-4 w-4" />;
      default: return <ShieldIcon className="h-4 w-4" />;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'join': return 'bg-coc-green/10 text-coc-green border-coc-green/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]';
      case 'leave': return 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
      case 'kicked': return 'bg-coc-red/10 text-coc-red border-coc-red/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  const getTimelineDotColor = (action: string) => {
      switch (action) {
        case 'join': return 'bg-coc-green shadow-[0_0_8px_rgba(74,222,128,0.8)]';
        case 'leave': return 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]';
        case 'kicked': return 'bg-coc-red shadow-[0_0_8px_rgba(239,68,68,0.8)]';
        default: return 'bg-gray-500';
      }
  };

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-green/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-green/10 transition-all duration-700" />

      {/* Header - White Text + Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-green/10 rounded-lg border border-coc-green/20 shadow-[0_0_10px_rgba(74,222,128,0.3)]">
            <ShieldIcon className="h-5 w-5 text-coc-green" /> 
        </div>
        <span>
            {t.profileHistory.title}
        </span>
      </h2>

      <div className="space-y-4 relative z-10">
        {clanHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
            <ShieldIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">{t.profileHistory.empty}</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-white/5 ml-3 space-y-6 py-2">
            {clanHistory.map((entry) => (
              <div key={entry.id} className="relative pl-8 group/item">
                {/* Timeline Dot with Glow */}
                <div className={`absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#15171e] z-10 transition-colors ${getTimelineDotColor(entry.action)}`} />
                
                <div className="bg-[#0f1115] border border-white/5 rounded-xl p-4 hover:bg-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-lg group-hover/item:-translate-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getActionStyle(entry.action)}`}>
                      {getActionIcon(entry.action)}
                      <span>
                        {entry.action === 'join'
                          ? t.profileHistory.joined
                          : entry.action === 'leave'
                          ? t.profileHistory.left
                          : t.profileHistory.kicked}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-tight">
                      {entry.timestamp
                        ? new Date(
                            (entry.timestamp as any)._seconds * 1000 ||
                              entry.timestamp
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : t.profileHistory.unknownDate}
                    </span>
                  </div>
                  
                  <h4 className="text-white font-clash font-bold text-lg leading-tight group-hover/item:text-coc-gold transition-colors drop-shadow-sm">
                    {entry.clanName || t.profileHistory.unknownClan}
                  </h4>
                  {entry.clanTag && (
                    <p className="text-xs font-mono text-gray-500 mt-1 font-medium group-hover/item:text-gray-400 transition-colors">
                      {entry.clanTag}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};