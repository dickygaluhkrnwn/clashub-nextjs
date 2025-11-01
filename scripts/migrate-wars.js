/*
 * SKRIP MIGRASI DATA PERANG (ONE-TIME USE) - V5 (Sesuai Roadmap)
 *
 * TUJUAN:
 * 1. Membaca 'Pengaturan.csv' untuk mendapatkan daftar klan yang akan dimigrasi.
 * 2. Membaca 'Log Perang.csv' (untuk data ringkasan).
 * 3. Membaca 'Arsip Perang.csv' (untuk data detail serangan/anggota).
 * 4. Untuk SETIAP klan di 'Pengaturan.csv':
 * a. Menemukan ID Firestore-nya.
 * b. Menggabungkan data ringkasan dan detail (TERMASUK OPONENT TAG DARI DETAIL).
 * c. [PERBAIKAN] Membuat mock 'attacks' dan 'bestOpponentAttack' dari data CSV.
 * d. [PERBAIKAN ROADMAP]: Menyimpan (Menimpa) data ke sub-koleksi 'clanWarHistory' (BUKAN 'warArchives').
 * e. [PERBAIKAN ROADMAP]: Menggunakan ID Dokumen standar: '[clanTag]-[warEndTimeISO]'.
 *
 * CARA MENGGUNAKAN:
 * 1. Pastikan Anda sudah menjalankan: npm install csv-parser
 * 2. Pastikan file .env.local Anda berisi FIREBASE_SERVICE_ACCOUNT_KEY.
 * 3. Pastikan 3 file CSV ada di 'scripts/data/'.
 * 4. HAPUS subkoleksi 'warArchives' LAMA (jika ada) DAN 'clanWarHistory' (jika ada) di Firestore.
 * 5. Jalankan dari terminal: node scripts/migrate-wars.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const admin = require('firebase-admin');

// --- PERBAIKAN: Muat .env.local dari root project ---
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// --- Inisialisasi Firebase Admin ---
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY tidak ditemukan di file .env.local. Skrip tidak bisa dijalankan. Pastikan Anda sudah mengaturnya.");
    }
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    });
    console.log('Firebase Admin SDK berhasil diinisialisasi oleh skrip migrasi.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    process.exit(1); // Keluar jika gagal inisialisasi
  }
}
const adminFirestore = admin.firestore();
// --- AKHIR PERBAIKAN FIREBASE ADMIN ---


// --- Salin Objek COLLECTIONS ---
const COLLECTIONS = {
    USERS: 'users',
    MANAGED_CLANS: 'managedClans', // Klan Internal yang Dikelola
    PUBLIC_CLAN_INDEX: 'publicClanIndex', // Cache Klan Publik
    JOIN_REQUESTS: 'joinRequests',
    POSTS: 'posts',
    TOURNAMENTS: 'tournaments',
    VIDEOS: 'videos',
};
// --- AKHIR COLLECTIONS ---


// --- PENGATURAN PATH CSV ---
const DATA_DIR = path.resolve(__dirname, 'data');
const PENGATURAN_CSV_PATH = path.resolve(DATA_DIR, 'Dasboard Clan CoC - Main (2).xlsx - Pengaturan.csv');
const SUMMARY_LOG_PATH = path.resolve(DATA_DIR, 'Dasboard Clan CoC - Main (2).xlsx - Log Perang.csv');
const DETAIL_ARCHIVE_PATH = path.resolve(DATA_DIR, 'Dasboard Clan CoC - Main (2).xlsx - Arsip Perang.csv');
// ----------------------------------------

// Helper untuk konversi Tipe data (mirip di route.ts)
function cleanDataForAdminSDK(data) {
// ... (Fungsi cleanDataForAdminSDK tetap sama) ...
// ... existing code ...
    const cleaned = {};
    for (const key in data) {
        const value = data[key];
        // PERBAIKAN: Izinkan null secara eksplisit
        if (value === null) {
            cleaned[key] = null;
        } 
        // Hanya proses jika tidak undefined
        else if (value !== undefined) {
            if (Object.prototype.toString.call(value) === '[object Date]') {
                cleaned[key] = admin.firestore.Timestamp.fromDate(value);
            } else if (Array.isArray(value)) {
                 // PERBAIKAN: Bersihkan array dari undefined secara rekursif (dangkal)
                cleaned[key] = value.map(item => (typeof item === 'object' ? cleanDataForAdminSDK(item) : item));
            } else if (typeof value === 'object' && value !== null) {
                // PERBAIKAN: Bersihkan objek bersarang (dangkal)
                cleaned[key] = cleanDataForAdminSDK(value);
            } else {
                cleaned[key] = value;
            }
        }
        // Jika value === undefined, itu akan dilewati dan tidak ditambahkan ke 'cleaned'
    }
    return cleaned;
}

// Helper untuk menemukan ID Dokumen Firestore dari ManagedClan
async function getFirestoreClanId(clanTag) {
// ... (Fungsi getFirestoreClanId tetap sama) ...
// ... existing code ...
    try {
        const snapshot = await adminFirestore.collection(COLLECTIONS.MANAGED_CLANS)
            .where('tag', '==', clanTag)
            .limit(1)
            .get();
            
        if (snapshot.empty) {
            console.error(`Error: Tidak ditemukan ManagedClan di Firestore dengan tag ${clanTag}.`);
            console.error("Pastikan Anda telah memverifikasi klan (login sebagai Leader) di website terlebih dahulu.");
            return null;
        }
        const clanId = snapshot.docs[0].id;
        console.log(`Berhasil menemukan Firestore Clan ID: ${clanId} untuk Tag: ${clanTag}`);
        return clanId;
    } catch (e) {
        console.error("Error saat mencari Clan ID:", e.message);
        return null;
    }
}

// Fungsi untuk mem-parse tanggal yang mungkin tidak standar
function parseDate(dateString) {
// ... (Fungsi parseDate tetap sama) ...
// ... existing code ...
    // --- PERBAIKAN: Tangani format tanggal 'YYYY-MM-DD' dari CSV ---
    // CSV 'Log Perang' memiliki format '2025-10-30'
    // Kita perlu memastikan ini di-parse sebagai UTC, bukan lokal
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Tambahkan 'T17:00:00.000Z' (Asumsi Waktu Selesai Perang di Sore/Malam hari, zona waktu Z (UTC))
        // Ini adalah asumsi, namun penting agar konsisten dengan data API nanti
        const date = new Date(`${dateString}T17:00:00.000Z`); 
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Fallback untuk format lain (meskipun CSV sepertinya konsisten)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return new Date(0); // Fallback
}

// Fungsi untuk mem-parse status serangan (misal: "✔️ 2/2" atau "❌ 0/2")
function parseAttackStatus(statusString) {
// ... (Fungsi parseAttackStatus tetap sama) ...
// ... existing code ...
    if (!statusString || typeof statusString !== 'string') return 0;
    const match = statusString.match(/(\d+)\/\d+/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * LANGKAH 1: Membaca file Pengaturan.csv untuk mendapatkan daftar klan
 */
