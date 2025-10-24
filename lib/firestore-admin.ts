// File: lib/firebase-admin.ts
// Deskripsi: Inisialisasi Firebase Admin SDK untuk penggunaan sisi server.

import * as admin from 'firebase-admin';
// Import Timestamp dari namespace firestore dan export dengan alias
import { Timestamp as AdminSDKTimestamp } from 'firebase-admin/firestore';

// Tipe untuk kredensial service account
interface ServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
    universe_domain?: string; // Optional field
}

// Hanya inisialisasi jika belum ada
if (!admin.apps.length) {
    try {
        const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKeyJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
        }

        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKeyJson);

        admin.initializeApp({
            // --- PERBAIKAN: Tambahkan type assertion ---
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
            // --- AKHIR PERBAIKAN ---
        });
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
        // Pertimbangkan apakah aplikasi harus crash jika admin SDK gagal?
        // throw error; // Uncomment jika ingin menghentikan aplikasi jika gagal
    }
}

// Ekspor instance Firestore Admin SDK
const adminFirestore = admin.firestore();

// Ekspor Timestamp Admin SDK dengan alias
const AdminTimestamp = AdminSDKTimestamp;

export { adminFirestore, AdminTimestamp };

