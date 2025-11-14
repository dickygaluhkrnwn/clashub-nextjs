// File: lib/clashub.types.ts
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang digunakan secara internal oleh aplikasi Clashub (Data Firestore).
// [UPDATE FASE 16.1] Mengekspor CocCurrentWar.

// =========================================================================
// 0. ENUMERASI DAN TIPE BANTUAN INTERNAL
// =========================================================================

/**
 * @type FirestoreDocument
 * Helper Type untuk menambahkan ID ke tipe data saat membaca dari Firestore
 */
export type FirestoreDocument<T> = T & { id: string };

// PERBAIKAN: Impor tipe Enum/Bantuan dari file 'enums.ts'
import {
  ClanRole,
  ManagerRole,
  StandardMemberRole,
  WarResult, // <-- Tipe ini mungkin perlu diubah di enums.ts, tapi kita atasi di sini
  PostCategory,
} from './enums';
// PERBAIKAN: Impor tipe CoC dari file 'coc.types.ts'
// --- [PERBAIKAN ERROR V6] ---
// Impor CocCurrentWar, bukan hanya CocWarLog
import {
  CocWarLog,
  CocRaidLog,
  CocMember,
  CocIconUrls,
  CocRaidMember,
  CocRaidAttackLogEntry,
  CocRaidDefenseLogEntry,
  CocCurrentWar,
  CocWarLogEntry, // <-- [PERBAIKAN] Menambahkan CocWarLogEntry
} from './coc.types';
// --- [AKHIR PERBAIKAN ERROR V6] ---

// [BARU FASE 16.1] Ekspor tipe yang diimpor agar bisa digunakan file lain
export type { CocCurrentWar } from './coc.types';

// [ROMBAK V2: Fase 1] Impor DocumentReference untuk Fase 1 Peta Develop
// [PERBAIKAN ERROR TIPE] Mengganti impor dari 'firebase/firestore' (client) ke 'firebase-admin/firestore' (admin)
// agar tipe data konsisten antara definisi (file ini) dan implementasi (API routes).
import { DocumentReference } from 'firebase-admin/firestore';

// =========================================================================
// 1. TIPE DATA FIRESTORE CLASHUB (INTERNAL)
// =========================================================================

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
 * @interface ManagedClan
// ... (Kode ManagedClan tidak berubah)
 */
export interface ManagedClan {
  id: string; // ID dokumen internal kita (BUKAN clanTag)
  name: string; // Nama klan CoC (nama dari API)
  tag: string; // Clan Tag CoC yang unik
  ownerUid: string; // UID pengguna yang memiliki / mengelola klan ini (Leader/Co-Leader)

  // --- DATA CLASHUB INTERNAL (Diadaptasi dari Team) ---
  logoUrl?: string; // Logo klan dari API
  vision: 'Kompetitif' | 'Kasual'; // Visi Tim (Custom Clashub)
  website?: string;
  discordId?: string;
  recruitingStatus: 'Open' | 'Invite Only' | 'Closed'; // Status rekrutmen (Custom Clashub)

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
// ... (Kode ClanApiCache tidak berubah)
 */
export interface ClanApiCache {
  id: 'current'; // ID dokumen tunggal
  lastUpdated: Date;

  // --- [PERBAIKAN ERROR V6] ---
  // Mengganti tipe CocWarLog dengan CocCurrentWar agar cocok
  // dengan tipe data yang digunakan di route.ts
  currentWar?: CocCurrentWar | null; // Referensi tipe dari file baru
  // --- [AKHIR PERBAIKAN ERROR V6] ---

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
// ... (Kode PublicClanIndex tidak berubah)
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
// ... (Kode Team tidak berubah)
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
 * @interface Tournament
 * [ROMBAK V2: Fase 1 Peta Develop]
 * [UPDATE FASE 15.1] Menambahkan field klan panitia.
 */
export interface Tournament {
  id: string; // ID dokumen Firestore

  // Info Utama
  title: string;
  description: string;
  rules: string; // Deskripsi panjang/rules
  bannerUrl: string; // URL ke Firebase Storage
  prizePool: string;

  // Status & Waktu
  status:
    | 'draft'
    | 'scheduled' // [Fase 7.1] Ditambahkan: Siap, tapi pendaftaran belum dibuka
    | 'registration_open'
    | 'registration_closed'
    | 'ongoing'
    | 'completed'
    | 'cancelled'; // [Fase 7.1] Ditambahkan: Dibatalkan oleh panitia

