import { NextResponse } from 'next/server';
// [EDIT V3] Ganti impor ke fungsi baru
import { recordPromotionClick } from '@/lib/firestore-admin/clans';

/**
 * @handler POST
 * @description [ROMBAK V2] Mencatat klik pada sebuah promosi.
 * [EDIT V3] Sekarang juga mencatat TH Level.
 * Ini adalah endpoint publik, "fire-and-forget".
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clanId: string;
      promotionId: string;
      thLevel?: number | string; // [EDIT V3] Tambahkan thLevel (opsional)
    };

    // [EDIT V3] Ekstrak thLevel dari body
    const { clanId, promotionId, thLevel } = body;

    if (!clanId || !promotionId) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing clanId or promotionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // [EDIT V3] Panggil fungsi 'record' baru, teruskan thLevel.
    // Gunakan 'unknown' sebagai fallback jika thLevel tidak ada atau 0.
    // Kita tidak 'await' agar respons bisa dikirim cepat (fire-and-forget).
    recordPromotionClick(clanId, promotionId, thLevel || 'unknown');

    // 200 OK (atau 202 Accepted) sudah cukup.
    return NextResponse.json(
      { message: 'Click registered' },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[API /promotions/click POST] Error:`, error);
    // Jika body JSON-nya error, kirim 400
    return new NextResponse(
      JSON.stringify({ message: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
}