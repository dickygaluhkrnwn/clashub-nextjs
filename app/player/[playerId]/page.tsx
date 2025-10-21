import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/app/components/ui/Button';
import { UserProfile, Team } from '@/lib/types';
import { getUserProfile, getTeamById } from '@/lib/firestore';
import { getThImage } from '@/lib/th-utils'; 
// Menggunakan ikon-ikon yang sudah diperbarui dan dikoreksi
import { ArrowLeftIcon, StarIcon, TrophyIcon, InfoIcon, CogsIcon, GlobeIcon, DiscordIcon, LinkIcon, UserIcon } from '@/app/components/icons';
import { PostCard } from '@/app/components/cards';

// Definisikan tipe untuk parameter rute dinamis
interface PlayerDetailPageProps {
    params: {
        playerId: string; // Sama dengan UID pengguna
    };
}

// Data statis dummy untuk post dan riwayat (akan diganti di sprint mendatang)
const dummyRecentPosts = [
    { title: "Pasukan apa yang paling efektif untuk donasi di CWL?", category: "#TanyaJawab", tag: "Donasi", stats: "12 Balasan | 25 Likes", href:"/knowledge-hub/5" },
    { title: "Butuh saran untuk base war TH15, ada yang bisa bantu?", category: "#BaseBuilding", tag: "Saran", stats: "5 Balasan | 10 Likes", href:"/knowledge-hub/6" },
];

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: PlayerDetailPageProps): Promise<Metadata> {
    const playerId = params.playerId;
    const player = await getUserProfile(playerId); 

    if (!player) {
        return { title: "Pemain Tidak Ditemukan | Clashub" };
    }

    return {
        title: `Clashub | E-Sports CV: ${player.displayName}`,
        description: `Lihat E-Sports CV, Town Hall ${player.thLevel}, dan reputasi komitmen ${player.reputation} ★ dari ${player.displayName}.`,
    };
}

/**
 * @component PlayerDetailPage (Server Component)
 * Menampilkan detail lengkap E-Sports CV pemain (Profil Publik).
 */
