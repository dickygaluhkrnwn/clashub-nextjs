'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import {
  ManagedClan,
  ClanReview,
  ClanSocialLink,
} from '@/lib/types';
import { ClanReviewsCard } from '../components/ClanReviewsCard';
import { TeamMemberTable } from '../components/TeamMemberTable';
import { RosterMember } from '@/app/clan/manage/components/MemberTableRow';
import {
  StarIcon,
  ShieldIcon,
  UserIcon,
  GlobeIcon,
  DiscordIcon,
  ClockIcon,
  TrophyIcon,
  InfoIcon,
  ExternalLinkIcon,
  EditIcon,
} from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ClanDetailClientProps {
  managedClan: ManagedClan;
  clanReviews: ClanReview[];
  averageRating: number;
  totalReviews: number;
  totalMembers: number;
  isFull: boolean;
  isClanOwner: boolean;
  rosterMembers: RosterMember[];
  cocApiUrl: string;
  clanId: string;
}

const ClanDetailClient = ({
  managedClan,
  clanReviews,
  averageRating,
  totalReviews,
  totalMembers,
  isFull,
  isClanOwner,
  rosterMembers,
  cocApiUrl,
  clanId,
}: ClanDetailClientProps) => {
  const { t } = useLanguage(); // [BARU]

  const {
    name,
    tag,
    vision,
    avgTh,
    clanLevel,
    profileDescription,
    clanRules,
    socialLinks,
    logoUrl,
  } = managedClan;

  const isCompetitive = vision === 'Kompetitif';

  // Static mockup data for now - in real app could be props
  const competitionHistory = [
    {
      tournament: 'ClashHub Liga Musim 2',
      rank: 'Juara 3',
      date: 'Sep 2025',
      prize: 'Rp 5.000.000',
    },
    {
      tournament: 'TH 15 Open Cup',
      rank: 'Peringkat 9',
      date: 'Mei 2025',
      prize: '-',
    },
  ];

  const upcomingEvent = {
    name: t.clanDetail.nextWar,
    date: '7 Oktober',
    time: `20:00 WIB ${t.clanDetail.preparation}`,
  };

  const getSocialIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();
    if (lowerPlatform.includes('discord')) {
      return (
        <DiscordIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />
      );
    }
    if (lowerPlatform.includes('website') || lowerPlatform.includes('web')) {
      return <GlobeIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />;
    }
    return (
      <ExternalLinkIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />
    );
  };

  return (
    <main className="container mx-auto p-4 md:p-8 mt-6 md:mt-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 card-stone p-4 md:p-6 rounded-lg">
        {/* Sisi Kiri: Judul Halaman */}
        <h2 className="text-xl md:text-2xl font-clash-bold text-white text-center md:text-left">
          {t.clanDetail.profileTitle}
        </h2>

        {/* Sisi Kanan: Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <a 
            href={cocApiUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" className="w-full sm:w-auto">
              <ExternalLinkIcon className="h-5 w-5 mr-2" /> {t.clanDetail.cocProfile}
            </Button>
          </a>
          {isClanOwner ? (
            <>
              <Link href={`/clan/internal/${clanId}/edit`} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <EditIcon className="h-5 w-5 mr-2" /> {t.clanDetail.editProfile}
                </Button>
              </Link>
              <Link href={`/clan/manage?clanId=${clanId}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto">
                  <InfoIcon className="h-5 w-5 mr-2" /> {t.clanDetail.manageClan}
                </Button>
              </Link>
            </>
          ) : isFull ? (
            <span className="px-4 py-2 bg-coc-red border-2 border-red-900 text-white rounded-lg text-sm font-bold shadow-md flex items-center justify-center w-full sm:w-auto">
              {t.clanDetail.rosterFull}
            </span>
          ) : (
            <Link href={`/clan/internal/${clanId}/join`} className="w-full sm:w-auto">
                <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                >
                    {t.clanDetail.join}
                </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Layout Utama Profil */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* SIDEBAR */}
        <aside className="lg:col-span-1 card-stone p-4 md:p-6 h-fit static lg:sticky lg:top-28 rounded-lg z-10">
          <div className="space-y-6">

            {/* Blok 1: Info Klan Inti */}
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Image
                  src={logoUrl || '/images/clan-badge-placeholder.png'}
                  alt={`Lencana ${name}`}
                  width={128}
                  height={128}
                  className="mb-4 w-24 h-24 md:w-32 md:h-32"
                  priority
                />
                <h1 className="text-2xl md:text-3xl lg:text-4xl text-white font-clash m-0 break-words max-w-full">
                  {name}
                </h1>
                <p className="text-sm text-coc-gold font-bold mb-2">{tag}</p>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    isCompetitive
                      ? 'bg-coc-red text-white'
                      : 'bg-coc-green text-coc-stone'
                  }`}
                >
                  {vision} (Avg: {avgTh.toFixed(1)})
                </span>
              </div>
            </div>

            {/* Blok 2: Reputasi Tim */}
            <div className="space-y-4 pt-6 border-t border-coc-gold-dark/30">
              <h3 className="text-lg text-coc-gold-dark font-clash flex items-center justify-center gap-2">
                <StarIcon className="h-5 w-5" /> {t.clanDetail.teamReputation}
              </h3>
              <div className="text-center">
                <p className="text-5xl font-clash text-coc-gold my-1 flex items-center justify-center gap-2">
                  {averageRating.toFixed(1)}{' '}
                  <StarIcon className="inline h-8 w-8" />
                </p>
                <p className="text-xs text-gray-500">
                  {t.clanDetail.basedOnReviews.replace('{count}', totalReviews.toString())}
                </p>
                <Link
                  href="#ulasan-tim"
                  className="text-xs text-coc-gold hover:underline mt-2 inline-block"
                >
                  {t.clanDetail.viewAllReviews}
                </Link>
              </div>
            </div>

            {/* Blok 3: Ringkasan Statistik */}
            <div className="space-y-4 pt-6 border-t border-coc-gold-dark/30">
              <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                <ShieldIcon className="h-5 w-5" /> {t.clanDetail.statsSummary}
              </h3>
              <ul className="text-sm space-y-3">
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-coc-gold-dark" /> {t.clanDetail.level}
                  </span>{' '}
                  <strong className="text-white font-clash text-base">
                    {clanLevel}
                  </strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-coc-gold-dark" /> {t.clanDetail.members}
                  </span>{' '}
                  <strong className="text-white font-clash text-base">
                    {totalMembers}/50
                  </strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <TrophyIcon className="h-4 w-4 text-coc-gold-dark" /> {t.clanDetail.avgTh}
                  </span>{' '}
                  <strong className="text-white font-clash text-base">
                    {avgTh.toFixed(1)}
                  </strong>
                </li>
              </ul>
            </div>

            {/* Blok 4: Event Terdekat */}
            <div className="space-y-4 pt-6 border-t border-coc-gold-dark/30">
              <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                <ClockIcon className="h-5 w-5" /> {t.clanDetail.upcomingEvents}
              </h3>
              <div className="bg-coc-stone/70 p-4 rounded-lg text-center border border-coc-gold-dark/30 shadow-inner">
                <p className="font-semibold text-gray-300 mb-1 text-sm">
                  {upcomingEvent.name}:
                </p>
                <p className="font-clash text-xl md:text-2xl text-coc-gold">
                  {upcomingEvent.date}
                </p>
                <p className="text-xs text-gray-400">{upcomingEvent.time}</p>
              </div>
            </div>

            {/* Blok 5: Kontak & Sosial */}
            <div className="space-y-4 pt-6 border-t border-coc-gold-dark/30">
              <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                {t.clanDetail.contactSocials}
              </h3>
              <ul className="text-sm space-y-3">
                {socialLinks && socialLinks.length > 0 ? (
                  socialLinks.map((link, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {getSocialIcon(link.platform)}
                      <a
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-coc-gold hover:underline truncate"
                        title={link.url}
                      >
                        {link.platform}
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 flex items-center gap-2">
                    <GlobeIcon className="h-4 w-4 text-gray-500" />
                    {t.clanDetail.noSocials}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </aside>

        {/* Kolom Kanan: Detail & Daftar Anggota (UTAMA) */}
        <section className="lg:col-span-3 space-y-8">
          {/* 1. VISI & ATURAN */}
          <div className="card-stone p-4 md:p-6 space-y-6 rounded-lg">
            <h2 className="text-xl md:text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <InfoIcon className="h-6 w-6 text-coc-gold" /> {t.clanDetail.aboutClan}
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {profileDescription || t.clanDetail.noDescription}
            </p>

            <h3 className="text-lg md:text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6 flex items-center gap-2">
              {t.clanDetail.clanRules}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {clanRules || t.clanDetail.noRules}
            </p>
          </div>

          {/* 2. DAFTAR ROSTER/ANGGOTA */}
          <TeamMemberTable rosterMembers={rosterMembers} />

          {/* 3. RIWAYAT KOMPETISI */}
          <div className="card-stone p-4 md:p-6 space-y-6 rounded-lg">
            <h2 className="text-xl md:text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-coc-gold" /> {t.clanDetail.competitionHistory}
            </h2>

            <div className="space-y-4">
              {competitionHistory.map((comp, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-coc-stone/70 rounded-lg border border-coc-gold-dark/20 gap-2"
                >
                  <div>
                    <h3 className="font-clash text-lg text-white">
                      {comp.tournament}
                    </h3>
                    <p className="text-xs text-gray-400">{comp.date}</p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p
                      className={`font-bold text-lg ${
                        comp.rank.includes('Juara')
                          ? 'text-coc-gold'
                          : 'text-gray-300'
                      }`}
                    >
                      {comp.rank}
                    </p>
                    {comp.prize !== '-' && (
                      <p className="text-sm text-coc-green">{comp.prize}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Ulasan Klan */}
          <section id="ulasan-tim" className="scroll-mt-24">
            <ClanReviewsCard clanReviews={clanReviews} />
          </section>
        </section>
      </section>
    </main>
  );
};

export default ClanDetailClient;