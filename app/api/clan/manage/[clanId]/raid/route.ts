import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import {
  ClanApiCache,
  RaidArchive,
  CocRaidLog,
  FirestoreDocument,
  ManagedClanRaidData, // Tipe data yang akan dikembalikan
} from '@/lib/types';

/**
 * @route GET /api/clan/manage/[clanId]/raid
 * @description Mengambil data Raid Capital (current dan arsip) dari Firestore.
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

    // 3. Logika Utama: Ambil data cache dan arsip secara paralel
    const db = admin.firestore();

    // Promise 1: Ambil data 'currentRaid' dari clanApiCache/current
    const cacheRef = db
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');
    const cacheSnapPromise = cacheRef.get();

    // Promise 2: Ambil 10 arsip raid terbaru
    const archivesRef = db
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.RAID_ARCHIVES);
    const archivesQuery = archivesRef.orderBy('startTime', 'desc').limit(10);
    const archivesSnapPromise = archivesQuery.get();

    // Jalankan kedua promise
    const [cacheSnap, archivesSnap] = await Promise.all([
      cacheSnapPromise,
      archivesSnapPromise,
    ]);

    // 4. Proses data currentRaid
    const cacheData = docToDataAdmin<ClanApiCache>(cacheSnap);
    const currentRaid: CocRaidLog | null = cacheData?.currentRaid || null;

    // 5. Proses data raidArchives
    let raidArchives: FirestoreDocument<RaidArchive>[] = [];
    if (!archivesSnap.empty) {
      raidArchives = archivesSnap.docs
        .map((doc) => docToDataAdmin<RaidArchive>(doc))
        .filter((doc): doc is FirestoreDocument<RaidArchive> => doc !== null);
    }

    // 6. Gabungkan data sesuai tipe ManagedClanRaidData
    const responseData: ManagedClanRaidData = {
      currentRaid: currentRaid,
      raidArchives: raidArchives,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(
      `[GET /raid] Error fetching raid data for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil data raid: ${errorMessage}` },
      { status: 500 }
    );
  }
}
