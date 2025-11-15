import { NextResponse } from 'next/server';
import { incrementPromotionClick } from '@/lib/firestore-admin/clans';

/**
 * @handler POST
 * @description [ROMBAK V2] Mencatat klik pada sebuah promosi.
 * Ini adalah endpoint publik, "fire-and-forget".
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clanId: string;
      promotionId: string;
    };

    const { clanId, promotionId } = body;

    if (!clanId || !promotionId) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing clanId or promotionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Panggil fungsi increment.
    // Kita tidak 'await' agar respons bisa dikirim cepat (fire-and-forget).
    incrementPromotionClick(clanId, promotionId);

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