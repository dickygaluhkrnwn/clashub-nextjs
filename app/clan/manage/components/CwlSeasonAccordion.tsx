// File: app/clan/manage/components/CwlSeasonAccordion.tsx
// Komponen ini menampilkan satu musim CWL (misal "November 2025") sebagai accordion.
// Saat dibuka, ia me-render tabel CwlWarRow.

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FirestoreDocument, CwlArchive } from '@/lib/types';
import { ChevronDownIcon, ChevronUpIcon } from '@/app/components/icons';
import CwlWarRow from './CwlWarRow'; // Impor dari file di Canvas

interface CwlSeasonAccordionProps {
  archive: FirestoreDocument<CwlArchive>;
  ourClanTag: string;
  // Buka accordion pertama secara default
  isDefaultOpen: boolean; 
}

const CwlSeasonAccordion: React.FC<CwlSeasonAccordionProps> = ({
  archive,
  ourClanTag,
  isDefaultOpen,
}) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  // Format Musim (Contoh: "2025-11" -> "November 2025")
  const formattedSeason = archive.season
    ? format(new Date(archive.season + '-02'), 'MMMM yyyy', { locale: id })
    : 'Musim Tidak Diketahui';

  const rounds = archive.rounds || [];

  return (
    <div className="card-stone border border-coc-gold-dark/30 rounded-lg overflow-hidden">
      {/* Header Accordion (Bisa diklik) */}
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
                  Ronde
                </th>
                <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                  Lawan
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  Hasil
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  Skor
                </th>
                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                  Kehancuran
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
