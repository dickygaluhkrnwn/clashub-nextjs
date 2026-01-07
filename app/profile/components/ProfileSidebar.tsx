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
 * Desain: Gaming Identity Panel dengan fokus pada Avatar & Status.
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
    <aside className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-8 w-full shadow-2xl relative overflow-hidden group">
      {/* Decorative Top Glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-coc-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold/50 to-transparent opacity-50" />

      {/* --- AVATAR & IDENTITY SECTION --- */}
      <div className="flex flex-col items-center text-center relative z-10">
        
        {/* Avatar Container with Hexagon/Circle Frame Effect */}
        <div className="relative mb-6 group cursor-default">
          {/* Outer Glow Ring */}
          <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 opacity-40 group-hover:opacity-60 ${isVerified ? 'bg-coc-gold' : 'bg-gray-500'}`} />
          
          {/* Avatar Image */}
          <div className="relative w-32 h-32 md:w-36 md:h-36 p-1 bg-gradient-to-b from-white/10 to-transparent rounded-full border border-white/10 backdrop-blur-sm shadow-2xl">
             <Image
                src={avatarSrc}
                alt={`${userProfile.displayName} Avatar`}
                width={144}
                height={144}
                className="w-full h-full rounded-full object-cover border-2 border-[#1a1d26] relative z-10 bg-[#0a0a0b]"
                priority
             />
          </div>
        </div>

        {/* Name & Tag Wrapper */}
        <div className="flex flex-col items-center justify-center w-full">
          {/* REVISI: Badge Verifikasi dipindah ke sini (sebelah nama) */}
          <div className="flex items-center justify-center gap-2 w-full flex-wrap">
            <h2 className="text-2xl md:text-3xl text-white font-clash font-bold tracking-wide break-words drop-shadow-md">
              {userProfile.displayName}
            </h2>
            
            {/* Social Media Style Verified Badge - REVISI POSISI (Hapus mt-1) */}
            {isVerified && (
              <div className="flex items-center justify-center bg-coc-blue text-white rounded-full w-5 h-5 md:w-6 md:h-6 border-2 border-[#15171e] shadow-[0_0_10px_rgba(59,130,246,0.6)]" title="Verified Account">
                <CheckIcon className="w-3 h-3 md:w-3.5 md:h-3.5 stroke-[3px]" />
              </div>
            )}
          </div>
          
          {/* IGN Subtitle */}
          {isVerified && userProfile.inGameName && userProfile.inGameName !== userProfile.displayName && (
            <p className="text-sm text-gray-400 font-medium mt-1 flex items-center gap-1 justify-center">
              <span className="opacity-50 text-xs uppercase tracking-widest">IGN</span>
              <span className="text-gray-300">{userProfile.inGameName}</span>
            </p>
          )}
          
          {/* Player Tag Chip */}
          <div className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#0a0a0b] border border-white/10 shadow-inner group/tag hover:border-white/20 transition-colors">
            <span className="text-sm text-gray-400 font-mono tracking-wider font-bold group-hover/tag:text-white transition-colors">
              {userProfile.playerTag || t.profileSidebar.tagNotSet}
            </span>
          </div>
        </div>
      </div>

      {/* --- STATUS BADGES --- */}
      <div className="flex flex-wrap justify-center gap-2">
        {isFreeAgent && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <BriefcaseIcon className="h-3 w-3" /> {t.profileSidebar.freeAgent}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
          isCompetitiveVision 
            ? 'bg-coc-red/10 text-coc-red border-coc-red/20' 
            : 'bg-coc-green/10 text-coc-green border-coc-green/20'
        }`}>
          {isCompetitiveVision ? t.profileSidebar.competitive : t.profileSidebar.casual}
        </span>
        {!isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-gray-800 text-gray-400 border border-gray-700">
            <AlertTriangleIcon className="h-3 w-3" /> {t.profileSidebar.unverified}
          </span>
        )}
      </div>

      {/* --- KEY STATS GRID --- */}
      <div className="grid grid-cols-2 gap-3">
        {/* Popularity Card */}
        <div className="bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-xl p-3 text-center border border-white/5 hover:border-coc-gold/20 transition-all duration-300 hover:-translate-y-0.5 group/stat relative overflow-hidden">
          <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
          <div className="text-coc-gold mb-1 flex justify-center drop-shadow-sm">
            <TrophyIcon className="h-5 w-5" />
          </div>
          <p className={`text-xl font-bold font-clash ${currentTier.colorClass} drop-shadow-md`}>
            {currentPoints}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold group-hover/stat:text-gray-400 transition-colors">
            {t.profileSidebar.popularityPoints}
          </p>
        </div>
        
        {/* Reputation Card */}
        <div className="bg-gradient-to-b from-[#1a1d26] to-[#0f1115] rounded-xl p-3 text-center border border-white/5 hover:border-coc-gold/20 transition-all duration-300 hover:-translate-y-0.5 group/stat relative overflow-hidden">
          <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
          <div className="text-coc-gold mb-1 flex justify-center drop-shadow-sm">
            <StarIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold font-clash text-white drop-shadow-md">
            {reputation.toFixed(1)}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold group-hover/stat:text-gray-400 transition-colors">
            {playerReviewsCount} Reviews
          </p>
        </div>
      </div>

      {/* --- DETAIL INFO SECTIONS --- */}
      <div className="space-y-6 pt-2">
        
        {/* Bio Section */}
        <div className="relative">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <InfoIcon className="h-3 w-3" /> {t.profileSidebar.bioVision}
          </h3>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold/30 rounded-l-xl" />
             <p className="text-sm text-gray-300 leading-relaxed italic">
               "{userProfile.bio || t.profileSidebar.noBio}"
             </p>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <UserIcon className="h-3 w-3" /> {t.profileSidebar.preferences}
          </h3>
          
          <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors group/row">
            <span className="text-gray-400 group-hover/row:text-gray-300 transition-colors">{t.profileSidebar.role}</span>
            <span className="text-white font-medium bg-[#0a0a0b] px-3 py-1 rounded-md border border-white/10 text-xs">
                {userProfile.playStyle || t.profileSidebar.notSet}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors group/row">
            <span className="text-gray-400 group-hover/row:text-gray-300 transition-colors">{t.profileSidebar.activeHours}</span>
            <span className="text-white font-medium bg-[#0a0a0b] px-3 py-1 rounded-md border border-white/10 text-xs">
                {userProfile.activeHours || t.profileSidebar.notSet}
            </span>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <LinkIcon className="h-3 w-3" /> {t.profileSidebar.contact}
          </h3>
          
          {/* Discord */}
          <div className="flex items-center gap-3 bg-[#0a0a0b] p-2.5 rounded-xl border border-white/5 hover:border-[#5865F2]/50 transition-colors group/contact">
            <div className="bg-[#5865F2]/10 p-2 rounded-lg group-hover/contact:bg-[#5865F2]/20 transition-colors">
              <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
            </div>
            <span className="text-sm text-gray-300 truncate flex-1 font-mono group-hover/contact:text-white transition-colors">
              {userProfile.discordId || t.profileSidebar.notSet}
            </span>
          </div>

          {/* Website */}
          {userProfile.website && (
            <a 
              href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-[#0a0a0b] p-2.5 rounded-xl border border-white/5 hover:border-coc-gold/50 transition-colors group/contact cursor-pointer"
            >
              <div className="bg-coc-gold/10 p-2 rounded-lg group-hover/contact:bg-coc-gold/20 transition-colors">
                <LinkIcon className="h-4 w-4 text-coc-gold" />
              </div>
              <span className="text-sm text-coc-gold truncate flex-1 font-medium underline decoration-coc-gold/30 underline-offset-2">
                {displayWebsite}
              </span>
              <ExternalLinkIcon className="h-3 w-3 text-gray-500 opacity-0 group-hover/contact:opacity-100 transition-opacity transform group-hover/contact:translate-x-1 duration-300" />
            </a>
          )}
        </div>
      </div>

      {/* --- BOTTOM ACTIONS --- */}
      <div className="pt-4 flex flex-col gap-3 border-t border-white/5">
        <Link href="/profile/popularity" className="w-full block group/btn">
          <Button variant="ghost" className="w-full text-xs text-gray-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5 justify-between">
            {t.profileSidebar.viewDetails} 
            <ChevronRightIcon className="h-3 w-3 text-gray-600 group-hover/btn:text-white transition-colors" />
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