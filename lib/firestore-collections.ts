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
}

