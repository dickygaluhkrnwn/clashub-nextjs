import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { deleteClanPromotion } from '@/lib/firestore-admin/clans';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';

/**
 * @handler DELETE
 * @description [ROMBAK V2] Menghapus promosi spesifik.
 * Hanya bisa dilakukan oleh clan Leader atau Co-Leader.
 */
export async function DELETE(
  request: Request, // 'request' dibutuhkan oleh Next.js
  { params }: { params: { clanId: string; promotionId: string } },
) {
  const { clanId, promotionId } = params;

  // 1. Validasi Sesi Pengguna
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Validasi Kepemilikan Klan & Peran
  const profile = await getUserProfileAdmin(user.uid);
  if (!profile) {
    return new NextResponse(JSON.stringify({ message: 'User profile not found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isManager = profile.role === 'Leader' || profile.role === 'Co-Leader';

  // User harus manager DAN harus terdaftar di klan yang benar
  if (!isManager || profile.clanId !== clanId) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: You are not a manager of this clan' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3. Validasi promotionId
  if (!promotionId) {
    return new NextResponse(JSON.stringify({ message: 'Promotion ID missing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 4. Hapus data promosi dari Firestore
    await deleteClanPromotion(clanId, promotionId);

    return NextResponse.json(
      { message: 'Promotion deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[API /promotions DELETE] Error:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to delete promotion' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}