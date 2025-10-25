// File: app/player/[playerId]/page.tsx
// Deskripsi: Menampilkan E-Sports CV pemain (UserProfile) - Server Component.

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import { UserProfile, ManagedClan, Post } from '@/lib/types'; // Import Post type
import { getUserProfile, getManagedClanData, getUserProfileByTag, getPostsByAuthor } from '@/lib/firestore'; // <<<--- IMPORT BARU: getPostsByAuthor
import { getThImage } from '@/lib/th-utils';
import { ArrowLeftIcon, StarIcon, TrophyIcon, InfoIcon, GlobeIcon, DiscordIcon, LinkIcon, UserIcon, CheckIcon, AlertTriangleIcon, BriefcaseIcon, ShieldCheckIcon, ExternalLinkIcon } from '@/app/components/icons'; 

import { PostCard } from '@/app/components/cards';

// Definisikan tipe untuk parameter rute dinamis
interface PlayerDetailPageProps {
    params: {
        playerId: string; // Bisa Firebase UID atau Encoded Player Tag CoC
    };
}

// Data statis dummy untuk post dan riwayat (SUDAH DIHAPUS)
// const dummyRecentPosts = [...]; // Baris ini dihapus

/**
 * Fungsi helper untuk mengecek apakah string terlihat seperti Tag CoC
 */
const isCocTag = (str: string): boolean => {
    // Tag CoC (setelah decode) dimulai dengan # dan diikuti oleh karakter alfanumerik (biasanya 8-9 karakter)
    // Walaupun Next.js decoding URL, kita cek # saja untuk mengidentifikasi kemungkinan Tag CoC
    return str.startsWith('#') && str.length >= 2;
};

/**
 * @function getPlayerProfile
 * Logika utama untuk mengambil UserProfile berdasarkan UID atau Tag CoC.
 */
const getPlayerProfile = async (id: string): Promise<UserProfile | null> => {
    // 1. Coba sebagai UID
    let player: UserProfile | null = await getUserProfile(id);

    if (player) return player;

    // 2. Jika bukan UID, coba sebagai Tag CoC (setelah decode)
    const decodedId = decodeURIComponent(id).toUpperCase();
    
    if (isCocTag(decodedId)) {
        console.log(`[PlayerDetailPage] Attempting to find UserProfile by CoC Tag: ${decodedId}`);
        player = await getUserProfileByTag(decodedId);
        // Note: getUserProfileByTag mengembalikan UserProfile dengan UID sebagai doc.id, yang akan 
        // digunakan untuk navigasi internal Clashub (seperti link reviews).
        return player;
    }
    
    return null;
}

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: PlayerDetailPageProps): Promise<Metadata> {
    const playerId = params.playerId;
    // Ganti pencarian langsung dengan fungsi helper yang mendukung dual ID
    const player = await getPlayerProfile(playerId); 

    if (!player) {
        return { title: "Pemain Tidak Ditemukan | Clashub" };
    }

    // PERBAIKAN: Menggunakan player.thLevel dari data terverifikasi
    return {
        title: `Clashub | E-Sports CV: ${player.displayName}`,
        description: `Lihat E-Sports CV, Town Hall ${player.thLevel || 'N/A'}, dan reputasi komitmen ${player.reputation} ★ dari ${player.displayName}.`,
    };
}

/**
 * @component PlayerDetailPage (Server Component)
 * Menampilkan detail lengkap E-Sports CV pemain (Profil Publik).
 */
