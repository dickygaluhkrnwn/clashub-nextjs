import React from 'react';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  LogOutIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  CheckCircleIcon
} from '@/app/components/icons';

const Stage10 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 10</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Troubleshooting & FAQ</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Mengalami kendala? Temukan solusi untuk masalah umum seputar sinkronisasi data, manajemen akun, dan error teknis di sini.
        </p>
      </div>

      {/* Section 1: Masalah Sinkronisasi */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Kenapa Data Saya Tidak Update?
        </h2>
        
        <div className="space-y-4">
            <FAQItem 
                question="Saya sudah menyerang di war, tapi di website masih 'Missed Attack'."
                answer="Data Clashub tidak real-time detik-per-detik. Sistem otomatis kami memperbarui data setiap 10-15 menit. Jika Anda butuh data instan, minta Leader/Admin untuk menekan tombol 'Sync Manual' di dashboard manajemen."
            />
            <FAQItem 
                question="Tombol Sync Manual tidak bisa diklik (Loading terus)."
                answer="Ini bisa terjadi jika server API Supercell sedang Maintenance. Coba refresh halaman browser Anda atau tunggu 5-10 menit sebelum mencoba lagi."
            />
            <FAQItem 
                question="Data Log Perang (War History) tidak lengkap."
                answer="Jika Log Perang klan Anda diset ke 'Private' di dalam game CoC, kami tidak bisa mengambil detail serangan musuh. Pastikan Log Perang klan diset ke 'Public'."
            />
        </div>
      </section>

      {/* Section 2: Manajemen Akun & Klan */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Masalah Akun & Klan
        </h2>
        
        <div className="bg-black/20 rounded-xl p-6 border border-white/10 space-y-6">
            <div>
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                    <LogOutIcon className="h-5 w-5 text-coc-red" /> Bagaimana cara keluar dari klan di website?
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    Normalnya, sistem akan mendeteksi otomatis jika Anda keluar klan di game. Namun jika data "nyangkut":
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1 ml-2">
                    <li>Buka menu Sidebar di halaman Manajemen Klan.</li>
                    <li>Klik tombol <strong>"Keluar Klan"</strong> (Leave Clan) di bagian bawah.</li>
                    <li>Jika tombol tidak muncul atau error, gunakan fitur <strong>Force Unlink</strong> yang muncul saat terjadi error akses.</li>
                </ol>
            </div>

            <div className="border-t border-white/5 pt-4">
                <h3 className="text-white font-bold flex items-center gap-2 mb-2">
                    <AlertTriangleIcon className="h-5 w-5 text-coc-gold" /> Salah menghubungkan akun game?
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Jika Anda tidak sengaja memasukkan Player Tag yang salah, Anda bisa menghapusnya di halaman <strong>Profil Saya</strong> (ikon tempat sampah di sebelah akun game), lalu hubungkan ulang dengan Tag yang benar.
                </p>
            </div>
        </div>
      </section>

      {/* Section 3: Error Teknis */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Kode Error Umum
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ErrorCard 
                code="404 Not Found"
                desc="Data klan atau pemain tidak ditemukan di server CoC. Periksa kembali penulisan Tag (jangan tertukar O dan 0)."
            />
            <ErrorCard 
                code="403 Forbidden"
                desc="Akses ditolak. Biasanya karena API Token salah atau kadaluarsa saat verifikasi."
            />
            <ErrorCard 
                code="503 Service Unavailable"
                desc="Server Clash of Clans sedang Maintenance. Clashub tidak bisa mengambil data selama periode ini."
            />
            <ErrorCard 
                code="Timeout"
                desc="Proses sinkronisasi memakan waktu terlalu lama. Coba lakukan sinkronisasi parsial (tombol Sync di Header)."
            />
        </div>
      </section>

      {/* Section 4: Dukungan Komunitas */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Masih Butuh Bantuan?
        </h2>
        
        <div className="bg-coc-blue/10 border border-coc-blue/20 rounded-xl p-6 text-center">
            <HelpCircleIcon className="h-12 w-12 text-coc-blue mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Hubungi Tim Support</h3>
            <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
                Jika masalah Anda tidak tercantum di sini, silakan laporkan bug atau tanya langsung kepada admin melalui server Discord kami.
            </p>
            <a 
                href="https://discord.gg/clashub" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-colors"
            >
                <MessageSquareIcon className="h-5 w-5 mr-2" />
                Gabung Discord Clashub
            </a>
        </div>
      </section>

    </article>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
        <h4 className="text-white font-bold text-sm mb-2 flex items-start gap-2">
            <span className="text-coc-gold">Q:</span> {question}
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed ml-5">
            <span className="text-gray-500 font-bold mr-1">A:</span> {answer}
        </p>
    </div>
);

const ErrorCard = ({ code, desc }: { code: string, desc: string }) => (
    <div className="bg-black/30 p-4 rounded-lg border border-white/5 border-l-4 border-l-coc-red">
        <h4 className="text-coc-red font-mono font-bold text-sm mb-1">{code}</h4>
        <p className="text-xs text-gray-400">{desc}</p>
    </div>
);

export default Stage10;