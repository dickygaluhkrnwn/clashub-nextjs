// File: scripts/seed-data.js
// Deskripsi: Berisi data contoh (mock data) untuk mengisi database Firestore.

// Data contoh untuk koleksi 'teams'
const dummyTeams = [
    { name: "War Legends", tag: "#WARLGND", rating: 4.8, vision: "Kompetitif", avgTh: 16.0, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Clash Elites Pro", tag: "#ELITEPRO", rating: 4.9, vision: "Kompetitif", avgTh: 15.2, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Phoenix Reborn", tag: "#PHOENIX", rating: 4.7, vision: "Kompetitif", avgTh: 14.8, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Elite Destroyers", tag: "#DESTROY", rating: 4.9, vision: "Kompetitif", avgTh: 15.8, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "TH15 Experts", tag: "#TH15PRO", rating: 4.7, vision: "Kompetitif", avgTh: 15.0, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Dragon Slayers", tag: "#DRGN-SLY", rating: 4.6, vision: "Kompetitif", avgTh: 14.5, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "No Drama Casuals", tag: "#NODRAMA", rating: 4.5, vision: "Kasual", avgTh: 12.0, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Chill Clashers", tag: "#CHILL", rating: 4.3, vision: "Kasual", avgTh: 11.5, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Weekend Warriors", tag: "#WKNDWAR", rating: 4.2, vision: "Kasual", avgTh: 13.0, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Farming Kings", tag: "#FARM-KNG", rating: 4.4, vision: "Kasual", avgTh: 12.8, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Newbie Helpers", tag: "#NB-HELP", rating: 4.1, vision: "Kasual", avgTh: 10.5, logoUrl: "/images/clan-badge-placeholder.png" },
    { name: "Indo Eternity", tag: "#INDO-ET", rating: 4.8, vision: "Kompetitif", avgTh: 15.5, logoUrl: "/images/clan-badge-placeholder.png" },
];

// Data contoh untuk koleksi 'users' (pemain)
const dummyPlayers = [
    { name: "Lord Z", tag: "#P20C8Y9L", thLevel: 16, reputation: 4.7, role: 'Leader', avatarUrl: "/images/placeholder-avatar.png", email: "lordz@example.com", uid: "uid_lordz" },
    { name: "Helix", tag: "#A1B2C3D4", thLevel: 15, reputation: 4.5, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "helix@example.com", uid: "uid_helix" },
    { name: "Xena", tag: "#XENA-TAG", thLevel: 16, reputation: 4.9, role: 'Co-Leader', avatarUrl: "/images/placeholder-avatar.png", email: "xena@example.com", uid: "uid_xena" },
    { name: "Ghost", tag: "#GHOST-TAG", thLevel: 15, reputation: 4.2, role: 'Elder', avatarUrl: "/images/placeholder-avatar.png", email: "ghost@example.com", uid: "uid_ghost" },
    { name: "Blaze", tag: "#BLAZE-TAG", thLevel: 15, reputation: 4.6, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "blaze@example.com", uid: "uid_blaze" },
    { name: "Rookie", tag: "#ROOKIE-TAG", thLevel: 14, reputation: 4.1, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "rookie@example.com", uid: "uid_rookie" },
    { name: "Shadow", tag: "#SHADOW-T", thLevel: 16, reputation: 4.8, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "shadow@example.com", uid: "uid_shadow" },
    { name: "IceMan", tag: "#ICE-MAN", thLevel: 14, reputation: 4.3, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "iceman@example.com", uid: "uid_iceman" },
    { name: "Valk", tag: "#VALKYRIE", thLevel: 15, reputation: 4.4, role: 'Elder', avatarUrl: "/images/placeholder-avatar.png", email: "valk@example.com", uid: "uid_valk" },
    { name: "GoblinKing", tag: "#GOB-KING", thLevel: 13, reputation: 4.0, role: 'Free Agent', avatarUrl: "/images/placeholder-avatar.png", email: "goblinking@example.com", uid: "uid_goblinking" },
    { name: "Wizard", tag: "#WIZ-PRO", thLevel: 16, reputation: 4.9, role: 'Co-Leader', avatarUrl: "/images/placeholder-avatar.png", email: "wizard@example.com", uid: "uid_wizard" },
    { name: "Pekka", tag: "#PEKKA-123", thLevel: 14, reputation: 4.2, role: 'Member', avatarUrl: "/images/placeholder-avatar.png", email: "pekka@example.com", uid: "uid_pekka" },
];

// Data contoh untuk koleksi 'tournaments'
const dummyTournaments = [
    { title: "ClashHub Liga Musim 3", status: 'Akan Datang', thRequirement: "TH 15 - 16", prizePool: "Rp 15.000.000" },
    { title: "Open TH 14 Cup - Minggu 4", status: 'Live', thRequirement: "TH 13 - 14", prizePool: "Rp 5.000.000" },
    { title: "War Master Challenge", status: 'Akan Datang', thRequirement: "TH 16 Only", prizePool: "Item In-Game Eksklusif" },
    { title: "Liga Komunitas Musim 2", status: 'Selesai', thRequirement: "Semua Level", prizePool: "Rp 2.500.000" },
];


// Ekspor semua data agar bisa digunakan oleh script lain
module.exports = {
    dummyTeams,
    dummyPlayers,
    dummyTournaments
};
