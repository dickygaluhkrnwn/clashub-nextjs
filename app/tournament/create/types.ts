// [BARU] File ini mengekstrak tipe state dari CreateTournamentClient
// agar bisa digunakan bersama oleh komponen-komponen baru.

/**
 * Tipe untuk state form, diambil dari CreateTournamentClient.tsx
 */
export type TournamentFormData = {
  title: string;
  description: string;
  rules: string;
  prizePool: string;
  bannerUrl: string;
  // [Fase 7.2] Dihapus
  // startsAt: string; // Tanggal & Jam Mulai
  // endsAt: string; // Tanggal & Jam Selesai

  // [Fase 7.2] Field Tanggal Baru
  registrationStartsAt: string; // Kapan pendaftaran mulai dibuka
  registrationEndsAt: string; // Kapan pendaftaran ditutup
  tournamentStartsAt: string; // Kapan pertandingan pertama dimulai
  tournamentEndsAt: string; // Target tanggal selesai turnamen

  format: '1v1' | '5v5';
  participantCount: number; // Jumlah Tim (8, 16, 32, 64)

  // State untuk membangun ThRequirement
  thRequirementType: 'any' | 'uniform' | 'mixed';
  thMinLevel: number;
  thMaxLevel: number;
  thUniformLevel: number; // Jika type 'uniform'
  thMixedLevels: (number | string)[]; // Array 5 TH jika type 'mixed'
};

/**
 * Tipe untuk error validasi, diambil dari CreateTournamentClient.tsx
 */
export type FormErrors = {
  [key in keyof TournamentFormData]?: string | null;
} & {
  thMixedLevels?: string | null; // Error khusus untuk array
};