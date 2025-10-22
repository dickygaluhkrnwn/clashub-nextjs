// File: scripts/seed.js
// Deskripsi: Script untuk mengunggah data contoh ke Firestore.
// Dijalankan secara manual dari terminal.

// 1. Impor semua yang kita butuhkan
const { initializeApp } = require('firebase/app');
// BARU: Tambahkan doc dan setDoc ke impor
const { getFirestore, collection, addDoc, writeBatch, getDocs, doc, setDoc } = require('firebase/firestore');
// Import data requests BARU
const { dummyTeams, dummyPlayers, dummyTournaments, dummyJoinRequests, dummyPosts } = require('./seed-data');

// Kita butuh dotenv untuk membaca file .env.local
require('dotenv').config({ path: '.env.local' });

// 2. Konfigurasi Firebase (sama seperti di lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// 4. Fungsi utama untuk seeding
async function seedDatabase() {
    console.log('Memulai proses seeding database...');

    try {
        // Hapus data lama (opsional, tapi bagus untuk testing)
        console.log('Menghapus data lama...');
        await clearCollection('teams');
        await clearCollection('users');
        await clearCollection('tournaments');
        await clearCollection('joinRequests'); 
        await clearCollection('posts'); // BARU: Hapus koleksi posts

        // Seeding Teams
        console.log(`Menambahkan ${dummyTeams.length} tim...`);
        for (const team of dummyTeams) {
            // Menggunakan nama tim sebagai ID untuk memudahkan debugging relasi (teamId)
            // Diperbaiki: Menggunakan setDoc untuk konsistensi dengan getDoc/doc
            await setDoc(doc(firestore, 'teams', team.name), team); 
        }

        // Seeding Players (Users)
        console.log(`Menambahkan ${dummyPlayers.length} pemain...`);
        for (const player of dummyPlayers) {
            // Menggunakan UID sebagai ID dokumen
            await setDoc(doc(firestore, 'users', player.uid), player);
        }

        // Seeding Tournaments
        console.log(`Menambahkan ${dummyTournaments.length} turnamen...`);
        for (const tournament of dummyTournaments) {
            await addDoc(collection(firestore, 'tournaments'), tournament);
        }
        
        // Seeding Join Requests
        console.log(`Menambahkan ${dummyJoinRequests.length} permintaan bergabung...`);
        for (const request of dummyJoinRequests) {
            await addDoc(collection(firestore, 'joinRequests'), request);
        }

        // BARU: Seeding Posts
        console.log(`Menambahkan ${dummyPosts.length} postingan ke Knowledge Hub...`);
        for (const post of dummyPosts) {
            // Menggunakan addDoc agar Firestore menghasilkan ID unik
            await addDoc(collection(firestore, 'posts'), post);
        }

        console.log('\n✅ Seeding database berhasil!');

    } catch (error) {
        console.error('\n❌ Terjadi error saat seeding:', error);
    } finally {
        // Penting untuk keluar dari proses setelah selesai
        process.exit(0);
    }
}

// Fungsi helper untuk menghapus semua dokumen dalam sebuah koleksi
async function clearCollection(collectionName) {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`- Koleksi '${collectionName}' berhasil dibersihkan.`);
}


// 5. Jalankan fungsi seeding
seedDatabase();
