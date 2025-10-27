import { Button } from "@/app/components/ui/Button";
import { TeamCard, PostCard } from "@/app/components/cards";
import { TrophyIcon, SkullIcon, PercentageIcon, CogsIcon, BookOpenIcon, ShieldIcon } from "@/app/components/icons"; // Tambahkan ShieldIcon
import CarouselSection from "@/app/components/layout/CarouselSection";
import { getRecommendedTeams } from "@/lib/server-utils"; 
// PERBAIKAN #1: Mengganti Team dengan ManagedClan
import { ManagedClan } from "@/lib/types"; 
import Image from "next/image"; 

// --- DATA STATIS SEMENTARA (Akan diganti di Sprint berikutnya) ---
// Data statis untuk PostCard, disesuaikan dengan props yang benar.
const latestPosts = [
    { title: "PANDUAN SERANGAN DRAGON RIDER POPULER", category: "#TH15", tag: "Strategi", stats: "1.2K Views | 2 Hari Lalu", author: "VERIFIED STRATEGIST", href:"/knowledge-hub/1" },
    { title: "5 TIPS KOMUNIKASI EFEKTIF KAPTEN TIM", category: "#TEAM", tag: "Manajemen", stats: "500 Views | 1 Minggu Lalu", author: "CLASHHUB ADVISOR", href:"/knowledge-hub/2" },
    { title: "PANDUAN BASE ANTI 3 BINTANG DI CWL", category: "#BASE", tag: "Building", stats: "2.5K Views | 3 Hari Lalu", author: "BASEMASTER", href:"/knowledge-hub/3" },
    { title: "TIPS MENGGUNAKAN ROOT RIDER UNTUK PEMULA", category: "#TH16", tag: "Strategi", stats: "890 Views | 5 Hari Lalu", author: "PROATTACKER", href:"/knowledge-hub/4" },
];
// --- AKHIR DATA STATIS ---


