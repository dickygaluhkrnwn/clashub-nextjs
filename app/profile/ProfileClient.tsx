'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';
import { TrophyIcon, StarIcon, InfoIcon, CogsIcon, XIcon } from '@/app/components/icons';
import { PostCard } from '@/app/components/cards';

// Data statis untuk Postingan Terbaru (Sesuai prototipe lama)
const recentPosts = [
    { title: "Perubahan Meta: Strategi Hydrid Apa yang Cocok?", category: "#TH16", tag: "Strategi", stats: "Diposting 2 hari lalu", author: "Anda", href:"/knowledge-hub/1" },
    { title: "Koleksi Base Legend League Anti 3 Bintang", category: "#Base", tag: "Building", stats: "Diposting 5 hari lalu", author: "Anda", href:"/knowledge-hub/3" },
];

// Definisikan Props untuk Client Component
interface ProfileClientProps {
    // Data profil yang sudah di-fetch di server (SSR)
    initialProfile: UserProfile | null;
    serverError: string | null;
}


const ProfileClient = ({ initialProfile, serverError }: ProfileClientProps) => {
    const { currentUser, loading: authLoading } = useAuth(); // Tetap butuh untuk Logout/interaksi klien
    const router = useRouter();

    // State untuk menyimpan data profil dan error (hanya untuk feedback UX)
    const [userProfile] = useState<UserProfile | null>(initialProfile);
    const [error] = useState<string | null>(serverError);
    
    // Logika loading hanya untuk AuthContext checking di Header, bukan untuk fetching data.
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <h1 className="text-3xl text-coc-gold font-supercell animate-pulse">Memuat Sesi Pengguna...</h1>
            </div>
        );
    }
    
    // Tampilan Profil Utama (currentUser akan ada karena Server Component sudah melakukan redirect jika tidak ada)
    if (currentUser && userProfile) {
        // Fallback TH level jika data tidak valid
        const validThLevel = userProfile.thLevel && !isNaN(userProfile.thLevel) && userProfile.thLevel > 0 ? userProfile.thLevel : 9;
        const thImage = getThImage(validThLevel);
        
        return (
            <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Kolom Kiri: Ringkasan Profil & Aksi */}
                    <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 text-center">
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
                        <p className="text-sm text-gray-400 mb-4">
                            Tag: <span className="text-coc-gold font-bold">{userProfile.playerTag}</span>
                        </p>
                        
                        {/* Bagian-bagian Sidebar */}
                        <div className="space-y-6 text-left">
                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                <h3 className="text-lg text-coc-gold-dark font-supercell flex items-center gap-2 mb-2"><InfoIcon className="h-5 w-5"/> Bio & Visi</h3>
                                <p className="text-sm text-gray-300">{userProfile.bio || 'Belum ada bio.'}</p>
                            </div>

                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                <h3 className="text-lg text-coc-gold-dark font-supercell flex items-center gap-2 mb-2"><CogsIcon className="h-5 w-5"/> Preferensi</h3>
                                <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {userProfile.playStyle || 'Belum Diatur'}</p>
                                <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {userProfile.activeHours || 'Belum Diatur'}</p>
                            </div>

                            <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                                <h3 className="text-lg text-coc-gold-dark font-supercell">Reputasi Komitmen</h3>
                                <p className="text-4xl font-supercell text-coc-gold my-1">
                                    {userProfile.reputation ? userProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                                </p>
                                <p className="text-xs text-gray-400">(Berdasarkan ulasan mantan tim)</p>
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <Button href="/profile/edit" variant="primary" size="lg" className="w-full">
                                Edit Profil Saya
                            </Button>
                        </div>
                    </aside>
                    
                    {/* Kolom Kanan: Detail CV */}
                    <section className="lg:col-span-2 space-y-8">
                        
                        {/* Status Permainan */}
                        <div className="card-stone p-6">
                            <h2 className="mb-6 flex items-center gap-2">
                                <TrophyIcon className="h-6 w-6" /> Status Permainan
                            </h2>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <Image 
                                    src={thImage} 
                                    alt={`Town Hall ${validThLevel}`} 
                                    width={120} 
                                    height={120} 
                                    className="flex-shrink-0"
                                />
                                <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
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

                        {/* Aktivitas & Postingan Terbaru */}
                        <div className="card-stone p-6">
                            <h2 className="mb-4">Aktivitas Terbaru</h2>
                            <div className="space-y-4">
                                {recentPosts.map((post) => (
                                   <PostCard key={post.title} {...post} />
                                ))}
                            </div>
                        </div>

                        {/* Riwayat Tim */}
                        <div className="card-stone p-6">
                            <h2 className="mb-4">Riwayat Tim</h2>
                            <p className="text-gray-400 text-sm">Riwayat Tim akan muncul di sini setelah Anda bergabung dengan sebuah tim (Fitur Sprint 4).</p>
                        </div>
                        
                    </section>
                </div>
            </main>
        );
      }
      
      // Jika terjadi error (dari server atau client)
      if (error) {
        return (
          <div className="flex justify-center items-center min-h-screen">
            <div className="card-stone p-8 max-w-md text-center">
              <h2 className="text-2xl text-coc-red mb-4">Error Memuat Profil</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button href="/profile/edit" variant="primary">
                 <XIcon className="inline h-5 w-5 mr-2"/> Lengkapi CV Anda
              </Button>
            </div>
          </div>
        );
      }
    
      // Jika sessionUser ada tapi profileData null (perlu ke edit)
      if (currentUser && !userProfile) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="card-stone p-8 max-w-md text-center">
                    <h2 className="text-2xl text-coc-gold mb-4">Profil Belum Ditemukan</h2>
                    <p className="text-gray-400 mb-6">
                        {serverError || "Sepertinya Anda baru mendaftar. Mohon lengkapi E-Sports CV Anda terlebih dahulu."}
                    </p>
                    <Button href="/profile/edit" variant="primary">
                        <XIcon className="inline h-5 w-5 mr-2"/> Mulai Edit CV
                    </Button>
                </div>
            </div>
        );
      }

      return null;
};

export default ProfileClient;
