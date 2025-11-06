// File: app/api/tournament/[tournamentId]/register/route.ts
// Deskripsi: API route (POST) untuk mendaftarkan EsportsTeam ke Turnamen.

import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth'; // Menggunakan auth kustom Anda
import { COLLECTIONS } from '@/lib/firestore-collections';
import { EsportsTeam } from '@/lib/clashub.types';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST handler untuk mendaftarkan tim ke turnamen.
 */
export async function POST(
  request: Request,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Pengguna
    // Menggunakan getSessionUser dari lib/server-auth.ts
    const session = await getSessionUser();
    if (!session?.uid) {
      return NextResponse.json(
        { message: 'Tidak terotentikasi. Silakan login.' },
        { status: 401 },
      );
    }
    const userId = session.uid;

    // 2. Validasi Input Body
    const body = await request.json();
    const { teamId, clanId } = body;

    if (!teamId || !clanId) {
      return NextResponse.json(
        { message: 'Data tidak lengkap (teamId dan clanId diperlukan).' },
        { status: 400 },
      );
    }

    // 3. Validasi Kepemilikan Tim (Keamanan)
    // Pastikan user yang request adalah leader dari tim tersebut
    const teamRef = adminFirestore.doc(
      `${COLLECTIONS.MANAGED_CLANS}/${clanId}/${COLLECTIONS.ESPORTS_TEAMS}/${teamId}`,
    );
    const teamSnap = await teamRef.get();

    if (!teamSnap.exists) {
      return NextResponse.json(
        { message: 'Tim e-sports tidak ditemukan.' },
        { status: 404 },
      );
    }

    const teamData = teamSnap.data() as EsportsTeam;

    if (teamData.teamLeaderUid !== userId) {
      return NextResponse.json(
        {
          message:
            'Akses ditolak. Hanya leader tim yang dapat mendaftarkan tim.',
        },
        { status: 403 },
      );
    }

    // 4. Cek apakah sudah terdaftar
    const registrationRef = adminFirestore.doc(
      `${COLLECTIONS.TOURNAMENTS}/${tournamentId}/${COLLECTIONS.REGISTRATIONS}/${teamId}`,
    );
    const registrationSnap = await registrationRef.get();

    if (registrationSnap.exists) {
      return NextResponse.json(
        { message: 'Tim ini sudah terdaftar di turnamen ini.' },
        { status: 409 }, // 409 Conflict
      );
    }

    // 5. Buat data pendaftaran baru
    const newRegistrationData = {
      teamId: teamId,
      teamName: teamData.teamName,
      clanId: clanId,
      registeredByUid: userId,
      registeredAt: FieldValue.serverTimestamp(), // Gunakan timestamp server
      memberUids: teamData.memberUids, // Simpan snapshot anggota saat mendaftar
    };

    // 6. Simpan dokumen pendaftaran
    // ID dokumen = teamId agar unik per turnamen
    await registrationRef.set(newRegistrationData);

    return NextResponse.json(
      {
        message: 'Tim berhasil didaftarkan!',
        data: {
          ...newRegistrationData,
          registeredAt: new Date().toISOString(), // Kirim balik tanggal perkiraan
        },
      },
      { status: 201 }, // 201 Created
    );
  } catch (error) {
    console.error('Error in tournament registration API:', error);
    // Pastikan error adalah instance dari Error
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json(
      { message: 'Gagal mendaftarkan tim.', error: errorMessage },
      { status: 500 },
    );
  }
}