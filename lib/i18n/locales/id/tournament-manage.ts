import { TournamentManageSection } from '../../sections/tournament-manage';

export const tournamentManage: TournamentManageSection = {
  // Header & Navigation
  title: 'Manajemen Turnamen',
  btnBack: 'Kembali ke Hub',
  btnToggleMenu: 'Buka Menu',
  btnCloseMenu: 'Tutup Menu',
  
  // Tabs
  tabParticipants: 'Peserta',
  tabStaff: 'Staf & Panitia',
  tabBracket: 'Bracket & Jadwal',
  tabSettings: 'Pengaturan',

  // Notifications
  toastSuccess: 'Aksi berhasil! Memuat ulang data...',
  
  // Error States
  accessDeniedTitle: 'Akses Ditolak',
  accessDeniedDesc: 'Anda bukan panitia atau organizer turnamen ini.',
  notFoundTitle: 'Turnamen Tidak Ditemukan',
  notFoundDesc: 'Turnamen yang Anda cari tidak ada atau telah dihapus.',
  btnBackToHub: 'Kembali ke Turnamen Saya',

  // Participant Manager
  partTitle: 'Manajemen Peserta',
  partApproved: 'Disetujui',
  partPending: 'Menunggu',
  partRejected: 'Ditolak',
  partStatusApproved: 'Disetujui',
  partStatusRejected: 'Ditolak',
  partStatusPending: 'Menunggu',
  partOrigin: 'Asal',
  partMembers: 'Anggota Tim',
  partEmptyTitle: 'Belum Ada Pendaftar',
  partEmptyDesc: 'Belum ada tim yang mendaftar ke turnamen ini.',
  partToastUpdating: 'Memperbarui status tim...',

  // Bracket Generator
  bracketGen: {
    titleReady: 'Siap Memulai Turnamen!',
    descReady: 'Semua {count} tim peserta telah disetujui dan pendaftaran telah ditutup. Tekan tombol di bawah untuk mengacak dan membuat bracket double elimination.',
    attention: 'PERHATIAN: Aksi ini tidak dapat dibatalkan.',
    btnGenerate: 'Generate Bracket Sekarang',
    btnGenerating: 'Membuat Bracket...',

    titleUnderQuota: 'Pendaftaran Ditutup (Kuota Tidak Penuh)',
    descUnderQuota: 'Pendaftaran telah ditutup, namun kuota turnamen tidak terpenuhi.',
    descOptions: 'Anda memiliki 2 pilihan:',
    btnStartUnderQuota: 'Mulai dengan {count} Tim',
    btnCancelTournament: 'Batalkan Turnamen',

    titleEmpty: 'Pendaftaran Ditutup (Tidak Ada Peserta)',
    descEmpty: 'Pendaftaran telah ditutup dan tidak ada tim yang disetujui.',

    statusBracketCreated: 'Bracket turnamen telah dibuat.',
    statusCompleted: 'Turnamen telah selesai.',
    statusCancelled: 'Turnamen ini telah dibatalkan.',
    statusRegNotClosed: 'Pendaftaran Belum Ditutup',
    descRegNotClosed: 'Status turnamen saat ini adalah',
    descRegNotClosedAuto: 'Bracket baru dapat dibuat setelah pendaftaran ditutup secara otomatis (pada {date}).',

    toastGenerating: 'Sedang mengacak dan membuat bracket...',
    toastStarting: 'Memulai turnamen dengan {count} tim...',
    toastCancelling: 'Membatalkan turnamen...',

    modalStartTitle: 'Mulai Turnamen (Under Quota)?',
    modalStartDesc: 'Aksi ini akan membuat bracket {size} tim, menambahkan "BYE" (Lolos Otomatis) untuk mengisi slot kosong, dan mengubah status turnamen menjadi \'ongoing\'.\n\nAksi ini tidak dapat dibatalkan.',
    modalStartConfirm: 'Ya, Mulai Turnamen',

    modalCancelTitle: 'Batalkan Turnamen Ini?',
    modalCancelDesc: 'Aksi ini akan mengubah status turnamen menjadi \'cancelled\'.\nSemua tim yang terdaftar akan diberi notifikasi (jika ada).\n\nAksi ini tidak dapat dibatalkan.',
    modalCancelConfirm: 'Ya, Batalkan',
  },

  // Settings Manager
  settings: {
    title: 'Pengaturan Klan Panitia',
    desc: 'Ini adalah 2 klan yang Anda (panitia) kontrol penuh. Semua pertandingan akan diselenggarakan di dalam 2 klan ini agar website dapat menarik data live war.',
    labelClanA: 'Tag Klan A Panitia',
    labelClanB: 'Tag Klan B Panitia',
    btnSave: 'Simpan Pengaturan Klan',
    btnSaving: 'Menyimpan...',
    errFormat: 'Format Tag Klan tidak valid. Harus diawali #.',
    errSame: 'Tag Klan A dan B tidak boleh sama.',
    errSave: 'Gagal menyimpan pengaturan.',
  },

  // Schedule Manager
  schedule: {
    title: 'Manajemen Jadwal & Hasil Pertandingan',
    byeTbd: 'BYE / TBD',
    setWinner: 'Set {team} Menang',
    winnerLabel: 'Pemenang: {team}',
    statusLabel: 'Status: {status}',
    emptyTitle: 'Data Match Tidak Ditemukan',
    emptyDesc: 'Data match untuk turnamen ini belum ada atau gagal dimuat.',
    btnRetry: 'Coba Muat Ulang',
    toastSaving: 'Menyimpan jadwal untuk Match {id}...',
    toastReporting: 'Melaporkan pemenang untuk Match {id}...',
  },

  // Staff Manager
  staff: {
    inviteTitle: 'Undang Panitia Baru',
    inviteDesc: 'Panitia yang diundang akan mendapatkan hak akses yang sama (kecuali mengeluarkan organizer) untuk mengelola turnamen ini.',
    inputPlaceholder: 'Masukkan email user Clashub...',
    btnInvite: 'Undang',
    btnInviting: 'Mengundang...',
    listTitle: 'Staf & Panitia Saat Ini',
    listError: 'Gagal memuat data staf.',
    listRetry: 'Coba Lagi',
    labelYou: '(Anda)',
    roleOrganizer: 'Organizer',
    toastInviting: 'Mengundang panitia...',
    toastRemoving: 'Mengeluarkan panitia...',
    toastRemoveSuccess: 'Panitia berhasil dikeluarkan.',
  },
};