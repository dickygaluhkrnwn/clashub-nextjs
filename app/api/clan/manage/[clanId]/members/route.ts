import { NextResponse } from 'next/server';
// REFAKTOR: Ganti 'auth' menjadi 'getSessionUser'
import { getSessionUser } from '@/lib/server-auth'; // Untuk otentikasi
// REFAKTOR: Ganti verifyUserClanRole dengan getUserProfileAdmin
import { getUserProfileAdmin } from '@/lib/firestore-admin/users';
import { admin } from '@/lib/firebase-admin'; // REFAKTOR: Ganti 'adminDB' menjadi 'admin'
import { COLLECTIONS } from '@/lib/firestore-collections'; // REFAKTOR: Impor COLLECTIONS
// REFAKTOR: Perbaiki nama fungsi impor
import { docToDataAdmin } from '@/lib/firestore-admin/utils'; // Untuk helper konversi
// REFAKTOR: Hapus 'query', 'where', 'getDocs' karena kita akan pakai sintaks Admin SDK
import { UserProfile } from '@/lib/types';

/**
 * @route GET /api/clan/manage/[clanId]/members
 * @description Mengambil daftar internal UserProfile anggota klan (dari koleksi 'users').
 * @access Terautentikasi (Anggota Klan)
 */
export async function GET(
  request: Request,
  { params }: { params: { clanId: string } }
) {
  try {
    // REFAKTOR: Gunakan 'getSessionUser'
    const sessionUser = await getSessionUser();
    // REFAKTOR: Cek 'sessionUser.uid'
    if (!sessionUser?.uid) {
      return NextResponse.json(
        { message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    // REFAKTOR: Ambil uid dari 'sessionUser'
    const uid = sessionUser.uid;
    const { clanId } = params;

    if (!clanId) {
      return NextResponse.json(
        { message: 'Clan ID diperlukan' },
        { status: 400 }
      );
    }

    // REFAKTOR: Logika Keamanan
    // Ganti 'verifyUserClanRole' dengan 'getUserProfileAdmin'
    // Cukup periksa apakah pengguna yang diautentikasi adalah anggota klan yang diminta.
    const userProfile = await getUserProfileAdmin(uid);
    if (!userProfile || userProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Akses ditolak: Anda bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // Logika Utama: Ambil semua UserProfile yang clanId-nya cocok
    // REFAKTOR: Gunakan 'admin.firestore().collection(...)'
    const db = admin.firestore();
    const usersRef = db.collection(COLLECTIONS.USERS);
    const q = usersRef.where('clanId', '==', clanId);
    const querySnapshot = await q.get(); // REFAKTOR: Gunakan .get()

    if (querySnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    // REFAKTOR: Beri tipe pada 'doc' dan ganti nama fungsi
    const members = querySnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        docToDataAdmin<UserProfile>(doc) // REFAKTOR: Ganti nama fungsi
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching clan members:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan server';
    return NextResponse.json(
      { message: `Gagal mengambil anggota klan: ${errorMessage}` },
      { status: 500 }
    );
  }
}

