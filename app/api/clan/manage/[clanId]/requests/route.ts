import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi
import { verifyUserClanRole } from '@/lib/firestore-admin/management'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin'; // Untuk admin Firestore
import { COLLECTIONS } from '@/lib/firestore-collections'; // Untuk referensi koleksi
import { docToDataAdmin } from '@/lib/firestore-admin/utils'; // Untuk helper konversi
import { JoinRequest } from '@/lib/types';

/**
 * @route GET /api/clan/manage/[clanId]/requests
 * @description Mengambil daftar JoinRequest yang 'pending' untuk sebuah klan.
 * @access Terautentikasi (HANYA Leader/Co-Leader)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.uid) {
      return NextResponse.json(
        { message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const uid = sessionUser.uid;
    const { clanId } = params;

    if (!clanId) {
      return NextResponse.json(
        { message: 'Clan ID diperlukan' },
        { status: 400 }
      );
    }

    // Keamanan: Verifikasi bahwa pengguna adalah Manager (Leader/Co-Leader)
    const authResult = await verifyUserClanRole(uid, clanId, [
      'Leader',
      'Co-Leader',
    ]);

    if (!authResult.isAuthorized) {
      // --- PERBAIKAN ---
      // Mengganti authResult.message dengan pesan error statis
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan Leader atau Co-Leader.' },
        { status: 403 }
      );
      // --- AKHIR PERBAIKAN ---
    }

    // Logika Utama: Ambil semua JoinRequest yang statusnya 'pending'
    const db = admin.firestore();
    const requestsRef = db.collection(COLLECTIONS.JOIN_REQUESTS);
    const q = requestsRef
      .where('clanId', '==', clanId)
      .where('status', '==', 'pending');
    
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const requests = querySnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        docToDataAdmin<JoinRequest>(doc)
    );

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil permintaan gabung: ${errorMessage}` },
      { status: 500 }
    );
  }
}

