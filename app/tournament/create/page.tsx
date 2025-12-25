import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile } from '@/lib/firestore';
import { UserProfile } from '@/lib/clashub.types';
import { Metadata } from 'next';
import CreateTournamentClient from './CreateTournamentClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clashub | Create Tournament',
  description: 'Buat dan publikasikan turnamen Clash of Clans Anda sendiri.',
};

const CreateTournamentPage = async () => {
  // 1. Cek Sesi Pengguna
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return redirect('/auth?callbackUrl=/tournament/create');
  }

  // 2. Ambil UserProfile
  const userProfileData = await getUserProfile(sessionUser.uid);

  // 3. Validasi Profil
  if (!userProfileData) {
    return redirect('/profile/edit?error=Profile_required_to_create_tournament');
  }
  
  // 4. Serialisasi data
  const userProfile = JSON.parse(JSON.stringify(userProfileData)) as UserProfile;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 mt-4 md:mt-8">
      <CreateTournamentClient userProfile={userProfile} />
    </main>
  );
};

export default CreateTournamentPage;