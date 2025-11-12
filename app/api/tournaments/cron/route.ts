// File: app/api/tournaments/cron/route.ts
// Deskripsi: [BARU: Fase 7.4] Endpoint Cron Job untuk transisi status turnamen otomatis.
// Endpoint ini HARUS dipanggil oleh layanan cron eksternal (misal: Vercel Cron, GitHub Actions).

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Timestamp } from 'firebase-admin/firestore'; // Gunakan Timestamp admin

/**
 * @handler GET
 * @description Menjalankan tugas otomatis untuk memperbarui status turnamen.
 * Amankan dengan secret key di query parameter (misal: ?secret=RAHASIA_ANDA)
 *
 * PENTING: Endpoint ini memerlukan 2 Indeks Komposit di Firestore:
 * 1. Koleksi: 'tournaments', Fields: status (asc), registrationStartsAt (asc)
 * 2. Koleksi: 'tournaments', Fields: status (asc), registrationEndsAt (asc)
 *
 * Jika error, Firestore akan memberikan link untuk membuatnya di log error.
 */
export async function GET(request: NextRequest) {
  // 1. Keamanan: Verifikasi Cron Secret Key
  const secret = request.nextUrl.searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    console.warn('[CRON] Peringatan: Upaya akses cron job gagal (secret salah).');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        `[CRON] Membuka pendaftaran turnamen: ${doc.id} - ${doc.data().title}`,
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
        `[CRON] Menutup pendaftaran turnamen: ${doc.id} - ${doc.data().title}`,
      );
      batch.update(doc.ref, { status: 'registration_closed' });
      closedCount++;
    });

    // 4. Commit semua perubahan dalam satu batch
    if (openedCount > 0 || closedCount > 0) {
      await batch.commit();
    }

    const summary = `Cron job sukses: ${openedCount} turnamen dibuka, ${closedCount} turnamen ditutup.`;
    console.log(`[CRON] ${summary}`);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[CRON /api/tournaments/cron] Error:', error);
    // Jika error disebabkan oleh indeks yang hilang, pesan error akan berisi link untuk membuatnya
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 },
    );
  }
}