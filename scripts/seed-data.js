// File: scripts/seed-data.js
// Deskripsi: Berisi data contoh (mock data) untuk mengisi database Firestore.

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

// --- DATA BARU: Join Requests (Tugas 2.3) ---
// Kita harus memastikan UID War Legends (uid_lordz) cocok dengan captainId di atas.
// Kita akan menggunakan ID tim yang sudah kita buat (War Legends: "War Legends")
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
    dummyJoinRequests
};
