// File: app/api/coc/sync-managed-clan/logic/participationAggregator.ts

import { CocMember, ClanApiCache, ClanRole } from '@/lib/types';
// PERBAIKAN: Import RoleChangeLog dari @/lib/types, bukan @/lib/firestore-admin
import { RoleChangeLog } from '@/lib/types';
import { ClanWarLog, CwlWarLog } from './types'; // FIX: Tipe sekarang didefinisikan di ./types

// =========================================================================
// KONSTANTA LOGIKA PARTISIPASI (Berdasarkan Blueprint Aggregators.js)
// =========================================================================

// Ambil dari Apps Script Blueprint: SUCCESS_LIMIT dan PENALTY_LIMIT = 3
const PROMO_SUCCESS_THRESHOLD = 3; // Promosi ke Elder/Co-Leader
const FAIL_DEMOTE_THRESHOLD = 3; // Demosi atau Kick
// const REQUIRED_ATTACKS = 2; // Serangan yang diwajibkan dalam War Classic (Diasumsikan 2)

// Role yang dikecualikan dari Partisipasi (Leader/Co-Leader)
const EXCLUDED_ROLES: ClanRole[] = [ClanRole.LEADER, ClanRole.CO_LEADER]; // Menggunakan ClanRole enum

// =========================================================================
// TIPE INPUT BARU
// =========================================================================

interface AggregationInput {
    currentMembers: CocMember[];
    warLog: ClanWarLog; // Log War Classic
    cwlArchives: CwlWarLog[]; // Arsip CWL (per musim)
    roleLogs: RoleChangeLog[]; // Log perubahan role dari Firestore
}

// =========================================================================
// FUNGSI UTAMA
// =========================================================================

/**
 * @function getAggregatedParticipationData
 * Mengkalkulasi Partisipasi War Classic dan CWL, serta menerapkan logika reset penalti.
 * @param input Data input yang diperkaya (Members, Logs, Archives, Role Changes).
 * @returns Daftar anggota yang diperkaya dengan metrik Partisipasi.
 */
