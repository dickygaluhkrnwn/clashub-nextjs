// File: app/api/coc/sync-managed-clan/logic/participationAggregator.ts

import {
  CocMember,
  ClanApiCache,
  FirestoreDocument,
  WarArchive,
  CwlArchive,
  RoleChangeLog,
} from '@/lib/types';
import { ClanRole } from '@/lib/enums';

// =========================================================================
// KONSTANTA LOGIKA PARTISIPASI
// =========================================================================

const PROMO_SUCCESS_THRESHOLD = 3;
const FAIL_DEMOTE_THRESHOLD = 3;
const WAR_CLASSIC_EXPECTED_ATTACKS = 2;
const EXCLUDED_ROLES: ClanRole[] = [ClanRole.LEADER, ClanRole.CO_LEADER];

// =========================================================================
// TIPE INPUT BARU (MODIFIKASI)
// =========================================================================

interface AggregationInput {
  currentMembers: CocMember[];
  warArchives: FirestoreDocument<WarArchive>[];
  cwlArchives: FirestoreDocument<CwlArchive>[];
  roleLogs: RoleChangeLog[];
  clanTag: string; // <-- [PERBAIKAN UTAMA] Tambahkan clanTag
}

// =========================================================================
// FUNGSI UTAMA
// =========================================================================

