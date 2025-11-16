// File: lib/types/archive.types.ts
// Deskripsi: Mendefinisikan struktur data terkait Arsip (War, Raid, CWL).
// Bagian dari Refactor Fase 0.

import {
  CocWarLog,
  CocRaidLog,
  CocRaidMember,
  CocRaidAttackLogEntry,
  CocRaidDefenseLogEntry,
} from '../coc.types';
import { FirestoreDocument } from './clan.types';

// =========================================================================
// 4. TIPE DATA ARSIP INTERNAL
// =========================================================================

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