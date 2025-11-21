// File: app/tournament/create/page.tsx
// Deskripsi: Halaman Server Component untuk membuat turnamen baru.

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfile } from '@/lib/firestore';
import { UserProfile } from '@/lib/clashub.types'; // [PERBAIKAN] Gunakan clashub.types
import { Metadata } from 'next';
import CreateTournamentClient from './CreateTournamentClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clashub | Create Tournament',
  description: 'Buat dan publikasikan turnamen Clash of Clans Anda sendiri.',
};

const CreateTournamentPage = async () => {
  // 1. Cek Sesi Pengguna (Auth Guard)
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return redirect('/auth?callbackUrl=/tournament/create');
  }

  // 2. Ambil UserProfile LENGKAP dari Firestore
  const userProfileData = await getUserProfile(sessionUser.uid);

  // 3. Validasi Profil
  if (!userProfileData) {
    return redirect('/profile/edit?error=Profile_required_to_create_tournament');
  }
  
  // [OPSIONAL] Validasi Role (misal hanya Admin/Organizer)
  // if (userProfileData.role !== 'Admin') { ... }

  // 4. Serialisasi data untuk Client Component
  const userProfile = JSON.parse(JSON.stringify(userProfileData)) as UserProfile;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      {/* [PERBAIKAN] 
        Hapus teks judul hardcoded di sini. 
        Kita pindahkan ke dalam CreateTournamentClient agar bisa menggunakan i18n (useLanguage).
      */}
      <CreateTournamentClient userProfile={userProfile} />
    </main>
  );
};

export default CreateTournamentPage;