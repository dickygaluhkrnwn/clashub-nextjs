// File: app/api/tournaments/[tournamentId]/manage/invite/route.ts
// Deskripsi: [BARU - FASE 5] API route (POST) untuk mengundang panitia baru via email.

import { NextResponse, NextRequest } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSessionUser } from '@/lib/server-auth';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { UserProfile } from '@/lib/clashub.types';
import { docToDataAdmin } from '@/lib/firestore-admin/utils';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * @handler POST
 * @description Mengundang user (via email) untuk menjadi panitia (committee).
 * Hanya bisa dilakukan oleh Organizer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;

  try {
    // 1. Validasi Sesi Pengguna (Panitia yang Mengundang)
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Tidak terotentikasi.' },
        { status: 401 },
      );
    }

    // 2. Ambil Data Turnamen
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }

    // 3. Validasi Keamanan (ROADMAP FASE 5)
    // Hanya ORGANIZER yang bisa mengundang panitia baru.
    if (tournament.organizerUid !== sessionUser.uid) {
      return NextResponse.json(
        { error: 'Hanya organizer yang dapat mengundang panitia baru.' },
        { status: 403 }, // 403 Forbidden
      );
    }

    // 4. Validasi Input Body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email user yang diundang diperlukan.' },
        { status: 400 },
      );
    }

    // 5. Cari User yang akan diundang berdasarkan Email
    const usersRef = adminFirestore.collection(COLLECTIONS.USERS);
    const userQuery = usersRef.where('email', '==', email.toLowerCase()).limit(1);
    const userSnap = await userQuery.get();

    if (userSnap.empty) {
      return NextResponse.json(
        { error: `User dengan email "${email}" tidak ditemukan di Clashub.` },
        { status: 404 }, // 404 Not Found
      );
    }

    const targetUser = docToDataAdmin<UserProfile>(userSnap.docs[0]);
    if (!targetUser) {
      // Seharusnya tidak terjadi jika snap tidak empty, tapi sebagai fallback
      return NextResponse.json({ error: 'User tidak valid.' }, { status: 404 });
    }

    const targetUid = targetUser.uid;

    // 6. Cek apakah user sudah menjadi panitia/organizer
    if (
      tournament.organizerUid === targetUid ||
      tournament.committeeUids.includes(targetUid)
    ) {
      return NextResponse.json(
        { error: `User "${targetUser.displayName}" sudah menjadi panitia.` },
        { status: 409 }, // 409 Conflict
      );
    }

    // 7. Update Dokumen Turnamen (Tambah ke array committeeUids)
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await tournamentRef.update({
      committeeUids: FieldValue.arrayUnion(targetUid),
    });

    // 8. Sukses
    return NextResponse.json(
      {
        message: `Berhasil mengundang "${targetUser.displayName}" sebagai panitia!`,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      `[POST /api/tournaments/${tournamentId}/manage/invite] Error:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}