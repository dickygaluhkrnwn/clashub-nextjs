import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
// [PERBAIKAN ERROR 3] Impor tipe gabungan baru dan tipe ManagedClan
import {
  ClanApiCache,
  ManagedClan,
  ManagedClanDataPayload,
  FirestoreDocument,
} from '@/lib/types'; // Tipe data yang akan dikembalikan

/**
 * @route GET /api/clan/manage/[clanId]/cache
 * @description Mengambil dokumen cache 'current' (clanApiCache) DAN data induk 'ManagedClan'.
 * @access Terautentikasi (Anggota Klan)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } },
) {
  const { clanId } = params;

  try {
    // 1. Autentikasi Pengguna
    const sessionUser = await getSessionUser();
    if (!sessionUser?.uid) {
      return NextResponse.json(
        { message: 'Tidak terautentikasi' },
        { status: 401 },
      );
    }
    const uid = sessionUser.uid;

    if (!clanId) {
      return NextResponse.json(
        { message: 'Clan ID diperlukan' },
        { status: 400 },
      );
    }

    // 2. Keamanan: Verifikasi bahwa pengguna adalah anggota klan ini
    const userProfile = await getUserProfileAdmin(uid);
    if (!userProfile || userProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan anggota klan ini.' },
        { status: 403 },
      );
    }

    // 3. Logika Utama: Ambil data Induk (ManagedClan) dan Cache (ClanApiCache)
    const db = admin.firestore();

    // Ambil Dokumen Induk (ManagedClan)
    const clanRef = db.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId);
    const clanSnap = await clanRef.get();

    if (!clanSnap.exists) {
      return NextResponse.json(
        { message: 'Data klan terkelola tidak ditemukan.' },
        { status: 404 },
      );
    }
    // Kita perlu 'as' karena docToDataAdmin mengembalikan T | null, tapi kita sudah cek exists()
    const clanData = docToDataAdmin<ManagedClan>(
      clanSnap,
    ) as FirestoreDocument<ManagedClan>;

    // Ambil Dokumen Cache (Sub-koleksi)
    const cacheRef = clanRef
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current'); // Dokumen cache selalu 'current'

    const cacheSnap = await cacheRef.get();

    // 4. Handle jika cache belum ada (misal: klan baru)
    const cacheData = cacheSnap.exists
      ? docToDataAdmin<ClanApiCache>(cacheSnap)
      : null;

    // 5. Gabungkan dan Kembalikan data
    const payload: ManagedClanDataPayload = {
      clan: clanData,
      cache: cacheData,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      `[GET /cache] Error fetching cache for clan ${clanId}:`,
      error,
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil data cache: ${errorMessage}` },
      { status: 500 },
    );
  }
}