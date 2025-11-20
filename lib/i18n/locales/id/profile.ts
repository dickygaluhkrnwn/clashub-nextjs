import * as ProfileTypes from '../../sections/profile';

export const profile: ProfileTypes.ProfileSection = {
  errorVerifiedNoTag: 'Profil ini terverifikasi namun player tag tidak ditemukan.',
  errorJson: 'Gagal parse JSON. Kemungkinan API route 404 (salah URL) atau server down.',
  errorUnknown: 'Terjadi kesalahan yang tidak diketahui saat mengambil data CoC.',
  connectTagDesc: 'Hubungkan tag Clash of Clans Anda untuk melihat data pasukan.',
  connectTagAchievements: 'Hubungkan tag Clash of Clans Anda untuk melihat pencapaian.',
  tabSummary: 'Ringkasan',
  tabReputation: 'Reputasi',
  tabArmy: 'Pasukan',
  tabAchievements: 'Prestasi',
  tabHistory: 'Riwayat',
  tabPosts: 'Postingan',
};

export const profileHeader: ProfileTypes.ProfileHeaderSection = {
  verified: 'Akun CoC Terverifikasi',
  unverified: 'Akun CoC Belum Terverifikasi',
  viewCocProfile: 'Profil CoC',
  editVerify: 'Edit Profil & Verifikasi',
  editStartVerify: 'Edit Profil & Mulai Verifikasi',
};

export const profileSidebar: ProfileTypes.ProfileSidebarSection = {
  tagNotSet: 'TAG BELUM DIATUR',
  freeAgent: 'Free Agent',
  competitive: 'Kompetitif',
  casual: 'Kasual',
  verified: 'CoC Terverifikasi',
  unverified: 'Belum Terverifikasi',
  bioVision: 'Bio & Visi',
  noBio: 'Belum ada bio.',
  preferences: 'Preferensi',
  role: 'Role Main:',
  activeHours: 'Jam Aktif:',
  notSet: 'Belum Diatur',
  contact: 'Kontak',
  websiteNotSet: 'Website belum diatur',
  popularityPoints: 'Poin Popularitas',
  viewDetails: 'Lihat Detail Poin & Badges',
  commitmentReputation: 'Reputasi Komitmen',
  basedOnReviews: '(Berdasarkan {count} ulasan)',
  manageMyClan: 'Kelola Klan Saya',
};

export const profileCards: ProfileTypes.ProfileCardsSection = {
  clanIdentity: 'Identitas Klan',
  notInClan: 'Pemain ini tidak terikat klan.',
  townHall: 'Town Hall',
  thLevel: 'Level TH',
  xpLevel: 'Level XP',
  seasonStats: 'Statistik Musim',
  fetchErrorTitle: 'Gagal mengambil data live CoC:',
  currentLeague: 'Liga Saat Ini',
  unranked: 'Unranked',
  homeTrophies: 'Trofi Home',
  builderTrophies: 'Trofi Builder',
  attackWins: 'Menang Serangan',
  defenseWins: 'Menang Bertahan',
  warStars: 'Bintang War',
  loading: 'Memuat...',
};

export const recentActivity: ProfileTypes.RecentActivitySection = {
  title: 'Aktivitas Terbaru',
  replies: 'Balasan',
  likes: 'Likes',
  viewAllPosts: 'Lihat Semua Postingan Saya',
  noPosts: 'Anda belum memposting di Knowledge Hub.',
  createFirstPost: 'Buat Postingan Pertama Anda',
};

export const profileArmy: ProfileTypes.ProfileArmySection = {
  heroTitle: 'Hero (Home Village)',
  heroLoading: 'Memuat data hero...',
  heroError: 'Gagal memuat hero: {error}',
  heroEmpty: 'Data hero tidak ditemukan atau player belum memiliki hero.',
  troopsTitle: 'Pasukan (Home Village)',
  troopsLoading: 'Memuat data pasukan...',
  troopsError: 'Gagal memuat pasukan: {error}',
  superTroops: 'Super Troops Aktif',
  regularTroops: 'Pasukan Elixir & Dark Elixir',
  troopsEmpty: 'Data pasukan tidak ditemukan.',
  spellsTitle: 'Spell (Home Village)',
  spellsLoading: 'Memuat data spell...',
  spellsError: 'Gagal memuat spell: {error}',
  spellsEmpty: 'Data spell tidak ditemukan atau player belum membuka spell.',
  heroErrorMsg: 'Gagal memuat hero: {error}',
  troopsErrorMsg: 'Gagal memuat pasukan: {error}',
  spellsErrorMsg: 'Gagal memuat spell: {error}',
};

export const profileAchievements: ProfileTypes.ProfileAchievementsSection = {
  title: 'Pencapaian',
  loading: 'Memuat data pencapaian...',
  error: 'Gagal memuat pencapaian: {error}',
  empty: 'Data pencapaian tidak ditemukan.',
};

export const profileHistory: ProfileTypes.ProfileHistorySection = {
  title: 'Riwayat Tim Clashub',
  empty: 'Anda belum memiliki riwayat tim di Clashub.',
  joined: 'Bergabung',
  left: 'Keluar',
  kicked: 'Dikeluarkan',
  unknownClan: 'Klan Tidak Dikenal',
  unknownDate: 'Tanggal tidak diketahui',
};

export const profileReviews: ProfileTypes.ProfileReviewsSection = {
  title: 'Ulasan Diterima',
  empty: 'Anda belum menerima ulasan dari pemain lain.',
  context: 'Konteks',
};

export const cards: ProfileTypes.CardsSection = {
  vision: 'Visi:',
  avgTh: 'Rata-rata TH:',
  viewClan: 'Lihat Clan',
  by: 'Oleh:',
  statusScheduled: 'Terjadwal',
  statusRegOpen: 'Pendaftaran Dibuka',
  statusRegClosed: 'Pendaftaran Ditutup',
  statusOngoing: 'Live',
  statusCompleted: 'Selesai',
  statusCancelled: 'Dibatalkan',
  statusDraft: 'Draft',
  requirements: 'Syarat:',
  prizePool: 'Hadiah:',
  viewDetails: 'Lihat Detail',
  role: 'Role Clashub:',
  townHall: 'Town Hall:',
  reputation: 'Reputasi:',
  viewPlayer: 'Lihat Player',
};

export const profileError: ProfileTypes.ProfileErrorSection = {
  incompleteTitle: 'Profil Belum Lengkap',
  startEdit: 'Mulai Edit CV',
  errorTitle: 'Error Memuat Profil',
  retry: 'Coba Lagi',
};

export const profileLoading: ProfileTypes.ProfileLoadingSection = {
  message: 'Memuat Sesi Pengguna...',
};