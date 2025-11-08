// File: app/api/tournaments/[tournamentId]/participants/route.ts
// Deskripsi: [BARU - TAHAP 6] API Endpoint untuk (GET) mengambil daftar peserta
// (tim terdaftar) dari sebuah turnamen.

import { NextResponse, NextRequest } from 'next/server';
import { getParticipantsForTournamentAdmin } from '@/lib/firestore-admin/tournaments';

/**
 * @handler GET
 * @description Mengambil daftar semua peserta (tim) yang terdaftar di turnamen.
 * Endpoint ini publik.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  // 1. Validasi dasar
  if (!tournamentId) {
    return NextResponse.json(
      { error: 'Tournament ID tidak valid' },
      { status: 400 },
    );
  }

  try {
    // 2. Panggil fungsi admin yang sudah kita buat
    const participants = await getParticipantsForTournamentAdmin(tournamentId);

    // 3. Kembalikan data peserta.
    // Fungsi ini mengembalikan array kosong jika error atau tidak ada,
    // jadi kita bisa langsung return.
    return NextResponse.json(participants);
  } catch (error) {
    console.error(
      `[GET /api/tournaments/${tournamentId}/participants] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}