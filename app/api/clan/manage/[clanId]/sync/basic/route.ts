// File: app/api/clan/manage/[clanId]/sync/basic/route.ts
// Deskripsi: API Route Modular untuk sinkronisasi BASIC INFO & MEMBERS clan.
// Update: Perbaikan tipe data berdasarkan lib/coc.types.ts (memberCount & removal capitalLeague)

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getRoleLogsByClanId,
  verifyUserClanRole,
} from '@/lib/firestore-admin/management';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { getUserProfileByPlayerTagAdmin } from '@/lib/firestore-admin/users';
import cocApi from '@/lib/coc-api';
import { CocClan, CocMember } from '@/lib/types'; // Mengimpor tipe yang sudah diverifikasi
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

// MEMASTIKAN ROUTE SELALU DINAMIS
export const dynamic = 'force-dynamic';

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
    // 2. Verifikasi Peran Pengguna
    const { isAuthorized } = await verifyUserClanRole(userId, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!isAuthorized) {
      return new NextResponse('Forbidden: Insufficient privileges', {
        status: 403,
      });
    }

    // 3. Ambil Dokumen Klan dari Firestore
    const clanDoc = await getManagedClanDataAdmin(clanId);
    if (!clanDoc) {
      return new NextResponse('Managed clan not found', { status: 404 });
    }

    // 4. Dapatkan Clan Tag
    const managedClanData = clanDoc;
    const clanTag = managedClanData.tag;

    if (!clanTag) {
      return new NextResponse('Bad Request: Clan tag not configured', {
        status: 400,
      });
    }

    console.log(`[Sync Basic] Starting sync for Clan: ${managedClanData.name} (${clanTag}) by User: ${userId}`);

    // 5. Panggil CoC API
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
    const currentMembers: CocMember[] = memberList || [];

    // --- [LOGIKA: Auto-Update Owner] ---
    let newOwnerUid: string | null = null;
    const leaderMember = currentMembers.find((m) => m.role === 'leader');

    if (leaderMember) {
      const leaderUser = await getUserProfileByPlayerTagAdmin(leaderMember.tag);
      if (leaderUser) {
        if (managedClanData.ownerUid !== leaderUser.id) {
          newOwnerUid = leaderUser.id;
          console.log(
            `[Sync Basic] DETECTED LEADER CHANGE! Old: ${managedClanData.ownerUid} -> New: ${newOwnerUid} (${leaderUser.inGameName})`
          );
        }
      }
    }

    // --- [LOGIKA: Partisipasi Member] ---
    console.log(`[Sync Basic] Fetching archives for participation stats...`);
    const [warArchives, cwlArchives, roleLogs] = await Promise.all([
      getWarArchivesByClanId(clanId),
      getCwlArchivesByClanId(clanId),
      getRoleLogsByClanId(clanId),
    ]);

    const enrichedMembers = getAggregatedParticipationData({
      currentMembers: currentMembers,
      warArchives: warArchives,
      cwlArchives: cwlArchives,
      roleLogs: roleLogs,
      clanTag: clanTag,
    });

    // 7. Update Dokumen di Firestore
    const clanDocRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);
    
    // A. Update Cache Data API
    const cacheDocRef = clanDocRef
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    await cacheDocRef.set(
      {
        lastUpdated: FieldValue.serverTimestamp(),
        members: enrichedMembers,
        rawClanInfo: clanInfo,
      },
      { merge: true }
    );

    // B. Update Info Utama Klan
    // PERBAIKAN: Sesuai lib/coc.types.ts
    // - Menggunakan clanInfo.memberCount (ada di interface)
    // - Menghapus capitalLeague karena TIDAK ada di interface CocClan
    
    const updateData: Record<string, any> = {
      name: clanInfo.name ?? null,
      logoUrl: clanInfo.badgeUrls?.medium ?? null,
      clanLevel: clanInfo.clanLevel ?? 0,
      memberCount: clanInfo.memberCount ?? 0, // CORRECT: Sesuai interface CocClan
      points: clanInfo.clanPoints ?? 0,
      versusPoints: clanInfo.clanVersusPoints ?? 0,
      description: clanInfo.description ?? '',
      isWarLogPublic: clanInfo.isWarLogPublic ?? false,
      warWinStreak: clanInfo.warWinStreak ?? 0,
      warWins: clanInfo.warWins ?? 0,
      warTies: clanInfo.warTies ?? 0,
      warLosses: clanInfo.warLosses ?? 0,
      warLeague: clanInfo.warLeague?.name ?? null,
      // capitalLeague dihapus karena tidak ada di definisi tipe CocClan saat ini
      lastSyncedBasic: FieldValue.serverTimestamp(),
    };

    if (newOwnerUid) {
      updateData.ownerUid = newOwnerUid;
    }

    await clanDocRef.update(updateData);

    console.log(
      `[Sync Basic] Success for clanId ${clanId}. Updated ${enrichedMembers.length} members.`
    );

    return NextResponse.json({
      success: true,
      message: newOwnerUid
        ? 'Sinkronisasi berhasil. Owner clan telah diperbarui otomatis.'
        : 'Sinkronisasi info dasar dan anggota berhasil.',
      data: {
        memberCount: enrichedMembers.length,
        ownerUpdated: !!newOwnerUid,
        syncedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error(
      `[Sync Basic] Error for clanId ${clanId} by user ${userId}:`,
      error
    );
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown Internal Server Error';
    const errorStatus = errorMessage.includes('Forbidden') ? 403 : 500;

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: errorStatus });
  }
}