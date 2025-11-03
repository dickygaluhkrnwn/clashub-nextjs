import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { ClanApiCache } from '@/lib/types'; // Tipe data yang akan dikembalikan

/**
 * @route GET /api/clan/manage/[clanId]/cache
 * @description Mengambil dokumen cache 'current' (clanApiCache) dari Firestore.
 * @access Terautentikasi (Anggota Klan)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  // [PERBAIKAN BUG] Pindahkan clanId ke scope atas agar bisa diakses di catch block
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
    // const { clanId } = params; // <-- Dipindahkan ke atas

    if (!clanId) {
      return NextResponse.json(
        { message: 'Clan ID diperlukan' },
        { status: 400 }
      );
    }

    // 2. Keamanan: Verifikasi bahwa pengguna adalah anggota klan ini
    // (Ini adalah keamanan standar untuk endpoint 'GET' data internal)
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
      .doc('current'); // Dokumen cache selalu 'current'

    const cacheSnap = await cacheRef.get();

    // 4. Handle jika cache belum ada (misal: klan baru)
    if (!cacheSnap.exists) {
      // Kembalikan null. SWR akan menangani ini sebagai data: null
      // Ini BUKAN error, ini adalah state yang valid.
      return NextResponse.json(null);
    }

    // 5. Kembalikan data cache
    const cacheData = docToDataAdmin<ClanApiCache>(cacheSnap);
    return NextResponse.json(cacheData);
  } catch (error) {
    console.error(
      `[GET /cache] Error fetching cache for clan ${clanId}:`, // <-- Sekarang 'clanId' bisa diakses
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil data cache: ${errorMessage}` },
      { status: 500 }
    );
  }
}

