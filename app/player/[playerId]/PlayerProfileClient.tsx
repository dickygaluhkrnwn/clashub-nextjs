// File: app/player/[playerId]/PlayerProfileClient.tsx
// Deskripsi: Client Component baru untuk Halaman Profil Publik.
//            [PERBAIKAN] Menyamakan logika rating default menjadi 0.0

'use client';

import React from 'react';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';

// --- Impor Komponen UI yang Digunakan Ulang dari app/profile/components ---
// Kita tidak mengimpor ProfileHeader karena header publik berbeda
import { ProfileSidebar } from '@/app/profile/components/ProfileSidebar';
import { GameStatusCard } from '@/app/profile/components/GameStatusCard';
import { RecentActivityCard } from '@/app/profile/components/RecentActivityCard';
import { TeamHistoryCard } from '@/app/profile/components/TeamHistoryCard';
import { ReceivedReviewsCard } from '@/app/profile/components/ReceivedReviewsCard';

// --- Impor untuk Header Publik (dari page.tsx lama) ---
import { Button } from '@/app/components/ui/Button';
import { ArrowLeftIcon, ExternalLinkIcon } from '@/app/components/icons';

// --- Props Interface ---
interface PlayerProfileClientProps {
  userProfile: UserProfile;
  recentPosts: FirestoreDocument<Post>[];
  clanHistory: FirestoreDocument<DocumentData>[];
  playerReviews: FirestoreDocument<PlayerReview>[];
}

/**
 * @component PlayerProfileClient
 * Client component yang merakit UI profil publik menggunakan komponen
 * yang sudah ada dari app/profile/components/
 */
const PlayerProfileClient = ({
  userProfile,
  recentPosts,
  clanHistory,
  playerReviews,
}: PlayerProfileClientProps) => {
  // --- 1. Logika Turunan (Variabel) ---
  // Logika ini diambil dari ProfileClient.tsx dan page.tsx lama
  // untuk memastikan konsistensi props

  const isVerified = userProfile?.isVerified || false;
  const isFreeAgent = userProfile?.role === 'Free Agent' || !userProfile?.role;
  const isCompetitiveVision =
    userProfile?.playStyle === 'Attacker Utama' ||
    userProfile?.playStyle === 'Strategist';

  // Link ke profil in-game CoC
  const cocProfileUrl =
    isVerified && userProfile?.playerTag
      ? `https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=${userProfile.playerTag.replace(
          '#',
          '',
        )}`
      : null;

  // Role CoC
  const inGameRole = userProfile?.clanRole || 'not in clan';

  // [PERBAIKAN] Kalkulasi Reputasi disamakan dengan Halaman Klan
  const playerReviewsCount = playerReviews.length;
  const totalRating = playerReviews.reduce(
    (acc, review) => acc + review.rating,
    0,
  );
  // Jika 0 ulasan, reputasi = 0.0. Jika ada, hitung rata-ratanya.
  const reputation =
    playerReviewsCount > 0 ? totalRating / playerReviewsCount : 0.0;
  // --- AKHIR PERBAIKAN ---

  // PENTING: Untuk profil PUBLIK, 'isClanManager' selalu false
  // agar tombol "Kelola Klan" atau info sinkronisasi tidak muncul.
  const isClanManagerForPublicView = false;

  // --- 2. Render Komponen ---
  return (
    <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
      {/* --- Bagian 1: Header Publik (Diambil dari page.tsx lama) --- */}
      <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
        <Button
          href="/clan-hub" // Diarahkan ke Clan Hub
          variant="secondary"
          size="md"
          className="flex items-center flex-shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
        </Button>

        <div className="flex gap-4">
          {/* Tombol Lihat Profil CoC */}
          {cocProfileUrl && (
            <Button
              href={cocProfileUrl}
              target="_blank"
              variant="secondary"
              size="md"
              className="flex-shrink-0"
            >
              <ExternalLinkIcon className="h-4 w-4 mr-2" /> Profil CoC In-Game
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            className="flex-shrink-0"
            disabled
          >
            Kirim Pesan
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!isFreeAgent}
            className="flex-shrink-0"
          >
            Kirim Undangan Tim
          </Button>
        </div>
      </header>

      {/* --- Bagian 2: Layout Utama (Grid) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* --- Kolom Kiri: Sidebar (Komponen Baru) --- */}
        <ProfileSidebar
          userProfile={userProfile}
          isVerified={isVerified}
          isFreeAgent={isFreeAgent}
          isCompetitiveVision={isCompetitiveVision}
          isClanManager={isClanManagerForPublicView} // Selalu false di publik
          reputation={reputation} // <-- Menggunakan reputasi yang sudah diperbaiki
          playerReviewsCount={playerReviewsCount}
        />

        {/* --- Kolom Kanan: Detail CV (Komponen Baru) --- */}
        <section className="lg:col-span-3 space-y-8">
          {/* Card Status Permainan */}
          <GameStatusCard
            userProfile={userProfile}
            isVerified={isVerified}
            isClanManager={isClanManagerForPublicView} // Selalu false di publik
            inGameRole={inGameRole}
          />

          {/* Card Aktivitas Terbaru */}
          <RecentActivityCard
            recentPosts={recentPosts}
            userProfile={userProfile}
          />

          {/* Card Riwayat Tim */}
          <TeamHistoryCard clanHistory={clanHistory} />

          {/* Card Ulasan Diterima */}
          <ReceivedReviewsCard playerReviews={playerReviews} />
        </section>
      </section>
    </main>
  );
};

export default PlayerProfileClient;