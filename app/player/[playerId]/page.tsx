// File: app/player/[playerId]/page.tsx
// Deskripsi: Menampilkan E-Sports CV pemain (UserProfile) - Server Component.
// [UPDATE]: Fix TypeScript Error "player possibly null" & Logic Auto-Fix.

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
import { DocumentData } from 'firebase-admin/firestore'; // [FIX] Import DocumentData dari admin
import { getPostsByAuthorAdmin } from '@/lib/firestore-admin/posts'; // [FIX] Pakai Admin SDK
import {
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
  getUserProfileAdmin,
  getUserProfileByPlayerTagAdmin,
} from '@/lib/firestore-admin/users';

// [TAMBAH] Impor untuk logika TTL & Auto-Fix
import cocApi from '@/lib/coc-api';
import { adminFirestore } from '@/lib/firebase-admin';
import { getManagedClanByTag } from '@/lib/firestore'; // Bisa diganti Admin SDK jika ada, tapi read oke.
import { createOrLinkManagedClan } from '@/lib/firestore-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

// Impor Client Component
import PlayerProfileClient from './PlayerProfileClient';

interface PlayerDetailPageProps {
  params: {
    playerId: string; // Bisa Firebase UID atau Encoded Player Tag CoC
  };
}

/**
 * Fungsi helper untuk mengecek apakah string terlihat seperti Tag CoC
 */
const isCocTag = (str: string): boolean => {
  return str.startsWith('#') && str.length >= 2;
};

// Helper Role Mapping
const mapCocRoleToClashubRole = (cocRole: ClanRole): UserProfile['role'] => {
  switch (cocRole) {
    case ClanRole.LEADER:
      return 'Leader';
    case ClanRole.CO_LEADER:
      return 'Co-Leader';
    case ClanRole.ELDER:
      return 'Elder';
    case ClanRole.MEMBER:
      return 'Member';
    case ClanRole.NOT_IN_CLAN:
    default:
      return 'Free Agent';
  }
};

/**
 * @function getPlayerProfile
 * Logika utama untuk mengambil UserProfile berdasarkan UID atau Tag CoC.
 */
const getPlayerProfile = async (
  id: string,
): Promise<FirestoreDocument<UserProfile> | null> => {
  // 1. Coba sebagai UID
  let player: FirestoreDocument<UserProfile> | null =
    await getUserProfileAdmin(id);

  if (player) return player;

  // 2. Jika bukan UID, coba sebagai Tag CoC
  const decodedId = decodeURIComponent(id).toUpperCase();

  if (isCocTag(decodedId)) {
    console.log(
      `[PlayerDetailPage] Attempting to find UserProfile by CoC Tag: ${decodedId}`,
    );
    player = await getUserProfileByPlayerTagAdmin(decodedId);
    return player;
  }

  return null;
};

export async function generateMetadata({
  params,
}: PlayerDetailPageProps): Promise<Metadata> {
  const playerId = params.playerId;
  const player = await getPlayerProfile(playerId);

  if (!player) {
    return { title: 'Pemain Tidak Ditemukan | Clashub' };
  }

  return {
    title: `Clashub | E-Sports CV: ${player.displayName}`,
    description: `Lihat E-Sports CV, Town Hall ${
      player.thLevel || 'N/A'
    } dari ${player.displayName}.`,
  };
}

/**
 * @component PlayerDetailPage (Server Component)
 */
