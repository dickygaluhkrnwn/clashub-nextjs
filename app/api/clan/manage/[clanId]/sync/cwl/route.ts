import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api'; // Impor default
// [PERBAIKAN BUG] Menambahkan 'ClanRole' ke impor
import {
  CocLeagueGroup,
  CwlArchive,
  CocWarLog,
  ClanRole,
} from '@/lib/types'; // Impor tipe kita
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  FieldValue,
  Timestamp as AdminTimestamp,
} from 'firebase-admin/firestore';

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/cwl
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
    // [PERBAIKAN BUG UTAMA] Ganti string dengan Enum ClanRole
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

    const clanTag = managedClanData.tag; // Gunakan .tag (sesuai Tipe ManagedClan)
    const clanName = managedClanData.name;

    if (!clanTag) {
      return new NextResponse('Clan tag not configured for this managed clan', {
        status: 400,
      });
    }

    console.log(
      `[Sync CWL - Admin] Starting CWL sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API (getClanLeagueGroup)
    let leagueGroupData: CocLeagueGroup;
    try {
      leagueGroupData = await cocApi.getClanLeagueGroup(
        encodeURIComponent(clanTag)
      );
    } catch (apiError) {
      if (apiError instanceof Error && apiError.message.includes('notFound')) {
        return NextResponse.json({
          message: `No active CWL group found for ${clanName}.`,
        });
      }
      throw apiError; // Lemparkan error lain agar ditangkap oleh catch utama
    }

    if (!leagueGroupData || !leagueGroupData.season) {
      return NextResponse.json({
        message: `No CWL data found for ${clanName}.`,
      });
    }

    // 6. Proses dan Arsipkan CWL Group ke Firestore
    const batch = adminFirestore.batch();
    const archivesRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CWL_ARCHIVES); // Menggunakan konstanta baru

    const season = leagueGroupData.season; // Misal: "2025-11"
    const docId = `${season}_${clanTag.replace('#', '')}`; // ID unik untuk arsip musim ini
    const docRef = archivesRef.doc(docId);

    // ... (Logika loop 'allRoundsData' tidak berubah, masih TODO) ...
    let allRoundsData: CocWarLog[] = [];
    for (const round of leagueGroupData.rounds) {
      for (const warTag of round.warTags) {
        if (warTag === '#0') continue;
        try {
          // TODO: API call untuk getWarDetails(warTag) diperlukan di sini
        } catch (warError) {
          console.warn(
            `[Sync CWL - Admin] Failed to fetch details for warTag ${warTag}`,
            warError
          );
        }
      }
    }

    // ... (Logika 'archiveData' tidak berubah) ...
    const cleanArchiveData: Omit<CwlArchive, 'id'> = {
      clanTag: clanTag,
      season: season,
      rounds: [], // Kosongkan dulu
    };
    batch.set(docRef, cleanArchiveData, { merge: true });

    // 7. Commit batch
    await batch.commit();

    // 8. Update timestamp sinkronisasi di dokumen klan utama
    // [PERBAIKAN 3] Ganti 'clanDoc.ref.update' dengan path absolut
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    await clanDocRef.update({
      lastSyncedCwl: FieldValue.serverTimestamp(), // Buat field baru
    });

    console.log(
      `[Sync CWL - Admin] Successfully synced CWL group for season ${season} for ${clanName}.`
    );

    // 9. Kembalikan respons sukses
    return NextResponse.json({
      message: `CWL group for season ${season} successfully synced for ${clanName}.`,
      season: season,
    });
  } catch (error) {
    console.error(
      `[Sync CWL - Admin] Error syncing CWL for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        message: 'Failed to sync CWL group',
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

