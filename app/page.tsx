// Impor komponen yang akan kita gunakan
import { Button } from "@/app/components/ui/Button";
import { TeamCard, PostCard } from "@/app/components/cards";
import { TrophyIcon, SkullIcon, PercentageIcon, CogsIcon, BookOpenIcon } from "@/app/components/icons";

// Data statis untuk TeamCard. Menambahkan "as const" untuk menjaga tipe literal.
const recommendedTeams = [
  { name: "THE GOLDEN CLAN", tag: "#GOLDENCLAN", rating: 4.9, vision: "Kompetitif", avgTh: 14.5, href: "/teamhub/1" },
  { name: "NO STRESS CLASH", tag: "#NOSTRESS", rating: 4.5, vision: "Kasual", avgTh: 12.0, href: "/teamhub/2" },
  { name: "TH15 EXPERTS", tag: "#TH15PROS", rating: 4.7, vision: "Kompetitif", avgTh: 15.0, href: "/teamhub/3" },
  { name: "PHOENIX REBORN", tag: "#PHOENIX", rating: 4.7, vision: "Kompetitif", avgTh: 14.8, href: "/teamhub/4" },
  { name: "CHILL CLASHERS", tag: "#CHILL", rating: 4.3, vision: "Kasual", avgTh: 11.5, href: "/teamhub/5" },
] as const; // <-- PERBAIKAN: Menambahkan const assertion

// Data statis untuk PostCard, disesuaikan dengan props yang benar.
const latestPosts = [
    { title: "PANDUAN SERANGAN DRAGON RIDER POPULER", category: "#TH15", tag: "Strategi", stats: "1.2K Views | 2 Hari Lalu", author: "VERIFIED STRATEGIST", href:"/knowledge-hub/1" },
    { title: "5 TIPS KOMUNIKASI EFEKTIF KAPTEN TIM", category: "#TEAM", tag: "Manajemen", stats: "500 Views | 1 Minggu Lalu", author: "CLASHHUB ADVISOR", href:"/knowledge-hub/2" },
    { title: "PANDUAN BASE ANTI 3 BINTANG DI CWL", category: "#BASE", tag: "Building", stats: "2.5K Views | 3 Hari Lalu", author: "BASEMASTER", href:"/knowledge-hub/3" },
    { title: "TIPS MENGGUNAKAN ROOT RIDER UNTUK PEMULA", category: "#TH16", tag: "Strategi", stats: "890 Views | 5 Hari Lalu", author: "PROATTACKER", href:"/knowledge-hub/4" },
];


