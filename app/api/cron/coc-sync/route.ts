// File: app/api/cron/coc-sync/route.ts
// Deskripsi: Cron Job untuk sinkronisasi data klan secara otomatis dan bergilir.
// Mengambil klan yang paling lama tidak disinkronkan dan menjalankan update penuh.

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import cocApi from '@/lib/coc-api';
import { FieldValue } from 'firebase-admin/firestore';
import { CocMember, CocWarLogEntry } from '@/lib/types';

// Impor fungsi logika bisnis dari lib (menggunakan kembali logika yang sama dengan API manual)
import { getAggregatedParticipationData } from '@/app/api/coc/sync-managed-clan/logic/participationAggregator';
import {
  getWarArchivesByClanId,
  getCwlArchivesByClanId,
  mergeWarLogEntry,
  archiveClassicWar,
} from '@/lib/firestore-admin/archives';
import { getRoleLogsByClanId } from '@/lib/firestore-admin/management';
import { getUserProfileByPlayerTagAdmin } from '@/lib/firestore-admin/users';

// Memastikan route ini dinamis dan tidak di-cache
export const dynamic = 'force-dynamic';

// Konfigurasi
const BATCH_SIZE = 3; // Jumlah klan yang diproses per eksekusi (agar tidak timeout)

/**
 * Helper untuk menjalankan "Basic Sync" (Info Clan & Member + Partisipasi)
 */
async function syncBasicInfo(clanId: string, clanTag: string, managedClanData: any) {
  try {
    const cocClanData = await cocApi.getClanData(encodeURIComponent(clanTag));
    const { memberList, ...clanInfo } = cocClanData;
    const currentMembers: CocMember[] = memberList || [];

    // Auto-update Owner
    let newOwnerUid: string | null = null;
    const leaderMember = currentMembers.find((m) => m.role === 'leader');
    if (leaderMember) {
      const leaderUser = await getUserProfileByPlayerTagAdmin(leaderMember.tag);
      if (leaderUser && managedClanData.ownerUid !== leaderUser.id) {
        newOwnerUid = leaderUser.id;
      }
    }

    // Kalkulasi Partisipasi
    const [warArchives, cwlArchives, roleLogs] = await Promise.all([
      getWarArchivesByClanId(clanId),
      getCwlArchivesByClanId(clanId),
      getRoleLogsByClanId(clanId),
    ]);

    const enrichedMembers = getAggregatedParticipationData({
      currentMembers,
      warArchives,
      cwlArchives,
      roleLogs,
      clanTag,
    });

    // Simpan ke Firestore
    const clanDocRef = adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId);
    
    // 1. Cache
    await clanDocRef.collection(COLLECTIONS.CLAN_API_CACHE).doc('current').set({
      lastUpdated: FieldValue.serverTimestamp(),
      members: enrichedMembers,
      rawClanInfo: clanInfo,
    }, { merge: true });

    // 2. Info Utama
    const safeClanInfo = clanInfo as any;
    const updateData: Record<string, any> = {
      name: safeClanInfo.name ?? null,
      logoUrl: safeClanInfo.badgeUrls?.medium ?? null,
      clanLevel: safeClanInfo.clanLevel ?? 0,
      memberCount: safeClanInfo.memberCount ?? 0,
      points: safeClanInfo.clanPoints ?? 0,
      versusPoints: safeClanInfo.clanVersusPoints ?? 0,
      description: safeClanInfo.description ?? '',
      isWarLogPublic: safeClanInfo.isWarLogPublic ?? false,
      warWinStreak: safeClanInfo.warWinStreak ?? 0,
      warWins: safeClanInfo.warWins ?? 0,
      warTies: safeClanInfo.warTies ?? 0,
      warLosses: safeClanInfo.warLosses ?? 0,
      warLeague: safeClanInfo.warLeague?.name ?? null,
      lastSyncedBasic: FieldValue.serverTimestamp(),
    };

    if (newOwnerUid) updateData.ownerUid = newOwnerUid;
    await clanDocRef.update(updateData);

    return { success: true, memberCount: enrichedMembers.length };
  } catch (error) {
    console.error(`[Cron] Basic Sync Failed for ${clanTag}:`, error);
    return { success: false, error };
  }
}

/**
 * Helper untuk menjalankan "War Sync" (Current War & Auto Archive)
 */
