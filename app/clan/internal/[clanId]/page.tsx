import { notFound } from 'next/navigation';
// import Image from 'next/image'; // Tidak terpakai, bisa dihapus
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
// [FASE 3.1] Impor tipe ClanReview dan ClanSocialLink
import {
  ManagedClan,
  UserProfile,
  ClanApiCache,
  ClanRole,
  ClanReview,
  ClanSocialLink, // <-- [BARU FASE 3.1] Impor tipe link sosial
} from '@/lib/types';

// [PERBAIKAN KRITIS] Ganti impor client-side ke admin-side untuk Server Component
import {
  getManagedClanDataAdmin,
  getClanApiCacheAdmin,
} from '@/lib/firestore-admin/clans';
import { getTeamMembersAdmin } from '@/lib/firestore-admin/users';
// [BARU: Fase 4.3] Impor fungsi dan komponen ulasan baru
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
// [PERBAIKAN PATH] Path diubah dari './components' ke '../components'
import { ClanReviewsCard } from '../components/ClanReviewsCard';
// ---

import {
  ArrowLeftIcon,
  StarIcon,
  ShieldIcon,
  UserIcon,
  GlobeIcon,
  DiscordIcon,
  ClockIcon,
  TrophyIcon,
  // MapPinIcon, // Tidak terpakai
  InfoIcon,
  ExternalLinkIcon,
  EditIcon, // <-- [FIX ERROR 2305] Mengganti PencilIcon dengan EditIcon
} from '@/app/components/icons';
import { getSessionUser } from '@/lib/server-auth';

// Definisikan tipe untuk parameter rute dinamis (Menggunakan clanId yang baru)
interface ClanDetailPageProps {
  params: {
    clanId: string; // FIX: Menggunakan clanId
  };
}

// --- HELPER UNTUK KETERANGAN PARTISIPASI (Diambil dari ManageClanClient) ---
const getParticipationStatusClass = (
  status: ClanApiCache['members'][number]['participationStatus'] | 'Aman',
) => {
  switch (status) {
    case 'Promosi':
      return 'bg-coc-gold/20 text-coc-gold border border-coc-gold/30';
    case 'Demosi':
      return 'bg-coc-red/20 text-coc-red border border-coc-red/30';
    case 'Leader/Co-Leader':
      return 'bg-coc-blue/20 text-coc-blue border border-coc-blue/30';
    case 'Aman':
    default:
      return 'bg-coc-green/20 text-coc-green border border-coc-green/30';
  }
};

// Tambahkan tipe untuk anggota yang diperkaya
type EnrichedMember = UserProfile & {
  warSuccessCount: number;
  warFailCount: number;
  participationStatus:
    | ClanApiCache['members'][number]['participationStatus']
    | 'Aman';
  trophies: number;
  donations: number;
  statusKeterangan: string; // Tambahkan keterangan status
};

// =========================================================================
// SERVER DATA FETCHING
// =========================================================================

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({
  params,
}: ClanDetailPageProps): Promise<Metadata> {
  const clanId = decodeURIComponent(params.clanId); // FIX: Menggunakan clanId
  // [PERBAIKAN KRITIS] Gunakan fungsi Admin SDK
  const clan = await getManagedClanDataAdmin(clanId);

  if (!clan) {
    return { title: 'Klan Tidak Ditemukan | Clashub' };
  }

  return {
    title: `Clashub | Profil Klan: ${clan.name} (${clan.tag})`,
    description: `Lihat profil klan internal ${clan.name} di Clashub. Level klan: ${clan.clanLevel}, Rata-rata TH: ${clan.avgTh}.`,
  };
}

/**
 * @component ClanDetailPage (Server Component)
 * Menampilkan detail lengkap profil klan internal (ManagedClan).
 * FIX: Ganti nama komponen dan props (teamId -> clanId)
 */
