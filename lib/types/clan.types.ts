// File: lib/types/clan.types.ts
// Deskripsi: Mendefinisikan struktur data terkait Klan (ManagedClan),
// Cache API, Tim Esports, Promosi, dan Ulasan Klan.
// Bagian dari Refactor Fase 0.

import {
  CocCurrentWar,
  CocIconUrls,
  CocMember,
  CocRaidLog,
} from '../coc.types';
import { TopPerformerPlayer } from './user.types';

// [BARU: FASE 1.2] Tipe data untuk link sosial media yang fleksibel
// Sesuai konfirmasi untuk Langkah 1.1
export interface ClanSocialLink {
  platform: string; // Misal: "Discord", "Website", "Twitter", "YouTube"
  url: string;
}

/**
 * @type FirestoreDocument
 * Helper Type untuk menambahkan ID ke tipe data saat membaca dari Firestore
 * [REFACFOR FASE 0] Dipindah dari clashub.types.ts
 */
export type FirestoreDocument<T> = T & { id: string };

// [ROMBAK V2 - FASE 1]
/**
 * @interface Promotion
 * Struktur data untuk banner promosi dinamis di /clan-hub
 * Disimpan di sub-koleksi: managedClans/{clanId}/promotions/{promotionId}
 */
export interface Promotion {
  id: string; // ID unik dokumen promosi
  clanId: string; // ID ManagedClan (induk)
  imageUrl: string; // Link Imgur ke gambar banner
  title: string; // Judul singkat (untuk manajemen)
  description: string; // Deskripsi singkat (untuk manajemen)

  // [EDIT V3 - TUGAS 2.1] Mengubah 'clicks' menjadi 'totalClicks' dan menambah 'clicksByTH'
  totalClicks: number; // Total statistik klik
  clicksByTH: { [key: string]: number }; // Statistik klik per TH (misal: {"16": 10, "15": 5})
}

/**
 * @interface ManagedClan
 */
export interface ManagedClan {
  id: string; // ID dokumen internal kita (BUKAN clanTag)
  name: string; // Nama klan CoC (nama dari API)
  tag: string; // Clan Tag CoC yang unik
  ownerUid: string; // UID pengguna yang memiliki / mengelola klan ini (Leader/Co-Leader)

  // --- DATA CLASHUB INTERNAL (Diadaptasi dari Team) ---
  logoUrl?: string; // Logo klan dari API
  vision: 'Kompetitif' | 'Kasual'; // Visi Tim (Custom Clashub)

  // [FASE 1.2] Field 'website' dan 'discordId' diganti dengan 'socialLinks' yang lebih fleksibel
  // website?: string; // <-- DIGANTI
  // discordId?: string; // <-- DIGANTI
  socialLinks?: ClanSocialLink[]; // [BARU: FASE 1.2] Sesuai idemu
  
  recruitingStatus: 'Open' | 'Invite Only' | 'Closed'; // Status rekrutmen (Custom Clashub) - Nanti diedit dari form profil

  // --- [BARU: FASE 1.2] Data Profil Internal Dinamis ---
  profileDescription?: string; // Teks "Tentang Kami" untuk halaman profil internal
  clanRules?: string; // Teks "Aturan Klan" untuk halaman profil internal

  // --- DATA CACHE & METADATA ---
  lastSynced: Date; // Timestamp sinkronisasi API terakhir
  avgTh: number; // Rata-rata Level TH anggota (dikalkulasi)
  clanLevel: number; // Level Klan CoC (dari API)
  memberCount: number; // Jumlah anggota (dari API)

  // --- [BARU: TAHAP 1.3 - Roadmap] ---
  // Snapshot dari daftar anggota, digunakan untuk deteksi join/leave
  memberList: { tag: string; name: string }[];
}

/**
 * @interface ClanApiCache
 */
export interface ClanApiCache {
  id: 'current'; // ID dokumen tunggal
  lastUpdated: Date;

