import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getRoleLogsByClanId,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { getUserProfileByPlayerTagAdmin } from '@/lib/firestore-admin/users'; // <-- [BARU] Import fungsi ini
import cocApi from '@/lib/coc-api';
import { CocClan } from '@/lib/types';
import { ClanRole } from '@/lib/enums';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Impor untuk Logika Partisipasi
import {
  getWarArchivesByClanId,
  getCwlArchivesByClanId,
} from '@/lib/firestore-admin/archives';
import { getAggregatedParticipationData } from '@/app/api/coc/sync-managed-clan/logic/participationAggregator';

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

    // 3. Ambil Dokumen Klan
    const clanDoc = await getManagedClanDataAdmin(clanId);
    if (!clanDoc) {
      return new NextResponse('Managed clan not found', { status: 404 });
    }

    // 4. Dapatkan Clan Tag dari Firestore
    const managedClanData = clanDoc;
    const clanTag = managedClanData.tag; // <-- Kita butuh ini

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
    const currentMembers = memberList || [];

    // --- [LOGIKA BARU] 6.a: Auto-Update Owner berdasarkan Leader CoC ---
    let newOwnerUid: string | null = null;
    // CoC API mengembalikan role 'leader' untuk pemimpin klan
    const leaderMember = currentMembers.find((m) => m.role === 'leader');

    if (leaderMember) {
      console.log(
        `[Sync ${clanTag}] Leader di Game terdeteksi: ${leaderMember.name} (${leaderMember.tag})`
      );

      // Cari apakah ada User di website yang terhubung dengan Tag Leader ini
      const leaderUser = await getUserProfileByPlayerTagAdmin(leaderMember.tag);

      if (leaderUser) {
        // Jika user ditemukan, cek apakah dia sudah menjadi owner
        // leaderUser.id adalah UID dari dokumen UserProfile
        if (managedClanData.ownerUid !== leaderUser.id) {
          newOwnerUid = leaderUser.id;
          console.log(
            `[Sync ${clanTag}] DETEKSI PERGANTIAN LEADER! Owner Lama: ${managedClanData.ownerUid} -> Owner Baru: ${newOwnerUid} (${leaderUser.inGameName})`
          );
        } else {
          console.log(
            `[Sync ${clanTag}] Owner UID valid. Tidak ada perubahan.`
          );
        }
      } else {
        console.log(
          `[Sync ${clanTag}] Peringatan: Leader game (${leaderMember.name}) belum terdaftar/terverifikasi di website. Owner tidak diubah.`
        );
      }
    } else {
      console.warn(
        `[Sync ${clanTag}] Aneh: Tidak ditemukan member dengan role 'leader' di data API CoC.`
      );
    }
    // --- [AKHIR LOGIKA BARU] ---

    // --- LANGKAH 6.5: AMBIL DATA UNTUK PARTISIPASI ---
    console.log(
      `[Sync ${clanTag}] Mengambil data arsip untuk kalkulasi partisipasi...`
    );
    const [warArchives, cwlArchives, roleLogs] = await Promise.all([
      getWarArchivesByClanId(clanId),
      getCwlArchivesByClanId(clanId),
      getRoleLogsByClanId(clanId),
    ]);
    console.log(
      `[Sync ${clanTag}] Ditemukan ${warArchives.length} arsip war, ${cwlArchives.length} musim CWL, dan ${roleLogs.length} log role.`
    );

    // --- LANGKAH 6.6: PANGGIL AGGREGATOR ---
    const enrichedMembers = getAggregatedParticipationData({
      currentMembers: currentMembers,
      warArchives: warArchives,
      cwlArchives: cwlArchives,
      roleLogs: roleLogs,
      clanTag: clanTag, // <-- [PERBAIKAN UTAMA] Kirimkan clanTag ke aggregator
    });

    // 7. Update Dokumen di Firestore
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);
    const cacheDocRef = clanDocRef
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    await cacheDocRef.set(
      {
        lastUpdated: FieldValue.serverTimestamp(),
        members: enrichedMembers,
      },
      { merge: true }
    );

    // Siapkan data update untuk dokumen utama Clan
    // Kita gunakan Record<string, any> agar bisa menambahkan field dinamis
    const updateData: Record<string, any> = {
      name: clanInfo.name ?? null,
      logoUrl: clanInfo.badgeUrls?.medium ?? null,
      clanLevel: clanInfo.clanLevel ?? 0,
      memberCount: clanInfo.memberCount ?? 0,
      lastSyncedBasic: FieldValue.serverTimestamp(),
    };

    // [LOGIKA BARU] Tambahkan ownerUid ke updateData jika ada owner baru
    if (newOwnerUid) {
      updateData.ownerUid = newOwnerUid;
    }

    await clanDocRef.update(updateData);

    console.log(
      `Basic sync successful for clanId ${clanId} (Tag: ${clanTag}) by user ${userId}. Participation data recalculated.`
    );

    // 8. Kembalikan data yang baru disinkronkan
    return NextResponse.json({
      message: newOwnerUid 
        ? 'Sinkronisasi berhasil. Data kepemilikan clan (Owner) telah diperbarui otomatis.'
        : 'Sinkronisasi info clan dan partisipasi berhasil.',
      data: {
        clanInfo: clanInfo,
        memberList: enrichedMembers,
        ownerUpdated: !!newOwnerUid, // Flag untuk memberitahu client
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