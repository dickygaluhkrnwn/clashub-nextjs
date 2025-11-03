import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { ClanApiCache, CocCurrentWar } from '@/lib/types'; // Tipe data

/**
 * @route GET /api/clan/manage/[clanId]/war
 * @description Mengambil data 'currentWar' dari dokumen cache 'current'.
 * @access Terautentikasi (Anggota Klan)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  // Pindahkan clanId ke scope atas agar bisa diakses di catch block
  const { clanId } = params;

  try {
    // 1. Autentikasi Pengguna
    const sessionUser = await getSessionUser();
    if (!sessionUser?.uid) {
      return NextResponse.json(
        { message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const uid = sessionUser.uid;

    if (!clanId) {
      return NextResponse.json(
        { message: 'Clan ID diperlukan' },
        { status: 400 }
      );
    }

    // 2. Keamanan: Verifikasi bahwa pengguna adalah anggota klan ini
    const userProfile = await getUserProfileAdmin(uid);
    if (!userProfile || userProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // 3. Logika Utama: Ambil dokumen cache 'current'
    const db = admin.firestore();
    const cacheRef = db
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    const cacheSnap = await cacheRef.get();

    // 4. Handle jika cache belum ada
    if (!cacheSnap.exists) {
      // Kembalikan null. SWR akan menangani ini sebagai data: null
      return NextResponse.json(null);
    }

    // 5. Kembalikan hanya data currentWar dari cache
    const cacheData = docToDataAdmin<ClanApiCache>(cacheSnap);
    
    // Kirim 'null' jika 'currentWar' tidak ada di dalam cache
    const currentWarData = cacheData?.currentWar || null;
    
    return NextResponse.json(currentWarData);

  } catch (error) {
    console.error(
      `[GET /war] Error fetching current war cache for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      // [PERBAIKAN] Kirim JSON error agar 'fetcher' bisa membacanya
      { message: `Gagal mengambil data war: ${errorMessage}` },
      { status: 500 }
    );
  }
}
