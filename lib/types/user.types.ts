// File: lib/types/user.types.ts
// Deskripsi: Mendefinisikan struktur data terkait Pengguna (User), Pemain (Player), dan Ulasan.
// [MODIFIKASI FASE 4.1]: Menambahkan field cache data lengkap ke UserProfile.

import { ClanRole, ManagerRole, StandardMemberRole } from '../enums';
// [BARU FASE 4.1] Impor tipe data cache dari file coc.types (yang ada di folder lib/)
import { CocPlayerItem, CocAchievement } from '../coc.types';

/**
 * @interface UserProfile
 * Data profil pengguna yang disimpan di /users/{uid}
 */
export interface UserProfile {
  uid: string; // ID unik dari Firebase Auth
  email: string | null;
  displayName: string;

  // --- DATA VERIFIKASI COCLANS (BARU: Sprint 4.1) ---
  isVerified: boolean; // TRUE jika pemain telah memverifikasi tag mereka
  playerTag: string; // Tag pemain dari dalam game (Disimpan di sini setelah verifikasi)
  inGameName?: string; // Nama pemain dari API CoC
  thLevel: number; // Level Town Hall (Diperbarui dari API atau input manual)
  trophies: number; // Field Trophy
  clanTag?: string | null; // Tag Klan CoC saat ini (diperbarui dari API)
  clanRole?: ClanRole; // MENGGUNAKAN ENUM CLANROLE
  lastVerified?: Date; // Timestamp verifikasi terakhir

  // --- [BARU FASE 4.1] DATA CACHE PLAYER LENGKAP ---
  // Data ini adalah cache dari endpoint /players/{playerTag}
  // untuk mengurangi panggilan API.
  cachedHeroes?: CocPlayerItem[];
  cachedTroops?: CocPlayerItem[];
  cachedSpells?: CocPlayerItem[];
  cachedAchievements?: CocAchievement[];
  lastCacheTimestamp?: Date; // Timestamp kapan cache ini diperbarui
  // --- [AKHIR BARU FASE 4.1] ---

  // --- FIELD E-SPORTS CV YANG SUDAH ADA ---
  avatarUrl?: string;
  discordId?: string | null;
  website?: string | null;
  bio?: string;
  // PERBAIKAN: Menggunakan union type baru yang sudah didefinisikan di atas
  role?: ManagerRole | StandardMemberRole;
  playStyle?:
    | 'Attacker Utama'
    | 'Base Builder'
    | 'Donatur'
    | 'Strategist'
    | null;
  activeHours?: string;
  reputation?: number;

  // --- PERUBAHAN (Langkah 1.1) ---
  // Mengganti 'teamId' dan 'teamName' menjadi 'clanId' dan 'clanName'
  // untuk merujuk ke ManagedClan internal.
  clanId?: string | null; // ID klan internal (ManagedClan) yang diikuti pemain
  clanName?: string | null; // Nama klan internal (ManagedClan) yang diikuti pemain

  // --- [BARU: TAHAP 2.1] ---
  popularityPoints?: number; // Poin "Banana" untuk gamifikasi
}

/**
 * @interface TopPerformerPlayer
// ... (Kode TopPerformerPlayer tidak berubah)
 */
export interface TopPerformerPlayer {
  tag: string;
  name: string;
  value: number | string; // Bisa angka (donasi, loot) atau string (status 'Promosi'/'Demosi')
  thLevel?: number; // Opsional: Level TH
  // PERBAIKAN: Menggunakan union type baru untuk role
  role?: ClanRole | ManagerRole | StandardMemberRole;
}

/**
 * @interface Player
// ... (Kode Player tidak berubah)
 */
export interface Player {
  id: string; // ID dokumen dari Firestore (sama dengan uid)
  name: string;
  tag: string;
  inGameName?: string;
  thLevel: number;
  reputation: number;
  // PERBAIKAN: Menggunakan union type baru untuk role
  role: ManagerRole | StandardMemberRole;
  avatarUrl?: string;
  displayName: string;
  playerTag: string; // Ini adalah playerTag CoC
}

