'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';
import { TrophyIcon, StarIcon, InfoIcon, CogsIcon, XIcon, GlobeIcon, DiscordIcon, AlertTriangleIcon } from '@/app/components/icons'; // Import AlertTriangleIcon
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

    // --- 1. Handle Loading Auth Awal ---
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                {/* PERBAIKAN FONT */}
                <h1 className="text-3xl text-coc-gold font-clash animate-pulse">Memuat Sesi Pengguna...</h1>
            </div>
        );
    }

    // --- 2. Handle Error dari Server (Fetch Gagal Total) ---
    // Kondisi ini menampilkan "Coba Lagi" (yang Anda lihat). Ini hanya terjadi jika data Firestore GAGAL di-fetch.
    if (error && !initialProfile) { 
        return (
          <div className="flex justify-center items-center min-h-screen">
            <div className="card-stone p-8 max-w-md text-center rounded-lg">
              <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4"/>
              {/* PERBAIKAN FONT */}
              <h2 className="text-2xl text-coc-red font-clash mb-4">Error Memuat Profil</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={() => router.refresh()} variant="primary">
                 Coba Lagi
              </Button>
            </div>
          </div>
        );
    }

    // --- 3. Handle Kasus Profil Belum Ada (Fetch Berhasil, Data Null) ---
    // Kondisi ini terjadi jika pengguna baru mendaftar dan dokumen 'users' belum lengkap.
    if (!error && currentUser && !userProfile) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="card-stone p-8 max-w-md text-center rounded-lg">
                    <InfoIcon className="h-12 w-12 text-coc-gold mx-auto mb-4"/>
                    {/* PERBAIKAN FONT */}
                    <h2 className="text-2xl text-coc-gold font-clash mb-4">Profil Belum Lengkap</h2>
                    <p className="text-gray-400 mb-6">
                        {serverError || "Sepertinya Anda baru mendaftar atau profil Anda belum ada. Mohon lengkapi E-Sports CV Anda."}
                    </p>
                    <Button href="/profile/edit" variant="primary">
                        <XIcon className="inline h-5 w-5 mr-2"/> Mulai Edit CV
                    </Button>
                </div>
            </div>
        );
    }

    // --- 4. Tampilkan Profil Jika Semua OK ---
    if (currentUser && userProfile) {
        const validThLevel = userProfile.thLevel && !isNaN(userProfile.thLevel) && userProfile.thLevel > 0 ? userProfile.thLevel : 9;
        const thImage = getThImage(validThLevel);
        const avatarSrc = userProfile.avatarUrl || '/images/placeholder-avatar.png';
        const displayWebsite = cleanUrlDisplay(userProfile.website);

        return (
            <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Kolom Kiri: Ringkasan Profil & Aksi */}
                    <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 text-center">
                        <Image
                            src={avatarSrc}
                            alt={`${userProfile.displayName} Avatar`}
                            width={100}
                            height={100}
                            className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                        />
                        {/* PERBAIKAN FONT */}
                        <h1 className="text-3xl font-clash text-white mt-4">
                            {userProfile.displayName}
                        </h1>
                        <p className="text-sm text-gray-400 mb-4">
                            Tag: <span className="text-coc-gold font-bold">{userProfile.playerTag}</span>
                        </p>

                        <div className="space-y-6 text-left">
                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                {/* PERBAIKAN FONT */}
                                <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2 mb-2"><InfoIcon className="h-5 w-5"/> Bio & Visi</h3>
                                <p className="text-sm text-gray-300">{userProfile.bio || 'Belum ada bio.'}</p>
                            </div>

                            <div className="pt-4 border-t border-coc-gold-dark/20">
                                 {/* PERBAIKAN FONT */}
                                <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2 mb-2"><CogsIcon className="h-5 w-5"/> Preferensi</h3>
                                <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {userProfile.playStyle || 'Belum Diatur'}</p>
                                <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {userProfile.activeHours || 'Belum Diatur'}</p>
                            </div>

                            {(userProfile.discordId || userProfile.website) && (
                                <div className="pt-4 border-t border-coc-gold-dark/20">
                                     {/* PERBAIKAN FONT */}
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
                                            {/* PERBAIKAN: Menggunakan helper untuk membersihkan tampilan URL */}
                                            {displayWebsite}
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                                 {/* PERBAIKAN FONT */}
                                <h3 className="text-lg text-coc-gold-dark font-clash">Reputasi Komitmen</h3>
                                 {/* PERBAIKAN FONT */}
                                <p className="text-4xl font-clash text-coc-gold my-1">
                                    {userProfile.reputation ? userProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                                </p>
                                <p className="text-xs text-gray-400">(Berdasarkan ulasan mantan tim)</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            {/* PERBAIKAN UTAMA: Memastikan tombol EDIT PROFIL menonjol */}
                            <Button href="/profile/edit" variant="primary" size="lg" className="w-full">
                                Edit Profil Saya
                            </Button>
                        </div>
                    </aside>

                    {/* Kolom Kanan: Detail CV */}
                    <section className="lg:col-span-2 space-y-8">
                        <div className="card-stone p-6">
                             {/* PERBAIKAN FONT */}
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
                                         {/* PERBAIKAN FONT */}
                                        <h4 className="text-3xl text-coc-gold font-clash">{validThLevel}</h4>
                                        <p className="text-xs uppercase text-gray-400">Level Town Hall</p>
                                    </div>
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                         {/* PERBAIKAN FONT */}
                                        <h4 className="text-3xl text-coc-gold font-clash">5200+</h4> {/* Data statis */}
                                        <p className="text-xs uppercase text-gray-400">Trofi Saat Ini</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card-stone p-6">
                             {/* PERBAIKAN FONT */}
                            <h2 className="mb-4 font-clash">Aktivitas Terbaru</h2>
                            <div className="space-y-4">
                                {recentPosts.map((post) => (
                                   <PostCard key={post.title} {...post} />
                                ))}
                            </div>
                        </div>
                        <div className="card-stone p-6">
                             {/* PERBAIKAN FONT */}
                            <h2 className="mb-4 font-clash">Riwayat Tim</h2>
                            <p className="text-gray-400 text-sm">Riwayat Tim akan muncul di sini.</p>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    // Fallback jika tidak ada kondisi yang cocok (seharusnya tidak terjadi jika logic benar)
    return null;
};

export default ProfileClient;