  // [Fase 7.1] Rombak field waktu
  // startsAt: Date; // [Fase 7.1] Dihapus
  // endsAt: Date; // [Fase 7.1] Dihapus
  registrationStartsAt: Date; // [Fase 7.1] Baru: Kapan pendaftaran mulai dibuka
  registrationEndsAt: Date; // [Fase 7.1] Baru: Kapan pendaftaran ditutup
  tournamentStartsAt: Date; // [Fase 7.1] Baru: Kapan pertandingan pertama dimulai
  tournamentEndsAt: Date; // [Fase 7.1] Baru: Target tanggal selesai turnamen

  // Info Organizer
  organizerUid: string; // UID dari UserProfile pembuat
  organizerName: string; // Nama display pembuat
  committeeUids: string[]; // Array UID panitia tambahan

  // Aturan Turnamen
  format: '1v1' | '5v5';
  teamSize: 1 | 5; // Otomatis diset berdasarkan format
  participantCount: number; // Jumlah tim (misal: 16, 32)
  thRequirement: ThRequirement; // Objek aturan TH baru

  // [BARU FASE 15.1] Info Klan War Panitia (Sesuai ide baru Anda)
  panitiaClanA_Tag: string | null;
  panitiaClanB_Tag: string | null;

  // Metadata
  participantCountCurrent: number; // Denormalisasi jumlah peserta (tim) yang sudah 'approved'
  createdAt: Date; // [FIX] Diubah dari Timestamp ke Date (Netral) dan HANYA SATU
}

/**
 * @interface ThRequirement
 * [BARU: Fase 1 Peta Develop]
 * Mendefinisikan aturan TH untuk pendaftaran turnamen.
 */
export interface ThRequirement {
  type: 'any' | 'uniform' | 'mixed';
  minLevel: number; // TH minimum (TH1)
  maxLevel: number; // TH maksimum (TH17)
  allowedLevels: number[]; // Untuk tipe 'mixed' (misal: [17, 16, 15, 14, 13])
}

/**
 * @interface TournamentTeam
 * [ROMBAK V2: Fase 1 Peta Develop]
 * Menggantikan TournamentParticipant. Ini adalah satu tim.
 */
export interface TournamentTeam {
  id: string; // ID Dokumen (dibuat saat registrasi)
  teamName: string;
  leaderUid: string; // UID user yang mendaftarkan
  originClanTag: string; // Clan tag asal pendaftar
  originClanBadgeUrl: string; // Badge clan asal
  members: TournamentTeamMember[]; // Array berisi 1 atau 5 player
  status: 'pending' | 'approved' | 'rejected' | 'checked_in';
  registeredAt: Date; // [FIX] Diubah dari Timestamp ke Date (Netral)
}

/**
 * @interface TournamentTeamMember
 * [BARU: Fase 1 Peta Develop]
 * Mendefinisikan data player di dalam sebuah TournamentTeam.
 */
export interface TournamentTeamMember {
  playerTag: string;
  playerName: string;
  townHallLevel: number;
}

/**
 * @interface TournamentMatch
 * [BARU: Fase 1 Peta Develop]
 * [UPDATE FASE 15.1] Menambahkan field penugasan klan.
 */
export interface TournamentMatch {
  matchId: string;
  round: number; // Ronde ke-1, 2, ...
  bracket: 'upper' | 'lower';
  status: 'pending' | 'scheduled' | 'live' | 'completed' | 'reported';

  // Referensi ke dokumen tim di sub-koleksi 'teams'
  team1Ref: DocumentReference<TournamentTeam> | null;
  team2Ref: DocumentReference<TournamentTeam> | null;

  // Data clan tanding (diisi saat check-in Fase 6)
  team1ClanTag: string | null;
  team2ClanTag: string | null;
  team1ClanBadge: string | null;
  team2ClanBadge: string | null;

  // [BARU FASE 15.1] Penugasan Klan Panitia & Info War (Sesuai ide baru Anda)
  team1AssignedClanTag: string | null; // Tag Klan Panitia (A atau B)
  team2AssignedClanTag: string | null; // Tag Klan Panitia (A atau B)
  team1WarTag: string | null; // War Tag spesifik (jika 5v5, bisa beda)
  team2WarTag: string | null; // War Tag spesifik (jika 5v5, bisa beda)

