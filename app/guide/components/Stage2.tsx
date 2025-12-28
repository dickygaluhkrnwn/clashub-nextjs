import React from 'react';
import {
  UserIcon,
  ShieldIcon,
  AlertTriangleIcon,
  LinkIcon,
  StarIcon,
  TrophyIcon
} from '@/app/components/icons';

const Stage2 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 2</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Manajemen Profil Player</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Profil Clashub Anda adalah pusat identitas digital Anda. Pelajari cara mengelolanya, memverifikasi akun game, dan memahami lencana pencapaian Anda.
        </p>
      </div>

      {/* Section 1: Dashboard Profil */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Memahami Dashboard Profil
        </h2>
        <p className="text-gray-300 mb-4">
          Halaman profil Anda menampilkan ringkasan data yang diambil langsung dari API Clash of Clans dan aktivitas Anda di platform ini.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                    <UserIcon className="h-5 w-5 text-coc-blue" /> Info Dasar
                </h3>
                <p className="text-sm text-gray-400">
                    Menampilkan nama, avatar, dan bio singkat. Data ini disinkronkan dengan akun Google Anda saat pendaftaran awal.
                </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                    <ShieldIcon className="h-5 w-5 text-coc-green" /> Status Klan
                </h3>
                <p className="text-sm text-gray-400">
                    Menunjukkan klan Anda saat ini, jabatan (Role), dan riwayat perpindahan klan yang tercatat di sistem kami.
                </p>
            </div>
        </div>
      </section>

      {/* Section 2: Menghubungkan Akun Game */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Menghubungkan Akun Game (Linking)
        </h2>
        
        <div className="bg-coc-blue/10 border-l-4 border-coc-blue p-4 mb-6">
            <p className="text-sm text-gray-200">
              <strong>Penting:</strong> Satu akun Clashub hanya dapat dihubungkan dengan <strong>satu</strong> akun Clash of Clans utama untuk keperluan turnamen.
            </p>
        </div>

        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="bg-black/30 p-3 rounded-lg h-fit">
                    <LinkIcon className="h-6 w-6 text-coc-gold" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg mb-2">Proses Verifikasi API</h3>
                    <p className="text-gray-300 text-sm mb-4">
                        Sistem kami menggunakan verifikasi 2 langkah untuk memastikan keamanan:
                    </p>
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-2">
                        <li><strong>Player Tag:</strong> Tanda pengenal publik (misal: #ABC1234).</li>
                        <li><strong>API Token:</strong> Kunci rahasia sementara yang hanya bisa dilihat oleh pemilik akun di dalam game.</li>
                    </ul>
                </div>
            </div>

            <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Masalah Umum (Troubleshooting)</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white text-sm font-bold">Error: "Invalid Token"</p>
                            <p className="text-gray-400 text-xs">Token API di CoC berubah secara berkala. Pastikan Anda menyalin token yang <em>fresh</em> dari pengaturan game.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white text-sm font-bold">Error: "Player Not Found"</p>
                            <p className="text-gray-400 text-xs">Periksa kembali Player Tag Anda. Pastikan karakter 'O' (huruf) dan '0' (angka) tidak tertukar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Section 3: Role & Lencana */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Role & Lencana (Badges)
        </h2>
        
        <p className="text-gray-300 mb-6">
            Profil Anda akan menampilkan lencana khusus berdasarkan pencapaian dan status Anda.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BadgeCard 
                icon={<StarIcon className="h-5 w-5 text-coc-gold" />}
                title="Verified Player"
                desc="Diberikan setelah sukses menghubungkan akun game dengan API Token."
                color="text-coc-gold"
                bgColor="bg-coc-gold/10"
                borderColor="border-coc-gold/20"
            />
            <BadgeCard 
                icon={<ShieldIcon className="h-5 w-5 text-coc-red" />}
                title="Clan Leader"
                desc="Otomatis terdeteksi jika Anda adalah pemimpin klan di dalam game."
                color="text-coc-red"
                bgColor="bg-coc-red/10"
                borderColor="border-coc-red/20"
            />
            <BadgeCard 
                icon={<TrophyIcon className="h-5 w-5 text-purple-400" />}
                title="Tournament Winner"
                desc="Lencana eksklusif bagi pemenang turnamen resmi Clashub."
                color="text-purple-400"
                bgColor="bg-purple-500/10"
                borderColor="border-purple-500/20"
            />
        </div>
      </section>
    </article>
  );
};

const BadgeCard = ({ icon, title, desc, color, bgColor, borderColor }: any) => (
    <div className={`p-4 rounded-xl border ${bgColor} ${borderColor} flex items-start gap-3`}>
        <div className={`mt-1 ${color}`}>{icon}</div>
        <div>
            <h4 className={`font-bold text-sm ${color} mb-1`}>{title}</h4>
            <p className="text-xs text-gray-400 leading-snug">{desc}</p>
        </div>
    </div>
);

export default Stage2;