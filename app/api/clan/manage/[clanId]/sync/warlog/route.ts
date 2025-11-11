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
  CocWarLog,
  CocWarLogEntry,
  WarArchive,
  ClanRole,
} from '@/lib/types'; // Import tipe log dan entri
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  FieldValue,
  Timestamp as AdminTimestamp,
} from 'firebase-admin/firestore';
// [FIX TIMESTAMP] Impor helper parsing tanggal kita
import { parseCocApiTimestamp } from '@/lib/server-utils';

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

    // 6. Proses dan Arsipkan War Log ke Firestore menggunakan Batch
    const batch = adminFirestore.batch();
    const archivesRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.WAR_ARCHIVES); // [PERBAIKAN] Menggunakan konstanta

    let processedCount = 0;

    for (const item of warLogData.items) {
      const warItem = item as CocWarLogEntry; // Tipe entri log perang

      // [FIX TIMESTAMP] Gunakan helper 'parseCocApiTimestamp'
      // Ganti 'new Date(warItem.endTime)' yang error
      const warEndTime = parseCocApiTimestamp(warItem.endTime);
      // [AKHIR FIX TIMESTAMP]

      // [PERBAIKAN BUG] Pastikan opponent.tag ada sebelum di-replace
      const opponentTag = warItem.opponent?.tag || 'unknown';
      // [FIX TIMESTAMP] Gunakan string asli untuk ID agar konsisten
      const docId = `${warItem.endTime}_${opponentTag.replace('#', '')}`;
      const docRef = archivesRef.doc(docId);

      // Siapkan data untuk disimpan
      // [PERBAIKAN] Tipe 'WarArchive' sekarang sudah benar (extends CocWarLogEntry)
      // Kita membuat objek yang sesuai dengan tipe WarArchive (Firestore version)
      const archiveData: Omit<WarArchive, 'id'> = {
        ...warItem,
        clanTag: clanTag, // Tambahkan tag klan kita untuk query
        // --- [PERBAIKAN ERROR TYPESCRIPT] ---
        // Tipe WarArchive mengharapkan 'Date', bukan 'AdminTimestamp'.
        // Firebase Admin SDK akan otomatis mengonversi 'Date' menjadi 'Timestamp' saat penulisan batch.
        warEndTime: warEndTime, // Gunakan objek Date yang sudah valid
        // Properti 'id' akan di-assign oleh Firestore
        // Properti 'hasDetails' akan default undefined (opsional)
      };

      // --- [MODIFIKASI FASE 4: MENGGABUNGKAN HASIL (MERGE)] ---
      // Kita "menghidupkan" kembali batch, tapi dengan logika cerdas.
      // Hanya perbarui/merge jika 'warItem.result' (dari warlog) ADA.
      // Ini akan menambahkan 'result' (win/lose/tie) ke arsip detail
      // yang sudah ada (dibuat oleh sync/war) tanpa menimpa detailnya.
      if (warItem.result) {
        // { merge: true } adalah kuncinya.
        // 1. Jika doc (detail) ada: merge (tambahkan) field 'result'.
        // 2. Jika doc (detail) tidak ada: buat doc (ringkasan) baru (fallback).
        batch.set(docRef, archiveData, { merge: true });
        processedCount++;
      } else {
        // Jika warlog itu sendiri tidak punya 'result' (misal: perang baru di log),
        // jangan lakukan apa-apa. Jangan cemari arsip dengan 'result: undefined'.
      }
      // --- [AKHIR MODIFIKASI FASE 4] ---
    }

    // 7. Commit batch
    // [MODIFIKASI FASE 4] "Hidupkan" kembali commit batch
    await batch.commit();

    // 8. Update timestamp sinkronisasi di dokumen klan utama
    // [PERBAIKAN 3] Ganti 'clanDoc.ref.update' dengan path absolut
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    // [MODIFIKASI PERBAIKAN] Kita tetap update 'lastSyncedWarLog'
    // agar sistem tahu kita sudah *memeriksa* log, meskipun kita tidak menyimpannya.
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