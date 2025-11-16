// File: lib/clashub.types.ts
// Deskripsi: Barrel file untuk semua struktur data internal Clashub.
// [REFACFOR FASE 0] File ini sekarang hanya meng-ekspor ulang tipe dari folder /lib/types/

// =========================================================================
// 0. TIPE DATA CoC SPESIFIK
// =========================================================================

// Impor tipe CoC dari file 'coc.types.ts' untuk di-ekspor ulang secara spesifik
// Tipe CoC lainnya diimpor langsung oleh file di dalam /lib/types/
import {
  CocCurrentWar,
  CocIconUrls,
} from './coc.types';

// [BARU FASE 16.1] Ekspor tipe yang diimpor agar bisa digunakan file lain
export type { CocCurrentWar, CocIconUrls } from './coc.types';

// =========================================================================
// 1. EKSPOR ULANG TIPE INTERNAL CLASHUB
// =========================================================================

// [REFACFOR FASE 0] Ekspor ulang semua tipe yang baru dipecah
export * from './types/user.types';
export * from './types/clan.types';
export * from './types/tournament.types';
export * from './types/post.types';
export * from './types/archive.types';

// =========================================================================
// 2. KOMENTAR KODE YANG DIPINDAH (UNTUK HISTORI)
// =========================================================================
// [SEMUA INTERFACE DI BAWAH INI SUDAH DIPINDAH KE FOLDER /lib/types/]

/**
 * @type FirestoreDocument
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface UserProfile
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface TopPerformerPlayer
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface Promotion
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface ManagedClan
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface ClanApiCache
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface PublicClanIndex
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface Team
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface Player
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface Tournament
 */
// [KODE DIPINDAH KE lib/types/tournament.types.ts]

/**
 * @interface ThRequirement
 */
// [KODE DIPINDAH KE lib/types/tournament.types.ts]

/**
 * @interface TournamentTeam
 */
// [KODE DIPINDAH KE lib/types/tournament.types.ts]

/**
 * @interface TournamentTeamMember
 */
// [KODE DIPINDAH KE lib/types/tournament.types.ts]

/**
 * @interface TournamentMatch
 */
// [KODE DIPINDAH KE lib/types/tournament.types.ts]

/**
 * @interface JoinRequest
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface Notification
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface Post
 */
// [KODE DIPINDAH KE lib/types/post.types.ts]

/**
 * @interface Video
 */
// [KODE DIPINDAH KE lib/types/post.types.ts]

/**
 * @interface Reply
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface WarSummary
 */
// [KODE DIPINDAH KE lib/types/archive.types.ts]

/**
 * @interface WarArchive
 */
// [KODE DIPINDAH KE lib/types/archive.types.ts]

/**
 * @interface RaidArchive
 */
// [KODE DIPINDAH KE lib/types/archive.types.ts]

/**
 * @interface CwlArchive
 */
// [KODE DIPINDAH KE lib/types/archive.types.ts]

/**
 * @interface ClanReview
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface PlayerReview
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface ManagedClanRaidData
 */
// [KODE DIPINDAH KE lib/types/archive.types.ts]

/**
 * @interface RoleChangeLog
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface JoinRequestWithProfile
 */
// [KODE DIPINDAH KE lib/types/user.types.ts]

/**
 * @interface EsportsTeam
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * @interface ManagedClanDataPayload
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]

/**
 * [BARU] Tipe data untuk rekomendasi tim di Halaman Utama.
 */
// [KODE DIPINDAH KE lib/types/clan.types.ts]