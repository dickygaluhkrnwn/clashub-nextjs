// File: lib/types/post.types.ts
// Deskripsi: Mendefinisikan struktur data terkait Knowledge Hub (Post, Video).
// Bagian dari Refactor Fase 0.

import { PostCategory } from '../enums';

// =========================================================================
// 3. TIPE DATA KNOWLEDGE HUB (POST & VIDEO)
// =========================================================================

/**
 * @interface Post
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
  createdAt: Date;
  updatedAt?: Date;

  // --- [PERUBAHAN: Langkah 3.1 Peta Develop] ---
  // Diubah dari 'likes: number' (counter) menjadi 'likes: string[]' (array of UIDs)
  // Ini memungkinkan kita melacak *siapa* yang me-like dan menghitung totalnya.
  likes: string[];
  // --- [AKHIR PERUBAHAN] ---

  replies: number; // Ini adalah counter denormalisasi, kita biarkan untuk tampilan daftar
  troopLink?: string | null; // URL untuk menyalin kombinasi pasukan (coc://)
  videoUrl?: string | null; // URL video YouTube tutorial serangan
  baseImageUrl?: string | null;
  baseLinkUrl?: string | null;
  imageUrl?: string | null;
}

/**
 * @interface Video
 */
export interface Video {
  id: string; // ID dokumen Firestore (unik, bisa di-generate otomatis)
  videoId: string; // ID unik video dari YouTube (digunakan sebagai primary key logis)
  title: string; // Judul video
  description?: string; // Deskripsi singkat video (opsional)
  thumbnailUrl: string; // URL thumbnail kualitas tinggi
  publishedAt: Date; // Tanggal video dipublikasikan (sebagai objek Date)
  channelTitle: string; // Nama channel YouTube (misal: "Clash of Clans")
  channelId: string; // ID channel YouTube

  // PERBAIKAN (Sesuai keputusan):
  // Kategori video sekarang menggunakan tipe PostCategory dan akan disetel ke 'Berita Komunitas'
  category: PostCategory;

  source: 'YouTube'; // Sumber video
}