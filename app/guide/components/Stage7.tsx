import React from 'react';
import {
  TrophyIcon,
  PlusIcon,
  UsersIcon,
  SettingsIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@/app/components/icons';

const Stage7 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 7</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Manajemen Turnamen (Organizer)</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Panduan lengkap untuk penyelenggara. Pelajari cara membuat turnamen profesional, mengatur bracket, dan mengelola pendaftaran tim.
        </p>
      </div>

      {/* Section 1: Membuat Turnamen */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Membuat Turnamen Baru
        </h2>
        
        <p className="text-gray-300 mb-4">
            Siapapun bisa menjadi penyelenggara di Clashub. Berikut langkah awal untuk membuat kompetisi Anda sendiri:
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <ol className="space-y-4">
                <li className="flex gap-4">
                    <div className="bg-coc-gold/10 p-3 rounded-lg h-fit">
                        <TrophyIcon className="h-6 w-6 text-coc-gold" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Akses Menu Turnamen</h4>
                        <p className="text-sm text-gray-400">
                            Navigasi ke halaman <strong>Turnamen</strong> melalui menu utama, lalu klik tombol <strong>"Buat Turnamen"</strong> (Create Tournament).
                        </p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="bg-coc-blue/10 p-3 rounded-lg h-fit">
                        <SettingsIcon className="h-6 w-6 text-coc-blue" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Isi Detail Dasar</h4>
                        <p className="text-sm text-gray-400">
                            Lengkapi informasi penting seperti Nama Turnamen, Deskripsi, Banner, dan Tanggal Pelaksanaan.
                        </p>
                    </div>
                </li>
            </ol>
        </div>
      </section>

      {/* Section 2: Konfigurasi Format */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Format & Aturan Main
        </h2>
        
        <p className="text-gray-300 mb-6">
            Tentukan bagaimana pemenang akan ditentukan. Clashub mendukung berbagai format kompetisi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                <h3 className="text-white font-bold mb-2">Sistem Eliminasi (Bracket)</h3>
                <p className="text-sm text-gray-400 mb-3">
                    Tim yang kalah langsung gugur (Single Elimination). Cocok untuk turnamen dengan durasi singkat.
                </p>
                <span className="text-xs bg-coc-green/20 text-coc-green px-2 py-1 rounded">Otomatis Generate Bracket</span>
            </div>
            <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                <h3 className="text-white font-bold mb-2">Ukuran Tim (Team Size)</h3>
                <p className="text-sm text-gray-400">
                    Tentukan jumlah pemain per tim (misal: 5v5, 10v10, atau 15v15). Sistem akan memvalidasi roster saat pendaftaran.
                </p>
            </div>
        </div>
      </section>

      {/* Section 3: Manajemen Peserta */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Mengelola Pendaftaran
        </h2>
        
        <div className="space-y-4">
            <p className="text-gray-300">
                Sebagai organizer, Anda memiliki kontrol penuh atas siapa yang boleh bermain.
            </p>

            <div className="bg-white/5 p-4 rounded-xl border-l-4 border-coc-gold">
                <h4 className="text-white font-bold text-sm mb-1">Open vs Invite-Only</h4>
                <p className="text-xs text-gray-400">
                    Anda bisa membuat turnamen terbuka untuk publik atau hanya untuk klan tertentu yang Anda undang (Private).
                </p>
            </div>

            <ul className="space-y-2 text-gray-300 ml-2">
                <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-coc-green" />
                    <span><strong>Approve/Reject:</strong> Tinjau pendaftaran klan yang masuk. Cek apakah roster mereka memenuhi syarat TH.</span>
                </li>
                <li className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-purple-400" />
                    <span><strong>Invite Clan:</strong> Undang klan spesifik menggunakan Clan Tag mereka langsung dari dashboard.</span>
                </li>
            </ul>
        </div>
      </section>

      {/* Section 4: Menjalankan Turnamen */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Menjalankan Turnamen
        </h2>
        
        <p className="text-gray-300 mb-4">
            Saat kuota terpenuhi atau waktu mulai tiba, saatnya memulai aksi!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StepCard 
                step="1"
                title="Generate Bracket"
                desc="Klik tombol 'Generate Bracket' untuk mengacak posisi tim secara otomatis."
            />
            <StepCard 
                step="2"
                title="Start Match"
                desc="Mulai pertandingan. Status turnamen akan berubah menjadi 'Live'."
            />
            <StepCard 
                step="3"
                title="Verifikasi Skor"
                desc="Pantau laporan skor dari peserta. Anda bisa mengoreksi skor jika terjadi sengketa."
            />
        </div>
      </section>

    </article>
  );
};

const StepCard = ({ step, title, desc }: any) => (
    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
            {step}
        </div>
        <h4 className="text-white font-bold text-sm mb-2">{title}</h4>
        <p className="text-xs text-gray-400">{desc}</p>
    </div>
);

export default Stage7;