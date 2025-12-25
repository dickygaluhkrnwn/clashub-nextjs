'use client';

import React from 'react';
import Image from 'next/image';
import {
  TrophyIcon,
  InfoIcon,
  StarIcon,
  SwordsIcon,
  ShieldIcon,
  BarChart2Icon,
} from '@/app/components/icons';
import { UserProfile, CocPlayer } from '@/lib/types';
import { formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface GameStatusCardProps {
  userProfile: UserProfile;
  isVerified: boolean;
  isClanManager: boolean;
  inGameRole: string;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Komponen Card "Statistik Musim".
 * Desain: Glassmorphism dengan Grid Layout modern untuk statistik.
 */
export const GameStatusCard = ({
  userProfile,
  isVerified,
  isClanManager,
  fullPlayerData,
  isLoading = false, // [FIX] Default value untuk mencegah undefined
  error,
}: GameStatusCardProps) => {
  const { t } = useLanguage();

  // --- 1. Logika Data ---
  const trophies = fullPlayerData?.trophies ?? userProfile.trophies;
  
  const warStars =
    fullPlayerData?.achievements.find((a) => a.name === 'War Hero')?.value ??
    userProfile?.cachedAchievements?.find((a) => a.name === 'War Hero')?.value ??
    null;

  const league = fullPlayerData?.league ?? userProfile?.league ?? null;
  const attackWins = fullPlayerData?.attackWins ?? userProfile?.attackWins ?? null;
  const defenseWins = fullPlayerData?.defenseWins ?? userProfile?.defenseWins ?? null;
  const bbTrophies = fullPlayerData?.builderBaseTrophies ?? userProfile?.builderBaseTrophies ?? null;

  // --- 2. Loading States ---
  // isLoading sekarang pasti boolean karena default value di atas
  const showTrophiesLoading = isLoading && !fullPlayerData && !userProfile.trophies;
  const showWarStarsLoading = isLoading && !fullPlayerData && !userProfile.cachedAchievements;
  const showStatsLoading = isLoading && !fullPlayerData && !userProfile.attackWins;
  const showLeagueLoading = isLoading && !fullPlayerData && !userProfile.league;

  // Helper untuk kartu stat kecil
  const StatItem = ({ 
    icon, 
    value, 
    label, 
    isLoading, 
    colorClass = "text-white" 
  }: { 
    icon: React.ReactNode; 
    value: string | number | null; 
    label: string; 
    isLoading: boolean;
    colorClass?: string;
  }) => (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors group">
      <div className="mb-2 p-2 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h4 className={`text-2xl font-bold font-clash ${colorClass}`}>
        {isLoading ? (
          <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" />
        ) : (
          value !== null ? formatNumber(Number(value)) : '-'
        )}
      </h4>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">
        {label}
      </p>
    </div>
  );

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-coc-gold/5 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <BarChart2Icon className="h-5 w-5 text-coc-gold" /> {t.profileCards.seasonStats}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          <p className="font-bold mb-1">{t.profileCards.fetchErrorTitle}</p>
          <p className="opacity-80">{error}</p>
        </div>
      )}

      {/* Grid Utama */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        
        {/* 1. Liga */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors col-span-2 md:col-span-1">
          {showLeagueLoading ? (
            <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse mb-2" />
          ) : league?.iconUrls?.tiny ? (
            <div className="relative h-12 w-12 mb-1 drop-shadow-lg">
              <Image
                src={league.iconUrls.tiny}
                alt={league.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-700/50 flex items-center justify-center mb-2">
              <span className="text-xs text-gray-400">N/A</span>
            </div>
          )}
          <p className="text-sm font-bold text-coc-gold truncate max-w-full px-2">
            {showLeagueLoading ? t.profileCards.loading : league?.name || t.profileCards.unranked}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">
            League
          </p>
        </div>

        {/* 2. Trofi Home */}
        <StatItem 
          icon={<TrophyIcon className="h-5 w-5 text-yellow-400" />}
          value={trophies}
          label={t.profileCards.homeTrophies}
          isLoading={!!showTrophiesLoading} // [FIX] Double bang ensures boolean
          colorClass="text-yellow-400"
        />

        {/* 3. Trofi Builder */}
        <StatItem 
          icon={<TrophyIcon className="h-5 w-5 text-blue-400" />}
          value={bbTrophies}
          label={t.profileCards.builderTrophies}
          isLoading={!!showStatsLoading} // [FIX] Double bang ensures boolean
          colorClass="text-blue-400"
        />

        {/* 4. Menang Serangan */}
        <StatItem 
          icon={<SwordsIcon className="h-5 w-5 text-coc-red" />}
          value={attackWins}
          label={t.profileCards.attackWins}
          isLoading={!!showStatsLoading} // [FIX] Double bang ensures boolean
        />

        {/* 5. Menang Bertahan */}
        <StatItem 
          icon={<ShieldIcon className="h-5 w-5 text-coc-green" />}
          value={defenseWins}
          label={t.profileCards.defenseWins}
          isLoading={!!showStatsLoading} // [FIX] Double bang ensures boolean
        />

        {/* 6. Bintang War */}
        <StatItem 
          icon={<StarIcon className="h-5 w-5 text-coc-gold" />}
          value={warStars}
          label={t.profileCards.warStars}
          isLoading={!!showWarStarsLoading} // [FIX] Double bang ensures boolean
          colorClass="text-coc-gold"
        />
      </div>

      {/* Footer Info */}
      {isClanManager && isVerified && (
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500">
          <InfoIcon className="h-3.5 w-3.5" />
          <span>
            Updated: {userProfile.lastVerified ? new Date(userProfile.lastVerified).toLocaleDateString('id-ID') : '-'}
          </span>
        </div>
      )}
    </div>
  );
};