// Mengubah komponen menjadi fungsi async, menjadikannya Server Component
export default async function Home() {
    // PERBAIKAN #2: Mengganti Team[] dengan ManagedClan[]
    let recommendedTeams: ManagedClan[] = []; 
    let error: string | null = null;

    try {
        // getRecommendedTeams sekarang mengembalikan ManagedClan[]
        recommendedTeams = await getRecommendedTeams();
    } catch (err) {
        console.error("Error fetching data on server:", err);
        error = "Gagal memuat rekomendasi tim dari database.";
    }

    // Mengganti logic loading di Client Component dengan penanganan error/loading di Server Render

    return (
        <>
            {/* Hero Banner Section */}
            {/* Background image dihandle oleh CSS, tidak menggunakan next/image */}
            <section className="relative h-[400px] bg-hero-banner bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg">
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 p-4">
                    {/* h1 akan otomatis menggunakan font-clash dari globals.css */}
                    <h1 className="text-4xl md:text-5xl mb-4">Pusat Strategi & Komunitas E-sports CLASH OF CLANS</h1>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                        Pimpin Klan Anda menuju Kemenangan! Temukan tim, strategi, dan analisis turnamen terbaik.
                    </p>
                    {/* PERBAIKAN KRITIS: Mengubah href="/teamhub" menjadi "/clan-hub" */}
                    <Button href="/clan-hub" variant="primary" size="lg">TEMUKAN TIM SEKARANG!</Button>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="container mx-auto p-4 md:p-8">

                {/* Top Section - Statis (seperti sebelumnya) */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* Kolom Kiri & Tengah (Status Panel) */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Status War Mendatang (Statis) */}
                        <div className="card-stone p-6 flex flex-col justify-between">
                            {/* h3 akan otomatis menggunakan font-clash dari globals.css */}
                            <h3 className="text-xl mb-4 text-center border-b-2 border-coc-gold-dark/30 pb-2 flex items-center justify-center">
                                <ShieldIcon className="h-5 w-5 mr-2"/> STATUS WAR MENDATANG
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-center my-4">
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <TrophyIcon className="mx-auto text-3xl text-coc-gold mb-2"/>
                                    {/* Statistik: font-sans (default), font-bold */}
                                    <span className="block text-xl font-bold font-clash text-white">5 WINS</span>
                                    <p className="text-xs text-gray-400 uppercase font-sans">Win Streak</p>
                                </div>
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <SkullIcon className="mx-auto text-3xl text-coc-red mb-2"/>
                                    {/* Statistik: font-sans (default), font-bold */}
                                    <span className="block text-xl font-bold font-clash text-white">13.5</span>
                                    <p className="text-xs text-gray-400 uppercase font-sans">Rata-rata TH Musuh</p>
                                </div>
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <PercentageIcon className="mx-auto text-3xl text-coc-green mb-2"/>
                                    {/* Statistik: font-sans (default), font-bold */}
                                    <span className="block text-xl font-bold font-clash text-white">98.2%</span>
                                    <p className="text-xs text-gray-400 uppercase font-sans">Destruction</p>
                                </div>
                            </div>
                            <p className="text-center text-gray-400 text-sm font-sans">War Berikutnya Dimulai:</p>
                            {/* Countdown Timer: font-clash */}
                            <div className="text-center text-4xl font-clash text-coc-gold-dark my-2">02:15:30</div>
                            <Button href="/schedule" variant="secondary" className="w-full mt-4">Lihat Kalender Penuh</Button>
                        </div>

                        {/* Info Tim Pengguna (Statis) - Disesuaikan agar konsisten */}
                        <div className="card-stone p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-4 border-b border-coc-gold-dark/30 pb-4 mb-4">
                                <Image
                                  src="/images/clan-badge-placeholder.png"
                                  alt="Clan Badge"
                                  width={64} 
                                  height={64} 
                                  className="w-16 h-16 rounded-full border-3 border-coc-gold object-cover flex-shrink-0 shadow-lg" 
                                />
                                <div>
                                    <h3 className="text-xl">THE GOLDEN ARMY</h3>
                                    <p className="text-sm text-coc-gold-dark font-bold font-mono">#P9Y8Q2V0</p>
                                </div>
                            </div>
                            {/* Grid Statistik diubah agar lebih rapi, menggunakan kelas yang sama dengan War Status */}
                            <div className="grid grid-cols-2 gap-4 text-center flex-grow">
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <span className="block font-bold text-lg text-coc-gold font-clash">25</span>
                                    <p className="text-xs uppercase text-gray-400 font-sans">Level Klan</p>
                                </div>
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <span className="block font-bold text-lg text-coc-gold font-clash">MASTER I</span>
                                    <p className="text-xs uppercase text-gray-400 font-sans">CWL League</p>
                                </div>
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <span className="block font-bold text-lg text-coc-gold font-clash">45/50</span>
                                    <p className="text-xs uppercase text-gray-400 font-sans">Anggota</p>
                                </div>
                                <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                    <span className="block font-bold text-lg text-coc-gold font-clash">950</span>
                                    <p className="text-xs uppercase text-gray-400 font-sans">War Wins</p>
                                </div>
                            </div>
                            <Button href="/clan/internal/War Legends" variant="secondary" className="w-full mt-4">Lihat Halaman Klan</Button>
                        </div>
                    </div>

                    {/* Kolom Kanan (Side Info - Statis) */}
                    <div className="space-y-8">
                        {/* Ringkasan Profil */}
                        <div className="card-stone p-6 text-center">
                            <h3 className="text-xl mb-4">RINGKASAN PROFIL ANDA</h3>
                            <Image
                              src="/images/placeholder-avatar.png"
                              alt="Avatar Pengguna"
                              width={80} 
                              height={80} 
                              className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold object-cover"
                            />
                            <div className="flex justify-around mt-4 font-clash">
                                <div><p className="text-xs text-gray-400 font-sans">TH LEVEL</p><span className="text-2xl font-bold text-white">15</span></div>
                                <div><p className="text-xs text-gray-400 font-sans">REPUTASI</p><span className="text-2xl font-bold text-coc-gold">4.8 ★</span></div>
                            </div>
                            <a href="/profile" className="block mt-4 text-sm text-coc-gold hover:underline font-sans">Lengkapi E-Sports CV Anda &rarr;</a>
                        </div>

                        {/* Pengumuman (Statis) */}
                        <div className="card-stone p-6">
                            <h3 className="text-lg mb-4 border-b border-coc-gold-dark/30 pb-2">PENGUMUMAN PENTING</h3>
                            <div className="space-y-4 font-sans">
                                <a href="/news/1" className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors">
                                    <p className="text-gray-300">Pembukaan Pendaftaran Liga Musim 3!</p>
                                    <span className="text-xs text-gray-400">2 hari lalu</span>
                                </a>
                                <a href="/news/2" className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors">
                                    <p className="text-gray-300">Update Game Terbaru: TH 17 Resmi Dirilis.</p>
                                    <span className="text-xs text-gray-400">5 jam lalu</span>
                                </a>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Rekomendasi Tim (DYNAMIC CONTENT) */}
                <CarouselSection title="Rekomendasi Tim untuk Anda" icon={<CogsIcon className="inline-block h-5 w-5"/>}>
                    {error ? (
                        <div className="p-4 bg-coc-red/10 text-red-400 rounded-lg col-span-full">
                            <p className="font-bold">Error Memuat Tim:</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : recommendedTeams.length === 0 ? (
                        <div className="p-4 bg-coc-stone-light/50 text-gray-400 rounded-lg col-span-full">
                            Tidak ada tim yang ditemukan untuk direkomendasikan.
                        </div>
                    ) : (
                        // PERBAIKAN #3: Memastikan TeamCard menerima properti ManagedClan
                        recommendedTeams.map((clan) => (
                            <TeamCard 
                                key={clan.id} 
                                id={clan.id} 
                                name={clan.name} 
                                tag={clan.tag} 
                                // PERBAIKAN #4: Menggunakan nilai fallback 5.0 untuk 'rating' karena tidak ada di ManagedClan
                                rating={5.0} 
                                vision={clan.vision} 
                                avgTh={clan.avgTh} 
                                logoUrl={clan.logoUrl} 
                            />
                        ))
                    )}
                </CarouselSection>

                {/* Strategi Terbaru (STATIS - Akan di-fetch di Sprint Knowledge Hub) */}
                <CarouselSection title="Strategi & Tips Terbaru" icon={<BookOpenIcon className="inline-block h-6 w-6"/>}>
                    {latestPosts.map(post => <PostCard key={post.title} {...post} />)}
                </CarouselSection>

            </main>
        </>
    );
}
