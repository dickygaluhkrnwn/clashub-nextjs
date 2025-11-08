// File: app/api/tournaments/route.ts
// Deskripsi: API Endpoint untuk (POST) membuat turnamen baru dan (GET) mengambil semua turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // (1) Otentikasi
import { Tournament } from '@/lib/types'; // Tipe data
import {
  createTournamentAdmin,
  getAllTournamentsAdmin,
} from '@/lib/firestore-admin/tournaments'; // (2) Fungsi Admin
import { incrementPopularity } from '@/lib/firestore-admin/popularity'; // (3) Poin

// Tipe data payload yang diharapkan dari CreateTournamentClient.tsx
// Tipe ini (dari lib/types.ts) sudah otomatis sinkron (memiliki title dan thRequirement)
type CreateTournamentPayload = Omit<
  Tournament,
  'id' | 'createdAt' | 'participantCount'
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

    // [PERBAIKAN] Menggunakan 'title' dan 'thRequirement' (bukan 'name')
    const {
      title,
      description,
      rules,
      prizePool,
      thRequirement, // <-- [BARU] Ditambahkan
      startDate,
      organizerId,
    } = body;

    // Validasi dasar
    // [PERBAIKAN] Memvalidasi 'title' dan 'thRequirement'
    if (
      !title ||
      !description ||
      !rules ||
      !prizePool ||
      !thRequirement ||
      !startDate
    ) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 },
      );
    }

    // 3. Validasi Keamanan (PENTING)
    // Pastikan UID pengguna yang login adalah UID yang dikirim sebagai organizer.
    if (organizerId !== sessionUser.uid) {
      return NextResponse.json(
        { error: 'Forbidden: Organizer ID mismatch' },
        { status: 403 },
      );
    }

    // 4. Simpan ke Firestore
    // Kita mem-pass seluruh 'body' karena sudah sesuai dengan tipe
    // Omit<Tournament, 'id' | 'createdAt' | 'participantCount'>
    // yang diharapkan oleh createTournamentAdmin.
    const newTournamentId = await createTournamentAdmin(body);

    // 5. Tambahkan Poin Popularitas (Gamifikasi) - (Mirip 'posts/route.ts')
    // Kita tidak perlu 'await', biarkan berjalan di background.
    incrementPopularity(
      sessionUser.uid,
      20, // Dapat 20 poin karena membuat turnamen
      // [PERBAIKAN] Menggunakan 'title'
      `new_tournament: ${body.title.substring(0, 20)}`,
    ).catch((err) => {
      // Log error jika penambahan poin gagal, tapi jangan gagalkan respons utama
      console.error(
        `[POST /api/tournaments] Gagal menambah poin untuk user ${sessionUser.uid}:`,
        err,
      );
    });

    // 6. Kembalikan data postingan yang baru dibuat (atau cukup ID-nya)
    return NextResponse.json(
      { id: newTournamentId, ...body },
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