// File: lib/firestore-collections.ts
// Deskripsi: Mengekspor konstanta nama koleksi Firestore untuk konsistensi.

export const COLLECTIONS = {
  USERS: 'users',
  MANAGED_CLANS: 'managedClans', // Klan Internal yang Dikelola
  PUBLIC_CLAN_INDEX: 'publicClanIndex', // Cache Klan Publik
  JOIN_REQUESTS: 'joinRequests',
  POSTS: 'posts',
  TOURNAMENTS: 'tournaments',
  VIDEOS: 'videos', // <-- BARIS TAMBAHAN: Nama koleksi untuk video YouTube

  // --- PERBAIKAN DITAMBAHKAN DI SINI ---
  CLAN_API_CACHE: 'clanApiCache', // Sub-koleksi untuk cache data API

  // --- PENAMBAHAN BARU UNTUK ARSIP ---
  WAR_ARCHIVES: 'warArchives', // Sub-koleksi untuk arsip Perang Biasa
  CWL_ARCHIVES: 'cwlArchives', // Sub-koleksi untuk arsip CWL
  RAID_ARCHIVES: 'raidArchives', // Sub-koleksi untuk arsip Raid Capital

  // --- [BARU: TAHAP 1.3] ---
  NOTIFICATIONS: 'notifications', // Sub-koleksi di bawah 'users'

  // --- [BARU: TAHAP 2.2] ---
  CLAN_REVIEWS: 'clanReviews', // Koleksi Root untuk ulasan klan
  PLAYER_REVIEWS: 'playerReviews', // Koleksi Root untuk ulasan pemain
};