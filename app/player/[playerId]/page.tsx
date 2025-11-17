// File: app/player/[playerId]/page.tsx
// Deskripsi: Menampilkan E-Sports CV pemain (UserProfile) - Server Component.
// [UPDATE]: Menambahkan logika server-side Caching (TTL) untuk auto-sync data basi.

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
  CocPlayer, // <-- [TAMBAH] Impor tipe data CoC
  ClanRole, // <-- [TAMBAH] Impor tipe data CoC
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
import { getPostsByAuthor } from '@/lib/firestore'; // <-- [UBAH] Hanya impor getPostsByAuthor
// [EDIT] Impor fungsi Admin SDK untuk data TAHAP 4.2
import {
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
  getUserProfileAdmin, // <-- [UBAH] Impor getUserProfileAdmin
  getUserProfileByPlayerTagAdmin, // <-- [UBAH] Impor getUserProfileByPlayerTagAdmin
} from '@/lib/firestore-admin/users';
// [TAMBAH] Impor untuk logika TTL
import cocApi from '@/lib/coc-api';
import { adminFirestore } from '@/lib/firebase-admin';
import { getManagedClanByTag } from '@/lib/firestore'; // <-- [TAMBAH] Impor untuk cek ManagedClan
import { createOrLinkManagedClan } from '@/lib/firestore-admin'; // <-- [TAMBAH] Impor untuk link ManagedClan
import { ManagerRole, StandardMemberRole } from '@/lib/enums'; // <-- [TAMBAH] Impor Tipe Role

// Impor Client Component yang baru
import PlayerProfileClient from './PlayerProfileClient';

// Definisikan tipe untuk parameter rute dinamis
interface PlayerDetailPageProps {
  params: {
    playerId: string; // Bisa Firebase UID atau Encoded Player Tag CoC
  };
}

/**
 * Fungsi helper untuk mengecek apakah string terlihat seperti Tag CoC
 */
const isCocTag = (str: string): boolean => {
  // Tag CoC (setelah decode) dimulai dengan #
  return str.startsWith('#') && str.length >= 2;
};

// --- [BARU] Helper dari verify-player/route.ts ---
const mapCocRoleToClashubRole = (cocRole: ClanRole): UserProfile['role'] => {
  switch (cocRole) {
    case ClanRole.LEADER:
      return 'Leader';
    case ClanRole.CO_LEADER:
      return 'Co-Leader';
    case ClanRole.ELDER: // ClanRole.ELDER adalah 'admin'
      return 'Elder';
    case ClanRole.MEMBER:
      return 'Member';
    case ClanRole.NOT_IN_CLAN:
    default:
      return 'Free Agent';
  }
};
// --- [AKHIR BARU] ---

/**
 * @function getPlayerProfile
 * Logika utama untuk mengambil UserProfile berdasarkan UID atau Tag CoC.
 * [UBAH] Menggunakan fungsi Admin SDK
 */
const getPlayerProfile = async (
  id: string,
): Promise<FirestoreDocument<UserProfile> | null> => {
  // 1. Coba sebagai UID
  // [UBAH] Menggunakan Admin SDK
  let player: FirestoreDocument<UserProfile> | null =
    await getUserProfileAdmin(id);

  if (player) return player;

  // 2. Jika bukan UID, coba sebagai Tag CoC (setelah decode)
  const decodedId = decodeURIComponent(id).toUpperCase();

  if (isCocTag(decodedId)) {
    console.log(
      `[PlayerDetailPage] Attempting to find UserProfile by CoC Tag: ${decodedId}`,
    );
    // [UBAH] Menggunakan Admin SDK
    player = await getUserProfileByPlayerTagAdmin(decodedId);
    return player;
  }

  return null;
};

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({
  params,
}: PlayerDetailPageProps): Promise<Metadata> {
  const playerId = params.playerId;
  // [CATATAN] getPlayerProfile di sini mungkin mengambil data basi,
  // tapi itu tidak masalah untuk metadata (kecepatan lebih penting).
  const player = await getPlayerProfile(playerId);

  if (!player) {
    return { title: 'Pemain Tidak Ditemukan | Clashub' };
  }

  return {
    title: `Clashub | E-Sports CV: ${player.displayName}`,
    description: `Lihat E-Sports CV, Town Hall ${
      player.thLevel || 'N/A'
    }, dan reputasi komitmen ${player.reputation} ★ dari ${
      player.displayName
    }.`,
  };
}

/**
 * @component PlayerDetailPage (Server Component)
 * Menampilkan detail lengkap E-Sports CV pemain (Profil Publik).
 */
