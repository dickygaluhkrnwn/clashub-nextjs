import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi
import { verifyUserClanRole } from '@/lib/firestore-admin/management'; // Untuk keamanan
import { admin } from '@/lib/firebase-admin'; // Untuk admin Firestore
import { COLLECTIONS } from '@/lib/firestore-collections'; // Untuk referensi koleksi
import { docToDataAdmin } from '@/lib/firestore-admin/utils'; // Untuk helper konversi

// --- [PERBAIKAN 1] ---
// Impor tipe baru dan helper untuk mengambil profil
import {
  JoinRequest,
  JoinRequestWithProfile,
  UserProfile,
  ClanRole, // <-- [PERBAIKAN BUG] Impor ClanRole
} from '@/lib/types';
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
// --- [AKHIR PERBAIKAN 1] ---

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
    // [PERBAIKAN BUG OTORISASI] Ganti string dengan Enum ClanRole
    const authResult = await verifyUserClanRole(uid, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!authResult.isAuthorized) {
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan Leader atau Co-Leader.' },
        { status: 403 }
      );
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

    // --- [PERBAIKAN 2] ---
    // Ambil data dasar request
    const baseRequests: JoinRequest[] = querySnapshot.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        docToDataAdmin<JoinRequest>(doc)
      )
      // --- [FIX ERROR TYPESCRIPT] ---
      // Filter 'null' untuk memastikan tipe data array adalah JoinRequest[]
      .filter((req): req is JoinRequest => req !== null);
    // --- [AKHIR FIX ERROR] ---

    // Ambil semua profil pemohon secara paralel
    const profilePromises = baseRequests.map((req) =>
      getUserProfileAdmin(req.requesterId)
    );
    const profiles = await Promise.all(profilePromises);

    // Gabungkan data request dengan data profil
    const requestsWithProfiles: JoinRequestWithProfile[] = baseRequests.map(
      (request, index) => {
        const profile = profiles[index];

        // Buat objek fallback jika profil tidak ditemukan
        // Ini untuk menjaga integritas data jika UserProfile terhapus
        // [PERBAIKAN BUG TIPE] Sesuaikan dengan Tipe UserProfile yang lengkap
        const fallbackProfile: UserProfile = {
          uid: request.requesterId,
          displayName: request.requesterName, // Gunakan nama dari request
          thLevel: request.requesterThLevel, // Gunakan TH from request
          email: null,
          isVerified: false,
          playerTag: '', // [FIX] Wajib string
          trophies: 0, // [FIX] Wajib number
          avatarUrl: '/images/placeholder-avatar.png', // Ini opsional
          role: undefined, // Opsional
          clanId: null, // Opsional
          clanTag: null, // Opsional
          clanName: null, // Opsional
        };

        return {
          ...request,
          requesterProfile: profile || fallbackProfile,
        };
      }
    );

    return NextResponse.json(requestsWithProfiles);
    // --- [AKHIR PERBAIKAN 2] ---
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