export function getAggregatedParticipationData({
  currentMembers,
  warArchives,
  cwlArchives,
  roleLogs,
  clanTag, // <-- [PERBAIKAN UTAMA] Terima clanTag
}: AggregationInput): ClanApiCache['members'] {
  const memberMetricsMap: Record<
    string,
    Omit<ClanApiCache['members'][number], keyof CocMember>
  > = {};

  // ---------------------------------------------------------------------
  // 1. PRA-PROSES DATA (LAST ROLE CHANGE DATE)
  // ---------------------------------------------------------------------
  const lastRoleChangeMap: Record<string, Date> = {};
  roleLogs.forEach((log) => {
    const timestamp =
      log.changedAt && typeof (log.changedAt as any).toDate === 'function'
        ? (log.changedAt as any).toDate()
        : (log.changedAt as Date);
    const playerTag = log.playerTag;
    if (!lastRoleChangeMap[playerTag] || timestamp > lastRoleChangeMap[playerTag]) {
      lastRoleChangeMap[playerTag] = timestamp;
    }
  });

  currentMembers.forEach((member) => {
    const playerTag = member.tag;
    memberMetricsMap[playerTag] = {
      cwlSuccessCount: 0,
      warSuccessCount: 0,
      cwlFailCount: 0,
      warFailCount: 0,
      participationStatus: 'Aman',
      lastRoleChangeDate: lastRoleChangeMap[playerTag] || new Date(0),
    };
  });

  // ---------------------------------------------------------------------
  // 2. ITERASI LOG WAR CLASSIC (DIPERBARUI DENGAN LOGIKA PENGECEKAN TIM)
  // ---------------------------------------------------------------------
  const warClassicItems = warArchives.filter((war) => war.state === 'warEnded');

  warClassicItems.forEach((war) => {
    const expectedAttacks = WAR_CLASSIC_EXPECTED_ATTACKS;
    const warEndTime =
      war.warEndTime && typeof (war.warEndTime as any).toDate === 'function'
        ? (war.warEndTime as any).toDate()
        : (war.warEndTime as Date);

    if (!warEndTime || typeof warEndTime.getTime !== 'function') return;

    // --- [PERBAIKAN LOGIKA TIM] ---
    // Tentukan yang mana klan kita di data arsip ini
    const ourClanDataInWar =
      war.clan?.tag === clanTag
        ? war.clan
        : war.opponent?.tag === clanTag
        ? war.opponent
        : null;

    if (!ourClanDataInWar || !ourClanDataInWar.members) {
      console.warn(
        `[Aggregator] Skipping classic war archive ${war.id}, couldn't find our clan data (Tag: ${clanTag}).`
      );
      return;
    }
    // --- [AKHIR PERBAIKAN] ---

    // Iterasi member DARI KLAN KITA
    ourClanDataInWar.members.forEach((memberWar: any) => {
      const tag = memberWar.tag;
      const metrics = memberMetricsMap[tag];
      if (!metrics) return;

      const attacksUsed = memberWar.attacks?.length || 0;

      if (attacksUsed === expectedAttacks) {
        metrics.warSuccessCount += 1;
      } else if (attacksUsed === 0) {
        if (warEndTime > metrics.lastRoleChangeDate) {
          metrics.warFailCount += 1;
        }
      }
    });
  });

  // ---------------------------------------------------------------------
  // 3. ITERASI LOG CWL ARCHIVES (DIPERBARUI DENGAN LOGIKA PENGECEKAN TIM)
  // ---------------------------------------------------------------------
  cwlArchives.forEach((cwlSeason) => {
    cwlSeason.rounds.forEach((round) => {
      const warEndTime = new Date(round.endTime);
      if (!round.endTime || isNaN(warEndTime.getTime())) return;

      // --- [PERBAIKAN LOGIKA TIM] ---
      // Tentukan yang mana klan kita di data ronde ini
      const ourClanDataInRound =
        round.clan?.tag === clanTag
          ? round.clan
          : round.opponent?.tag === clanTag
          ? round.opponent
          : null;

      if (!ourClanDataInRound || !ourClanDataInRound.members) {
        console.warn(
          `[Aggregator] Skipping CWL round in season ${cwlSeason.season}, couldn't find our clan data (Tag: ${clanTag}).`
        );
        return;
      }
      // --- [AKHIR PERBAIKAN] ---

      // Iterasi member DARI KLAN KITA (yang ada di 'opponent' di data Anda)
      ourClanDataInRound.members.forEach((memberWar: any) => {
        const tag = memberWar.tag;
        const metrics = memberMetricsMap[tag];
        if (!metrics) return;

        // "Saya sappol" tidak punya array 'attacks', jadi attacksUsed akan 0
        const attacksUsed = memberWar.attacks?.length || 0;
        const expectedAttacks = 1;

        if (attacksUsed === expectedAttacks) {
          metrics.cwlSuccessCount += 1;
        } else if (attacksUsed === 0) {
          if (warEndTime > metrics.lastRoleChangeDate) {
            metrics.cwlFailCount += 1; // "Saya sappol" akan masuk sini
          }
        }
      });
    });
  });

  // ---------------------------------------------------------------------
  // 4. APLIKASIKAN STATUS PARTISIPASI AKHIR (Logika ini sudah benar)
  // ---------------------------------------------------------------------
  const enrichedMembers: ClanApiCache['members'] = currentMembers.map(
    (member) => {
      const tag = member.tag;
      const metrics = memberMetricsMap[tag];
      const memberRole: ClanRole =
        member.role.toLowerCase() === 'admin'
          ? ClanRole.ELDER
          : (member.role.toLowerCase() as ClanRole);

      let status: ClanApiCache['members'][number]['participationStatus'] = 'Aman';
      let statusKeterangan: string = 'Aman (Tidak Aktif/Baru)';

      if (EXCLUDED_ROLES.includes(memberRole)) {
        status = 'Aman';
        statusKeterangan = 'Leader/Co-Leader';
      } else {
        const totalSuccess = metrics.warSuccessCount + metrics.cwlSuccessCount;
        const totalFail = metrics.warFailCount + metrics.cwlFailCount;

        if (totalFail >= FAIL_DEMOTE_THRESHOLD && memberRole === ClanRole.ELDER) {
          status = 'Demosi';
          statusKeterangan = `Demosi (Total Gagal: ${totalFail}x)`;
        } else if (
          totalSuccess >= PROMO_SUCCESS_THRESHOLD &&
          memberRole === ClanRole.MEMBER
        ) {
          status = 'Promosi';
          statusKeterangan = `Promosi ke Elder (Sukses ${totalSuccess}x)`;
        } else {
          status = 'Aman';
          if (totalSuccess > 0 && totalFail > 0) {
            statusKeterangan = `Aman (Progres: ${totalSuccess}/${PROMO_SUCCESS_THRESHOLD} sukses, ${totalFail}/${FAIL_DEMOTE_THRESHOLD} gagal)`;
          } else if (totalSuccess > 0) {
            if (memberRole === ClanRole.ELDER) {
              statusKeterangan = `Aman (Sukses: ${totalSuccess}x)`;
            } else {
              statusKeterangan = `Aman (Progres promosi: ${totalSuccess}/${PROMO_SUCCESS_THRESHOLD} sukses)`;
            }
          } else if (totalFail > 0) {
            statusKeterangan = `Aman (Memiliki ${totalFail}/${FAIL_DEMOTE_THRESHOLD}x Penalti)`;
          } else if (totalSuccess === 0 && totalFail === 0) {
            statusKeterangan =
              metrics.lastRoleChangeDate.getTime() === new Date(0).getTime()
                ? 'Aman (Tidak Aktif/Baru)'
                : 'Aman';
          }
        }
      }

      return {
        ...member,
        cwlSuccessCount: metrics.cwlSuccessCount,
        warSuccessCount: metrics.warSuccessCount,
        cwlFailCount: metrics.cwlFailCount,
        warFailCount: metrics.warFailCount,
        participationStatus: status,
        statusKeterangan: statusKeterangan,
        lastRoleChangeDate: metrics.lastRoleChangeDate,
      };
    }
  );

  return enrichedMembers;
}