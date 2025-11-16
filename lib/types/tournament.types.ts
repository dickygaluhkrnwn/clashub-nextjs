// File: lib/types/tournament.types.ts
// Deskripsi: Mendefinisikan struktur data terkait Turnamen.
// Bagian dari Refactor Fase 0.

// [ROMBAK V2: Fase 1] Impor DocumentReference
// Diperlukan oleh TournamentMatch
import { DocumentReference } from 'firebase-admin/firestore';

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