const PlayerDetailPage = async ({ params }: PlayerDetailPageProps) => {
  const playerId = params.playerId;
  
  // 1. Konfigurasi TTL
  const TTL_MS = 15 * 60 * 1000; // 15 Menit default

  // 2. Ambil Profil (Fetch awal)
  // [FIX TS ERROR]: Gunakan const untuk fetch awal, cek null, baru assign ke let.
  const initialPlayer = await getPlayerProfile(playerId);

  if (!initialPlayer) {
    return notFound(); // return agar TS tahu eksekusi berhenti
  }

  // Assign ke variabel let yang tipenya PASTI UserProfile (tanpa null)
  let player = initialPlayer;

  // 3. Cek Status Data (TTL & Suspicious Data)
  const lastVerifiedTime = player.lastVerified
    ? new Date(
        (player.lastVerified as any).seconds * 1000 || player.lastVerified,
      ).getTime()
    : 0;

  const isStale = Date.now() - lastVerifiedTime > TTL_MS;

  // [SMART AUTO-FIX]: Deteksi data mencurigakan (Punya Clan Tag tapi Role Free Agent)
  const isSuspicious = player.clanTag && player.role === 'Free Agent';
  
  const shouldSync = player.isVerified && (isStale || isSuspicious);

  // 4. Logika Sinkronisasi (Self-Healing)
  if (shouldSync) {
    console.log(
      `[PlayerDetailPage] Sync Triggered for ${player.inGameName || player.uid}. Reason: ${
        isSuspicious ? 'SUSPICIOUS_DATA' : 'TTL_EXPIRED'
      }`
    );
    
    try {
      // 4a. Ambil Data CoC Live
      const encodedPlayerTag = encodeURIComponent(player.playerTag);
      const cocPlayerData: CocPlayer =
        await cocApi.getPlayerData(encodedPlayerTag);

      // 4b. Mapping Role
      const cocApiRole = cocPlayerData.clan
        ? (cocPlayerData.role?.toLowerCase() as ClanRole) || ClanRole.MEMBER
        : ClanRole.NOT_IN_CLAN;

      let clashubRole: UserProfile['role'] = mapCocRoleToClashubRole(cocApiRole);
      let managedClanId: string | null = player.clanId || null;
      let managedClanName: string | null = player.clanName || null;

      // 4c. Cek Relasi Clan
      if (cocPlayerData.clan) {
        // Cek Managed Clan via Admin SDK
        if (cocApiRole === ClanRole.LEADER || cocApiRole === ClanRole.CO_LEADER) {
           // Manager logic
           managedClanId = await createOrLinkManagedClan(
              cocPlayerData.clan.tag,
              cocPlayerData.clan.name,
              player.uid
           );
        } else {
           // Member logic: Cek apakah clan ada di DB
           const clanQuery = await adminFirestore
             .collection(COLLECTIONS.MANAGED_CLANS)
             .where('tag', '==', cocPlayerData.clan.tag)
             .limit(1)
             .get();
             
           if (!clanQuery.empty) {
             managedClanId = clanQuery.docs[0].id;
           } else {
             managedClanId = null;
           }
        }
        managedClanName = cocPlayerData.clan.name;
      } else {
        clashubRole = 'Free Agent';
        managedClanId = null;
        managedClanName = null;
      }

      // 4d. Siapkan Update Data
      const updateData: Partial<UserProfile> = {
        inGameName: cocPlayerData.name,
        thLevel: cocPlayerData.townHallLevel,
        trophies: cocPlayerData.trophies,
        lastVerified: new Date(), // Reset TTL
        clanTag: cocPlayerData.clan?.tag || null,
        clanRole: cocApiRole,
        role: clashubRole,
        clanId: managedClanId,
        clanName: managedClanName,
      };

      // 4e. Eksekusi Update ke Firestore
      // Bersihkan undefined/null values jika diperlukan (JSON trick)
      const cleanUpdate = JSON.parse(JSON.stringify(updateData));
      await adminFirestore.collection(COLLECTIONS.USERS).doc(player.uid).update(cleanUpdate);

      // Update variabel lokal agar UI menampilkan data baru
      player = { ...player, ...cleanUpdate };
      console.log(`[PlayerDetailPage] ✅ Auto-Healed data for ${player.inGameName}`);

    } catch (error) {
      console.error(
        `[PlayerDetailPage] Gagal auto-sync:`, error
      );
    }
  }

  // 5. Fetch Data Tambahan (Posts, History, Reviews) - Parallel
  let recentPosts: FirestoreDocument<Post>[] = [];
  let clanHistory: FirestoreDocument<DocumentData>[] = [];
  let playerReviews: FirestoreDocument<PlayerReview>[] = [];

  try {
    // Gunakan Admin SDK untuk performa & konsistensi
    const [postsData, historyData, reviewsData] = await Promise.all([
      getPostsByAuthorAdmin(player.uid, 3), 
      getClanHistoryAdmin(player.uid),
      getPlayerReviewsAdmin(player.uid),
    ]);

    recentPosts = postsData;
    clanHistory = historyData;
    playerReviews = reviewsData;
  } catch (e) {
    console.error(
      `[PlayerDetailPage] Error fetching details for ${player.uid}:`, e
    );
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