'use client';

// [MODIFIKASI FASE 4.4]: Menambahkan panggilan "fire-and-forget" ke /api/player/update-cache
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  UserProfile,
  Post,
  PlayerReview,
  FirestoreDocument,
  CocPlayer, // <-- [BARU FASE 3] Impor tipe data lengkap
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

// --- [BARU FASE 3.5] Impor card-card baru ---
import { PlayerHeroesCard } from './components/PlayerHeroesCard';
import { PlayerTroopsCard } from './components/PlayerTroopsCard';
import { PlayerSpellsCard } from './components/PlayerSpellsCard';
// --- [AKHIR BARU FASE 3.5] ---

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

  // --- [BARU FASE 3] State untuk data lengkap (Live dari API) ---
  const [fullPlayer, setFullPlayer] = useState<CocPlayer | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  // --- [AKHIR BARU FASE 3] ---

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

  // --- [PERBAIKAN ERROR TS 2345] ---
  useEffect(() => {
    const tagToFetch = userProfile?.playerTag;

    if (!tagToFetch) {
      setIsLoadingApi(false);
      if (userProfile?.isVerified) {
        setApiError('Profil ini terverifikasi namun player tag tidak ditemukan.');
      }
      return;
    }

    // [FIX 2345] Encode tag di DILUAR async function.
    // Di sini, TypeScript tahu 'tagToFetch' adalah 'string' (bukan undefined)
    // karena sudah lolos pengecekan 'if' di atas.
    const encodedTagForApi = encodeURIComponent(tagToFetch);

    // [FIX 2345] Modifikasi fungsi agar menerima 'encodedTag' sebagai argumen
    async function fetchFullPlayerData(encodedTag: string) {
      setIsLoadingApi(true);
      setApiError(null);
      try {
        // Gunakan argumen 'encodedTag' yang sudah aman
        const response = await fetch(
          `/api/coc/get-player/${encodedTag}`, // URL sekarang aman
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Error ${response.status}: Gagal mengambil data player`,
          );
        }

        setFullPlayer(data as CocPlayer);

        // --- [BARU FASE 4.4] ---
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
            '[ProfileClient] Gagal mengirim cache ke server:',
            cacheError,
          );
        });
        // --- [AKHIR BARU FASE 4.4] ---
      } catch (err) {
        console.error('[ProfileClient] Gagal fetch data lengkap:', err);
        if (err instanceof Error) {
          if (
            err.message.includes('Unexpected token') ||
            err.message.includes('not valid JSON')
          ) {
            setApiError(
              `Gagal parse JSON. Kemungkinan API route 404 (salah URL) atau server down.`,
            );
          } else {
            setApiError(err.message);
          }
        } else {
          setApiError(
            'Terjadi kesalahan yang tidak diketahui saat mengambil data CoC.',
          );
        }
      } finally {
        setIsLoadingApi(false);
      }
    }

    // [FIX 2345] Panggil fungsi dengan argumen yang sudah di-encode
    fetchFullPlayerData(encodedTagForApi);
  }, [userProfile?.playerTag]);
  // --- [AKHIR PERBAIKAN] ---

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

          <section className="lg:col-span-3 space-y-8">
            {/* [MODIFIKASI FASE 3] Kirim props baru ke GameStatusCard */}
            <GameStatusCard
              userProfile={userProfile}
              isVerified={isVerified}
              inGameRole={inGameRole}
              isClanManager={isClanManager}
              // Props baru untuk data live:
              fullPlayerData={fullPlayer}
              isLoading={isLoadingApi}
              error={apiError}
            />

            {/* --- [BARU FASE 3.5] Tambahkan card-card baru --- */}
            {/* Tampilkan card-card ini hanya jika terverifikasi */}
            {isVerified && (
              <>
                <PlayerHeroesCard
                  fullPlayerData={fullPlayer}
                  isLoading={isLoadingApi}
                  error={apiError}
                />
                <PlayerTroopsCard
                  fullPlayerData={fullPlayer}
                  isLoading={isLoadingApi}
                  error={apiError}
                />
                <PlayerSpellsCard
                  fullPlayerData={fullPlayer}
                  isLoading={isLoadingApi}
                  error={apiError}
                />
              </>
            )}
            {/* --- [AKHIR BARU FASE 3.5] --- */}

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