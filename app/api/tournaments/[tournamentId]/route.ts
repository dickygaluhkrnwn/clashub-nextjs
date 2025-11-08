// File: app/api/tournaments/[tournamentId]/route.ts
// Deskripsi: API Endpoint untuk (GET) mengambil data satu turnamen spesifik.
// (Sesuai Peta Pengembangan - Tahap 4, Poin 3)

import { NextResponse, NextRequest } from 'next/server';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';

/**
 * @handler GET
 * @description Mengambil data satu turnamen spesifik berdasarkan ID-nya.
 * Endpoint ini publik.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  // Validasi dasar
  if (!tournamentId) {
    return NextResponse.json(
      { error: 'Tournament ID tidak valid' },
      { status: 400 },
    );
  }

  try {
    const tournament = await getTournamentByIdAdmin(tournamentId);

    // Handle jika turnamen tidak ditemukan
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan' },
        { status: 404 },
      );
    }

    // Sukses: Kembalikan data turnamen
    return NextResponse.json(tournament);
  } catch (error) {
    console.error(
      `[GET /api/tournaments/${tournamentId}] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}