// File: app/player/[playerId]/page.tsx
// Deskripsi: Menampilkan E-Sports CV pemain (UserProfile) - Server Component.

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
  CocPlayer,
  ClanRole,
} from '@/lib/types';
import { DocumentData } from 'firebase-admin/firestore';
import { getPostsByAuthorAdmin } from '@/lib/firestore-admin/posts';
import {
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
  getUserProfileAdmin,
  getUserProfileByPlayerTagAdmin,
} from '@/lib/firestore-admin/users';

import cocApi from '@/lib/coc-api';
import { adminFirestore } from '@/lib/firebase-admin';
import { createOrLinkManagedClan } from '@/lib/firestore-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

import PlayerProfileClient from './PlayerProfileClient';

// FORCE DYNAMIC RENDERING
export const dynamic = 'force-dynamic';

interface PlayerDetailPageProps {
  params: {
    playerId: string;
  };
}

const isCocTag = (str: string): boolean => {
  return str.startsWith('#') && str.length >= 2;
};

const mapCocRoleToClashubRole = (cocRole: ClanRole): UserProfile['role'] => {
  switch (cocRole) {
    case ClanRole.LEADER: return 'Leader';
    case ClanRole.CO_LEADER: return 'Co-Leader';
    case ClanRole.ELDER: return 'Elder';
    case ClanRole.MEMBER: return 'Member';
    default: return 'Free Agent';
  }
};

const getPlayerProfile = async (
  id: string,
): Promise<FirestoreDocument<UserProfile> | null> => {
  let player: FirestoreDocument<UserProfile> | null = await getUserProfileAdmin(id);
  if (player) return player;

  const decodedId = decodeURIComponent(id).toUpperCase();
  if (isCocTag(decodedId)) {
    console.log(`[PlayerDetailPage] Searching by Tag: ${decodedId}`);
    player = await getUserProfileByPlayerTagAdmin(decodedId);
    return player;
  }

  return null;
};

export async function generateMetadata({
  params,
}: PlayerDetailPageProps): Promise<Metadata> {
  const player = await getPlayerProfile(params.playerId);
  if (!player) return { title: 'Pemain Tidak Ditemukan | Clashub' };

  return {
    title: `Clashub | CV: ${player.displayName}`,
    description: `Lihat statistik dan profil E-Sports ${player.displayName}.`,
  };
}

const PlayerDetailPage = async ({ params }: PlayerDetailPageProps) => {
  const playerId = params.playerId;
  const TTL_MS = 15 * 60 * 1000; // 15 min

  const initialPlayer = await getPlayerProfile(playerId);

  if (!initialPlayer) {
    return notFound();
  }

  let player = initialPlayer;

  // Logic Auto-Sync / Self-Healing
  const lastVerifiedTime = player.lastVerified
    ? new Date((player.lastVerified as any).seconds * 1000 || player.lastVerified).getTime()
    : 0;
  const isStale = Date.now() - lastVerifiedTime > TTL_MS;
  const isSuspicious = player.clanTag && player.role === 'Free Agent';
  const shouldSync = player.isVerified && (isStale || isSuspicious);

  if (shouldSync) {
    console.log(`[PlayerDetailPage] Syncing data for ${player.inGameName}...`);
    try {
      const encodedPlayerTag = encodeURIComponent(player.playerTag);
      const cocPlayerData: CocPlayer = await cocApi.getPlayerData(encodedPlayerTag);

      const cocApiRole = cocPlayerData.clan
        ? (cocPlayerData.role?.toLowerCase() as ClanRole) || ClanRole.MEMBER
        : ClanRole.NOT_IN_CLAN;

      let clashubRole: UserProfile['role'] = mapCocRoleToClashubRole(cocApiRole);
      let managedClanId: string | null = player.clanId || null;
      let managedClanName: string | null = player.clanName || null;

      if (cocPlayerData.clan) {
        if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
           managedClanId = await createOrLinkManagedClan(
             cocPlayerData.clan.tag,
             cocPlayerData.clan.name,
             player.uid
           );
        } else {
           const clanQuery = await adminFirestore
             .collection(COLLECTIONS.MANAGED_CLANS)
             .where('tag', '==', cocPlayerData.clan.tag)
             .limit(1)
             .get();
           managedClanId = !clanQuery.empty ? clanQuery.docs[0].id : null;
        }
        managedClanName = cocPlayerData.clan.name;
      } else {
        clashubRole = 'Free Agent';
        managedClanId = null;
        managedClanName = null;
      }

      const updateData: Partial<UserProfile> = {
        inGameName: cocPlayerData.name,
        thLevel: cocPlayerData.townHallLevel,
        trophies: cocPlayerData.trophies,
        lastVerified: new Date(),
        clanTag: cocPlayerData.clan?.tag || null,
        clanRole: cocApiRole,
        role: clashubRole,
        clanId: managedClanId,
        clanName: managedClanName,
      };

      const cleanUpdate = JSON.parse(JSON.stringify(updateData));
      await adminFirestore.collection(COLLECTIONS.USERS).doc(player.uid).update(cleanUpdate);
      
      // Update local object
      player = { ...player, ...cleanUpdate };
      console.log(`[PlayerDetailPage] ✅ Sync Success.`);
    } catch (error) {
      console.error(`[PlayerDetailPage] Sync Failed:`, error);
    }
  }

  // Fetch Auxiliary Data
  let recentPosts: FirestoreDocument<Post>[] = [];
  let clanHistory: FirestoreDocument<DocumentData>[] = [];
  let playerReviews: FirestoreDocument<PlayerReview>[] = [];

  try {
    const [postsData, historyData, reviewsData] = await Promise.all([
      getPostsByAuthorAdmin(player.uid, 3), 
      getClanHistoryAdmin(player.uid),
      getPlayerReviewsAdmin(player.uid),
    ]);
    recentPosts = postsData;
    clanHistory = historyData;
    playerReviews = reviewsData;
  } catch (e) {
    console.error(`[PlayerDetailPage] Aux fetch error:`, e);
  }

  return (
    <PlayerProfileClient
      userProfile={JSON.parse(JSON.stringify(player))}
      recentPosts={JSON.parse(JSON.stringify(recentPosts))}
      clanHistory={JSON.parse(JSON.stringify(clanHistory))}
      playerReviews={JSON.parse(JSON.stringify(playerReviews))}
    />
  );
};

export default PlayerDetailPage;