// File: lib/firestore-admin/utils.ts
// Deskripsi: Berisi fungsi utilitas internal untuk Admin SDK (pembersihan data & konversi snapshot).

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
// FIX: Impor tipe FirestoreDocument dari barrel file utama kita
import { FirestoreDocument } from '@/lib/types';

/**
 * @function cleanDataForAdminSDK
 * Membersihkan objek data sebelum dikirim ke Firebase Admin SDK.
 * Menghapus kunci 'undefined' dan 'null' (Firestore tidak menerimanya).
 * Mengonversi objek 'Date' JavaScript menjadi 'AdminTimestamp' Firestore.
 */
export function cleanDataForAdminSDK<T extends object>(
  data: Partial<T>
): FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> {
  const cleaned: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> =
    {};
  for (const key in data) {
    if (
      Object.prototype.hasOwnProperty.call(data, key) &&
      data[key] !== undefined &&
      data[key] !== null // Tetap hapus null, kecuali jika memang disengaja (ditangani di logic pemanggil)
    ) {
      // Cek apakah ini objek Date
      if (Object.prototype.toString.call(data[key]) === '[object Date]') {
        // Konversi ke AdminTimestamp
        cleaned[key] = AdminTimestamp.fromDate(data[key] as unknown as Date);
      } else {
        // Biarkan nilai primitif (string, number, bool) atau array
        cleaned[key] = data[key];
      }
    }
  }
  return cleaned;
}

/**
 * @function docToDataAdmin
 * Mengonversi snapshot dokumen Firestore (Admin SDK) menjadi objek data T.
 * Secara otomatis menambahkan 'id' dokumen ke objek.
 * Secara otomatis mengonversi 'AdminTimestamp' Firestore kembali menjadi objek 'Date' JavaScript.
 */
export function docToDataAdmin<T>(
  doc: FirebaseFirestore.DocumentSnapshot
): FirestoreDocument<T> | null {
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as any; // Ambil data
  if (!data) {
    return null; // Handle jika data() null (meskipun exists harusnya true)
  }

  // Konversi semua AdminTimestamp kembali ke Date
  Object.keys(data).forEach((key) => {
    if (data[key] && typeof data[key].toDate === 'function') {
      data[key] = (data[key] as AdminTimestamp).toDate();
    }
  });

  // Kembalikan sebagai tipe FirestoreDocument<T>
  return { id: doc.id, ...data } as FirestoreDocument<T>;
}

