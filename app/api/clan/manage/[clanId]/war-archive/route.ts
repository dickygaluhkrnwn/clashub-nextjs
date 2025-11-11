// File: app/api/clan/manage/[clanId]/war-archive/route.ts
// Deskripsi: [BARU] API route handler untuk GET /api/clan/manage/[clanId]/war-archive
// Mengambil arsip data Perang Klasik (sudah lengkap) dari Firestore.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { verifyUserClanRole } from '@/lib/firestore-admin/management';
import { ClanRole } from '@/lib/types';
import { getWarArchivesByClanId } from '@/lib/firestore-admin/archives'; // Fungsi yang kita butuhkan
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

/**
 * @function GET
 * Mengambil daftar arsip Perang Klasik yang telah disimpan (dengan detail lengkap).
 * Hanya dapat diakses oleh Leader atau Co-Leader klan.
 */
export async function GET(
  req: Request, // Request tidak digunakan, tapi diperlukan oleh signature
  { params }: { params: { clanId: string } }
) {
  const { clanId } = params;

  if (!clanId) {
    return new NextResponse('Clan ID is required', { status: 400 });
  }

  try {
    // 1. Verifikasi Sesi Pengguna
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse('Unauthorized: No session found', {
        status: 401,
      });
    }
    const userId = user.uid;

    // 2. Verifikasi Peran Pengguna (Keamanan)
    // Hanya Leader dan Co-Leader yang dapat mengakses arsip
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!isAuthorized) {
      return new NextResponse('Forbidden: Insufficient privileges', {
        status: 403,
      });
    }

    // 3. Ambil Data Arsip Perang Klasik
    console.log(
      `[War Archive - Admin] Fetching classic war archives for clan ${clanId}...`
    );

    // Memanggil fungsi dari lib/firestore-admin/archives.ts
    const warArchives = await getWarArchivesByClanId(clanId);

    console.log(
      `[War Archive - Admin] Found ${warArchives.length} archived classic wars for clan ${clanId}.`
    );

    // 4. Kembalikan data
    // NextResponse.json() akan secara otomatis menangani serialisasi objek Date
    // di dalam 'warArchives' menjadi string ISO untuk frontend.
    return NextResponse.json(warArchives);
  } catch (error) {
    console.error(
      `[War Archive - Admin] Error fetching classic war archives for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        message: 'Failed to fetch classic war archives',
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}