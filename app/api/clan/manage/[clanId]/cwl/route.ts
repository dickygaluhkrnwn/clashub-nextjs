import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
// [PERBAIKAN] Impor utilitas Firestore dan Tipe Arsip
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { CwlArchive, FirestoreDocument } from '@/lib/types';

/**
 * @route GET /api/clan/manage/[clanId]/cwl
 * @description REFAKTOR: Mengambil data RIWAYAT (Arsip) CWL dari Firestore.
 * @access Terautentikasi (Anggota Klan)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  const { clanId } = params;

  try {
    // 1. Autentikasi Pengguna (Tetap sama)
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

    // 2. Keamanan: Verifikasi bahwa pengguna adalah anggota klan ini (Tetap sama)
    const userProfile = await getUserProfileAdmin(uid);
    if (!userProfile || userProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // --- [PERBAIKAN LOGIKA UTAMA] ---
    // Mengembalikan logika untuk mengambil data arsip dari Firestore

    // 3. Logika Utama: Ambil 10 arsip CWL terbaru
    const db = admin.firestore();
    const archivesRef = db
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CWL_ARCHIVES); // Ambil dari koleksi arsip CWL

    // 4. Kita query berdasarkan 'season' (misal: "2025-10")
    const q = archivesRef.orderBy('season', 'desc').limit(10);

    const querySnapshot = await q.get();

    // 5. Handle jika arsip kosong
    if (querySnapshot.empty) {
      // Kembalikan array kosong. Ini adalah state valid.
      return NextResponse.json([]);
    }

    // 6. Kembalikan data (sudah dalam format CwlArchive[])
    const cwlArchives = querySnapshot.docs
      .map((doc) => docToDataAdmin<CwlArchive>(doc))
      .filter((doc): doc is FirestoreDocument<CwlArchive> => doc !== null);
      
    // Ini akan mengembalikan array [CwlArchive, CwlArchive, ...]
    // Termasuk data musim "2025-11" Anda
    return NextResponse.json(cwlArchives);
    
    // --- [AKHIR PERBAIKAN LOGIKA UTAMA] ---

  } catch (error) {
    console.error(
      `[GET /cwl] Error fetching cwl archive for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil riwayat CWL: ${errorMessage}` },
      { status: 500 }
    );
  }
}