  // Hasil
  winnerTeamRef: DocumentReference<TournamentTeam> | null;

  // Info Jadwal & War
  scheduledTime: Date | null; // [FIX] Diubah dari Timestamp ke Date (Netral)
  liveWarData: object | null; // Cache dari API CocCurrentWar
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

// =========================================================================
// 3. TIPE DATA KNOWLEDGE HUB (POST & VIDEO)
// =========================================================================

// ... (Kode Post dan Video tidak berubah)

/**
 * @interface Post
 */
export interface Post {
  id: string;
  title: string;
  content: string; // Isi lengkap postingan
  category: PostCategory;
  tags: string[]; // Contoh: ['TH16', 'Hybrid', 'CWL']
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: Date;
  updatedAt?: Date;

  // --- [PERUBAHAN: Langkah 3.1 Peta Develop] ---
  // Diubah dari 'likes: number' (counter) menjadi 'likes: string[]' (array of UIDs)
  // Ini memungkinkan kita melacak *siapa* yang me-like dan menghitung totalnya.
  likes: string[];
  // --- [AKHIR PERUBAHAN] ---

  replies: number; // Ini adalah counter denormalisasi, kita biarkan untuk tampilan daftar
  troopLink?: string | null; // URL untuk menyalin kombinasi pasukan (coc://)
  videoUrl?: string | null; // URL video YouTube tutorial serangan
  baseImageUrl?: string | null;
  baseLinkUrl?: string | null;
  imageUrl?: string | null;
}

/**
 * @interface Video
 */
export interface Video {
  id: string; // ID dokumen Firestore (unik, bisa di-generate otomatis)
  videoId: string; // ID unik video dari YouTube (digunakan sebagai primary key logis)
  title: string; // Judul video
  description?: string; // Deskripsi singkat video (opsional)
  thumbnailUrl: string; // URL thumbnail kualitas tinggi
  publishedAt: Date; // Tanggal video dipublikasikan (sebagai objek Date)
  channelTitle: string; // Nama channel YouTube (misal: "Clash of Clans")
  channelId: string; // ID channel YouTube

  // PERBAIKAN (Sesuai keputusan):
  // Kategori video sekarang menggunakan tipe PostCategory dan akan disetel ke 'Berita Komunitas'
  category: PostCategory;

  source: 'YouTube'; // Sumber video
}

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

// =========================================================================
// 4. TIPE DATA ARSIP INTERNAL
// =========================================================================

// ... (Kode WarSummary dan Arsip lainnya tidak berubah)

/**
 * @interface WarSummary
// ... (Kode WarSummary tidak berubah)
 */
export interface WarSummary {
  id: string; // War ID atau Firestore Doc ID
  opponentName: string;
  teamSize: number;
  // --- [MODIFIKASI DUPLIKASI WAR] ---
  // Hapus 'WarResult' dan ganti dengan tipe literal agar 'unknown' valid
  result: 'win' | 'lose' | 'tie' | 'unknown';
  // --- [AKHIR MODIFIKASI] ---
  ourStars: number;
  opponentStars: number;
  ourDestruction: number; // Persentase
  opponentDestruction: number; // Persentase
  endTime: Date;
  hasDetails?: boolean; // <-- [PENAMBAHAN BARU] Menandakan jika data detail tersedia
}

/**
 * @interface WarArchive
 * Struktur data untuk menyimpan satu entri arsip War Classic di Firestore (sub-koleksi warArchives).
 * [PERBAIKAN] Tipe ini sekarang extends CocWarLog (data lengkap), bukan CocWarLogEntry (ringkasan).
 */
export interface WarArchive extends CocWarLog {
  // Properti dari CocWarLog (state, teamSize, clan, opponent, endTime: string, dll) di-inherit
  // 'clan' dan 'opponent' di dalam CocWarLog memiliki 'members', sehingga error TS2339 akan hilang.

  // --- [MODIFIKASI DUPLIKASI WAR] ---
  // Override properti 'result' yang di-inherit dari CocWarLog
  // untuk mengizinkan nilai 'unknown' yang kita simpan dari sync/war
  result?: 'win' | 'lose' | 'tie' | 'unknown';
  // --- [AKHIR MODIFIKASI] ---

