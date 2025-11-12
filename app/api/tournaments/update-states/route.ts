// File: app/api/tournaments/update-states/route.ts
// Deskripsi: [FIX FASE 11.1] Query diubah agar tidak memerlukan Indeks Komposit.
// Filter tanggal sekarang ditangani di sisi server (JS) setelah data diambil.

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Timestamp } from 'firebase-admin/firestore'; // Gunakan Timestamp admin

/**
 * @handler POST
 * @description Menjalankan tugas otomatis untuk memperbarui status turnamen.
 * Ini adalah 'lazy cron' yang dipicu oleh kunjungan pengguna.
 *
 * [FIX FASE 11.1] Logika ini diubah agar tidak memerlukan Indeks Komposit.
 * Kita mengambil berdasarkan status saja, lalu memfilter tanggal secara manual.
 */
export async function POST(request: NextRequest) {
  try {
    const now = Timestamp.now(); // Waktu server saat ini
    const nowMillis = now.toMillis(); // Waktu saat ini dalam milidetik untuk perbandingan
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);
    const batch = adminFirestore.batch();
    let openedCount = 0;
    let closedCount = 0;

    // 1. Transisi 1: Scheduled -> Registration Open
    // [FIX FASE 11.1] Query disederhanakan, HANYA mengambil berdasarkan status.
    const scheduledQuery = tournamentsRef.where('status', '==', 'scheduled');

    const scheduledSnapshot = await scheduledQuery.get();
    scheduledSnapshot.docs.forEach((doc) => {
      const docData = doc.data();

      // [FIX FASE 11.1] Filter manual di sisi server (JavaScript)
      // Cek apakah field tanggal ada dan apakah waktunya sudah lewat
      if (
        docData.registrationStartsAt &&
        docData.registrationStartsAt.toMillis() <= nowMillis
      ) {
        console.log(
          `[TRIGGER] Membuka pendaftaran turnamen: ${doc.id} - ${
            docData.title || '(No Title)'
          }`,
        );
        batch.update(doc.ref, { status: 'registration_open' });
        openedCount++;
      }
    });

    // 2. Transisi 2: Registration Open -> Registration Closed
    // [FIX FASE 11.1] Query disederhanakan, HANYA mengambil berdasarkan status.
    const openQuery = tournamentsRef.where('status', '==', 'registration_open');

    const openSnapshot = await openQuery.get();
    openSnapshot.docs.forEach((doc) => {
      const docData = doc.data();

      // [FIX FASE 11.1] Filter manual di sisi server (JavaScript)
      // Cek apakah field tanggal ada dan apakah waktunya sudah lewat
      if (
        docData.registrationEndsAt &&
        docData.registrationEndsAt.toMillis() <= nowMillis
      ) {
        console.log(
          `[TRIGGER] Menutup pendaftaran turnamen: ${doc.id} - ${
            docData.title || '(No Title)'
          }`,
        );
        batch.update(doc.ref, { status: 'registration_closed' });
        closedCount++;
      }
    });

    // 3. Commit semua perubahan dalam satu batch
    if (openedCount > 0 || closedCount > 0) {
      await batch.commit();
    }

    const summary = `Trigger sukses: ${openedCount} turnamen dibuka, ${closedCount} turnamen ditutup.`;
    console.log(`[TRIGGER] ${summary}`);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[TRIGGER /api/tournaments/update-states] Error:', error);
    // Error sekarang seharusnya bukan lagi 'FAILED_PRECONDITION'
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 },
    );
  }
}