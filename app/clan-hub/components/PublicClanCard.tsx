import React from 'react';
import Link from 'next/link';
import { PublicClanIndex } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { ShieldIcon } from '@/app/components/icons';

interface PublicClanCardProps {
  clan: PublicClanIndex;
}

/**
 * Komponen Card untuk menampilkan data klan publik (dari cache atau search).
 * Diekstrak dari TeamHubClient.tsx.
 */
export const PublicClanCard = ({ clan }: PublicClanCardProps) => {
  // Link Klan Publik In-Game
  const cocProfileUrl = `/clan/${encodeURIComponent(clan.tag)}`;

  return (
    <div className="card-stone flex flex-col justify-between h-full p-5 transition-transform hover:scale-[1.02] duration-300">
      <div>
        <div className="flex items-start gap-4 mb-4 border-b border-coc-gold-dark/20 pb-4">
          <img // Menggunakan img tag untuk kemudahan error handling fallback
            src={clan.badgeUrls?.large || '/images/clan-badge-placeholder.png'}
            alt={`${clan.name} Badge`}
            className="w-16 h-16 rounded-full border-3 border-coc-gold object-cover flex-shrink-0 shadow-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/clan-badge-placeholder.png';
            }}
          />
          <div className="flex-grow min-w-0">
            <h4 className="font-clash text-xl text-white leading-tight truncate">
              {clan.name}
            </h4>
            <p className="text-sm text-coc-gold-dark font-mono">{clan.tag}</p>
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1 font-sans">
              <ShieldIcon className="h-4 w-4 fill-current text-coc-gold" />
              <span>Level {clan.clanLevel}</span>
            </div>
          </div>
        </div>

        {/* Detail Statistik Klan Publik */}
        <div className="space-y-3 pt-4 font-sans text-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Anggota:</span>
            <span className="font-bold text-white">{clan.memberCount}/50</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Tipe Rekrutmen:</span>
            <span className="font-bold text-coc-green capitalize">
              {clan.type || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-300">Poin Klan:</span>
            <span className="font-bold text-white">
              {clan.clanPoints?.toLocaleString() || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      {/* Tombol ke halaman Clan Publik */}
      <Link href={cocProfileUrl} className="mt-5">
        <Button variant="primary" className="w-full">
          Lihat Profil CoC
        </Button>
      </Link>
    </div>
  );
};