import React from 'react';
import {
  SearchIcon,
  FilterIcon,
  EyeIcon,
  UserPlusIcon,
  ShieldIcon,
  GlobeIcon
} from '@/app/components/icons';

const Stage3 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 3</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Clan Hub & Pencarian</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Temukan rumah baru untuk akun Clash of Clans Anda. Pelajari cara menggunakan fitur pencarian canggih dan memahami profil klan sebelum bergabung.
        </p>
      </div>

      {/* Section 1: Menjelajahi Clan Hub */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Menjelajahi Clan Hub
        </h2>
        <p className="text-gray-300 mb-4">
          <strong>Clan Hub</strong> adalah direktori publik yang menampilkan klan-klan terdaftar di Clashub. Berbeda dengan pencarian di dalam game, di sini Anda bisa melihat sejarah performa turnamen dan reputasi komunitas.
        </p>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-coc-blue/10 p-4 rounded-full">
                <SearchIcon className="h-8 w-8 text-coc-blue" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg mb-2">Pencarian Cerdas</h3>
                <p className="text-sm text-gray-400">
                    Anda dapat mencari klan berdasarkan Nama atau Clan Tag. Sistem kami juga memberikan rekomendasi klan yang sedang aktif merekrut member baru.
                </p>
            </div>
        </div>
      </section>

      {/* Section 2: Menggunakan Filter */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Menggunakan Filter Pencarian
        </h2>
        
        <p className="text-gray-300 mb-6">
            Gunakan fitur <strong>Filter</strong> untuk menyaring hasil pencarian agar sesuai dengan kriteria yang Anda inginkan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FilterCard 
                icon={<ShieldIcon className="h-5 w-5 text-coc-gold" />}
                title="Level Klan"
                desc="Cari klan dengan level perk tertentu (misal: Level 10+)."
            />
            <FilterCard 
                icon={<GlobeIcon className="h-5 w-5 text-coc-green" />}
                title="Lokasi & Bahasa"
                desc="Temukan klan dari negara atau bahasa komunikasi yang sama."
            />
            <FilterCard 
                icon={<FilterIcon className="h-5 w-5 text-purple-400" />}
                title="Tipe Klan"
                desc="Filter berdasarkan fokus: War Farming, Trophy Pushing, atau Competitive."
            />
        </div>
      </section>

      {/* Section 3: Profil Klan Publik */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Membaca Profil Klan Publik
        </h2>
        
        <p className="text-gray-300 mb-4">
            Sebelum memutuskan untuk bergabung, Anda bisa "mengintip" dapur klan tersebut melalui Profil Publik mereka.
        </p>

        <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <div className="flex-shrink-0 mt-1">
                    <EyeIcon className="h-6 w-6 text-coc-blue" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">War Log (Riwayat Perang)</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Lihat rasio kemenangan klan dalam 10 perang terakhir. Grafik hijau menandakan kemenangan beruntun (Win Streak).
                    </p>
                </div>
            </div>
            <div className="flex gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <div className="flex-shrink-0 mt-1">
                    <ShieldIcon className="h-6 w-6 text-coc-red" />
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Liga CWL & Capital</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Cek di liga apa mereka bermain saat CWL (misal: Champion I) dan level Ibu Kota Klan (Clan Capital) mereka.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Section 4: Request Join */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Mengajukan Request Join
        </h2>
        
        <div className="bg-coc-green/10 border border-coc-green/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <UserPlusIcon className="h-6 w-6 text-coc-green" />
                <h3 className="text-xl font-bold text-white">Fitur "Lamar" via Website</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                Jika klan sedang penuh di dalam game, Anda tetap bisa mengirimkan minat bergabung melalui Clashub.
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2 ml-2">
                <li>Buka Profil Klan yang Anda minati.</li>
                <li>Klik tombol <strong>"Request to Join"</strong> atau "Lamar".</li>
                <li>Tulis pesan singkat kepada Leader klan (opsional).</li>
                <li>Tunggu notifikasi. Jika diterima, Leader akan menghubungi Anda atau membuka slot di game.</li>
            </ol>
        </div>
      </section>

    </article>
  );
};

const FilterCard = ({ icon, title, desc }: any) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center hover:bg-white/10 transition-colors">
        <div className="inline-block p-2 bg-black/30 rounded-lg mb-3">
            {icon}
        </div>
        <h4 className="text-white font-bold text-sm mb-2">{title}</h4>
        <p className="text-xs text-gray-400">{desc}</p>
    </div>
);

export default Stage3;