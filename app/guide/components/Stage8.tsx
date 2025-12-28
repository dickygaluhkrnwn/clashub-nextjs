import React from 'react';
import {
  UserPlusIcon,
  CheckCircleIcon,
  SwordsIcon,
  AlertTriangleIcon,
  ClockIcon
} from '@/app/components/icons';

const Stage8 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 8</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Manajemen Turnamen (Peserta)</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Siap bertanding? Pelajari cara mendaftarkan klan, mengatur roster pemain, melakukan check-in, dan melaporkan hasil pertandingan.
        </p>
      </div>

      {/* Section 1: Mendaftar Turnamen */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Mendaftar Turnamen
        </h2>
        
        <p className="text-gray-300 mb-4">
            Cari turnamen yang berstatus <strong>"Registration Open"</strong> di halaman Turnamen.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <UserPlusIcon className="h-5 w-5 text-coc-blue" /> Syarat Pendaftaran
            </h3>
            <ul className="space-y-3 text-sm text-gray-300 ml-2">
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Role:</strong> Hanya Leader atau Co-Leader yang bisa mendaftarkan klan.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Kualifikasi TH:</strong> Pastikan Town Hall anggota Anda memenuhi persyaratan minimum turnamen.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-coc-gold">•</span>
                    <span><strong>Verifikasi:</strong> Anggota yang akan dimasukkan ke roster HARUS sudah memverifikasi akun Clashub mereka (Lihat Tahap 2).</span>
                </li>
            </ul>
        </div>
      </section>

      {/* Section 2: Mengatur Roster */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Mengatur Roster Pemain
        </h2>
        
        <p className="text-gray-300 mb-6">
            Roster adalah daftar pemain yang akan diturunkan dalam pertandingan.
        </p>

        <div className="bg-black/20 rounded-xl p-6 border border-white/10">
            <ol className="list-decimal list-inside space-y-4 text-gray-300">
                <li>Setelah mendaftar, buka halaman detail turnamen.</li>
                <li>Masuk ke tab <strong>"Manage Roster"</strong>.</li>
                <li>Pilih anggota dari daftar klan Anda. Sistem akan otomatis memfilter anggota yang memenuhi syarat TH.</li>
                <li>Klik <strong>"Submit Roster"</strong> sebelum batas waktu pendaftaran berakhir.</li>
            </ol>
            
            <div className="mt-4 flex items-start gap-3 bg-coc-red/10 p-3 rounded-lg border border-coc-red/20">
                <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0" />
                <p className="text-xs text-coc-red">
                    <strong>Penting:</strong> Pemain yang tidak ada di roster TIDAK BOLEH melakukan serangan saat perang. Pelanggaran dapat menyebabkan diskualifikasi.
                </p>
            </div>
        </div>
      </section>

      {/* Section 3: Check-in & Pertandingan */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Proses Pertandingan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard 
                icon={<CheckCircleIcon className="h-6 w-6 text-coc-green" />}
                title="Check-in"
                desc="Wajib dilakukan 30-60 menit sebelum pertandingan dimulai untuk konfirmasi kehadiran."
            />
            <ActionCard 
                icon={<SwordsIcon className="h-6 w-6 text-coc-red" />}
                title="Bertanding"
                desc="Lakukan Friendly War (FW) di dalam game sesuai instruksi bracket (durasi prep & war)."
            />
            <ActionCard 
                icon={<ClockIcon className="h-6 w-6 text-coc-gold" />}
                title="Tepat Waktu"
                desc="Keterlambatan mengirim undangan FW lebih dari 15 menit dapat dianggap WO (Walkover)."
            />
        </div>
      </section>

      {/* Section 4: Melaporkan Skor */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Melaporkan Hasil (Report Score)
        </h2>
        
        <p className="text-gray-300 mb-4">
            Setelah perang selesai, salah satu perwakilan tim wajib melaporkan hasil di Clashub.
        </p>

        <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex-shrink-0 font-bold text-coc-gold text-xl">A</div>
                <div>
                    <h4 className="text-white font-bold text-sm">Input Skor</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Masukkan jumlah Bintang dan Persentase Kerusakan (Percentage) tim Anda dan lawan.
                    </p>
                </div>
            </div>
            <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex-shrink-0 font-bold text-coc-gold text-xl">B</div>
                <div>
                    <h4 className="text-white font-bold text-sm">Upload Bukti</h4>
                    <p className="text-xs text-gray-400 mt-1">
                        Unggah screenshot hasil akhir perang sebagai bukti validasi jika diperlukan oleh admin.
                    </p>
                </div>
            </div>
        </div>
      </section>

    </article>
  );
};

const ActionCard = ({ icon, title, desc }: any) => (
    <div className="bg-black/30 p-5 rounded-xl border border-white/5 text-center hover:border-white/20 transition-colors">
        <div className="inline-block p-3 bg-white/5 rounded-full mb-3">
            {icon}
        </div>
        <h4 className="text-white font-bold text-sm mb-2">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default Stage8;