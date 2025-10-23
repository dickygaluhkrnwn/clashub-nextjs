// File: lib/types.ts
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang digunakan di seluruh aplikasi Clashub. Ini adalah "single source of truth"
// untuk bentuk data kita.

// =========================================================================
// 1. TIPE DATA CLASH OF CLANS API MENTAH (COCAPIType)
// =========================================================================

/**
 * @interface CocLeague
 * Mendefinisikan struktur data untuk data League (Liga).
 */
export interface CocLeague {
  id: number;
  name: string;
  iconUrls: {
    small: string;
    tiny: string;
    medium: string;
  };
}

/**
 * @interface CocIconUrls
 * Mendefinisikan struktur data untuk Badge/Lambang Klan.
 */
export interface CocIconUrls {
  small: string;
  large: string;
  medium: string;
}

/**
 * @interface CocClan
 * Data Clan dasar dari API. Digunakan untuk PublicClanIndex.
 */
export interface CocClan {
  tag: string;
  name: string;
  badgeUrls: CocIconUrls;
  clanLevel: number;
  clanPoints: number;
  clanVersusPoints: number;
  requiredTrophies: number;
  warFrequency: string; // Misal: 'always', 'lessThanOncePerWeek'
  warWinStreak: number;
  warWins: number;
  warTies: number;
  warLosses: number;
  isWarLogPublic: boolean;
  memberCount: number;
  location?: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode?: string;
  };
  type: 'open' | 'inviteOnly' | 'closed';
  description?: string;
  // Anggota hanya disertakan saat mengambil /clans/{clanTag}
  memberList?: CocMember[]; 
}

/**
 * @interface CocMember
 * Data Anggota Klan (CocPlayer versi singkat) saat di dalam CocClan.
 */
export interface CocMember {
  tag: string;
  name: string;
  role: 'leader' | 'coLeader' | 'admin' | 'member';
  townHallLevel: number;
  expLevel: number;
  league: CocLeague;
  trophies: number;
  builderBaseTrophies: number;
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
}

/**
 * @interface CocPlayer
 * Data lengkap Player dari API. Digunakan saat Verifikasi Player.
 */
export interface CocPlayer extends Omit<CocMember, 'clanRank' | 'previousClanRank'> {
  // Tambahan dari /players/{playerTag} endpoint
  attackWins: number;
  defenseWins: number;
  role: 'leader' | 'coLeader' | 'admin' | 'member' | 'not in clan'; // Memperluas role
  // Clan bisa null jika pemain tidak dalam klan
  clan?: {
    tag: string;
    name: string;
    badgeUrls: CocIconUrls;
    clanLevel: number;
  };
  // Data lebih detail lainnya dari API CocPlayer...
  // Misal: heroes, spells, troops, achievements
}

/**
 * @interface CocWarLog
 * Data log perang. Formatnya kompleks, kita simpan JSON mentah.
 */
export interface CocWarLog {
    items: any[];
    // Struktur lengkapnya sangat nested. Kita simpan sebagai 'any' untuk saat ini.
}


/**
 * @interface PlayerVerificationRequest
 * Digunakan sebagai payload untuk verifikasi: /api/coc/verify-player
 */
export interface PlayerVerificationRequest {
  playerTag: string;
  apiToken: string; // Token verifikasi yang diperoleh pemain dari game
}


// =========================================================================
// 2. TIPE DATA FIRESTORE CLASHUB (INTERNAL)
// =========================================================================

// --- TIPE DATA UTAMA CLASHUB YANG SUDAH ADA ---

