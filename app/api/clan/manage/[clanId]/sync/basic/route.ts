import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
// PERBAIKAN: Import AdminRole dan getManagedClanDataAdmin
import {
  AdminRole,
  verifyUserClanRole,
} from "@/lib/firestore-admin/management";
import { getManagedClanDataAdmin } from "@/lib/firestore-admin/clans"; // <-- IMPORT BARU
import cocApi from "@/lib/coc-api";
import { CocClan } from "@/lib/types";

/**
 * API route handler untuk POST /api/clan/manage/[clanId]/sync/basic
 *
 * Endpoint ini bertanggung jawab untuk melakukan sinkronisasi data dasar (basic)
 * sebuah klan (info klan dan daftar anggota) dari CoC API ke Firestore.
 *
 * Ini adalah endpoint granular pertama yang menggantikan endpoint sync-managed-clan
 * yang berat.
 *
 * @param {Request} request - Objek request Next.js
 * @param {object} params - Parameter rute dinamis
 * @param {string} params.clanId - ID dokumen klan di Firestore
 * @returns {NextResponse} Response JSON dengan data klan yang disinkronkan atau pesan error
 */
export async function POST(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  // 1. Autentikasi Pengguna
  // PERBAIKAN: Menggunakan getSessionUser (async) dan mengecek session.uid
  const session = await getSessionUser();
  if (!session || !session.uid) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.uid;

  const { clanId } = params;
  if (!clanId) {
    return new NextResponse("Bad Request: Clan ID is required", { status: 400 });
  }

  try {
    // 2. Verifikasi Peran Pengguna (Keamanan)
    // PERBAIKAN: Menggunakan string AdminRole yang benar ('Leader', 'Co-Leader')
    // dan hanya mengambil 'isAuthorized'
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      "Leader",
      "Co-Leader",
    ]);

    // PERBAIKAN: Cek otorisasi dulu
    if (!isAuthorized) {
      return new NextResponse("Forbidden: Insufficient privileges", {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan (SETELAH otorisasi)
    // PERBAIKAN: Memanggil getManagedClanDataAdmin secara eksplisit
    const clanDoc = await getManagedClanDataAdmin(clanId);

    if (!clanDoc || !clanDoc.exists()) {
      return new NextResponse("Managed clan not found", { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    const managedClanData = clanDoc.data();
    const clanTag = managedClanData.clanTag;

    if (!clanTag) {
      return new NextResponse("Bad Request: Clan tag not configured", {
        status: 400,
      });
    }

    // 5. Panggil CoC API (Hanya getClan)
    const cocClanData: CocClan = await cocApi.getClanData(
      encodeURIComponent(clanTag)
    );

    if (!cocClanData) {
      return new NextResponse("Not Found: Clan data not found from CoC API", {
        status: 404,
      });
    }

    // 6. Pisahkan data info klan dan daftar anggota
    const { memberList, ...clanInfo } = cocClanData;

    // 7. Update Dokumen di Firestore
    await clanDoc.ref.update({
      clanInfo: clanInfo,
      memberList: memberList,
      lastSyncedBasic: new Date().toISOString(), // Tambahkan timestamp sync spesifik
    });

    console.log(
      `Basic sync successful for clanId ${clanId} (Tag: ${clanTag}) by user ${userId}`
    );

    // 8. Kembalikan data yang baru disinkronkan
    return NextResponse.json({
      message: "Clan basic info synced successfully.",
      data: {
        clanInfo,
        memberList,
      },
    });
  } catch (error) {
    console.error(
      `Error during basic sync for clanId ${clanId} by user ${userId}:`,
      error
    );

    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

