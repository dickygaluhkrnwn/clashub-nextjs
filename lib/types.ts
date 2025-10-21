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
  // Role di dalam tim (jika tergabung). 'Free Agent' jika tidak tergabung.
  role?: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  // Gaya bermain favorit pengguna (sebagai bagian dari CV)
  playStyle?: 'Attacker Utama' | 'Base Builder' | 'Donatur' | 'Strategist' | null; 
  activeHours?: string; // Contoh: "20:00 - 23:00 WIB"
  reputation?: number; // Reputasi komitmen rata-rata
  // teamId dan teamName bisa ditambahkan di Sprint 4
}

/**
 * @interface Team
 * Mendefinisikan struktur data untuk sebuah tim/klan.
 */
export interface Team {
  id: string; // ID dokumen dari Firestore
  name: string;
  tag: string;
  rating: number; // Reputasi Tim
  vision: 'Kompetitif' | 'Kasual'; // Visi Tim
  avgTh: number; // Rata-rata Level TH anggota
  logoUrl?: string;
}

/**
 * @interface Player
 * Mendefinisikan struktur data untuk seorang pemain yang ditampilkan di Team Hub (pencarian pemain).
 * Ini pada dasarnya adalah sub-set dari UserProfile.
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
 */
export interface Tournament {
    id: string; // ID dokumen dari Firestore
    title: string;
    status: 'Akan Datang' | 'Live' | 'Selesai';
    thRequirement: string;
    prizePool: string;
}

// Catatan: Interface Post akan ditambahkan di Tugas 3.4

