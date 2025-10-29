// File: lib/types.ts (PERBAIKAN + PENAMBAHAN TIPE BARU)
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang digunakan di seluruh aplikasi Clashub. Ini adalah "single source of truth"
// untuk bentuk data kita.

// =========================================================================
// 0. ENUMERASI KONSTANTA
// =========================================================================

/**
 * @enum ClanRole
 * Peran pemain di klan Clash of Clans (CoC).
 * Digunakan untuk konsistensi antara data API, UserProfile, dan logika bisnis.
 */
export enum ClanRole {
    NOT_IN_CLAN = 'not in clan',
    MEMBER = 'member',
    ELDER = 'admin', // CoC API menggunakan 'admin' untuk Elder
    CO_LEADER = 'coLeader',
    LEADER = 'leader',
}

// --- TIPE BANTUAN BARU UNTUK PERAN CLASHUB INTERNAL ---
/**
 * Tipe untuk peran Clashub yang memiliki izin manajemen (Leader/Co-Leader).
 */
export type ManagerRole = 'Leader' | 'Co-Leader';

/**
 * Tipe untuk peran Clashub anggota biasa (Elder/Member/Free Agent).
 */
export type StandardMemberRole = 'Elder' | 'Member' | 'Free Agent';
// --- AKHIR TIPE BANTUAN BARU ---

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
    clanCapitalPoints: number; // Field ini ada di API
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
    // Data Capital Raids (jika ada di API clan, perlu diverifikasi strukturnya)
    clanCapital?: {
        capitalHallLevel?: number;
        // ... properti lain terkait capital ...
    };
    // Data Clan War League (jika ada di API clan)
    warLeague?: {
        id: number;
        name: string;
    };
}

/**
 * @interface CocMember
 * Data Anggota Klan (CocPlayer versi singkat) saat di dalam CocClan.
 * CATATAN: Role di sini menggunakan string literal CoC ('admin', 'coLeader', dll.)
 */
