'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldIcon, UsersIcon } from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PlayerClanCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
}

/**
 * Komponen Card "Identitas Klan".
 * Desain: Gaming Banner dengan fokus pada Badge dan Nama Klan.
 */
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
  const clanLevel = fullPlayerData?.clan?.clanLevel ?? 0;

  const clanBadgeUrl =
    fullPlayerData?.clan?.badgeUrls?.medium ??
    fullPlayerData?.clan?.badgeUrls?.small ??
    userProfile.clanBadgeUrl ??
    '/images/clan-badge-placeholder.png';

  // Smart Check: Hanya loading jika benar-benar tidak ada data sama sekali
  const showLoading = isLoading && !fullPlayerData && !userProfile.clanTag && !userProfile.clanName;
  const hasClan = !!clanTag;

  // Helper untuk warna role
  const getRoleColor = (roleName: string) => {
      const r = roleName.toLowerCase();
      if (r === 'leader') return 'bg-coc-red/20 text-coc-red border-coc-red/40';
      if (r === 'coleader' || r === 'co-leader') return 'bg-coc-gold/20 text-coc-gold border-coc-gold/40';
      if (r === 'admin' || r === 'elder') return 'bg-coc-blue/20 text-coc-blue border-coc-blue/40';
      return 'bg-gray-700/30 text-gray-400 border-gray-600/30';
  };

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex flex-col h-full relative overflow-hidden group shadow-2xl transition-all duration-300 hover:border-coc-blue/30 hover:shadow-coc-blue/10">
      {/* Inner Container */}
      <div className="bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-xl p-5 flex flex-col items-center text-center h-full w-full relative z-10 overflow-hidden">
        
        {/* Ambient Blue Glow */}
        <div className="absolute top-0 right-0 w-full h-32 bg-coc-blue/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-coc-blue/10 transition-colors duration-500" />

        {/* Header - White Text + Shadow */}
        <div className="w-full flex items-center justify-start mb-2 z-10">
          <h2 className="flex items-center gap-2 font-clash text-lg text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <ShieldIcon className="h-5 w-5 text-coc-blue drop-shadow-sm" /> 
            <span>{t.profileCards.clanIdentity}</span>
          </h2>
        </div>

        {showLoading ? (
          <div className="flex flex-col items-center justify-center flex-grow gap-4 w-full py-6">
            <div className="w-28 h-28 rounded-full bg-white/5 animate-pulse shadow-inner border border-white/5" />
            <div className="space-y-2 w-full max-w-[180px]">
              <div className="h-6 bg-white/5 rounded w-full animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-1/2 mx-auto animate-pulse" />
            </div>
          </div>
        ) : hasClan ? (
          <div className="flex flex-col items-center w-full z-10 flex-grow justify-center mt-2">
            
            {/* Clan Badge with 3D Effect */}
            <div className="relative w-32 h-32 md:w-36 md:h-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110 duration-500 ease-out py-2">
              {/* Badge Glow */}
              <div className="absolute inset-0 bg-coc-blue/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <Image
                src={clanBadgeUrl}
                alt={`Badge klan ${clanName}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 144px, 144px"
                priority
              />
              
              {/* Clan Level Badge (Absolute Positioned) */}
              {clanLevel > 0 && (
                  <div className="absolute bottom-0 right-0 bg-black/80 text-coc-gold font-bold text-xs px-2 py-0.5 rounded border border-coc-gold/50 shadow-lg backdrop-blur-sm">
                      Lv {clanLevel}
                  </div>
              )}
            </div>

            {/* Clan Info & Link */}
            <div className="mt-3 space-y-1 w-full relative z-20">
              <Link
                href={userProfile.clanId ? `/clan/internal/${userProfile.clanId}` : `/clan/${encodeURIComponent(clanTag!)}`}
                className="block group/link"
              >
                <h3 className="text-2xl font-clash text-white group-hover/link:text-coc-blue transition-colors truncate max-w-full mx-auto leading-tight drop-shadow-md">
                  {clanName}
                </h3>
                <p className="text-xs font-mono text-gray-400 group-hover/link:text-gray-300 transition-colors mt-1 font-bold tracking-wider opacity-70">
                  {clanTag}
                </p>
              </Link>

              {/* Role Badge */}
              <div className="pt-4 flex justify-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm ${getRoleColor(role)}`}>
                  <UsersIcon className="w-3 h-3" />
                  {role.replace('admin', 'Elder').replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // State: No Clan (Empty State)
          <div className="flex flex-col items-center justify-center flex-grow text-gray-500 gap-4 py-8">
            <div className="p-6 bg-[#0a0a0b] rounded-full border border-white/5 shadow-inner">
              <ShieldIcon className="h-12 w-12 opacity-20" />
            </div>
            <div className="text-center">
                <p className="font-bold text-white mb-1">No Clan Joined</p>
                <p className="text-xs text-gray-500 max-w-[180px] mx-auto leading-relaxed">
                  {t.profileCards.notInClan}
                </p>
            </div>
            
            <Link href="/clan-hub" className="mt-2">
                <span className="text-xs text-coc-blue hover:text-coc-blue/80 underline underline-offset-2 decoration-coc-blue/30 font-medium">
                    Find a Clan
                </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};