const PlayerDetailPage = async ({ params }: PlayerDetailPageProps) => {
  const playerId = params.playerId;

  // --- [LOGIKA TTL DIMULAI] ---
  // Tentukan TTL (Time-to-Live) di sini. Misal: 15 Menit.
  const TTL_MS = 15 * 60 * 1000;

  // 1. Mengambil data profil pengguna (E-Sports CV) menggunakan dual ID logic
  let player: FirestoreDocument<UserProfile> | null =
    await getPlayerProfile(playerId);

  if (!player) {
    notFound(); // Jika data tidak ada di Firestore, tampilkan halaman 404
  }

  // 2. Cek apakah data basi (stale)
  // lastVerified bisa jadi string atau Firestore Timestamp, konversi ke number
  const lastVerifiedTime = player.lastVerified
    ? new Date(
        (player.lastVerified as any).seconds * 1000 || player.lastVerified,
      ).getTime()
    : 0;

  const isStale = Date.now() - lastVerifiedTime > TTL_MS;

  // 3. Jika Basi DAN terverifikasi, picu sinkronisasi
  if (player.isVerified && isStale) {
    console.log(
      `[PlayerDetailPage] Data untuk ${player.playerTag} basi. Memicu auto-sync...`,
    );
    try {
      // 3a. Ambil data CoC Live
      const encodedPlayerTag = encodeURIComponent(player.playerTag);
      const cocPlayerData: CocPlayer =
        await cocApi.getPlayerData(encodedPlayerTag);
      console.log(`[PlayerDetailPage] Sync sukses: Data ${cocPlayerData.name} diambil.`);

      // 3b. Mapping data (logika sama persis dari verify-player/route.ts)
      const cocApiRole = cocPlayerData.clan
        ? (cocPlayerData.role?.toLowerCase() as ClanRole) || ClanRole.MEMBER
        : ClanRole.NOT_IN_CLAN;

      let clashubRole: UserProfile['role'] = mapCocRoleToClashubRole(cocApiRole);
      let managedClanId: string | null = player.clanId || null; // Pertahankan clanId lama by default
      let managedClanName: string | null = player.clanName || null; // Pertahankan clanName lama

      if (cocPlayerData.clan) {
        // Jika klan berubah, cek klan baru
        if (player.clanTag !== cocPlayerData.clan.tag) {
          // Logika auto-link/auto-sync saat verifikasi
          if (
            cocApiRole === ClanRole.LEADER ||
            cocApiRole === ClanRole.CO_LEADER
          ) {
            managedClanId = await createOrLinkManagedClan(
              cocPlayerData.clan.tag,
              cocPlayerData.clan.name,
              player.uid,
            );
          } else {
            const managedClan = await getManagedClanByTag(cocPlayerData.clan.tag);
            if (managedClan) {
              managedClanId = managedClan.id;
            } else {
              managedClanId = null; // Klan baru tidak dikelola
            }
          }
          managedClanName = cocPlayerData.clan.name;
        }
      } else {
        // Jika tidak punya klan, set role Free Agent dan hapus clanId
        clashubRole = 'Free Agent';
        managedClanId = null;
        managedClanName = null;
      }

      // 3c. Siapkan data update
      const updateData: Partial<UserProfile> = {
        inGameName: cocPlayerData.name,
        thLevel: cocPlayerData.townHallLevel,
        trophies: cocPlayerData.trophies,
        lastVerified: new Date(), // <-- TIMESTAMP DIPERBARUI
        clanTag: cocPlayerData.clan?.tag || null,
        clanRole: cocApiRole,
        role: clashubRole,
        clanId: managedClanId,
        clanName: managedClanName,
      };

      // 3d. Update Firestore (Admin SDK)
      const userRef = adminFirestore.doc(`users/${player.uid}`);
      await userRef.set(updateData, { merge: true });

      // 3e. Perbarui variabel 'player' LOKAL dengan data fresh
      player = { ...player, ...updateData };
    } catch (error) {
      console.error(
        `[PlayerDetailPage] Gagal auto-sync untuk ${player.playerTag}:`,
        error,
      );
      // Jika gagal, biarkan. Halaman akan tetap render data basi (lebih baik daripada error 500)
    }
  }
  // --- [LOGIKA TTL SELESAI] ---

  // --- Mengambil semua data tambahan (posts, history, reviews) ---
  let recentPosts: FirestoreDocument<Post>[] = [];
  let clanHistory: FirestoreDocument<DocumentData>[] = [];
  let playerReviews: FirestoreDocument<PlayerReview>[] = [];

  try {
    // Ambil semua data secara paralel menggunakan UID pemain
    const [postsData, historyData, reviewsData] = await Promise.all([
      getPostsByAuthor(player.uid, 3), // (Postingan)
      getClanHistoryAdmin(player.uid), // (Riwayat Klan) [FIX]
      getPlayerReviewsAdmin(player.uid), // (Ulasan) [FIX]
    ]);

    recentPosts = postsData;
    clanHistory = historyData;
    playerReviews = reviewsData;
  } catch (e) {
    console.error(
      `[PlayerDetailPage] Gagal fetch detail (posts, history, reviews) untuk UID: ${player.uid}:`,
      e,
    );
    // Biarkan array kosong jika gagal, halaman tetap bisa render
  }
  // ----------------------------------------------------------------------

  // Render Client Component baru dengan data yang sudah di-fetch (fresh atau dari cache)
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