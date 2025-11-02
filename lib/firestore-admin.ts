// File: lib/firestore-admin.ts
// Deskripsi: File index utama untuk utilitas Admin SDK.
// File ini meng-ekspor ulang semua fungsi dari folder /lib/firestore-admin

import { adminFirestore } from './firebase-admin';

// Ekspor Ulang Tipe Util
// --- DIHAPUS ---
// Tipe FirestoreDocument sekarang global via @/lib/types
// export type { FirestoreDocument } from './firestore-admin/utils';

// Ekspor Ulang Fungsi Util (utils.ts tidak mengekspor apa-apa untuk global)
// export * from './firestore-admin/utils';

// Ekspor Ulang Fungsi Users
export * from './firestore-admin/users';

// Ekspor Ulang Fungsi Clans
export * from './firestore-admin/clans';

// Ekspor Ulang Fungsi Archives
export * from './firestore-admin/archives';

// Ekspor Ulang Fungsi Management (termasuk fungsi keamanan baru)
export * from './firestore-admin/management';

// Ekspor Ulang Fungsi Posts
export * from './firestore-admin/posts';

// Ekspor Tipe Data Spesifik Admin SDK (jika diperlukan di tempat lain)
// --- BARIS DI BAWAH INI DIHAPUS KARENA RoleChangeLog SUDAH GLOBAL ---
// export type { RoleChangeLog } from './firestore-admin/management';

// Ekspor instance adminFirestore untuk penggunaan khusus (jika ada)
export { adminFirestore };

