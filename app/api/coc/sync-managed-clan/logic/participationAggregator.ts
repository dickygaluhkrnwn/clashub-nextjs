// File: app/api/coc/sync-managed-clan/logic/participationAggregator.ts

import { CocMember, CocWarLog, ClanApiCache, ClanRole } from '@/lib/types'; // Import ClanRole

// =========================================================================
// KONSTANTA LOGIKA PARTISIPASI (Berdasarkan Blueprint Aggregators.js)
// =========================================================================

// Ambil dari Apps Script Blueprint: SUCCESS_LIMIT dan PENALTY_LIMIT = 3
const SUCCESS_LIMIT = 3; 
const PENALTY_LIMIT = 3;
const REQUIRED_ATTACKS = 2; // Serangan yang diwajibkan dalam War Classic

// Role yang dikecualikan dari Partisipasi (Leader/Co-Leader)
const EXCLUDED_ROLES: ClanRole[] = [ClanRole.LEADER, ClanRole.CO_LEADER]; // Menggunakan ClanRole enum

// =========================================================================
// FUNGSI UTAMA
// =========================================================================

/**
 * @function getAggregatedParticipationData
 * Mengkalkulasi Partisipasi War Classic (CWL diabaikan untuk saat ini).
 * Berdasarkan blueprint Aggregators.js, menghitung War Success/Fail.
 * @param currentMembers Daftar anggota klan saat ini dari API.
 * @param warLog Log Perang lengkap dari API.
 * @returns Daftar anggota yang diperkaya dengan metrik Partisipasi.
 */
export function getAggregatedParticipationData(
    currentMembers: CocMember[], 
    warLog: CocWarLog
): ClanApiCache['members'] {
    
    // Inisialisasi peta (map) hasil partisipasi untuk akses cepat
    const memberParticipationMap: Record<string, Omit<ClanApiCache['members'][number], keyof CocMember>> = {};

    // Inisialisasi metrik untuk semua anggota
    currentMembers.forEach(member => {
        memberParticipationMap[member.tag] = {
            cwlSuccessCount: 0,
            warSuccessCount: 0,
            cwlFailCount: 0,
            warFailCount: 0,
            participationStatus: 'Aman',
            // Placeholder: Nilai ini perlu diperbarui dari Firestore di Fase 6 (Log Role Change)
            lastRoleChangeDate: new Date(), 
        };
    });

    // 1. ITERASI MELALUI LOG WAR (Hanya War Classic)
    warLog.items.forEach((war: any) => {
        // Hanya proses War yang SUDAH SELESAI
        if (war.state !== 'ended') return; 

        // Lewati CWL (Log CWL di Apps Script dihitung terpisah per Musim)
        const isCwl = war.hasOwnProperty('leagueGroup') || war.tag.includes('CWL'); // Pemeriksaan tambahan untuk War Tag CWL
        if (isCwl) return;

        // Iterasi melalui anggota klan kita (clan.members) dalam log perang
        war.clan.members.forEach((memberWar: any) => {
            const tag = memberWar.tag;
            const memberMetrics = memberParticipationMap[tag];

            if (!memberMetrics) return; // Lewati jika bukan anggota saat ini

            const attacksUsed = memberWar.attacks?.length || 0;
            const expectedAttacks = war.teamSize ? REQUIRED_ATTACKS : REQUIRED_ATTACKS; // Asumsi 2 serangan

            // Tentukan status partisipasi untuk War Classic
            
            // Logika Success (Replikasi dari Aggregators.js: Serangan digunakan, dianggap sukses)
            // Logika Aggregators.js adalah: Berpartisipasi dan menyerang minimal 1x
            const isSuccess = attacksUsed > 0; 

            // Logika Fail: Kurang dari serangan wajib
            const isFail = attacksUsed < expectedAttacks; 
            
            if (isSuccess) {
                memberMetrics.warSuccessCount += 1;
            }
            // HANYA menghitung War Fail jika pemain berpartisipasi dalam war (ada di daftar war)
            // dan tidak menggunakan semua serangan wajib.
            if (isFail) {
                 memberMetrics.warFailCount += 1;
            }
        });
    });

    // 2. APLIKASIKAN STATUS PARTISIPASI
    const enrichedMembers: ClanApiCache['members'] = currentMembers.map(member => {
        const tag = member.tag;
        const metrics = memberParticipationMap[tag];
        // Konversi role API (leader, coLeader, admin, member) ke ClanRole Enum
        const memberRole: ClanRole = member.role.toLowerCase() as ClanRole;

        let status: ClanApiCache['members'][number]['participationStatus'] = 'Aman';

        // 2a. Leader/Co-Leader selalu "Aman (Leader/Co-Leader)"
        if (EXCLUDED_ROLES.includes(memberRole)) {
            status = 'Leader/Co-Leader';
        } else {
            // 2b. Hitung Total Sukses dan Gagal (Hanya War Classic untuk saat ini)
            const totalSuccess = metrics.warSuccessCount;
            const totalFail = metrics.warFailCount;

            if (totalFail >= PENALTY_LIMIT) {
                status = 'Demosi';
            } else if (totalSuccess >= SUCCESS_LIMIT) {
                status = 'Promosi';
            }
        }
        
        // Gabungkan data API mentah dengan metrik Partisipasi
        return {
            ...member,
            ...metrics,
            participationStatus: status,
        };
    });

    return enrichedMembers;
}
