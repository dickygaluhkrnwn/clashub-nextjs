// lib/firebase-admin.ts
// Konfigurasi Firebase Admin SDK (HANYA UNTUK SERVER-SIDE)
import * as admin from 'firebase-admin';

// Periksa apakah aplikasi sudah diinisialisasi untuk mencegah inisialisasi ganda
if (!admin.apps.length) {
  try {
    // Kredensial diambil dari environment variable GOOGLE_APPLICATION_CREDENTIALS
    // atau dari variabel FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)
    // Pastikan salah satu variabel ini diset di environment Anda (.env.local)
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      // Jika menggunakan JSON string di .env.local
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
        // Tambahkan databaseURL jika diperlukan (biasanya tidak jika projectId benar)
        // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log('Firebase Admin SDK initialized with Service Account Key.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       // Jika menggunakan path file kredensial (umum di Cloud Functions/Run)
      admin.initializeApp({
         credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin SDK initialized with Application Default Credentials.');
    } else {
       // Opsi fallback jika tidak ada kredensial service account (mungkin berguna untuk dev lokal tanpa akses penuh)
       // Namun, ini TIDAK akan bypass security rules. Sebaiknya selalu gunakan service account.
       console.warn("WARNING: Firebase Admin SDK initialized WITHOUT service account credentials. Firestore operations might fail due to permissions.");
       admin.initializeApp({
           projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
       });
    }

  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Anda bisa melempar error di sini jika inisialisasi kritis
    // throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

// Ekspor instance Firestore dan Auth Admin SDK yang sudah diinisialisasi
const adminFirestore = admin.firestore();
const adminAuth = admin.auth();

export { admin, adminFirestore, adminAuth };
