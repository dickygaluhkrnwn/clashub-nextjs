// File: app/api/tournaments/[tournamentId]/register/route.ts
// Deskripsi: [ROMBAK TOTAL - FASE 3] API route (POST) untuk mendaftarkan tim baru (TournamentTeam) ke Turnamen.
// Mengimplementasikan 5 CEK validasi sisi server sesuai roadmap.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  Tournament,
  TournamentTeam,
  TournamentTeamMember,
  UserProfile,
} from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

// Impor fungsi helper dari file yang sudah ada
import {
  getTournamentByIdAdmin,
  getParticipantsForTournamentAdmin,
  registerTeamForTournamentAdmin,
} from '@/lib/firestore-admin/tournaments';
import { validateTeamThRequirements } from '@/lib/th-utils';

/**
 * @handler POST
 * @description Mendaftarkan tim baru ke turnamen (sesuai Peta Pengembangan Fase 3).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Pengguna
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi. Silakan login.' },
        { status: 401 },
      );
    }
    const userId = sessionUser.uid;

    // 2. Validasi Input Body (Payload BARU dari Fase 3)
    const body = await request.json();
    const {
      teamName,
      members: clientMembers, // Ini adalah array { playerTag, playerName }
      originClanTag,
      originClanBadgeUrl,
    } = body;

    if (
      !teamName ||
      !Array.isArray(clientMembers) ||
      clientMembers.length === 0 ||
      !originClanTag ||
      !originClanBadgeUrl
    ) {
      return NextResponse.json(
        { error: 'Data tidak lengkap. Nama tim, anggota, dan info klan asal diperlukan.' },
        { status: 400 },
      );
    }

    // 3. Ambil Data Turnamen
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // Validasi Status Turnamen
    if (tournament.status !== 'registration_open') {
      return NextResponse.json(
        { error: `Pendaftaran untuk turnamen ini ${tournament.status === 'completed' ? 'sudah selesai' : 'belum dibuka atau sudah ditutup'}.` },
        { status: 403 }, // 403 Forbidden
      );
    }

    // =================================================================
    // ROADMAP FASE 3: 5 CEK SISI SERVER
    // =================================================================

    // CEK 1: Apakah jumlah player sesuai (format)?
    if (tournament.teamSize !== clientMembers.length) {
      return NextResponse.json(
        {
          error: `Format turnamen adalah ${tournament.format} (${tournament.teamSize} pemain), tetapi Anda mendaftarkan ${clientMembers.length} pemain.`,
        },
        { status: 400 },
      );
    }

    // CEK 2 & 3: Validasi TH (Sisi Server)
    // Kita tidak bisa percaya TH dari klien. Kita ambil data TH asli dari server.
    const playerTags = clientMembers.map((m: any) => m.playerTag);

    const usersRef = adminFirestore.collection(COLLECTIONS.USERS);
    const usersQuery = usersRef.where('playerTag', 'in', playerTags);
    const usersSnap = await usersQuery.get();

    const foundProfiles = usersSnap.docs.map((doc) =>
      docToDataAdmin<UserProfile>(doc),
    );

    // Bangun array members yang terverifikasi server
    const serverMembers: TournamentTeamMember[] = [];

    for (const clientMember of clientMembers) {
      const profile = foundProfiles.find(
        (p) => p?.playerTag === clientMember.playerTag,
      );

      if (!profile || !profile.isVerified) {
        return NextResponse.json(
          {
            error: `Pemain dengan tag "${clientMember.playerTag}" (${clientMember.playerName}) tidak terdaftar atau belum terverifikasi di Clashub.`,
          },
          { status: 400 },
        );
      }

      serverMembers.push({
        playerTag: profile.playerTag,
        playerName: profile.inGameName || profile.displayName, // Ambil nama dari profil
        townHallLevel: profile.thLevel, // Ambil TH asli dari profil
      });
    }

    // Jalankan validasi TH menggunakan data server
    const thValidation = validateTeamThRequirements(
      serverMembers,
      tournament.thRequirement,
    );

    if (!thValidation.isValid) {
      // Kirim pesan error spesifik dari helper th-utils
      return NextResponse.json({ error: thValidation.message }, { status: 400 });
    }

    // CEK 4: Cek apakah salah satu playerTag sudah terdaftar di tim lain?
    const allTeams = await getParticipantsForTournamentAdmin(tournamentId);
    const allRegisteredTags = new Set(
      allTeams.flatMap((team) => team.members.map((m) => m.playerTag)),
    );

    for (const member of serverMembers) {
      if (allRegisteredTags.has(member.playerTag)) {
        return NextResponse.json(
          {
            error: `Pemain "${member.playerName}" (${member.playerTag}) sudah terdaftar di tim lain di turnamen ini.`,
          },
          { status: 409 }, // 409 Conflict
        );
      }
    }

    // CEK 5: Cek apakah kuota sudah penuh?
    // Cek ini sudah ada di dalam fungsi transaksi registerTeamForTournamentAdmin
    // (tournamentData.participantCountCurrent >= tournamentData.participantCount)
    // Kita panggil saja transaksinya.

    // 5. Siapkan data untuk disimpan (sesuai interface TournamentTeam)
    const newTeamData: Omit<
      TournamentTeam,
      'id' | 'registeredAt' | 'status' | 'leaderUid'
    > = {
      teamName: teamName,
      originClanTag: originClanTag,
      originClanBadgeUrl: originClanBadgeUrl,
      members: serverMembers, // Gunakan data member yang sudah divalidasi server
    };

    // 6. Panggil Fungsi Transaksi
    // Fungsi ini akan menangani CEK 5 (kuota) secara atomik
    const result = await registerTeamForTournamentAdmin(
      tournamentId,
      newTeamData,
      sessionUser, // Kirim info session user untuk leaderUid
    );

    // 7. Sukses
    return NextResponse.json(
      {
        message: 'Tim berhasil didaftarkan!',
        teamId: result.teamId,
      },
      { status: 201 }, // 201 Created
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/register] Error:`,
      error,
    );

    // Tangani error spesifik dari transaction function
    if (error.message.includes('penuh')) {
      return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
    }
    if (error.message.includes('ditemukan')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Error umum
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}