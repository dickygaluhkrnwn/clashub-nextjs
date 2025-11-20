'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale'; // [BARU] Import locale enUS
import { FirestoreDocument, CwlArchive } from '@/lib/types';
import { ChevronDownIcon, ChevronUpIcon } from '@/app/components/icons';
import CwlWarRow from './CwlWarRow';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

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
  const { t, language } = useLanguage(); // [BARU] Init Language
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  // [i18n] Pilih locale date-fns berdasarkan bahasa aplikasi
  const dateLocale = language === 'id' ? id : enUS;

  // Format Musim (Contoh: "2025-11" -> "November 2025")
  const formattedSeason = archive.season
    ? format(new Date(archive.season + '-02'), 'MMMM yyyy', { locale: dateLocale })
    : t.common.noData;

  const rounds = archive.rounds || [];

  return (
    <div className="card-stone border border-coc-gold-dark/30 rounded-lg overflow-hidden">
      {/* Header Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-coc-stone/30 hover:bg-coc-stone/50 transition-colors"
      >
        <h3 className="text-xl font-clash text-coc-gold">{formattedSeason}</h3>
        {isOpen ? (
          <ChevronUpIcon className="h-6 w-6 text-coc-gold" />
        ) : (
          <ChevronDownIcon className="h-6 w-6 text-gray-400" />
        )}
      </button>

      {/* Konten Accordion (Tabel Ronde) */}
      {isOpen && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
            <thead className="bg-coc-stone/70 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">
                  {t.clanCwl.colRound}
                </th>
                <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                  {t.clanCwl.colEnemy}
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  {t.clanWar.colResult}
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  {t.clanWar.colScore}
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  {t.clanWar.colDestruction}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coc-gold-dark/10">
              {rounds.map((round, index) => (
                <CwlWarRow
                  key={round.clan?.tag || index}
                  round={round}
                  ourClanTag={ourClanTag}
                  roundNumber={index + 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CwlSeasonAccordion;