const PlayerDetailPage = async ({ params }: PlayerDetailPageProps) => {
    const playerId = params.playerId;

    // Mengambil data profil pengguna (E-Sports CV) menggunakan dual ID logic
    const player: UserProfile | null = await getPlayerProfile(playerId); // PENGGUNAAN FUNGSI BARU

    if (!player) {
        notFound(); // PENTING: Jika data tidak ada di Firestore, tampilkan halaman 404
    }

    // Penyiapan Data & Fallback
    // Gunakan data TH level terverifikasi, fallback ke 9 jika tidak ada/tidak valid
    const validThLevel = player.thLevel && !isNaN(player.thLevel) && player.thLevel > 0 ? player.thLevel : 9;
    const thImage = getThImage(validThLevel);
    const avatarSrc = player.avatarUrl || '/images/placeholder-avatar.png';
    const isVerified = player.isVerified || false;
    const inGameRole = player.clanRole || 'not in clan';
    const isFreeAgent = player.role === 'Free Agent' || !player.role;
    const isCompetitiveVision = player.playStyle === 'Attacker Utama' || player.playStyle === 'Strategist';

    // Mendapatkan data klan internal jika pemain tergabung (ManagedClan)
    let managedClanData: ManagedClan | null = null;
    if (player.teamId) {
        managedClanData = await getManagedClanData(player.teamId);
    }

    // Data Riwayat Tim yang diperbarui
    const currentTeamHistory = managedClanData ? [{
        name: player.teamName || managedClanData.name,
        id: managedClanData.id,
        duration: "Aktif",
        vision: managedClanData.vision,
        // Gunakan role Clashub internal
        role: player.role || 'Member',
    }] : [];
    
    // Link ke profil in-game CoC
    const cocProfileUrl = player.playerTag 
        ? `https://link.clashofclans.com/en/?action=OpenPlayerProfile&tag=${player.playerTag.replace('#', '')}`
        : null;

    // --- LOGIKA NYATA: MENGAMBIL POSTINGAN DARI FIRESTORE ---
    let recentPosts: Post[] = [];
    try {
        // Menggunakan player.uid untuk mengambil postingan yang dibuat oleh pemain ini
        // Mengambil 3 postingan terakhir
        recentPosts = await getPostsByAuthor(player.uid, 3);
    } catch (e) {
        console.error("Failed to fetch recent posts:", e);
    }
    // -----------------------------------------------------

    return (
        // PENYESUAIAN UI: Menggunakan layout wrapper standar
        <main className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 mt-10">
             {/* Header Tindakan */}
             <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6 rounded-lg">
                 <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                      <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Pencarian
                 </Button>

                 <div className="flex gap-4">
                    {/* Tombol Lihat Profil CoC */}
                    {cocProfileUrl && (
                        <Button href={cocProfileUrl} target="_blank" variant="secondary" size="md" className="flex-shrink-0">
                            <ExternalLinkIcon className='h-4 w-4 mr-2'/> Profil CoC In-Game
                        </Button>
                    )}
                     <Button variant="secondary" size="md" className="flex-shrink-0" disabled>
                          Kirim Pesan
                     </Button>
                     <Button variant="primary" size="md" disabled={!isFreeAgent} className="flex-shrink-0">
                          Kirim Undangan Tim
                     </Button>
                 </div>
             </header>

             {/* Layout Utama Profil */}
             <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                 {/* Kolom Kiri: Ringkasan CV */}
                 <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center rounded-lg"> {/* Added rounded-lg */}
                      <Image
                          src={avatarSrc}
                          alt={`${player.displayName} Avatar`}
                          width={100}
                          height={100}
                          sizes="(max-width: 1024px) 80px, 100px" // Ukuran render
                          priority // Prioritaskan avatar
                          className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                      />
                      <h1 className="text-3xl md:text-4xl text-white font-clash m-0">{player.displayName}</h1>
                      {/* PENYESUAIAN UI: Menampilkan In-Game Name jika terverifikasi */}
                      {isVerified && player.inGameName && player.inGameName !== player.displayName && (
                          <p className="text-sm text-gray-400 font-bold -mt-2 mb-1">({player.inGameName})</p>
                      )}
                      <p className="text-sm text-gray-400 font-bold mb-1 font-mono">{player.playerTag || 'TAG TIDAK TERSEDIA'}</p>

                      {/* Status Free Agent */}
                      {/* PENYESUAIAN UI: Indikator Free Agent */}
                      {isFreeAgent && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                               <BriefcaseIcon className='h-3.5 w-3.5'/> Free Agent
                          </span>
                      )}


                      {/* Status Verifikasi & Visi */}
                      <div className="flex justify-center items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
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

                      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                           <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                               <InfoIcon className="h-5 w-5"/> Bio & Visi
                           </h3>
                           <p className="text-sm text-gray-300">{player.bio || 'Pemain ini belum melengkapi bio-nya.'}</p>
                      </div>

                      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                           <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">
                               <UserIcon className="h-5 w-5"/> Preferensi
                           </h3>
                           <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {player.playStyle || 'Belum Diatur'}</p>
                           <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {player.activeHours || 'Belum Diatur'}</p>
                      </div>

                      {/* Kontak Sosial */}
                      <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-2">
                           <h3 className="text-lg text-coc-gold-dark font-clash flex items-center gap-2">Kontak</h3>
                           {player.discordId ? (
                               <p className="text-sm text-gray-300 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-coc-gold-dark"/> <span className="font-bold">{player.discordId}</span></p>
                           ) : (
                               <p className="text-sm text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Belum diatur</p>
                           )}
                           {player.website ? (
                               <a href={player.website.startsWith('http') ? player.website : `https://${player.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-coc-gold hover:underline flex items-center gap-2 break-all">
                                   <LinkIcon className="h-4 w-4 text-coc-gold-dark flex-shrink-0"/> {player.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                               </a>
                           ) : (
                               <p className="text-sm text-gray-500 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</p>
                           )}
                      </div>

                      <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                           <h3 className="text-lg text-coc-gold-dark font-clash">Reputasi Komitmen</h3>
                           <p className="text-4xl font-clash text-coc-gold my-1">
                               {player.reputation ? player.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                           </p>
                           <p className="text-xs text-gray-400">(8 Ulasan Komitmen)</p>
                           <Button href={`/player/${player.uid}/reviews`} variant="secondary" className="w-full mt-4">Lihat Semua Ulasan</Button> {/* Menggunakan player.uid yang dijamin ada */}
                      </div>
                 </aside>

                 {/* Kolom Kanan: Detail CV */}
                 <section className="lg:col-span-3 space-y-8">

                      {/* Status Permainan */}
                      <div className="card-stone p-6 rounded-lg">
                          <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
                               <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan {isVerified ? '(Terverifikasi CoC)' : '(Belum Diverifikasi)'}
                          </h2>

                          <div className="flex flex-col md:flex-row items-center gap-6">
                              <div className="relative w-36 h-36 flex items-center justify-center">
                                   <Image
                                       src={thImage}
                                       alt={`Town Hall ${validThLevel}`}
                                       width={120}
                                       height={120}
                                       sizes="(max-width: 768px) 100px, 120px" // Ukuran render
                                       className="flex-shrink-0"
                                   />
                              </div>
                              <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
                                   <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                       <h4 className="text-3xl text-coc-gold font-clash">{validThLevel}</h4>
                                       <p className="text-xs uppercase text-gray-400 font-sans">Level Town Hall</p>
                                   </div>
                                   <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                       <h4 className="text-3xl text-coc-gold font-clash">{player.trophies?.toLocaleString() || 'N/A'}</h4>
                                       <p className="text-xs uppercase text-gray-400 font-sans">Trofi Saat Ini</p>
                                   </div>

                                   <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                       <h4 className="text-3xl text-coc-gold font-clash">450+</h4> {/* Placeholder */}
                                       <p className="text-xs uppercase text-gray-400 font-sans">Bintang War Diperoleh</p>
                                   </div>
                                   <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                       <h4 className="text-lg text-coc-gold font-clash capitalize">{isVerified ? (inGameRole || 'N/A') : 'N/A'}</h4>
                                       <p className="xs uppercase text-gray-400 font-sans">Role di Klan CoC</p>
                                   </div>
                                    {/* PENYESUAIAN UI: Menampilkan Clan Tag jika terverifikasi dan ada */}
                                   {isVerified && player.clanTag && (
                                       <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 col-span-2">
                                           <Link href={`/clan/${encodeURIComponent(player.clanTag)}`} className="hover:opacity-80 transition-opacity">
                                               <h4 className="lg text-coc-gold font-mono">{player.clanTag}</h4>
                                               <p className="xs uppercase text-gray-400 font-sans">Klan CoC Saat Ini</p>
                                           </Link>
                                       </div>
                                   )}
                              </div>
                          </div>
                      </div>

                      {/* Aktivitas & Postingan Terbaru */}
                      <div className="card-stone p-6 rounded-lg">
                          <h2 className="mb-4 font-clash text-2xl text-white">Aktivitas & Postingan Terbaru</h2>
                          <div className="space-y-4">
                              {recentPosts.length > 0 ? (
                                  <>
                                      {recentPosts.map((post) => (
                                          // Menggunakan post.id untuk href, bukan dummy href
                                          <PostCard 
                                              key={post.id} 
                                              title={post.title} 
                                              category={post.category} 
                                              tag={post.tags[0] || "Diskusi"} // Menggunakan tag pertama
                                              stats={`${post.replies} Balasan | ${post.likes} Likes`} 
                                              href={`/knowledge-hub/${post.id}`}
                                              author={player.displayName} // Tetap menggunakan display name pemain
                                          /> 
                                      ))}
                                      <div className="text-center pt-4">
                                          <Link href="/knowledge-hub" className="text-sm text-coc-gold hover:underline">
                                               Lihat Semua Postingan &rarr;
                                          </Link>
                                      </div>
                                  </>
                              ) : (
                                  <div className="text-center py-4">
                                      <p className="text-gray-400">Pemain ini belum memposting di Knowledge Hub.</p>
                                      {/* Tampilkan link ke halaman buat postingan baru */}
                                      <Link href="/knowledge-hub/create" className="text-sm text-coc-gold hover:underline mt-2 inline-block">
                                           Buat Postingan Pertama Anda &rarr;
                                      </Link>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Riwayat Tim */}
                      <div className="card-stone p-6 rounded-lg">
                          <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white"><ShieldCheckIcon className="h-6 w-6 text-coc-gold"/> Riwayat Tim Clashub</h2> {/* Updated Icon */}
                          <div className="space-y-4">
                              {currentTeamHistory.length === 0 ? (
                                  <p className="text-gray-400 text-sm">Pemain ini adalah Free Agent dan belum memiliki riwayat tim di Clashub.</p>
                              ) : (
                                  currentTeamHistory.map((history, index) => (
                                      <div key={index} className="flex flex-col p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30 hover:border-coc-gold transition-all"> {/* Adjusted Border */}
                                          <h4 className="text-lg font-clash text-white flex justify-between items-center flex-wrap gap-x-2"> {/* Added wrap */}
                                              <Link href={`/team/${history.id}`} className='hover:text-coc-gold'>{history.name}</Link>
                                              <span className={`px-2 py-0.5 ml-2 text-xs font-bold rounded-full whitespace-nowrap ${history.role === 'Leader' ? 'bg-coc-gold text-coc-stone' : 'bg-gray-400 text-coc-stone'}`}>
                                                  {history.role}
                                              </span>
                                          </h4>
                                          <p className="text-sm text-gray-400 mt-1">Durasi: <strong className='text-coc-gold'>{history.duration}</strong> | Visi: {history.vision}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                 </section>
             </section>
        </main>
    );
};

export default PlayerDetailPage;
