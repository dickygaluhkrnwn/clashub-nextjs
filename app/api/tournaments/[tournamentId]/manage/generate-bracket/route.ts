// File: app/api/tournaments/[tournamentId]/manage/generate-bracket/route.ts
// Deskripsi: [UPDATE FASE 15.3] API route (POST) untuk membuat bracket turnamen
// dan MENUGASKAN KLAN PANITIA (A/B) ke setiap match.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentTeam,
  TournamentMatch,
  FirestoreDocument,
} from '@/lib/clashub.types';
// [PERBAIKAN] Tambahkan 'DocumentReference' ke impor
import { FieldValue, DocumentReference } from 'firebase-admin/firestore';
import {
  docToDataAdmin,
  cleanDataForAdminSDK,
} from '@/lib/firestore-admin/utils';

/**
 * @function shuffleArray
 * @description Helper untuk mengacak array (Fisher-Yates shuffle).
 */
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // Selama masih ada elemen untuk diacak
  while (currentIndex !== 0) {
    // Ambil elemen tersisa
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Tukar dengan elemen saat ini
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

/**
 * @handler POST
 * @description Meng-generate bracket (Ronde 1 Upper) untuk turnamen.
 * Hanya bisa dilakukan oleh Panitia (Organizer atau Committee).
 * [UPDATE FASE 15.3] Sekarang juga menugaskan klan panitia A & B.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Panitia)
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi.' },
        { status: 401 },
      );
    }

    // 2. Ambil Data Turnamen (Pre-check)
    // Kita panggil di luar transaksi HANYA untuk cek otorisasi.
    // Data aslinya akan di-fetch lagi DI DALAM transaksi.
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 3. Validasi Keamanan (ROADMAP FASE 5)
    // Bisa diakses oleh Organizer ATAU Committee
    const isOrganizer = tournament.organizerUid === sessionUser.uid;
    const isCommittee = tournament.committeeUids.includes(sessionUser.uid);

    if (!isOrganizer && !isCommittee) {
      return NextResponse.json(
        { error: 'Hanya panitia yang dapat melakukan aksi ini.' },
        { status: 403 },
      );
    }

    // 4. Jalankan Transaksi Atomik
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await adminFirestore.runTransaction(async (t) => {
      // 5. Validasi Data di dalam Transaksi (Penting!)
      const tournamentSnap = await t.get(tournamentRef);
      if (!tournamentSnap.exists) {
        throw new Error('Turnamen tidak ditemukan.');
      }
      const tournamentData = tournamentSnap.data() as Tournament;

      // Cek Status (Harus 'registration_closed')
      if (tournamentData.status !== 'registration_closed') {
        throw new Error(
          `Bracket tidak bisa dibuat. Status turnamen saat ini: ${tournamentData.status}.`,
        );
      }

      // Cek Kuota (Harus Penuh)
      if (
        tournamentData.participantCountCurrent !==
        tournamentData.participantCount
      ) {
        throw new Error(
          `Bracket tidak bisa dibuat. Kuota peserta belum penuh (${tournamentData.participantCountCurrent} / ${tournamentData.participantCount}).`,
        );
      }

      // [BARU FASE 15.3] Validasi Klan Panitia (Sesuai ide Anda)
      const { panitiaClanA_Tag, panitiaClanB_Tag } = tournamentData;
      if (!panitiaClanA_Tag || !panitiaClanB_Tag) {
        throw new Error(
          'Panitia belum mengatur Klan A & B. Harap atur di Tab "Pengaturan" terlebih dahulu.',
        );
      }

      // 6. Ambil Semua Tim 'approved' (di dalam Transaksi)
      const teamsRef = tournamentRef.collection('teams');
      const teamsQuery = teamsRef.where('status', '==', 'approved');
      const teamsSnap = await t.get(teamsQuery);

      const approvedTeams: FirestoreDocument<TournamentTeam>[] = [];
      teamsSnap.docs.forEach((doc) => {
        const teamData = docToDataAdmin<TournamentTeam>(doc);
        if (teamData) {
          // Penting: Simpan referensi dokumen Firestore-nya
          approvedTeams.push({ ...teamData, id: doc.id });
        }
      });

      // Validasi jumlah tim approved HARUS SAMA dengan kuota
      if (approvedTeams.length !== tournamentData.participantCount) {
        throw new Error(
          `Jumlah tim 'approved' (${approvedTeams.length}) tidak sesuai dengan kuota turnamen (${tournamentData.participantCount}).`,
        );
      }

      // 7. Acak (Shuffle) Tim
      const shuffledTeams = shuffleArray(approvedTeams);

      // 8. Buat Dokumen Match (Ronde 1 Upper Bracket)
      const matchesRef = tournamentRef.collection('matches');
      const matchCountR1 = tournamentData.participantCount / 2;

      for (let i = 0; i < matchCountR1; i++) {
        const matchId = `U-R1-M${i + 1}`; // e.g., U-R1-M1, U-R1-M2, ...
        const matchDocRef = matchesRef.doc(matchId);

        const team1 = shuffledTeams[i * 2];
        const team2 = shuffledTeams[i * 2 + 1];

        // Buat referensi dokumen Firestore
        // [PERBAIKAN] Ganti cast ke 'any' untuk mengatasi mismatch tipe DocRef client/admin
        const team1Ref = teamsRef.doc(team1.id) as any;
        const team2Ref = teamsRef.doc(team2.id) as any;

        // [PERBAIKAN FASE 15.3] Objek newMatch sekarang menyertakan
        // 4 field baru yang wajib diisi (memperbaiki error TS2739).
        const newMatch: TournamentMatch = {
          matchId: matchId, // [FIX] matchId harus jadi bagian dari objek
          round: 1,
          bracket: 'upper',
          status: 'pending', // Menunggu jadwal
          team1Ref: team1Ref,
          team2Ref: team2Ref,
          team1ClanTag: null, // Diisi saat check-in
          team2ClanTag: null, // Diisi saat check-in
          team1ClanBadge: null, // Diisi saat check-in
          team2ClanBadge: null, // Diisi saat check-in
          winnerTeamRef: null,
          scheduledTime: null,
          liveWarData: null,

          // [BARU FASE 15.3] Tugaskan Klan A/B sesuai ide Anda
          team1AssignedClanTag: panitiaClanA_Tag, // Tim 1 (index genap) selalu ke Klan A
          team2AssignedClanTag: panitiaClanB_Tag, // Tim 2 (index ganjil) selalu ke Klan B
          team1WarTag: null, // Diisi nanti oleh panitia/sistem
          team2WarTag: null, // Diisi nanti oleh panitia/sistem
        };

        // Set dokumen match baru di dalam transaksi
        // Kita buang 'matchId' karena itu adalah ID dokumen
        const { matchId: _, ...dataToSet } = newMatch;
        t.set(matchDocRef, cleanDataForAdminSDK(dataToSet));
      }

      // 9. Update Status Turnamen Utama
      t.update(tournamentRef, {
        status: 'ongoing',
      });
    });

    // 10. Sukses
    return NextResponse.json(
      {
        message: 'Bracket Ronde 1 Upper berhasil dibuat! Turnamen dimulai.',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/manage/generate-bracket] Error:`,
      error,
    );
    // Kirim pesan error spesifik dari transaksi
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 400 }, // 400 Bad Request (karena validasi gagal)
    );
  }
}