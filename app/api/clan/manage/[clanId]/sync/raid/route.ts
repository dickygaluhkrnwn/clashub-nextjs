import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api';
// [PERBAIKAN BUG] Impor 'ClanRole'
import {
  CocRaidSeasons,
  RaidArchive,
  CocRaidLog,
  ClanRole,
} from '@/lib/types'; // Impor tipe kita
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  FieldValue,
  Timestamp as AdminTimestamp,
} from 'firebase-admin/firestore';

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/raid
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
    const clanName = managedClanData.name;

    if (!clanTag) {
      return new NextResponse('Clan tag not configured for this managed clan', {
        status: 400,
      });
    }

    console.log(
      `[Sync Raid - Admin] Starting Raid sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API (getClanRaidSeasons)
    const raidSeasonsData: CocRaidSeasons = await cocApi.getClanRaidSeasons(
      encodeURIComponent(clanTag)
    );

    if (
      !raidSeasonsData ||
      !raidSeasonsData.items ||
      raidSeasonsData.items.length === 0
    ) {
      return NextResponse.json({
        message: `No raid seasons data found for ${clanName}.`,
        processedCount: 0,
      });
    }

    // 6. Proses dan Arsipkan Raid Seasons ke Firestore menggunakan Batch
    const batch = adminFirestore.batch();
    const archivesRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.RAID_ARCHIVES); // Menggunakan konstanta baru

    let processedCount = 0;

    for (const item of raidSeasonsData.items) {
      const raidItem = item as CocRaidLog;

      // Buat ID unik untuk dokumen arsip berdasarkan endTime
      const raidEndTime = new Date(raidItem.endTime);
      // Gunakan startTime jika endTime tidak valid (meskipun seharusnya selalu ada)
      const raidStartTime = new Date(raidItem.startTime);

      // Buat ID unik berdasarkan startTime (lebih konsisten untuk memulai raid)
      const docId = `${raidItem.startTime}_${clanTag.replace('#', '')}`;
      const docRef = archivesRef.doc(docId);

      // Siapkan data untuk disimpan (sesuai interface RaidArchive)
      // Kita perlu konversi string ISO date ke objek Date/Timestamp Firestore
      // [PERBAIKAN ERROR TYPESCRIPT] Ubah Omit agar hanya menghapus 'id'
      const archiveData: Omit<RaidArchive, 'id'> = {
        ...raidItem,
        clanTag: clanTag, // Tambahkan tag klan kita untuk query
        startTime: raidStartTime, // Biarkan sebagai objek Date
        endTime: raidEndTime, // Biarkan sebagai objek Date
        // 'id' akan di-assign oleh Firestore saat dibaca
        // 'raidId' akan kita set sama dengan docId untuk referensi
        raidId: docId,
      };

      batch.set(docRef, archiveData, { merge: true });
      processedCount++;
    }

    // 7. Commit batch
    await batch.commit();

    // 8. Update timestamp sinkronisasi di dokumen klan utama
    // [PERBAIKAN 3] Ganti 'clanDoc.ref.update' dengan path absolut
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    await clanDocRef.update({
      lastSyncedRaid: FieldValue.serverTimestamp(), // Buat field baru
    });

    console.log(
      `[Sync Raid - Admin] Successfully synced and archived ${processedCount} raid seasons for ${clanName}.`
    );

    // 9. Kembalikan respons sukses
    return NextResponse.json({
      message: `Raid seasons successfully synced for ${clanName}.`,
      processedCount: processedCount,
    });
  } catch (error) {
    console.error(
      `[Sync Raid - Admin] Error syncing raids for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        message: 'Failed to sync raid seasons',
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

