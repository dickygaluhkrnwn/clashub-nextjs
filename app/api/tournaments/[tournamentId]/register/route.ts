// File: app/api/tournaments/[tournamentId]/register/route.ts
// Deskripsi: [ROMBAK TOTAL - TAHAP 5] API route (POST) untuk mendaftarkan EsportsTeam ke Turnamen.
// Menggunakan path /api/tournaments/... (jamak) agar konsisten.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  ManagedClan,
  EsportsTeam,
  TournamentParticipant,
} from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';

// Impor fungsi transaksi baru yang sudah kita buat
import { registerTeamForTournamentAdmin } from '@/lib/firestore-admin/tournaments';

/**
 * @handler POST
 * @description Mendaftarkan tim ke turnamen.
 * (Sesuai Peta Pengembangan - Tahap 5, Poin 3)
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

    // 2. Validasi Input Body
    // Ini adalah payload yang dikirim dari TournamentRegisterClient.tsx (yang sudah kita refactor)
    const body = await request.json();
    const {
      selectedTeamId,
      clanId,
      clanTag,
      clanName,
      clanBadgeUrl,
    } = body;

    if (
      !selectedTeamId ||
      !clanId ||
      !clanTag ||
      !clanName ||
      !clanBadgeUrl
    ) {
      return NextResponse.json(
        { error: 'Data tidak lengkap.' },
        { status: 400 },
      );
    }

    // 3. Validasi Otorisasi (Keamanan)
    // User harus Clan Leader ATAU Team Leader dari tim yang didaftarkan.
    const clanRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId);
    const teamRef = clanRef
      .collection(COLLECTIONS.ESPORTS_TEAMS)
      .doc(selectedTeamId);

    const [clanSnap, teamSnap] = await Promise.all([
      clanRef.get(),
      teamRef.get(),
    ]);

    if (!clanSnap.exists) {
      return NextResponse.json(
        { error: 'Klan terkelola tidak ditemukan.' },
        { status: 404 },
      );
    }
    if (!teamSnap.exists) {
      return NextResponse.json(
        { error: 'Tim e-sports tidak ditemukan.' },
        { status: 404 },
      );
    }

    const clanData = docToDataAdmin<ManagedClan>(clanSnap);
    const teamData = docToDataAdmin<EsportsTeam>(teamSnap);

    const isClanLeader = clanData?.ownerUid === userId;
    const isTeamLeader = teamData?.teamLeaderUid === userId;

    if (!isClanLeader && !isTeamLeader) {
      return NextResponse.json(
        {
          error:
            'Akses ditolak. Hanya Pimpinan Klan atau Pimpinan Tim yang dapat mendaftarkan tim.',
        },
        { status: 403 },
      );
    }

    // 4. Siapkan data untuk disimpan (sesuai interface TournamentParticipant)
    const participantData: Omit<
      TournamentParticipant,
      'id' | 'registeredAt' | 'status'
    > = {
      clanTag: clanTag,
      clanName: clanName,
      clanBadgeUrl: clanBadgeUrl,
      representativeId: userId, // Akan di-override di dalam fungsi, tapi bagus untuk ada
      representativeName: sessionUser.displayName, // Akan di-override di dalam fungsi
    };

    // 5. Panggil Fungsi Transaksi (yang sudah kita buat di tournaments.ts)
    const result = await registerTeamForTournamentAdmin(
      tournamentId,
      selectedTeamId,
      participantData,
      sessionUser, // Kirim info session user untuk representativeId/Name
    );

    // 6. Sukses
    return NextResponse.json(
      {
        message: 'Tim berhasil didaftarkan!',
        participantId: result.participantId,
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
    if (error.message.includes('terdaftar')) {
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