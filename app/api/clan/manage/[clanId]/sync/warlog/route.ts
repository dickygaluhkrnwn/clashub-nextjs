import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api';
// --- [MODIFIKASI DUPLIKASI WAR] ---
// Hapus 'WarArchive' dan 'AdminTimestamp' (tidak diperlukan di sini)
// Hapus 'parseCocApiTimestamp' (logika parsing pindah ke 'mergeWarLogEntry')
import {
  CocWarLog,
  CocWarLogEntry,
  // WarArchive, // <-- Dihapus
  ClanRole,
} from '@/lib/types'; // Import tipe log dan entri
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  FieldValue,
  // Timestamp as AdminTimestamp, // <-- Dihapus
} from 'firebase-admin/firestore';
// [FIX TIMESTAMP] Hapus helper parsing, sudah ditangani di 'archives.ts'
// import { parseCocApiTimestamp } from '@/lib/server-utils';

// Impor fungsi merge baru kita dari Langkah 2
import { mergeWarLogEntry } from '@/lib/firestore-admin/archives';
// --- [AKHIR MODIFIKASI] ---

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/warlog
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
      `[Sync WarLog - Admin] Starting war log sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API (Hanya getClanWarLog)
    const warLogData: CocWarLog = await cocApi.getClanWarLog(
      encodeURIComponent(clanTag)
    );

    if (!warLogData || !warLogData.items || warLogData.items.length === 0) {
      return NextResponse.json({
        message: `No war log data found for ${clanName}.`,
        processedCount: 0,
      });
    }

    // --- [MODIFIKASI DUPLIKASI WAR: LANGKAH 3] ---
    // 6. Proses dan Arsipkan War Log menggunakan Logika MERGE
    // Hapus logika batch.set({ merge: true }) yang lama.
    // Ganti dengan memanggil fungsi 'mergeWarLogEntry'.
    // Fungsi ini berisi logika query fuzzy (+/- 15 detik)
    // dan akan MENG-UPDATE arsip detail ATAU MEMBUAT arsip ringkasan (fallback).

    let processedCount = 0;

    for (const item of warLogData.items) {
      const warItem = item as CocWarLogEntry;

      // --- [PERBAIKAN ERROR TS2367] ---
      // Ganti cek 'warItem.result !== 'unknown'' dengan cek eksplisit
      // untuk nilai yang kita inginkan. Ini menyelesaikan error TS2367
      // terlepas dari definisi tipe data (lama atau baru).
      const isValidResult =
        warItem.result === 'win' ||
        warItem.result === 'lose' ||
        warItem.result === 'tie';

      if (isValidResult) {
        // --- [AKHIR PERBAIKAN] ---
        // Panggil fungsi merge baru kita dari 'archives.ts'.
        // Kita 'await' setiap pemanggilan agar tidak membanjiri Firestore (lebih aman)
        await mergeWarLogEntry(clanId, clanTag, warItem);
        processedCount++;
      }
    }
    // --- [AKHIR MODIFIKASI DUPLIKASI WAR] ---

    // 7. Commit batch (DIHAPUS KARENA BATCH TIDAK DIGUNAKAN)

    // 8. Update timestamp sinkronisasi di dokumen klan utama
    // [PERBAIKAN 3] Ganti 'clanDoc.ref.update' dengan path absolut
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    // [MODIFIKASI PERBAIKAN] Kita tetap update 'lastSyncedWarLog'
    // agar sistem tahu kita sudah *memeriksa* log.
    await clanDocRef.update({
      lastSyncedWarLog: FieldValue.serverTimestamp(),
    });

    // [MODIFIKASI FASE 4] Ubah pesan log
    console.log(
      `[Sync WarLog - Admin] Successfully synced and merged ${processedCount} war log results for ${clanName}.`
    );

    // 9. Kembalikan respons sukses
    // [MODIFIKASI FASE 4] Ubah pesan response
    return NextResponse.json({
      message: `War log successfully synced and merged for ${clanName}.`,
      processedCount: processedCount, // <-- Kembalikan jumlah yang diproses
    });
  } catch (error) {
    console.error(
      `[Sync WarLog - Admin] Error syncing war log for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(
      JSON.stringify({
        message: 'Failed to sync war log',
        error: errorMessage,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}