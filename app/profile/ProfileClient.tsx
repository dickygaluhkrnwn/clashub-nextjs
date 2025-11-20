'use client';

// [MODIFIKASI FASE 11.4]: Integrasi Layout Summary Baru (Grid Klan & TH + Stats)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
  CocPlayer,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';
// [BARU] Import Hook Bahasa
import { useLanguage } from '@/lib/hooks/useLanguage';

// Impor komponen UI
import { ProfileLoading } from './components/ProfileLoading';
import { ProfileError } from './components/ProfileError';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileSidebar } from './components/ProfileSidebar';
import { GameStatusCard } from './components/GameStatusCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { TeamHistoryCard } from './components/TeamHistoryCard';
import { ReceivedReviewsCard } from './components/ReceivedReviewsCard';

// Impor card-card data lengkap
import { PlayerHeroesCard } from './components/PlayerHeroesCard';
import { PlayerTroopsCard } from './components/PlayerTroopsCard';
import { PlayerSpellsCard } from './components/PlayerSpellsCard';
import { PlayerAchievementsCard } from './components/PlayerAchievementsCard';

// [BARU FASE 11.4] Impor Card Identitas Baru
import { PlayerClanCard } from './components/PlayerClanCard';
import { PlayerTownHallCard } from './components/PlayerTownHallCard';

// Impor komponen Tabs
import { ProfileTabs, ProfileTab } from './components/ProfileTabs';

interface ProfileClientProps {
  initialProfile: UserProfile | null;
  serverError: string | null;
  recentPosts: FirestoreDocument<Post>[];
  clanHistory: FirestoreDocument<DocumentData>[];
  playerReviews: FirestoreDocument<PlayerReview>[];
}

const ProfileClient = ({
  initialProfile,
  serverError,
  recentPosts,
  clanHistory,
  playerReviews,
}: ProfileClientProps) => {
  const { t } = useLanguage(); // [BARU] Init Hook
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [error] = useState<string | null>(serverError);
  const [userProfile] = useState<UserProfile | null>(initialProfile);

  // State untuk data lengkap (Live dari API)
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // State untuk Tab Aktif
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');

  // --- 1. Handle Loading Auth Awal ---
  if (authLoading) {
    return <ProfileLoading />;
  }

  // --- 2. Handle Error ---
  const isMissingProfile =
    !userProfile &&
    error &&
    error.includes('Profil E-Sports CV Anda belum ditemukan');

  if (isMissingProfile) {
    return <ProfileError error={error} isMissingProfile={true} />;
  }

  if (!userProfile && error) {
    return (
      <ProfileError
        error={error}
        isMissingProfile={false}
        onRetry={() => router.refresh()}
      />
    );
  }

  // --- 3. Fetch Data & Smart Cache V2 ---
  useEffect(() => {
    const tagToFetch = userProfile?.playerTag;

    if (!tagToFetch) {
      setIsLoadingApi(false);
      if (userProfile?.isVerified) {
        // [TERJEMAHAN] Menggunakan key dari kamus
        setApiError(t.profile.errorVerifiedNoTag);
      }
      return;
    }

    // [SMART CACHE V2] Durasi 60 menit
    const CACHE_DURATION_MINUTES = 60; 
    
    if (userProfile?.lastCacheTimestamp) {
      const lastCacheTime = new Date(userProfile.lastCacheTimestamp).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastCacheTime) / (1000 * 60);

      if (diffMinutes < CACHE_DURATION_MINUTES) {
        console.log(
          `[ProfileClient] Menggunakan data cache (Umur: ${diffMinutes.toFixed(
            1,
          )} menit). Skip fetch API.`
        );
        setIsLoadingApi(false);
        return; 
      }
    }

    const encodedTagForApi = encodeURIComponent(tagToFetch);

    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoadingApi(true);
      setApiError(null);
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

        // Fire and forget: Update cache
        fetch('/api/player/update-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch((cacheError) => {
          console.warn(
            '[ProfileClient] Gagal mengirim cache ke server:',
            cacheError,
          );
        });
      } catch (err) {
        console.error('[ProfileClient] Gagal fetch data lengkap:', err);
        if (err instanceof Error) {
          if (
            err.message.includes('Unexpected token') ||
            err.message.includes('not valid JSON')
          ) {
            // [TERJEMAHAN]
            setApiError(t.profile.errorJson);
          } else {
            setApiError(err.message);
          }
        } else {
          // [TERJEMAHAN]
          setApiError(t.profile.errorUnknown);
        }
      } finally {
        setIsLoadingApi(false);
      }
    }

    fetchFullPlayerData(encodedTagForApi);
  }, [userProfile?.playerTag, userProfile?.lastCacheTimestamp, t]); // Add 't' dependency

  // --- 4. Render Halaman ---
  if (currentUser && userProfile) {
    // Props Logika
    const isClanManager =
      userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';
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

    return (
      <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
        <ProfileHeader
          isVerified={isVerified}
          inGameName={userProfile.inGameName}
          displayName={userProfile.displayName}
          cocProfileUrl={cocProfileUrl}
        />

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ProfileSidebar
            userProfile={userProfile}
            isVerified={isVerified}
            isFreeAgent={isFreeAgent}
            isCompetitiveVision={isCompetitiveVision}
            reputation={reputation}
            playerReviewsCount={playerReviews.length}
            isClanManager={isClanManager}
          />

          <section className="lg:col-span-3 space-y-6">
            {/* Navigasi Tab */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* [TAB 1] SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* [MODIFIKASI FASE 11.4] Grid Identitas: Klan & Town Hall */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PlayerClanCard
                    userProfile={userProfile}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoadingApi}
                  />
                  <PlayerTownHallCard
                    userProfile={userProfile}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoadingApi}
                  />
                </div>

                {/* [MODIFIKASI FASE 11.4] Stats Grid (GameStatusCard Baru) */}
                <GameStatusCard
                  userProfile={userProfile}
                  isVerified={isVerified}
                  inGameRole={inGameRole}
                  isClanManager={isClanManager}
                  fullPlayerData={fullPlayer}
                  isLoading={isLoadingApi}
                  error={apiError}
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
                      isLoading={isLoadingApi}
                      error={apiError}
                    />
                    <PlayerTroopsCard
                      userProfile={userProfile}
                      fullPlayerData={fullPlayer}
                      isLoading={isLoadingApi}
                      error={apiError}
                    />
                    <PlayerSpellsCard
                      userProfile={userProfile}
                      fullPlayerData={fullPlayer}
                      isLoading={isLoadingApi}
                      error={apiError}
                    />
                  </>
                ) : (
                  <div className="card-stone p-8 text-center">
                    <p className="text-gray-400">
                      {/* [TERJEMAHAN] */}
                      {t.profile.connectTagDesc}
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
                    isLoading={isLoadingApi}
                    error={apiError}
                  />
                ) : (
                  <div className="card-stone p-8 text-center">
                    <p className="text-gray-400">
                      {/* [TERJEMAHAN] */}
                      {t.profile.connectTagAchievements}
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
                  recentPosts={recentPosts} // Tampilkan semua postingan
                  userProfile={userProfile}
                />
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }

  return null;
};

export default ProfileClient;