  currentWar?: CocCurrentWar | null; // Referensi tipe dari file baru
  currentRaid?: CocRaidLog | null; // Referensi tipe dari file baru
  // Daftar anggota yang diperbarui dari API Coc, termasuk Partisipasi
  members: Array<
    CocMember & {
      // Properti Partisipasi yang dikalkulasi dari Aggregators.js (Blueprint CSV)
      cwlSuccessCount: number;
      warSuccessCount: number;
      cwlFailCount: number;
      warFailCount: number;
      participationStatus:
        | 'Promosi'
        | 'Demosi'
        | 'Aman'
        | 'Leader/Co-Leader'; // dari blueprint CSV
      lastRoleChangeDate: Date; // Kunci untuk reset partisipasi (dari Log Perubahan Role CSV)
      // Keterangan status untuk UI (BARU ditambahkan di participationAggregator)
      statusKeterangan?: string;
    }
  >;
  // --- DATA AGREGAT BARU: Top Performers (Dimasukkan ke sini) ---
  topPerformers?: {
    promotions: TopPerformerPlayer[]; // Pemain yang status partisipasinya 'Promosi'
    demotions: TopPerformerPlayer[]; // Pemain yang status partisipasinya 'Demosi'
    topRaidLooter: TopPerformerPlayer | null; // Pemain dengan capitalResourcesLooted tertinggi di raid terakhir
    topDonator: TopPerformerPlayer | null; // Pemain dengan donasi tertinggi (dari CocMember)
  };
}

/**
 * @interface PublicClanIndex
 */
export interface PublicClanIndex {
  tag: string; // ID dokumen (clanTag)
  name: string;
  clanLevel: number;
  memberCount: number;
  clanPoints: number;
  clanCapitalPoints: number; // [PERBAIKAN] Menambahkan field yang hilang
  clanVersusPoints: number; // Menambahkan field untuk kelengkapan
  badgeUrls: CocIconUrls; // Referensi tipe dari file baru
  lastUpdated: Date; // Untuk memeriksa apakah cache masih 'fresh'

  // --- FIELD TAMBAHAN DARI CocClan UNTUK TAMPILAN PROFIL PUBLIK ---
  requiredTrophies?: number;
  warFrequency?: string;
  warWinStreak?: number;
  warWins?: number;
  type?: 'open' | 'inviteOnly' | 'closed';
  description?: string;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode?: string;
  };
  warLeague?: {
    id: number;
    name: string;
  };
}

/**
 * @interface Team
 */
export interface Team {
  id: string; // ID dokumen dari Firestore
  name: string;
  tag: string; // Tag klan
  rating: number; // Reputasi Tim
  vision: 'Kompetitif' | 'Kasual'; // Visi Tim
  avgTh: number; // Rata-rata Level TH anggota
  logoUrl?: string;
  captainId: string;
  website?: string;
  discordId?: string;
  recruitingStatus: 'Open' | 'Invite Only' | 'Closed';
}

/**
 * @interface ClanReview
 */
export interface ClanReview {
  id: string; // ID dokumen ulasan
  authorUid: string; // UID pemberi ulasan
  authorName: string; // Nama display pemberi ulasan
  targetClanId: string; // ID ManagedClan yang diulas
  rating: number; // Peringkat (misal: 1-5 bintang)
  comment: string; // Teks ulasan
  createdAt: Date;
}

/**
 * @interface EsportsTeam
 */
export interface EsportsTeam {
  id: string; // ID dokumen tim e-sports (di-generate oleh Firestore)
  teamName: string; // Nama tim (misal: "Tim A", "Elit War")
  teamLeaderUid: string; // UID (dari UserProfile) pemimpin tim
  clanId: string; // ID ManagedClan (induk)

  // Daftar UID (dari UserProfile) anggota. Tepat 5.
  memberUids: [string, string, string, string, string];
}

/**
 * @interface ManagedClanDataPayload
 * Tipe data gabungan yang dikirim oleh API route /cache.
 */
export interface ManagedClanDataPayload {
  clan: FirestoreDocument<ManagedClan>; // Data induk (untuk badgeUrl, name, dll)
  cache: ClanApiCache | null; // Data cache (untuk members, currentWar, dll)
}

/**
 * [BARU] Tipe data untuk rekomendasi tim di Halaman Utama.
 */
export type RecommendedTeam = FirestoreDocument<ManagedClan> & {
  averageRating: number;
};