import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth'; // Utilitas Auth Sisi Server

// [EDIT TAHAP 4.2] Mengganti impor ke versi Admin SDK
import {
  getUserProfileAdmin,
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
} from '@/lib/firestore-admin/users';
import { getPostsByAuthorAdmin } from '@/lib/firestore-admin/posts';

// [PERBAIKAN AUTO-FIX] Import Admin Firestore untuk Auto-Fix Database
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

import cocApi from '@/lib/coc-api'; // Objek yang berisi method API CoC
import ProfileClient from './ProfileClient'; // Client Component (untuk interaktivitas)

// [EDIT TAHAP 4.2] Menambahkan tipe baru
import {
  UserProfile,
  ClanRole,
  Post,
  CocPlayer,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase-admin/firestore'; // Diperlukan untuk tipe clanHistory

// Metadata untuk SEO
export const metadata: Metadata = {
  title: 'Clashub | E-Sports CV Anda',
  description: 'Lihat dan kelola E-Sports CV Clash of Clans Anda.',
};

// --- Tambahkan baris ini untuk memaksa render dinamis ---
export const dynamic = 'force-dynamic';
// --- Akhir tambahan ---

// --- Fungsi Helper untuk Map Role CoC API ke Enum ClanRole ---
const mapCocRoleToClanRole = (cocRole?: string): ClanRole => {
  switch (cocRole?.toLowerCase()) {
    case 'leader':
      return ClanRole.LEADER;
    case 'coleader':
      return ClanRole.CO_LEADER;
    case 'admin':
      return ClanRole.ELDER; // CoC API uses 'admin' for Elder
    case 'member':
      return ClanRole.MEMBER;
    default:
      return ClanRole.NOT_IN_CLAN;
  }
};

// [HELPER BARU] Map untuk role sistem Clashub
const mapCocRoleToClashubRole = (cocRole?: string): UserProfile['role'] => {
  const roleStr = cocRole?.toLowerCase();
  if (roleStr === 'leader') return 'Leader';
  if (roleStr === 'coleader') return 'Co-Leader';
  if (roleStr === 'admin') return 'Elder';
  if (roleStr === 'member') return 'Member';
  return 'Free Agent';
};

// Mengubah komponen menjadi fungsi async: Server Component
const ProfilePage = async () => {
  let profileData: UserProfile | null = null;
  let serverError: string | null = null;
  // [EDIT TAHAP 4.2] Inisialisasi data baru
  let recentPosts: FirestoreDocument<Post>[] = [];
  let clanHistory: FirestoreDocument<DocumentData>[] = [];
  let playerReviews: FirestoreDocument<PlayerReview>[] = [];

  // 1. Dapatkan status pengguna dari Sisi Server
  const sessionUser = await getSessionUser();

  // 2. Route Protection (Server-Side Redirect)
  // [PERBAIKAN] Kita komentari redirect ini.
  // Biarkan Client Component (ProfileClient) menangani loading/redirect
  // berdasarkan state dari useAuth() di sisi client.
  // Ini mencegah redirect loop jika session cookie server-side belum sinkron
  // dengan auth state client-side.
  /*
  if (!sessionUser) {
      // Jika tidak ada sesi, alihkan pengguna ke halaman login
      redirect('/auth');
  }
  */

  // 3. Ambil data profil dari Firestore menggunakan UID
  try {
    // [PERBAIKAN] Hanya coba ambil data jika sessionUser ADA
    if (sessionUser) {
      // [EDIT TAHAP 4.2] Menggunakan getUserProfileAdmin
      profileData = await getUserProfileAdmin(sessionUser.uid);

      if (!profileData) {
        // KASUS PROFIL BARU: Profil belum ada di Firestore
        serverError =
          'Profil E-Sports CV Anda belum ditemukan. Silakan lengkapi data Anda di halaman Edit Profil.';

        // Inisialisasi data minimal
        profileData = {
          uid: sessionUser.uid,
          email: sessionUser.email || null,
          displayName:
            sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
          isVerified: false,
          playerTag: '',
          inGameName: undefined,
          thLevel: 9,
          trophies: 0,
          clanTag: null,
          clanRole: ClanRole.NOT_IN_CLAN,
          lastVerified: undefined,
          role: 'Free Agent',
          playStyle: undefined,
          activeHours: '',
          reputation: 5.0,
          avatarUrl: '/images/placeholder-avatar.png',
          discordId: null,
          website: null,
          bio: '',
          // FIX: Ganti teamId/teamName menjadi clanId/clanName
          clanId: null,
          clanName: null,
        } as UserProfile; // Casting untuk memastikan tipe lengkap
      } else {
        // KASUS PROFIL DITEMUKAN:
        serverError = null; // Pastikan error direset

        // --- Ambil data live jika terverifikasi ---
        if (profileData.isVerified && profileData.playerTag) {
          try {
            // --- PERBAIKAN: Encode playerTag sebelum memanggil API ---
            const encodedPlayerTag = encodeURIComponent(profileData.playerTag);
            console.log(
              `[ProfilePage] Fetching live CoC data for encoded tag: ${encodedPlayerTag}`,
            );
            const livePlayerData: CocPlayer | null =
              await cocApi.getPlayerData(encodedPlayerTag); // Gunakan tag yang sudah di-encode

            if (livePlayerData) {
              console.log(`[ProfilePage] Live data found.`);

              // =================================================================
              // [FITUR AUTO-FIX]: Self-Healing Database Logic
              // =================================================================
              // Cek apakah data di database (Ghost Data) berbeda dengan Live Data.
              // Jika berbeda, kita perbaiki Database-nya SEKARANG JUGA.

              let fixedClanId = profileData.clanId;
              let fixedClanName = profileData.clanName;
              let shouldUpdateDb = false;
              const liveClanTag = livePlayerData.clan?.tag;

              // 1. Cek Konsistensi Clan
              // Jika live ada clan, tapi di DB tidak ada clanId atau clanTag beda
              if (liveClanTag && (profileData.clanTag !== liveClanTag || !profileData.clanId)) {
                  console.log(`[ProfilePage] Mismatch Clan detected! Searching managed clan for ${liveClanTag}...`);
                  
                  // Cari apakah clan ini terdaftar di sistem kita
                  const clanQuery = await adminFirestore
                      .collection(COLLECTIONS.MANAGED_CLANS)
                      .where('tag', '==', liveClanTag)
                      .limit(1)
                      .get();

                  if (!clanQuery.empty) {
                      const foundClan = clanQuery.docs[0];
                      fixedClanId = foundClan.id;
                      fixedClanName = foundClan.data().name;
                      console.log(`[ProfilePage] Found managed clan: ${fixedClanId}. Scheduling DB fix.`);
                      shouldUpdateDb = true;
                  }
              }

              // 2. Cek Konsistensi Role
              const correctClashubRole = mapCocRoleToClashubRole(livePlayerData.role);
              if (profileData.role !== correctClashubRole) {
                  console.log(`[ProfilePage] Role mismatch! DB: ${profileData.role} vs Live: ${correctClashubRole}. Scheduling DB fix.`);
                  shouldUpdateDb = true;
              }

              // 3. Eksekusi Perbaikan ke Database (Admin SDK)
              if (shouldUpdateDb) {
                  try {
                      const updatePayload = {
                          inGameName: livePlayerData.name,
                          thLevel: livePlayerData.townHallLevel,
                          trophies: livePlayerData.trophies,
                          clanTag: liveClanTag || null,
                          clanRole: livePlayerData.role || ClanRole.NOT_IN_CLAN,
                          role: correctClashubRole,
                          clanId: fixedClanId, // Update Clan ID yang benar
                          clanName: fixedClanName || livePlayerData.clan?.name || null,
                          lastVerified: new Date() // Update timestamp agar cache refresh
                      };
                      
                      // Tulis ke Database
                      await adminFirestore.collection(COLLECTIONS.USERS).doc(sessionUser.uid).update(updatePayload);
                      console.log(`[ProfilePage] ✅ Database AUTO-FIXED for user ${sessionUser.uid}`);
                  } catch (fixError) {
                      console.error(`[ProfilePage] ❌ Failed to Auto-Fix database:`, fixError);
                  }
              }
              // =================================================================
              // [AKHIR FITUR AUTO-FIX]
              // =================================================================

              // Timpa data Firestore (profileData) dengan data live untuk tampilan UI sekarang
              // Kita gunakan data 'fixed' jika tadi ada perbaikan
              profileData = {
                ...profileData,
                inGameName: livePlayerData.name,
                thLevel: livePlayerData.townHallLevel,
                trophies: livePlayerData.trophies,
                clanTag: livePlayerData.clan?.tag || null,
                // FIX: Ganti teamName menjadi clanName
                clanName: livePlayerData.clan
                  ? fixedClanName // Gunakan nama dari Managed Clan jika ada
                    ? fixedClanName 
                    : livePlayerData.clan.name
                  : null,
                clanRole: mapCocRoleToClanRole(livePlayerData.role),
                role: shouldUpdateDb ? mapCocRoleToClashubRole(livePlayerData.role) : profileData.role, // Tampilkan role yang benar
                clanId: fixedClanId, // Gunakan ID yang benar
              };
            } else {
              console.warn(
                `[ProfilePage] Live CoC data not found for tag: ${profileData.playerTag}. Using Firestore data.`,
              );
            }
          } catch (cocErr) {
            console.error(
              `[ProfilePage] Error fetching live CoC data for tag ${profileData.playerTag}:`,
              cocErr,
            );
          }
        }
      }

      // Ambil postingan, riwayat, dan ulasan (setelah profileData dipastikan ada)
      // [PERBAIKAN] Pindahkan ini ke dalam 'if (sessionUser)'
      if (profileData?.uid) {
        // [EDIT TAHAP 4.2] Fetch data baru secara paralel
        try {
          const [postsData, historyData, reviewsData] = await Promise.all([
            getPostsByAuthorAdmin(profileData.uid, 3), // Menggunakan versi Admin
            getClanHistoryAdmin(profileData.uid),
            getPlayerReviewsAdmin(profileData.uid),
            // Catatan: getClanReviewsAdmin() akan dilewati (sesuai roadmap)
            // karena tidak ada di file lib/firestore-admin/users.ts Anda.
          ]);

          recentPosts = postsData;
          clanHistory = historyData;
          playerReviews = reviewsData;
        } catch (dataErr) {
          // Log error jika index belum dibuat, tapi jangan blokir render halaman
          console.error(
            'Server Error: Failed to load recent posts, history, or reviews (Firestore Index might be missing):',
            dataErr,
          );
          // Biarkan array kosong jika gagal
        }
      }
    } else {
      // Jika tidak ada sessionUser, kirim null ke client
      profileData = null;
      // Kita tidak set serverError di sini, biarkan client component
      // (ProfileClient via useAuth) yang menangani redirect ke /auth
    }
  } catch (err) {
    // KASUS KONEKSI ERROR
    console.error('Server Error: Failed to load user profile:', err);
    profileData = null;
    serverError = 'Gagal memuat data profil dari Firestore. Coba lagi.';
  }

  // 4. Meneruskan data ke Client Component
  // [EDIT TAHAP 4.2] Menambahkan props baru dan memastikan SEMUA data diserialisasi
  // untuk menghindari error Next.js (Server Component -> Client Component)
  return (
    <ProfileClient
      initialProfile={
        profileData ? JSON.parse(JSON.stringify(profileData)) : null
      }
      serverError={serverError}
      recentPosts={JSON.parse(JSON.stringify(recentPosts))}
      clanHistory={JSON.parse(JSON.stringify(clanHistory))}
      playerReviews={JSON.parse(JSON.stringify(playerReviews))}
    />
  );
};

export default ProfilePage;