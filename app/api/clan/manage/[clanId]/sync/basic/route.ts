import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  AdminRole,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import cocApi from '@/lib/coc-api';
import { CocClan, ClanRole } from '@/lib/types';
import { COLLECTIONS } from '@/lib/firestore-collections';
// [PERBAIKAN] Impor adminFirestore untuk operasi update
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore'; // Impor FieldValue

/**
 * API route handler untuk POST /api/clan/manage/[clanId]/sync/basic
 * ... (deskripsi JSDoc tidak berubah) ...
 */
export async function POST(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  // 1. Autentikasi Pengguna
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
    // Pengecekan 'managedClanData' tidak perlu lagi karena sudah dicakup oleh '!clanDoc'

    const clanTag = managedClanData.tag; // Menggunakan 'tag' dari 'ManagedClan'

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
    // [PERBAIKAN 3] Ganti 'clanDoc.ref' dengan path absolut
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);

    const cacheDocRef = clanDocRef
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    // Update data mentah API di sub-koleksi
    await cacheDocRef.set(
      {
        lastUpdated: FieldValue.serverTimestamp(), // Gunakan timestamp server
        members: memberList || [], // Pastikan 'members' ada
      },
      { merge: true }
    );

    // Update data terkelola (ManagedClan) di dokumen root
    // [PERBAIKAN 4] Ganti 'clanDoc.ref.update'
    await clanDocRef.update({
      name: clanInfo.name,
      logoUrl: clanInfo.badgeUrls?.medium, // Simpan URL logo
      clanLevel: clanInfo.clanLevel,
      memberCount: clanInfo.memberCount,
      lastSyncedBasic: FieldValue.serverTimestamp(), // Gunakan timestamp server
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

