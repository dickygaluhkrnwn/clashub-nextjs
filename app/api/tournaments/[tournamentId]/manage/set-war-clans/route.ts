// File: app/api/tournaments/[tournamentId]/manage/set-war-clans/route.ts
// Deskripsi: [BARU FASE 15.2] API route untuk panitia menyimpan Tag Klan A & B.

import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { Tournament } from '@/lib/clashub.types';
import { getTournamentByIdAdmin } from '@/lib/firestore-admin/tournaments'; // Impor helper
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } },
) {
  const { tournamentId } = params;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { panitiaClanA_Tag, panitiaClanB_Tag } = (await request.json()) as {
      panitiaClanA_Tag: string;
      panitiaClanB_Tag: string;
    };

    if (!panitiaClanA_Tag || !panitiaClanB_Tag) {
      return NextResponse.json(
        { error: 'Kedua Tag Klan (A dan B) wajib diisi.' },
        { status: 400 },
      );
    }
    
    // Validasi tag format (minimal 4 karakter, diawali #)
    if (!panitiaClanA_Tag.startsWith('#') || !panitiaClanB_Tag.startsWith('#') || panitiaClanA_Tag.length < 4 || panitiaClanB_Tag.length < 4) {
      return NextResponse.json(
        { error: 'Format Tag Klan tidak valid. Harus diawali #' },
        { status: 400 },
      );
    }
    
    if (panitiaClanA_Tag === panitiaClanB_Tag) {
        return NextResponse.json(
          { error: 'Tag Klan A dan B tidak boleh sama.' },
          { status: 400 },
        );
      }

    // Verifikasi kepemilikan (Hanya Organizer yang boleh)
    const tournament = await getTournamentByIdAdmin(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Turnamen tidak ditemukan.' },
        { status: 404 },
      );
    }
    if (tournament.organizerUid !== sessionUser.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update dokumen turnamen
    const tournamentRef = adminFirestore
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId);

    await tournamentRef.update({
      panitiaClanA_Tag: panitiaClanA_Tag,
      panitiaClanB_Tag: panitiaClanB_Tag,
    });

    return NextResponse.json({
      message: 'Tag Klan War berhasil disimpan!',
    });
  } catch (error: any) {
    console.error(
      `[API POST /manage/set-war-clans] Error:`,
      error.message,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}