// File: lib/coc.types.ts
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang berhubungan langsung dengan data mentah dari API Clash of Clans.

import { ClanRole } from './enums';

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
  // --- [MODIFIKASI DUPLIKASI WAR] ---
  // Menambahkan 'unknown' agar sesuai dengan logika arsip kita
  result?: 'win' | 'lose' | 'tie' | 'unknown';
  // --- [AKHIR MODIFIKASI] ---

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
  // --- [MODIFIKASI DUPLIKASI WAR] ---
  // Menambahkan 'unknown' agar sesuai dengan logika arsip kita
  result?: 'win' | 'lose' | 'tie' | 'unknown';
  // --- [AKHIR MODIFIKASI] ---
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
  defender: {
    // Informasi klan musuh yang diserang
    tag: string;
    name: string;
    level: number; // Level Clan Capital musuh
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
  attacker: {
    // Informasi klan penyerang
    tag: string;
    name: string;
    level: number; // Level Clan Capital penyerang
  };
  attackCount: number; // Jumlah serangan dari klan ini pada klan kita
  districtCount: number; // Jumlah distrik klan kita
  districtsDestroyed: number; // Jumlah distrik kita yang hancur oleh klan ini
  districts: CocRaidDistrict[]; // Detail distrik kita yang diserang oleh klan ini
}

/**
 * @interface CocRaidSeasons
 * Tipe data pembungkus untuk endpoint /capitalraidseasons.
 * Ini adalah respons API, berisi daftar log raid.
 */
export interface CocRaidSeasons {
  items: CocRaidLog[];
  paging?: {
    cursors: {};
  };
}

// --- [PENAMBAHAN BARU UNTUK CWL/LEAGUE GROUP] ---

/**
 * @interface CocLeagueGroupClanMember
 * Info anggota di roster CWL (dari League Group API).
 */
export interface CocLeagueGroupClanMember {
  tag: string;
  name: string;
  townHallLevel: number;
}

/**
 * @interface CocLeagueGroupClan
 * Info klan di dalam League Group API.
 */
export interface CocLeagueGroupClan {
  tag: string;
  name: string;
  clanLevel: number;
  badgeUrls: CocIconUrls;
  members: CocLeagueGroupClanMember[];
}

/**
 * @interface CocLeagueGroup
 * Data untuk endpoint /clans/{clanTag}/currentwar/leaguegroup.
 */
export interface CocLeagueGroup {
  state: 'preparation' | 'inWar' | 'ended' | string; // 'string' sebagai fallback jika ada state lain
  season: string; // Format "YYYY-MM"
  clans: CocLeagueGroupClan[];
  rounds: {
    warTags: string[]; // Daftar warTag untuk setiap match di ronde itu
  }[];
}

// --- [AKHIR PENAMBAHAN BARU] ---

/**
 * @interface CocCurrentWar
 * Data untuk endpoint /clans/{clanTag}/currentwar.
 * Strukturnya SANGAT mirip with CocWarLog, tapi ini adalah root object,
 * bukan item di dalam array 'items'.
 *
 * Kita extend CocWarLog dan tambahkan properti spesifik 'currentwar'
 * yang tidak ada di 'warlog'.
 */
export interface CocCurrentWar extends Omit<CocWarLog, 'items'> {
  // 'state', 'teamSize', 'startTime', 'endTime', 'clan', 'opponent', 'result'
  // semua di-inherit dari CocWarLog.

  // Properti tambahan yang ada di currentwar tapi tidak di warlog entry:
  preparationStartTime: string; // ISO Date String
  attacksPerMember?: number;

  // CATATAN: 'members' (data detail serangan) berada di dalam
  // properti 'clan.members' and 'opponent.members' (tipe CocWarClanInfo),
  // bukan di top-level.
}