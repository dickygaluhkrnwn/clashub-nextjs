import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
// PERBAIKAN: Import AdminRole dan getManagedClanDataAdmin
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans'; // <-- IMPORT BARU
import cocApi from '@/lib/coc-api';
// [PERBAIKAN] Impor ClanRole juga
import { CocClan, ClanRole } from '@/lib/types';
// [PERBAIKAN ERROR] Impor COLLECTIONS
import { COLLECTIONS } from '@/lib/firestore-collections';

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
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const userId = session.uid;

  const { clanId } = params;
  if (!clanId) {
    return new NextResponse('Bad Request: Clan ID is required', { status: 400 });
  }

  try {
    // 2. Verifikasi Peran Pengguna (Keamanan)
    // [PERBAIKAN BUG UTAMA] Menggunakan Enum ClanRole, bukan string hardcode
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    // PERBAIKAN: Cek otorisasi dulu
    if (!isAuthorized) {
      return new NextResponse('Forbidden: Insufficient privileges', {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan (SETELAH otorisasi)
    // PERBAIKAN: Memanggil getManagedClanDataAdmin secara eksplisit
    const clanDoc = await getManagedClanDataAdmin(clanId);

    if (!clanDoc || !clanDoc.exists()) {
      return new NextResponse('Managed clan not found', { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    // [PERBAIKAN] Menggunakan clanDoc.data()
    const managedClanData = clanDoc.data();
    if (!managedClanData) {
      // Tambahan pengecekan jika data() null/undefined
      return new NextResponse('Managed clan data empty', { status: 404 });
    }
    const clanTag = managedClanData.tag; // Menggunakan 'tag' dari 'ManagedClan', bukan 'clanTag'

    if (!clanTag) {
      return new NextResponse('Bad Request: Clan tag not configured', {
        status: 400,
      });
    }

    // 5. Panggil CoC API (Hanya getClan)
    const cocClanData: CocClan = await cocApi.getClanData(
      encodeURIComponent(clanTag)
    );

    if (!cocClanData) {
      return new NextResponse('Not Found: Clan data not found from CoC API', {
        status: 404,
      });
    }

    // 6. Pisahkan data info klan dan daftar anggota
    const { memberList, ...clanInfo } = cocClanData;

    // 7. Update Dokumen di Firestore
    // [PERBAIKAN] Menggunakan path 'clanApiCache.current' untuk data mentah API
    // dan root level untuk data terkelola (managed)
    const cacheDocRef = clanDoc.ref
      .collection(COLLECTIONS.CLAN_API_CACHE) // <-- ERROR SEBELUMNYA DI SINI
      .doc('current');

    // Update data mentah API di sub-koleksi
    await cacheDocRef.set(
      {
        lastUpdated: new Date(),
        members: memberList || [], // Pastikan 'members' ada
        // 'currentWar', 'currentRaid' akan diupdate oleh endpoint lain
      },
      { merge: true }
    );

    // Update data terkelola (ManagedClan) di dokumen root
    await clanDoc.ref.update({
      name: clanInfo.name,
      logoUrl: clanInfo.badgeUrls?.medium, // Simpan URL logo
      clanLevel: clanInfo.clanLevel,
      memberCount: clanInfo.memberCount,
      // 'lastSynced' akan di-cap oleh endpoint masing-masing
      // 'lastSyncedBasic': new Date(), // Kita bisa gunakan timestamp per sync
    });

    console.log(
      `Basic sync successful for clanId ${clanId} (Tag: ${clanTag}) by user ${userId}`
    );

    // 8. Kembalikan data yang baru disinkronkan
    return NextResponse.json({
      message: 'Clan basic info synced successfully.',
      data: {
        clanInfo: clanInfo,
        memberList: memberList || [],
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

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

