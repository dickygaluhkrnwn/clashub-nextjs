import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/server-auth';

// Admin SDK Imports
import {
  getUserProfileAdmin,
  getClanHistoryAdmin,
  getPlayerReviewsAdmin,
} from '@/lib/firestore-admin/users';
import { getPostsByAuthorAdmin } from '@/lib/firestore-admin/posts';

// Auto-Fix Imports
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

import cocApi from '@/lib/coc-api';
import ProfileClient from './ProfileClient';

// Types
import {
  UserProfile,
  ClanRole,
  Post,
  CocPlayer,
  PlayerReview,
  FirestoreDocument,
} from '@/lib/types';
import { DocumentData } from 'firebase-admin/firestore';

export const metadata: Metadata = {
  title: 'Clashub | E-Sports CV Anda',
  description: 'Lihat dan kelola E-Sports CV Clash of Clans Anda.',
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// --- Helpers ---
const mapCocRoleToClanRole = (cocRole?: string): ClanRole => {
  switch (cocRole?.toLowerCase()) {
    case 'leader':
      return ClanRole.LEADER;
    case 'coleader':
      return ClanRole.CO_LEADER;
    case 'admin':
      return ClanRole.ELDER;
    case 'member':
      return ClanRole.MEMBER;
    default:
      return ClanRole.NOT_IN_CLAN;
  }
};

const mapCocRoleToClashubRole = (cocRole?: string): UserProfile['role'] => {
  const roleStr = cocRole?.toLowerCase();
  if (roleStr === 'leader') return 'Leader';
  if (roleStr === 'coleader') return 'Co-Leader';
  if (roleStr === 'admin') return 'Elder';
  if (roleStr === 'member') return 'Member';
  return 'Free Agent';
};

const ProfilePage = async () => {
  let profileData: UserProfile | null = null;
  let serverError: string | null = null;
  let recentPosts: FirestoreDocument<Post>[] = [];
  let clanHistory: FirestoreDocument<DocumentData>[] = [];
  let playerReviews: FirestoreDocument<PlayerReview>[] = [];

  // 1. Get Session
  const sessionUser = await getSessionUser();

  try {
    if (sessionUser) {
      // 2. Fetch Profile
      profileData = await getUserProfileAdmin(sessionUser.uid);

      if (!profileData) {
        // NEW PROFILE CASE
        serverError =
          'Profil E-Sports CV Anda belum ditemukan. Silakan lengkapi data Anda di halaman Edit Profil.';

        profileData = {
          uid: sessionUser.uid,
          email: sessionUser.email || null,
          displayName:
            sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
          isVerified: false,
          playerTag: '',
          inGameName: undefined,
          thLevel: 9,
          trophies: 0,
          clanTag: null,
          clanRole: ClanRole.NOT_IN_CLAN,
          lastVerified: undefined,
          role: 'Free Agent',
          playStyle: undefined,
          activeHours: '',
          reputation: 5.0,
          avatarUrl: '/images/placeholder-avatar.png',
          discordId: null,
          website: null,
          bio: '',
          clanId: null,
          clanName: null,
        } as UserProfile;
      } else {
        // EXISTING PROFILE CASE
        serverError = null;

        // --- Live Data & Auto-Fix Logic ---
        if (profileData.isVerified && profileData.playerTag) {
          try {
            const encodedPlayerTag = encodeURIComponent(profileData.playerTag);
            console.log(
              `[ProfilePage] Fetching live CoC data for: ${encodedPlayerTag}`
            );
            const livePlayerData: CocPlayer | null =
              await cocApi.getPlayerData(encodedPlayerTag);

            if (livePlayerData) {
              // =================================================================
              // [AUTO-FIX]: Self-Healing Database Logic
              // =================================================================
              let fixedClanId = profileData.clanId;
              let fixedClanName = profileData.clanName;
              let shouldUpdateDb = false;
              const liveClanTag = livePlayerData.clan?.tag;

              // 1. Check Clan Consistency
              if (
                liveClanTag &&
                (profileData.clanTag !== liveClanTag || !profileData.clanId)
              ) {
                console.log(
                  `[ProfilePage] Mismatch Clan detected! Searching managed clan for ${liveClanTag}...`
                );

                const clanQuery = await adminFirestore
                  .collection(COLLECTIONS.MANAGED_CLANS)
                  .where('tag', '==', liveClanTag)
                  .limit(1)
                  .get();

                if (!clanQuery.empty) {
                  const foundClan = clanQuery.docs[0];
                  fixedClanId = foundClan.id;
                  fixedClanName = foundClan.data().name;
                  console.log(
                    `[ProfilePage] Found managed clan: ${fixedClanId}. Scheduling DB fix.`
                  );
                  shouldUpdateDb = true;
                }
              }

              // 2. Check Role Consistency
              const correctClashubRole = mapCocRoleToClashubRole(
                livePlayerData.role
              );
              if (profileData.role !== correctClashubRole) {
                console.log(
                  `[ProfilePage] Role mismatch! DB: ${profileData.role} vs Live: ${correctClashubRole}. Scheduling DB fix.`
                );
                shouldUpdateDb = true;
              }

              // 3. Execute DB Fix
              if (shouldUpdateDb) {
                try {
                  const updatePayload = {
                    inGameName: livePlayerData.name,
                    thLevel: livePlayerData.townHallLevel,
                    trophies: livePlayerData.trophies,
                    clanTag: liveClanTag || null,
                    clanRole: livePlayerData.role || ClanRole.NOT_IN_CLAN,
                    role: correctClashubRole,
                    clanId: fixedClanId,
                    clanName:
                      fixedClanName || livePlayerData.clan?.name || null,
                    lastVerified: new Date(),
                  };

                  await adminFirestore
                    .collection(COLLECTIONS.USERS)
                    .doc(sessionUser.uid)
                    .update(updatePayload);
                  console.log(
                    `[ProfilePage] ✅ Database AUTO-FIXED for user ${sessionUser.uid}`
                  );
                } catch (fixError) {
                  console.error(
                    `[ProfilePage] ❌ Failed to Auto-Fix database:`,
                    fixError
                  );
                }
              }
              // =================================================================

              // Merge Live Data for UI
              profileData = {
                ...profileData,
                inGameName: livePlayerData.name,
                thLevel: livePlayerData.townHallLevel,
                trophies: livePlayerData.trophies,
                clanTag: livePlayerData.clan?.tag || null,
                clanName: livePlayerData.clan
                  ? fixedClanName
                    ? fixedClanName
                    : livePlayerData.clan.name
                  : null,
                clanRole: mapCocRoleToClanRole(livePlayerData.role),
                role: shouldUpdateDb
                  ? mapCocRoleToClashubRole(livePlayerData.role)
                  : profileData.role,
                clanId: fixedClanId,
              };
            } else {
              console.warn(
                `[ProfilePage] Live CoC data not found. Using Firestore data.`
              );
            }
          } catch (cocErr) {
            console.error(
              `[ProfilePage] Error fetching live CoC data:`,
              cocErr
            );
          }
        }
      }

      // 3. Fetch Additional Data (Posts, History, Reviews)
      if (profileData?.uid) {
        try {
          const [postsData, historyData, reviewsData] = await Promise.all([
            getPostsByAuthorAdmin(profileData.uid, 3),
            getClanHistoryAdmin(profileData.uid),
            getPlayerReviewsAdmin(profileData.uid),
          ]);

          recentPosts = postsData;
          clanHistory = historyData;
          playerReviews = reviewsData;
        } catch (dataErr) {
          console.error(
            'Server Error: Failed to load auxiliary data (Firestore Index might be missing):',
            dataErr
          );
        }
      }
    } else {
      profileData = null;
    }
  } catch (err) {
    console.error('Server Error: Failed to load user profile:', err);
    profileData = null;
    serverError = 'Gagal memuat data profil dari Firestore. Coba lagi.';
  }

  // 4. Render Client Component with Serialized Data
  return (
    <ProfileClient
      initialProfile={
        profileData ? JSON.parse(JSON.stringify(profileData)) : null
      }
      serverError={serverError}
      recentPosts={JSON.parse(JSON.stringify(recentPosts))}
      clanHistory={JSON.parse(JSON.stringify(clanHistory))}
      playerReviews={JSON.parse(JSON.stringify(playerReviews))}
    />
  );
};

export default ProfilePage;