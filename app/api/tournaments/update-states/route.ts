// File: app/api/tournaments/update-states/route.ts
// Deskripsi: [BARU: Fase 7.4 - Pemicu Lokal] Endpoint POST publik (tanpa secret)
// untuk memicu pembaruan status turnamen. Ini adalah pengganti cron job
// untuk lingkungan localhost, dipanggil oleh client (misal: TournamentClient.tsx).

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Timestamp } from 'firebase-admin/firestore'; // Gunakan Timestamp admin

/**
 * @handler POST
 * @description Menjalankan tugas otomatis untuk memperbarui status turnamen.
 * Ini adalah 'lazy cron' yang dipicu oleh kunjungan pengguna.
 *
 * PENTING: Endpoint ini memerlukan 2 Indeks Komposit di Firestore:
 * 1. Koleksi: 'tournaments', Fields: status (asc), registrationStartsAt (asc)
 * 2. Koleksi: 'tournaments', Fields: status (asc), registrationEndsAt (asc)
 */
export async function POST(request: NextRequest) {
  // Tidak ada verifikasi secret, karena ini adalah pemicu publik/internal
  // Untuk keamanan tambahan di production, bisa ditambahkan rate limiting
  // atau dipanggil dari rute server-side lain, tapi untuk localhost ini OK.

  try {
    const now = Timestamp.now(); // Waktu server saat ini
    const tournamentsRef = adminFirestore.collection(COLLECTIONS.TOURNAMENTS);
    const batch = adminFirestore.batch();
    let openedCount = 0;
    let closedCount = 0;

    // 2. Transisi 1: Scheduled -> Registration Open
    // Cari turnamen yang masih 'scheduled' tapi waktu pendaftarannya sudah mulai
    const scheduledQuery = tournamentsRef
      .where('status', '==', 'scheduled')
      .where('registrationStartsAt', '<=', now);

    const scheduledSnapshot = await scheduledQuery.get();
    scheduledSnapshot.docs.forEach((doc) => {
      console.log(
        `[TRIGGER] Membuka pendaftaran turnamen: ${doc.id} - ${
          doc.data().title
        }`,
      );
      batch.update(doc.ref, { status: 'registration_open' });
      openedCount++;
    });

    // 3. Transisi 2: Registration Open -> Registration Closed
    // Cari turnamen yang masih 'registration_open' tapi waktu pendaftarannya sudah habis
    const openQuery = tournamentsRef
      .where('status', '==', 'registration_open')
      .where('registrationEndsAt', '<=', now);

    const openSnapshot = await openQuery.get();
    openSnapshot.docs.forEach((doc) => {
      console.log(
        `[TRIGGER] Menutup pendaftaran turnamen: ${doc.id} - ${
          doc.data().title
        }`,
      );
      batch.update(doc.ref, { status: 'registration_closed' });
      closedCount++;
    });

    // 4. Commit semua perubahan dalam satu batch
    if (openedCount > 0 || closedCount > 0) {
      await batch.commit();
    }

    const summary = `Trigger sukses: ${openedCount} turnamen dibuka, ${closedCount} turnamen ditutup.`;
    console.log(`[TRIGGER] ${summary}`);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[TRIGGER /api/tournaments/update-states] Error:', error);
    // Jika error disebabkan oleh indeks yang hilang, pesan error akan berisi link untuk membuatnya
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 },
    );
  }
}