// File: app/player/[playerId]/PlayerProfileClient.tsx
// Deskripsi: [MODIFIKASI FASE 7.2]: Mengimpor dan mengintegrasikan PlayerAchievementsCard
// dan memperbaiki implementasi FASE 6 (Cache Read).

'use client';

// [MODIFIKASI FASE 2] Impor hook React dan tipe CocPlayer
import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
import { CocPlayer } from '@/lib/coc.types'; // <-- [BARU] Impor tipe data lengkap

// --- Impor Komponen UI yang Digunakan Ulang dari app/profile/components ---
import { ProfileSidebar } from '@/app/profile/components/ProfileSidebar';
import { GameStatusCard } from '@/app/profile/components/GameStatusCard';
import { RecentActivityCard } from '@/app/profile/components/RecentActivityCard';
import { TeamHistoryCard } from '@/app/profile/components/TeamHistoryCard';
import { ReceivedReviewsCard } from '@/app/profile/components/ReceivedReviewsCard';

// --- [BARU FASE 3.5] Impor card-card baru ---
import { PlayerHeroesCard } from '@/app/profile/components/PlayerHeroesCard';
import { PlayerTroopsCard } from '@/app/profile/components/PlayerTroopsCard';
import { PlayerSpellsCard } from '@/app/profile/components/PlayerSpellsCard';
// --- [BARU FASE 7.2] Impor card pencapaian ---
import { PlayerAchievementsCard } from '@/app/profile/components/PlayerAchievementsCard';
// --- [AKHIR BARU FASE 7.2] ---

// --- Impor untuk Header Publik (dari page.tsx lama) ---
import { Button } from '@/app/components/ui/Button';
import { ExternalLinkIcon } from '@/app/components/icons';

// --- Props Interface ---
interface PlayerProfileClientProps {
  userProfile: UserProfile;
  recentPosts: FirestoreDocument<Post>[];
  clanHistory: FirestoreDocument<DocumentData>[];
  playerReviews: FirestoreDocument<PlayerReview>[];
}

/**
 * @component PlayerProfileClient
 * Client component yang merakit UI profil publik
 */
