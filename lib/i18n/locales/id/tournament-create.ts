import { TournamentCreateSection } from '../../sections/tournament-create';

export const tournamentCreate: TournamentCreateSection = {
  pageTitle: 'Buat Turnamen Baru',
  pageDesc: 'Isi detail di bawah ini untuk mempublikasikan turnamen Anda ke komunitas Clashub.',
  
  stepBasic: 'Info Dasar',
  stepFormat: 'Format & Jadwal',
  stepTh: 'Syarat TH',
  stepReview: 'Tinjauan',

  labelTitle: 'Nama Turnamen',
  placeholderTitle: 'Contoh: Clashub Championship Season 1',
  labelDesc: 'Deskripsi Singkat',
  placeholderDesc: 'Jelaskan tentang turnamen ini...',
  labelBanner: 'URL Banner (Imgur)',
  placeholderBanner: 'https://i.imgur.com/...',
  labelRules: 'Aturan Turnamen',
  placeholderRules: 'Tuliskan aturan lengkap di sini...',
  
  labelFormat: 'Mode Pertandingan',
  labelTeamSize: 'Ukuran Tim (Pemain)',
  labelParticipantCount: 'Jumlah Slot Tim',
  labelPrize: 'Total Hadiah',
  placeholderPrize: 'Contoh: Rp 1.000.000 atau 5000 Gems',

  labelRegStart: 'Mulai Pendaftaran',
  labelRegEnd: 'Tutup Pendaftaran',
  labelTourStart: 'Mulai Turnamen',
  labelTourEnd: 'Selesai Turnamen (Estimasi)',
  
  labelThMode: 'Mode Town Hall',
  optionAny: 'Bebas (Semua Level)',
  optionUniform: 'Seragam (Satu Level)',
  optionMixed: 'Campuran (Multi Level)',
  labelMinTh: 'Minimum TH',
  labelMaxTh: 'Maksimum TH',
  labelThLevel: 'Level TH yang Diizinkan',
  
  btnNext: 'Lanjut',
  btnBack: 'Kembali',
  btnSubmit: 'Buat Turnamen',
  btnSubmitting: 'Memproses...',

  errTitle: 'Judul wajib diisi',
  errDesc: 'Deskripsi wajib diisi',
  errDates: 'Tanggal tidak valid. Pastikan urutan waktu benar.',
  errTeams: 'Jumlah tim harus kelipatan 4 (min 4).',
  errTh: 'Syarat TH harus dipilih.',
  
  successTitle: 'Turnamen Berhasil Dibuat!',
  successDesc: 'Turnamen Anda kini berstatus "Draft". Silakan tinjau kembali sebelum membukanya untuk publik.',
  btnViewTournament: 'Lihat Turnamen',
};