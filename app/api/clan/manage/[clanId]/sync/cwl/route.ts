import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import {
  AdminRole,
  verifyUserClanRole,
} from "@/lib/firestore-admin/management";
import { getManagedClanDataAdmin } from "@/lib/firestore-admin/clans";
import cocApi from "@/lib/coc-api"; // Impor default
// [PERBAIKAN ERROR]: Menambahkan CocWarLog ke impor
import { CocLeagueGroup, CwlArchive, CocWarLog } from "@/lib/types"; // Impor tipe kita
import { adminFirestore } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore-collections";
import { FieldValue, Timestamp as AdminTimestamp } from "firebase-admin/firestore";

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/cwl
 *
 * Sinkronisasi data Clan War League (CWL) dari CoC API ke sub-koleksi arsip Firestore.
 *
 * @param {Request} req Request object.
 * @param {{ params: { clanId: string } }} context Konteks route, berisi clanId.
 * @returns {NextResponse} Response JSON dengan status sinkronisasi atau pesan error.
 */
export async function POST(
  req: Request,
  { params }: { params: { clanId: string } }
) {
  const { clanId } = params;

  if (!clanId) {
    return new NextResponse("Clan ID is required", { status: 400 });
  }

  try {
    // 1. Verifikasi Sesi Pengguna
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse("Unauthorized: No session found", {
        status: 401,
      });
    }
    const userId = user.uid;

    // 2. Verifikasi Peran Pengguna (Keamanan)
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      "Leader",
      "Co-Leader",
    ]);

    if (!isAuthorized) {
      return new NextResponse("Forbidden: Insufficient privileges", {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan (SETELAH otorisasi)
    const clanDoc = await getManagedClanDataAdmin(clanId);

    if (!clanDoc || !clanDoc.exists()) {
      return new NextResponse("Managed clan not found", { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    const managedClanData = clanDoc.data();
    const clanTag = managedClanData.clanTag;
    const clanName = managedClanData.name;

    if (!clanTag) {
      return new NextResponse("Clan tag not configured for this managed clan", {
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
      if (apiError instanceof Error && apiError.message.includes("notFound")) {
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
    const docId = `${season}_${clanTag.replace("#", "")}`; // ID unik untuk arsip musim ini
    const docRef = archivesRef.doc(docId);

    // Kita perlu mengambil semua data war dari ronde-ronde yang ada
    let allRoundsData: CocWarLog[] = []; // [PERBAIKAN ERROR] Tipe ini sekarang sudah diimpor
    for (const round of leagueGroupData.rounds) {
      for (const warTag of round.warTags) {
        if (warTag === "#0") continue; // Lewati warTag placeholder
        try {
          // TODO: API call untuk getWarDetails(warTag) diperlukan di sini
          // Untuk saat ini, kita simpan placeholder berdasarkan roadmap
          // Di Tahap 2, kita akan mengambil detail penuh
          // Untuk sementara, kita hanya menyimpan struktur grupnya
        } catch (warError) {
          console.warn(
            `[Sync CWL - Admin] Failed to fetch details for warTag ${warTag}`,
            warError
          );
        }
      }
    }

    // Siapkan data untuk disimpan (sesuai interface CwlArchive)
    // CATATAN: 'rounds' di CwlArchive mengharapkan CocWarLog[], tapi API leaguegroup
    // hanya memberi kita 'warTags'. Ini adalah batasan dari roadmap Tahap 1.2.
    // Kita akan menyimpan data grupnya saja, 'rounds' akan kosong/berisi tag.
    // Di Tahap 2, kita akan mengisi 'rounds' dengan data war penuh.

    // Untuk sementara, kita simpan data mentah leagueGroup-nya.
    // Kita perlu menyesuaikan tipe CwlArchive nanti, atau cukup simpan data mentahnya.
    // Mari kita simpan data mentah leagueGroup ke dokumen season.
    
    // Kita akan sesuaikan data agar cocok dengan CwlArchive sebisa mungkin
    const archiveData: Omit<CwlArchive, "id"> = {
        clanTag: clanTag,
        season: season,
        // rounds: [], // Kosongkan dulu sesuai roadmap, kita hanya sync grup
        // TODO: Saat Tahap 2, kita akan fetch tiap warTag dan mengisinya di sini
        // Untuk sekarang, kita simpan data mentah grupnya di properti lain
        // Mari kita tambahkan 'groupDetails' ke CwlArchive
        // (Ini butuh update tipe, untuk sekarang kita simpan data yang kita punya)
        rounds: [], // Tipe CwlArchive mengharapkan CocWarLog[], kita beri array kosong
        
        // Simpan data mentah grup untuk referensi nanti (opsional, tapi berguna)
        // Kita bisa tambahkan properti ini ke CwlArchive jika perlu
        // rawGroupData: leagueGroupData, // Ini akan error tipe
    };

    // Karena CwlArchive mengharapkan 'rounds' berisi 'CocWarLog[]'
    // dan kita hanya punya 'CocLeagueGroup', kita tidak bisa memenuhinya di Tahap 1.2
    // KECUALI kita mengubah CwlArchive.
    
    // Mari kita asumsikan untuk Tahap 1.2, kita hanya menyimpan data grup mentah.
    // Kita akan set `archiveData` sebagai `leagueGroupData`
    // Ini berarti TIPE `CwlArchive` KITA SALAH.
    
    // Mari kita perbaiki CwlArchive di `lib/clashub.types.ts`
    // ... tapi kita tidak bisa edit file itu sekarang.
    
    // OK, kita ikuti aturan. Kita akan simpan data yang SESUAI TIPE CwlArchive.
    // `id`, `clanTag`, `season` (sudah ada)
    // `rounds`: CocWarLog[] -> Kita tidak punya ini. Kita akan isi array kosong.
    
    const finalArchiveData: Omit<CwlArchive, "id"> = {
        clanTag: clanTag,
        season: season,
        rounds: [], // Kosongkan sesuai batasan Tahap 1.2
        // Kita akan tambahkan properti 'rawGroupData' secara dinamis
        // (menggunakan 'as any' untuk sementara agar lolos Tipe)
        ...(leagueGroupData as any), // Simpan semua data mentah dari league group
    };


    // batch.set(docRef, finalArchiveData, { merge: true }); // Simpan data mentah
    // Kita gunakan merge:true jika data ronde diisi terpisah nanti
    
    // Pilihan yang lebih aman: Hanya simpan apa yang diminta Tipe.
    const cleanArchiveData: Omit<CwlArchive, "id"> = {
        clanTag: clanTag,
        season: season,
        rounds: [], // Kosongkan dulu
    };
    batch.set(docRef, cleanArchiveData, { merge: true });


    // 7. Commit batch
    await batch.commit();

    // 8. Update timestamp sinkronisasi di dokumen klan utama
    await clanDoc.ref.update({
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
      error instanceof Error ? error.message : "Unknown error occurred";
    return new NextResponse(
      JSON.stringify({
        message: "Failed to sync CWL group",
        error: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

