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

import { ProfileSidebar } from '@/app/profile/components/ProfileSidebar';
import { GameStatusCard } from '@/app/profile/components/GameStatusCard';
import { RecentActivityCard } from '@/app/profile/components/RecentActivityCard';
import { TeamHistoryCard } from '@/app/profile/components/TeamHistoryCard';
import { ReceivedReviewsCard } from '@/app/profile/components/ReceivedReviewsCard';

import { PlayerHeroesCard } from '@/app/profile/components/PlayerHeroesCard';
import { PlayerTroopsCard } from '@/app/profile/components/PlayerTroopsCard';
import { PlayerSpellsCard } from '@/app/profile/components/PlayerSpellsCard';
import { PlayerAchievementsCard } from '@/app/profile/components/PlayerAchievementsCard';

import { PlayerClanCard } from '@/app/profile/components/PlayerClanCard';
import { PlayerTownHallCard } from '@/app/profile/components/PlayerTownHallCard';

import { ProfileTabs, ProfileTab } from '@/app/profile/components/ProfileTabs';
import { Button } from '@/app/components/ui/Button';
import { ExternalLinkIcon, MessageSquareIcon, PlusIcon, UserIcon } from '@/app/components/icons';

interface PlayerProfileClientProps {
  userProfile: UserProfile;
  recentPosts: FirestoreDocument<Post>[];
  clanHistory: FirestoreDocument<DocumentData>[];
  playerReviews: FirestoreDocument<PlayerReview>[];
}

const PlayerProfileClient = ({
  userProfile,
  recentPosts,
  clanHistory,
  playerReviews,
}: PlayerProfileClientProps) => {
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');

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
  const totalRating = playerReviews.reduce((acc, review) => acc + review.rating, 0);
  const reputation = playerReviewsCount > 0 ? totalRating / playerReviewsCount : 0.0;
  const isClanManagerForPublicView = false;

  useEffect(() => {
    const tagToFetch = userProfile.playerTag;

    if (!tagToFetch) {
      setIsLoading(false);
      // Jika verified tapi tidak ada tag (kasus jarang), set error
      if (isVerified) setError('Player Tag tidak ditemukan.');
      return;
    }

    const CACHE_DURATION_MINUTES = 60;
    if (userProfile?.lastCacheTimestamp) {
      const lastCacheTime = new Date(userProfile.lastCacheTimestamp).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastCacheTime) / (1000 * 60);

      if (diffMinutes < CACHE_DURATION_MINUTES) {
        console.log(`[PlayerProfileClient] Using cached data (Age: ${diffMinutes.toFixed(1)} min).`);
        setIsLoading(false);
        return;
      }
    }

    const encodedTagForApi = encodeURIComponent(tagToFetch);

    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/coc/get-player/${encodedTag}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }

        setFullPlayer(data as CocPlayer);

        fetch('/api/player/update-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch((e) => console.warn('Cache update failed:', e));
      } catch (err) {
        console.error('[PlayerProfileClient] Fetch error:', err);
        if (err instanceof Error) {
          if (err.message.includes('JSON')) {
            setError(`Gagal mengambil data CoC (API Error).`);
          } else {
            setError(err.message);
          }
        } else {
          setError('Terjadi kesalahan tidak dikenal.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchFullPlayerData(encodedTagForApi);
  }, [userProfile.playerTag, userProfile?.lastCacheTimestamp, isVerified]);

  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 mt-4 md:mt-8">
        {/* Header Publik Responsive */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-white/5 rounded-full">
                <UserIcon className="h-6 w-6 text-coc-gold" />
             </div>
             <h1 className="text-2xl md:text-3xl font-bold text-white">
                Profil Pemain
             </h1>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
            {cocProfileUrl && (
              <Button
                href={cocProfileUrl}
                target="_blank"
                variant="outline"
                size="sm"
                className="border-white/10 hover:border-coc-blue/50 hover:bg-coc-blue/10 text-coc-blue"
              >
                <ExternalLinkIcon className="h-4 w-4 mr-2" /> Profil CoC
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              <MessageSquareIcon className="h-4 w-4 mr-2" /> Pesan
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!isFreeAgent}
              className="shadow-lg shadow-coc-gold/10"
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Undang
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Sidebar (Desktop: 3 cols) */}
          <aside className="lg:col-span-3 space-y-6 h-fit lg:sticky lg:top-24">
            <ProfileSidebar
              userProfile={userProfile}
              isVerified={isVerified}
              isFreeAgent={isFreeAgent}
              isCompetitiveVision={isCompetitiveVision}
              isClanManager={isClanManagerForPublicView}
              reputation={reputation}
              playerReviewsCount={playerReviewsCount}
            />
          </aside>

          {/* Right Content (Desktop: 9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            {/* Sticky Tabs */}
            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-1.5 sticky top-20 z-40 md:static">
              <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {/* [TAB 1] SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

                  <GameStatusCard
                    userProfile={userProfile}
                    isVerified={isVerified}
                    isClanManager={isClanManagerForPublicView}
                    inGameRole={inGameRole}
                    fullPlayerData={fullPlayer}
                    isLoading={isLoading}
                    error={error}
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
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
                      <p className="text-gray-400">
                        Pemain ini belum menghubungkan tag Clash of Clans mereka.
                      </p>
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
                      isLoading={isLoading}
                      error={error}
                    />
                  ) : (
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
                      <p className="text-gray-400">
                        Pemain ini belum menghubungkan tag Clash of Clans mereka.
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
};

export default PlayerProfileClient;