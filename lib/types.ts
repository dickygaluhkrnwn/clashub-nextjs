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
  
  // --- FIELD YANG BARU DITAMBAHKAN (Sprint 4: Tugas 2.1) ---
  avatarUrl?: string; // URL gambar profil dari Firebase Storage
  discordId?: string | null; // ID Discord/Username
  website?: string | null; // Link ke portfolio/website

  // Tambahan field dari prototipe untuk melengkapi profil
  bio?: string;
  // Role di dalam tim (jika tergabung). 'Free Agent' jika tidak tergabung.
  role?: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
  // Gaya bermain favorit pengguna (sebagai bagian dari CV)
  playStyle?: 'Attacker Utama' | 'Base Builder' | 'Donatur' | 'Strategist' | null; 
  activeHours?: string; // Contoh: "20:00 - 23:00 WIB"
  reputation?: number; // Reputasi komitmen rata-rata
  
  // --- FIELD BARU UNTUK MANAJEMEN TIM (Tugas 2.3) ---
  teamId?: string | null; // ID tim saat ini (null jika Free Agent)
  teamName?: string | null; // Nama tim saat ini
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
  
  // --- FIELD BARU UNTUK MANAJEMEN TIM (Tugas 2.3) ---
  captainId: string; // UID kapten tim
  website?: string;
  discordId?: string; 
  recruitingStatus: 'Open' | 'Invite Only' | 'Closed'; // Status rekrutmen
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
    thLevel: number;
    reputation: number;
    role: 'Leader' | 'Co-Leader' | 'Elder' | 'Member' | 'Free Agent';
    avatarUrl?: string;
    // Menambahkan field yang relevan agar data di TeamHubClient dapat diolah tanpa type error
    displayName: string; 
    playerTag: string;
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

/**
 * @interface JoinRequest (BARU - Tugas 2.3)
 * Mendefinisikan struktur data untuk permintaan bergabung ke sebuah tim.
 */
export interface JoinRequest {
    id: string; // ID dokumen dari Firestore
    teamId: string; // ID Tim yang dituju
    teamName: string;
    requesterId: string; // UID pemain yang mengajukan
    requesterName: string; // Nama pemain yang mengajukan
    requesterThLevel: number;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: Date; // Kapan permintaan dibuat
}

// --- DATA BARU UNTUK KNOWLEDGE HUB (Tugas 3.1) ---

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
    createdAt: Date; // Menggunakan Date agar mudah diolah di frontend
    updatedAt?: Date;
    likes: number;
    replies: number;
}
