import { Button } from "@/app/components/ui/Button";
import { TrophyIcon, SkullIcon, PercentageIcon, ShieldIcon } from "@/app/components/icons";
import Image from "next/image";

// Komponen ini berisi bagian statis dari halaman utama
// (Hero Banner dan panel info di bawahnya)
export default function HomeHeader() {
    return (
        <>
            {/* Hero Banner Section */}
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

            {/* Top Section - Statis (Info Panel) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                {/* Kolom Kiri & Tengah (Status Panel) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status War Mendatang (Statis) */}
                    <div className="card-stone p-6 flex flex-col justify-between">
                        {/* h3 akan otomatis menggunakan font-clash dari globals.css */}
                        <h3 className="text-xl mb-4 text-center border-b-2 border-coc-gold-dark/30 pb-2 flex items-center justify-center">
                            <ShieldIcon className="h-5 w-5 mr-2" /> STATUS WAR MENDATANG
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center my-4">
                            <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                <TrophyIcon className="mx-auto text-3xl text-coc-gold mb-2" />
                                {/* Statistik: font-sans (default), font-bold */}
                                <span className="block text-xl font-bold font-clash text-white">5 WINS</span>
                                <p className="text-xs text-gray-400 uppercase font-sans">Win Streak</p>
                            </div>
                            <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                <SkullIcon className="mx-auto text-3xl text-coc-red mb-2" />
                                {/* Statistik: font-sans (default), font-bold */}
                                <span className="block text-xl font-bold font-clash text-white">13.5</span>
                                <p className="text-xs text-gray-400 uppercase font-sans">Rata-rata TH Musuh</p>
                            </div>
                            <div className="bg-coc-stone/50 p-2 rounded-lg border border-coc-gold-dark/20">
                                <PercentageIcon className="mx-auto text-3xl text-coc-green mb-2" />
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
        </>
    );
}