const ClanDetailPage = async ({ params }: ClanDetailPageProps) => {
  const clanId = decodeURIComponent(params.clanId); // FIX: Menggunakan clanId
  const sessionUser = await getSessionUser();

  // [PERBAIKAN KRITIS] Mengambil data menggunakan Admin SDK di Server Component
  // [BARU: Fase 4.3] Menambahkan getClanReviewsAdmin
  const [managedClan, apiCache, members, clanReviews] = await Promise.all([
    getManagedClanDataAdmin(clanId),
    getClanApiCacheAdmin(clanId), // Mengambil data cache Partisipasi
    getTeamMembersAdmin(clanId), // Mengambil anggota (UserProfile yang clanId-nya cocok)
    getClanReviewsAdmin(clanId), // <-- [BARU] Mengambil data ulasan
  ]);

  if (!managedClan) {
    notFound();
  }

  const clanTagRaw = managedClan.tag.replace('#', '');
  const cocApiUrl = `https://link.clashofclans.com/en/?action=OpenClanProfile&tag=${clanTagRaw}`;

  // [BARU: Fase 4.3] Mengkalkulasi rating asli (mengganti data dummy)
  const totalReviews = clanReviews.length;
  const averageRating =
    totalReviews > 0
      ? clanReviews.reduce((acc, review) => acc + review.rating, 0) /
        totalReviews
      : 0; // Default 0 jika tidak ada ulasan

  const {
    name,
    tag,
    vision,
    avgTh,
    // [GANTI: FASE 3.1] Hapus 'website' dan 'discordId' lama
    // website,
    // discordId,
    clanLevel,
    ownerUid,
    // [BARU: FASE 3.1] Ambil data profil dinamis
    profileDescription,
    clanRules,
    socialLinks,
  } = managedClan;

  const isCompetitive = vision === 'Kompetitif';
  const isFull = members.length >= 50;
  const isClanOwner = sessionUser?.uid === ownerUid;

  // Temukan data Partisipasi anggota klan dari cache
  const enrichedMembers: EnrichedMember[] = members.map((member) => {
    const cacheMember = apiCache?.members.find(
      (cm) => cm.tag === member.playerTag,
    );

    return {
      ...member,
      // Partisipasi dikalkulasi dari cache
      warSuccessCount: cacheMember?.warSuccessCount || 0,
      warFailCount: cacheMember?.warFailCount || 0,
      participationStatus: cacheMember?.participationStatus || 'Aman',
      statusKeterangan:
        (cacheMember as any)?.statusKeterangan || 'N/A', // Ambil keterangan dari cache
      // Gunakan data CoC yang lebih baru dari cache/API jika ada
      trophies: cacheMember?.trophies || member.trophies,
      donations: cacheMember?.donations || 0,
      clanRole:
        (cacheMember?.role as unknown as ClanRole) ||
        member.clanRole ||
        ClanRole.NOT_IN_CLAN,
    };
  });

  // Sort anggota berdasarkan TH level (Tertinggi ke Terendah)
  enrichedMembers.sort((a, b) => b.thLevel - a.thLevel);

  // Data dummy untuk Riwayat Kompetisi (dipertahankan)
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

  // Data dummy untuk Event Terdekat (dipertahankan)
  const upcomingEvent = {
    name: 'War Clan Berikutnya',
    date: '7 Oktober',
    time: '20:00 WIB (Persiapan)',
  };

  // [BARU: FASE 3.1] Helper untuk ikon sosial media
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
    // Default ikon
    return (
      <ExternalLinkIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0" />
    );
  };

  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      {/* Header Profil Klan */}
      <header className="flex justify-between items-center flex-wrap gap-4 mb-8 card-stone p-6 rounded-lg">
        <div className="flex items-center gap-4">
          {/* PERBAIKAN KRITIS: Mengubah href="/clan-hub" (sudah benar) */}
          <Button
            href="/clan-hub"
            variant="secondary"
            size="md"
            className="flex items-center flex-shrink-0"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
          </Button>

          <div>
            <h1 className="text-3xl lg:text-4xl text-white font-clash m-0">
              {name}
            </h1>
            <p className="text-sm text-coc-gold font-bold mb-1">{tag}</p>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                isCompetitive
                  ? 'bg-coc-red text-white'
                  : 'bg-coc-green text-coc-stone'
              }`}
            >
              {vision} (TH Avg: {avgTh.toFixed(1)}) | Level Klan: {clanLevel}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={cocApiUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg">
              <ExternalLinkIcon className="h-5 w-5 mr-2" /> Profil CoC
            </Button>
          </a>
          {isClanOwner ? (
            // [BARU: FASE 3.2] Tambahkan tombol Edit Profil & Kelola Klan
            <>
              <Link href={`/clan/internal/${clanId}/edit`}>
                {/* [FIX ERROR 2322] Mengganti variant "primary_outline" menjadi "secondary" */}
                <Button variant="secondary" size="lg">
                  {/* [FIX ERROR 2305] Mengganti PencilIcon dengan EditIcon */}
                  <EditIcon className="h-5 w-5 mr-2" /> Edit Profil Klan
                </Button>
              </Link>
              <Link href={`/clan/manage?clanId=${clanId}`}>
                <Button variant="primary" size="lg">
                  <InfoIcon className="h-5 w-5 mr-2" /> Kelola Klan
                </Button>
              </Link>
            </>
          ) : isFull ? (
            <span className="px-4 py-2 bg-coc-red border-2 border-red-900 text-white rounded-lg text-sm font-bold shadow-md flex items-center">
              Roster Penuh
            </span>
          ) : (
            // FIX: Menggunakan clanId di link Join
            <Button
              href={`/clan/internal/${clanId}/join`}
              variant="primary"
              size="lg"
            >
              Kirim Permintaan Bergabung
            </Button>
          )}
        </div>
      </header>

      {/* Layout Utama Profil - FIX DENGAN STRUKTUR STACKED (UNIK UNTUK PAGE INI) */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Kolom Kiri: Statistik & Kontak (SIDEBAR) */}
        {/* FIX: Menambahkan Z-index dan menstabilkan lebar kolom */}
        <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 rounded-lg z-10">
          {/* Reputasi Tim */}
          <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
            <StarIcon className="h-5 w-5" /> Reputasi Tim
          </h3>
          <div className="text-center">
            {/* [BARU: Fase 4.3] Ganti data dummy dengan data asli */}
            <p className="text-5xl font-clash text-coc-gold my-1">
              {averageRating.toFixed(1)}{' '}
              <StarIcon className="inline h-8 w-8" />
            </p>
            <p className="text-xs text-gray-500">
              (Berdasarkan {totalReviews} Ulasan)
            </p>
            {/* [BARU: Fase 4.3] Ubah link ke anchor #ulasan-tim */}
            <Link
              href="#ulasan-tim"
              className="text-xs text-coc-gold hover:underline mt-2 inline-block"
            >
              Lihat Semua Ulasan
            </Link>
          </div>

          {/* Ringkasan Statistik */}
          <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
            <ShieldIcon className="h-5 w-5" /> Ringkasan Statistik
          </h3>
          <ul className="text-sm space-y-3">
            <li className="flex justify-between items-center">
              <span className="font-medium text-gray-400 flex items-center gap-2">
                <ShieldIcon className="h-4 w-4 text-coc-gold-dark" /> Level Klan:
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
                {members.length}/50
              </strong>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-gray-400 flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-coc-gold-dark" /> Rata-rata
                TH:
              </span>{' '}
              <strong className="text-white font-clash text-base">
                {avgTh.toFixed(1)}
              </strong>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-gray-400 flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-coc-gold-dark" /> War
                Winstreak:
              </span>{' '}
              <strong className="text-white font-clash text-base">N/A</strong>
            </li>
          </ul>

          {/* Event Terdekat */}
          <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
            <ClockIcon className="h-5 w-5" /> Event Terdekat
          </h3>
          <div className="bg-coc-stone/70 p-4 rounded-lg text-center border border-coc-gold-dark/30 shadow-inner">
            <p className="font-semibold text-gray-300 mb-1">
              {upcomingEvent.name}:
            </p>
            <p className="font-clash text-2xl text-coc-gold">
              {upcomingEvent.date}
            </p>
            <p className="text-xs text-gray-400">{upcomingEvent.time}</p>
          </div>

          {/* [GANTI: FASE 3.1] Kontak & Sosial Dinamis */}
          <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2 mt-6">
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
          {/* [AKHIR GANTI: FASE 3.1] */}
        </aside>

        {/* Kolom Kanan: Detail & Daftar Anggota (UTAMA) */}
        <section className="lg:col-span-3 space-y-8">
          {/* 1. VISI & ATURAN (Diubah dari Tab menjadi Section) */}
          <div className="card-stone p-6 space-y-6 rounded-lg">
            <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <InfoIcon className="h-6 w-6 text-coc-gold" /> Tentang Klan
            </h2>
            {/* [GANTI: FASE 3.1] Deskripsi dinamis */}
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {profileDescription || 'Deskripsi klan belum diatur oleh Leader.'}
            </p>
            {/* [AKHIR GANTI: FASE 3.1] */}

            <h3 className="text-xl text-coc-gold-dark font-clash border-b border-coc-gold-dark/30 pb-2 mt-6 flex items-center gap-2">
              Aturan Tim
            </h3>
            {/* [GANTI: FASE 3.1] Aturan dinamis */}
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {clanRules || 'Aturan klan belum diatur oleh Leader.'}
            </p>
            {/* [AKHIR GANTI: FASE 3.1] */}
          </div>

          {/* 2. DAFTAR ROSTER/ANGGOTA */}
          <div className="card-stone p-6 space-y-6 rounded-lg">
            <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-coc-gold" /> Anggota Tim (
              {members.length}/50)
            </h2>
            {enrichedMembers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Tim ini belum memiliki anggota yang terdaftar di Clashub.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
                  <thead className="bg-coc-stone/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                        Pemain (TH)
                      </th>
                      <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                        Role Clashub
                      </th>
                      <th className="px-3 py-2 text-center font-clash text-coc-green uppercase tracking-wider">
                        Sukses War
                      </th>
                      <th className="px-3 py-2 text-center font-clash text-coc-red uppercase tracking-wider">
                        Gagal War
                      </th>
                      <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                        Status Partisipasi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-coc-gold-dark/10">
                    {enrichedMembers.map((member) => (
                      <tr
                        key={member.uid}
                        className="hover:bg-coc-stone/20 transition-colors"
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
                          <Link
                            href={`/player/${member.uid}`}
                            className="hover:text-coc-gold-light transition-colors"
                          >
                            {member.displayName}
                          </Link>
                          <span className="text-gray-500 block text-xs">
                            TH{member.thLevel} | {member.playerTag}
                          </span>
                        </td>
                        {/* FIX: Menggunakan role Clashub internal */}
                        <td className="px-3 py-3 whitespace-nowrap text-center text-xs uppercase font-medium text-coc-blue">
                          {member.role || 'N/A'}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-green font-bold">
                          {member.warSuccessCount}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-red font-bold">
                          {member.warFailCount}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-left">
                          <span
                            title={member.statusKeterangan}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-sans font-medium ${getParticipationStatusClass(
                              member.participationStatus,
                            )}`}
                          >
                            {member.participationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. RIWAYAT KOMPETISI (Diubah dari Tab menjadi Section) */}
          <div className="card-stone p-6 space-y-6 rounded-lg">
            <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-coc-gold" /> Riwayat Kompetisi
            </h2>

            <div className="space-y-4">
              {competitionHistory.map((comp, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-coc-stone/70 rounded-lg border border-coc-gold-dark/20"
                >
                  <div>
                    <h3 className="font-clash text-lg text-white">
                      {comp.tournament}
                    </h3>
                    <p className="text-xs text-gray-400">{comp.date}</p>
                  </div>
                  <div className="text-right">
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

          {/* [BARU: Fase 4.3] Section Ulasan Klan */}
          <section id="ulasan-tim" className="scroll-mt-24">
            <ClanReviewsCard clanReviews={clanReviews} />
          </section>
        </section>
      </section>
    </main>
  );
};

export default ClanDetailPage;