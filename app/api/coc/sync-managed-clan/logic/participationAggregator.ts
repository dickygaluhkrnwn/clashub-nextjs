// File: app/api/coc/sync-managed-clan/logic/participationAggregator.ts

import { CocMember, CocWarLog, ClanApiCache } from '@/lib/types';

// =========================================================================
// KONSTANTA LOGIKA PARTISIPASI (Berdasarkan Blueprint Aggregators.js)
// =========================================================================

// Ambil dari Apps Script Blueprint: SUCCESS_LIMIT dan PENALTY_LIMIT = 3
const SUCCESS_LIMIT = 3; 
const PENALTY_LIMIT = 3;

// Role yang dikecualikan dari Partisipasi (Leader/Co-Leader)
const EXCLUDED_ROLES: CocMember['role'][] = ['leader', 'coLeader'];

// =========================================================================
// FUNGSI UTAMA
// =========================================================================

/**
 * @function getAggregatedParticipationData
 * Mengkalkulasi Partisipasi War Classic (CWL diasumsikan 7 hari penuh)
 * Berdasarkan blueprint Aggregators.js, menghitung War Success/Fail.
 * * CATATAN: Karena kita tidak memiliki log Role Change di Firestore, 
 * kita akan MENGABAIKAN reset date untuk SEMENTARA. Logika ini akan ditambahkan 
 * saat Fase 6 (Backlog) diimplementasikan, atau jika log Role Change API tersedia.
 * * @param currentMembers Daftar anggota klan saat ini dari API.
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
            // Gunakan tanggal saat ini sebagai placeholder, perlu dirombak dengan log Role Change
            lastRoleChangeDate: new Date(), 
        };
    });

    // 1. ITERASI MELALUI LOG WAR
    warLog.items.forEach((war: any) => {
        // Cek apakah ini adalah CWL Group War (biasanya tidak ada di /warlog)
        const isCwl = war.hasOwnProperty('leagueGroup'); 
        
        // Iterasi melalui anggota klan kita (clan.members) dalam log perang
        war.clan.members.forEach((memberWar: any) => {
            const tag = memberWar.tag;
            if (!memberParticipationMap[tag]) return; // Lewati jika bukan anggota saat ini

            // Asumsi: Kita hanya menghitung partisipasi War Classic.
            // CWL di Apps Script blueprint dihitung secara terpisah (7 hari penuh per musim)
            
            // War Classic: Hitung Partisipasi Sukses/Gagal
            if (!isCwl) {
                const attacksUsed = memberWar.attacks?.length || 0;
                
                // Success: Serangan digunakan, dan bintang total >= 2 (atau 100% 3 bintang)
                const isSuccess = attacksUsed > 0; // Logika sederhana: Berpartisipasi dan menyerang minimal 1x
                
                // Gagal (Fail): Tidak berpartisipasi atau menggunakan serangan kurang dari 2
                const isFail = war.state === 'ended' && attacksUsed < 2; // Jika war selesai dan kurang dari 2 serangan digunakan
                
                if (isSuccess) {
                    memberParticipationMap[tag].warSuccessCount += 1;
                }
                if (isFail) {
                    memberParticipationMap[tag].warFailCount += 1;
                }
            }
            
            // Catatan: Metrik CWL di Apps Script didasarkan pada log CWL terpisah, yang belum kita ambil.
            // Untuk sementara, kita hanya fokus pada War Classic.
        });
    });

    // 2. APLIKASIKAN STATUS PARTISIPASI
    const enrichedMembers: ClanApiCache['members'] = currentMembers.map(member => {
        const tag = member.tag;
        const metrics = memberParticipationMap[tag];
        let status: ClanApiCache['members'][number]['participationStatus'] = 'Aman';

        // 2a. Leader/Co-Leader selalu "Aman (Leader/Co-Leader)"
        if (EXCLUDED_ROLES.includes(member.role)) {
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