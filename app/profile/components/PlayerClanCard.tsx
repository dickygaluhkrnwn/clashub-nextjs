'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldIcon, ChevronRightIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

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
  const { t } = useLanguage();
  
  // Logika Prioritas Data
  const clanName = fullPlayerData?.clan?.name ?? userProfile.clanName;
  const clanTag = fullPlayerData?.clan?.tag ?? userProfile.clanTag;
  const role = fullPlayerData?.role ?? userProfile.clanRole ?? 'member';

  const clanBadgeUrl =
    fullPlayerData?.clan?.badgeUrls?.medium ??
    fullPlayerData?.clan?.badgeUrls?.small ??
    userProfile.clanBadgeUrl ??
    '/images/clan-badge-placeholder.png';

  // Smart Check: Hanya loading jika benar-benar tidak ada data sama sekali
  const showLoading = isLoading && !fullPlayerData && !userProfile.clanTag && !userProfile.clanName;
  const hasClan = !!clanTag;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center h-full relative overflow-hidden group hover:-translate-y-1 hover:border-coc-blue/30 transition-all duration-300 shadow-lg">
      {/* Ambient Blue Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-coc-blue/10 rounded-full blur-3xl pointer-events-none group-hover:bg-coc-blue/20 transition-colors duration-500" />
      
      {/* Header */}
      <div className="w-full flex items-center justify-start mb-4 z-10">
        <h2 className="flex items-center gap-2 font-clash text-lg text-white">
          <ShieldIcon className="h-5 w-5 text-coc-blue" /> {t.profileCards.clanIdentity}
        </h2>
      </div>

      {showLoading ? (
        <div className="flex flex-col items-center justify-center flex-grow gap-4 w-full py-2">
          <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2 w-full max-w-[200px]">
            <div className="h-6 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-1/2 mx-auto animate-pulse" />
          </div>
        </div>
      ) : hasClan ? (
        <div className="flex flex-col items-center gap-2 w-full z-10 flex-grow justify-center">
          {/* Clan Badge */}
          <div className="relative w-28 h-28 drop-shadow-2xl transition-transform group-hover:scale-110 duration-500 ease-out">
            <Image
              src={clanBadgeUrl}
              alt={`Badge klan ${clanName}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 112px, 112px"
              priority
            />
          </div>

          {/* Clan Info & Link */}
          <div className="mt-2 space-y-1">
            <Link
              href={userProfile.clanId ? `/clan/internal/${userProfile.clanId}` : `/clan/${encodeURIComponent(clanTag!)}`}
              className="block group-hover:opacity-100 transition-opacity"
            >
              <h3 className="text-2xl font-clash text-white group-hover:text-coc-blue transition-colors truncate max-w-[250px] mx-auto leading-tight">
                {clanName}
              </h3>
              <p className="text-xs font-mono text-gray-500 group-hover:text-gray-300 transition-colors mt-1">
                {clanTag}
              </p>
            </Link>

            {/* Role Badge */}
            <div className="pt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-coc-blue/10 border border-coc-blue/20 text-coc-blue text-xs font-bold uppercase tracking-wider shadow-sm">
                {role.replace('admin', 'Elder').replace('_', ' ')}
              </span>
            </div>
          </div>
          
          {/* View Details Link */}
          <Link 
             href={userProfile.clanId ? `/clan/internal/${userProfile.clanId}` : `/clan/${encodeURIComponent(clanTag!)}`}
             className="mt-4 text-xs text-gray-500 flex items-center gap-1 group-hover:text-white transition-colors hover:underline"
          >
            {/* [FIX] Menggunakan t.profileSidebar.viewDetails */}
            {t.profileSidebar.viewDetails} <ChevronRightIcon className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        // State: No Clan
        <div className="flex flex-col items-center justify-center flex-grow text-gray-500 gap-3 py-6">
          <div className="p-4 bg-white/5 rounded-full border border-white/5">
            <ShieldIcon className="h-10 w-10 opacity-30" />
          </div>
          <p className="font-medium text-sm max-w-[200px] text-center">
            {t.profileCards.notInClan}
          </p>
        </div>
      )}
    </div>
  );
};