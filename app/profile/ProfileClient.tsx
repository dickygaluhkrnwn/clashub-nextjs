'use client';

// [PHASE 1]: Foundation & Layout Overhaul (Gaming Atmosphere)
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

// Import komponen Pet, Equipment, & Super Troops
import { PlayerPetsCard } from './components/PlayerPetsCard';
import { PlayerEquipmentCard } from './components/PlayerEquipmentCard';
import { PlayerSuperTroopsCard } from './components/PlayerSuperTroopsCard';

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

  // --- 4. Render Layout (Gaming Atmosphere) ---
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
      <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden selection:bg-coc-gold/30">
        {/* --- GLOBAL ATMOSPHERE & BACKGROUNDS --- */}
        
        {/* 1. Base Dark Texture (Noise/Grain Simulation using CSS) */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

        {/* 2. Primary Spotlight (Top Center - Blue/Magical) */}
        <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-gradient-to-b from-[#1a2c4e] via-[#0f1520]/80 to-transparent blur-[120px] pointer-events-none z-0" />

        {/* 3. Secondary Accent Glow (Top Right - Gold/Legendary) */}
        <div className="fixed top-[5%] right-[-5%] w-[400px] h-[400px] bg-coc-gold/5 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* 4. Bottom Depth (Dark Fade) */}
        <div className="fixed bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-black via-[#0a0a0b] to-transparent pointer-events-none z-0" />


        {/* --- MAIN CONTENT CONTAINER --- */}
        <main className="relative z-10 max-w-7xl 2xl:max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-8 mt-6">
          
          {/* Header Section */}
          <div className="relative">
            <ProfileHeader
              isVerified={isVerified}
              inGameName={userProfile.inGameName}
              displayName={userProfile.displayName}
              cocProfileUrl={cocProfileUrl}
            />
          </div>

          {/* Responsive Grid Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Sidebar (Desktop: 3 cols, Sticky) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-6 z-20">
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

            {/* Right Main Content (Desktop: 9 cols) */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Navigation Tabs - Glass Control Panel */}
              <div className="sticky top-[72px] md:top-24 z-30 transition-all duration-300">
                <div className="bg-[#13151b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-lg shadow-black/50 ring-1 ring-white/5">
                  <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
              </div>

              {/* Tab Panels */}
              <div className="min-h-[500px]">
                {/* [TAB 1] SUMMARY */}
                {activeTab === 'summary' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ReceivedReviewsCard playerReviews={playerReviews} />
                  </div>
                )}

                {/* [TAB 3] ARMY */}
                {activeTab === 'army' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isVerified ? (
                      <>
                        <PlayerHeroesCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />

                        {/* Equipment & Pets */}
                        <PlayerEquipmentCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />

                        <PlayerPetsCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />
                        
                        {/* Super Troops Active */}
                        <PlayerSuperTroopsCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />

                        {/* Main Troops */}
                        <PlayerTroopsCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />
                        
                        {/* Spells */}
                        <PlayerSpellsCard
                          userProfile={userProfile}
                          fullPlayerData={fullPlayer}
                          isLoading={isLoadingApi}
                          error={apiError}
                        />
                      </>
                    ) : (
                      <div className="bg-[#1a1d26]/60 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center shadow-inner">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.profile.connectTagDesc}</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                          Hubungkan Player Tag Anda untuk melihat statistik pasukan lengkap secara real-time.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* [TAB 4] ACHIEVEMENTS */}
                {activeTab === 'achievements' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isVerified ? (
                      <PlayerAchievementsCard
                        userProfile={userProfile}
                        fullPlayerData={fullPlayer}
                        isLoading={isLoadingApi}
                        error={apiError}
                      />
                    ) : (
                      <div className="bg-[#1a1d26]/60 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center shadow-inner">
                        <p className="text-gray-400">
                          {t.profile.connectTagAchievements}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* [TAB 5] HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TeamHistoryCard clanHistory={clanHistory} />
                  </div>
                )}

                {/* [TAB 6] POSTS */}
                {activeTab === 'posts' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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