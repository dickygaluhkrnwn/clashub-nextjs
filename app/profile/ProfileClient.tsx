'use client';

// [MODIFIKASI FASE 2]: Structure & Layout Overhaul (Glass-Stone)
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
import { useLanguage } from '@/lib/hooks/useLanguage';

// UI Components
import { ProfileLoading } from './components/ProfileLoading';
import { ProfileError } from './components/ProfileError';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileSidebar } from './components/ProfileSidebar';
import { GameStatusCard } from './components/GameStatusCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { TeamHistoryCard } from './components/TeamHistoryCard';
import { ReceivedReviewsCard } from './components/ReceivedReviewsCard';

import { PlayerHeroesCard } from './components/PlayerHeroesCard';
import { PlayerTroopsCard } from './components/PlayerTroopsCard';
import { PlayerSpellsCard } from './components/PlayerSpellsCard';
import { PlayerAchievementsCard } from './components/PlayerAchievementsCard';
import { PlayerClanCard } from './components/PlayerClanCard';
import { PlayerTownHallCard } from './components/PlayerTownHallCard';

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
  const { t } = useLanguage();
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [error] = useState<string | null>(serverError);
  const [userProfile] = useState<UserProfile | null>(initialProfile);

  // Data States
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');

  // --- 1. Handle Loading & Auth ---
  if (authLoading) {
    return <ProfileLoading />;
  }

  // --- 2. Handle Errors ---
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

  // --- 3. Fetch Logic (Smart Cache) ---
  useEffect(() => {
    const tagToFetch = userProfile?.playerTag;

    if (!tagToFetch) {
      setIsLoadingApi(false);
      if (userProfile?.isVerified) {
        setApiError(t.profile.errorVerifiedNoTag);
      }
      return;
    }

    const CACHE_DURATION_MINUTES = 60;
    if (userProfile?.lastCacheTimestamp) {
      const lastCacheTime = new Date(userProfile.lastCacheTimestamp).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastCacheTime) / (1000 * 60);

      if (diffMinutes < CACHE_DURATION_MINUTES) {
        console.log(
          `[ProfileClient] Using cached data (Age: ${diffMinutes.toFixed(1)} min).`
        );
        setIsLoadingApi(false);
        return;
      }
    }

    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoadingApi(true);
      setApiError(null);
      try {
        const response = await fetch(`/api/coc/get-player/${encodedTag}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }

        setFullPlayer(data as CocPlayer);

        // Update cache silently
        fetch('/api/player/update-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch((e) => console.warn('Cache update failed:', e));
      } catch (err) {
        console.error('[ProfileClient] Fetch error:', err);
        if (err instanceof Error) {
          setApiError(
            err.message.includes('JSON') ? t.profile.errorJson : err.message
          );
        } else {
          setApiError(t.profile.errorUnknown);
        }
      } finally {
        setIsLoadingApi(false);
      }
    }

    fetchFullPlayerData(encodeURIComponent(tagToFetch));
  }, [userProfile?.playerTag, userProfile?.lastCacheTimestamp, t, userProfile?.isVerified]);

  // --- 4. Render Layout (Glass-Stone) ---
  if (currentUser && userProfile) {
    const isClanManager =
      userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';
    const isVerified = userProfile?.isVerified || false;
    const isFreeAgent = userProfile?.role === 'Free Agent' || !userProfile?.role;
    const isCompetitiveVision =
      userProfile?.playStyle === 'Attacker Utama' ||
      userProfile?.playStyle === 'Strategist';

    const cocProfileUrl =
      isVerified && userProfile?.playerTag
        ? `https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=${userProfile.playerTag.replace('#','')}`
        : null;

    const inGameRole = userProfile?.clanRole || 'not in clan';
    const playerReviewsCount = playerReviews.length;
    const totalRating = playerReviews.reduce((acc, r) => acc + r.rating, 0);
    const reputation =
      playerReviewsCount > 0 ? totalRating / playerReviewsCount : 0.0;

    return (
      <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden">
        {/* Ambient Background Glows */}
        <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
        <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

        {/* Main Content Container */}
        <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 mt-4 md:mt-8">
          {/* Header Section */}
          <ProfileHeader
            isVerified={isVerified}
            inGameName={userProfile.inGameName}
            displayName={userProfile.displayName}
            cocProfileUrl={cocProfileUrl}
          />

          {/* Responsive Grid Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Left Sidebar (Desktop: 3 cols, Mobile: Full) */}
            <aside className="lg:col-span-3 space-y-6 h-fit lg:sticky lg:top-24">
              <ProfileSidebar
                userProfile={userProfile}
                isVerified={isVerified}
                isFreeAgent={isFreeAgent}
                isCompetitiveVision={isCompetitiveVision}
                reputation={reputation}
                playerReviewsCount={playerReviews.length}
                isClanManager={isClanManager}
              />
            </aside>

            {/* Right Main Content (Desktop: 9 cols, Mobile: Full) */}
            <div className="lg:col-span-9 space-y-6">
              {/* Navigation Tabs */}
              <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1.5 sticky top-20 z-40 md:static">
                <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>

              {/* Tab Panels */}
              <div className="min-h-[400px]">
                {/* [TAB 1] SUMMARY */}
                {activeTab === 'summary' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

                    <GameStatusCard
                      userProfile={userProfile}
                      isVerified={isVerified}
                      inGameRole={inGameRole}
                      isClanManager={isClanManager}
                      fullPlayerData={fullPlayer}
                      isLoading={isLoadingApi}
                      error={apiError}
                    />

                    <RecentActivityCard
                      recentPosts={recentPosts.slice(0, 1)}
                      userProfile={userProfile}
                    />
                  </div>
                )}

                {/* [TAB 2] REPUTATION */}
                {activeTab === 'reputation' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ReceivedReviewsCard playerReviews={playerReviews} />
                  </div>
                )}

                {/* [TAB 3] ARMY */}
                {activeTab === 'army' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                      <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
                        <p className="text-gray-400">{t.profile.connectTagDesc}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* [TAB 4] ACHIEVEMENTS */}
                {activeTab === 'achievements' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {isVerified ? (
                      <PlayerAchievementsCard
                        userProfile={userProfile}
                        fullPlayerData={fullPlayer}
                        isLoading={isLoadingApi}
                        error={apiError}
                      />
                    ) : (
                      <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
                        <p className="text-gray-400">
                          {t.profile.connectTagAchievements}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* [TAB 5] HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <TeamHistoryCard clanHistory={clanHistory} />
                  </div>
                )}

                {/* [TAB 6] POSTS */}
                {activeTab === 'posts' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <RecentActivityCard
                      recentPosts={recentPosts}
                      userProfile={userProfile}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return null;
};

export default ProfileClient;