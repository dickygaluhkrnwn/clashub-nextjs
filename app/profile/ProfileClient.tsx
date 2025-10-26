'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; 
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile, Post } from '@/lib/types'; // Menggunakan tipe Post yang sudah diimport
import { getThImage } from '@/lib/th-utils';
// --- PERBAIKAN IKON: Memastikan semua ikon yang digunakan diimpor ---
// Menggunakan ShieldIcon, InfoIcon, CogsIcon sebagai pengganti ShieldCheckIcon, CalendarIcon, CrownIcon
import { 
    TrophyIcon, StarIcon, InfoIcon, CogsIcon, XIcon, GlobeIcon, 
    DiscordIcon, AlertTriangleIcon, ShieldIcon, LinkIcon, UserIcon, // <-- Tambahkan LinkIcon, UserIcon
    BriefcaseIcon, CheckIcon, ExternalLinkIcon // <-- Tambahkan BriefcaseIcon, CheckIcon, ExternalLinkIcon
} from '@/app/components/icons'; 
import { PostCard } from '@/app/components/cards';

interface ProfileClientProps {
    initialProfile: UserProfile | null;
    serverError: string | null;
    recentPosts: Post[]; // Menerima postingan asli
}

const ProfileClient = ({ initialProfile, serverError, recentPosts }: ProfileClientProps) => {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [error] = useState<string | null>(serverError);
    const [userProfile] = useState<UserProfile | null>(initialProfile);

    const cleanUrlDisplay = (url: string | null | undefined): string => {
        if (!url) return '';
        return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    };

    // --- VARIABEL BARU UNTUK KONSISTENSI DENGAN PROFIL PUBLIK ---
    const isClanManager = userProfile?.clanRole === 'leader' || userProfile?.clanRole === 'coLeader';
    const isVerified = userProfile?.isVerified || false;
    // Menggunakan userProfile.role (role Clashub internal) untuk status Free Agent
    const isFreeAgent = userProfile?.role === 'Free Agent' || !userProfile?.role; 
    const isCompetitiveVision = userProfile?.playStyle === 'Attacker Utama' || userProfile?.playStyle === 'Strategist';
    // Link ke profil CoC (jika terverifikasi & punya tag)
    const cocProfileUrl = isVerified && userProfile?.playerTag 
        ? `https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=${userProfile.playerTag.replace('#', '')}`
        : null;
    // Mendapatkan role CoC dari data yang sudah dimerge (enum ClanRole)
    const inGameRole = userProfile?.clanRole || 'not in clan'; 


    // --- 1. Handle Loading Auth Awal ---
    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <h1 className="text-3xl text-coc-gold font-clash animate-pulse">Memuat Sesi Pengguna...</h1>
            </div>
        );
    }

    // --- 2. Handle Error ---
    const isMissingProfile = !userProfile && error && error.includes('Profil E-Sports CV Anda belum ditemukan');

    if (isMissingProfile) {
        // ... (Kode error 'Profil Belum Lengkap' tetap sama) ...
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

    if (!userProfile && error) {
        // ... (Kode error 'Fatal Error' tetap sama) ...
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

        return (
            // --- PENYESUAIAN LAYOUT: Menggunakan wrapper standar ---
            <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
                {/* --- HEADER STATUS VERIFIKASI & AKSI (Diadaptasi dari Publik) --- */}
                <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
                     <div className={`flex items-center gap-3 p-2 rounded ${isVerified ? 'bg-coc-green/10' : 'bg-coc-red/10'}`}>
                         {isVerified ? (
                             <ShieldIcon className="h-6 w-6 text-coc-green flex-shrink-0" />
                         ) : (
                             <AlertTriangleIcon className="h-6 w-6 text-coc-red flex-shrink-0" />
                         )}
                         <p className="text-sm font-sans font-semibold text-white">
                             {isVerified ? (
                                 <>
                                     Akun CoC **Terverifikasi**. 
                                     {/* Tampilkan InGameName jika berbeda */}
                                     {userProfile.inGameName && userProfile.inGameName !== userProfile.displayName 
                                        ? ` (${userProfile.inGameName})` 
                                        : ''}
                                 </>
                             ) : (
                                 <>Akun CoC **Belum Terverifikasi**.</>
                             )}
                         </p>
                     </div>
                     <div className="flex gap-4 flex-wrap"> {/* Tambahkan flex-wrap */}
                         {/* Tombol Lihat Profil CoC (jika terverifikasi) */}
                         {cocProfileUrl && (
                             <Button href={cocProfileUrl} target="_blank" variant="secondary" size="sm" className="flex-shrink-0">
                                 <ExternalLinkIcon className='h-4 w-4 mr-2'/> Profil CoC
                             </Button>
                         )}
                         <Button 
                             href="/profile/edit" 
                             variant="primary" // Ubah jadi primary untuk edit
                             size="sm" 
                             className="flex-shrink-0"
                         >
                              {isVerified ? 'Edit Profil & Verifikasi' : 'Edit Profil & Mulai Verifikasi'}
                         </Button>
                     </div>
                 </header>
                 {/* --- END HEADER --- */}

                {/* --- Layout Utama Profil (Mirip Publik) --- */}
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Kolom Kiri: Ringkasan CV (Diadaptasi dari Publik) */}
                    <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center rounded-lg">
                        <Image
                            src={avatarSrc}
                            alt={`${userProfile.displayName} Avatar`}
                            width={100}
                            height={100}
                            sizes="(max-width: 1024px) 80px, 100px"
                            priority
                            className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                        />
                        <h1 className="text-3xl md:text-4xl text-white font-clash m-0">{userProfile.displayName}</h1>
                         {/* Menampilkan In-Game Name jika terverifikasi & berbeda */}
                         {isVerified && userProfile.inGameName && userProfile.inGameName !== userProfile.displayName && (
                             <p className="text-sm text-gray-400 font-bold -mt-2 mb-1">({userProfile.inGameName})</p>
                         )}
                        <p className="text-sm text-gray-400 font-bold mb-1 font-mono">{userProfile.playerTag || 'TAG BELUM DIATUR'}</p>

                        {/* Status Free Agent */}
                        {isFreeAgent && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                                <BriefcaseIcon className='h-3.5 w-3.5'/> Free Agent
                            </span>
                        )}

                        {/* Status Verifikasi & Visi */}
                         <div className="flex justify-center items-center gap-2 flex-wrap">
                             <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitiveVision ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                                 {isCompetitiveVision ? 'Kompetitif' : 'Kasual'}
                             </span>
                             {isVerified ? (
                                 <span className="px-3 py-1 text-xs font-bold rounded-full bg-coc-blue text-white flex items-center gap-1">
                                     <CheckIcon className='h-3 w-3'/> CoC Terverifikasi
                                 </span>
                             ) : (
                                 <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-600 text-gray-300 flex items-center gap-1">
                                     <AlertTriangleIcon className='h-3 w-3'/> Belum Terverifikasi
                                 </span>
                             )}
                         </div>

                        {/* Bio & Visi */}
                        <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                            <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                                <InfoIcon className="h-5 w-5"/> Bio & Visi
                            </h3>
                            <p className="text-sm text-gray-300">{userProfile.bio || 'Belum ada bio.'}</p>
                        </div>

                        {/* Preferensi */}
                        <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                            <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                                <UserIcon className="h-5 w-5"/> Preferensi {/* Ganti ikon */}
                            </h3>
                            <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {userProfile.playStyle || 'Belum Diatur'}</p>
                            <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {userProfile.activeHours || 'Belum Diatur'}</p>
                        </div>

                        {/* Kontak Sosial (Mirip Publik) */}
                         <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-2">
                             <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">Kontak</h3>
                             {userProfile.discordId ? (
                                 <p className="text-sm text-gray-300 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-coc-gold-dark"/> <span className="font-bold">{userProfile.discordId}</span></p>
                             ) : (
                                 <p className="text-sm text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Belum diatur</p>
                             )}
                             {userProfile.website ? (
                                 <a href={userProfile.website.startsWith('http') ? userProfile.website : `https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-coc-gold hover:underline flex items-center gap-2 break-all">
                                     <LinkIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0"/> {displayWebsite}
                                 </a>
                             ) : (
                                 <p className="text-sm text-gray-500 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</p>
                             )}
                         </div>

                        {/* Reputasi */}
                        <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                            <h3 className="text-lg text-coc-gold-dark font-clash">Reputasi Komitmen</h3>
                            <p className="text-4xl font-clash text-coc-gold my-1">
                                {userProfile.reputation ? userProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                            </p>
                            <p className="text-xs text-gray-400">(Berdasarkan ulasan tim)</p>
                            {/* Tambahkan link ke ulasan jika perlu di masa depan */}
                        </div>

                         {/* Tombol Manajemen Klan (Jika Leader/CoLeader & Terverifikasi) */}
                         {isClanManager && isVerified && userProfile.clanTag && (
                             <div className="pt-4 border-t border-coc-gold-dark/20">
                                 <Button href="/clan/manage" variant="secondary" size="lg" className="w-full bg-coc-gold-dark/20 hover:bg-coc-gold-dark/40 border-coc-gold-dark/30 hover:border-coc-gold-dark">
                                     <CogsIcon className="inline h-5 w-5 mr-2" /> {/* Placeholder */}
                                     Kelola Klan Saya 
                                 </Button>
                             </div>
                         )}

                    </aside>

                    {/* Kolom Kanan: Detail CV (Diadaptasi dari Publik) */}
                    <section className="lg:col-span-3 space-y-8">

                        {/* Status Permainan (Mirip Publik) */}
                        <div className="card-stone p-6 rounded-lg">
                            <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
                                <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan {isVerified ? '(LIVE dari CoC)' : '(Data Tersimpan)'}
                            </h2>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative w-36 h-36 flex items-center justify-center">
                                    <Image
                                        src={thImage}
                                        alt={`Town Hall ${validThLevel}`}
                                        width={120}
                                        height={120}
                                        sizes="(max-width: 768px) 100px, 120px"
                                        className="flex-shrink-0"
                                    />
                                </div>
                                <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                        <h4 className="text-3xl text-coc-gold font-clash">{validThLevel}</h4>
                                        <p className="text-xs uppercase text-gray-400 font-sans">Level Town Hall</p>
                                    </div>
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                        <h4 className="text-3xl text-coc-gold font-clash">{userProfile.trophies?.toLocaleString() || (isVerified ? 'N/A' : '0')}</h4>
                                        <p className="text-xs uppercase text-gray-400 font-sans">Trofi Saat Ini</p>
                                    </div>
                                    {/* Placeholder Bintang War */}
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                        <h4 className="text-3xl text-coc-gold font-clash">{/* Placeholder */} N/A</h4>
                                        <p className="text-xs uppercase text-gray-400 font-sans">Bintang War</p>
                                    </div>
                                    {/* Role CoC */}
                                    <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                         <h4 className="text-lg text-coc-gold font-clash capitalize">{isVerified ? (inGameRole.replace('_', ' ') || 'N/A') : 'N/A'}</h4>
                                         <p className="text-xs uppercase text-gray-400 font-sans">Role di Klan CoC</p>
                                     </div>
                                    {/* Clan Tag (jika ada & terverifikasi) */}
                                    {isVerified && userProfile.clanTag && (
                                        <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 col-span-2">
                                            <Link href={`/clan/${encodeURIComponent(userProfile.clanTag)}`} className="hover:opacity-80 transition-opacity block"> {/* Jadikan block */}
                                                <h4 className="text-lg text-coc-gold font-mono">{userProfile.clanTag}</h4>
                                                <p className="text-xs uppercase text-gray-400 font-sans">Klan CoC Saat Ini ({userProfile.teamName || 'Nama Tidak Tersedia'})</p>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                               {/* Info Sinkronisasi (jika manager & terverifikasi) */}
                             {isClanManager && isVerified && (
                                 <div className="mt-6 p-4 bg-coc-stone/30 rounded-lg border border-coc-gold/20">
                                     <p className="text-sm font-sans text-gray-300 flex items-center gap-2">
                                         <InfoIcon className="h-4 w-4 text-coc-gold" /> {/* Placeholder */}
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

                        {/* Aktivitas & Postingan Terbaru (Sudah Benar) */}
                        <div className="card-stone p-6 rounded-lg">
                            <h2 className="mb-4 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">Aktivitas Terbaru</h2>
                            <div className="space-y-4">
                                {recentPosts.length > 0 ? (
                                    <>
                                        {recentPosts.map((post) => (
                                            <PostCard 
                                                key={post.id} 
                                                title={post.title} 
                                                category={post.category} 
                                                tag={post.tags[0] || "Diskusi"} 
                                                stats={`${post.replies} Balasan | ${post.likes} Likes`} 
                                                href={`/knowledge-hub/${post.id}`}
                                                author={userProfile.displayName} 
                                            />
                                        ))}
                                        <div className="text-center pt-4">
                                            <Link href="/knowledge-hub" className="text-sm text-coc-gold hover:underline">
                                                Lihat Semua Postingan Saya &rarr;
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400">Anda belum memposting di Knowledge Hub.</p>
                                        <Link href="/knowledge-hub/create" className="text-sm text-coc-gold hover:underline mt-2 inline-block">
                                            Buat Postingan Pertama Anda &rarr;
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Riwayat Tim (Mirip Publik) */}
                        <div className="card-stone p-6 rounded-lg">
                             <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white"><ShieldIcon className="h-6 w-6 text-coc-gold"/> Riwayat Tim Clashub</h2> {/* Menggunakan ShieldIcon */}
                             <div className="space-y-4">
                                 {/* Logika Riwayat Tim akan ditambahkan di sini jika ada datanya */}
                                  <p className="text-gray-400 text-sm">Riwayat Tim akan muncul di sini.</p>
                                  {/* Contoh jika ada data (adaptasi dari publik):
                                  {currentTeamHistory.length === 0 ? (
                                      <p className="text-gray-400 text-sm">Anda belum memiliki riwayat tim di Clashub.</p>
                                  ) : (
                                      currentTeamHistory.map((history, index) => (
                                          <div key={index} className="..."> ... </div>
                                      ))
                                  )}
                                  */}
                             </div>
                         </div>
                    </section>
                </section>
            </main>
        );
    }

    return null; // Atau tampilkan state fallback jika currentUser null tapi userProfile tidak
};

export default ProfileClient;

