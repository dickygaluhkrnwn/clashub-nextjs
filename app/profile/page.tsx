'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/firestore';
import { getThImage } from '@/lib/th-utils';
import { TrophyIcon, StarIcon } from '@/app/components/icons';

const ProfilePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efek untuk Route Protection dan Memuat Data Profil
  useEffect(() => {
    // 1. Route Protection
    if (!authLoading && !currentUser) {
      router.push('/auth');
      return;
    }

    // 2. Load User Profile Data
    const fetchProfile = async () => {
      if (currentUser) {
        setDataLoading(true);
        try {
          const profile = await getUserProfile(currentUser.uid);
          
          if (profile) {
            setUserProfile(profile);
          } else {
            // Profil tidak ada, ini seharusnya tidak terjadi setelah Tugas 3.1
            setError("Profil tidak ditemukan. Silakan coba mendaftar ulang.");
          }
        } catch (err) {
          console.error("Gagal memuat profil:", err);
          setError("Gagal memuat data profil. Silakan periksa koneksi atau coba lagi.");
        } finally {
          setDataLoading(false);
        }
      }
    };

    if (!authLoading && currentUser) {
        fetchProfile();
    } else if (!authLoading && !currentUser) {
        setDataLoading(false); // Selesai loading, tapi redirecting
    }
  }, [currentUser, authLoading, router]);
  
  // Tampilkan loading gabungan
  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1 className="text-3xl text-coc-gold font-supercell">Memuat E-Sports CV...</h1>
      </div>
    );
  }
  
  // Tampilan utama jika pengguna sudah login dan data profil tersedia
  if (currentUser && userProfile) {
    // Pastikan thLevel adalah angka yang valid untuk mencegah crash di getThImage
    const validThLevel = userProfile.thLevel && !isNaN(userProfile.thLevel) && userProfile.thLevel > 0 ? userProfile.thLevel : 1;
    const thImage = getThImage(validThLevel);
    
    // Tentukan warna badge role (Kompetitif = Merah, Casual/Free Agent = Hijau)
    const isFreeAgent = userProfile.role === 'Free Agent';

    return (
      <main className="container mx-auto p-4 md:p-8 mt-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Kolom Kiri: Ringkasan Profil & Aksi */}
            <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 text-center space-y-4">
                <Image 
                    src="/images/placeholder-avatar.png" 
                    alt="User Avatar" 
                    width={100} 
                    height={100} 
                    className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold-dark mb-4"
                />
                <h1 className="text-3xl font-supercell text-white">
                    {userProfile.displayName}
                </h1>
                <p className="text-sm text-gray-400">
                    Tag: <span className="text-coc-gold font-bold">{userProfile.playerTag}</span>
                </p>
                {/* Badge Role Tim */}
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-sm ${isFreeAgent ? 'bg-coc-green text-coc-stone' : 'bg-coc-red text-white'}`}>
                    {userProfile.role || 'Free Agent'}
                </span>

                <div className="pt-4 border-t border-coc-gold-dark/20 space-y-3">
                    <h3 className="text-xl text-coc-gold-dark font-supercell">Reputasi Komitmen</h3>
                    <div className="text-center">
                        <p className="text-5xl font-supercell text-coc-gold mb-1">
                            {userProfile.reputation ? userProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-8 w-8" />
                        </p>
                        <p className="text-xs text-gray-400">(Berdasarkan ulasan mantan tim)</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-coc-gold-dark/20 space-y-2 text-left">
                    <h3 className="text-lg text-coc-gold-dark font-supercell">Preferensi</h3>
                    <p><span className="font-bold text-gray-300">Role Main:</span> {userProfile.playStyle || 'Belum Diatur'}</p>
                    <p><span className="font-bold text-gray-300">Jam Aktif:</span> {userProfile.activeHours || 'Belum Diatur'}</p>
                </div>
                
                <div className="mt-8">
                    <Button href="/profile/edit" variant="primary" size="lg" className="w-full">
                        Edit Profil Saya
                    </Button>
                </div>
            </aside>
            
            {/* Kolom Kanan: Detail CV */}
            <section className="lg:col-span-2 space-y-8">
                
                {/* TH Showcase / Status Permainan */}
                <div className="card-stone p-6">
                    <h2 className="text-2xl border-l-4 border-coc-gold pl-4 mb-6 font-supercell flex items-center gap-2">
                        <TrophyIcon className="h-6 w-6" />
                        Status Permainan
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Image 
                            src={thImage} 
                            alt={`Town Hall ${validThLevel}`} 
                            width={120} 
                            height={120} 
                            className="flex-shrink-0"
                        />
                        <div className="flex-grow grid grid-cols-2 gap-4 text-center">
                            <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                <h4 className="text-3xl text-coc-gold">{validThLevel}</h4>
                                <p className="text-xs uppercase text-gray-400">Level Town Hall</p>
                            </div>
                            <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                <h4 className="text-3xl text-coc-gold">5200+</h4> {/* Data statis sementara */}
                                <p className="text-xs uppercase text-gray-400">Trofi Saat Ini</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio & Visi */}
                <div className="card-stone p-6">
                    <h2 className="text-2xl border-l-4 border-coc-gold pl-4 mb-4 font-supercell">Bio & Visi</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{userProfile.bio || 'Belum ada deskripsi. Klik Edit Profil untuk menambahkan bio Anda.'}</p>
                </div>

                {/* Riwayat Tim (Statis sementara) */}
                <div className="card-stone p-6">
                    <h2 className="text-2xl border-l-4 border-coc-gold pl-4 mb-4 font-supercell">Riwayat Tim</h2>
                    <p className="text-gray-400">Riwayat Tim akan muncul di sini setelah Anda mendaftarkan tim (Fitur Sprint 4).</p>
                </div>
                
            </section>
        </div>
      </main>
    );
  }
  
  // Tampilkan pesan error jika data loading sudah selesai tetapi profil tidak ditemukan
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card-stone p-8 max-w-md text-center">
          <h2 className="text-2xl text-coc-red mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} variant="secondary">Kembali ke Home</Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProfilePage;