export function getAggregatedParticipationData({
    currentMembers,
    warLog,
    cwlArchives,
    roleLogs,
}: AggregationInput): ClanApiCache['members'] {
    
    // Inisialisasi peta (map) hasil partisipasi untuk akses cepat
    const memberMetricsMap: Record<string, Omit<ClanApiCache['members'][number], keyof CocMember>> = {};

    // ---------------------------------------------------------------------
    // 1. PRA-PROSES DATA (LAST ROLE CHANGE DATE)
    // ---------------------------------------------------------------------
    
    // Buat peta untuk menemukan tanggal perubahan role terakhir (untuk reset penalti)
    const lastRoleChangeMap: Record<string, Date> = {};
    roleLogs.forEach(log => {
        const timestamp = log.changedAt;
        const playerTag = log.playerTag;
        
        // Hanya simpan log yang benar-benar mengubah role (oldRole != newRole)
        // Dan pastikan ini adalah perubahan ke atas (promosi) atau perubahan yang relevan.
        // Untuk menyederhanakan, kita ambil tanggal perubahan terbaru saja.
        if (!lastRoleChangeMap[playerTag] || timestamp > lastRoleChangeMap[playerTag]) {
            lastRoleChangeMap[playerTag] = timestamp;
        }
    });

    // Inisialisasi metrik awal untuk semua anggota
    currentMembers.forEach(member => {
        const playerTag = member.tag;
        memberMetricsMap[playerTag] = {
            cwlSuccessCount: 0,
            warSuccessCount: 0,
            cwlFailCount: 0,
            warFailCount: 0,
            participationStatus: 'Aman',
            // Set default lastRoleChangeDate dari log atau Date(0) jika tidak ada log
            lastRoleChangeDate: lastRoleChangeMap[playerTag] || new Date(0), 
        };
    });

    // ---------------------------------------------------------------------
    // 2. ITERASI LOG WAR CLASSIC
    // ---------------------------------------------------------------------
    
    const warClassicItems = warLog.items.filter(war => war.state === 'ended'); // Hanya yang sudah selesai
    const latestWarDate = warClassicItems.length > 0 ? new Date(warClassicItems[0].endTime) : new Date(0);

    // FIX: Gunakan tipe WarItem dari ClanWarLog
    warClassicItems.forEach((war) => {
        // Asumsi War Classic memiliki 2 serangan wajib
        const expectedAttacks = 2; 
        const warEndTime = new Date(war.endTime);
        
        war.clan.members.forEach((memberWar: any) => { // Member di sini masih 'any' karena tipe log CoC sangat nested
            const tag = memberWar.tag;
            const metrics = memberMetricsMap[tag];

            if (!metrics) return; // Lewati jika bukan anggota saat ini

            const attacksUsed = memberWar.attacks?.length || 0;
            const isParticipated = memberWar.attacks?.length > 0;
            
            // Logika Success (Aggregators.js: Serangan digunakan, dianggap sukses)
            if (isParticipated) {
                metrics.warSuccessCount += 1;
            }
            
            // Logika Fail: Pemain ada di daftar War dan tidak menggunakan semua serangan wajib (attacksUsed < expectedAttacks)
            if (memberWar.hasOwnProperty('attacks') && attacksUsed < expectedAttacks) {
                
                // *** LOGIKA RESET PENALTI DITERAPKAN DI SINI ***
                // Jika tanggal war (warEndTime) LEBIH LAMA dari tanggal perubahan role terakhir
                // Maka penalti ini sudah harus di-reset, JANGAN dihitung.
                if (warEndTime > metrics.lastRoleChangeDate) {
                        metrics.warFailCount += 1;
                }
                // Jika warEndTime <= metrics.lastRoleChangeDate, penalti ini diabaikan.
            }
        });
    });

    // ---------------------------------------------------------------------
    // 3. ITERASI LOG CWL ARCHIVES
    // ---------------------------------------------------------------------
    
    cwlArchives.forEach(cwlSeason => {
        // Iterasi per hari war (days)
        // FIX: Gunakan tipe RoundItem dari CwlWarLog
        cwlSeason.rounds.forEach((round) => {
            // Setiap round adalah satu war
            const warEndTime = new Date(round.endTime);

            // Kita harus mengidentifikasi siapa saja anggota klan kita di war log ini
            round.clan.members.forEach((memberWar: any) => { // Member di sini masih 'any'
                const tag = memberWar.tag;
                const metrics = memberMetricsMap[tag];

                if (!metrics) return; // Lewati jika bukan anggota saat ini

                const attacksUsed = memberWar.attacks?.length || 0;
                const isParticipated = memberWar.attacks?.length > 0;
                
                // CWL: Asumsi 1 serangan wajib (tapi CoC API hanya memberikan 1 serangan max)
                const expectedAttacks = 1;

                // Logika Success (Aggregators.js: Serangan digunakan, dianggap sukses)
                if (isParticipated) {
                    metrics.cwlSuccessCount += 1;
                }
                
                // Logika Fail: Pemain di lineup CWL dan tidak menyerang
                if (attacksUsed < expectedAttacks) {
                    
                    // *** LOGIKA RESET PENALTI DITERAPKAN DI SINI ***
                    // Jika tanggal war (warEndTime) LEBIH LAMA dari tanggal perubahan role terakhir
                    // Maka penalti ini sudah harus di-reset, JANGAN dihitung.
                    if (warEndTime > metrics.lastRoleChangeDate) {
                        metrics.cwlFailCount += 1;
                    }
                }
            });
        });
    });
    
    // ---------------------------------------------------------------------
    // 4. APLIKASIKAN STATUS PARTISIPASI AKHIR
    // ---------------------------------------------------------------------
    
    const enrichedMembers: ClanApiCache['members'] = currentMembers.map(member => {
        const tag = member.tag;
        const metrics = memberMetricsMap[tag];
        // Konversi role API (leader, coLeader, admin, member) ke ClanRole Enum
        // Menggunakan member.role dari CocMember (leader, coLeader, admin, member)
        const memberRole: ClanRole = member.role.toLowerCase() === 'admin' ? ClanRole.ELDER : member.role.toLowerCase() as ClanRole;

        let status: ClanApiCache['members'][number]['participationStatus'] = 'Aman';
        let statusKeterangan: string = 'Aman (Tidak Aktif/Baru)'; // Keterangan default

        // 4a. Leader/Co-Leader selalu "Aman (Leader/Co-Leader)"
        if (EXCLUDED_ROLES.includes(memberRole)) {
            status = 'Aman';
            statusKeterangan = 'Leader/Co-Leader';
        } else {
            // 4b. Hitung Total Sukses dan Gagal (War Classic + CWL)
            const totalSuccess = metrics.warSuccessCount + metrics.cwlSuccessCount;
            const totalFail = metrics.warFailCount + metrics.cwlFailCount;

            if (totalFail >= FAIL_DEMOTE_THRESHOLD) {
                // Logika Demosi
                status = 'Demosi';
                statusKeterangan = `Demosi (Total Gagal: ${totalFail}x)`;
            } else if (totalSuccess >= PROMO_SUCCESS_THRESHOLD && memberRole === ClanRole.MEMBER) {
                // Logika Promosi (Hanya berlaku untuk MEMBER)
                status = 'Promosi';
                statusKeterangan = `Promosi ke Elder (Sukses ${totalSuccess}x)`;
            } else {
                // Logika Aman
                status = 'Aman';
                
                if (totalSuccess > 0) {
                    // Aman dengan progres Promosi (jika Elder, ini adalah progres ke Co-Leader, tapi kita batasi Promosi hanya untuk Member)
                    statusKeterangan = `Aman (Progres promosi: ${totalSuccess}/${PROMO_SUCCESS_THRESHOLD} sukses)`;
                } 
                if (totalFail > 0) {
                    statusKeterangan = `Aman (Memiliki ${totalFail}x Penalti)`;
                }
                
                if (totalSuccess === 0 && totalFail === 0) {
                        // Check jika ada war yang dihitung sama sekali, jika tidak, anggap baru/tidakt aktif
                    statusKeterangan = metrics.lastRoleChangeDate.getTime() === new Date(0).getTime() ? 'Aman (Tidak Aktif/Baru)' : 'Aman';
                }
            }
        }
        
        // Gabungkan data API mentah dengan metrik Partisipasi
        return {
            ...member,
            cwlSuccessCount: metrics.cwlSuccessCount,
            warSuccessCount: metrics.warSuccessCount,
            cwlFailCount: metrics.cwlFailCount,
            warFailCount: metrics.warFailCount,
            participationStatus: status,
            statusKeterangan: statusKeterangan, // Menambahkan statusKeterangan untuk UI
            lastRoleChangeDate: metrics.lastRoleChangeDate,
        };
    });

    return enrichedMembers;
}

