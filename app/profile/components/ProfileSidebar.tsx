'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import {
  InfoIcon,
  UserIcon,
  BriefcaseIcon,
  CheckIcon,
  AlertTriangleIcon,
  DiscordIcon,
  LinkIcon,
  TrophyIcon,
  StarIcon,
  CogsIcon,
  ChevronRightIcon,
} from '@/app/components/icons';
import { UserProfile } from '@/lib/types';
import { getTierForPoints } from '@/lib/popularity-utils';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

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
 * Komponen Sidebar untuk halaman profil.
 * Menampilkan CV, Bio, Kontak, Poin, Reputasi, dan tombol aksi terkait.
 * [FASE 4 FIX] Responsif Mobile (Static) & Desktop (Sticky).
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
  const { t } = useLanguage(); // [BARU]
  const avatarSrc = userProfile.avatarUrl || '/images/placeholder-avatar.png';

  const cleanUrlDisplay = (url: string | null | undefined): string => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  };
  const displayWebsite = cleanUrlDisplay(userProfile.website);

  const currentPoints = userProfile.popularityPoints || 0;
  const currentTier = getTierForPoints(currentPoints);

  return (
    // [PERBAIKAN LAYOUT SIDEBAR]
    <aside className="lg:col-span-1 card-stone p-4 lg:p-6 h-fit static lg:sticky lg:top-28 space-y-6 text-center rounded-lg z-10 w-full">
      <Image
        src={avatarSrc}
        alt={`${userProfile.displayName} Avatar`}
        width={100}
        height={100}
        sizes="(max-width: 1024px) 80px, 100px"
        priority
        className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
      />
      <h1 className="text-2xl md:text-3xl lg:text-4xl text-white font-clash m-0 break-words">
        {userProfile.displayName}
      </h1>
      
      {isVerified &&
        userProfile.inGameName &&
        userProfile.inGameName !== userProfile.displayName && (
          <p className="text-sm text-gray-400 font-bold -mt-2 mb-1">
            ({userProfile.inGameName})
          </p>
        )}
      <p className="text-sm text-gray-400 font-bold mb-1 font-mono">
        {userProfile.playerTag || t.profileSidebar.tagNotSet}
      </p>

      {/* Status Free Agent */}
      {isFreeAgent && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
          <BriefcaseIcon className="h-3.5 w-3.5" /> {t.profileSidebar.freeAgent}
        </span>
      )}

      {/* Status Verifikasi & Visi */}
      <div className="flex justify-center items-center gap-2 flex-wrap">
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            isCompetitiveVision
              ? 'bg-coc-red text-white'
              : 'bg-coc-green text-coc-stone'
          }`}
        >
          {isCompetitiveVision ? t.profileSidebar.competitive : t.profileSidebar.casual}
        </span>
        {isVerified ? (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-coc-blue text-white flex items-center gap-1">
            <CheckIcon className="h-3 w-3" /> {t.profileSidebar.verified}
          </span>
        ) : (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-600 text-gray-300 flex items-center gap-1">
            <AlertTriangleIcon className="h-3 w-3" /> {t.profileSidebar.unverified}
          </span>
        )}
      </div>

      {/* Bio & Visi */}
      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
        <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
          <InfoIcon className="h-5 w-5" /> {t.profileSidebar.bioVision}
        </h3>
        <p className="text-sm text-gray-300">
          {userProfile.bio || t.profileSidebar.noBio}
        </p>
      </div>

      {/* Preferensi */}
      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
        <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
          <UserIcon className="h-5 w-5" /> {t.profileSidebar.preferences}
        </h3>
        <p className="text-sm">
          <span className="font-bold text-gray-300">{t.profileSidebar.role}</span>{' '}
          {userProfile.playStyle || t.profileSidebar.notSet}
        </p>
        <p className="text-sm">
          <span className="font-bold text-gray-300">{t.profileSidebar.activeHours}</span>{' '}
          {userProfile.activeHours || t.profileSidebar.notSet}
        </p>
      </div>

      {/* Kontak Sosial */}
      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-2">
        <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
          {t.profileSidebar.contact}
        </h3>
        {userProfile.discordId ? (
          <p className="text-sm text-gray-300 flex items-center gap-2 truncate">
            <DiscordIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />{' '}
            <span className="font-bold truncate">{userProfile.discordId}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <DiscordIcon className="h-4 w-4 text-gray-500" /> {t.profileSidebar.notSet}
          </p>
        )}
        {userProfile.website ? (
          <a
            href={
              userProfile.website.startsWith('http')
                ? userProfile.website
                : `https://${userProfile.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-coc-gold hover:underline flex items-center gap-2 truncate"
          >
            <LinkIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />{' '}
            <span className="truncate">{displayWebsite}</span>
          </a>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-gray-500" /> {t.profileSidebar.websiteNotSet}
          </p>
        )}
      </div>

      {/* Poin Popularitas */}
      <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
        <h3 className="text-lg text-coc-gold-dark font-clash">
          {t.profileSidebar.popularityPoints}
        </h3>
        <p
          className={`text-4xl font-clash ${currentTier.colorClass} my-1`}
        >
          {currentPoints}{' '}
          <TrophyIcon className="inline h-7 w-7" fill="currentColor" />
        </p>
        <Link
          href="/profile/popularity"
          className="text-xs text-coc-gold hover:text-coc-gold-light hover:underline flex items-center justify-center gap-1 transition-colors"
        >
          {t.profileSidebar.viewDetails}
          <ChevronRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Reputasi */}
      <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
        <h3 className="text-lg text-coc-gold-dark font-clash">
          {t.profileSidebar.commitmentReputation}
        </h3>
        <p className="text-4xl font-clash text-coc-gold my-1">
          {reputation.toFixed(1)} <StarIcon className="inline h-7 w-7" />
        </p>
        <p className="text-xs text-gray-400">
          {t.profileSidebar.basedOnReviews.replace('{count}', playerReviewsCount.toString())}
        </p>
      </div>

      {/* Tombol Manajemen Klan */}
      {isClanManager && isVerified && userProfile.clanTag && (
        <div className="pt-4 border-t border-coc-gold-dark/20">
          <Button
            href="/clan/manage"
            variant="secondary"
            // [Mobile Fix] Hapus 'size=lg' agar tidak terlalu besar di HP, atur via class
            className="w-full bg-coc-gold-dark/20 hover:bg-coc-gold-dark/40 border-coc-gold-dark/30 hover:border-coc-gold-dark py-3 text-sm md:text-base"
          >
            <CogsIcon className="inline h-5 w-5 mr-2" />
            {t.profileSidebar.manageMyClan}
          </Button>
        </div>
      )}
    </aside>
  );
};