const PlayerDetailPage = async ({ params }: PlayerDetailPageProps) => {
    const playerId = params.playerId;

    // Mengambil data profil pengguna (E-Sports CV)
    const player: UserProfile | null = await getUserProfile(playerId);

    if (!player) {
        notFound();
    }
    
    // Penyiapan Data & Fallback
    const validThLevel = player.thLevel && !isNaN(player.thLevel) && player.thLevel > 0 ? player.thLevel : 9;
    const thImage = getThImage(validThLevel);
    const avatarSrc = player.avatarUrl || '/images/placeholder-avatar.png';
    const isFreeAgent = player.role === 'Free Agent' || !player.role;
    // Asumsi visi berdasarkan playStyle
    const isCompetitiveVision = player.playStyle === 'Attacker Utama' || player.playStyle === 'Strategist';

    // Mendapatkan data tim jika pemain tergabung
    let teamData: Team | null = null;
    if (player.teamId) {
        teamData = await getTeamById(player.teamId);
    }
    
    // Data dummy untuk Riwayat Tim (akan diganti dengan data historis di sprint mendatang)
    const currentTeamHistory = teamData ? [{
        name: player.teamName || teamData.name,
        id: teamData.id,
        duration: "Aktif",
        vision: teamData.vision,
        role: player.role || 'Member',
    }] : [];

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            {/* Header Tindakan */}
            <header className="flex justify-between items-center flex-wrap gap-4 mb-6 card-stone p-6">
                <Button href="/teamhub" variant="secondary" size="md" className="flex items-center flex-shrink-0">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Pencarian
                </Button>
                
                <div className="flex gap-4">
                    <Button variant="secondary" size="md" className="flex-shrink-0">
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
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center">
                    <Image 
                        src={avatarSrc} 
                        alt={`${player.displayName} Avatar`} 
                        width={100} 
                        height={100}
                        className="w-24 h-24 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                    />
                    <h1 className="text-3xl md:text-4xl text-white font-supercell m-0">{player.displayName}</h1>
                    <p className="text-sm text-gray-400 font-bold mb-1">{player.playerTag}</p>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${isCompetitiveVision ? 'bg-coc-red text-white' : 'bg-coc-green text-coc-stone'}`}>
                        {isCompetitiveVision ? 'Kompetitif' : 'Kasual'}
                    </span>

                    <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                        <h3 className="text-lg text-coc-gold-dark font-supercell flex items-center gap-2">
                            <InfoIcon className="h-5 w-5"/> Bio & Visi
                        </h3>
                        <p className="text-sm text-gray-300">{player.bio || 'Pemain ini belum melengkapi bio-nya.'}</p>
                    </div>

                    <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-4">
                        <h3 className="text-lg text-coc-gold-dark font-supercell flex items-center gap-2">
                            <CogsIcon className="h-5 w-5"/> Preferensi
                        </h3>
                        <p className="text-sm"><span className="font-bold text-gray-300">Role Main:</span> {player.playStyle || 'Belum Diatur'}</p>
                        <p className="text-sm"><span className="font-bold text-gray-300">Jam Aktif:</span> {player.activeHours || 'Belum Diatur'}</p>
                    </div>

                    {/* Kontak Sosial */}
                    <div className="text-left pt-4 border-t border-coc-gold-dark/20 space-y-2">
                         <h3 className="text-lg text-coc-gold-dark font-supercell flex items-center gap-2">Kontak</h3>
                        {player.discordId ? (
                            <p className="text-sm text-gray-300 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-coc-gold-dark"/> <span className="font-bold">{player.discordId}</span></p>
                        ) : (
                            <p className="text-sm text-gray-500 flex items-center gap-2"><DiscordIcon className="h-4 w-4 text-gray-500"/> Belum diatur</p>
                        )}
                        {player.website ? (
                            <a href={player.website} target="_blank" rel="noopener noreferrer" className="text-sm text-coc-gold hover:underline flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-coc-gold-dark"/> {player.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-gray-500"/> Website belum diatur</p>
                        )}
                    </div>
                    
                    <div className="pt-4 border-t border-coc-gold-dark/20 text-center">
                        <h3 className="text-lg text-coc-gold-dark font-supercell">Reputasi Komitmen</h3>
                        <p className="text-4xl font-supercell text-coc-gold my-1">
                            {player.reputation ? player.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-7 w-7" />
                        </p>
                        <p className="text-xs text-gray-400">(8 Ulasan Komitmen)</p>
                        <Button href={`/player/${playerId}/reviews`} variant="secondary" className="w-full mt-4">Lihat Semua Ulasan</Button>
                    </div>
                </aside>

                {/* Kolom Kanan: Detail CV */}
                <section className="lg:col-span-3 space-y-8">
                    
                    {/* Status Permainan */}
                    <div className="card-stone p-6">
                        <h2 className="mb-6 flex items-center gap-2">
                            <TrophyIcon className="h-6 w-6" /> Status Permainan
                        </h2>
                        
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                <Image 
                                    src={thImage} 
                                    alt={`Town Hall ${validThLevel}`} 
                                    width={120} 
                                    height={120} 
                                    className="flex-shrink-0"
                                />
                            </div>
                            <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
                                <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                    <h4 className="text-3xl text-coc-gold">{validThLevel}</h4>
                                    <p className="text-xs uppercase text-gray-400">Level Town Hall</p>
                                </div>
                                <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                    <h4 className="text-3xl text-coc-gold">450+</h4> 
                                    <p className="text-xs uppercase text-gray-400">Bintang War Diperoleh</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Aktivitas & Postingan Terbaru */}
                    <div className="card-stone p-6">
                        <h2 className="mb-4">Aktivitas & Postingan Terbaru</h2>
                        <div className="space-y-4">
                            {dummyRecentPosts.map((post) => (
                                <PostCard key={post.title} {...post} author={player.displayName} href={post.href}/>
                            ))}
                            {/* Tambahkan link ke halaman Knowledge Hub jika sudah ada post */}
                            <div className="text-center pt-4">
                                <Link href="/knowledge-hub" className="text-sm text-coc-gold hover:underline">
                                    Lihat Semua Postingan &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Riwayat Tim */}
                    <div className="card-stone p-6">
                        <h2 className="mb-4 flex items-center gap-2"><UserIcon className="h-5 w-5"/> Riwayat Tim</h2>
                        <div className="space-y-4">
                            {currentTeamHistory.length === 0 ? (
                                <p className="text-gray-400 text-sm">Pemain ini adalah Free Agent dan belum memiliki riwayat tim di Clashub.</p>
                            ) : (
                                currentTeamHistory.map((history, index) => (
                                    <div key={index} className="flex flex-col p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/10 hover:border-coc-gold transition-all">
                                        <h4 className="text-lg font-bold text-white flex justify-between items-center">
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
