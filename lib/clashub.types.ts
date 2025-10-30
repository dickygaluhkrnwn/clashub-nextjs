// File: lib/clashub.types.ts
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang digunakan secara internal oleh aplikasi Clashub (Data Firestore).

// PERBAIKAN: Impor tipe Enum/Bantuan dari file 'enums.ts'
import { ClanRole, ManagerRole, StandardMemberRole, WarResult, PostCategory } from './enums';
// PERBAIKAN: Impor tipe CoC dari file 'coc.types.ts'
import { CocWarLog, CocRaidLog, CocMember, CocIconUrls, CocRaidMember, CocRaidAttackLogEntry, CocRaidDefenseLogEntry } from './coc.types';


// =========================================================================
// 0. ENUMERASI DAN TIPE BANTUAN INTERNAL
// =========================================================================

// (SEMUA ENUM DAN TIPE BANTUAN DI BAWAH INI DIPINDAHKAN KE lib/enums.ts)
/*
...
*/


// =========================================================================
// 1. TIPE DATA FIRESTORE CLASHUB (INTERNAL)
// =========================================================================

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
    playStyle?: 'Attacker Utama' | 'Base Builder' | 'Donatur' | 'Strategist' | null;
    activeHours?: string;
    reputation?: number;

    // --- PERUBAHAN (Langkah 1.1) ---
    // Mengganti 'teamId' dan 'teamName' menjadi 'clanId' dan 'clanName'
    // untuk merujuk ke ManagedClan internal.
    clanId?: string | null; // ID klan internal (ManagedClan) yang diikuti pemain
    clanName?: string | null; // Nama klan internal (ManagedClan) yang diikuti pemain
}

/**
 * @interface TopPerformerPlayer
 * Representasi sederhana pemain untuk daftar Top Performers.
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
}

/**
 * @interface ClanApiCache
 * Menyimpan data API yang sering diperbarui (Anggota, War Aktif) untuk klan internal.
 * Disimpan di sub-koleksi managedClans/{id}/clanApiCache/current
 */
export interface ClanApiCache {
    id: 'current'; // ID dokumen tunggal
    lastUpdated: Date;
    currentWar?: CocWarLog | null; // Referensi tipe dari file baru
    currentRaid?: CocRaidLog | null; // Referensi tipe dari file baru
    // Daftar anggota yang diperbarui dari API Coc, termasuk Partisipasi
    members: Array<
        CocMember & {
            // Properti Partisipasi yang dikalkulasi dari Aggregators.js (Blueprint CSV)
            cwlSuccessCount: number;
            warSuccessCount: number;
            cwlFailCount: number;
            warFailCount: number;
            participationStatus: 'Promosi' | 'Demosi' | 'Aman' | 'Leader/Co-Leader'; // dari blueprint CSV
            lastRoleChangeDate: Date; // Kunci untuk reset partisipasi (dari Log Perubahan Role CSV)
            // Keterangan status untuk UI (BARU ditambahkan di participationAggregator)
            statusKeterangan?: string;
        }
    >;
    // --- DATA AGREGAT BARU: Top Performers (Dimasukkan ke sini) ---
    topPerformers?: {
        promotions: TopPerformerPlayer[]; // Pemain yang status partisipasinya 'Promosi'
        demotions: TopPerformerPlayer[];  // Pemain yang status partisipasinya 'Demosi'
        topRaidLooter: TopPerformerPlayer | null; // Pemain dengan capitalResourcesLooted tertinggi di raid terakhir
        topDonator: TopPerformerPlayer | null;    // Pemain dengan donasi tertinggi (dari CocMember)
    };
}

/**
 * @interface PublicClanIndex
 * Data cache publik dari klan manapun. Ini mencakup data yang diperlukan untuk profil klan publik.
 * Disimpan di koleksi 'publicClanIndex'.
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
 * Tipe data lama, dipertahankan untuk kompatibilitas sementara.
 * @deprecated Gunakan ManagedClan
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
    clanId: string; // ID klan internal (ManagedClan)
    clanName: string; // Nama klan internal (ManagedClan)
    requesterId: string;
    requesterName: string;
    requesterThLevel: number;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date;
}

// =========================================================================
// 3. TIPE DATA KNOWLEDGE HUB (POST & VIDEO)
// =========================================================================

// (TIPE INI DIPINDAHKAN KE lib/enums.ts)
/*
export type PostCategory = ...
*/

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
    troopLink?: string | null; // URL untuk menyalin kombinasi pasukan (coc://)
    videoUrl?: string | null; // URL video YouTube tutorial serangan
    baseImageUrl?: string | null;
    baseLinkUrl?: string | null;
    imageUrl?: string | null;
}


// (TIPE INI DIPINDAHKAN KE lib/enums.ts)
/*
export type VideoCategory = ...
*/

/**
 * @interface Video
 * Mendefinisikan struktur data untuk video YouTube yang disimpan di koleksi 'videos' Firestore.
 */
export interface Video {
    id: string;       // ID dokumen Firestore (unik, bisa di-generate otomatis)
    videoId: string;    // ID unik video dari YouTube (digunakan sebagai primary key logis)
    title: string;      // Judul video
    description?: string; // Deskripsi singkat video (opsional)
    thumbnailUrl: string; // URL thumbnail kualitas tinggi
    publishedAt: Date;  // Tanggal video dipublikasikan (sebagai objek Date)
    channelTitle: string; // Nama channel YouTube (misal: "Clash of Clans")
    channelId: string;  // ID channel YouTube
    
    // PERBAIKAN (Sesuai keputusan):
    // Kategori video sekarang menggunakan tipe PostCategory dan akan disetel ke 'Berita Komunitas'
    category: PostCategory; 
    
    source: 'YouTube'; // Sumber video
}

// (TIPE INI DIPINDAHKAN KE lib/types.ts)
/*
// --- TIPE GABUNGAN UNTUK KNOWLEDGE HUB ---
export type KnowledgeHubItem = Post | Video;
*/


// =========================================================================
// 4. TIPE DATA ARSIP INTERNAL
// =========================================================================

// (TIPE INI DIPINDAHKAN KE lib/enums.ts)
/*
export type WarResult = ...
*/

/**
 * @interface WarSummary
 * Struktur data ringkasan perang yang digunakan oleh WarHistoryTabContent.tsx
 * Diambil dari arsip WarArchive.
 */
export interface WarSummary {
    id: string; // War ID atau Firestore Doc ID
    opponentName: string;
    teamSize: number;
    result: WarResult; // Menggunakan tipe union WarResult
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
 */
export interface WarArchive extends Omit<CocWarLog, 'items'> { // Omit 'items' jika log individu
    id: string; // ID Dokumen Firestore (selalu ada saat dibaca)
    clanTag: string; // Tag klan kita untuk query
    warEndTime: Date; // Simpan sebagai Date untuk query Firestore
    hasDetails?: boolean; // <-- [PENAMBAHAN BARU] Menandakan jika data detail tersedia
}

/**
 * @interface RaidArchive
 * Struktur data untuk menyimpan satu entri arsip Raid Capital di Firestore (sub-koleksi raidArchives).
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
 * Struktur data untuk menyimpan satu entri arsip CWL per musim di Firestore (sub-koleksi cwlArchives).
 */
export interface CwlArchive {
    id: string; // ID Dokumen Firestore (misal: clanTag + season)
    clanTag: string;
    season: string; // Identifier musim (misal: "2025-10")
    rounds: CocWarLog[]; // Referensi tipe dari file baru
    // Bisa ditambahkan data ringkasan musim jika perlu (misal: total stars, placement)
}
