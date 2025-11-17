// File: app/api/coc/get-player/[playerTag]/route.ts
// Deskripsi: API route internal untuk mengambil data LENGKAP player dari API COC.
// File ini dibuat sebagai bagian dari FASE 1 Peta Develop.

import { NextResponse } from 'next/server';
import { getPlayerData } from '../../../../../lib/coc-api'; // Menggunakan named export

/**
 * @api {get} /api/coc/get-player/:playerTag
 * @description Mengambil data profil lengkap seorang player dari API COC.
 * @param {Request} request - Objek request (tidak digunakan)
 * @param {object} params - Parameter rute
 * @param {string} params.playerTag - Tag player yang MENTAH (misal: #123ABC)
 * @returns {Promise<NextResponse>} Data player lengkap (JSON) atau pesan error.
 */
export async function GET(
  request: Request,
  { params }: { params: { playerTag: string } }
) {
  const { playerTag } = params;

  // 1. Validasi input
  if (!playerTag || !playerTag.startsWith('#')) {
    return NextResponse.json(
      { error: 'Player tag tidak valid. Harus diawali dengan #' },
      { status: 400 }
    );
  }

  try {
    // 2. Encode tag untuk API
    // Fungsi getPlayerData dari lib/coc-api.ts mengharapkan tag yang sudah di-encode
    const encodedPlayerTag = encodeURIComponent(playerTag);

    console.log(
      `[API /get-player] Mengambil data untuk tag: ${playerTag} (Encoded: ${encodedPlayerTag})`
    );

    // 3. Panggil service lib/coc-api
    const playerData = await getPlayerData(encodedPlayerTag);

    // 4. Kembalikan data lengkap
    return NextResponse.json(playerData);
  } catch (error) {
    // 5. Penanganan error dari lib/coc-api
    console.error(
      `[API /get-player] Gagal mengambil data untuk ${playerTag}:`,
      error
    );

    if (error instanceof Error) {
      if (error.message.startsWith('notFound')) {
        return NextResponse.json(
          { error: `Player dengan tag ${playerTag} tidak ditemukan.` },
          { status: 404 }
        );
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Akses ditolak oleh API COC. Cek IP Whitelist.' },
          { status: 403 }
        );
      }
    }

    // Error umum
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal pada server.' },
      { status: 500 }
    );
  }
}