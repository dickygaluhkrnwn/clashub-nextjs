'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserCircleIcon } from '@/app/components/icons';

const ProfilePage = () => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Efek ini akan berjalan untuk melindungi halaman (Route Protection)
  useEffect(() => {
    // Jika pengecekan auth selesai dan tidak ada pengguna,
    // arahkan ke halaman login.
    if (!loading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  // Tampilkan pesan loading selagi Firebase memeriksa status otentikasi
  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl text-coc-gold">Memuat data pengguna...</p>
        </div>
    );
  }

  // Jika pengguna sudah login, tampilkan halaman profil mereka
  if (currentUser) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10">
        <div className="max-w-2xl mx-auto">
            <div className="card-stone p-8 text-center">
                 <img 
                    src="/images/placeholder-avatar.png" 
                    alt="User Avatar" 
                    className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold-dark mb-4"
                />
                <h1 className="text-3xl md:text-4xl mb-2">
                    {/* Kita akan menggunakan nama tampilan di Sprint 5, untuk sekarang email saja */}
                    {currentUser.email}
                </h1>
                <p className="text-sm text-gray-400 mb-6">
                    UID: {currentUser.uid}
                </p>

                <div className="text-left border-t border-coc-gold-dark/20 pt-6 space-y-4">
                    <h2 className="text-xl border-l-0 pl-0 text-center">E-Sports CV (Segera Hadir)</h2>
                    <p className="text-center text-gray-400">
                        Informasi detail profil Anda seperti Player Tag, Level TH, dan riwayat tim akan muncul di sini setelah Anda mengisinya.
                    </p>
                </div>
                
                <div className="mt-8">
                    <Button href="/profile/edit" variant="primary" size="lg">
                        Edit Profil
                    </Button>
                </div>

            </div>
        </div>
      </main>
    );
  }

  // Fallback jika pengguna tidak login (seharusnya sudah di-redirect)
  return null;
};

export default ProfilePage;