/**
 * @interface JoinRequest
 * [PERBAIKAN] Menghapus underscore '_' dari 'requesterId'
 */
export interface JoinRequest {
  id: string;
  clanId: string; // ID klan internal (ManagedClan)
  clanName: string; // Nama klan internal (ManagedClan)
  requesterId: string; // <-- [FIX] Underscore dihapus
  requesterName: string;
  requesterThLevel: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

// --- [BARU: TAHAP 1.3] ---
/**
 * @interface Notification
// ... (Kode Notification tidak berubah)
 */
export interface Notification {
  id: string; // ID dokumen Firestore
  userId: string; // UID pengguna yang menerima notifikasi ini
  message: string; // Pesan yang akan ditampilkan (misal: "Lord Z menyetujui permintaan Anda...")
  type: 'review_request' | 'join_approved' | 'generic'; // Tipe notifikasi
  url: string; // URL tujuan saat notifikasi di-klik
  read: boolean; // Status sudah dibaca atau belum
  createdAt: Date; // Timestamp kapan notifikasi dibuat
}
// --- [AKHIR BARU] ---

// --- [BARU: Langkah 3.1 Peta Develop] ---
/**
 * @interface Reply
 * Struktur data untuk balasan di sub-koleksi 'posts/{postId}/replies'
 */
export interface Reply {
  id: string; // ID dokumen balasan (dari Firestore)
  content: string; // Isi komentar
  authorId: string; // UID dari UserProfile
  authorName: string; // Denormalisasi nama (dari UserProfile)
  authorAvatarUrl?: string; // Denormalisasi avatar (dari UserProfile)
  createdAt: Date; // [FIX] Diubah dari Timestamp ke Date (Netral)
}
// --- [AKHIR BARU] ---

// --- [BARU: TAHAP 2.2] ---
// =========================================================================
// 5. TIPE DATA ULASAN (REVIEW)
// =========================================================================

/**
 * @interface PlayerReview
// ... (Kode PlayerReview tidak berubah)
 */
export interface PlayerReview {
  id: string; // ID dokumen ulasan
  authorUid: string; // UID pemberi ulasan
  authorName: string; // Nama display pemberi ulasan
  targetPlayerUid: string; // UID pemain yang diulas

  // Konteks ulasan (Sesuai Roadmap)
  reviewContext: 'clan' | 'esports' | 'both';
  esportsTeamId?: string; // ID tim e-sports jika konteksnya 'esports' atau 'both'
  clanId?: string; // ID klan (ManagedClan) saat ulasan dibuat

  rating: number; // Peringkat (misal: 1-5 bintang)
  comment: string; // Teks ulasan
  createdAt: Date;
}
// --- [AKHIR BARU] ---

/**
 * @interface RoleChangeLog
// ... (Kode RoleChangeLog tidak berubah)
 */
export interface RoleChangeLog {
  playerTag: string; // Tag pemain (CoC)
  playerName: string; // Nama pemain
  memberUid: string; // UID pengguna Clashub
  oldRoleCoC: ClanRole; // Role CoC sebelum diubah
  newRoleCoC: ClanRole; // Role CoC setelah diubah
  changedByUid: string; // UID pengguna Clashub yang melakukan perubahan (Leader/Co-Leader)
  changedAt: Date; // Timestamp perubahan
}

// --- [BARU DITAMBAHKAN UNTUK MEMPERBAIKI ERROR HOOK] ---
/**
 * @interface JoinRequestWithProfile
// ... (Kode JoinRequestWithProfile tidak berubah)
 */
export interface JoinRequestWithProfile extends JoinRequest {
  requesterProfile: UserProfile;
}
// --- [AKHIR TAMBAHAN] ---