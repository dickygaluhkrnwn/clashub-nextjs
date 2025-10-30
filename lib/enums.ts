// File: lib/enums.ts
// Deskripsi: Mendefinisikan Enums dan Tipe Bantuan global yang
// digunakan oleh tipe data CoC dan Clashub. File ini tidak boleh
// mengimpor dari file .types.ts lainnya.

// =========================================================================
// ENUMERASI & TIPE BANTUAN GLOBAL
// =========================================================================

/**
 * @enum ClanRole
 * Peran pemain di klan Clash of Clans (CoC).
 * (Berasal dari data API, tapi digunakan di kedua sisi).
 */
export enum ClanRole {
    NOT_IN_CLAN = 'not in clan',
    MEMBER = 'member',
    ELDER = 'admin', // CoC API menggunakan 'admin' untuk Elder
    CO_LEADER = 'coLeader',
    LEADER = 'leader',
}

/**
 * Tipe untuk peran Clashub yang memiliki izin manajemen (Leader/Co-Leader).
 */
export type ManagerRole = 'Leader' | 'Co-Leader';

/**
 * Tipe untuk peran Clashub anggota biasa (Elder/Member/Free Agent).
 */
export type StandardMemberRole = 'Elder' | 'Member' | 'Free Agent';

/**
 * @type WarResult
 * Tipe union untuk hasil perang, termasuk 'unknown' untuk kasus data yang tidak lengkap.
 */
export type WarResult = 'win' | 'lose' | 'tie' | 'unknown';

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
 * @type VideoCategory
 * Kategori video berdasarkan sumber game/channel.
 */
export type VideoCategory =
    | 'Clash of Clans'
    | 'Brawl Stars'
    | 'Clash Royale'
    | 'Hay Day'
    | 'Lainnya'; // Kategori umum jika perlu

