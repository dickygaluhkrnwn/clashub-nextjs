import React from 'react';
import {
  RefreshCwIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  CoinsIcon
} from '@/app/components/icons';

const Stage5 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 5</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Fitur Sinkronisasi & Absensi</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Pahami bagaimana Clashub menjaga data klan Anda tetap segar dan bagaimana sistem absensi otomatis bekerja untuk memantau keaktifan anggota.
        </p>
      </div>

      {/* Section 1: Konsep Sinkronisasi */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Manual vs Otomatis
        </h2>
        
        <p className="text-gray-300 mb-6">
            Clashub menggunakan dua metode untuk menarik data terbaru dari server Supercell:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                    <ClockIcon className="h-5 w-5 text-coc-blue" /> Sinkronisasi Otomatis
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Sistem "robot" kami berjalan di latar belakang setiap <strong>10-15 menit</strong>. Robot ini akan mengecek klan secara bergilir untuk memperbarui data anggota, status perang, dan log serangan.
                </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                    <RefreshCwIcon className="h-5 w-5 text-coc-gold" /> Sinkronisasi Manual
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Tombol <strong>"Sync Data (API)"</strong> di tab Ringkasan. Gunakan ini jika Anda butuh data detik ini juga (misal: tepat setelah perang berakhir) dan tidak ingin menunggu giliran robot otomatis.
                </p>
            </div>
        </div>
      </section>

      {/* Section 2: Indikator Data Fresh */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Indikator Status Data
        </h2>
        
        <p className="text-gray-300 mb-4">
            Di pojok kanan atas Dashboard Manajemen, Anda akan melihat indikator status data:
        </p>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-bold uppercase">Data Fresh</span>
                </div>
                <p className="text-sm text-gray-400">Data berhasil diperbarui kurang dari 1 jam yang lalu.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 text-xs font-bold uppercase">Sync Needed</span>
                </div>
                <p className="text-sm text-gray-400">Data sudah "basi" (lebih dari 1 jam). Disarankan menekan tombol Sync Manual.</p>
            </div>
        </div>
      </section>

      {/* Section 3: Absensi Otomatis */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Sistem Absensi Anggota
        </h2>
        
        <div className="bg-coc-green/10 border border-coc-green/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircleIcon className="h-6 w-6 text-coc-green flex-shrink-0 mt-1" />
            <div>
                <h4 className="text-white font-bold text-sm">Tidak Perlu Absen Manual!</h4>
                <p className="text-xs text-gray-300 mt-1">
                    Clashub menghitung keaktifan berdasarkan <strong>tindakan nyata</strong> di dalam game. Leader tidak perlu memanggil nama satu per satu.
                </p>
            </div>
        </div>

        <p className="text-gray-300 mb-4">
            Sistem kami menilai keaktifan anggota (Score) berdasarkan 3 pilar utama:
        </p>

        <div className="space-y-3">
            <MetricCard 
                title="Partisipasi Perang" 
                desc="Menggunakan serangan saat Clan War & CWL. Serangan yang terlewat (Missed Attack) akan mengurangi skor secara drastis."
                score="+20 poin / serangan"
            />
            <MetricCard 
                title="Donasi Pasukan" 
                desc="Jumlah donasi pasukan dan spell kepada teman satu klan."
                score="+1 poin / 50 donasi"
            />
            <MetricCard 
                title="Raid Weekend" 
                desc="Keaktifan menyerang distrik musuh setiap akhir pekan."
                score="+10 poin / minggu"
            />
        </div>
      </section>

      {/* Section 4: Tabel Anggota */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Membaca Tabel Anggota
        </h2>
        
        <p className="text-gray-300 mb-4">
            Buka tab <strong>Anggota (Members)</strong> untuk melihat hasil kalkulasi absensi.
        </p>

        <ul className="space-y-4 text-gray-300">
            <li className="flex gap-3 bg-white/5 p-3 rounded-lg">
                <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0" />
                <div className="text-sm">
                    <strong>Missed Attacks:</strong> Kolom ini paling krusial. Angka merah menunjukkan berapa kali anggota tersebut absen menyerang dalam perang padahal dia terdaftar.
                </div>
            </li>
            <li className="flex gap-3 bg-white/5 p-3 rounded-lg">
                <UserIcon className="h-5 w-5 text-coc-blue flex-shrink-0" />
                <div className="text-sm">
                    <strong>Role Website:</strong> Membedakan antara jabatan di game (Leader/Elder) dan hak akses di Clashub (Admin/Member).
                </div>
            </li>
            <li className="flex gap-3 bg-white/5 p-3 rounded-lg">
                <CoinsIcon className="h-5 w-5 text-coc-gold flex-shrink-0" />
                <div className="text-sm">
                    <strong>Donasi Ratio:</strong> Perbandingan antara memberi (Donated) dan menerima (Received). Rasio buruk mungkin menandakan "Leecher".
                </div>
            </li>
        </ul>
      </section>

    </article>
  );
};

const MetricCard = ({ title, desc, score }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/20 p-4 rounded-lg border border-white/5">
        <div>
            <h4 className="text-white font-bold text-sm">{title}</h4>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
        </div>
        <div className="mt-2 sm:mt-0 bg-white/10 px-3 py-1 rounded text-xs font-mono text-coc-gold whitespace-nowrap">
            {score}
        </div>
    </div>
);

export default Stage5;