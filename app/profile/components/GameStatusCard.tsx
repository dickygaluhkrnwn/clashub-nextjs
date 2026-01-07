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
 * Desain: Gaming Dashboard dengan Grid modern.
 */
export const GameStatusCard = ({
  userProfile,
  isVerified,
  isClanManager,
  fullPlayerData,
  isLoading = false,
  error,
}: GameStatusCardProps) => {
  const { t } = useLanguage();

  const trophies = fullPlayerData?.trophies ?? userProfile.trophies;
  
  const warStars =
    fullPlayerData?.achievements.find((a) => a.name === 'War Hero')?.value ??
    userProfile?.cachedAchievements?.find((a) => a.name === 'War Hero')?.value ??
    null;

  const league = fullPlayerData?.league ?? userProfile?.league ?? null;
  const attackWins = fullPlayerData?.attackWins ?? userProfile?.attackWins ?? null;
  const defenseWins = fullPlayerData?.defenseWins ?? userProfile?.defenseWins ?? null;
  const bbTrophies = fullPlayerData?.builderBaseTrophies ?? userProfile?.builderBaseTrophies ?? null;

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
    colorClass = "text-white",
    bgGradient = "from-[#1e232e] to-[#15171e]"
  }: { 
    icon: React.ReactNode; 
    value: string | number | null; 
    label: string; 
    isLoading: boolean;
    colorClass?: string;
    bgGradient?: string;
  }) => (
    <div className={`bg-gradient-to-b ${bgGradient} border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center relative group overflow-hidden transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5`}>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
      
      <div className="mb-2 p-2.5 rounded-full bg-black/30 shadow-inner group-hover:scale-110 transition-transform duration-300 border border-white/5">
        {icon}
      </div>
      
      <h4 className={`text-xl md:text-2xl font-bold font-clash ${colorClass} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10`}>
        {isLoading ? (
          <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
        ) : (
          value !== null ? formatNumber(Number(value)) : '-'
        )}
      </h4>
      
      {/* REVISI LABEL: text-gray-300 (sangat terang) + Drop Shadow agar terbaca jelas */}
      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-300 font-bold mt-1 z-10 drop-shadow-md">
        {label}
      </p>
    </div>
  );

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Header - REVISI TOTAL: Putih Solid dengan Shadow Kuat */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <BarChart2Icon className="h-5 w-5 text-coc-gold" /> 
        </div>
        <span>
            {t.profileCards.seasonStats}
        </span>
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center flex items-center justify-center gap-2">
          <InfoIcon className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Utama */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        
        {/* 1. Liga Card (Special Style) */}
        <div className="bg-gradient-to-br from-[#2a303c] to-[#1a1d26] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1 shadow-lg relative overflow-hidden group">
          {/* Ambient light for league */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-coc-blue/10 rounded-full blur-2xl -mr-10 -mt-10" />
          
          {showLeagueLoading ? (
            <div className="h-14 w-14 bg-white/10 rounded-full animate-pulse mb-2" />
          ) : league?.iconUrls?.tiny ? (
            <div className="relative h-16 w-16 mb-2 drop-shadow-[0_0_15px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300">
              <Image
                src={league.iconUrls.tiny}
                alt={league.name}
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-black/40 flex items-center justify-center mb-2 border border-white/5">
              <span className="text-xs text-gray-500 font-bold">UNRANKED</span>
            </div>
          )}
          
          <p className="text-sm font-bold text-white truncate max-w-full px-2 z-10 drop-shadow-md">
            {showLeagueLoading ? t.profileCards.loading : league?.name || t.profileCards.unranked}
          </p>
          {/* REVISI LABEL */}
          <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold mt-0.5 z-10 drop-shadow-md">
            League
          </p>
        </div>

        {/* 2. Trofi Home */}
        <StatItem 
          icon={<TrophyIcon className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />}
          value={trophies}
          label={t.profileCards.homeTrophies}
          isLoading={!!showTrophiesLoading} 
          colorClass="text-yellow-400"
        />

        {/* 3. Trofi Builder */}
        <StatItem 
          icon={<TrophyIcon className="h-5 w-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />}
          value={bbTrophies}
          label={t.profileCards.builderTrophies}
          isLoading={!!showStatsLoading} 
          colorClass="text-blue-400"
        />

        {/* 4. Menang Serangan */}
        <StatItem 
          icon={<SwordsIcon className="h-5 w-5 text-coc-red drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" />}
          value={attackWins}
          label={t.profileCards.attackWins}
          isLoading={!!showStatsLoading} 
        />

        {/* 5. Menang Bertahan */}
        <StatItem 
          icon={<ShieldIcon className="h-5 w-5 text-coc-green drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" />}
          value={defenseWins}
          label={t.profileCards.defenseWins}
          isLoading={!!showStatsLoading} 
        />

        {/* 6. Bintang War */}
        <StatItem 
          icon={<StarIcon className="h-5 w-5 text-coc-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />}
          value={warStars}
          label={t.profileCards.warStars}
          isLoading={!!showWarStarsLoading} 
          colorClass="text-coc-gold"
          bgGradient="from-[#2a2510] to-[#1a180d]" // Special dark gold theme for war stars
        />
      </div>

      {/* Footer Info - REVISI: text-gray-400 */}
      {isClanManager && isVerified && (
        <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-end gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-tight">
          <InfoIcon className="h-3 w-3 opacity-50" />
          <span>
            Last Sync: {userProfile.lastVerified ? new Date(userProfile.lastVerified).toLocaleDateString('id-ID') : 'N/A'}
          </span>
        </div>
      )}
    </div>
  );
};