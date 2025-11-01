/*
 * SKRIP PEMBERSIH DUPLIKAT DATA WAR (Revisi 1)
 *
 * TUJUAN:
 * Membersihkan duplikat 'clanWarHistory'
 *
 * LOGIKA REVISI (Fuzzy Matching):
 * 1. Terhubung ke Firebase Admin SDK.
 * 2. Mengambil SEMUA klan dari 'managedClans'.
 * 3. Untuk setiap klan:
 * 4. Mengambil SEMUA dokumen dari 'clanWarHistory'.
 * 5. Mem-parsing SEMUA dokumen (detail dan summary) ke format standar
 * menggunakan 'getWarKeyData' (memperbaiki tanggal string CoC).
 * 6. Memisahkan dokumen menjadi dua daftar: `detailWars` (hasDetails: true) dan `summaryWars` (hasDetails: false).
 * 7. Melakukan iterasi pada `summaryWars`.
 * 8. Untuk setiap `summaryWar`, cari di dalam `detailWars` yang:
 * a. Memiliki `opponentName` yang sama.
 * b. Memiliki selisih `endTime` kurang dari 48 jam (48 * 3600 * 1000 ms).
 * 9. Jika kecocokan "fuzzy" ini ditemukan, hapus `summaryWar` menggunakan batch.
 *
 * CARA MENGGUNAKAN:
 * 1. Pastikan file .env.local Anda berisi FIREBASE_SERVICE_ACCOUNT_KEY.
 * 2. Jalankan dari terminal: node scripts/merge-war-duplicates.js
 */

const path = require('path');
const admin = require('firebase-admin');

// Muat .env.local dari root project
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// --- Inisialisasi Firebase Admin ---
if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY tidak ditemukan di file .env.local. Skrip tidak bisa dijalankan.");
        }
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
        });
        console.log('Firebase Admin SDK berhasil diinisialisasi.');
    } catch (error) {
        console.error('Firebase Admin SDK initialization error:', error.message);
        process.exit(1); // Keluar jika gagal inisialisasi
    }
}
const adminFirestore = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
// --- AKHIR INISIALISASI ---

// Konstanta Nama Koleksi
const COLLECTIONS = {
    MANAGED_CLANS: 'managedClans',
};

// Toleransi waktu untuk pencocokan fuzzy (48 jam dalam milidetik)
const FUZZY_TIME_TOLERANCE_MS = 48 * 60 * 60 * 1000;

// =========================================================================
// HELPER PARSING (Dicopy dari WarHistoryTabContent.tsx & th-utils.ts)
// =========================================================================

