import React from 'react';
import {
  CogsIcon,
  ShieldIcon,
  GlobeIcon,
  UserIcon,
  SettingsIcon,
  CheckCircleIcon
} from '@/app/components/icons';

const Stage4 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 4</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Dasar Manajemen Clan</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Panduan khusus untuk <strong>Leader</strong> dan <strong>Co-Leader</strong>. Pelajari cara mengklaim akses manajemen, mengatur profil klan, dan memahami fitur dasar dashboard Leader.
        </p>
      </div>

      {/* Section 1: Mengklaim Akses Manajemen */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Mendaftarkan & Mengklaim Klan
        </h2>
        
        <div className="bg-coc-blue/10 border-l-4 border-coc-blue p-4 mb-6">
            <p className="text-sm text-gray-200">
              <strong>Syarat Utama:</strong> Anda harus memiliki role <strong>Leader</strong> atau <strong>Co-Leader</strong> di dalam game <em>Clash of Clans</em> yang terhubung dengan akun Clashub Anda.
            </p>
        </div>

        <div className="space-y-4">
            <p className="text-gray-300">
                Langkah-langkah mengaktifkan fitur manajemen:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-2">
                <li>Pastikan Profil Player Anda sudah terverifikasi (Lihat Tahap 2).</li>
                <li>Buka halaman <strong>Profil Saya</strong>.</li>
                <li>Klik pada kartu Klan Anda untuk membuka Profil Klan Publik.</li>
                <li>
                    Jika Anda memenuhi syarat, tombol <strong>"Manage Clan"</strong> (Kelola Klan) akan muncul di bagian atas.
                </li>
                <li>Klik tombol tersebut untuk masuk ke <strong>Dashboard Manajemen</strong>.</li>
            </ol>
        </div>
      </section>

      {/* Section 2: Dashboard Manajemen */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Mengenal Dashboard Manajemen
        </h2>
        
        <p className="text-gray-300 mb-6">
            Dashboard Manajemen adalah pusat kendali klan Anda. Berikut adalah tab-tab utama yang tersedia:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard 
                icon={<CogsIcon className="h-5 w-5 text-coc-gold" />}
                title="Ringkasan (Summary)"
                desc="Panel utama yang menampilkan status sinkronisasi, perang aktif, dan anggota berprestasi."
            />
            <FeatureCard 
                icon={<UserIcon className="h-5 w-5 text-coc-blue" />}
                title="Anggota (Members)"
                desc="Daftar lengkap anggota dengan statistik partisipasi perang dan donasi."
            />
            <FeatureCard 
                icon={<ShieldIcon className="h-5 w-5 text-coc-red" />}
                title="War & CWL"
                desc="Manajemen strategi perang, analisis serangan, dan histori liga."
            />
            <FeatureCard 
                icon={<SettingsIcon className="h-5 w-5 text-gray-400" />}
                title="Pengaturan (Settings)"
                desc="Ubah deskripsi klan di website, link sosial media, dan preferensi rekrutmen."
            />
        </div>
      </section>

      {/* Section 3: Mengatur Profil Publik */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Mempercantik Profil Publik
        </h2>
        
        <p className="text-gray-300 mb-4">
            Agar klan Anda terlihat menarik bagi calon anggota baru, lengkapi informasi di tab <strong>Pengaturan</strong>.
        </p>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <ul className="space-y-4">
                <li className="flex gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-coc-green flex-shrink-0" />
                    <div>
                        <h4 className="text-white font-bold text-sm">Deskripsi Website</h4>
                        <p className="text-xs text-gray-400">Tulis deskripsi yang lebih panjang dan formatif dibandingkan deskripsi di dalam game. Jelaskan aturan klan dan jadwal perang.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <GlobeIcon className="h-6 w-6 text-coc-blue flex-shrink-0" />
                    <div>
                        <h4 className="text-white font-bold text-sm">Link Komunitas</h4>
                        <p className="text-xs text-gray-400">Tambahkan link invite Discord, grup WhatsApp, atau Instagram klan agar anggota mudah bergabung.</p>
                    </div>
                </li>
                <li className="flex gap-3">
                    <ShieldIcon className="h-6 w-6 text-purple-400 flex-shrink-0" />
                    <div>
                        <h4 className="text-white font-bold text-sm">Label Fokus</h4>
                        <p className="text-xs text-gray-400">Pilih tag yang sesuai: "War Focused", "Farming", "Friendly", dll.</p>
                    </div>
                </li>
            </ul>
        </div>
      </section>

      {/* Section 4: Manajemen Role Website */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Manajemen Role Website
        </h2>
        
        <p className="text-gray-300 mb-4">
            Clashub memiliki sistem role internal yang terpisah dari game. Ini memungkinkan Anda memberikan akses manajemen website kepada anggota tepercaya tanpa harus mempromosikan mereka di dalam game.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-black/30 text-white font-bold">
                    <tr>
                        <th className="p-4">Role Website</th>
                        <th className="p-4">Akses</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    <tr>
                        <td className="p-4 font-bold text-coc-gold">Owner (Leader)</td>
                        <td className="p-4">Akses penuh. Sinkronisasi data, pengaturan klan, manajemen admin, daftar turnamen.</td>
                    </tr>
                    <tr>
                        <td className="p-4 font-bold text-coc-blue">Admin (Co-Leader)</td>
                        <td className="p-4">Bisa melakukan sinkronisasi data, mengatur strategi perang, dan menerima member di website.</td>
                    </tr>
                    <tr>
                        <td className="p-4 font-bold text-gray-400">Member</td>
                        <td className="p-4">Hanya bisa melihat data, check-in turnamen, dan posting di Knowledge Hub.</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </section>

    </article>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-black/30 rounded-lg">
                {icon}
            </div>
            <h4 className="text-white font-bold text-sm">{title}</h4>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default Stage4;