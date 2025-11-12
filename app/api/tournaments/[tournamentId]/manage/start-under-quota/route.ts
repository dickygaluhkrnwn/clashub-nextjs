// File: app/api/tournaments/[tournamentId]/manage/start-under-quota/route.ts
// Deskripsi: [UPDATE FASE 18.2] Perbaikan error impor 'docToDataAdmin'.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentTeam,
  TournamentMatch,
  FirestoreDocument,
} from '@/lib/clashub.types';
import {
  getTournamentByIdAdmin,
  getParticipantsForTournamentAdmin,
} from '@/lib/firestore-admin/tournaments';
// [PERBAIKAN ERROR] Tambahkan DocumentReference ke impor
import { FieldValue, DocumentReference } from 'firebase-admin/firestore';
// [PERBAIKAN FASE 18.2] Tambahkan 'docToDataAdmin' ke impor
import { docToDataAdmin, cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';

// Helper untuk shuffle array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
// ... (sisa fungsi shuffleArray tidak berubah) ...
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

// Helper untuk mendapatkan power of 2 terdekat
function getNextPowerOfTwo(n: number): number {
// ... (sisa fungsi getNextPowerOfTwo tidak berubah) ...
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 16) return 16;
  if (n <= 32) return 32;
  if (n <= 64) return 64;
  // Jika lebih, kembali ke 64 (batas maks kita)
  return 64;
}

