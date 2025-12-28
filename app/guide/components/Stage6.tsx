import React from 'react';
import {
  SwordsIcon,
  BookOpenIcon,
  ShieldIcon,
  DownloadIcon,
  BarChart2Icon,
  EyeIcon
} from '@/app/components/icons';

const Stage6 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 6</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Manajemen Perang & Liga</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Ubah data mentah perang menjadi strategi kemenangan. Pelajari cara menggunakan alat analisis Clashub untuk mengevaluasi performa Clan War dan CWL.
        </p>
      </div>

      {/* Section 1: Dashboard Perang Aktif */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Memantau Perang Aktif (Live War)
        </h2>
        
        <p className="text-gray-300 mb-4">
            Tab <strong>"Active War"</strong> memberikan pandangan real-time tentang perang yang sedang berlangsung. Fitur ini lebih detail daripada tampilan di dalam game.
        </p>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10 space-y-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-coc-blue" /> Fitur Unggulan:
            </h3>
            <ul className="space-y-3 text-sm text-gray-300 ml-2">
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Sisa Serangan:</strong> Lihat siapa saja yang belum menggunakan serangan mereka. Sangat berguna untuk mengingatkan anggota di menit-menit akhir.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Kerusakan Rata-rata:</strong> Statistik <em>Average Destruction</em> membantu memprediksi hasil akhir jika terjadi seri bintang.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Detail Serangan Musuh:</strong> Analisis pola serangan musuh (apakah mereka menyerang atas atau bawah terlebih dahulu).</span>
                </li>
            </ul>
        </div>
      </section>

      {/* Section 2: War History (Log Perang) */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Analisis War History
        </h2>
        
        <p className="text-gray-300 mb-6">
            Jangan biarkan data perang lama hilang begitu saja. Clashub menyimpan arsip perang Anda jauh lebih lama daripada game aslinya.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                    <BookOpenIcon className="h-5 w-5 text-coc-green" /> Arsip Detail
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Setiap perang yang selesai akan masuk ke <strong>War History</strong>. Anda bisa membuka kembali detail perang bulan lalu untuk mengevaluasi strategi atau performa anggota tertentu.
                </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="text-white font-bold flex items-center gap-2 mb-3">
                    <BarChart2Icon className="h-5 w-5 text-purple-400" /> Tren Kemenangan
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Grafik batang visual memudahkan Anda melihat tren performa klan. Apakah klan sedang dalam <em>Win Streak</em> atau perlu perbaikan strategi?
                </p>
            </div>
        </div>
      </section>

      {/* Section 3: Manajemen CWL (Liga Perang) */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Manajemen CWL
        </h2>
        
        <div className="bg-coc-blue/10 border border-coc-blue/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldIcon className="h-6 w-6 text-coc-blue flex-shrink-0 mt-1" />
            <div>
                <h4 className="text-white font-bold text-sm">Dashboard Liga Khusus</h4>
                <p className="text-xs text-gray-300 mt-1">
                    Saat musim CWL dimulai, tab khusus akan aktif. Anda bisa melihat klasemen grup secara real-time dan performa individu setiap ronde.
                </p>
            </div>
        </div>

        <p className="text-gray-300 mb-4">
            Fitur analisis CWL membantu Leader dalam:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-300 ml-2">
            <li>Menentukan siapa yang layak mendapatkan bonus medali.</li>
            <li>Mengidentifikasi anggota yang konsisten mendapatkan 3 bintang.</li>
            <li>Melihat perbandingan level Town Hall klan kita vs musuh di grup.</li>
        </ul>
      </section>

      {/* Section 4: Export Data */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Export Data ke Excel/CSV
        </h2>
        
        <p className="text-gray-300 mb-4">
            Untuk analisis lebih lanjut di luar platform, Clashub menyediakan fitur export data.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-green-500/10 p-4 rounded-full border border-green-500/20">
                <DownloadIcon className="h-8 w-8 text-green-500" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg mb-2">Download Laporan Bulanan</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Anda bisa mengunduh rekapitulasi absensi, donasi, dan performa perang seluruh anggota dalam format <code>.csv</code> atau <code>.xlsx</code>.
                </p>
                <div className="inline-block bg-black/30 px-3 py-1 rounded text-xs text-gray-500 border border-white/5 font-mono">
                    Lokasi: Tab Anggota &gt; Tombol "Export Data" (Pojok Kanan Atas)
                </div>
            </div>
        </div>
      </section>

    </article>
  );
};

export default Stage6;