const PlayerProfileClient = ({
  userProfile,
  recentPosts,
  clanHistory,
  playerReviews,
}: PlayerProfileClientProps) => {
  // --- [MODIFIKASI FASE 2] State untuk data lengkap ---
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // --- [AKHIR MODIFIKASI FASE 2] ---

  // --- 1. Logika Turunan (Variabel) ---
  const isVerified = userProfile?.isVerified || false;
  const isFreeAgent = userProfile?.role === 'Free Agent' || !userProfile?.role;
  const isCompetitiveVision =
    userProfile?.playStyle === 'Attacker Utama' ||
    userProfile?.playStyle === 'Strategist';

  const cocProfileUrl =
    isVerified && userProfile?.playerTag
      ? `https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=${userProfile.playerTag.replace(
          '#',
          '',
        )}`
      : null;

  const inGameRole = userProfile?.clanRole || 'not in clan';

  const playerReviewsCount = playerReviews.length;
  const totalRating = playerReviews.reduce(
    (acc, review) => acc + review.rating,
    0,
  );
  const reputation =
    playerReviewsCount > 0 ? totalRating / playerReviewsCount : 0.0;

  const isClanManagerForPublicView = false;

  // --- [PERBAIKAN ERROR 404/JSON dan TS 2345] ---
  useEffect(() => {
    // [FIX 1] Salin tag ke const
    const tagToFetch = userProfile.playerTag;

    // Hanya jalankan jika ada playerTag di profil (dari Firebase)
    if (!tagToFetch) {
      setIsLoading(false);
      setError('Profil ini tidak memiliki CoC Player Tag terverifikasi.');
      return;
    }

    // [FIX 2] Encode tag di DILUAR async function (mengatasi ts(2345) juga)
    // Di sini, TypeScript tahu 'tagToFetch' adalah 'string' (bukan undefined)
    const encodedTagForApi = encodeURIComponent(tagToFetch);

    // [FIX 3] Modifikasi fungsi agar menerima 'encodedTag' sebagai argumen
    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoading(true);
      setError(null);
      try {
        // [FIX 4] Gunakan argumen 'encodedTag' yang sudah aman
        const response = await fetch(
          `/api/coc/get-player/${encodedTag}`, // URL sekarang aman
        );

        const data = await response.json(); // Coba parse dulu

        if (!response.ok) {
          // Tangani error JSON dari API route kita
          throw new Error(
            data.error || `Error ${response.status}: Gagal mengambil data player`,
          );
        }

        setFullPlayer(data as CocPlayer);

        // --- [BARU FASE 4.5] ---
        // Setelah berhasil fetch, kirim data ke API route untuk di-cache
        // "Fire and forget" - kita tidak perlu await di sini.
        // Ini adalah optimasi, jika gagal, user tidak perlu tahu.
        fetch('/api/player/update-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data), // 'data' adalah fullPlayer
        }).catch((cacheError) => {
          // Log error ke konsol, tapi jangan ganggu user
          console.warn(
            '[PlayerProfileClient] Gagal mengirim cache ke server:',
            cacheError,
          );
        });
        // --- [AKHIR BARU FASE 4.5] ---
      } catch (err) {
        console.error('[PlayerProfileClient] Gagal fetch data lengkap:', err);
        if (err instanceof Error) {
          // [FIX 5] Tangani error "Unexpected token"
          if (
            err.message.includes('Unexpected token') ||
            err.message.includes('not valid JSON')
          ) {
            setError(
              `Gagal parse JSON. Kemungkinan API route 404 (salah URL) atau server down.`,
            );
          } else {
            setError(err.message);
          }
        } else {
          setError(
            'Terjadi kesalahan yang tidak diketahui saat mengambil data CoC.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    // [FIX 6] Panggil fungsi dengan argumen yang sudah di-encode
    fetchFullPlayerData(encodedTagForApi);
  }, [userProfile.playerTag]); // Dependensi: userProfile.playerTag
  // --- [AKHIR PERBAIKAN] ---

  // --- 2. Render Komponen ---
  return (
    <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
      {/* --- Bagian 1: Header Publik (Tetap sama) --- */}
      <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
        <h2 className="text-2xl font-clash-bold text-white">Profil Pemain</h2>
        <div className="flex gap-4">
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
        {/* --- Kolom Kiri: Sidebar (Tetap sama, data dari Firebase) --- */}
        <ProfileSidebar
          userProfile={userProfile}
          isVerified={isVerified}
          isFreeAgent={isFreeAgent}
          isCompetitiveVision={isCompetitiveVision}
          isClanManager={isClanManagerForPublicView} // Selalu false di publik
          reputation={reputation}
          playerReviewsCount={playerReviewsCount}
        />

        {/* --- Kolom Kanan: Detail CV --- */}
        <section className="lg:col-span-3 space-y-8">
          {/* [MODIFIKASI FASE 2] Mengirim data lengkap ke GameStatusCard */}
          <GameStatusCard
            // Data ringkasan (dari Firebase) tetap dikirim untuk loading cepat
            userProfile={userProfile}
            isVerified={isVerified}
            isClanManager={isClanManagerForPublicView} // Selalu false di publik
            inGameRole={inGameRole}
            // [BARU] Kirim data lengkap dari API (hasil fetch), loading, dan error
            fullPlayerData={fullPlayer}
            isLoading={isLoading}
            error={error}
          />

          {/* --- [MODIFIKASI FASE 7.2] Tambahkan card baru DAN prop userProfile --- */}
          {/* Tampilkan card-card ini hanya jika terverifikasi */}
          {isVerified && (
            <>
              <PlayerHeroesCard
                userProfile={userProfile} // <-- Prop FASE 6 (cache read)
                fullPlayerData={fullPlayer}
                isLoading={isLoading}
                error={error}
              />
              <PlayerTroopsCard
                userProfile={userProfile} // <-- Prop FASE 6 (cache read)
                fullPlayerData={fullPlayer}
                isLoading={isLoading}
                error={error}
              />
              <PlayerSpellsCard
                userProfile={userProfile} // <-- Prop FASE 6 (cache read)
                fullPlayerData={fullPlayer}
                isLoading={isLoading}
                error={error}
              />
              <PlayerAchievementsCard
                userProfile={userProfile} // <-- Prop FASE 6 (cache read)
                fullPlayerData={fullPlayer}
                isLoading={isLoading}
                error={error}
              />
            </>
          )}
          {/* --- [AKHIR MODIFIKASI FASE 7.2] --- */}

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