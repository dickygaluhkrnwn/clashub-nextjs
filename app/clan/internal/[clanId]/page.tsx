import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import {
  ManagedClan,
  UserProfile,
  ClanApiCache,
  ClanRole,
  ClanReview,
  ClanSocialLink,
  ManagerRole,
  StandardMemberRole,
} from '@/lib/types';

import {
  getManagedClanDataAdmin,
  getClanApiCacheAdmin,
} from '@/lib/firestore-admin/clans';
import { getTeamMembersAdmin } from '@/lib/firestore-admin/users';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import { ClanReviewsCard } from '../components/ClanReviewsCard';

import {
  TeamMemberTable,
} from '../components/TeamMemberTable';

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
import { getSessionUser } from '@/lib/server-auth';

interface ClanDetailPageProps {
  params: {
    clanId: string;
  };
}

export async function generateMetadata({
  params,
}: ClanDetailPageProps): Promise<Metadata> {
  const clanId = decodeURIComponent(params.clanId);
  const clan = await getManagedClanDataAdmin(clanId);

  if (!clan) {
    return { title: 'Klan Tidak Ditemukan | Clashub' };
  }

  return {
    title: `Clashub | Profil Klan: ${clan.name} (${clan.tag})`,
    description: `Lihat profil klan internal ${clan.name} di Clashub. Level klan: ${clan.clanLevel}, Rata-rata TH: ${clan.avgTh}.`,
  };
}

