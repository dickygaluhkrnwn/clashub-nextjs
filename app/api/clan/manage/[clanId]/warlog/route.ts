import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import {
  WarArchive,
  WarSummary,
  WarResult,
  FirestoreDocument,
} from '@/lib/types'; // Tipe data

/**
 * @route GET /api/clan/manage/[clanId]/warlog
 * @description Mengambil data arsip riwayat perang (WarSummary) dari Firestore.
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

    // 3. Logika Utama: Ambil 20 arsip perang terbaru
    const db = admin.firestore();
    const archivesRef = db
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.WAR_ARCHIVES); // Ambil dari koleksi arsip

    // Kita query berdasarkan 'warEndTime' (yang kita simpan sebagai Date)
    const q = archivesRef.orderBy('warEndTime', 'desc').limit(20);

    const querySnapshot = await q.get();

    // 4. Handle jika arsip kosong
    if (querySnapshot.empty) {
      // Kembalikan array kosong. Ini adalah state valid.
      return NextResponse.json([]);
    }

    // 5. Kembalikan data yang sudah di-map ke tipe WarSummary
    const warSummaries: WarSummary[] = querySnapshot.docs
      .map((doc) => docToDataAdmin<WarArchive>(doc))
      .filter((doc): doc is FirestoreDocument<WarArchive> => doc !== null)
      .map((archiveDoc) => {
        // Map data dari WarArchive (CocWarLogEntry) ke WarSummary
        return {
          id: archiveDoc.id,
          opponentName: archiveDoc.opponent?.name || 'Lawan Tidak Dikenali',
          // [PERBAIKAN BUG TS2322] Berikan nilai default jika undefined
          teamSize: archiveDoc.teamSize || 0,
          // Pastikan result 'win', 'lose', 'tie', atau 'unknown'
          result:
            (archiveDoc.result as WarResult) || ('unknown' as WarResult),
          ourStars: archiveDoc.clan?.stars || 0,
          opponentStars: archiveDoc.opponent?.stars || 0,
          ourDestruction: archiveDoc.clan?.destructionPercentage || 0,
          opponentDestruction: archiveDoc.opponent?.destructionPercentage || 0,
          // 'warEndTime' adalah Date, 'endTime' adalah string ISO
          endTime: archiveDoc.warEndTime, // Gunakan Date object
          hasDetails: archiveDoc.hasDetails || false,
        };
      });

    return NextResponse.json(warSummaries);
  } catch (error) {
    console.error(
      `[GET /warlog] Error fetching war log archive for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil riwayat perang: ${errorMessage}` },
      { status: 500 }
    );
  }
}

