/*
 * SKRIP PERBAIKAN DATA WAR (Tugas 3.3)
 *
 * TUJUAN:
 * Skrip ini dijalankan satu kali untuk memperbaiki data arsip war (summary)
 * yang disimpan oleh API sync-managed-clan (versi V5 sebelum Tugas 3.1)
 * yang tidak memiliki field 'ourStars', 'ourDestruction', 'opponentStars',
 * dan 'opponentDestruction' di top-level.
 *
 * LOGIKA:
 * 1. Terhubung ke Firebase Admin SDK.
 * 2. Mengambil SEMUA klan dari koleksi 'managedClans'.
 * 3. Untuk setiap klan, mengambil SEMUA dokumen dari sub-koleksi 'clanWarHistory'
 * yang memiliki 'hasDetails: false'.
 * 4. Memeriksa apakah 'ourDestruction' (atau field lainnya) 'undefined'.
 * 5. Jika 'undefined', salin data dari 'clan.stars', 'clan.destructionPercentage',
 * 'opponent.stars', dan 'opponent.destructionPercentage' ke top-level.
 * 6. Menyimpan pembaruan menggunakan batch.
 *
 * CARA MENGGUNAKAN:
 * 1. Pastikan file .env.local Anda berisi FIREBASE_SERVICE_ACCOUNT_KEY.
 * 2. Jalankan dari terminal: node scripts/fix-war-summaries.js
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
// --- AKHIR INISIALISASI ---

// Konstanta Nama Koleksi
const COLLECTIONS = {
    MANAGED_CLANS: 'managedClans',
};

/**
 * @function fixWarSummaries
 * Fungsi utama untuk memindai dan memperbaiki data.
 */
async function fixWarSummaries() {
    console.log('Memulai skrip perbaikan data WarSummary (Tugas 3.3)...');

    const clansSnapshot = await adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).get();

    if (clansSnapshot.empty) {
        console.log('Tidak ada klan yang dikelola (managedClans) ditemukan. Selesai.');
        return;
    }

    let totalClansProcessed = 0;
    let totalDocsFixed = 0;

    for (const clanDoc of clansSnapshot.docs) {
        const clanData = clanDoc.data();
        const clanId = clanDoc.id;
        const clanName = clanData.name || clanId;

        console.log(`\n--- Memproses Klan: ${clanName} (${clanId}) ---`);

        // 1. Tentukan referensi koleksi arsip
        const warHistoryRef = adminFirestore
            .collection(COLLECTIONS.MANAGED_CLANS)
            .doc(clanId)
            .collection('clanWarHistory');

        // 2. Query untuk dokumen summary (hasDetails: false)
        const summarySnapshot = await warHistoryRef.where('hasDetails', '==', false).get();

        if (summarySnapshot.empty) {
            console.log('  Tidak ada arsip summary (hasDetails: false) ditemukan. Melewatkan klan ini.');
            continue;
        }

        console.log(`  Ditemukan ${summarySnapshot.size} arsip summary. Memeriksa data...`);

        let batch = adminFirestore.batch();
        let batchCount = 0;
        let fixedInThisClan = 0;

        for (const warDoc of summarySnapshot.docs) {
            const warData = warDoc.data();

            // 3. Cek apakah field top-level hilang (penyebab error toFixed)
            // Kita cek 'ourDestruction' ATAU 'opponentName' sebagai penanda
            if (warData.ourDestruction === undefined || warData.ourStars === undefined || warData.opponentName === undefined) {
                
                const clanEntry = warData.clan;
                const opponentEntry = warData.opponent;

                // Pastikan data sumber (nested) ada
                if (!clanEntry || !opponentEntry) {
                    console.warn(`    [WARN] Melewatkan ${warDoc.id}: Data 'clan' atau 'opponent' di dalam dokumen hilang.`);
                    continue;
                }

                // 4. Buat payload pembaruan
                const updatePayload = {
                    ourStars: clanEntry.stars !== undefined ? clanEntry.stars : 0,
                    ourDestruction: clanEntry.destructionPercentage !== undefined ? clanEntry.destructionPercentage : 0,
                    opponentStars: opponentEntry.stars !== undefined ? opponentEntry.stars : 0,
                    opponentDestruction: opponentEntry.destructionPercentage !== undefined ? opponentEntry.destructionPercentage : 0,
                    opponentName: opponentEntry.name || 'Klan Lawan Tdk Diketahui' // <-- (FIX TUGAS 4.2)
                };

                console.log(`    [FIX] Memperbaiki ${warDoc.id}: Menambahkan data flat (Destruction: ${updatePayload.ourDestruction}%, Opponent: ${updatePayload.opponentName})`);

                // 5. Tambahkan ke batch
                batch.update(warDoc.ref, updatePayload);
                batchCount++;
                totalDocsFixed++;
                fixedInThisClan++;

                // Commit batch jika sudah penuh (batas 500)
                if (batchCount >= 490) {
                    await batch.commit();
                    console.log(`    (Batch) Menyimpan ${batchCount} perbaikan...`);
                    batch = adminFirestore.batch();
                    batchCount = 0;
                }
            }
        }

        // 6. Commit sisa batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`    (Batch) Menyimpan ${batchCount} perbaikan terakhir untuk klan ini.`);
        }

        console.log(`  Selesai untuk ${clanName}. Total ${fixedInThisClan} dokumen diperbaiki.`);
        totalClansProcessed++;
    }

    console.log(`\n======================================================`);
    console.log(`✅ Selesai. Total ${totalClansProcessed} klan diproses. Total ${totalDocsFixed} dokumen diperbaiki.`);
}

// Jalankan skrip
fixWarSummaries().catch(console.error).finally(() => {
    // Tutup koneksi admin (opsional, tapi baik untuk skrip)
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

