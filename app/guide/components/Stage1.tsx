import React from 'react';
import { 
  ShieldIcon, 
  TrophyIcon, 
  UserIcon, 
  BookOpenIcon, 
  CheckCircleIcon,
  AlertTriangleIcon
} from '@/app/components/icons';

const Stage1 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Judul Besar */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 1</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Pengenalan & Pendaftaran</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Selamat datang di <strong>Clashub</strong>. Panduan ini akan membantu Anda memahami dasar-dasar platform dan cara memulai langkah pertama Anda dengan benar.
        </p>
      </div>

      {/* Bagian 1: Apa itu Clashub */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Apa itu Clashub?
        </h2>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <p className="text-gray-300 mb-4">
            Clashub adalah platform manajemen komunitas <em>Clash of Clans</em> all-in-one. Kami menghubungkan data langsung dari game untuk memberikan analisis mendalam yang tidak bisa Anda temukan di dalam game itu sendiri.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <FeatureCard 
              icon={<ShieldIcon className="h-6 w-6 text-coc-blue" />}
              title="Manajemen Clan"
              desc="Pantau aktivitas member, riwayat perang, dan performa CWL."
            />
            <FeatureCard 
              icon={<TrophyIcon className="h-6 w-6 text-coc-gold" />}
              title="Sistem Turnamen"
              desc="Buat atau ikuti turnamen dengan sistem bracket otomatis."
            />
            <FeatureCard 
              icon={<UserIcon className="h-6 w-6 text-coc-green" />}
              title="Profil Player"
              desc="Lacak perkembangan akun dan riwayat perpindahan klan."
            />
            <FeatureCard 
              icon={<BookOpenIcon className="h-6 w-6 text-purple-400" />}
              title="Knowledge Hub"
              desc="Berbagi strategi base dan tips serangan terbaru."
            />
          </div>
        </div>
      </section>

      {/* Bagian 2: Cara Mendaftar */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Cara Mendaftar (Login)
        </h2>

        <div className="space-y-4">
          <p className="text-gray-300">
            Kami menggunakan sistem <strong>Google Authentication</strong> untuk keamanan maksimal. Anda tidak perlu membuat password baru.
          </p>
          
          <ol className="list-decimal list-inside space-y-4 text-gray-300 ml-2">
            <li className="pl-2">
              Klik tombol <span className="text-coc-gold font-bold">Masuk / Login</span> di pojok kanan atas layar.
            </li>
            <li className="pl-2">
              Pilih opsi <span className="bg-white text-black px-2 py-0.5 rounded text-sm font-bold">Continue with Google</span>.
            </li>
            <li className="pl-2">
              Pilih akun Google yang ingin Anda gunakan. Akun Clashub Anda akan otomatis dibuat.
            </li>
          </ol>

          <div className="bg-coc-blue/10 border-l-4 border-coc-blue p-4 mt-4">
            <p className="text-sm text-gray-200">
              <strong>Catatan Keamanan:</strong> Kami tidak pernah menyimpan password email Anda. Login diproses langsung oleh Google secara aman.
            </p>
          </div>
        </div>
      </section>

      {/* Bagian 3: Verifikasi Akun */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Verifikasi Akun Awal
        </h2>

        <p className="text-gray-300 mb-6">
          Setelah login, langkah terpenting adalah menghubungkan akun Clash of Clans Anda agar profil website menjadi valid.
        </p>

        <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 font-bold text-white">
            Langkah-langkah Verifikasi:
          </div>
          <div className="p-6 space-y-6">
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">A</div>
              <div>
                <h4 className="text-white font-bold mb-1">Ambil Player Tag</h4>
                <p className="text-sm text-gray-400">
                  Buka game CoC, buka profil Anda (pojok kiri atas), dan salin kode di bawah nama Anda. <br/>
                  Contoh: <code className="bg-black/50 px-1 py-0.5 rounded text-coc-gold">#2ABC9XYZ</code>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">B</div>
              <div>
                <h4 className="text-white font-bold mb-1">Ambil API Token (Opsional tapi Penting)</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Beberapa fitur memerlukan verifikasi kepemilikan penuh.
                </p>
                <div className="bg-white/5 p-3 rounded text-xs text-gray-300 font-mono">
                  Game CoC &gt; Pengaturan (Gerigi) &gt; Setelan Tambahan &gt; (Scroll Bawah) &gt; API Token: Tampilkan
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">C</div>
              <div>
                <h4 className="text-white font-bold mb-1">Masukkan di Clashub</h4>
                <p className="text-sm text-gray-400">
                  Kembali ke website ini, buka menu <strong>Profil Saya</strong>, dan tempelkan data tersebut di kolom verifikasi.
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 bg-coc-red/10 p-4 rounded-xl border border-coc-red/20">
          <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <span className="text-coc-red font-bold block mb-1">Penting:</span>
            Pastikan akun yang Anda hubungkan adalah milik Anda sendiri. Menghubungkan akun orang lain dapat menyebabkan akun Clashub Anda di-banned dari turnamen.
          </div>
        </div>
      </section>

    </article>
  );
};

// Helper Component untuk Feature Card
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-black/20 p-4 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
    <div className="mb-3">{icon}</div>
    <h3 className="text-white font-bold mb-1">{title}</h3>
    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export default Stage1;