/**
 * @handler POST
 * @description Memulai turnamen 'under quota' (logika Fase 7.6).
 * [UPDATE FASE 17.2] Logika digabungkan dari 'generate-bracket'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Panitia
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
// ... (sisa kode validasi tidak berubah) ...
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil Data Turnamen (Pre-check untuk otorisasi)
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 3. Cek Otorisasi Panitia
    const isOrganizer = tournament.organizerUid === sessionUser.uid;
    const isCommittee = tournament.committeeUids.includes(sessionUser.uid);
    if (!isOrganizer && !isCommittee) {
// ... (sisa kode validasi tidak berubah) ...
      return NextResponse.json(
        { error: 'Forbidden: Anda bukan panitia turnamen ini.' },
        { status: 403 },
      );
    }

    // =================================================================
    // LOGIKA INTI: GENERATE BRACKET DENGAN "BYE" (Fase 7.6 + 17.2)
    // =================================================================
    const batch = adminFirestore.batch();
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);
    const matchesRef = tournamentRef.collection('matches');

// ... (sisa kode tidak berubah) ...

    let approvedTeams: FirestoreDocument<TournamentTeam>[] = [];
    let bracketSize = 0;
    let byeCount = 0;
    let panitiaClanA_Tag: string | null = null;
    let panitiaClanB_Tag: string | null = null;

    // 4. Transaksi untuk Validasi
    await adminFirestore.runTransaction(async (t) => {
// ... (sisa kode validasi transaksi tidak berubah) ...
      const tournamentSnap = await t.get(tournamentRef);
      if (!tournamentSnap.exists) {
        throw new Error('Turnamen tidak ditemukan.');
      }
      const tournamentData = tournamentSnap.data() as Tournament;

      // Validasi Status
      if (tournamentData.status !== 'registration_closed') {
        throw new Error(
          `Hanya turnamen yang pendaftarannya ditutup yang bisa dimulai. Status saat ini: ${tournamentData.status}`,
        );
      }

      // [BARU FASE 17.2] Validasi Klan Panitia (Wajib ada)
      if (!tournamentData.panitiaClanA_Tag || !tournamentData.panitiaClanB_Tag) {
        throw new Error(
          'Panitia belum mengatur Klan A & B. Harap atur di Tab "Pengaturan" terlebih dahulu.',
        );
      }
      panitiaClanA_Tag = tournamentData.panitiaClanA_Tag;
      panitiaClanB_Tag = tournamentData.panitiaClanB_Tag;

      // Ambil Tim yang Disetujui
      const teamsRef = tournamentRef.collection('teams');
      const teamsQuery = teamsRef.where('status', '==', 'approved');
      const teamsSnap = await t.get(teamsQuery);

      teamsSnap.docs.forEach((doc) => {
        // [FIX FASE 18.2] Baris ini sekarang valid karena 'docToDataAdmin' sudah diimpor
        const teamData = docToDataAdmin<TournamentTeam>(doc);
        if (teamData) {
          approvedTeams.push({ ...teamData, id: doc.id });
        }
      });

      const approvedCount = approvedTeams.length;

      // Validasi Jumlah Tim
// ... (sisa kode validasi jumlah tim tidak berubah) ...
      if (approvedCount <= 1) {
        throw new Error(
          'Tidak bisa memulai turnamen. Minimal harus ada 2 tim yang disetujui.',
        );
      }

      if (approvedCount === tournamentData.participantCount) {
        throw new Error(
          'Kuota turnamen sudah penuh. Gunakan tombol "Generate Bracket" biasa.',
        );
      }

      // Hitung Ukuran Bracket dan BYE
      bracketSize = getNextPowerOfTwo(approvedCount);
      byeCount = bracketSize - approvedCount;
    }); // Akhir Transaksi Validasi

    // 5. Buat daftar referensi tim (termasuk BYE)
// ... (sisa kode logika 'BYE' tidak berubah) ...
    const teamsRef = tournamentRef.collection('teams');
    const teamRefs: (DocumentReference | null)[] = approvedTeams.map((team) =>
      teamsRef.doc(team.id),
    );

    // Tambahkan 'null' untuk BYE
    for (let i = 0; i < byeCount; i++) {
      teamRefs.push(null);
    }

    // Acak tim (termasuk BYE)
    const shuffledTeamRefs = shuffleArray(teamRefs);
    const round1Matches: TournamentMatch[] = [];
    const allMatchesToCreate: TournamentMatch[] = [];

    // 6. Buat Match Ronde 1 (Upper)
// ... (sisa kode pembuatan Ronde 1 tidak berubah) ...
    for (let i = 0; i < bracketSize; i += 2) {
      const team1Ref = shuffledTeamRefs[i];
      const team2Ref = shuffledTeamRefs[i + 1];

      const matchId = `U-R1-M${i / 2 + 1}`;
      
      // [PERBAIKAN FASE 17.2] Perbaiki error TS2739
      const newMatch: TournamentMatch = {
        matchId,
        round: 1,
        bracket: 'upper',
        status: 'pending', // Status awal
        team1Ref: team1Ref as DocumentReference<TournamentTeam> | null,
        team2Ref: team2Ref as DocumentReference<TournamentTeam> | null,
        team1ClanTag: null,
        team2ClanTag: null,
        team1ClanBadge: null,
        team2ClanBadge: null,
        winnerTeamRef: null,
        scheduledTime: null,
        liveWarData: null,
        
        // [BARU FASE 17.2] Tugaskan Klan A/B
        team1AssignedClanTag: panitiaClanA_Tag,
        team2AssignedClanTag: panitiaClanB_Tag,
        team1WarTag: null,
        team2WarTag: null,
      };

      round1Matches.push(newMatch);
    }
    allMatchesToCreate.push(...round1Matches);

    // 7. Buat Placeholder Ronde Selanjutnya (Upper & Lower)
// ... (sisa kode pembuatan placeholder tidak berubah) ...
    const totalRounds = Math.log2(bracketSize);
    const lowerBracketRounds = (totalRounds - 1) * 2;

    // Placeholder Upper Bracket (mulai dari Ronde 2)
    for (let r = 2; r <= totalRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r);
      for (let m = 1; m <= matchesInRound; m++) {
        const matchId = `U-R${r}-M${m}`;
        // [PERBAIKAN FASE 17.2] Perbaiki error TS2345
        allMatchesToCreate.push({
          matchId,
          round: r,
          bracket: 'upper',
// ... (sisa field) ...
          status: 'pending',
          team1Ref: null,
          team2Ref: null,
          team1ClanTag: null,
          team2ClanTag: null,
          team1ClanBadge: null,
          team2ClanBadge: null,
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,
          team1AssignedClanTag: null, // [FIX] Wajib ada
          team2AssignedClanTag: null, // [FIX] Wajib ada
          team1WarTag: null, // [FIX] Wajib ada
          team2WarTag: null, // [FIX] Wajib ada
        });
      }
    }
    // Placeholder Lower Bracket
    for (let r = 1; r <= lowerBracketRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, Math.ceil(r / 2) + 1);
      for (let m = 1; m <= matchesInRound; m++) {
        const matchId = `L-R${r}-M${m}`;
        // [PERBAIKAN FASE 17.2] Perbaiki error TS2345
        allMatchesToCreate.push({
          matchId,
          round: r,
          bracket: 'lower',
// ... (sisa field) ...
          status: 'pending',
          team1Ref: null,
          team2Ref: null,
          team1ClanTag: null,
          team2ClanTag: null,
          team1ClanBadge: null,
          team2ClanBadge: null,
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,
          team1AssignedClanTag: null, // [FIX] Wajib ada
          team2AssignedClanTag: null, // [FIX] Wajib ada
          team1WarTag: null, // [FIX] Wajib ada
          team2WarTag: null, // [FIX] Wajib ada
        });
      }
    }

    // 8. Logika Auto-Advance "BYE" (Fase 17.4)
// ... (sisa kode auto-advance tidak berubah) ...
    // Cek Ronde 1 dan majukan pemenang BYE ke Ronde 2
    round1Matches.forEach((match) => {
      const { team1Ref, team2Ref, matchId } = match;
      let winnerRef: DocumentReference<TournamentTeam> | null = null;

      if (team1Ref !== null && team2Ref === null) {
        // Tim 1 vs BYE
        winnerRef = team1Ref;
      } else if (team1Ref === null && team2Ref !== null) {
        // BYE vs Tim 2
        winnerRef = team2Ref;
      }

      if (winnerRef) {
        // Tandai match ronde 1 sebagai selesai
        match.status = 'completed';
        match.winnerTeamRef = winnerRef;

        // Cari match ronde 2 yang sesuai
        const matchIndex = parseInt(matchId.split('M')[1]) - 1; // 0-based index
        const nextRoundMatchIndex = Math.floor(matchIndex / 2) + 1;
        const nextMatchId = `U-R2-M${nextRoundMatchIndex}`;

        const nextMatch = allMatchesToCreate.find(
          (m) => m.matchId === nextMatchId,
        );
        if (nextMatch) {
          // Masukkan pemenang ke slot yang benar (slot 1 jika index genap, slot 2 jika ganjil)
          if (matchIndex % 2 === 0) {
            nextMatch.team1Ref = winnerRef;
          } else {
            nextMatch.team2Ref = winnerRef;
          }
        }
      }
    });

    // 9. Simpan Semua Match ke Batch
// ... (sisa kode batch write tidak berubah) ...
    allMatchesToCreate.forEach((match) => {
      const docRef = matchesRef.doc(match.matchId);
      // Buang matchId dari data yang disimpan (karena itu ID dokumen)
      const { matchId: _, ...dataToSet } = match;
      batch.set(docRef, cleanDataForAdminSDK(dataToSet));
    });

    // 10. Update Dokumen Turnamen Utama
    batch.update(tournamentRef, {
// ... (sisa kode update turnamen tidak berubah) ...
      status: 'ongoing',
      participantCount: bracketSize, // Update kuota agar sesuai ukuran bracket
    });

    // 11. Commit Batch
    await batch.commit();

    return NextResponse.json(
// ... (sisa kode response sukses tidak berubah) ...
      {
        success: true,
        message: `Turnamen berhasil dimulai dengan ${approvedTeams.length} tim (Bracket ${bracketSize}). BYE otomatis dimajukan.`,
        newStatus: 'ongoing',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(`[POST /.../manage/start-under-quota] Error:`, error);
// ... (sisa kode error handling tidak berubah) ...
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 400 }, // Kirim 400 jika error validasi
    );
  }
}