async function readSettings() {
// ... (Fungsi readSettings tetap sama) ...
// ... existing code ...
    console.log(`Membaca file pengaturan: ${PENGATURAN_CSV_PATH}`);
    const clansToMigrate = [];
    const stream = fs.createReadStream(PENGATURAN_CSV_PATH).pipe(csv());
    for await (const row of stream) {
        if (row['Tag Klan'] && row['Nama Klan']) {
            clansToMigrate.push({
                tag: row['Tag Klan'].trim(),
                name: row['Nama Klan'].trim()
            });
        }
    }
    console.log(`Ditemukan ${clansToMigrate.length} klan di Pengaturan: ${clansToMigrate.map(c => c.name).join(', ')}`);
    return clansToMigrate;
}

/**
 * LANGKAH 2: Membaca 'Log Perang.csv' (Data Ringkasan) ke Memori
 */
async function readSummaryLog() {
// ... (Fungsi readSummaryLog tetap sama) ...
// ... existing code ...
    console.log(`Membaca file ringkasan: ${SUMMARY_LOG_PATH}`);
    const warsData = new Map();
    const summaryStream = fs.createReadStream(SUMMARY_LOG_PATH).pipe(csv());

    for await (const row of summaryStream) {
        const warId = row['ID War'];
        const clanTag = row['Tag Klan'];
        if (!warId || !clanTag) continue;

        const warEndTime = parseDate(row['Tanggal Selesai']);

        warsData.set(warId, {
            id: warId, // Simpan ID CSV lama untuk referensi
            clanTag: clanTag,
            warEndTime: warEndTime, // Ini sekarang adalah Date Object UTC
            result: row['Hasil'] ? row['Hasil'].toLowerCase() : 'unknown',
            teamSize: parseInt(row['Ukuran Tim'], 10) || 0,
            hasDetails: false, // Default
            clan: {
                tag: clanTag,
                name: row['Nama Klan'],
                stars: parseInt(row['Bintang Kita'], 10) || 0,
                destructionPercentage: parseFloat(row['Persen Kita']) || 0,
                members: []
            },
            opponent: {
                tag: "#UNKNOWN", // Akan ditimpa oleh data detail
                name: row['Nama Lawan'] || 'Klan Lawan',
                stars: parseInt(row['Bintang Lawan'], 10) || 0,
                destructionPercentage: parseFloat(row['Persen Lawan']) || 0,
                members: []
            }
        });
    }
    console.log(`Langkah 2 Selesai: ${warsData.size} total data ringkasan perang dimuat ke memori.`);
    return warsData;
}

