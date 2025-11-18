// File: app/player/[playerId]/PlayerProfileClient.tsx
// Deskripsi: Client Component untuk Halaman Profil Publik.
// [MODIFIKASI FASE 11.4.2]: Integrasi Layout Summary Baru (Grid Klan & TH + Stats)

'use client';

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
import { CocPlayer } from '@/lib/coc.types';

// --- Impor Komponen UI ---
import { ProfileSidebar } from '@/app/profile/components/ProfileSidebar';
import { GameStatusCard } from '@/app/profile/components/GameStatusCard';
import { RecentActivityCard } from '@/app/profile/components/RecentActivityCard';
import { TeamHistoryCard } from '@/app/profile/components/TeamHistoryCard';
import { ReceivedReviewsCard } from '@/app/profile/components/ReceivedReviewsCard';

// --- Impor Card Data Lengkap ---
import { PlayerHeroesCard } from '@/app/profile/components/PlayerHeroesCard';
import { PlayerTroopsCard } from '@/app/profile/components/PlayerTroopsCard';
import { PlayerSpellsCard } from '@/app/profile/components/PlayerSpellsCard';
import { PlayerAchievementsCard } from '@/app/profile/components/PlayerAchievementsCard';

// --- [BARU FASE 11.4] Impor Card Identitas Baru ---
import { PlayerClanCard } from '@/app/profile/components/PlayerClanCard';
import { PlayerTownHallCard } from '@/app/profile/components/PlayerTownHallCard';

// --- Impor Komponen Tabs ---
import { ProfileTabs, ProfileTab } from '@/app/profile/components/ProfileTabs';

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
  // State untuk data lengkap
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');

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

  // --- [SMART CACHE V2 & FETCHING] ---
  useEffect(() => {
    const tagToFetch = userProfile.playerTag;

    if (!tagToFetch) {
      setIsLoading(false);
      setError('Profil ini tidak memiliki CoC Player Tag terverifikasi.');
      return;
    }

    // [SMART CACHE V2] Durasi 60 Menit
    const CACHE_DURATION_MINUTES = 60;
    if (userProfile?.lastCacheTimestamp) {
      const lastCacheTime = new Date(userProfile.lastCacheTimestamp).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastCacheTime) / (1000 * 60);

      if (diffMinutes < CACHE_DURATION_MINUTES) {
        console.log(
          `[PlayerProfileClient] Menggunakan data cache (Umur: ${diffMinutes.toFixed(
            1,
          )} menit). Skip fetch API.`
        );
        setIsLoading(false);
        return;
      }
    }

    const encodedTagForApi = encodeURIComponent(tagToFetch);

    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/coc/get-player/${encodedTag}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Error ${response.status}: Gagal mengambil data player`,
          );
        }

        setFullPlayer(data as CocPlayer);

        // Fire-and-forget update cache
        fetch('/api/player/update-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch((cacheError) => {
          console.warn(
            '[PlayerProfileClient] Gagal mengirim cache ke server:',
            cacheError,
          );
        });
      } catch (err) {
        console.error('[PlayerProfileClient] Gagal fetch data lengkap:', err);
        if (err instanceof Error) {
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

    fetchFullPlayerData(encodedTagForApi);
  }, [userProfile.playerTag, userProfile?.lastCacheTimestamp]);

  // --- 2. Render Komponen ---
  return (
    <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
      {/* Header Publik */}
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

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <ProfileSidebar
          userProfile={userProfile}
          isVerified={isVerified}
          isFreeAgent={isFreeAgent}
          isCompetitiveVision={isCompetitiveVision}
          isClanManager={isClanManagerForPublicView}
          reputation={reputation}
          playerReviewsCount={playerReviewsCount}
        />

        <section className="lg:col-span-3 space-y-6">
          {/* Navigasi Tab */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* [TAB 1] SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* [GRID IDENTITAS BARU] Klan & Town Hall */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlayerClanCard
                  userProfile={userProfile}
                  fullPlayerData={fullPlayer}
                  isLoading={isLoading}
                />
                <PlayerTownHallCard
                  userProfile={userProfile}
                  fullPlayerData={fullPlayer}
                  isLoading={isLoading}
                />
              </div>

              {/* [STATS GRID BARU] GameStatusCard (Refactored) */}
              <GameStatusCard
                userProfile={userProfile}
                isVerified={isVerified}
                isClanManager={isClanManagerForPublicView}
                inGameRole={inGameRole}
                fullPlayerData={fullPlayer}
                isLoading={isLoading}
                error={error}
              />

              {/* Preview 1 Postingan Terbaru */}
              <RecentActivityCard
                recentPosts={recentPosts.slice(0, 1)}
                userProfile={userProfile}
              />
            </div>
          )}

          {/* [TAB 2] REPUTASI */}
          {activeTab === 'reputation' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ReceivedReviewsCard playerReviews={playerReviews} />
            </div>
          )}

          {/* [TAB 3] ARMY */}
          {activeTab === 'army' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {isVerified ? (
                <>
                  <PlayerHeroesCard
                    userProfile={userProfile}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoading}
                    error={error}
                  />
                  <PlayerTroopsCard
                    userProfile={userProfile}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoading}
                    error={error}
                  />
                  <PlayerSpellsCard
                    userProfile={userProfile}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoading}
                    error={error}
                  />
                </>
              ) : (
                <div className="card-stone p-8 text-center">
                  <p className="text-gray-400">
                    Pemain ini belum menghubungkan tag Clash of Clans mereka.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* [TAB 4] ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {isVerified ? (
                <PlayerAchievementsCard
                  userProfile={userProfile}
                  fullPlayerData={fullPlayer}
                  isLoading={isLoading}
                  error={error}
                />
              ) : (
                <div className="card-stone p-8 text-center">
                  <p className="text-gray-400">
                    Pemain ini belum menghubungkan tag Clash of Clans mereka.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* [TAB 5] HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <TeamHistoryCard clanHistory={clanHistory} />
            </div>
          )}

          {/* [TAB 6] POSTINGAN */}
          {activeTab === 'posts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <RecentActivityCard
                recentPosts={recentPosts} // Semua Postingan
                userProfile={userProfile}
              />
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default PlayerProfileClient;