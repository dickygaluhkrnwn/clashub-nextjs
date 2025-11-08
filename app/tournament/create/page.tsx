// File: app/tournament/create/page.tsx
// Deskripsi: Halaman Server Component untuk membuat turnamen baru.

import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
// Kita ikuti pola dari app/profile/edit/page.tsx yang menggunakan getUserProfile (client) di Server Component
import { getUserProfile } from '@/lib/firestore';
import { UserProfile } from '@/lib/types';
import { Metadata } from 'next';
// Impor komponen Klien yang sudah kita buat
import CreateTournamentClient from './CreateTournamentClient';

// Memaksa halaman ini untuk selalu render dinamis (tidak di-cache)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clashub | Buat Turnamen Baru',
  description:
    'Buat dan publikasikan turnamen Clash of Clans Anda sendiri.',
};

/**
 * @component CreateTournamentPage (Server Component)
 * Menangani otentikasi server-side, mengambil UserProfile,
 * dan meneruskannya ke komponen form klien.
 */
const CreateTournamentPage = async () => {
  // 1. Cek Sesi Pengguna (Auth Guard)
  const sessionUser = await getSessionUser();

  // 2. Jika tidak login, redirect ke halaman auth
  if (!sessionUser) {
    redirect('/auth');
  }

  // 3. Ambil UserProfile LENGKAP dari Firestore menggunakan UID sesi
  const userProfile = await getUserProfile(sessionUser.uid);

  // 4. Jika profil tidak ada, paksa isi profil dulu
  // Pengguna harus punya profil untuk menjadi "organizerName"
  if (!userProfile) {
    // Redirect ke halaman edit profil dengan pesan error
    redirect('/profile/edit?error=Profile_required_to_create_tournament');
  }

  // TODO: Nanti di masa depan, kita bisa tambahkan cek di sini
  // apakah userProfile.role adalah 'Admin' atau 'Organizer'
  // if (userProfile.role !== 'Admin') {
  //   redirect('/tournament?error=permission_denied');
  // }

  // 5. Render komponen Klien (form) dan teruskan data profil
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-4xl font-bold text-blue-500">
        Buat Turnamen Baru
      </h1>
      <p className="mb-8 text-lg text-gray-700 dark:text-gray-300">
        Isi detail di bawah ini untuk mempublikasikan turnamen Anda ke
        komunitas Clashub.
      </p>

      {/* [PERBAIKAN] Merender komponen form klien dan meneruskan profil pengguna */}
      <CreateTournamentClient userProfile={userProfile} />
    </main>
  );
};

export default CreateTournamentPage;