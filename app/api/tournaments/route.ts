// File: app/api/tournaments/route.ts
// Deskripsi: API Endpoint untuk (POST) membuat turnamen baru dan (GET) mengambil semua turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // (1) Otentikasi
// [ROMBAK V2] Impor Tipe Tournament (yang sudah update di Fase 7.1)
import { Tournament } from '@/lib/clashub.types';
import {
  createTournamentAdmin,
  getAllTournamentsAdmin,
} from '@/lib/firestore-admin/tournaments'; // (2) Fungsi Admin
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // (3) Poin

// [ROMBAK V2] Tipe data payload yang diharapkan dari CreateTournamentClient.tsx
// Tipe ini OKE karena 'Tournament' di types.ts sudah diupdate di Fase 7.1
type CreateTournamentPayload = Omit<
  Tournament,
  'id' | 'createdAt' | 'participantCountCurrent' | 'status'
>;

/**
 * @handler GET
 * @description Mengambil daftar semua turnamen (Tahap 3, Poin 1).
 * Endpoint ini publik, tidak perlu otentikasi.
 * [NOTE FASE 7.3] Handler ini tidak diubah. Logika Cron Job akan ada di file terpisah.
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
 * [UPDATE FASE 7.3] Diperbarui untuk menangani 4 field tanggal baru dan status awal.
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

    // [UPDATE FASE 7.3] Validasi field-field baru dari Peta Develop
    const {
      title,
      description,
      rules,
      prizePool,
      // [Fase 7.3] Hapus field lama
      // startsAt,
      // endsAt,
      // [Fase 7.3] Tambah field baru
      registrationStartsAt,
      registrationEndsAt,
      tournamentStartsAt,
      tournamentEndsAt,
      format,
      participantCount,
      thRequirement,
      organizerUid,
    } = body;

    // Validasi dasar
    if (
      !title ||
      !description ||
      !rules ||
      !prizePool ||
      // [Fase 7.3] Cek field baru
      !registrationStartsAt ||
      !registrationEndsAt ||
      !tournamentStartsAt ||
      !tournamentEndsAt ||
      !format ||
      !participantCount ||
      !thRequirement
    ) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 },
      );
    }

    // 3. Validasi Keamanan (PENTING)
    // Pastikan UID pengguna yang login adalah UID yang dikirim sebagai organizer.
    if (organizerUid !== sessionUser.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Organizer ID mismatch' },
        { status: 403 },
      );
    }

    // [BARU: FASE 7.3] Tentukan status awal berdasarkan registrationStartsAt
    // Konversi string JSON ke objek Date untuk perbandingan
    const regStartDate = new Date(registrationStartsAt);
    const now = new Date(); // Waktu server saat ini
    const initialStatus =
      regStartDate > now ? 'scheduled' : 'registration_open';

    // 4. Siapkan data lengkap untuk disimpan (termasuk data server-side)
    // Tipe ini Omit<'id'> karena createTournamentAdmin akan men-generate ID
    const newTournamentData: Omit<Tournament, 'id'> = {
      ...body,
      // Konversi string JSON (dari body) kembali ke objek Date
      // agar cleanDataForAdminSDK bisa mengubahnya jadi Timestamp
      // [UPDATE FASE 7.3] Konversi 4 field tanggal baru
      registrationStartsAt: regStartDate,
      registrationEndsAt: new Date(registrationEndsAt),
      tournamentStartsAt: new Date(tournamentStartsAt),
      tournamentEndsAt: new Date(tournamentEndsAt),

      // [UPDATE FASE 7.3] Tambahkan field sisi server
      status: initialStatus, // Status dinamis (scheduled atau registration_open)
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