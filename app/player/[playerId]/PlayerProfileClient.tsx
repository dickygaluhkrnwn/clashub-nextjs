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

// Import komponen Pet, Equipment, & Super Troops (Agar lengkap seperti profil pribadi)
import { PlayerPetsCard } from '@/app/profile/components/PlayerPetsCard';
import { PlayerEquipmentCard } from '@/app/profile/components/PlayerEquipmentCard';
import { PlayerSuperTroopsCard } from '@/app/profile/components/PlayerSuperTroopsCard';

import { ProfileTabs, ProfileTab } from '@/app/profile/components/ProfileTabs';
import { Button } from '@/app/components/ui/Button';
import { ExternalLinkIcon, MessageSquareIcon, PlusIcon, ShieldIcon, TrophyIcon, UserIcon } from '@/app/components/icons';

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
  const isClanManagerForPublicView = false; // View mode, not manage mode

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
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden">
      {/* --- GLOBAL ATMOSPHERE & BACKGROUNDS --- */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      <main className="relative z-10 max-w-7xl 2xl:max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 mt-4 md:mt-8">
        
        {/* Header Publik Responsive - Gaming Glass Card */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#15171e]/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-coc-gold/5 via-transparent to-transparent opacity-30 pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
              <div className="p-3 bg-coc-gold/10 rounded-2xl border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                <UserIcon className="h-8 w-8 text-coc-gold" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Player Profile</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white font-clash tracking-wide drop-shadow-md">
                  {userProfile.displayName}
                </h1>
              </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto relative z-10">
            {cocProfileUrl && (
              <Button
                href={cocProfileUrl}
                target="_blank"
                variant="outline"
                size="sm"
                className="border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 font-bold tracking-wide"
              >
                <ExternalLinkIcon className="h-4 w-4 mr-2" /> Profil CoC
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="bg-white/5 border-white/10 text-gray-500 cursor-not-allowed hover:bg-white/5"
            >
              <MessageSquareIcon className="h-4 w-4 mr-2" /> Pesan
            </Button>
            {isFreeAgent && (
                <Button
                variant="primary"
                size="sm"
                className="shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-gradient-to-br from-coc-gold to-yellow-600 border-yellow-500 text-black font-bold"
                >
                <PlusIcon className="h-4 w-4 mr-2" /> Undang
                </Button>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Sidebar (Desktop: 3 cols, Sticky) */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 z-20">
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
            
            {/* Sticky Tabs - Glass Control Panel */}
            <div className="sticky top-[72px] md:top-24 z-30 transition-all duration-300">
                <div className="bg-[#13151b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-lg shadow-black/50 ring-1 ring-white/5">
                    <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
              {/* [TAB 1] SUMMARY */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        isLoading={isLoading}
                        error={error}
                      />

                      {/* Equipment & Pets */}
                      <PlayerEquipmentCard
                        userProfile={userProfile}
                        fullPlayerData={fullPlayer}
                        isLoading={isLoading}
                        error={error}
                      />

                      <PlayerPetsCard
                        userProfile={userProfile}
                        fullPlayerData={fullPlayer}
                        isLoading={isLoading}
                        error={error}
                      />
                      
                      {/* Super Troops Active */}
                      <PlayerSuperTroopsCard
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
                    <div className="bg-[#1a1d26]/60 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center shadow-inner">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                         <ShieldIcon className="w-8 h-8 text-gray-500 opacity-50" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 font-clash">Data Tidak Tersedia</h3>
                      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Pemain ini belum menghubungkan tag Clash of Clans mereka, sehingga detail pasukan tidak dapat ditampilkan.
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
                      isLoading={isLoading}
                      error={error}
                    />
                  ) : (
                    <div className="bg-[#1a1d26]/60 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center shadow-inner">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                         <TrophyIcon className="w-8 h-8 text-gray-500 opacity-50" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 font-clash">Pencapaian Terkunci</h3>
                      <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Pemain ini belum menghubungkan tag Clash of Clans mereka.
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
};

export default PlayerProfileClient;