  // id: string; // ID Dokumen Firestore (disediakan oleh FirestoreDocument<T>)
  clanTag: string; // Tag klan kita untuk query
  warEndTime: Date; // Simpan sebagai Date untuk query Firestore (menggantikan endTime string)
  hasDetails?: boolean; // <-- [PENAMBAHAN BARU] Menandakan jika data detail tersedia
}

/**
 * @interface RaidArchive
// ... (Kode RaidArchive tidak berubah)
 */
export interface RaidArchive {
  id: string; // ID Dokumen Firestore (selalu ada saat dibaca)
  clanTag: string; // Tag klan kita
  raidId: string; // ID unik raid (misal: clanTag + endTime)
  startTime?: Date; // Dibuat opsional
  endTime?: Date; // Dibuat opsional
  capitalTotalLoot: number;
  totalAttacks: number; // Jumlah total serangan klan
  members?: CocRaidMember[]; // Referensi tipe dari file baru
  offensiveReward?: number;
  defensiveReward?: number;
  enemyDistrictsDestroyed?: number; // Jumlah distrik musuh yg dihancurkan
  attackLog?: CocRaidAttackLogEntry[]; // Referensi tipe dari file baru
  defenseLog?: CocRaidDefenseLogEntry[]; // Referensi tipe dari file baru
}

/**
 * @interface CwlArchive
// ... (Kode CwlArchive tidak berubah)
 */
export interface CwlArchive {
  id: string; // ID Dokumen Firestore (misal: clanTag + season)
  clanTag: string;
  season: string; // Identifier musim (misal: "2025-10")
  rounds: CocWarLog[]; // Referensi tipe dari file baru
  // Bisa ditambahkan data ringkasan musim jika perlu (misal: total stars, placement)
}

// --- [BARU: TAHAP 2.2] ---
// =========================================================================
// 5. TIPE DATA ULASAN (REVIEW)
// =========================================================================

/**
 * @interface ClanReview
// ... (Kode ClanReview tidak berubah)
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

// --- [BARU DITAMBAHKAN UNTUK MEMPERBAIKI ERROR RAID] ---
/**
 * @interface ManagedClanRaidData
// ... (Kode ManagedClanRaidData tidak berubah)
 */
export interface ManagedClanRaidData {
  currentRaid: CocRaidLog | null;
  raidArchives: FirestoreDocument<RaidArchive>[];
}
// --- [AKHIR TAMBAHAN] ---

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

// --- [BARU: TAHAP 3.1] ---
// =========================================================================
// 6. TIPE DATA E-SPORTS (TAHAP 3)
// =========================================================================

/**
 * @interface EsportsTeam
// ... (Kode EsportsTeam tidak berubah)
 */
export interface EsportsTeam {
  id: string; // ID dokumen tim e-sports (di-generate oleh Firestore)
  teamName: string; // Nama tim (misal: "Tim A", "Elit War")
  teamLeaderUid: string; // UID (dari UserProfile) pemimpin tim
  clanId: string; // ID ManagedClan (induk)

  // Daftar UID (dari UserProfile) anggota. Tepat 5.
  memberUids: [string, string, string, string, string];
}
// --- [AKHIR BARU] ---

// [BARU: UNTUK PERBAIKAN ERROR #3 (Property 'clan' does not exist)]
// =========================================================================
// 7. TIPE DATA PAYLOAD GABUNGAN
// =========================================================================

/**
 * @interface ManagedClanDataPayload
 * Tipe data gabungan yang dikirim oleh API route /cache.
 * Ini menggabungkan data dokumen induk (ManagedClan) dengan
 * data sub-koleksi cache (ClanApiCache) untuk SWR hook.
 */
export interface ManagedClanDataPayload {
  clan: FirestoreDocument<ManagedClan>; // Data induk (untuk badgeUrl, name, dll)
  cache: ClanApiCache | null; // Data cache (untuk members, currentWar, dll)
}

/**
 * [BARU] Tipe data untuk rekomendasi tim di Halaman Utama.
 * Menggabungkan data klan dengan rating rata-rata yang dihitung.
 */
export type RecommendedTeam = FirestoreDocument<ManagedClan> & {
  averageRating: number;
};