/**
 * @interface UserProfile
 * Mendefinisikan struktur data untuk profil pengguna yang disimpan di koleksi 'users' Firestore.
 * Ini adalah E-Sports CV dari seorang pemain, DITAMBAH data verifikasi CoC.
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
  clanTag?: string | null; // Tag Klan CoC saat ini (diperbarui dari API)
  clanRole?: 'leader' | 'coLeader' | 'admin' | 'member' | 'not in clan'; // Role di klan CoC
  lastVerified?: Date; // Timestamp verifikasi terakhir
  
  // --- FIELD E-SPORTS CV YANG SUDAH ADA ---
  avatarUrl?: string;
  discordId?: string | null;
  website?: string | null;
  bio?: string;
  // Role Clashub internal: Kita tetap pertahankan field ini untuk Role Clashub
  role?: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent'; 
  playStyle?: 'Attacker Utama' | 'Base Builder' | 'Donatur' | 'Strategist' | null; 
  activeHours?: string;
  reputation?: number;
  teamId?: string | null; 
  teamName?: string | null; 
}


/**
 * @interface ManagedClan
 * Mendefinisikan struktur data untuk Klan yang Dikelola oleh pengguna Clashub.
 * Disimpan di koleksi 'managedClans'. Menggantikan interface Team sebelumnya.
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

  // Sub-koleksi: managedClans/{id}/clanApiCache 
  // Sub-koleksi: managedClans/{id}/warLog
  // Sub-koleksi: managedClans/{id}/raidLog
  // ...
}

/**
 * @interface ClanApiCache
 * Menyimpan data API yang sering diperbarui (Anggota, War Aktif) untuk klan internal.
 * Disimpan di sub-koleksi managedClans/{id}/clanApiCache/current
 */
export interface ClanApiCache {
  id: 'current'; // ID dokumen tunggal
  lastUpdated: Date;
  currentWar?: CocWarLog; // Bisa null jika tidak ada war aktif
  currentRaid?: any; // Data Raid Capital aktif (jika ada endpoint)
  // Daftar anggota yang diperbarui dari API Coc, termasuk Partisipasi
  members: Array<CocMember & {
    // Properti Partisipasi yang dikalkulasi dari Aggregators.js (Blueprint CSV)
    cwlSuccessCount: number;
    warSuccessCount: number;
    cwlFailCount: number;
    warFailCount: number;
    participationStatus: 'Promosi' | 'Demosi' | 'Aman' | 'Leader/Co-Leader'; // dari blueprint CSV
    lastRoleChangeDate: Date; // Kunci untuk reset partisipasi (dari Log Perubahan Role CSV)
    // Field lainnya...
  }>;
}


/**
 * @interface PublicClanIndex
 * Data cache publik dari klan manapun. Hanya menyimpan data API yang penting.
 * Disimpan di koleksi 'publicClanIndex'.
 */
export interface PublicClanIndex {
  tag: string; // ID dokumen (clanTag)
  name: string;
  clanLevel: number;
  memberCount: number;
  clanPoints: number;
  badgeUrls: CocIconUrls;
  lastUpdated: Date; // Untuk memeriksa apakah cache masih 'fresh'
  // Data CocClan mentah lainnya yang relevan untuk pencarian publik.
}


// --- TIPE DATA YANG SUDAH ADA (Dipertahankan) ---

/**
 * @interface Team
 * Catatan: Interface Team ini digantikan oleh ManagedClan di Firestore, 
 * namun dipertahankan untuk kompatibilitas sementara atau jika Team Hub masih 
 * menggunakannya untuk menampilkan daftar tim sebelum dirombak penuh di Fase 4.
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
 * Mendefinisikan struktur data untuk seorang pemain yang ditampilkan di Team Hub (pencarian pemain).
 * Ini adalah subset dari UserProfile.
 */
export interface Player {
    id: string; // ID dokumen dari Firestore (sama dengan uid)
    name: string;
    tag: string;
    thLevel: number;
    reputation: number;
    role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
    avatarUrl?: string;
    displayName: string; 
    playerTag: string; // Ini adalah playerTag CoC
}

/**
 * @interface Tournament
 * Mendefinisikan struktur data untuk sebuah turnamen.
 */
export interface Tournament {
    id: string; 
    title: string;
    status: 'Akan Datang' | 'Live' | 'Selesai';
    thRequirement: string;
    prizePool: string;
}

/**
 * @interface JoinRequest
 * Mendefinisikan struktur data untuk permintaan bergabung ke sebuah tim.
 */
export interface JoinRequest {
    id: string; 
    teamId: string; 
    teamName: string;
    requesterId: string; 
    requesterName: string;
    requesterThLevel: number;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date; 
}

// --- DATA UNTUK KNOWLEDGE HUB ---

/**
 * @type PostCategory
 * Daftar kategori yang tersedia di Knowledge Hub.
 */
export type PostCategory = 
  | 'Semua Diskusi' 
  | 'Strategi Serangan' 
  | 'Base Building' 
  | 'Manajemen Tim' 
  | 'Berita Komunitas'
  | 'Diskusi Umum';

/**
 * @interface Post
 * Mendefinisikan struktur data untuk postingan/artikel di Knowledge Hub.
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
    likes: number;
    replies: number;
}