/**
 * LANGKAH 3: Membaca 'Arsip Perang.csv' (Data Detail) ke Memori
 */
async function readDetailArchive() {
// ... (Fungsi readDetailArchive tetap sama, mapHeaders sudah benar) ...
// ... existing code ...
    console.log(`Membaca file arsip detail: ${DETAIL_ARCHIVE_PATH}`);
    const detailsByWarId = new Map();
    
    // --- PERBAIKAN LOGIKA mapHeaders (V3) ---
    // Kita gunakan index untuk membedakan dua kolom "Nama Lawan"
    const detailStream = fs.createReadStream(DETAIL_ARCHIVE_PATH).pipe(csv({
        mapHeaders: ({ header, index }) => {
            const normalizedHeader = header.trim();
            // Kolom ke-5 (index 4) adalah Nama Klan Lawan
            if (normalizedHeader === 'Nama Lawan' && index === 4) {
                return 'Nama Klan Lawan';
            }
            // Kolom ke-14 (index 13) adalah Nama Pemain Lawan
            if (normalizedHeader === 'Nama Lawan' && index === 13) {
                return 'Nama Pemain Lawan';
            }
            return normalizedHeader;
          }
    }));
    // --- AKHIR PERBAIKAN mapHeaders ---

    let rowCount = 0;
    for await (const row of detailStream) {
        rowCount++;
        if (row['Tag Klan'] && row['Tag Klan'].startsWith('⚔️')) continue; // Skip baris header dummy

        const warId = row['ID War'];
        if (warId) {
            if (!detailsByWarId.has(warId)) {
                detailsByWarId.set(warId, []);
            }
            detailsByWarId.get(warId).push(row);
        }
    }
    console.log(`Langkah 3 Selesai: Membaca ${rowCount} baris detail, dikelompokkan ke ${detailsByWarId.size} ID Perang.`);
    return detailsByWarId;
}


/**
 * FUNGSI UTAMA MIGRASI
 */
