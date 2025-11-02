import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import {
  AdminRole,
  verifyUserClanRole,
} from "@/lib/firestore-admin/management";
import { getManagedClanDataAdmin } from "@/lib/firestore-admin/clans";
import cocApi from "@/lib/coc-api";
import { CocCurrentWar } from "@/lib/types"; // Tipe untuk data perang
import { adminFirestore } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore-collections";
import { FieldValue } from "firebase-admin/firestore";

/**
 * API route handler for POST /api/clan/manage/[clanId]/sync/war
 *
 * Sinkronisasi data Perang Klan (Current War / CWL) dari CoC API ke Firestore.
 * Hanya mengambil data perang saat ini.
 *
 * @param {Request} req Request object.
 * @param {{ params: { clanId: string } }} context Konteks route, berisi clanId.
 * @returns {NextResponse} Response JSON dengan data perang yang disinkronkan atau pesan error.
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
    const clanName = managedClanData.name; // Untuk logging

    if (!clanTag) {
      return new NextResponse("Clan tag not configured for this managed clan", {
        status: 400,
      });
    }

    console.log(
      `[Sync War - Admin] Starting war sync for ${clanName} (${clanTag})...`
    );

    // 5. Panggil CoC API (Hanya getClanCurrentWar)
    // Fungsi ini sudah menangani logika untuk mencari CWL jika war biasa tidak ditemukan.
    const warData: CocCurrentWar | null = await cocApi.getClanCurrentWar(
      encodeURIComponent(clanTag),
      clanTag // Kirim tag mentah juga untuk pencarian CWL internal
    );

    // 6. Update Dokumen di Firestore
    const clanApiCacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc("current");

    // Simpan data perang (atau null jika tidak sedang perang) ke cache
    await clanApiCacheRef.set(
      {
        currentWar: warData,
        lastUpdatedWar: FieldValue.serverTimestamp(),
      },
      { merge: true } // Gunakan merge agar tidak menimpa data 'members' atau 'currentRaid'
    );

    // Update timestamp sinkronisasi spesifik di dokumen klan utama
    await clanDoc.ref.update({
      lastSyncedWar: FieldValue.serverTimestamp(),
    });

    console.log(
      `[Sync War - Admin] Successfully synced war data for ${clanName}. War state: ${
        warData?.state || "notInWar"
      }`
    );

    // 8. Kembalikan data yang baru disinkronkan
    return NextResponse.json({
      message: `War data successfully synced for ${clanName}.`,
      status: warData?.state || "notInWar",
      data: warData,
    });
  } catch (error) {
    console.error(
      `[Sync War - Admin] Error syncing war data for clan ${clanId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new NextResponse(
      JSON.stringify({
        message: "Failed to sync war data",
        error: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