export interface CocMember {
    tag: string;
    name: string;
    role: 'leader' | 'coLeader' | 'admin' | 'member'; // HANYA role di dalam klan
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
export interface CocPlayer
    extends Omit<CocMember, 'clanRank' | 'previousClanRank' | 'role'> {
    // role: Role diubah menggunakan Union Type dari ClanRole untuk mencakup 'not in clan'
    role:
        | ClanRole.LEADER
        | ClanRole.CO_LEADER
        | ClanRole.ELDER
        | ClanRole.MEMBER
        | ClanRole.NOT_IN_CLAN;
    attackWins: number;
    defenseWins: number;
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
 * Data log perang (Classic War/CWL). Formatnya kompleks.
 * Strukturnya bisa berbeda sedikit antara War Log biasa dan CWL War.
 */
export interface CocWarLog {
    // Properti umum untuk Classic War dan CWL War
    state: 'inWar' | 'preparation' | 'warEnded' | 'notInWar';
    teamSize?: number; // Mungkin tidak ada di CWL war individual
    startTime?: string; // ISO Date String
    endTime: string; // ISO Date String
    clan: CocWarClanInfo;
    opponent: CocWarClanInfo;
    result?: 'win' | 'lose' | 'tie'; // PERBAIKAN: Menambahkan properti result ke CocWarLog
    
    // Properti spesifik CWL War (diambil dari endpoint /clanwarleagues/wars/{warTag})
    warTag?: string; // Hanya ada di CWL War

    // Properti dari War Log biasa (items array dari /clans/{clanTag}/warlog)
    items?: CocWarLogEntry[]; // Hanya ada di response warlog

    // Properti lain yang mungkin ada (result, preparationStartTime, dll.)
    [key: string]: any; // Allow other properties, adjust as needed
}

/**
 * @interface CocWarClanInfo
 * Informasi klan dalam konteks War Log.
 */
export interface CocWarClanInfo {
    tag: string;
    name: string;
    badgeUrls: CocIconUrls;
    clanLevel: number;
    attacks?: number;
    stars: number;
    destructionPercentage: number;
    expEarned?: number;
    members: CocWarMember[];
    // --- PERBAIKAN TS2339: Menambahkan warLeague ---
    warLeague?: {
        id: number;
        name: string;
    };
}

/**
 * @interface CocWarMember
 * Informasi anggota dalam konteks War Log.
 */
export interface CocWarMember {
    tag: string;
    name: string;
    townhallLevel: number; // Perhatikan nama properti dari API
    mapPosition: number;
    opponentAttacks: number;
    bestOpponentAttack?: CocWarAttack;
    attacks?: CocWarAttack[];
}

/**
 * @interface CocWarAttack
 * Informasi serangan dalam konteks War Log.
 */
export interface CocWarAttack {
    attackerTag: string;
    defenderTag: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration?: number; // Mungkin ada
}

/**
 * @interface CocWarLogEntry
 * Representasi satu entri dalam array `items` dari endpoint warlog.
 */
export interface CocWarLogEntry {
    result?: 'win' | 'lose' | 'tie';
    endTime: string; // ISO Date String
    teamSize: number;
    clan: {
        tag: string;
        name: string;
        badgeUrls: CocIconUrls;
        clanLevel: number;
        attacks?: number; // Bisa jadi tidak ada jika war log tidak publik
        stars: number;
        destructionPercentage: number;
        expEarned?: number; // Ditambahkan ? karena mungkin tidak selalu ada
    };
    opponent: {
        tag: string;
        name: string;
        badgeUrls: CocIconUrls;
        clanLevel: number;
        stars: number;
        destructionPercentage: number;
    };
    // Kita mungkin tidak butuh detail member di sini untuk arsip ringkasan
}


/**
 * @interface PlayerVerificationRequest
 * Digunakan sebagai payload untuk verifikasi: /api/coc/verify-player
 */
export interface PlayerVerificationRequest {
    playerTag: string;
    apiToken: string; // Token verifikasi yang diperoleh pemain dari game
}

// --- TIPE DATA BARU: Raid Capital ---
/**
 * @interface CocRaidLog
 * Struktur data untuk log Raid Capital (perkiraan berdasarkan CSV dan API CoC jika tersedia).
 */
export interface CocRaidLog {
    state: 'ongoing' | 'ended';
    startTime: string; // ISO Date String
    endTime: string; // ISO Date String
    capitalTotalLoot: number; // Total jarahan modal oleh klan
    raidsCompleted?: number; // Jumlah raid yang diselesaikan (mungkin ada di API)
    totalAttacks: number; // Jumlah serangan yang dilakukan klan
    enemyDistrictsDestroyed: number; // Jumlah distrik musuh yg dihancurkan
    offensiveReward: number; // Medali reward penyerangan
    defensiveReward: number; // Medali reward pertahanan
    members?: CocRaidMember[]; // Daftar partisipasi anggota (jika API menyediakannya)
    attackLog: CocRaidAttackLogEntry[]; // Log serangan distrik klan musuh
    defenseLog: CocRaidDefenseLogEntry[]; // Log pertahanan distrik klan kita
    // Properti lain mungkin ada
}

/**
 * @interface CocRaidMember
 * Informasi partisipasi anggota dalam Raid Capital (dari API).
 */
export interface CocRaidMember {
    tag: string;
    name: string;
    attacks: number; // Jumlah serangan yang digunakan
    attackLimit: number; // Batas serangan (biasanya 6)
    bonusAttackLimit: number; // Batas serangan bonus (biasanya 0 atau 3)
    capitalResourcesLooted: number; // Jarahan yang didapat pemain ini
}

/**
 * @interface CocRaidAttackLogEntry
 * Detail satu entri log serangan dalam Raid Capital (serangan klan kita ke musuh).
 */
export interface CocRaidAttackLogEntry {
    defender: { // Informasi klan musuh yang diserang
        tag: string;
        name: string;
        level: number; // Level Clan Capital musuh
        // districts?: CocRaidDistrict[]; // Detail distrik musuh mungkin tidak ada di log serangan
    };
    attackCount: number; // Jumlah serangan pada klan musuh ini
    districtCount: number; // Jumlah distrik klan musuh ini
    districtsDestroyed: number; // Jumlah distrik musuh yang dihancurkan
    districts: CocRaidDistrict[]; // Detail distrik musuh yang diserang
}

/**
 * @interface CocRaidDistrict
 * Detail satu distrik dalam Raid Capital (bisa distrik kita atau musuh).
 */
export interface CocRaidDistrict {
    id: number;
    name: string;
    districtHallLevel: number;
    destructionPercent: number;
    attackCount: number; // Jumlah serangan pada distrik ini
    totalLooted?: number; // Jarahan yang didapat dari distrik ini (mungkin hanya ada di attackLog)
    attacks?: CocRaidDistrictAttack[]; // Detail serangan pada distrik ini
    stars?: number; // Bintang yang didapat di distrik ini
}

/**
 * @interface CocRaidDistrictAttack
 * Detail serangan spesifik pada satu distrik dalam Raid Capital.
 */
export interface CocRaidDistrictAttack {
    attacker: {
        tag: string;
        name: string;
    };
    destructionPercent: number;
    stars: number;
}

/**
 * @interface CocRaidDefenseLogEntry
 * Detail satu entri log pertahanan dalam Raid Capital (serangan musuh ke klan kita).
 */
export interface CocRaidDefenseLogEntry {
    attacker: { // Informasi klan penyerang
        tag: string;
        name: string;
        level: number; // Level Clan Capital penyerang
    };
    attackCount: number; // Jumlah serangan dari klan ini pada klan kita
    districtCount: number; // Jumlah distrik klan kita
    districtsDestroyed: number; // Jumlah distrik kita yang hancur oleh klan ini
    districts: CocRaidDistrict[]; // Detail distrik kita yang diserang oleh klan ini
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
    trophies: number; // Field Trophy
    clanTag?: string | null; // Tag Klan CoC saat ini (diperbarui dari API)
    clanRole?: ClanRole; // MENGGUNAKAN ENUM CLANROLE
    lastVerified?: Date; // Timestamp verifikasi terakhir

    // --- FIELD E-SPORTS CV YANG SUDAH ADA ---
    avatarUrl?: string;
    discordId?: string | null;
    website?: string | null;
    bio?: string;
    // Role Clashub internal: Role yang ditampilkan di Clashub
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

// --- TIPE BARU: Top Performers ---
/**
 * @interface TopPerformerPlayer
 * Representasi sederhana pemain untuk daftar Top Performers.
 */
export interface TopPerformerPlayer {
    tag: string;
    name: string;
    value: number | string; // Bisa angka (donasi, loot) atau string (status 'Promosi'/'Demosi')
    // Tambahan properti jika perlu
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

    // --- DATA AGREGAT BARU (Dari Dashboard.csv) ---
    // Kita letakkan di ClanApiCache karena data ini dihitung saat sinkronisasi.

    // Sub-koleksi: managedClans/{id}/clanApiCache
    // Sub-koleksi: managedClans/{id}/warArchives (BARU)
    // Sub-koleksi: managedClans/{id}/cwlArchives (Sudah ada rencana)
    // Sub-koleksi: managedClans/{id}/raidArchives (BARU)
    // Sub-koleksi: managedClans/{id}/roleChanges (Sudah ada rencana)
}

/**
 * @interface ClanApiCache
 * Menyimpan data API yang sering diperbarui (Anggota, War Aktif) untuk klan internal.
 * Disimpan di sub-koleksi managedClans/{id}/clanApiCache/current
 */
export interface ClanApiCache {
    id: 'current'; // ID dokumen tunggal
    lastUpdated: Date;
    currentWar?: CocWarLog | null; // Bisa null jika tidak ada war aktif
    currentRaid?: CocRaidLog | null; // Data Raid Capital aktif (BARU)
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
        // Bisa ditambahkan metriks lain jika perlu
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
    badgeUrls: CocIconUrls;
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
    // Tambahkan warLeague jika ingin ditampilkan di index publik
    warLeague?: {
        id: number;
        name: string;
    };
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
    inGameName?: string; // PERBAIKAN: Menambahkan inGameName untuk resolusi error 2339
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
    // --- PERUBAHAN (Langkah 1.1) ---
    // Mengganti 'teamId' dan 'teamName' menjadi 'clanId' dan 'clanName'
    // untuk merujuk ke ManagedClan internal.
    clanId: string; // ID klan internal (ManagedClan)
    clanName: string; // Nama klan internal (ManagedClan)
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
    
    // [BARU] Field khusus untuk kategori Strategi Serangan
    troopLink?: string | null; // URL untuk menyalin kombinasi pasukan (coc://)
    videoUrl?: string | null; // URL video YouTube tutorial serangan
}


// --- TIPE BARU UNTUK KOMPONEN WAR HISTORY ---
/**
 * @type WarResult
 * Tipe union untuk hasil perang, termasuk 'unknown' untuk kasus data yang tidak lengkap.
 */
export type WarResult = 'win' | 'lose' | 'tie' | 'unknown';

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
}
// --- AKHIR TIPE BARU UNTUK KOMPONEN WAR HISTORY ---

// --- TIPE DATA BARU UNTUK ARSIP (jika diperlukan struktur spesifik) ---

/**
 * @interface WarArchive
 * Struktur data untuk menyimpan satu entri arsip War Classic di Firestore (sub-koleksi warArchives).
 * Kita simpan log lengkap (`CocWarLog`) untuk detail maksimal.
 */
export interface WarArchive extends Omit<CocWarLog, 'items'> { // Omit 'items' jika log individu
    // PERBAIKAN TS2322 (Konsistensi): Jadikan ID wajib (string)
    id: string; // ID Dokumen Firestore (selalu ada saat dibaca)
    clanTag: string; // Tag klan kita untuk query
    warEndTime: Date; // Simpan sebagai Date untuk query Firestore
    // warId?: string; // ID unik perang jika ada/diperlukan (bisa dari startTime/endTime?)
}

/**
 * @interface RaidArchive
 * Struktur data untuk menyimpan satu entri arsip Raid Capital di Firestore (sub-koleksi raidArchives).
 * Berdasarkan CocRaidLog, tapi mungkin disederhanakan.
 */
export interface RaidArchive {
    // PERBAIKAN TS2322: Jadikan ID wajib (string)
    id: string; // ID Dokumen Firestore (selalu ada saat dibaca)
    clanTag: string; // Tag klan kita
    raidId: string; // ID unik raid (misal: clanTag + endTime)
    startTime: Date;
    endTime: Date;
    capitalTotalLoot: number;
    totalAttacks: number; // Jumlah total serangan klan
    members?: CocRaidMember[]; // Simpan detail partisipasi anggota (jika ada)
    offensiveReward?: number;
    defensiveReward?: number;
    // Properti yang mungkin hilang dari API (tetap opsional)
    enemyDistrictsDestroyed?: number; // Jumlah distrik musuh yg dihancurkan
    attackLog?: CocRaidAttackLogEntry[]; // Log serangan distrik klan musuh
    defenseLog?: CocRaidDefenseLogEntry[]; // Log pertahanan distrik klan kita
}

/**
 * @interface CwlArchive
 * Struktur data untuk menyimpan satu entri arsip CWL per musim di Firestore (sub-koleksi cwlArchives).
 */
export interface CwlArchive {
    // PERBAIKAN TS2322: Jadikan ID wajib (string) karena selalu ada saat dibaca dari Firestore
    id: string; // ID Dokumen Firestore (misal: clanTag + season)
    clanTag: string;
    season: string; // Identifier musim (misal: "2025-10")
    rounds: CocWarLog[]; // Menyimpan detail setiap war dalam musim CWL (CocWarLog tanpa 'items')
    // Bisa ditambahkan data ringkasan musim jika perlu (misal: total stars, placement)
}

