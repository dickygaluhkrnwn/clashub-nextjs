// File: scripts/seed-data.js
// Deskripsi: Berisi data contoh (mock data) untuk mengisi database Firestore.

// Menggunakan tanggal saat ini untuk simulasi
const now = new Date();
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// Data contoh untuk koleksi 'teams'
const dummyTeams = [
    // Kapten: uid_lordz (Anggota tetap di bawah) | Status: Open
    { name: "War Legends", tag: "#WARLGND", rating: 4.8, vision: "Kompetitif", avgTh: 16.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "uid_lordz", recruitingStatus: "Open" },
    // Kapten: uid_wizard | Status: Invite Only
    { name: "Clash Elites Pro", tag: "#ELITEPRO", rating: 4.9, vision: "Kompetitif", avgTh: 15.2, logoUrl: "/images/clan-badge-placeholder.png", captainId: "uid_wizard", recruitingStatus: "Invite Only" },
    // Kapten: uid_xena | Status: Closed
    { name: "Phoenix Reborn", tag: "#PHOENIX", rating: 4.7, vision: "Kompetitif", avgTh: 14.8, logoUrl: "/images/clan-badge-placeholder.png", captainId: "uid_xena", recruitingStatus: "Closed" },
    { name: "Elite Destroyers", tag: "#DESTROY", rating: 4.9, vision: "Kompetitif", avgTh: 15.8, logoUrl: "/images/clan-badge-placeholder.png", captainId: "uid_ghost", recruitingStatus: "Open" },
    { name: "TH15 Experts", tag: "#TH15PRO", rating: 4.7, vision: "Kompetitif", avgTh: 15.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "uid_rookie", recruitingStatus: "Open" },
    { name: "Dragon Slayers", tag: "#DRGN-SLY", rating: 4.6, vision: "Kompetitif", avgTh: 14.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_1", recruitingStatus: "Open" },
    { name: "No Drama Casuals", tag: "#NODRAMA", rating: 4.5, vision: "Kasual", avgTh: 12.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_2", recruitingStatus: "Open" },
    { name: "Chill Clashers", tag: "#CHILL", rating: 4.3, vision: "Kasual", avgTh: 11.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_3", recruitingStatus: "Open" },
    { name: "Weekend Warriors", tag: "#WKNDWAR", rating: 4.2, vision: "Kasual", avgTh: 13.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_4", recruitingStatus: "Open" },
    { name: "Farming Kings", tag: "#FARM-KNG", rating: 4.4, vision: "Kasual", avgTh: 12.8, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_5", recruitingStatus: "Open" },
    { name: "Newbie Helpers", tag: "#NB-HELP", rating: 4.1, vision: "Kasual", avgTh: 10.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_6", recruitingStatus: "Open" },
    { name: "Indo Eternity", tag: "#INDO-ET", rating: 4.8, vision: "Kompetitif", avgTh: 15.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_7", recruitingStatus: "Open" },
];

// Data contoh untuk koleksi 'users' (pemain)
const dummyPlayers = [
    // UID: uid_lordz. Diatur sebagai Leader tim War Legends
    { name: "Lord Z", tag: "#P20C8Y9L", thLevel: 16, reputation: 4.7, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "lordz@example.com", uid: "uid_lordz", teamId: "War Legends", teamName: "War Legends" },
    
    // UID: uid_xena. Diatur sebagai Co-Leader tim War Legends
    { name: "Xena", tag: "#XENA-TAG", thLevel: 16, reputation: 4.9, role: 'Co-Leader', avatarUrl: "/images/placeholder-avatar.png", email: "xena@example.com", uid: "uid_xena", teamId: "War Legends", teamName: "War Legends" },
    
    // UID: uid_ghost. Diatur sebagai Member tim Elite Destroyers (juga Kapten tim lain di dummyTeams!)
    { name: "Ghost", tag: "#GHOST-TAG", thLevel: 15, reputation: 4.2, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "ghost@example.com", uid: "uid_ghost", teamId: "Elite Destroyers", teamName: "Elite Destroyers" },
    
    // UID: uid_wizard. Diatur sebagai Leader tim Clash Elites Pro
    { name: "Wizard", tag: "#WIZ-PRO", thLevel: 16, reputation: 4.9, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "wizard@example.com", uid: "uid_wizard", teamId: "Clash Elites Pro", teamName: "Clash Elites Pro" },
    
    // UID: uid_blaze. Diatur sebagai Free Agent (memiliki field tim null)
    { name: "Blaze", tag: "#BLAZE-TAG", thLevel: 15, reputation: 4.6, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "blaze@example.com", uid: "uid_blaze", teamId: null, teamName: null },
    
    // Pemain yang akan menjadi permintaan bergabung (agar data permintaannya konsisten)
    { name: "Helix", tag: "#A1B2C3D4", thLevel: 15, reputation: 4.5, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "helix@example.com", uid: "uid_helix", teamId: null, teamName: null },

    { name: "Rookie", tag: "#ROOKIE-TAG", thLevel: 14, reputation: 4.1, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "rookie@example.com", uid: "uid_rookie", teamId: null, teamName: null },
    { name: "Shadow", tag: "#SHADOW-T", thLevel: 16, reputation: 4.8, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "shadow@example.com", uid: "uid_shadow", teamId: null, teamName: null },
    { name: "IceMan", tag: "#ICE-MAN", thLevel: 14, reputation: 4.3, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "iceman@example.com", uid: "uid_iceman", teamId: "War Legends", teamName: "War Legends" },
    { name: "Valk", tag: "#VALKYRIE", thLevel: 15, reputation: 4.4, role: 'Elder', avatarUrl: "/images/placeholder-avatar.png", email: "valk@example.com", uid: "uid_valk", teamId: "War Legends", teamName: "War Legends" },
    { name: "GoblinKing", tag: "#GOB-KING", thLevel: 13, reputation: 4.0, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "goblinking@example.com", uid: "uid_goblinking", teamId: null, teamName: null },
    { name: "Pekka", tag: "#PEKKA-123", thLevel: 14, reputation: 4.2, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "pekka@example.com", uid: "uid_pekka", teamId: "Clash Elites Pro", teamName: "Clash Elites Pro" },
];

// Data contoh untuk koleksi 'tournaments'
const dummyTournaments = [
    { title: "ClashHub Liga Musim 3", status: 'Akan Datang', thRequirement: "TH 15 - 16", prizePool: "Rp 15.000.000" },
    { title: "Open TH 14 Cup - Minggu 4", status: 'Live', thRequirement: "TH 13 - 14", prizePool: "Rp 5.000.000" },
    { title: "War Master Challenge", status: 'Akan Datang', thRequirement: "TH 16 Only", prizePool: "Item In-Game Eksklusif" },
    { title: "Liga Komunitas Musim 2", status: 'Selesai', thRequirement: "Semua Level", prizePool: "Rp 2.500.000" },
];

// --- DATA BARU: Postingan Knowledge Hub (Tugas 3.2) ---
const dummyPosts = [
    {
        title: "Perubahan Meta: Strategi Hydrid Apa yang Cocok Setelah Update?",
        content: "Setelah update minor kemarin, Giant Arrow dan Dragon Rider mendapatkan buff yang signifikan, mengubah META serangan di TH 16.\n\nSaya menemukan bahwa Hybrid dengan 4 Naga dan 8 Hog Rider memberikan hasil yang sangat konsisten jika dijalankan dengan timing yang tepat.\n\nBerikut rincian komposisi pasukan yang saya gunakan:\n- 4 Dragon Rider\n- 8 Hog Rider & 15 Bowler\n- Spell: 4 Freeze, 3 Rage, 1 Clone\n\nVideo demonstrasi di sini: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "Strategi Serangan",
        tags: ["TH16", "Hybrid", "CWL"],
        authorId: "uid_lordz",
        authorName: "Lord Z",
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
        likes: 120,
        replies: 45,
    },
    {
        title: "Panduan Base Anti 3 Bintang di CWL Champion League",
        content: "Base ini dirancang khusus untuk melawan meta serangan 'Root Rider' dan 'Super Archer Blimp'. Fokus utamanya adalah memisahkan kompartemen Town Hall dan menempatkan jebakan tornado di jalur yang tidak terduga.\n\nLink Base: https://link.clashofclans.com/en?action=OpenLayout&id=TH15-66778899",
        category: "Base Building",
        tags: ["BaseBuilding", "Tutorial", "TH15"],
        authorId: "uid_xena",
        authorName: "Xena",
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
        likes: 250,
        replies: 72,
    },
    {
        title: "Alat Apa yang Kalian Gunakan Untuk Tracking Kehadiran War?",
        content: "Tim kami sering kesulitan melacak siapa saja yang absen saat war. Menggunakan spreadsheet manual terasa merepotkan. Apakah ada bot Discord atau aplikasi pihak ketiga yang direkomendasikan untuk otomatisasi tracking kehadiran dan performa war?\n\nKami mencari solusi yang bisa:\n- Mengirim pengingat otomatis sebelum war.\n- Mencatat siapa yang melakukan serangan dan siapa yang tidak.\n- Memberikan rekap performa setelah war selesai.",
        category: "Manajemen Tim",
        tags: ["ManajemenTim", "Komitmen", "Tools"],
        authorId: "uid_ghost",
        authorName: "Ghost",
        createdAt: oneWeekAgo,
        updatedAt: oneWeekAgo,
        likes: 30,
        replies: 15,
    },
    {
        title: "Diskusi Umum: Kapan TH 17 Rilis?",
        content: "Menurut rumor, TH 17 akan dirilis pada Q1 2026. Apakah ada yang punya bocoran atau informasi lebih lanjut tentang hero equipment baru?",
        category: "Diskusi Umum",
        tags: ["Rumor", "TH17", "Update"],
        authorId: "uid_lordz",
        authorName: "Lord Z",
        createdAt: now,
        updatedAt: now,
        likes: 50,
        replies: 10,
    }
];

// --- DATA JOIN REQUESTS ---
const dummyJoinRequests = [
    { 
        teamId: "War Legends", 
        teamName: "War Legends",
        requesterId: "uid_blaze", // UID pemain Blaze
        requesterName: "Blaze",
        requesterThLevel: 15,
        message: "Saya siap berkomitmen 5x war seminggu!",
        status: "pending",
        timestamp: new Date()
    },
    { 
        teamId: "War Legends", 
        teamName: "War Legends",
        requesterId: "uid_shadow", // UID pemain Shadow
        requesterName: "Shadow",
        requesterThLevel: 16,
        message: "TH 16 Max, mencari tim Master League.",
        status: "pending",
        timestamp: new Date()
    },
    { 
        teamId: "Clash Elites Pro", 
        teamName: "Clash Elites Pro",
        requesterId: "uid_goblinking", // UID pemain GoblinKing
        requesterName: "GoblinKing",
        requesterThLevel: 13,
        message: "Role Base Builder tersedia.",
        status: "pending",
        timestamp: new Date()
    },
];

// Ekspor semua data agar bisa digunakan oleh script lain
module.exports = {
    dummyTeams,
    dummyPlayers,
    dummyTournaments,
    dummyJoinRequests,
    dummyPosts, // BARU: Ekspor Postingan
};
