// File: app/api/tournaments/[tournamentId]/match/[matchId]/check-in/route.ts
// Deskripsi: [BARU - FASE 6] API route (POST) untuk menangani proses check-in
// oleh Leader tim.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  TournamentMatch,
  TournamentTeam,
  CocClan,
  CocMember, // [FIX 1] Tambahkan CocMember
  FirestoreDocument,
  TournamentTeamMember, // [FIX 2] Tambahkan TournamentTeamMember
} from '@/lib/types'; // [FIX 1] Ubah impor dari 'clashub.types' ke 'types'
import { docToDataAdmin, cleanDataForAdminSDK } from '@/lib/firestore-admin/utils';
import cocApi from '@/lib/coc-api'; // Impor default

/**
 * @handler POST
 * @description Menangani permintaan check-in dari leader tim.
 * Payload: { clanTag: string, teamSide: 'team1' | 'team2' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string; matchId: string } },
) {
  const { tournamentId, matchId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Harus Login)
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi.' },
        { status: 401 },
      );
    }

    // 2. Validasi Payload Body
    let payload: { clanTag: string; teamSide: 'team1' | 'team2' };
    try {
      payload = await request.json();
      if (
        !payload.clanTag ||
        !payload.clanTag.startsWith('#') ||
        !payload.teamSide
      ) {
        throw new Error('Payload tidak valid.');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Payload tidak valid.' },
        { status: 400 },
      );
    }

    const { clanTag, teamSide } = payload;
    const encodedClanTag = encodeURIComponent(clanTag);

    // 3. Ambil Data Match dan Tim dari Firestore
    const matchRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection('matches')
      .doc(matchId);

    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      return NextResponse.json(
        { error: 'Match tidak ditemukan.' },
        { status: 404 },
      );
    }
    const matchData = docToDataAdmin<TournamentMatch>(matchSnap);
    if (!matchData) {
      return NextResponse.json(
        { error: 'Gagal membaca data match.' },
        { status: 500 },
      );
    }

    // Tentukan referensi tim yang benar
    const teamRef =
      teamSide === 'team1' ? matchData.team1Ref : matchData.team2Ref;
    if (!teamRef) {
      return NextResponse.json(
        { error: 'Tim (BYE) tidak bisa check-in.' },
        { status: 400 },
      );
    }

    const teamSnap = await (teamRef as any).get(); // (any) untuk admin SDK ref
    if (!teamSnap.exists) {
      return NextResponse.json(
        { error: 'Data tim tidak ditemukan.' },
        { status: 404 },
      );
    }
    const teamData = docToDataAdmin<TournamentTeam>(teamSnap);
    if (!teamData) {
      return NextResponse.json(
        { error: 'Gagal membaca data tim.' },
        { status: 500 },
      );
    }

    // 4. Validasi Keamanan: Hanya Leader Tim yang bisa Check-in
    if (sessionUser.uid !== teamData.leaderUid) {
      return NextResponse.json(
        { error: 'Hanya leader tim yang bisa melakukan check-in.' },
        { status: 403 },
      );
    }

    // 5. Validasi CoC API (ROADMAP FASE 6, Poin 3)
    let cocClanData: CocClan;
    try {
      cocClanData = await cocApi.getClanData(encodedClanTag);
    } catch (apiError: any) {
      if (apiError.message.includes('notFound')) {
        return NextResponse.json(
          { error: `Clan Tag ${clanTag} tidak ditemukan (404).` },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: `Gagal mengambil data CoC API: ${apiError.message}` },
        { status: 502 }, // 502 Bad Gateway (masalah upstream)
      );
    }
// ... (code unchanged) ...
    if (!cocClanData.memberList) {
      return NextResponse.json(
        { error: `Gagal membaca daftar member dari ${clanTag}. Apakah clan privat?` },
        { status: 400 },
      );
    }

    // Buat Set (HashSet) untuk lookup player tag yang cepat
    const clanMemberTags = new Set(
      cocClanData.memberList.map((m: CocMember) => m.tag), // [FIX 2] Tambahkan tipe CocMember
    );
    const teamPlayerTags = teamData.members.map(
      (m: TournamentTeamMember) => m.playerTag, // [FIX 2] Tambahkan tipe TournamentTeamMember
    );

    // Cek apakah SEMUA player tim ada di dalam clan tersebut
    for (const playerTag of teamPlayerTags) {
      if (!clanMemberTags.has(playerTag)) {
        // Temukan nama pemain untuk pesan error
        const playerName =
          teamData.members.find((m) => m.playerTag === playerTag)?.playerName ||
          playerTag;
        return NextResponse.json(
          {
            error: `Validasi gagal: Pemain ${playerName} (${playerTag}) tidak ditemukan di dalam clan ${clanTag}.`,
          },
          { status: 400 },
        );
      }
    }

    // 6. Validasi Sukses -> Update Dokumen Match
    const updateData =
      teamSide === 'team1'
        ? {
            team1ClanTag: clanTag,
            team1ClanBadge: cocClanData.badgeUrls.small,
          }
        : {
            team2ClanTag: clanTag,
            team2ClanBadge: cocClanData.badgeUrls.small,
          };

    await matchRef.update(updateData);

    // 7. Kembalikan data match yang sudah di-update
    const updatedMatchData = {
      ...matchData,
      ...updateData,
    };

    return NextResponse.json(
      {
        success: true,
        message: `Check-in berhasil untuk ${teamData.teamName} dengan clan ${clanTag}.`,
        match: updatedMatchData, // Kirim data terbaru ke client
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/.../check-in] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}