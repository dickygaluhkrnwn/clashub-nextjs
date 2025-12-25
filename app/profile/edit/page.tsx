import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile } from '@/lib/firestore';
import { UserProfile, ClanRole } from '@/lib/types';
import EditProfileClient from './EditProfileClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Clashub | Edit E-Sports CV",
  description: "Perbarui informasi Town Hall, gaya bermain, bio, dan detail kontak Anda."
};

const EditProfilePage = async () => {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/auth');
  }

  // Ambil profil. Jika null, buat profil default minimal
  const userProfile = await getUserProfile(sessionUser.uid);

  const initialProfile: Partial<UserProfile> = userProfile || {
    uid: sessionUser.uid,
    displayName: sessionUser.displayName || `Pemain-${sessionUser.uid.substring(0, 4)}`,
    email: sessionUser.email,
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
  };

  return (
    <EditProfileClient initialProfile={initialProfile as UserProfile} />
  );
};

export default EditProfilePage;