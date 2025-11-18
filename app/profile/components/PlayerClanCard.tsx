// File: app/profile/components/PlayerClanCard.tsx
// Deskripsi: [UPDATE FASE 11.1] Komponen Card khusus untuk menampilkan
// informasi identitas Klan (Badge, Nama, Role). Menggunakan cache badge URL.

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';

interface PlayerClanCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
}

export const PlayerClanCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
}: PlayerClanCardProps) => {
  // --- 1. Logika Penggabungan Data (Live vs Cache) ---
  const clanName = fullPlayerData?.clan?.name ?? userProfile.clanName;
  const clanTag = fullPlayerData?.clan?.tag ?? userProfile.clanTag;
  const role = fullPlayerData?.role ?? userProfile.clanRole ?? 'member';

  // [UPDATE] Prioritaskan Live API -> Cache UserProfile -> Placeholder
  const clanBadgeUrl =
    fullPlayerData?.clan?.badgeUrls?.medium ??
    fullPlayerData?.clan?.badgeUrls?.small ??
    userProfile.clanBadgeUrl ?? // <-- Cache Baca Di Sini
    '/images/clan-badge-placeholder.png';

  // Cek apakah sedang loading data klan
  // [UPDATE] Tidak perlu loading jika kita sudah punya cache clanTag (dan badge)
  const showLoading = isLoading && !fullPlayerData && !userProfile.clanTag;

  // Cek apakah pemain memiliki klan
  const hasClan = !!clanTag;

  return (
    <div className="card-stone p-6 rounded-lg flex flex-col items-center text-center h-full relative overflow-hidden">
      {/* Background effect (opsional) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold to-transparent opacity-50" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-xl text-white self-start">
        <ShieldIcon className="h-5 w-5 text-coc-gold" /> Identitas Klan
      </h2>

      {showLoading ? (
        <div className="flex flex-col items-center justify-center flex-grow gap-4 py-4">
          <div className="w-20 h-20 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2 w-full">
            <div className="h-6 w-3/4 bg-white/5 rounded mx-auto animate-pulse" />
            <div className="h-4 w-1/2 bg-white/5 rounded mx-auto animate-pulse" />
          </div>
        </div>
      ) : hasClan ? (
        <div className="flex flex-col items-center gap-4 w-full z-10">
          {/* Badge Klan */}
          <div className="relative w-28 h-28 filter drop-shadow-lg transition-transform hover:scale-105 duration-300">
            <Image
              src={clanBadgeUrl}
              alt={`Badge klan ${clanName}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 112px, 112px"
              priority
            />
          </div>

          {/* Info Teks */}
          <div className="space-y-1">
            <Link
              href={
                userProfile.clanId
                  ? `/clan/internal/${userProfile.clanId}`
                  : `/clan/${encodeURIComponent(clanTag!)}`
              }
              className="group"
            >
              <h3 className="text-2xl font-clash text-white group-hover:text-coc-gold transition-colors line-clamp-1">
                {clanName}
              </h3>
              <p className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
                {clanTag}
              </p>
            </Link>

            {/* Role Badge */}
            <div className="mt-4 inline-block px-4 py-1 bg-coc-gold/10 border border-coc-gold/30 rounded-full">
              <p className="text-sm font-clash text-coc-gold capitalize tracking-wide">
                {role.replace('admin', 'Elder').replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // State: Tidak punya klan
        <div className="flex flex-col items-center justify-center flex-grow text-gray-400 gap-2 py-4">
          <ShieldIcon className="h-12 w-12 opacity-20" />
          <p className="font-sans text-sm">Pemain ini tidak terikat klan.</p>
        </div>
      )}
    </div>
  );
};