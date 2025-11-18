import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api';
import { CocCurrentWar, ClanRole, ClanApiCache } from '@/lib/types';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { FieldValue } from 'firebase-admin/firestore';
import { archiveClassicWar } from '@/lib/firestore-admin/archives';

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/war
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
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!isAuthorized) {
      return new NextResponse('Forbidden: Insufficient privileges', {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan
    const clanDoc = await getManagedClanDataAdmin(clanId);

    if (!clanDoc) {
      return new NextResponse('Managed clan not found', { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    const managedClanData = clanDoc;
    const clanTag = managedClanData.tag;
    const clanName = managedClanData.name;

    if (!clanTag) {
      return new NextResponse('Clan tag not configured for this managed clan', {
        status: 400,
      });
    }

    console.log(
      `[Sync War - Admin] Starting war sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API
    const warData: CocCurrentWar | null = await cocApi.getClanCurrentWar(
      encodeURIComponent(clanTag),
      clanTag
    );

    // 6. Tentukan Ref Dokumen Cache di Firestore
    const clanApiCacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    // Ambil data cache SAAT INI
    const cacheDoc = await clanApiCacheRef.get();
    const cacheData = cacheDoc.data() as ClanApiCache | undefined;
    const previousWar = cacheData?.currentWar;
    const previousWarState = previousWar?.state || 'notInWar';
    const newWarState = warData?.state || 'notInWar';

    try {
      // --- LOGIKA ARSIP ---
      if (newWarState === 'warEnded') {
        if (
          previousWarState === 'inWar' ||
          previousWarState === 'preparation'
        ) {
          console.log(
            `[Sync War - Admin] DETECTED: War transition to 'warEnded' for ${clanName}.`
          );
        } else {
          console.log(
            `[Sync War - Admin] DETECTED: War state is 'warEnded' for ${clanName}. Checking archive...`
          );
        }

        // Pastikan warData tidak null dan ini perang klasik (TIDAK punya warTag)
        if (warData && !warData.warTag) {
          // [PERBAIKAN UTAMA UNTUK VERCEL]
          // Kita WAJIB menggunakan 'await' di sini.
          // Di Vercel Serverless, background process akan mati jika respons sudah dikirim.
          console.log(`[Sync War - Admin] Archiving classic war...`);
          await archiveClassicWar(clanId, clanTag, warData);
          
          console.log(
            `[Sync War - Admin] Archiving process completed for classic war.`
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

    // 7. Update Cache Firestore
    if (warData) {
      console.log(
        `[Sync War - Admin] Saving new war data (State: ${warData.state}) to cache.`
      );
      await clanApiCacheRef.set(
        {
          currentWar: warData,
          lastUpdatedWar: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // Logika untuk mempertahankan 'warEnded' di tampilan jika API tiba-tiba null
      if (previousWar && previousWar.state === 'warEnded') {
        console.log(
          `[Sync War - Admin] API is 'notInWar', but cache holds 'warEnded'. Persisting cache.`
        );
      } else {
        console.log(
          `[Sync War - Admin] API is 'notInWar' and cache is empty/not 'warEnded'. Clearing cache.`
        );
        await clanApiCacheRef.set(
          {
            currentWar: null,
            lastUpdatedWar: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

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