async function syncCurrentWar(clanId: string, clanTag: string) {
  try {
    const warData = await cocApi.getClanCurrentWar(encodeURIComponent(clanTag), clanTag);
    const clanApiCacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.CLAN_API_CACHE)
      .doc('current');

    // Cek state lama untuk deteksi transisi warEnded
    const cacheDoc = await clanApiCacheRef.get();
    const previousWarState = cacheDoc.data()?.currentWar?.state || 'notInWar';
    const newWarState = warData?.state || 'notInWar';

    // Logika Arsip Otomatis
    if (newWarState === 'warEnded') {
      if (warData && !warData.warTag) { // Hanya Classic War
        // Jika sebelumnya InWar/Preparation ATAU sekarang WarEnded, coba arsipkan
        // Fungsi archiveClassicWar sudah handle cek duplikat di dalamnya
        await archiveClassicWar(clanId, clanTag, warData);
      }
    }

    // Update Cache
    if (warData) {
      await clanApiCacheRef.set({
        currentWar: warData,
        lastUpdatedWar: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      // Jika API null, tapi cache lama 'warEnded', pertahankan (jangan hapus UI)
      if (previousWarState !== 'warEnded') {
        await clanApiCacheRef.set({
          currentWar: null,
          lastUpdatedWar: FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        await clanApiCacheRef.update({ lastUpdatedWar: FieldValue.serverTimestamp() });
      }
    }

    // Update Timestamp Utama
    await adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId).update({
      lastSyncedWar: FieldValue.serverTimestamp(),
    });

    return { success: true, state: newWarState };
  } catch (error) {
    console.error(`[Cron] War Sync Failed for ${clanTag}:`, error);
    return { success: false, error };
  }
}

/**
 * Helper untuk menjalankan "War Log Sync" (Merge History)
 */
async function syncWarLog(clanId: string, clanTag: string) {
  try {
    const warLogData = await cocApi.getClanWarLog(encodeURIComponent(clanTag));
    
    if (warLogData && warLogData.items) {
      let processed = 0;
      for (const item of warLogData.items) {
        const warItem = item as CocWarLogEntry;
        const isValidResult = ['win', 'lose', 'tie'].includes(warItem.result || '');
        
        if (isValidResult) {
          // Merge result ke arsip yang ada
          await mergeWarLogEntry(clanId, clanTag, warItem);
          processed++;
        }
      }
      
      await adminFirestore.collection(COLLECTIONS.MANAGED_CLANS).doc(clanId).update({
        lastSyncedWarLog: FieldValue.serverTimestamp(),
      });
      
      return { success: true, count: processed };
    }
    return { success: true, count: 0 };
  } catch (error) {
    console.error(`[Cron] WarLog Sync Failed for ${clanTag}:`, error);
    return { success: false, error };
  }
}

export async function GET(request: NextRequest) {
  // 1. Keamanan: Verifikasi Secret (Bearer Token atau Query Param)
  const authHeader = request.headers.get('authorization');
  const secretParam = request.nextUrl.searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  const isAuthorized = 
    (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) ||
    (CRON_SECRET && secretParam === CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Query Clans yang Paling Lama Tidak Di-update (Stale)
    // Menggunakan 'lastSyncedBasic' sebagai patokan utama
    const clansSnapshot = await adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .orderBy('lastSyncedBasic', 'asc') // Terlama di atas (atau null)
      .limit(BATCH_SIZE)
      .get();

    if (clansSnapshot.empty) {
      return NextResponse.json({ message: 'No managed clans found to sync.' });
    }

    const results = [];

    // 3. Proses Setiap Clan
    for (const doc of clansSnapshot.docs) {
      const clanId = doc.id;
      const data = doc.data();
      const clanTag = data.tag;

      if (!clanTag) {
        results.push({ clanId, status: 'skipped', reason: 'No tag' });
        continue;
      }

      console.log(`[Cron] Processing Clan: ${data.name || clanId} (${clanTag})...`);

      // Jalankan semua sync secara serial untuk satu klan (agar tidak overload koneksi DB)
      // Namun, Basic, War, dan WarLog bisa jalan paralel per klan jika mau, 
      // tapi demi keamanan sequence, kita jalankan berurutan:
      // Basic (Update member dulu) -> War (Cek live) -> WarLog (Update history)
      
      const basicRes = await syncBasicInfo(clanId, clanTag, data);
      const warRes = await syncCurrentWar(clanId, clanTag);
      const logRes = await syncWarLog(clanId, clanTag);

      results.push({
        clan: data.name || clanTag,
        basic: basicRes.success ? 'OK' : 'Fail',
        war: warRes.success ? `OK (${warRes.state})` : 'Fail',
        log: logRes.success ? `OK (${logRes.count})` : 'Fail',
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results
    });

  } catch (error) {
    console.error('[Cron] Critical Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}