// File: app/api/coc/sync-managed-clan/route.ts
// Deskripsi: API Route untuk menyinkronkan data ManagedClan internal dengan API CoC.
// Dipanggil secara manual (oleh manager) atau otomatis (oleh Cron Job).

import { NextRequest, NextResponse } from 'next/server';
// Menggunakan default export dari lib/coc-api
import cocApi from '@/lib/coc-api';
// Import fungsi Client SDK untuk read dan fungsi Admin SDK untuk write
import { getUserProfile, getManagedClanData } from '@/lib/firestore'; // Hanya perlu read
// FIX: Import fungsi read baru dan adminFirestore/Timestamp dari lib/firestore-admin.ts
import {
  adminFirestore, // <-- DIIMPORT SEKARANG dan DIEKSPOR dari firestore-admin.ts
  RoleChangeLog,
  getRoleLogsByClanId,
  getCwlArchivesByClanId,
} from '@/lib/firestore-admin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // Import Admin Timestamp
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi Server-Side
import {
  ManagedClan,
  ClanApiCache,
  CocMember,
  CocWarLog,       // Tipe dari CoC API Wrapper
  CocWarLogEntry, // Tipe spesifik untuk War Log Item
  UserProfile,
  ClanRole,
  TopPerformerPlayer, // Tipe untuk Top Performers
  CocRaidLog,       // Tipe untuk Raid Log API
  RaidArchive,      // Tipe untuk Arsip Raid
  WarArchive,       // Tipe untuk Arsip War
  // CwlArchive,    // Tipe untuk Arsip CWL (belum diimplementasikan penuh)
} from '@/lib/types';
import { getAggregatedParticipationData } from './logic/participationAggregator';
// Import tipe data dari file lokal yang baru dibuat
// ClanWarLog dan CwlWarLog dari logic/types digunakan untuk input aggregator
import { ClanWarLog as AggregatorClanWarLog, CwlWarLog as AggregatorCwlWarLog } from './logic/types';
import { COLLECTIONS } from '@/lib/firestore-collections'; // Import nama koleksi

// Batas waktu untuk menganggap cache 'fresh' (30 menit)
const CACHE_STALE_MS = 1000 * 60 * 30;

// =========================================================================
// FUNGSI HELPER BARU
// =========================================================================
/**
 * Fungsi helper untuk membersihkan data sebelum disimpan ke Firestore Admin SDK.
 * Mengonversi Date ke AdminTimestamp dan menghapus undefined/null.
 */
function cleanDataForAdminSDK<T extends object>(
  data: Partial<T>
): FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> {
  const cleaned: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {};
  for (const key in data) {
    if (
      Object.prototype.hasOwnProperty.call(data, key) &&
      data[key] !== undefined &&
      data[key] !== null // Hapus null juga, kecuali diizinkan secara eksplisit
    ) {
      if (data[key] instanceof Date) {
        cleaned[key] = AdminTimestamp.fromDate(data[key] as Date);
      } else {
        cleaned[key] = data[key];
      }
    }
    // Jika value adalah null dan kita ingin menyimpannya, tambahkan kondisi khusus di sini jika perlu
    // else if (key === 'clanId' && data[key] === null) { cleaned[key] = null; } // Contoh
  }
  return cleaned;
}


/**
 * @function GET
 * Endpoint untuk menyinkronkan data ManagedClan internal dengan API Clash of Clans.
 */
