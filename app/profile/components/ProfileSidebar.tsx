'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import {
  InfoIcon,
  UserIcon,
  BriefcaseIcon,
  AlertTriangleIcon,
  DiscordIcon,
  LinkIcon,
  TrophyIcon,
  StarIcon,
  CogsIcon,
  ChevronRightIcon,
  CheckIcon,
  ExternalLinkIcon
} from '@/app/components/icons';
import { UserProfile } from '@/lib/types';
import { getTierForPoints } from '@/lib/popularity-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ProfileSidebarProps {
  userProfile: UserProfile;
  isVerified: boolean;
  isFreeAgent: boolean;
  isCompetitiveVision: boolean;
  isClanManager: boolean;
  reputation: number;
  playerReviewsCount: number;
}

/**
 * Komponen Sidebar Profil.
 * Desain: Modern Glassmorphism, Sticky Positioning, Responsive.
 */
export const ProfileSidebar = ({
  userProfile,
  isVerified,
  isFreeAgent,
  isCompetitiveVision,
  isClanManager,
  reputation,
  playerReviewsCount,
}: ProfileSidebarProps) => {
  const { t } = useLanguage();
  const avatarSrc = userProfile.avatarUrl || '/images/placeholder-avatar.png';

  const cleanUrlDisplay = (url: string | null | undefined): string => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  };
  const displayWebsite = cleanUrlDisplay(userProfile.website);

  const currentPoints = userProfile.popularityPoints || 0;
  const currentTier = getTierForPoints(currentPoints);

  return (
    <aside className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 space-y-8 w-full shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-coc-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Avatar & Identitas Utama */}
      <div className="flex flex-col items-center text-center relative z-10">
        <div className="relative mb-4 group cursor-default">
          {/* Avatar Glow Effect */}
          <div className="absolute inset-0 bg-coc-gold/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50" />
          <Image
            src={avatarSrc}
            alt={`${userProfile.displayName} Avatar`}
            width={128}
            height={128}
            className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-coc-gold/50 shadow-2xl object-cover relative z-10 bg-coc-dark"
            priority
          />
          {isVerified && (
            <div className="absolute bottom-1 right-1 bg-coc-dark rounded-full p-1.5 border border-coc-gold/30 z-20 shadow-lg" title="Verified">
              <CheckIcon className="h-4 w-4 text-coc-gold" />
            </div>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl text-white font-clash font-bold tracking-wide break-words w-full">
          {userProfile.displayName}
        </h2>
        
        {isVerified && userProfile.inGameName && userProfile.inGameName !== userProfile.displayName && (
          <p className="text-sm text-gray-400 font-medium mt-1">
            IGN: {userProfile.inGameName}
          </p>
        )}
        
        {/* Player Tag */}
        <div className="mt-3 inline-flex items-center justify-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <p className="text-sm text-coc-gold font-mono tracking-wider font-bold">
            {userProfile.playerTag || t.profileSidebar.tagNotSet}
          </p>
        </div>
      </div>

      {/* Badges Status */}
      <div className="flex flex-wrap justify-center gap-2">
        {isFreeAgent && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BriefcaseIcon className="h-3.5 w-3.5" /> {t.profileSidebar.freeAgent}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
          isCompetitiveVision 
            ? 'bg-coc-red/10 text-coc-red border-coc-red/30' 
            : 'bg-coc-green/10 text-coc-green border-coc-green/30'
        }`}>
          {isCompetitiveVision ? t.profileSidebar.competitive : t.profileSidebar.casual}
        </span>
        {!isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gray-700/50 text-gray-400 border border-gray-600">
            <AlertTriangleIcon className="h-3.5 w-3.5" /> {t.profileSidebar.unverified}
          </span>
        )}
      </div>

      {/* Stats Cards (Grid Layout) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points Card */}
        <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 hover:border-coc-gold/20 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-coc-gold mb-1 flex justify-center">
            <TrophyIcon className="h-5 w-5" />
          </div>
          <p className={`text-xl font-bold font-clash ${currentTier.colorClass}`}>
            {currentPoints}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            {t.profileSidebar.popularityPoints}
          </p>
        </div>
        
        {/* Reputation Card */}
        <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 hover:border-coc-gold/20 transition-all duration-300 hover:-translate-y-0.5">
          <div className="text-coc-gold mb-1 flex justify-center">
            <StarIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold font-clash text-white">
            {reputation.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            {playerReviewsCount} Reviews
          </p>
        </div>
      </div>

      {/* Detail Info Sections */}
      <div className="space-y-6 divide-y divide-white/5">
        {/* Bio */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <InfoIcon className="h-3.5 w-3.5" /> {t.profileSidebar.bioVision}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-coc-gold/30 pl-3">
            "{userProfile.bio || t.profileSidebar.noBio}"
          </p>
        </div>

        {/* Preferences */}
        <div className="pt-6 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <UserIcon className="h-3.5 w-3.5" /> {t.profileSidebar.preferences}
          </h3>
          <div className="flex justify-between items-center text-sm group">
            <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{t.profileSidebar.role}</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">{userProfile.playStyle || t.profileSidebar.notSet}</span>
          </div>
          <div className="flex justify-between items-center text-sm group">
            <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{t.profileSidebar.activeHours}</span>
            <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">{userProfile.activeHours || t.profileSidebar.notSet}</span>
          </div>
        </div>

        {/* Contact */}
        <div className="pt-6 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <LinkIcon className="h-3.5 w-3.5" /> {t.profileSidebar.contact}
          </h3>
          
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/10 transition-colors">
            <div className="bg-[#5865F2]/20 p-1.5 rounded flex-shrink-0">
              <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
            </div>
            <span className="text-sm text-gray-200 truncate flex-1 font-mono">
              {userProfile.discordId || t.profileSidebar.notSet}
            </span>
          </div>

          {userProfile.website && (
            <a 
              href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-transparent hover:border-coc-gold/30 hover:bg-coc-gold/5 transition-all group"
            >
              <div className="bg-coc-gold/20 p-1.5 rounded group-hover:bg-coc-gold/30 transition-colors flex-shrink-0">
                <LinkIcon className="h-4 w-4 text-coc-gold" />
              </div>
              <span className="text-sm text-coc-gold truncate flex-1 underline decoration-coc-gold/30 underline-offset-2 font-medium">
                {displayWebsite}
              </span>
              <ExternalLinkIcon className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex flex-col gap-3">
        <Link href="/profile/popularity" className="w-full block">
          <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white border border-transparent hover:border-white/10">
            {t.profileSidebar.viewDetails} <ChevronRightIcon className="h-3 w-3 ml-1" />
          </Button>
        </Link>

        {isClanManager && isVerified && userProfile.clanTag && (
          <Button
            href="/clan/manage"
            variant="secondary"
            className="w-full border-coc-gold/20 hover:border-coc-gold/50 text-coc-gold hover:bg-coc-gold/10 hover:text-white transition-all shadow-lg shadow-black/20"
          >
            <CogsIcon className="h-4 w-4 mr-2" />
            {t.profileSidebar.manageMyClan}
          </Button>
        )}
      </div>
    </aside>
  );
};