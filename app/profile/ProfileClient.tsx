'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase/firestore';

// [REFACTOR] Impor 8 komponen baru
import { ProfileLoading } from './components/ProfileLoading';
import { ProfileError } from './components/ProfileError';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileSidebar } from './components/ProfileSidebar';
import { GameStatusCard } from './components/GameStatusCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { TeamHistoryCard } from './components/TeamHistoryCard';
import { ReceivedReviewsCard } from './components/ReceivedReviewsCard';

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
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [error] = useState<string | null>(serverError);
  const [userProfile] = useState<UserProfile | null>(initialProfile);

  // --- 1. Handle Loading Auth Awal ---
  if (authLoading) {
    // [REFACTOR] Menggunakan komponen Loading
    return <ProfileLoading />;
  }

  // --- 2. Handle Error ---
  const isMissingProfile =
    !userProfile &&
    error &&
    error.includes('Profil E-Sports CV Anda belum ditemukan');

  if (isMissingProfile) {
    // [REFACTOR] Menggunakan komponen Error
    // [FIX] onRetry tidak diperlukan untuk case 'missing profile'
    return <ProfileError error={error} isMissingProfile={true} />;
  }

  if (!userProfile && error) {
    // [REFACTOR] Menggunakan komponen Error
    return (
      <ProfileError
        error={error}
        isMissingProfile={false}
        onRetry={() => router.refresh()} // [FIX] Prop onRetry dikirim ke komponen
      />
    );
  }

  // --- 3. Tampilkan Profil Jika Semua OK ---
  if (currentUser && userProfile) {
    // --- VARIABEL LOGIKA UNTUK PROPS ---
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

    // [PERBAIKAN] Logika reputasi disamakan dengan profil publik (default 0.0)
    const playerReviewsCount = playerReviews.length;
    const totalRating = playerReviews.reduce(
      (acc, review) => acc + review.rating,
      0,
    );
    // Jika 0 ulasan, reputasi = 0.0. Jika ada, hitung rata-ratanya.
    const reputation =
      playerReviewsCount > 0 ? totalRating / playerReviewsCount : 0.0;
    // --- AKHIR PERBAIKAN ---

    // [FIX] Hapus logika:
    // - cleanUrlDisplay (pindah ke ProfileSidebar)
    // - validThLevel (pindah ke GameStatusCard)
    // - thImage (pindah ke GameStatusCard)
    // - avatarSrc (pindah ke ProfileSidebar)

    // [REFACTOR] Merakit halaman menggunakan komponen-komponen baru
    return (
      <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
        <ProfileHeader
          isVerified={isVerified}
          inGameName={userProfile.inGameName} // [FIX] Tipe inGameName (string | undefined) sudah ditangani di ProfileHeader
          displayName={userProfile.displayName}
          cocProfileUrl={cocProfileUrl}
        />

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ProfileSidebar
            userProfile={userProfile}
            isVerified={isVerified}
            isFreeAgent={isFreeAgent}
            isCompetitiveVision={isCompetitiveVision}
            reputation={reputation} // <-- Reputasi yang sudah diperbaiki
            playerReviewsCount={playerReviews.length} // [FIX] Mengirim prop 'playerReviewsCount'
            isClanManager={isClanManager}
          />

          <section className="lg:col-span-3 space-y-8">
            <GameStatusCard
              userProfile={userProfile}
              isVerified={isVerified}
              inGameRole={inGameRole}
              isClanManager={isClanManager}
              // [FIX] Props thImage dan validThLevel dihapus (sudah dihandle di dalam komponen)
            />

            <RecentActivityCard
              recentPosts={recentPosts}
              userProfile={userProfile}
            />

            <TeamHistoryCard clanHistory={clanHistory} />

            <ReceivedReviewsCard playerReviews={playerReviews} />
          </section>
        </section>
      </main>
    );
  }

  return null; // Fallback jika state tidak terduga
};

export default ProfileClient;