export async function GET(request: NextRequest) {
  const clanId = request.nextUrl.searchParams.get('clanId');
  const userUid = request.headers.get('X-Request-UID'); // Untuk otorisasi manual sync

  if (!clanId) {
    return NextResponse.json(
      { error: 'Missing clanId parameter.' },
      { status: 400 }
    );
  }

  let managedClan: ManagedClan | null = null; // Definisikan di scope luar try

  try {
    // 1. Otorisasi & Ambil ManagedClan (Gunakan Client SDK untuk get)
    managedClan = await getManagedClanData(clanId);

    if (!managedClan) {
      return NextResponse.json(
        { error: 'Managed Clan not found.' },
        { status: 404 }
      );
    }

    // Cek Otorisasi
    if (userUid) {
      // Manual sync
      const user = await getUserProfile(userUid); // Client SDK ok
      const userClanRole = user?.clanRole?.toLowerCase() as ClanRole | undefined;

      if (
        managedClan.ownerUid !== userUid &&
        userClanRole !== ClanRole.LEADER &&
        userClanRole !== ClanRole.CO_LEADER
      ) {
        return NextResponse.json(
          {
            error:
              'Unauthorized. Only clan managers (Leader/Co-Leader verified) can trigger manual sync.',
          },
          { status: 403 }
        );
      }
    }
    // Jika userUid null (Cron Job), lanjutkan

    // 2. Cek Stale Cache
    const lastSyncedDate =
      managedClan.lastSynced instanceof Date
        ? managedClan.lastSynced
        : new Date(managedClan.lastSynced); // Fallback

    if (
      !userUid && // Hanya cek cache jika ini bukan manual sync
      !isNaN(lastSyncedDate.getTime()) &&
      Date.now() - lastSyncedDate.getTime() < CACHE_STALE_MS
    ) {
      console.log(`[SYNC SKIP] Clan ${managedClan.tag} cache is fresh.`);
      return NextResponse.json(
        { message: 'Cache is fresh. Skipping full sync.' },
        { status: 200 }
      );
    }

    // 3. Ambil Data API Mentah & Data Internal Firestore
    const rawClanTag = managedClan.tag;
    const encodedClanTag = encodeURIComponent(
      rawClanTag.startsWith('#') ? rawClanTag : `#${rawClanTag}`
    );

    console.log(`[SYNC START] Fetching API data for clan: ${rawClanTag}`);

    // Parallel fetch data dari CoC API dan Firestore
    // PENAMBAHAN: Panggil API Raid Log (asumsi ada di cocApi)
    const [clanData, warLogResponse, currentWarData, roleLogs, cwlArchives, raidLogData] = await Promise.all([
      cocApi.getClanData(encodedClanTag),
      cocApi.getClanWarLog(encodedClanTag), // Ini mengembalikan { items: CocWarLogEntry[] }
      cocApi.getClanCurrentWar(encodedClanTag, rawClanTag),
      getRoleLogsByClanId(clanId),
      getCwlArchivesByClanId(clanId), // Ini mengambil arsip CWL *yang sudah disimpan*
      // TODO: Ganti ini dengan fungsi API Raid yang sebenarnya jika tersedia
      // Ganti Promise.resolve(null) dengan panggilan API Raid yang sebenarnya
      // cocApi.getClanRaidLog(encodedClanTag)
      Promise.resolve(null as CocRaidLog | null) // Placeholder
          .catch(err => { console.warn(`Failed to fetch Raid Log for ${rawClanTag}:`, err); return null; }), // Tambahkan catch
    ]);

    // Validasi clanData.memberList
    if (!clanData.memberList || clanData.memberList.length === 0) {
      console.warn(
        `[SYNC WARN] Clan ${managedClan.tag} data retrieved but member list is missing or empty.`
      );
    }
    const currentMembersApi = (clanData.memberList || []) as CocMember[];


    // 4. Hitung Metrik Partisipasi
    // MENGATASI ERROR TS2352: Gunakan type assertion (as unknown as ...)
    const participationMembers: ClanApiCache['members'] =
      getAggregatedParticipationData({
        currentMembers: currentMembersApi,
        warLog: warLogResponse as unknown as AggregatorClanWarLog, // <-- Type assertion
        cwlArchives: cwlArchives as AggregatorCwlWarLog[],
        roleLogs: roleLogs,
      });

    // 5. Hitung Top Performers (BARU)
    const promotions = participationMembers
      .filter(m => m.participationStatus === 'Promosi')
      .map(m => ({ tag: m.tag, name: m.name, value: 'Promosi', thLevel: m.townHallLevel, role: m.role as ClanRole } as TopPerformerPlayer));

    const demotions = participationMembers
      .filter(m => m.participationStatus === 'Demosi')
      .map(m => ({ tag: m.tag, name: m.name, value: 'Demosi', thLevel: m.townHallLevel, role: m.role as ClanRole } as TopPerformerPlayer));

    // Cari top donator dari data anggota API terbaru
    let topDonator: TopPerformerPlayer | null = null;
    if (currentMembersApi.length > 0) {
      const sortedDonators = [...currentMembersApi].sort((a, b) => b.donations - a.donations);
      if (sortedDonators[0].donations > 0) { // Hanya catat jika ada donasi
          const topApiDonator = sortedDonators[0];
          topDonator = {
              tag: topApiDonator.tag,
              name: topApiDonator.name,
              value: topApiDonator.donations,
              thLevel: topApiDonator.townHallLevel,
              role: topApiDonator.role as ClanRole // Role CoC
          };
      }
    }

    // Cari top raid looter dari data raid log (jika ada dan ada partisipan)
    let topRaidLooter: TopPerformerPlayer | null = null;
    if (raidLogData?.members && raidLogData.members.length > 0) {
        const sortedLooters = [...raidLogData.members].sort((a, b) => b.capitalResourcesLooted - a.capitalResourcesLooted);
        if (sortedLooters[0].capitalResourcesLooted > 0) { // Hanya catat jika ada jarahan
            const topApiLooter = sortedLooters[0];
            const looterProfile = currentMembersApi.find(m => m.tag === topApiLooter.tag); // Cari TH/Role dari member list
            topRaidLooter = {
                tag: topApiLooter.tag,
                name: topApiLooter.name,
                value: topApiLooter.capitalResourcesLooted,
                thLevel: looterProfile?.townHallLevel,
                role: looterProfile?.role as ClanRole // Role CoC
            };
        }
    }

    const topPerformersData: ClanApiCache['topPerformers'] = {
      promotions,
      demotions,
      topRaidLooter,
      topDonator,
    };

    // 6. Buat Payload Cache Lengkap (Termasuk Top Performers & Raid)
    const newCacheData: Omit<ClanApiCache, 'id' | 'lastUpdated'> = {
      currentWar: currentWarData || null, // Pastikan null jika undefined
      currentRaid: raidLogData || null, // Pastikan null jika undefined
      members: participationMembers,
      topPerformers: topPerformersData, // Masukkan data top performers
    };

    // 7. Buat Payload ManagedClan Metadata
    const totalThLevel = currentMembersApi.reduce(
      (sum, member) => sum + member.townHallLevel,
      0
    );
    const memberCountActual = currentMembersApi.length;
    const avgTh =
      memberCountActual > 0
        ? parseFloat((totalThLevel / memberCountActual).toFixed(1)) // Gunakan toFixed(1)
        : 0;

    const updatedManagedClanFields: Partial<ManagedClan> = {
      logoUrl: clanData.badgeUrls.large,
      avgTh: avgTh, // Sekarang bisa jadi angka desimal
      clanLevel: clanData.clanLevel,
      memberCount: memberCountActual,
    };

    // 8. Simpan ke Firestore (Cache, Metadata, dan Arsip) menggunakan Batch
    const batch = adminFirestore.batch();
    const now = new Date();

    // a. Update Cache
    const cacheRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection('clanApiCache')
      .doc('current');
    const cachePayload = {
      ...newCacheData,
      id: 'current',
      lastUpdated: now, // Gunakan Date biasa, cleanData akan konversi
    };
    // Hapus properti undefined secara eksplisit sebelum membersihkan
    if (cachePayload.currentWar === undefined) delete cachePayload.currentWar;
    if (cachePayload.currentRaid === undefined) delete cachePayload.currentRaid;
    batch.set(cacheRef, cleanDataForAdminSDK(cachePayload), { merge: true }); // Gunakan merge true

    // b. Update Metadata ManagedClan
    const managedClanRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);
    const clanUpdatePayload = cleanDataForAdminSDK({
      ...updatedManagedClanFields,
      lastSynced: now, // Update lastSynced
    });
    if (Object.keys(clanUpdatePayload).length > 0) {
      batch.update(managedClanRef, clanUpdatePayload);
    }

    // c. Simpan Arsip War Classic
    const warArchivesRef = managedClanRef.collection('warArchives');
    let archivedWarCount = 0;
    // Gunakan tipe CocWarLogEntry dari lib/types
    if (warLogResponse?.items && Array.isArray(warLogResponse.items)) {
        warLogResponse.items.forEach((warEntry: CocWarLogEntry) => {
            // Konversi ISO string ke Date object
            const warEndTime = new Date(warEntry.endTime);
            // Hanya arsipkan jika war sudah selesai dan tanggal valid
            if (!isNaN(warEndTime.getTime()) && warEntry.result) { // Hanya arsipkan yang ada hasil (selesai)
                // Buat ID Dokumen: Pastikan tag lawan valid
                const opponentTag = warEntry.opponent?.tag;
                if (!opponentTag) {
                    console.warn(`[SYNC ARCHIVE] Skipping war entry due to missing opponent tag. End time: ${warEntry.endTime}`);
                    return; // Lewati entri ini jika tag lawan tidak ada
                }
                // Buat ID dokumen: tagLawan-endTimeUTC (YYYY-MM-DDTHHMMSSZ) untuk keunikan
                const warId = `${opponentTag.replace('#', '')}-${warEndTime.toISOString()}`;
                const archiveDocRef = warArchivesRef.doc(warId);

                // Siapkan data arsip, pastikan clanTag ditambahkan
                // Tipe data WarArchive sekarang menggunakan Omit<CocWarLog, 'items'>
                // jadi kita perlu memetakan CocWarLogEntry ke struktur tersebut
                const warArchiveData: Omit<WarArchive, 'id' | 'clanTag' | 'warEndTime'> = {
                   // Petakan properti dari CocWarLogEntry ke WarArchive
                   // Contoh: state tidak ada di entry, opponent tidak punya member, dll.
                   // Ini perlu disesuaikan berdasarkan data aktual yang ada di warEntry
                   state: 'warEnded', // Asumsi karena warEntry.result ada
                   teamSize: warEntry.teamSize,
                   // clan dan opponent perlu disesuaikan strukturnya ke CocWarClanInfo
                   clan: {
                       tag: warEntry.clan.tag,
                       name: warEntry.clan.name,
                       badgeUrls: warEntry.clan.badgeUrls,
                       clanLevel: warEntry.clan.clanLevel,
                       stars: warEntry.clan.stars,
                       destructionPercentage: warEntry.clan.destructionPercentage,
                       attacks: warEntry.clan.attacks,
                       expEarned: warEntry.clan.expEarned,
                       members: [] // Tidak ada detail member di war log entry
                   },
                   opponent: {
                       tag: warEntry.opponent.tag,
                       name: warEntry.opponent.name,
                       badgeUrls: warEntry.opponent.badgeUrls,
                       clanLevel: warEntry.opponent.clanLevel,
                       stars: warEntry.opponent.stars,
                       destructionPercentage: warEntry.opponent.destructionPercentage,
                       members: [] // Tidak ada detail member di war log entry
                   },
                   // Properti lain dari CocWarLog mungkin perlu diisi default atau null
                   startTime: undefined, // startTime tidak ada di war log entry
                   endTime: warEntry.endTime, // Simpan string ISO asli juga jika perlu
                   // ... properti lain dari CocWarLogEntry yang relevan ...
                   result: warEntry.result,
                };

                batch.set(archiveDocRef, cleanDataForAdminSDK({
                    ...warArchiveData,
                    clanTag: rawClanTag, // Tambahkan tag klan kita
                    warEndTime: warEndTime // Simpan Date object untuk query
                }), { merge: true }); // Gunakan merge untuk update jika ID sama (misal sync ulang)
                archivedWarCount++;
            }
        });
        console.log(`[SYNC ARCHIVE] Preparing ${archivedWarCount} War Classic entries for archiving.`);
    }

    // d. Simpan Arsip Raid (jika data ada dan selesai)
    let archivedRaid = false;
    if (raidLogData && raidLogData.state === 'ended') {
        const raidArchivesRef = managedClanRef.collection('raidArchives');
        const raidEndTime = new Date(raidLogData.endTime);
        if (!isNaN(raidEndTime.getTime())) {
             // Buat ID Dokumen: clanTag-endTimeUTC (YYYY-MM-DDTHHMMSSZ)
             const raidId = `${rawClanTag.replace('#', '')}-${raidEndTime.toISOString()}`;
             const archiveDocRef = raidArchivesRef.doc(raidId);
             // Buat data arsip
             const raidArchiveData: Omit<RaidArchive, 'id'|'clanTag'> = {
                 raidId: raidId, // Simpan juga ID di dalam dokumen
                 startTime: new Date(raidLogData.startTime),
                 endTime: raidEndTime,
                 capitalTotalLoot: raidLogData.capitalTotalLoot,
                 totalAttacks: raidLogData.totalAttacks,
                 members: raidLogData.members, // Simpan partisipasi anggota
                 offensiveReward: raidLogData.offensiveReward,
                 defensiveReward: raidLogData.defensiveReward,
                 // Tambahkan properti lain dari CocRaidLog jika perlu
                 enemyDistrictsDestroyed: raidLogData.enemyDistrictsDestroyed, // Property ini sudah ada di RaidArchive
                 defenseLog: raidLogData.defenseLog, // Simpan log pertahanan
                 attackLog: raidLogData.attackLog, // Simpan log serangan
             };
             batch.set(archiveDocRef, cleanDataForAdminSDK({
                 ...raidArchiveData,
                 clanTag: rawClanTag // Tambahkan tag klan kita
             }), { merge: true }); // Gunakan merge
             archivedRaid = true;
             console.log(`[SYNC ARCHIVE] Preparing ended Raid Capital entry for archiving (ID: ${raidId}).`);
        }
    }

    // e. Simpan Arsip CWL (Logika sementara di-skip)
    if (currentWarData && 'warTag' in currentWarData && currentWarData.state === 'warEnded') {
        // TODO: Implementasi logika arsip CWL yang lebih robust di masa depan
        // Membutuhkan pengambilan data group CWL, lalu iterasi semua war dalam ronde
        // dan menyimpannya ke cwlArchives/{seasonId} dengan struktur yang sesuai.
        console.log(`[SYNC ARCHIVE] CWL War ${currentWarData.warTag} ended. Archiving logic needs refinement (skipped).`);
    }

    // Eksekusi Batch
    try {
        await batch.commit();
        console.log(`[SYNC FIRESTORE] Batch commit successful for clan ${rawClanTag}. Archived ${archivedWarCount} wars, ${archivedRaid ? 1 : 0} raids.`);
    } catch (batchError) {
        console.error(`[SYNC FIRESTORE] Batch commit FAILED for clan ${rawClanTag}:`, batchError);
        // Melempar error lagi agar ditangkap oleh blok catch utama
        throw new Error(`Batch commit failed: ${(batchError as Error).message}`);
    }


    return NextResponse.json(
      {
        message: `Managed Clan ${managedClan.name} synced successfully. Cache updated, ${archivedWarCount} wars archived, ${archivedRaid ? 1 : 0} raid archived.`,
        syncedAt: now,
        memberCount: memberCountActual,
        topPerformers: topPerformersData, // Kembalikan top performers
      },
      { status: 200 }
    );
  } catch (error) {
    // Logging error yang lebih informatif
    const clanTagForLog = managedClan?.tag || `ID: ${clanId}`;
    console.error(`Error during clan sync for ${clanTagForLog}:`, error);

    // Penanganan error spesifik dari API atau Batch
    let errorMessage = `Sync failed for clan ${clanTagForLog}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`;
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.startsWith('notFound')) {
        statusCode = 404;
        errorMessage = `Clan ${clanTagForLog} not found in CoC API. Cannot sync.`;
      } else if (error.message.includes('Forbidden')) {
        statusCode = 403;
        errorMessage = `Access denied (403) for clan ${clanTagForLog}. Check API Key/IP.`;
      } else if (error.message.includes('Gagal menyimpan')) { // Cek error dari firestore-admin (jika ada)
        errorMessage = `API data fetched for ${clanTagForLog}, but failed to save data. ${error.message}`;
      } else if (error.message.includes('Batch commit failed')) { // Tangkap error dari batch commit
         errorMessage = `API data processed for ${clanTagForLog}, but failed during Firestore batch save. ${error.message}`;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

