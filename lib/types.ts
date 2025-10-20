// File: lib/types.ts
// Deskripsi: Mendefinisikan semua struktur data (interface) TypeScript
// yang digunakan di seluruh aplikasi Clashub. Ini adalah "single source of truth"
// untuk bentuk data kita.

/**
 * @interface UserProfile
 * Mendefinisikan struktur data untuk profil pengguna yang disimpan di koleksi 'users' Firestore.
 * Ini adalah E-Sports CV dari seorang pemain.
 */
export interface UserProfile {
  uid: string; // ID unik dari Firebase Auth
  email: string | null; // Email dari Firebase Auth
  displayName: string; // Nama yang bisa diganti pengguna
  playerTag: string; // Tag pemain dari dalam game
  thLevel: number; // Level Town Hall
  // Tambahan field dari prototipe untuk melengkapi profil
  bio?: string;
  // DIPERBARUI: Menggunakan role resmi dari dalam game
  role?: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  playStyle?: 'Attacker Utama' | 'Base Builder' | 'Donatur' | 'Strategist'; // <-- Mengganti role lama menjadi playStyle
  activeHours?: string; // Contoh: "20:00 - 23:00 WIB"
  reputation?: number; // Reputasi rata-rata
}

/**
 * @interface Team
 * Mendefinisikan struktur data untuk sebuah tim/klan.
 * Berdasarkan props dari TeamCardProps.
 */
export interface Team {
  id: string; // ID dokumen dari Firestore
  name: string;
  tag: string;
  rating: number;
  vision: 'Kompetitif' | 'Kasual';
  avgTh: number;
  logoUrl?: string;
}

/**
 * @interface Player
 * Mendefinisikan struktur data untuk seorang pemain yang ditampilkan di Team Hub.
 * Berdasarkan props dari PlayerCardProps.
 */
export interface Player {
    id: string; // ID dokumen dari Firestore (sama dengan uid)
    name: string;
    tag: string;
    thLevel: number;
    reputation: number;
    role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
    avatarUrl?: string;
}

/**
 * @interface Tournament
 * Mendefinisikan struktur data untuk sebuah turnamen.
 * Berdasarkan props dari TournamentCardProps.
 */
export interface Tournament {
    id: string; // ID dokumen dari Firestore
    title: string;
    status: 'Akan Datang' | 'Live' | 'Selesai';
    thRequirement: string;
    prizePool: string;
}

