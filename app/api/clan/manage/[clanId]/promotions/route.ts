import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getManagedClanDataAdmin,
  createClanPromotion, // [ROMBAK V2] Impor fungsi baru
  getClanPromotions, // [ROMBAK V2] Impor fungsi baru
} from '@/lib/firestore-admin/clans';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
import { Promotion } from '@/lib/clashub.types';
import { cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';

/**
 * @handler GET
 * @description [ROMBAK V2] Mengambil daftar promosi yang ada untuk klan ini.
 * Hanya bisa dilakukan oleh clan Leader atau Co-Leader.
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } },
) {
  const { clanId } = params;

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
  if (!isManager || profile.clanId !== clanId) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: You are not a manager of this clan' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3. Ambil data promosi
  try {
    const promotions = await getClanPromotions(clanId);
    return NextResponse.json(promotions, { status: 200 });
  } catch (error) {
    console.error(`[API /promotions GET] Error:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to fetch promotions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/**
 * @handler POST
 * @description [ROMBAK V2] Membuat promosi baru untuk klan.
 * Hanya bisa dilakukan oleh clan Leader atau Co-Leader.
 */
export async function POST(
  request: Request,
  { params }: { params: { clanId: string } },
) {
  const { clanId } = params;

  // 1. Validasi Sesi Pengguna
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Validasi Kepemilikan Klan & Peran
  const clan = await getManagedClanDataAdmin(clanId);
  if (!clan) {
    return new NextResponse(
      JSON.stringify({ message: 'Managed clan not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const profile = await getUserProfileAdmin(user.uid);
  if (!profile) {
    return new NextResponse(JSON.stringify({ message: 'User profile not found' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isManager = profile.role === 'Leader' || profile.role === 'Co-Leader';

  if (!isManager || profile.clanId !== clanId) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: You are not a manager of this clan' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3. Ambil data promosi dari body
  // Tipe Omit karena 'id', 'clanId', 'clicks' akan di-set di server
  // 'totalClicks' dan 'clicksByTH' juga di-set default di server
  const body = (await request.json()) as Omit<
    Promotion,
    'id' | 'clanId' | 'clicks' | 'totalClicks' | 'clicksByTH'
  >;

  // Validasi input
  if (!body.imageUrl || !body.title || !body.description) {
    return new NextResponse(
      JSON.stringify({ message: 'Missing required fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    // 4. Siapkan data dan buat di Firestore
    // PERBAIKAN: Menambahkan totalClicks dan clicksByTH dengan nilai default
    const promotionData: Omit<Promotion, 'id' | 'clanId' | 'clicks'> = {
      imageUrl: body.imageUrl,
      title: body.title,
      description: body.description,
      totalClicks: 0,    // Default: 0 klik
      clicksByTH: {},    // Default: map kosong
    };

    const newPromotionId = await createClanPromotion(
      clanId,
      cleanDataForAdminSDK(promotionData) as Omit<
        Promotion,
        'id' | 'clanId' | 'clicks'
      >,
    );

    return NextResponse.json(
      { message: 'Promotion created successfully', promotionId: newPromotionId },
      { status: 201 }, // 201 Created
    );
  } catch (error) {
    console.error(`[API /promotions POST] Error:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to create promotion' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}