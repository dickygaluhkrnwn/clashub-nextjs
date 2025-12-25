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
 * Desain: Timeline List Glassmorphism.
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'join': return 'text-coc-green bg-coc-green/10 border-coc-green/20';
      case 'leave': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'kicked': return 'text-coc-red bg-coc-red/10 border-coc-red/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-coc-green/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <ShieldIcon className="h-5 w-5 text-coc-gold" /> {t.profileHistory.title}
      </h2>

      <div className="space-y-4 relative z-10">
        {clanHistory.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
            <ShieldIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {t.profileHistory.empty}
            </p>
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-3 space-y-6 py-2">
            {clanHistory.map((entry) => (
              <div key={entry.id} className="relative pl-6 group">
                {/* Timeline Dot */}
                <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-coc-dark ${
                   entry.action === 'join' ? 'bg-coc-green' : entry.action === 'kicked' ? 'bg-coc-red' : 'bg-orange-400'
                }`} />
                
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors group-hover:border-white/10">
                  <div className="flex justify-between items-start mb-1">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-2 ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                      <span>
                        {entry.action === 'join'
                          ? t.profileHistory.joined
                          : entry.action === 'leave'
                          ? t.profileHistory.left
                          : t.profileHistory.kicked}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold uppercase">
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
                  
                  <h4 className="text-white font-clash font-semibold text-lg">
                    {entry.clanName || t.profileHistory.unknownClan}
                  </h4>
                  {entry.clanTag && (
                    <p className="text-xs font-mono text-gray-500">
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