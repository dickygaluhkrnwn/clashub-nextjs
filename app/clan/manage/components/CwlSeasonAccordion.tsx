'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { FirestoreDocument, CwlArchive } from '@/lib/clashub.types'; 
import { ChevronDownIcon, TrophyIcon } from '@/app/components/icons';
import CwlWarRow from './CwlWarRow';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CwlSeasonAccordionProps {
  archive: FirestoreDocument<CwlArchive>;
  ourClanTag: string;
  isDefaultOpen: boolean;
}

const CwlSeasonAccordion: React.FC<CwlSeasonAccordionProps> = ({
  archive,
  ourClanTag,
  isDefaultOpen,
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  const dateLocale = language === 'id' ? id : enUS;

  const formattedSeason = archive.season
    ? format(new Date(archive.season + '-02'), 'MMMM yyyy', { locale: dateLocale })
    : t.common.noData;

  const rounds = archive.rounds || [];
  
  // Casting 'any' untuk properti 'league' yang mungkin belum ada di definisi tipe CwlArchive
  const leagueName = (archive as any).league?.name || (archive as any).league || 'Unknown League';

  return (
    <div className="bg-[#15171e]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-coc-gold/20 shadow-lg group ring-1 ring-white/5">
      {/* Header Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors duration-200 relative overflow-hidden ${isOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
      >
        {/* Glow behind header if open */}
        {isOpen && <div className="absolute inset-0 bg-coc-blue/5 pointer-events-none" />}

        <div className="flex items-center gap-4 relative z-10">
            <div className={`p-2.5 rounded-xl border transition-all duration-300 ${isOpen ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'bg-[#0a0a0b] text-gray-500 border-white/5 group-hover:text-coc-gold group-hover:border-coc-gold/20'}`}>
                <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
                <h3 className={`text-lg font-clash tracking-wide transition-colors ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                    {formattedSeason}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-coc-blue inline-block"></span>
                    {leagueName}
                </p>
            </div>
        </div>
        
        <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'rotate-180 bg-white/10 text-white shadow-inner' : 'text-gray-500 group-hover:text-white'}`}>
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </button>

      {/* Konten Accordion (Tabel Ronde) */}
      {isOpen && (
        <div className="border-t border-white/5 animate-in slide-in-from-top-2 duration-200 bg-[#0a0a0b]/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-[#0a0a0b]/80 backdrop-blur-sm text-coc-gold font-clash uppercase tracking-widest text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 text-center w-16">{t.clanCwl.colRound}</th>
                  <th className="px-4 py-3 text-left">{t.clanCwl.colEnemy}</th>
                  <th className="px-4 py-3 text-center">{t.clanWar.colResult}</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">{t.clanWar.colScore}</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">{t.clanWar.colDestruction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rounds.map((round, index) => {
                  if (!round) return null;

                  return (
                    <CwlWarRow
                      key={round.clan?.tag || index}
                      round={round}
                      ourClanTag={ourClanTag}
                      roundNumber={index + 1}
                    />
                  );
                })}
                
                {/* Fallback jika data kosong */}
                {rounds.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 italic font-mono bg-white/0">
                            No round data available for this season
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CwlSeasonAccordion;