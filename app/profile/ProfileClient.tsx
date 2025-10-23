'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';
// Tambahkan ShieldCheckIcon, CalendarIcon, CrownIcon
// PERBAIKAN: Mengganti ShieldCheckIcon menjadi ShieldIcon dan menghapus ikon yang tidak diekspor sementara
import { TrophyIcon, StarIcon, InfoIcon, CogsIcon, XIcon, GlobeIcon, DiscordIcon, AlertTriangleIcon, ShieldIcon } from '@/app/components/icons';
import { PostCard } from '@/app/components/cards';

// Data statis untuk Postingan Terbaru (Sesuai prototipe lama)
const recentPosts = [
    { title: "Perubahan Meta: Strategi Hydrid Apa yang Cocok?", category: "#TH16", tag: "Strategi", stats: "Diposting 2 hari lalu", author: "Anda", href:"/knowledge-hub/1" },
    { title: "Koleksi Base Legend League Anti 3 Bintang", category: "#Base", tag: "Building", stats: "Diposting 5 hari lalu", author: "Anda", href:"/knowledge-hub/3" },
];

interface ProfileClientProps {
    initialProfile: UserProfile | null;
    serverError: string | null;
}

const ProfileClient = ({ initialProfile, serverError }: ProfileClientProps) => {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    // Gunakan state untuk error agar bisa diubah jika perlu di masa depan
    const [error] = useState<string | null>(serverError);
    // State profile tetap menggunakan initialProfile
    const [userProfile] = useState<UserProfile | null>(initialProfile);

    // Helper untuk membersihkan URL (dipindahkan dari EditProfileClient)
    const cleanUrlDisplay = (url: string | null | undefined): string => {
        if (!url) return '';
        // Menghapus http(s):// dan www.
        return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    };

    // Cek apakah pengguna memiliki peran kepemimpinan
    const isClanManager = userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';

    // --- 1. Handle Loading Auth Awal ---
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <h1 className="text-3xl text-coc-gold font-clash animate-pulse">Memuat Sesi Pengguna...</h1>
            </div>
        );
    }

    // --- 2. Periksa apakah error adalah 'Profil belum ditemukan' atau 'Fatal Error' ---
    const isMissingProfile = !userProfile && error && error.includes('Profil E-Sports CV Anda belum ditemukan');

    if (isMissingProfile) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="card-stone p-8 max-w-md text-center rounded-lg">
                    <InfoIcon className="h-12 w-12 text-coc-gold mx-auto mb-4"/>
                    <h2 className="text-2xl text-coc-gold font-clash mb-4">Profil Belum Lengkap</h2>
                    <p className="text-gray-400 mb-6">
                        {error}
                    </p>
                    <Button href="/profile/edit" variant="primary">
                        <XIcon className="inline h-5 w-5 mr-2"/> Mulai Edit CV
                    </Button>
                </div>
            </div>
        );
    }

    // Kasus B: Fatal Error (InitialProfile null dan pesan error bukan missing profile)
    if (!userProfile && error) {
        return (
          <div className="flex justify-center items-center min-h-screen">
            <div className="card-stone p-8 max-w-md text-center rounded-lg">
              <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4"/>
              <h2 className="text-2xl text-coc-red font-clash mb-4">Error Memuat Profil</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={() => router.refresh()} variant="primary">
                  Coba Lagi
              </Button>
            </div>
          </div>
        );
    }
    
    // --- 3. Tampilkan Profil Jika Semua OK ---
    if (currentUser && userProfile) {
        const validThLevel = userProfile.thLevel && !isNaN(userProfile.thLevel) && userProfile.thLevel > 0 ? userProfile.thLevel : 9;
        const thImage = getThImage(validThLevel);
        const avatarSrc = userProfile.avatarUrl || '/images/placeholder-avatar.png';
        const displayWebsite = cleanUrlDisplay(userProfile.website);
        
        // Data Verifikasi
        const isVerified = userProfile.isVerified || false;
        const lastVerifiedDate = userProfile.lastVerified 
            ? new Date(userProfile.lastVerified).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'N/A';

        return (
            <main className="container mx-auto p-4 md:p-8 mt-10">
                {/* --- HEADER STATUS VERIFIKASI (BARU) --- */}
                <div className={`card-stone p-4 mb-8 max-w-5xl mx-auto rounded-lg border-2 ${isVerified ? 'border-coc-green/50 bg-coc-green/10' : 'border-coc-red/50 bg-coc-red/10'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            {isVerified ? (
                                // PERBAIKAN: Mengganti ShieldCheckIcon menjadi ShieldIcon
                                <ShieldIcon className="h-7 w-7 text-coc-green flex-shrink-0" />
                            ) : (
                                <AlertTriangleIcon className="h-7 w-7 text-coc-red flex-shrink-0" />
                            )}
                            <p className="text-sm sm:text-base font-sans font-semibold text-white">
                                {isVerified ? (
                                    <>
                                        Akun CoC **Terverifikasi**. Nama In-Game: <span className="text-coc-green">{userProfile.inGameName}</span>. 
                                        {/* PERBAIKAN #4.1: Menggunakan userProfile.teamName */}
                                        {userProfile.teamName && userProfile.clanTag && ` Saat ini di klan: ${userProfile.teamName} (${userProfile.clanTag}).`} 
                                    </>
                                ) : (
                                    <>
                                        Akun CoC **Belum Terverifikasi**. Data TH dan Tag bersifat manual.
                                    </>
                                )}
                            </p>
                        </div>
                        <Button 
                            href="/profile/edit" 
                            variant="secondary" 
                            size="sm" 
                            className="w-full sm:w-auto flex-shrink-0"
                        >
                            {isVerified ? 'Lihat Detail Verifikasi' : 'Mulai Verifikasi'}
                        </Button>
                    </div>
                </div>
                {/* --- END HEADER STATUS VERIFIKASI --- */}

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Kolom Kiri: Ringkasan Profil & Aksi */}
                    <aside className="lg:col-span-1 card-stone p-6 sticky top-28 text-center">
                        <Image
                            src={avatarSrc}
                            alt={`${userProfile.displayName} Avatar`}
                            width={100}
                            height={100}
                            sizes="(max-width: 1024px) 80px, 100px"
                            priority
                            className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                        />
                        <h1 className="text-3xl font-clash text-white mt-4">
                            {userProfile.displayName}
                        </h1>
                        <p className="text-sm text-gray-400 mb-4">
                            Tag: <span className="text-coc-gold font-bold">{userProfile.playerTag}</span>
                        </p>

                        {/* Status Klan & Role */}
                        <div className={`p-2 rounded-md font-sans font-bold text-xs uppercase mb-6 ${userProfile.clanRole === 'leader' || userProfile.clanRole === 'coLeader' ? 'bg-coc-gold/20 text-coc-gold' : 'bg-coc-stone/50 text-gray-400'}`}>
                            {/* PERBAIKAN #4.2: Menggunakan userProfile.teamName */}
                            Role Klan: {userProfile.clanRole === 'not in clan' ? 'TIDAK DALAM KLAN' : `${userProfile.clanRole} di ${userProfile.teamName || 'Klan Tidak Dikenal'}`}
                        </div>

                        <div className="space-y-6 text-left">
                            {/* ... Bio & Visi ... */}
                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2 mb-2"><InfoIcon className="h-5 w-5"/> Bio & Visi</h3>
                                <p className="text-sm text-gray-300">{userProfile.bio || 'Belum ada bio.'}</p>
                            </div>

                            {/* ... Preferensi ... */}
                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2 mb-2"><CogsIcon className="h-5 w-5"/> Preferensi</h3>
                                <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {userProfile.playStyle || 'Belum Diatur'}</p>
                                <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {userProfile.activeHours || 'Belum Diatur'}</p>
                            </div>

                            {/* ... Kontak ... */}
                            {(userProfile.discordId || userProfile.website) && (
                                <div className="pt-4 border-t border-coc-gold-dark/20">
                                    <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2 mb-2">
                                        Kontak
                                    </h3>
                                    {userProfile.discordId && (
                                        <p className="text-sm text-gray-300 flex items-center gap-2">
                                            <DiscordIcon className="h-4 w-4 text-coc-gold-dark"/>
                                            <span className="font-bold">{userProfile.discordId}</span>
                                        </p>
                                    )}
                                    {userProfile.website && (
                                        <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-coc-gold hover:underline flex items-center gap-2 mt-1">
                                            <GlobeIcon className="h-4 w-4 text-coc-gold-dark"/>
                                            {displayWebsite}
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Reputasi */}
                            <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                                <h3 className="text-lg text-coc-gold-dark font-clash">Reputasi Komitmen</h3>
                                <p className="text-4xl font-clash text-coc-gold my-1">
                                    {userProfile.reputation ? userProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                                </p>
                                <p className="text-xs text-gray-400">(Berdasarkan ulasan mantan tim)</p>
                            </div>
                        </div>

                        {/* --- TOMBOL AKSI UTAMA --- */}
                        <div className="mt-8 space-y-3">
                            <Button href="/profile/edit" variant="primary" size="lg" className="w-full">
                                Edit Profil Saya
                            </Button>

                            {/* Tombol Manajemen Klan (BARU) */}
                            {isClanManager && userProfile.clanTag && (
                                <Button href="/clan/manage" variant="secondary" size="lg" className="w-full bg-coc-gold-dark/20 hover:bg-coc-gold-dark/40 border-coc-gold-dark/30 hover:border-coc-gold-dark">
                                    {/* PERBAIKAN: Mengganti CrownIcon yang belum diekspor dengan CogsIcon (Placeholder) */}
                                    <CogsIcon className="inline h-5 w-5 mr-2" /> 
                                    Kelola Klan Saya ({userProfile.clanTag})
                                </Button>
                            )}
                        </div>
                        {/* --- END TOMBOL AKSI UTAMA --- */}
                    </aside>

                    {/* Kolom Kanan: Detail CV */}
                    <section className="lg:col-span-2 space-y-8">
                        <div className="card-stone p-6">
                            <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">
                                <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan
                            </h2>
                            
                            {/* --- DETAIL TH & TROPHY --- */}
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <Image
                                    src={thImage}
                                    alt={`Town Hall ${validThLevel}`}
                                    width={120}
                                    height={120}
                                    sizes="(max-width: 768px) 100px, 120px"
                                    className="flex-shrink-0"
                                />
                                <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                        <h4 className="text-3xl text-coc-gold font-clash">{validThLevel}</h4>
                                        <p className="text-xs uppercase text-gray-400">Level Town Hall</p>
                                    </div>
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                        {/* PERBAIKAN #4.3: Menggunakan userProfile.trophies dan fall back ke "N/A" atau "0" */}
                                        <h4 className="text-3xl text-coc-gold font-clash">
                                            {userProfile.trophies?.toLocaleString() || (isVerified ? 'N/A' : '0')}
                                        </h4>
                                        <p className="text-xs uppercase text-gray-400">Trofi Saat Ini {isVerified && <span className="text-coc-green">(LIVE)</span>}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* --- DATA SINKRONISASI CO-LEADER (BARU) --- */}
                            {isClanManager && isVerified && (
                                <div className="mt-6 p-4 bg-coc-stone/30 rounded-lg border border-coc-gold/20">
                                    <p className="text-sm font-sans text-gray-300 flex items-center gap-2">
                                        {/* PERBAIKAN: Mengganti CalendarIcon yang belum diekspor dengan InfoIcon (Placeholder) */}
                                        <InfoIcon className="h-4 w-4 text-coc-gold" />
                                        Data Clan Terakhir Disinkronisasi: 
                                        <span className="font-bold text-coc-gold">
                                            {userProfile.lastVerified ? new Date(userProfile.lastVerified).toLocaleString('id-ID') : 'Belum Pernah'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Data ini digunakan untuk statistik dan manajemen klan Anda.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="card-stone p-6">
                            <h2 className="mb-4 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">Aktivitas Terbaru</h2>
                            <div className="space-y-4">
                                {recentPosts.map((post) => (
                                    <PostCard key={post.title} {...post} />
                                ))}
                            </div>
                        </div>
                        <div className="card-stone p-6">
                            <h2 className="mb-4 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">Riwayat Tim</h2>
                            <p className="text-gray-400 text-sm">Riwayat Tim akan muncul di sini.</p>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    return null;
};

export default ProfileClient;