export default function Home() {
  return (
    <>
      {/* Hero Banner Section */}
      <section className="relative h-[400px] bg-hero-banner bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg">
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 p-4">
          <h1 className="text-4xl md:text-5xl mb-4">Pusat Strategi & Komunitas E-sports CLASH OF CLANS</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Pimpin Klan Anda menuju Kemenangan! Temukan tim, strategi, dan analisis turnamen terbaik.
          </p>
          <Button href="/teamhub" variant="primary" size="lg">TEMUKAN TIM SEKARANG!</Button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 md:p-8">
        
        {/* Top Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Kolom Kiri & Tengah (Status Panel) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Status War Mendatang */}
            <div className="bg-coc-stone-light/50 p-6 rounded-lg shadow-stone border border-coc-gold-dark/20 flex flex-col justify-between">
              <h3 className="text-xl mb-4 text-center border-b-2 border-coc-gold-dark/30 pb-2">STATUS WAR MENDATANG</h3>
              <div className="grid grid-cols-3 gap-4 text-center my-4">
                <div>
                  <TrophyIcon className="mx-auto text-3xl text-coc-gold mb-2"/>
                  <span className="block text-xl font-bold">5 WINS</span>
                  <p className="text-xs text-gray-400 uppercase">Win Streak</p>
                </div>
                <div>
                  <SkullIcon className="mx-auto text-3xl text-coc-red mb-2"/>
                  <span className="block text-xl font-bold">13.5</span>
                  <p className="text-xs text-gray-400 uppercase">Rata-rata TH Musuh</p>
                </div>
                <div>
                  <PercentageIcon className="mx-auto text-3xl text-coc-green mb-2"/>
                  <span className="block text-xl font-bold">98.2%</span>
                  <p className="text-xs text-gray-400 uppercase">Destruction</p>
                </div>
              </div>
              <p className="text-center text-gray-400 text-sm">War Berikutnya Dimulai:</p>
              <div className="text-center text-4xl font-supercell text-coc-gold-dark my-2">02:15:30</div>
              <Button href="/schedule" variant="secondary" className="w-full mt-4">Lihat Kalender Penuh</Button>
            </div>

            {/* Info Tim Pengguna */}
            <div className="bg-coc-stone-light/50 p-6 rounded-lg shadow-stone border border-coc-gold-dark/20 flex flex-col justify-between">
              <div className="flex items-center gap-4 border-b-2 border-coc-gold-dark/30 pb-4 mb-4">
                <img src="/images/clan-badge-placeholder.png" alt="Clan Badge" className="w-16 h-16"/>
                <div>
                  <h3 className="text-xl">THE GOLDEN ARMY</h3>
                  <p className="text-sm text-coc-gold-dark font-bold">#P9Y8Q2V0</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center flex-grow">
                <div className="bg-coc-stone/50 p-2 rounded"><span className="block font-bold text-lg text-coc-gold">25</span><p className="text-xs uppercase text-gray-400">Level Klan</p></div>
                <div className="bg-coc-stone/50 p-2 rounded"><span className="block font-bold text-lg text-coc-gold">MASTER I</span><p className="text-xs uppercase text-gray-400">CWL League</p></div>
                <div className="bg-coc-stone/50 p-2 rounded"><span className="block font-bold text-lg text-coc-gold">45/50</span><p className="text-xs uppercase text-gray-400">Anggota</p></div>
                <div className="bg-coc-stone/50 p-2 rounded"><span className="block font-bold text-lg text-coc-gold">950</span><p className="text-xs uppercase text-gray-400">War Wins</p></div>
              </div>
              <Button href="/team/my-team" variant="secondary" className="w-full mt-4">Lihat Halaman Klan</Button>
            </div>
          </div>
          
          {/* Kolom Kanan (Side Info) */}
          <div className="space-y-8">
            {/* Ringkasan Profil */}
            <div className="bg-coc-stone-light/50 p-6 rounded-lg shadow-stone border border-coc-gold-dark/20 text-center">
              <h3 className="text-lg mb-4">RINGKASAN PROFIL ANDA</h3>
              <img src="/images/placeholder-avatar.png" alt="Avatar" className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold-dark"/>
              <div className="flex justify-around mt-4">
                  <div><p className="text-xs text-gray-400">TH LEVEL</p><span className="text-2xl font-bold">15</span></div>
                  <div><p className="text-xs text-gray-400">REPUTASI</p><span className="text-2xl font-bold">4.8 ★</span></div>
              </div>
              <a href="/profile" className="block mt-4 text-sm text-coc-gold hover:underline">Lengkapi E-Sports CV Anda &rarr;</a>
            </div>
            
            {/* Pengumuman */}
            <div className="bg-coc-stone-light/50 p-6 rounded-lg shadow-stone border border-coc-gold-dark/20">
              <h3 className="text-lg mb-4">PENGUMUMAN PENTING</h3>
              <div className="space-y-4">
                <a href="/news/1" className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors">
                  <p>Pembukaan Pendaftaran Liga Musim 3!</p>
                  <span className="text-xs text-gray-400">2 hari lalu</span>
                </a>
                <a href="/news/2" className="block hover:bg-coc-stone/30 p-2 rounded-md transition-colors">
                  <p>Update Game Terbaru: TH 17 Resmi Dirilis.</p>
                  <span className="text-xs text-gray-400">5 jam lalu</span>
                </a>
              </div>
            </div>
          </div>

        </section>

        {/* Rekomendasi Tim */}
        <section className="mb-12">
          <h2><CogsIcon className="inline-block mr-2 h-5 w-5"/> Rekomendasi Tim untuk Anda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
            {recommendedTeams.map(team => <TeamCard key={team.tag} {...team} />)}
          </div>
        </section>

        {/* Strategi Terbaru */}
        <section>
          <h2><BookOpenIcon className="inline-block mr-2 h-6 w-6"/> Strategi & Tips Terbaru</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            {latestPosts.map(post => <PostCard key={post.title} {...post} />)}
          </div>
        </section>

      </main>
    </>
  );
}

