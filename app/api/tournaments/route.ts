// File: app/api/tournaments/route.ts
// Deskripsi: API Endpoint untuk (POST) membuat turnamen baru dan (GET) mengambil semua turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // (1) Otentikasi
// [ROMBAK V2] Impor Tipe Tournament (yang sudah update)
import { Tournament } from '@/lib/types';
import {
  createTournamentAdmin,
  getAllTournamentsAdmin,
} from '@/lib/firestore-admin/tournaments'; // (2) Fungsi Admin
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // (3) Poin

// [ROMBAK V2] Tipe data payload yang diharapkan dari CreateTournamentClient.tsx
// Tipe ini harus cocok dengan payload yang dikirim dari form baru
// (Semua field Tournament kecuali 'id', 'createdAt', 'participantCountCurrent', 'status')
type CreateTournamentPayload = Omit<
  Tournament,
  'id' | 'createdAt' | 'participantCountCurrent' | 'status'
>;

/**
 * @handler GET
 * @description Mengambil daftar semua turnamen (Tahap 3, Poin 1).
 * Endpoint ini publik, tidak perlu otentikasi.
 */
export async function GET(request: NextRequest) {
  try {
    const tournaments = await getAllTournamentsAdmin();

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('[GET /api/tournaments] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

/**
 * @handler POST
 * @description Membuat turnamen baru (Tahap 2, Poin 3).
 * Endpoint ini privat, memerlukan otentikasi.
 */
export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pengguna
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse dan Validasi Body Request
    const body = (await request.json()) as CreateTournamentPayload;

    // [ROMBAK V2] Validasi field-field baru dari Peta Develop
    const {
      title,
      description,
      rules,
      prizePool,
      startsAt,
      endsAt, // Baru
      format, // Baru
      participantCount, // Baru
      thRequirement, // Baru
      organizerUid, // [FIX] Diubah dari organizerId ke organizerUid
    } = body;

    // Validasi dasar
    if (
      !title ||
      !description ||
      !rules ||
      !prizePool ||
      !startsAt ||
      !endsAt || // Baru
      !format || // Baru
      !participantCount || // Baru
      !thRequirement // Baru
    ) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 },
      );
    }

    // 3. Validasi Keamanan (PENTING)
    // Pastikan UID pengguna yang login adalah UID yang dikirim sebagai organizer.
    if (organizerUid !== sessionUser.uid) { // [FIX] Diubah dari organizerId ke organizerUid
      return NextResponse.json(
        { error: 'Forbidden: Organizer ID mismatch' },
        { status: 403 },
      );
    }

    // 4. Siapkan data lengkap untuk disimpan (termasuk data server-side)
    // Tipe ini Omit<'id'> karena createTournamentAdmin akan men-generate ID
    const newTournamentData: Omit<Tournament, 'id'> = {
      ...body,
      // Konversi string JSON (dari body) kembali ke objek Date
      // agar cleanDataForAdminSDK bisa mengubahnya jadi Timestamp
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      
      // [ROMBAK V2] Tambahkan field sisi server sesuai Peta Develop
      status: 'registration_open', // Status default saat dibuat
      participantCountCurrent: 0, // Counter tim terdaftar, mulai dari 0
      createdAt: new Date(), // Waktu pembuatan (akan dikonversi oleh adminSDK)
    };

    // 5. Simpan ke Firestore
    // createTournamentAdmin (yang kita update di Fase 1)
    // sekarang mengharapkan data lengkap Omit<Tournament, 'id'>
    const newTournamentId = await createTournamentAdmin(newTournamentData);

    // 6. Tambahkan Poin Popularitas (Gamifikasi)
    incrementPopularity(
      sessionUser.uid,
      20, // Dapat 20 poin karena membuat turnamen
      `new_tournament: ${body.title.substring(0, 20)}`,
    ).catch((err) => {
      // Log error jika penambahan poin gagal, tapi jangan gagalkan respons utama
      console.error(
        `[POST /api/tournaments] Gagal menambah poin untuk user ${sessionUser.uid}:`,
        err,
      );
    });

    // 7. Kembalikan data turnamen yang baru dibuat
    return NextResponse.json(
      { id: newTournamentId, ...newTournamentData },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/tournaments] Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}