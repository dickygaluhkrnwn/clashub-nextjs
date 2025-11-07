// File: app/player/[playerId]/page.tsx
// Deskripsi: Menampilkan E-Sports CV pemain (UserProfile) - Server Component.

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
import {
  getUserProfile,
  getUserProfileByTag,
  getPostsByAuthor,
} from '@/lib/firestore';
// [EDIT] Impor fungsi Admin SDK untuk data TAHAP 4.2
import {
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
} from '@/lib/firestore-admin/users';

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

/**
 * @function getPlayerProfile
 * Logika utama untuk mengambil UserProfile berdasarkan UID atau Tag CoC.
 */
const getPlayerProfile = async (id: string): Promise<UserProfile | null> => {
  // 1. Coba sebagai UID
  let player: UserProfile | null = await getUserProfile(id);

  if (player) return player;

  // 2. Jika bukan UID, coba sebagai Tag CoC (setelah decode)
  const decodedId = decodeURIComponent(id).toUpperCase();

  if (isCocTag(decodedId)) {
    console.log(
      `[PlayerDetailPage] Attempting to find UserProfile by CoC Tag: ${decodedId}`,
    );
    player = await getUserProfileByTag(decodedId);
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

  // Mengambil data profil pengguna (E-Sports CV) menggunakan dual ID logic
  const player: UserProfile | null = await getPlayerProfile(playerId);

  if (!player) {
    notFound(); // Jika data tidak ada di Firestore, tampilkan halaman 404
  }

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

  // Render Client Component baru dengan data yang sudah di-fetch
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