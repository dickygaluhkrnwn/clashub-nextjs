import { KnowledgeHubSection } from '../../sections/knowledge-hub';

export const knowledgeHub: KnowledgeHubSection = {
  page: {
    title: "Pusat Pengetahuan",
    description: "Bagikan dan temukan strategi Clash of Clans serta desain base terbaik.",
    createButton: "Buat Postingan",
    searchPlaceholder: "Cari postingan...",
    filters: {
      all: "Semua Post",
      baseBuilding: "Desain Base",
      attackStrategy: "Strategi Serangan",
    },
    emptyState: "Tidak ada postingan ditemukan. Jadilah yang pertama membagikan pengetahuan Anda!",
  },
  sorting: {
    label: "Urutkan",
    newest: "Terbaru",
    trending: "Paling Trending",
  },
  create: {
    title: "Buat Postingan Baru",
    editTitle: "Edit Postingan Anda",
    backButton: "Kembali ke Pusat",
    submitButton: "Terbitkan Post",
    submitting: "Menerbitkan...",
    cancelButton: "Batal",
  },
  form: {
    labels: {
      title: "Judul Postingan",
      type: "Tipe Postingan",
      baseBuilding: "Tipe Base",
      strategyType: "Tipe Strategi",
      townHall: "Level Town Hall",
      tags: "Tag",
      description: "Deskripsi",
      youtubeUrl: "URL Video YouTube",
      image: "Unggah Gambar",
    },
    placeholders: {
      title: "contoh: Base Perang TH15 Tak Terkalahkan",
      description: "Jelaskan strategi atau desain base Anda secara rinci...",
      youtubeUrl: "https://youtube.com/watch?v=...",
      tags: "Ketik tag dan tekan Enter",
    },
    helpText: {
      tags: "Tekan Enter untuk menambahkan tag (maksimal 5)",
      image: "Format yang didukung: JPG, PNG, WEBP (Maks 5MB)",
    },
    options: {
      types: {
        baseBuilding: "Desain Base",
        attackStrategy: "Strategi Serangan",
      },
      baseBuilding: {
        warBase: "Base Perang",
        farmingBase: "Base Farming",
        trophyBase: "Base Trofi",
        hybridBase: "Base Hibrida",
        progressBase: "Base Progres",
      },
      strategy: {
        ground: "Serangan Darat",
        air: "Serangan Udara",
        hybrid: "Serangan Hibrida",
        spam: "Serangan Spam",
        precision: "Serangan Presisi",
      },
    },
    validation: {
      titleRequired: "Judul wajib diisi",
      titleMinLength: "Judul minimal 5 karakter",
      typeRequired: "Tipe postingan wajib diisi",
      descriptionRequired: "Deskripsi wajib diisi",
      descriptionMinLength: "Deskripsi minimal 20 karakter",
      youtubeInvalid: "Mohon masukkan URL YouTube yang valid",
      imageRequired: "Gambar wajib diunggah untuk desain base",
      baseBuildingRequired: "Tipe base wajib diisi",
      strategyTypeRequired: "Tipe strategi wajib diisi",
      townHallRequired: "Level Town Hall wajib diisi",
    },
    messages: {
      createSuccess: "Postingan berhasil dibuat!",
      createError: "Gagal membuat postingan. Silakan coba lagi.",
      uploadError: "Gagal mengunggah gambar.",
      imageSizeError: "Ukuran gambar harus kurang dari 5MB",
    },
  },
  detail: {
    meta: {
      author: "Oleh",
      published: "Diterbitkan",
      views: "Dilihat",
      likes: "Suka",
      comments: "Komentar",
      categoryLabel: "Kategori:", // <-- BARU
      anonymous: "Kontributor Anonim", // <-- BARU
      invalidDate: "Tanggal Tidak Valid", // <-- BARU
      noTags: "#TAG_TIDAK_TERSEDIA", // <-- BARU
    },
    sections: {
      about: "Tentang Strategi Ini",
      strategy: "Rincian Strategi",
      comments: "Diskusi",
    },
    actions: {
      like: "Suka",
      share: "Bagikan",
      reply: "Balas",
      delete: "Hapus",
      edit: "Edit",
      report: "Lapor",
      // --- TOMBOL KHUSUS BARU ---
      copyBaseLink: "Salin Link Base",
      copyArmyLink: "Salin Komposisi Pasukan",
      watchYoutube: "Tonton di YouTube",
      baseLinkHeader: "BASE LINK:",
      troopLinkHeader: "TROOP LINK:",
    },
    comments: {
      title: "Komentar",
      placeholder: "Tulis komentar...",
      submit: "Kirim Komentar",
      submitting: "Mengirim...",
      replyPlaceholder: "Tulis balasan...",
      noComments: "Belum ada komentar. Mulailah percakapan!",
      loginToComment: "Silakan login untuk berkomentar",
      deleteConfirmation: "Apakah Anda yakin ingin menghapus komentar ini?",
    },
    share: {
      title: "Bagikan Postingan",
      copyLink: "Salin Tautan",
      copied: "Tautan disalin!",
    },
  },
};