function parseCocDate(cocDateStr) {
    if (!cocDateStr) return null;
    try {
        if (cocDateStr.length < 15) return null;
        const isoStr = `${cocDateStr.substring(0, 4)}-${cocDateStr.substring(4, 6)}-${cocDateStr.substring(6, 8)}T${cocDateStr.substring(9, 11)}:${cocDateStr.substring(11, 13)}:${cocDateStr.substring(13, 15)}${cocDateStr.substring(15)}`;
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch (error) {
        return null;
    }
};

/**
 * Mengonversi snapshot dokumen Firestore ke objek standar untuk pencocokan.
 */
const getWarKeyData = (doc) => {
    const data = doc.data();
    let endTime;

    const timestampSource = data.warEndTime;
    const stringSource = data.endTime;

    if (timestampSource && typeof timestampSource.toDate === 'function') {
        endTime = timestampSource.toDate();
    } else if (timestampSource && typeof timestampSource.seconds === 'number') {
        endTime = new Date(timestampSource.seconds * 1000);
    } else if (typeof stringSource === 'string') {
        endTime = parseCocDate(stringSource) || new Date(0);
    } else {
        endTime = new Date(0);
    }

    const hasDetails = data.hasDetails === true;

    // Ambil nama lawan berdasarkan hasDetails
    const opponentName = hasDetails
        ? (data.opponent?.name || 'Nama Lawan (Detail)')
        : (data.opponentName || data.opponent?.name || 'Nama Lawan (Ringkasan)');

    return {
        id: doc.id,
        ref: doc.ref,
        hasDetails: hasDetails,
        opponentName: opponentName, // Kita butuh nama lawan
        endTime: endTime, // Kita butuh objek Date
        teamSize: data.teamSize || 0 // Tambahkan teamSize untuk pencocokan lebih baik
    };
};

// =========================================================================
// FUNGSI UTAMA SKRIP
// =========================================================================

async function mergeWarDuplicates() {
    console.log('Memulai skrip pembersihan duplikat WarHistory (REVISI 1 - Fuzzy Logic)...');

    const clansSnapshot = await adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).get();

    if (clansSnapshot.empty) {
        console.log('Tidak ada klan yang dikelola (managedClans) ditemukan. Selesai.');
        return;
    }

    let totalClansProcessed = 0;
    let totalDocsDeleted = 0;

    for (const clanDoc of clansSnapshot.docs) {
        const clanData = clanDoc.data();
        const clanId = clanDoc.id;
        const clanName = clanData.name || clanId;

        console.log(`\n--- Memproses Klan: ${clanName} (${clanId}) ---`);

        const warHistoryRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('clanWarHistory');

        const allWarsSnapshot = await warHistoryRef.get();

        if (allWarsSnapshot.empty) {
            console.log('  Tidak ada arsip di clanWarHistory. Melewatkan klan ini.');
            continue;
        }

        console.log(`  Ditemukan ${allWarsSnapshot.size} total arsip. Memetakan data...`);

        const detailWars = [];
        const summaryWars = [];

        allWarsSnapshot.docs.forEach(doc => {
            const warKeyData = getWarKeyData(doc);
            
            if (warKeyData.endTime.getTime() === 0) {
                console.warn(`    [WARN] Melewatkan ${warKeyData.id} (Invalid Date)`);
                return;
            }

            if (warKeyData.hasDetails) {
                detailWars.push(warKeyData);
            } else {
                summaryWars.push(warKeyData);
            }
        });

        console.log(`  Ditemukan ${detailWars.length} data detail (Migrasi CSV).`);
        console.log(`  Ditemukan ${summaryWars.length} data ringkasan (API Sync). Memeriksa duplikat...`);

        let batch = adminFirestore.batch();
        let batchCount = 0;
        let deletedInThisClan = 0;

        for (const summaryWar of summaryWars) {
            // Cari kecocokan "fuzzy" di dalam detailWars
            const matchingDetailWar = detailWars.find(detailWar => {
                // 1. Nama lawan harus sama
                const nameMatch = detailWar.opponentName === summaryWar.opponentName;
                // 2. Ukuran tim harus sama
                const sizeMatch = detailWar.teamSize === summaryWar.teamSize;
                // 3. Waktu harus berdekatan (dalam 48 jam)
                const timeDiff = Math.abs(detailWar.endTime.getTime() - summaryWar.endTime.getTime());
                const timeMatch = timeDiff < FUZZY_TIME_TOLERANCE_MS;

                return nameMatch && sizeMatch && timeMatch;
            });

            if (matchingDetailWar) {
                // DUPLIKAT DITEMUKAN!
                console.log(`    [DELETE] Menghapus ringkasan duplikat: ${summaryWar.id}`);
                console.log(`             -> Cocok (Fuzzy) dengan detail: ${matchingDetailWar.id}`);
                
                batch.delete(summaryWar.ref);
                batchCount++;
                totalDocsDeleted++;
                deletedInThisClan++;

                if (batchCount >= 490) {
                    await batch.commit();
                    console.log(`    (Batch) Menghapus ${batchCount} dokumen...`);
                    batch = adminFirestore.batch();
                    batchCount = 0;
                }
            }
        }

        // Commit sisa batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`    (Batch) Menghapus ${batchCount} dokumen terakhir untuk klan ini.`);
        }

        console.log(`  Selesai untuk ${clanName}. Total ${deletedInThisClan} dokumen ringkasan duplikat dihapus.`);
        totalClansProcessed++;
    }

    console.log(`\n======================================================`);
    console.log(`✅ Selesai. Total ${totalClansProcessed} klan diproses. Total ${totalDocsDeleted} dokumen duplikat dihapus.`);
}

// Jalankan skrip
mergeWarDuplicates().catch(console.error).finally(() => {
    admin.app().delete()
        .then(() => {
            console.log("Koneksi Firebase Admin ditutup.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("Gagal menutup koneksi admin:", err);
            process.exit(1);
        });
});

