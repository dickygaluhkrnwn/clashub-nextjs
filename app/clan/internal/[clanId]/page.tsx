import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getManagedClanDataAdmin,
  getClanApiCacheAdmin,
} from '@/lib/firestore-admin/clans';
import { getTeamMembersAdmin } from '@/lib/firestore-admin/users';
import { getClanReviewsAdmin } from '@/lib/firestore-admin/reviews';
import { getSessionUser } from '@/lib/server-auth';
import { UserProfile } from '@/lib/types';
import { RosterMember } from '@/app/clan/manage/components/MemberTableRow';
import ClanDetailClient from './ClanDetailClient'; // Import Client Component

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

  // Logic Data Processing (Server-Side)
  const clanTagRaw = managedClan.tag.replace('#', '');
  const cocApiUrl = `https://link.clashofclans.com/en/?action=OpenClanProfile&tag=${clanTagRaw}`;

  const totalReviews = clanReviews.length;
  const averageRating =
    totalReviews > 0
      ? clanReviews.reduce((acc, review) => acc + review.rating, 0) /
        totalReviews
      : 0;

  const totalMembers = apiCache?.members?.length || 0;
  const isFull = totalMembers >= 50;
  const isClanOwner = sessionUser?.uid === managedClan.ownerUid;

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

  // Pass data yang sudah diproses ke Client Component
  // Lakukan serialisasi JSON untuk menghindari error object tak terduga
  return (
    <ClanDetailClient 
      managedClan={JSON.parse(JSON.stringify(managedClan))}
      clanReviews={JSON.parse(JSON.stringify(clanReviews))}
      averageRating={averageRating}
      totalReviews={totalReviews}
      totalMembers={totalMembers}
      isFull={isFull}
      isClanOwner={isClanOwner}
      rosterMembers={JSON.parse(JSON.stringify(rosterForTable))}
      cocApiUrl={cocApiUrl}
      clanId={clanId}
    />
  );
};

export default ClanDetailPage;