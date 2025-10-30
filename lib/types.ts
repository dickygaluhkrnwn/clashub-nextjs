// File: lib/types.ts
// Deskripsi: Barrel file utama untuk tipe data.
// Mengekspor ulang tipe data dari file-file spesifik dan mendefinisikan tipe/enum global.

// =========================================================================
// 1. EKSPOR ULANG TIPE SPESIFIK
// =========================================================================

// Ekspor semua tipe mentah dari API CoC (CocClan, CocMember, CocWarLog, dll.)
export * from './coc.types';

// Ekspor semua tipe data internal Clashub/Firestore (UserProfile, ManagedClan, Post, Video, dll.)
export * from './clashub.types';

// Ekspor semua enums dan tipe bantuan global
export * from './enums';


// =========================================================================
// 2. TIPE GABUNGAN (COMPOSITE TYPES)
// =========================================================================

// Impor tipe spesifik HANYA untuk membuat tipe gabungan
import { Post, Video } from './clashub.types';

/**
 * @type KnowledgeHubItem
 * Tipe gabungan yang merepresentasikan item di feed Knowledge Hub (bisa Post atau Video).
 */
export type KnowledgeHubItem = Post | Video;

