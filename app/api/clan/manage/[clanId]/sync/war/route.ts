import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api';
// [PERBAIKAN BUG] Impor 'ClanRole'
// --- [MODIFIKASI LANGKAH 2] ---
// Menambahkan ClanApiCache untuk membaca state cache sebelumnya
import { CocCurrentWar, ClanRole, ClanApiCache } from '@/lib/types'; // Tipe untuk data perang
// --- [AKHIR MODIFIKASI] ---
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { FieldValue } from 'firebase-admin/firestore';
// --- [BARU: LANGKAH 2] Impor fungsi arsip dari Langkah 3 ---
import { archiveClassicWar } from '@/lib/firestore-admin/archives';

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/war
 * ... (deskripsi JSDoc tidak berubah) ...
 */
export async function POST(
  req: Request,
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
    // [PERBAIKAN BUG OTORISASI] Ganti string dengan Enum ClanRole
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!isAuthorized) {
      return new NextResponse('Forbidden: Insufficient privileges', {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan (SETELAH otorisasi)
    const clanDoc = await getManagedClanDataAdmin(clanId);

    // [PERBAIKAN 1] Ganti 'clanDoc.exists()'
    if (!clanDoc) {
      return new NextResponse('Managed clan not found', { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    // [PERBAIKAN 2] Ganti 'clanDoc.data()'
    const managedClanData = clanDoc; // clanDoc SEKARANG adalah datanya
    // [PERBAIKAN KONSISTENSI] Hapus cek 'managedClanData' yang redundan

    const clanTag = managedClanData.tag; // [PERBAIKAN BUG TIPE] Gunakan .tag
    const clanName = managedClanData.name; // Untuk logging

    if (!clanTag) {
      return new NextResponse('Clan tag not configured for this managed clan', {
        status: 400,
      });
    }

    console.log(
      `[Sync War - Admin] Starting war sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API (Hanya getClanCurrentWar)
    // Fungsi ini sudah menangani logika untuk mencari CWL jika war biasa tidak ditemukan.
    // [PERBAIKAN BUG 1] Data yang dikembalikan DIJAMIN sudah dinormalisasi (townhallLevel h kecil)
    const warData: CocCurrentWar | null = await cocApi.getClanCurrentWar(
      encodeURIComponent(clanTag),
      clanTag // Kirim tag mentah juga untuk pencarian CWL internal
    );

    // 6. Tentukan Ref Dokumen Cache di Firestore
    const clanApiCacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    // --- [MODIFIKASI: LOGIKA DETEKSI TRANSISI & ARSIP] ---
    // Ambil data cache SAAT INI (sebelum di-update) untuk perbandingan
    const cacheDoc = await clanApiCacheRef.get();
    const cacheData = cacheDoc.data() as ClanApiCache | undefined;
    const previousWar = cacheData?.currentWar;
    const previousWarState = previousWar?.state || 'notInWar';
    const newWarState = warData?.state || 'notInWar';

    try {
      // Cek transisi dari 'inWar'/'preparation' ke 'warEnded'
      if (
        (previousWarState === 'inWar' ||
          previousWarState === 'preparation') &&
        newWarState === 'warEnded'
      ) {
        console.log(
          `[Sync War - Admin] DETECTED: War transition to 'warEnded' for ${clanName}.`
        );

        // Pastikan warData tidak null dan ini perang klasik (TIDAK punya warTag)
        if (warData && !warData.warTag) {
          // Panggil fungsi arsip (Langkah 3)
          // Kita tidak 'await' ini agar tidak memblokir respons API
          // Data dari warData dijamin sudah bersih (Bug 1 diperbaiki)
          archiveClassicWar(clanId, clanTag, warData);
          console.log(
            `[Sync War - Admin] Archiving process triggered for classic war (End Time: ${warData.endTime}).`
          );
        } else if (warData && warData.warTag) {
          console.log(
            `[Sync War - Admin] War ended, but it's a CWL war. Skipping classic archive.`
          );
        }
      }
    } catch (archiveError) {
      console.error(
        `[Sync War - Admin] Error during war transition/archive check:`,
        archiveError
      );
      // Jangan hentikan proses utama, tetap lanjutkan update cache
    }
    // --- [AKHIR LOGIKA ARSIP] ---

    // 7. [PERBAIKAN BUG 4] Update Cache Firestore dengan Logika Cerdas
    if (warData) {
      // KASUS 1: API mengembalikan data perang (preparation, inWar, atau warEnded)
      // Selalu simpan data terbaru dari API.
      console.log(
        `[Sync War - Admin] Saving new war data (State: ${warData.state}) to cache.`
      );
      await clanApiCacheRef.set(
        {
          currentWar: warData, // warData dijamin sudah bersih
          lastUpdatedWar: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // KASUS 2: API mengembalikan null (notInWar)
      if (previousWar && previousWar.state === 'warEnded') {
        // JANGAN LAKUKAN APA-APA.
        // Biarkan data 'warEnded' sebelumnya tetap di cache (Tab Perang Aktif)
        // sampai perang 'preparation' baru menimpanya.
        console.log(
          `[Sync War - Admin] API is 'notInWar', but cache holds 'warEnded'. Persisting cache.`
        );
      } else {
        // KASUS 3: API 'notInWar' dan cache juga 'notInWar' (atau null).
        // Aman untuk menyimpan null.
        console.log(
          `[Sync War - Admin] API is 'notInWar' and cache is empty/not 'warEnded'. Clearing cache.`
        );
        await clanApiCacheRef.set(
          {
            currentWar: null, // Hapus data perang
            lastUpdatedWar: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
    // --- [AKHIR PERBAIKAN BUG 4] ---

    // 8. Update Timestamp di Dokumen Klan Utama
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    await clanDocRef.update({
      lastSyncedWar: FieldValue.serverTimestamp(),
    });

    console.log(
      `[Sync War - Admin] Successfully synced war data for ${clanName}. War state: ${
        warData?.state || 'notInWar'
      }`
    );

    // 9. Kembalikan data yang baru disinkronkan
    return NextResponse.json({
      message: `War data successfully synced for ${clanName}.`,
      status: warData?.state || 'notInWar',
      data: warData,
    });
  } catch (error) {
    console.error(
      `[Sync War - Admin] Error syncing war data for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        message: 'Failed to sync war data',
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}