const ClanDetailPage = async ({ params }: ClanDetailPageProps) => {
  const clanId = decodeURIComponent(params.clanId);
  const sessionUser = await getSessionUser();

  const [managedClan, apiCache, verifiedMembers, clanReviews] = await Promise.all(
    [
      getManagedClanDataAdmin(clanId),
      getClanApiCacheAdmin(clanId),
      getTeamMembersAdmin(clanId),
      getClanReviewsAdmin(clanId),
    ],
  );

  if (!managedClan) {
    notFound();
  }

  const clanTagRaw = managedClan.tag.replace('#', '');
  const cocApiUrl = `https://link.clashofclans.com/en/?action=OpenClanProfile&tag=${clanTagRaw}`;

  const totalReviews = clanReviews.length;
  const averageRating =
    totalReviews > 0
      ? clanReviews.reduce((acc, review) => acc + review.rating, 0) /
        totalReviews
      : 0;

  const {
    name,
    tag,
    vision,
    avgTh,
    clanLevel,
    ownerUid,
    profileDescription,
    clanRules,
    socialLinks,
    logoUrl,
  } = managedClan;

  const isCompetitive = vision === 'Kompetitif';

  const totalMembers = apiCache?.members?.length || 0;
  const isFull = totalMembers >= 50;
  const isClanOwner = sessionUser?.uid === ownerUid;

  const allApiMembers = apiCache?.members || [];

  const verifiedMembersMap = new Map<string, UserProfile>();
  verifiedMembers.forEach((user) => {
    verifiedMembersMap.set(user.playerTag, user);
  });

  const rosterForTable: RosterMember[] = allApiMembers.map((apiMember) => {
    const verifiedProfile = verifiedMembersMap.get(apiMember.tag);

    return {
      ...apiMember,
      uid: verifiedProfile?.uid,
      clashubRole: verifiedProfile?.role || 'Member',
      isVerified: !!verifiedProfile,
      warSuccessCount: apiMember.warSuccessCount || 0,
      warFailCount: apiMember.warFailCount || 0,
      cwlSuccessCount: apiMember.cwlSuccessCount || 0,
      cwlFailCount: apiMember.cwlFailCount || 0,
      participationStatus: apiMember.participationStatus || 'Aman',
      statusKeterangan: apiMember.statusKeterangan || 'N/A',
    };
  });

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
    name: 'War Clan Berikutnya',
    date: '7 Oktober',
    time: '20:00 WIB (Persiapan)',
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
      {/* [PERBAIKAN FASE 2: HEADER RESPONSIF]
        - Menggunakan flex-col di mobile, md:flex-row di desktop.
        - Mengurangi padding di mobile (p-4 vs p-6).
        - Tombol menggunakan w-full di mobile agar mudah ditekan.
        - Menghapus size="lg" agar tombol tidak terlalu besar di HP.
      */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 card-stone p-4 md:p-6 rounded-lg">
        {/* Sisi Kiri: Judul Halaman */}
        <h2 className="text-xl md:text-2xl font-clash-bold text-white text-center md:text-left">
          Profil Clan
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
              <ExternalLinkIcon className="h-5 w-5 mr-2" /> Profil CoC
            </Button>
          </a>
          {isClanOwner ? (
            <>
              <Link href={`/clan/internal/${clanId}/edit`} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <EditIcon className="h-5 w-5 mr-2" /> Edit Profil
                </Button>
              </Link>
              <Link href={`/clan/manage?clanId=${clanId}`} className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto">
                  <InfoIcon className="h-5 w-5 mr-2" /> Kelola Klan
                </Button>
              </Link>
            </>
          ) : isFull ? (
            <span className="px-4 py-2 bg-coc-red border-2 border-red-900 text-white rounded-lg text-sm font-bold shadow-md flex items-center justify-center w-full sm:w-auto">
              Roster Penuh
            </span>
          ) : (
            <Link href={`/clan/internal/${clanId}/join`} className="w-full sm:w-auto">
                <Button
                    variant="primary"
                    className="w-full sm:w-auto"
                >
                    Gabung
                </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Layout Utama Profil */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* [PERBAIKAN FASE 2: SIDEBAR STICKY FIX]
          - 'sticky top-28' diubah menjadi 'static lg:sticky lg:top-28'.
          - Di mobile, dia akan menjadi blok biasa (static) di atas konten, tidak menimpa saat scroll.
          - Di desktop, dia akan sticky.
          - Padding disesuaikan (p-4 md:p-6).
        */}
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
                <StarIcon className="h-5 w-5" /> Reputasi Tim
              </h3>
              <div className="text-center">
                <p className="text-5xl font-clash text-coc-gold my-1 flex items-center justify-center gap-2">
                  {averageRating.toFixed(1)}{' '}
                  <StarIcon className="inline h-8 w-8" />
                </p>
                <p className="text-xs text-gray-500">
                  (Berdasarkan {totalReviews} Ulasan)
                </p>
                <Link
                  href="#ulasan-tim"
                  className="text-xs text-coc-gold hover:underline mt-2 inline-block"
                >
                  Lihat Semua Ulasan
                </Link>
              </div>
            </div>

            {/* Blok 3: Ringkasan Statistik */}
            <div className="space-y-4 pt-6 border-t border-coc-gold-dark/30">
              <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                <ShieldIcon className="h-5 w-5" /> Ringkasan Statistik
              </h3>
              <ul className="text-sm space-y-3">
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-coc-gold-dark" /> Level:
                  </span>{' '}
                  <strong className="text-white font-clash text-base">
                    {clanLevel}
                  </strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-coc-gold-dark" /> Anggota:
                  </span>{' '}
                  <strong className="text-white font-clash text-base">
                    {totalMembers}/50
                  </strong>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-400 flex items-center gap-2">
                    <TrophyIcon className="h-4 w-4 text-coc-gold-dark" /> Avg TH:
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
                <ClockIcon className="h-5 w-5" /> Event Terdekat
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
                Kontak & Sosial
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
                    Kontak sosial belum diatur.
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
              <InfoIcon className="h-6 w-6 text-coc-gold" /> Tentang Klan
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {profileDescription || 'Deskripsi klan belum diatur oleh Leader.'}
            </p>

            <h3 className="text-lg md:text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6 flex items-center gap-2">
              Aturan Tim
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {clanRules || 'Aturan klan belum diatur oleh Leader.'}
            </p>
          </div>

          {/* 2. DAFTAR ROSTER/ANGGOTA */}
          <TeamMemberTable rosterMembers={rosterForTable} />

          {/* 3. RIWAYAT KOMPETISI */}
          <div className="card-stone p-4 md:p-6 space-y-6 rounded-lg">
            <h2 className="text-xl md:text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-coc-gold" /> Riwayat Kompetisi
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

export default ClanDetailPage;