async function startMigration() {
// ... (Bagian awal startMigration tetap sama) ...
// ... existing code ...
    console.log("Memulai migrasi multi-klan...");

    // Muat semua data ke memori
    const [clansToMigrate, warsData, detailsByWarId] = await Promise.all([
        readSettings(),
        readSummaryLog(),
        readDetailArchive()
    ]);

    if (clansToMigrate.length === 0) {
        console.log("Tidak ada klan yang dikonfigurasi di 'Pengaturan.csv'. Keluar.");
        return;
    }

    // --- LANGKAH 4: Loop, Gabungkan, dan Tulis ke Firestore per Klan ---
    for (const clan of clansToMigrate) {
        const { tag: clanTag, name: clanName } = clan;
        console.log(`\n======================================================`);
        console.log(`--- Memulai Proses untuk: ${clanName} (${clanTag}) ---`);
        
        const firestoreClanId = await getFirestoreClanId(clanTag);
        if (!firestoreClanId) {
            console.log(`--- MELEWATI KLAN: ${clanName} (ID Firestore tidak ditemukan) ---`);
            continue;
        }

        // --- PERBAIKAN ROADMAP (MASALAH 2): Arahkan ke Koleksi Arsip Baru ---
        const archiveRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(firestoreClanId)
            .collection('clanWarHistory'); // <-- Diubah dari 'warArchives'
        // --- AKHIR PERBAIKAN ---
            
        let batch = adminFirestore.batch();
        let batchCount = 0;
        let migratedCount = 0;

        // Iterasi semua perang yang ada di ringkasan
        for (const [warId, summaryData] of warsData.entries()) {
            
            // Filter hanya untuk klan yang sedang diproses
            if (summaryData.clanTag !== clanTag) {
                continue;
            }

            const detailRows = detailsByWarId.get(warId) || [];

            // Kita hanya migrasi jika ada data detail di 'Arsip Perang.csv'
            if (detailRows.length > 0) {
                summaryData.hasDetails = true;
                summaryData.clan.members = []; // Reset array
                summaryData.opponent.members = []; // Reset array
                
                // --- PERBAIKAN V3: Ambil info lawan dari baris pertama ---
// ... (Logika V3 opponent tag tetap sama) ...
// ... existing code ...
                const firstDetailRow = detailRows[0];
                if (firstDetailRow['Nama Klan Lawan'] && firstDetailRow['Nama Klan Lawan'].trim() !== '') {
                    summaryData.opponent.name = firstDetailRow['Nama Klan Lawan'].trim();
                }
                // Ambil tag lawan dari anggota lawan pertama. Ini krusial.
                if (firstDetailRow['Tag Lawan'] && firstDetailRow['Tag Lawan'].trim() !== '') {
                    summaryData.opponent.tag = firstDetailRow['Tag Lawan'].trim();
                } else {
                    // Fallback jika baris pertama tidak punya tag lawan
                    const rowWithTag = detailRows.find(r => r['Tag Lawan'] && r['Tag Lawan'].trim() !== '');
                    // Jika masih tidak ada, buat ID unik sementara
                    summaryData.opponent.tag = rowWithTag ? rowWithTag['Tag Lawan'].trim() : `#MIGRATED-${warId.substring(0,8)}`;
                }
                // --- AKHIR PERBAIKAN V3 ---

                // Proses penggabungan detail
                for (const row of detailRows) {
                    
                    // --- [PERBAIKAN V4: MEMASUKKAN DATA SERANGAN/BINTANG DARI CSV] ---

                    // 1. Data Serangan KITA (yang kita lakukan)
                    const attacksUsedCount = parseAttackStatus(row['Status Kita']);
                    const ourAttacks = [];
                    // Cek jika bintang valid DAN serangan digunakan
                    if (row['Bintang Kita'] && row['Bintang Kita'] !== '—' && attacksUsedCount > 0) {
                        const mockAttack = {
                            attackerTag: row['Tag'] || '#UNKNOWN_ATTACKER',
                            defenderTag: row['Target Kita'] || '#UNKNOWN_DEFENDER', 
                            stars: parseInt(row['Bintang Kita'], 10) || 0,
                            destructionPercentage: parseFloat(String(row['Persen Kita']).replace(',', '.')) || 0, // Ganti koma dgn titik
                            order: 1, // Asumsikan ini serangan pertama/terbaik
                            duration: 180 // Mock duration
                        };
                        ourAttacks.push(mockAttack);
                    }
                    
                    // 2. Data Pertahanan KITA (serangan lawan terhadap kita)
                    const ourBestDefense = (row['Bintang Lawan'] && row['Bintang Lawan'] !== '—') ? {
                         attackerTag: row['Tag Lawan'] || '#UNKNOWN_ATTACKER',
                         defenderTag: row['Tag'] || '#UNKNOWN_DEFENDER', // Targetnya adalah kita
                         stars: parseInt(row['Bintang Lawan'], 10) || 0,
                         destructionPercentage: parseFloat(String(row['Persen Lawan']).replace(',', '.')) || 0, // Ganti koma dgn titik
                         order: 1, 
                         duration: 180
                    } : null;
                    
                    // 3. Data Serangan LAWAN
                    const opponentAttackCount = parseAttackStatus(row['Status Lawan']);
                    const opponentAttacks = [];
                    // Jika lawan menyerang (punya bintang) DAN menggunakan serangan
                    if (ourBestDefense && opponentAttackCount > 0) {
                        // Serangan lawan = pertahanan terbaik kita
                        opponentAttacks.push({ ...ourBestDefense });
                    }
                    
                    // 4. Data Pertahanan LAWAN (serangan kita terhadap mereka)
                    const opponentBestDefense = (row['Bintang Kita'] && row['Bintang Kita'] !== '—') ? {
                         attackerTag: row['Tag'] || '#UNKNOWN_ATTACKER',
                         defenderTag: row['Tag Lawan'] || '#UNKNOWN_DEFENDER', // Targetnya adalah mereka
                         stars: parseInt(row['Bintang Kita'], 10) || 0,
                         destructionPercentage: parseFloat(String(row['Persen Kita']).replace(',', '.')) || 0, // Ganti koma
                        // --- [PERBAIKAN TYPO] Menghapus titik liar ---
                         order: 1, 
                         duration: 180
                    } : null;

                    // 5. Buat Objek Member (Sesuai Tipe CocWarMember)
                    const ourMember = {
                        tag: row['Tag'] || null,
                        name: row['Nama'] || 'Nama Tidak Ditemukan',
                        townhallLevel: parseInt(row['TH'], 10) || 0,
                        mapPosition: summaryData.clan.members.length + 1, 
                        opponentAttacks: opponentAttackCount, // Jumlah serangan DARI lawan
                        bestOpponentAttack: ourBestDefense, // Serangan terbaik DARI lawan
                        attacks: ourAttacks, // Serangan YANG KITA LAKUKAN
                    };

                    const opponentMember = {
                        tag: row['Tag Lawan'] || null,
                        name: row['Nama Pemain Lawan'] || 'Lawan Tidak Dikenal',
                        townhallLevel: parseInt(row['TH Lawan'], 10) || 0,
                        mapPosition: summaryData.opponent.members.length + 1,
                        opponentAttacks: attacksUsedCount, // Jumlah serangan DARI kita
                        bestOpponentAttack: opponentBestDefense, // Serangan terbaik DARI kita
                        attacks: opponentAttacks, // Serangan YANG DILAKUKAN lawan
                    }; // --- [PERBAIKAN TYPO] Menghapus '_D' dan 's'
                    // --- [AKHIR PERBAIKAN V4] ---


                    summaryData.clan.members.push(ourMember);
                    summaryData.opponent.members.push(opponentMember);
                }

                        // --- PERBAIKAN ROADMAP (MASALAH 1): Standarisasi ID Dokumen ---
                        // Kita akan membuat ID dokumen baru sesuai roadmap: [clanTag]-[warEndTimeISO]
                        
                        // 1. Ambil clanTag (sudah ada di summaryData.clanTag)
                        const standardizedClanTag = summaryData.clanTag; 
                        
                        // 2. Ambil warEndTime (sudah ada sebagai Date object) dan konversi ke ISO string
                        // Cek jika warEndTime valid
                        if (!summaryData.warEndTime || isNaN(summaryData.warEndTime.getTime()) || summaryData.warEndTime.getTime() === 0) {
                            console.warn(`  [PERINGATAN] Data perang dengan ID CSV '${warId}' memiliki warEndTime tidak valid. MELEWATI.`);
                            continue; // Lewati perang ini jika tanggalnya tidak valid
                        }
                        const standardizedWarEndTimeISO = summaryData.warEndTime.toISOString();

                        // 3. Buat ID Dokumen baru
                        const newDocId = `${standardizedClanTag}-${standardizedWarEndTimeISO}`;
                        // --- AKHIR PERBAIKAN ROADMAP ---
                
                // Tambahkan ke batch untuk ditulis
                        const docRef = archiveRef.doc(newDocId); // <-- Diubah dari warId
                
                // PERBAIKAN: Panggil cleanDataForAdminSDK di sini
                // Ini akan membersihkan nilai undefined SEBELUM dikirim ke batch.set
                const cleanedSummaryData = cleanDataForAdminSDK(summaryData);

                // Kita gunakan set (bukan update) dengan merge: true. Ini akan menimpa data lama
                // dengan ID yang sama, atau membuat baru jika belum ada.
                batch.set(docRef, cleanedSummaryData, { merge: true });
                batchCount++;
                migratedCount++;

                if (batchCount >= 490) {
                    await batch.commit();
                    console.log(`(Batch) Menyimpan ${batchCount} dokumen untuk ${clanName} ke 'clanWarHistory'...`);
                    batch = adminFirestore.batch(); // Buat batch baru
                    batchCount = 0;
                }
            }
        } // Akhir loop warsData

        // Commit sisa batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`(Batch) Menyimpan ${batchCount} dokumen terakhir untuk ${clanName} ke 'clanWarHistory'...`);
        }

        console.log(`--- ✅ Selesai untuk: ${clanName}. Total ${migratedCount} arsip perang (dengan detail) dimigrasi/diperbarui ke 'clanWarHistory'. ---`);
    } // Akhir loop klan

    console.log(`\n======================================================`);
    console.log(`✅✅ MIGRASI MULTI-KLAN SELESAI! ✅✅`);
}

// Mulai skrip migrasi
startMigration().catch(console.error).finally(() => {
    // opsional: tutup koneksi jika skrip tidak otomatis keluar
    // admin.app().delete(); 
});

