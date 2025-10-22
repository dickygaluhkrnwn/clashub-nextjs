// File: scripts/seed-data.js
// Deskripsi: Berisi data contoh (mock data) untuk mengisi database Firestore.

// Menggunakan tanggal saat ini untuk simulasi
const now = new Date();
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// --- 1. DEFINISI UID KUNCI ---
const UID_LORDZ = "uid_lordz"; // Captain War Legends
const UID_XENA = "uid_xena";   // Member War Legends
const UID_WIZARD = "uid_wizard"; // Captain Clash Elites Pro
const UID_BLAZE = "uid_blaze";   // Free Agent (Requesting WL)
const UID_SHADOW = "uid_shadow"; // Free Agent (Requesting WL)
const UID_ICEMAN = "uid_iceman"; // Member War Legends
const UID_VALK = "uid_valk";     // Elder War Legends
const UID_ROOKIE = "uid_rookie"; // Captain TH15 Experts
const UID_GOBLINKING = "uid_goblinking"; // Free Agent (Requesting CEP)
const UID_PEKKA = "uid_pekka"; // Member Clash Elites Pro
const UID_CRUSH = "uid_crush"; // Captain Elite Destroyers

// --- 2. DATA CONTOH UNTUK KOLEKSI 'teams' ---
const dummyTeams = [
    // Tim 1: War Legends (Kompetitif, Captain: Lord Z)
    { id: "War Legends", name: "War Legends", tag: "#WARLGND", rating: 4.8, vision: "Kompetitif", avgTh: 16.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: UID_LORDZ, recruitingStatus: "Open" },
    // Tim 2: Clash Elites Pro (Kompetitif, Captain: Wizard)
    { id: "Clash Elites Pro", name: "Clash Elites Pro", tag: "#ELITEPRO", rating: 4.9, vision: "Kompetitif", avgTh: 15.2, logoUrl: "/images/clan-badge-placeholder.png", captainId: UID_WIZARD, recruitingStatus: "Invite Only" },
    // Tim 3: TH15 Experts (Kompetitif, Captain: Rookie)
    { id: "TH15 Experts", name: "TH15 Experts", tag: "#TH15PRO", rating: 4.7, vision: "Kompetitif", avgTh: 15.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: UID_ROOKIE, recruitingStatus: "Open" },
    // Tim 4: Elite Destroyers (Kompetitif, Captain: Crush)
    { id: "Elite Destroyers", name: "Elite Destroyers", tag: "#DESTROY", rating: 4.9, vision: "Kompetitif", avgTh: 15.8, logoUrl: "/images/clan-badge-placeholder.png", captainId: UID_CRUSH, recruitingStatus: "Closed" },
    // Tim 5: Chill Clashers (Kasual)
    { id: "Chill Clashers", name: "Chill Clashers", tag: "#CHILL", rating: 4.3, vision: "Kasual", avgTh: 11.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: UID_BLAZE, recruitingStatus: "Open" }, // Blaze (sebagai kapten tim kasual)
    // Tambahkan 5 tim lain yang tidak terkait dengan UID utama untuk pengujian rekomendasi
    { id: "Dragon Slayers", tag: "#DRGN-SLY", rating: 4.6, vision: "Kompetitif", avgTh: 14.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_1", recruitingStatus: "Open" },
    { id: "No Drama Casuals", tag: "#NODRAMA", rating: 4.5, vision: "Kasual", avgTh: 12.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_2", recruitingStatus: "Open" },
    { id: "Weekend Warriors", tag: "#WKNDWAR", rating: 4.2, vision: "Kasual", avgTh: 13.0, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_3", recruitingStatus: "Open" },
    { id: "Farming Kings", tag: "#FARM-KNG", rating: 4.4, vision: "Kasual", avgTh: 12.8, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_4", recruitingStatus: "Open" },
    { id: "Indo Eternity", tag: "#INDO-ET", rating: 4.8, vision: "Kompetitif", avgTh: 15.5, logoUrl: "/images/clan-badge-placeholder.png", captainId: "dummy_id_5", recruitingStatus: "Open" },
];

// --- 3. DATA CONTOH UNTUK KOLEKSI 'users' (pemain) ---
const dummyPlayers = [
    // PEMAIN UTAMA UNTUK PENGUJIAN PROFILE / LEADER
    { name: "Lord Z", displayName: "Lord Z", playerTag: "#P20C8Y9L", thLevel: 16, reputation: 4.7, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "lordz@example.com", uid: UID_LORDZ, teamId: "War Legends", teamName: "War Legends", playStyle: "Attacker Utama", activeHours: "20:00 - 23:00 WIB", bio: "Kapten tim War Legends. Berfokus pada strategi serangan 3-bintang di TH 16." },
    
    // ANGGOTA TIM WAR LEGENDS (WL)
    { name: "Xena", displayName: "Xena", playerTag: "#XENA-TAG", thLevel: 16, reputation: 4.9, role: 'Co-Leader', avatarUrl: "/images/placeholder-avatar.png", email: "xena@example.com", uid: UID_XENA, teamId: "War Legends", teamName: "War Legends", playStyle: "Strategist", activeHours: "19:00 - 22:00 WIB", bio: "Co-Leader dan spesialis base building untuk War Legends." },
    { name: "IceMan", displayName: "IceMan", playerTag: "#ICE-MAN", thLevel: 14, reputation: 4.3, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "iceman@example.com", uid: UID_ICEMAN, teamId: "War Legends", teamName: "War Legends", playStyle: "Donatur", activeHours: "12:00 - 15:00 WIB", bio: "Pemain solid, rajin donasi dan tidak pernah absen war." },
    { name: "Valk", displayName: "Valk", playerTag: "#VALKYRIE", thLevel: 15, reputation: 4.4, role: 'Elder', avatarUrl: "/images/placeholder-avatar.png", email: "valk@example.com", uid: UID_VALK, teamId: "War Legends", teamName: "War Legends", playStyle: "Base Builder", activeHours: "Malam Hari", bio: "Elder yang fokus pada TH15 Meta dan selalu mencari base baru." },
    
    // ANGGOTA TIM CLASH ELITES PRO (CEP)
    { name: "Wizard", displayName: "Wizard", playerTag: "#WIZ-PRO", thLevel: 16, reputation: 4.9, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "wizard@example.com", uid: UID_WIZARD, teamId: "Clash Elites Pro", teamName: "Clash Elites Pro", playStyle: "Attacker Utama", activeHours: "Sepanjang Hari", bio: "Kapten CEP. Master Hybrid Attacker TH 16." },
    { name: "Pekka", displayName: "Pekka", playerTag: "#PEKKA-123", thLevel: 14, reputation: 4.2, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "pekka@example.com", uid: UID_PEKKA, teamId: "Clash Elites Pro", teamName: "Clash Elites Pro", playStyle: "Donatur", activeHours: "Sore Hari", bio: "Anggota tim yang berfokus donasi troops level max." },

    // ANGGOTA TIM TH15 EXPERTS (TH15)
    { name: "Rookie", displayName: "Rookie", playerTag: "#ROOKIE-TAG", thLevel: 14, reputation: 4.1, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "rookie@example.com", uid: UID_ROOKIE, teamId: "TH15 Experts", teamName: "TH15 Experts", playStyle: "Base Builder", activeHours: "Siang Hari", bio: "Kapten TH15 Experts. Membangun dan menguji base TH 15." },
    { name: "Shadow", displayName: "Shadow", playerTag: "#SHADOW-T", thLevel: 16, reputation: 4.8, role: 'Co-Leader', avatarUrl: "/images/placeholder-avatar.png", email: "shadow@example.com", uid: UID_SHADOW, teamId: "TH15 Experts", teamName: "TH15 Experts", playStyle: "Strategist", activeHours: "21:00 - 01:00 WIB", bio: "Co-Leader di TH15 Experts. Master strategi War Clan." },
    
    // ANGGOTA TIM ELITE DESTROYERS (CRUSH)
    { name: "Crush", displayName: "Crush", playerTag: "#CRUSH-ID", thLevel: 16, reputation: 4.5, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "crush@example.com", uid: UID_CRUSH, teamId: "Elite Destroyers", teamName: "Elite Destroyers", playStyle: "Attacker Utama", activeHours: "Sepanjang Hari", bio: "Kapten Elite Destroyers. Mencari pemain berkomitmen tinggi." },

    // FREE AGENT (Yang akan mengajukan join request)
    { name: "Blaze", displayName: "Blaze", playerTag: "#BLAZE-TAG", thLevel: 15, reputation: 4.6, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "blaze@example.com", uid: UID_BLAZE, teamId: null, teamName: null, playStyle: "Attacker Utama", activeHours: "Malam Hari", bio: "Free Agent TH15, mencari tim Kompetitif di Master League." },
    { name: "Helix", displayName: "Helix", playerTag: "#A1B2C3D4", thLevel: 15, reputation: 4.5, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "helix@example.com", uid: "uid_helix", teamId: null, teamName: null, playStyle: "Strategist", activeHours: "Sore Hari", bio: "Pemain handal TH15, fokus pada War Clan." },
    { name: "Ghost", displayName: "Ghost", playerTag: "#GHOST-TAG", thLevel: 15, reputation: 4.2, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "ghost@example.com", uid: "uid_ghost", teamId: null, teamName: null, playStyle: "Base Builder", activeHours: "Siang Hari", bio: "Pencari tim kasual dengan War santai." },
    
    // DUMMY AGENT (Untuk populasi Team Hub)
    { name: "Thunder", displayName: "Thunder", playerTag: "#THUNDER", thLevel: 16, reputation: 4.9, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "thunder@example.com", uid: "uid_thunder", teamId: null, teamName: null, playStyle: "Attacker Utama", activeHours: "Sepanjang Hari", bio: "TH16 Max, mencari tantangan." },
    { name: "Archer", displayName: "Archer", playerTag: "#ARCHER", thLevel: 10, reputation: 3.5, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "archer@example.com", uid: "uid_archer", teamId: null, teamName: null, playStyle: "Donatur", activeHours: "Sore Hari", bio: "Pemain TH10 yang rajin berdonasi." },
];

// Data contoh untuk koleksi 'tournaments' (Tidak berubah)
const dummyTournaments = [
    { title: "ClashHub Liga Musim 3", status: 'Akan Datang', thRequirement: "TH 15 - 16", prizePool: "Rp 15.000.000" },
    { title: "Open TH 14 Cup - Minggu 4", status: 'Live', thRequirement: "TH 13 - 14", prizePool: "Rp 5.000.000" },
    { title: "War Master Challenge", status: 'Akan Datang', thRequirement: "TH 16 Only", prizePool: "Item In-Game Eksklusif" },
    { title: "Liga Komunitas Musim 2", status: 'Selesai', thRequirement: "Semua Level", prizePool: "Rp 2.500.000" },
];

// --- 4. DATA JOIN REQUESTS ---
const dummyJoinRequests = [
    // Permintaan 1: Dari Helix ke War Legends (Captain: Lord Z / UID_LORDZ)
    { 
        teamId: "War Legends", 
        teamName: "War Legends",
        requesterId: "uid_helix", 
        requesterName: "Helix",
        requesterThLevel: 15,
        message: "Saya siap berkomitmen 5x war seminggu!",
        status: "pending",
        timestamp: new Date()
    },
    // Permintaan 2: Dari GoblinKing ke War Legends
    { 
        teamId: "War Legends", 
        teamName: "War Legends",
        requesterId: "uid_goblinking", 
        requesterName: "GoblinKing",
        requesterThLevel: 13,
        message: "TH 13 Max, mencari tim kompetitif, bisa Co-Leader.",
        status: "pending",
        timestamp: new Date(now.getTime() - 3600000) // 1 jam lalu
    },
    // Permintaan 3: Dari Blaze ke Elite Destroyers (Captain: Crush / UID_CRUSH)
    { 
        teamId: "Elite Destroyers", 
        teamName: "Elite Destroyers",
        requesterId: UID_BLAZE, 
        requesterName: "Blaze",
        requesterThLevel: 15,
        message: "Mencari tim Elite Destroyers. Role Attacker.",
        status: "pending",
        timestamp: new Date(now.getTime() - 7200000) // 2 jam lalu
    },
];

// --- 5. DATA POSTINGAN KNOWLEDGE HUB (Tidak berubah) ---
const dummyPosts = [
    {
        title: "Perubahan Meta: Strategi Hydrid Apa yang Cocok Setelah Update?",
        content: "Setelah update minor kemarin, Giant Arrow dan Dragon Rider mendapatkan buff yang signifikan, mengubah META serangan di TH 16.\n\nSaya menemukan bahwa Hybrid dengan 4 Naga dan 8 Hog Rider memberikan hasil yang sangat konsisten jika dijalankan dengan timing yang tepat.\n\nBerikut rincian komposisi pasukan yang saya gunakan:\n- 4 Dragon Rider\n- 8 Hog Rider & 15 Bowler\n- Spell: 4 Freeze, 3 Rage, 1 Clone\n\nVideo demonstrasi di sini: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "Strategi Serangan",
        tags: ["TH16", "Hybrid", "CWL"],
        authorId: UID_LORDZ,
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
        authorId: UID_XENA,
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
        authorId: UID_CRUSH,
        authorName: "Crush",
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
        authorId: UID_LORDZ,
        authorName: "Lord Z",
        createdAt: now,
        updatedAt: now,
        likes: 50,
        replies: 10,
    }
];

// Ekspor semua data agar bisa digunakan oleh script lain
module.exports = {
    dummyTeams,
    dummyPlayers,
    dummyTournaments,
    dummyJoinRequests,
    dummyPosts,
};
