// File: app/api/coc/get-current-war/[clanTag]/route.ts
// Deskripsi: [BARU - FASE 6] API route (GET) publik untuk mengambil
// data perang (war) yang sedang aktif untuk clan tag tertentu.

import { NextResponse, NextRequest } from 'next/server';
import cocApi from '@/lib/coc-api'; // Impor default dari lib/coc-api.ts
import { CocCurrentWar } from '@/lib/types'; // Impor tipe

/**
 * @handler GET
 * @description Mengambil data perang aktif (reguler atau CWL) untuk clan tag.
 * Ini adalah endpoint publik yang dipanggil oleh client (MatchDetailClient.tsx)
 * untuk polling data live war.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clanTag: string } },
) {
  // params.clanTag akan otomatis di-decode oleh Next.js,
  // jadi kita akan menerima tag mentah (misal: "#2PYCLLVG")
  const rawClanTag = params.clanTag;

  // 1. Validasi dasar
  if (!rawClanTag || !rawClanTag.startsWith('#')) {
    return NextResponse.json(
      { error: 'Format Clan Tag tidak valid. Harus diawali dengan #' },
      { status: 400 },
    );
  }

  // 2. Siapkan tag untuk API
  const encodedClanTag = encodeURIComponent(rawClanTag);

  try {
    // 3. Panggil fungsi cocApi yang sudah ada
    // Fungsi ini sudah menangani logika (Reguler vs CWL) dan normalisasi data
    const warData: CocCurrentWar | null = await cocApi.getClanCurrentWar(
      encodedClanTag,
      rawClanTag,
    );

    if (warData) {
      // 4a. Sukses - Perang ditemukan
      // Kirim data mentah dari CoC API
      return NextResponse.json(warData);
    } else {
      // 4b. Sukses - Tidak ada perang
      // Kirim respons 200 OK tapi dengan data null
      return NextResponse.json(
        { war: null, message: 'Klan tidak sedang dalam perang aktif.' },
        { status: 200 },
      );
    }
  } catch (error: any) {
    console.error(
      `[GET /api/coc/get-current-war/${encodedClanTag}] Error:`,
      error,
    );

    // 5. Handle error dari fetchCocApi
    if (error.message.includes('notFound')) {
      return NextResponse.json(
        { error: `Klan ${rawClanTag} tidak ditemukan (404).` },
        { status: 404 },
      );
    }
    if (error.message.includes('Forbidden')) {
      // Ini bisa terjadi jika IP server tidak di-whitelist di CoC API
      return NextResponse.json(
        { error: `Akses CoC API ditolak (Forbidden): ${error.message}` },
        { status: 403 },
      );
    }

    // Error umum lainnya
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 },
    );
  }
}