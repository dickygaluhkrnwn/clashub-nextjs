'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/app/components/ui/Button';
import {
  ManagedClan,
  ClanReview,
} from '@/lib/types';
import { ClanReviewsCard } from '../components/ClanReviewsCard';
import { RosterMember } from '@/app/clan/manage/components/MemberTableRow';
import {
  StarIcon,
  ShieldIcon,
  GlobeIcon,
  DiscordIcon,
  ClockIcon,
  TrophyIcon,
  InfoIcon,
  ExternalLinkIcon,
  EditIcon,
  UserIcon,
  MapPinIcon,
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

// Helper Component for Stats Card
const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string | number, color: string }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md hover:bg-white/5 transition-colors group">
        <div className={`p-2 rounded-full mb-2 ${color.replace('text-', 'bg-')}/10`}>
            <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <p className="text-xl md:text-2xl font-clash text-white mb-1 group-hover:scale-110 transition-transform">{value}</p>
        <p className="text-[10px] md:text-xs uppercase tracking-wider text-gray-400 font-bold text-center">{title}</p>
    </div>
);

// Helper Component for Detail Item
const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
        <div className="p-2 rounded-lg bg-black/20">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">{label}</p>
            <p className="text-sm font-medium text-gray-200">{value}</p>
        </div>
    </div>
);

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
  const { t } = useLanguage();

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
    memberCount
  } = managedClan;

  const isCompetitive = vision === 'Kompetitif';

  const upcomingEvent = {
    name: t.clanDetail.nextWar,
    date: '7 Oktober',
    time: `20:00 WIB ${t.clanDetail.preparation}`,
  };

  const getSocialIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();
    if (lowerPlatform.includes('discord')) return <DiscordIcon className="h-4 w-4" />;
    if (lowerPlatform.includes('website') || lowerPlatform.includes('web')) return <GlobeIcon className="h-4 w-4" />;
    return <ExternalLinkIcon className="h-4 w-4" />;
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* 1. HERO BACKGROUND */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-radial-at-t from-coc-blue/10 via-coc-dark/50 to-coc-dark pointer-events-none z-0" />
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-coc-gold/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[200px] left-[-100px] w-64 h-64 bg-coc-blue/5 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-24 md:pt-32">
        
        {/* 2. HEADER PROFILE KLAN */}
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-end mb-12">
            
            {/* Logo Klan */}
            <div className="relative shrink-0 group">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-black/40 border-2 border-white/10 p-3 shadow-2xl backdrop-blur-md transform group-hover:scale-105 transition-transform duration-300">
                    <Image
                        src={logoUrl || '/images/clan-badge-placeholder.png'}
                        alt={`Lencana ${name}`}
                        width={192}
                        height={192}
                        className="w-full h-full object-contain drop-shadow-xl"
                        priority
                    />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-coc-stone border border-coc-gold/30 text-coc-gold px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-black/50">
                    Level {clanLevel}
                </div>
            </div>

            {/* Info Utama */}
            <div className="flex-grow w-full text-center lg:text-left space-y-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-clash text-white mb-2 drop-shadow-lg leading-tight tracking-tight">{name}</h1>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                        <span className="font-mono text-gray-400 font-bold tracking-wide bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-sm md:text-base">{tag}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider border ${
                            isCompetitive 
                            ? 'bg-coc-red/10 text-coc-red border-coc-red/20' 
                            : 'bg-coc-green/10 text-coc-green border-coc-green/20'
                        }`}>
                            {vision}
                        </span>
                        <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                            <StarIcon className="h-4 w-4 text-coc-gold fill-current" />
                            <span className="text-sm font-bold text-white">{averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4 text-sm text-gray-400 justify-center lg:justify-start">
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                        <MapPinIcon className="h-4 w-4 text-coc-blue" />
                        <span>Lokasi: Lihat di CoC</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        Updated: Baru saja
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0 min-w-[220px]">
                {isClanOwner ? (
                    <>
                        <Link href={`/clan/manage?clanId=${clanId}`} className="w-full">
                            <Button variant="primary" size="lg" className="w-full justify-center shadow-xl shadow-coc-gold/20">
                                <InfoIcon className="h-5 w-5 mr-2" /> {t.clanDetail.manageClan}
                            </Button>
                        </Link>
                        <Link href={`/clan/internal/${clanId}/edit`} className="w-full">
                            <Button variant="secondary" className="w-full justify-center bg-black/40 border-white/10 hover:bg-white/10">
                                <EditIcon className="h-4 w-4 mr-2" /> {t.clanDetail.editProfile}
                            </Button>
                        </Link>
                    </>
                ) : (
                    <>
                        {!isFull ? (
                            <Link href={`/clan/internal/${clanId}/join`} className="w-full">
                                <Button variant="primary" size="lg" className="w-full justify-center shadow-xl shadow-coc-gold/20">
                                    {t.clanDetail.join}
                                </Button>
                            </Link>
                        ) : (
                            <div className="w-full px-4 py-3 bg-coc-red/10 border border-coc-red/30 rounded-xl text-coc-red text-center font-bold text-sm">
                                {t.clanDetail.rosterFull}
                            </div>
                        )}
                        <a href={cocApiUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button variant="outline" className="w-full justify-center border-white/20 hover:border-coc-gold text-gray-300 hover:text-coc-gold">
                                <ExternalLinkIcon className="h-4 w-4 mr-2" /> {t.clanDetail.cocProfile}
                            </Button>
                        </a>
                    </>
                )}
            </div>
        </div>

        {/* 3. CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            
            {/* LEFT COLUMN: STATS, DETAILS, REVIEWS */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard 
                        icon={UserIcon} 
                        title={t.clanPublicProfile.stats.members || "Anggota"} 
                        value={`${totalMembers}/50`} 
                        color="text-coc-blue" 
                    />
                    <StatCard 
                        icon={TrophyIcon} 
                        title="Rata-rata TH" 
                        value={avgTh.toFixed(1)} 
                        color="text-coc-gold" 
                    />
                    <StatCard 
                        icon={StarIcon} 
                        title="Visi Klan" 
                        value={vision}
                        color="text-purple-400" 
                    />
                </div>

                {/* About Section */}
                <section className="bg-gradient-to-b from-[#252525] to-[#1a1a1a] rounded-3xl border border-white/5 p-6 md:p-8 shadow-xl">
                    <h2 className="text-xl font-clash text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="p-2 rounded-lg bg-coc-blue/10 border border-coc-blue/20">
                            <InfoIcon className="h-5 w-5 text-coc-blue" />
                        </div>
                        {t.clanDetail.aboutClan}
                    </h2>
                    <div className="prose prose-invert max-w-none text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-line mb-8">
                        {profileDescription || <span className="text-gray-500 italic">{t.clanDetail.noDescription}</span>}
                    </div>

                    <h3 className="text-lg font-clash text-white mb-4 flex items-center gap-2">
                        <ShieldIcon className="h-5 w-5 text-coc-red" />
                        {t.clanDetail.clanRules}
                    </h3>
                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {clanRules || <span className="text-gray-500 italic">{t.clanDetail.noRules}</span>}
                    </div>
                </section>

                {/* Additional Details Grid - Disederhanakan */}
                <section>
                    <h3 className="text-lg font-clash text-gray-400 mb-4 px-2 uppercase tracking-widest">Info Tambahan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Event Terdekat - Style Baru */}
                        <div className="flex flex-col justify-center p-4 rounded-2xl bg-gradient-to-br from-coc-gold/10 to-black/40 border border-coc-gold/20 relative overflow-hidden group h-[120px]">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ClockIcon className="w-16 h-16 text-coc-gold" />
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-wide text-coc-gold mb-1 relative z-10">{upcomingEvent.name}</p>
                            <p className="text-lg font-clash text-white relative z-10">{upcomingEvent.date}</p>
                            <p className="text-xs text-gray-400 relative z-10">{upcomingEvent.time}</p>
                        </div>

                        {/* Kontak & Sosial - Style Baru (Matching Event Card) */}
                        <div className="flex flex-col justify-center p-4 rounded-2xl bg-gradient-to-br from-coc-blue/10 to-black/40 border border-coc-blue/20 relative overflow-hidden group h-[120px]">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <GlobeIcon className="w-16 h-16 text-coc-blue" />
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-wide text-coc-blue mb-2 relative z-10">{t.clanDetail.contactSocials}</p>
                            
                            <div className="flex flex-wrap gap-2 relative z-10">
                                {socialLinks && socialLinks.length > 0 ? (
                                    socialLinks.map((link, idx) => (
                                        <a 
                                            key={idx}
                                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-black/40 rounded-lg text-coc-blue hover:text-white hover:bg-coc-blue/20 transition-colors border border-white/5"
                                            title={link.platform}
                                        >
                                            {getSocialIcon(link.platform)}
                                        </a>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">{t.clanDetail.noSocials}</span>
                                )}
                            </div>
                        </div>

                    </div>
                </section>

                {/* Reviews Section */}
                <section id="ulasan-tim" className="scroll-mt-24 pt-4 border-t border-white/10">
                    <ClanReviewsCard clanReviews={clanReviews} />
                </section>
            </div>

            {/* RIGHT COLUMN: MEMBER LIST (STICKY) */}
            <div className="lg:col-span-1">
                <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden shadow-xl sticky top-24">
                    <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h2 className="text-xl font-clash text-white flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-coc-blue" />
                            {t.clanPublicProfile.memberListTitle || "Daftar Anggota"}
                        </h2>
                        <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-gray-300">
                            {rosterMembers.length}/50
                        </span>
                    </div>
                    
                    {rosterMembers.length > 0 ? (
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-2">
                            <div className="space-y-1">
                                {rosterMembers
                                    .sort((a, b) => {
                                        const rolePriority: { [key: string]: number } = { 'leader': 1, 'coLeader': 2, 'admin': 3, 'elder': 3, 'member': 4 };
                                        const priorityA = rolePriority[a.role.toLowerCase()] || 5;
                                        const priorityB = rolePriority[b.role.toLowerCase()] || 5;
                                        if (priorityA !== priorityB) return priorityA - priorityB;
                                        return b.townHallLevel - a.townHallLevel;
                                    })
                                    .map((member) => (
                                        <div key={member.tag} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                            {/* TH Badge */}
                                            <div className="relative shrink-0 w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-coc-gold/30">
                                                <span className="text-[10px] text-gray-500 font-bold absolute -top-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] px-1 rounded">TH</span>
                                                <span className="text-lg font-bold text-white group-hover:text-coc-gold">{member.townHallLevel}</span>
                                            </div>
                                            
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-baseline justify-between">
                                                    {member.isVerified && member.uid ? (
                                                        <Link 
                                                            href={`/player/${member.uid}`}
                                                            className="text-sm font-bold text-gray-200 hover:text-coc-gold truncate block transition-colors"
                                                        >
                                                            {member.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-200 truncate block">
                                                            {member.name}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                                                        member.role === 'leader' ? 'text-coc-gold' : 
                                                        member.role === 'coLeader' ? 'text-gray-300' : 
                                                        'text-gray-500'
                                                    }`}>
                                                        {member.role === 'admin' ? 'Elder' : member.role}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-[10px] text-coc-blue font-medium">
                                                        {member.clashubRole || "Member"}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span className="flex items-center gap-0.5 text-coc-green" title="Donasi Diberikan">
                                                            ▲ {member.donations.toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center gap-0.5 text-coc-red" title="Donasi Diterima">
                                                            ▼ {member.donationsReceived.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{t.clanPublicProfile.memberListEmpty || "Data anggota tidak tersedia."}</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ClanDetailClient;