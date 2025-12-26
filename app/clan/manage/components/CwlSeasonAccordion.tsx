'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { FirestoreDocument, CwlArchive } from '@/lib/clashub.types'; 
import { ChevronDownIcon, ChevronUpIcon, TrophyIcon } from '@/app/components/icons';
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
  const leagueName = (archive as any).league || 'Unknown League';

  return (
    <div className="bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 group">
      {/* Header Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors duration-200 ${isOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
      >
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-coc-gold/20 text-coc-gold' : 'bg-white/5 text-gray-400 group-hover:text-coc-gold/80 group-hover:bg-coc-gold/10'}`}>
                <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
                <h3 className={`text-lg font-clash tracking-wide ${isOpen ? 'text-white' : 'text-gray-300'}`}>{formattedSeason}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{leagueName}</p>
            </div>
        </div>
        
        <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10 text-white' : 'text-gray-500'}`}>
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </button>

      {/* Konten Accordion (Tabel Ronde) */}
      {isOpen && (
        <div className="border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-black/20 text-gray-400 font-clash uppercase tracking-wider">
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
                  // [PERBAIKAN UTAMA] Cek apakah data 'round' valid sebelum dirender
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
                        <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                            No round data available
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