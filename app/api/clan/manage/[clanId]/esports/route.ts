import { NextResponse, NextRequest } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { verifyUserClanRole } from '@/lib/firestore-admin/management';
// [EDIT] Impor helper baru dari users.ts
import { updateUserClashubRole } from '@/lib/firestore-admin/users';
import { EsportsTeam } from '@/lib/clashub.types'; // <-- ClanRole dihapus dari sini
import { ClanRole } from '@/lib/enums'; // <-- [PERBAIKAN] Impor ClanRole dari lib/enums.ts
import { FieldValue } from 'firebase-admin/firestore'; // Diperlukan untuk timestamp

/**
 * @handler POST /api/clan/manage/[clanId]/esports
 * @description Membuat tim E-Sports baru (5v5) di dalam sebuah ManagedClan.
 * Hanya bisa dilakukan oleh Leader atau Co-Leader klan tersebut.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clanId: string } }
) {
  const { clanId } = params;
  let uid: string;

  // 1. Otentikasi Pengguna (Verifikasi Token)
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token otentikasi tidak ditemukan.' },
        { status: 401 }
      );
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error) {
    console.error('Error verifikasi token:', error);
    return NextResponse.json(
      { message: 'Otentikasi gagal. Token tidak valid.' },
      { status: 401 }
    );
  }

  // 2. Otorisasi Peran (Pastikan user adalah Leader/Co-Leader)
  try {
    const { isAuthorized, userProfile } = await verifyUserClanRole(uid, clanId, [
      ClanRole.LEADER,
      ClanRole.CO_LEADER,
    ]);

    if (!isAuthorized || !userProfile) {
      return NextResponse.json(
        {
          message:
            'Akses ditolak. Anda harus menjadi Leader atau Co-Leader klan ini.',
        },
        { status: 403 }
      );
    }

    // 3. Validasi Body Request
    const body = await request.json();
    const {
      teamName,
      teamLeaderUid,
      memberUids,
    }: {
      teamName: string;
      teamLeaderUid: string;
      memberUids: string[]; // Di frontend ini adalah tuple, di sini kita terima sebagai array
    } = body;

    if (!teamName || !teamName.trim()) {
      return NextResponse.json(
        { message: 'Nama tim tidak boleh kosong.' },
        { status: 400 }
      );
    }
    if (!teamLeaderUid) {
      return NextResponse.json(
        { message: 'Team leader UID tidak ditemukan.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(memberUids) || memberUids.length !== 5) {
      return NextResponse.json(
        { message: 'Tim harus terdiri dari 5 anggota.' },
        { status: 400 }
      );
    }

    // Pastikan semua UID adalah string
    if (memberUids.some((uid) => typeof uid !== 'string')) {
      return NextResponse.json(
        { message: 'Format memberUids tidak valid.' },
        { status: 400 }
      );
    }

    // 4. Buat Objek Tim Baru (Sesuai Tipe EsportsTeam)
    // Tipe EsportsTeam di clashub.types.ts mengharapkan tuple [string, string, string, string, string]
    const newTeamData: Omit<EsportsTeam, 'id'> = {
      teamName: teamName.trim(),
      teamLeaderUid: teamLeaderUid,
      clanId: clanId,
      // Konversi array 5 string menjadi tuple 5 string
      memberUids: [
        memberUids[0],
        memberUids[1],
        memberUids[2],
        memberUids[3],
        memberUids[4],
      ],
      // Kita bisa tambahkan timestamp jika perlu
      // createdAt: FieldValue.serverTimestamp(),
    };

    // 5. Simpan ke Firestore
    // Path: /managedClans/{clanId}/esportsTeams
    const teamsCollectionRef = adminFirestore
      .collection(COLLECTIONS.MANAGED_CLANS)
      .doc(clanId)
      .collection(COLLECTIONS.ESPORTS_TEAMS);

    const docRef = await teamsCollectionRef.add(newTeamData);

    // [BARU] TAHAP 6: Promosikan Leader Tim ke Co-Leader (sesuai permintaan)
    try {
      // Kita gunakan 'Co-Leader' langsung sebagai string,
      // karena helper kita (updateUserClashubRole) mengharapkan string literal
      await updateUserClashubRole(teamLeaderUid, 'Co-Leader');

      // Jika KEDUANYA sukses (Buat Tim & Promosi Role)
      return NextResponse.json(
        {
          message:
            'Tim E-Sports berhasil dibuat! Leader tim telah dipromosikan ke Co-Leader.',
          teamId: docRef.id,
        },
        { status: 201 } // 201 Created
      );
    } catch (roleError) {
      // Jika Buat Tim SUKSES, tapi Promosi GAGAL
      console.error(
        `[POST /esports] Gagal mempromosikan role untuk UID: ${teamLeaderUid}`,
        roleError
      );
      // Kembalikan 201 (karena tim TETAP dibuat), tapi dengan pesan peringatan
      return NextResponse.json(
        {
          message:
            'Tim berhasil dibuat, TAPI gagal mempromosikan leader tim. Harap update role secara manual.',
          teamId: docRef.id,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error (POST /esports):', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Body JSON tidak valid.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    );
  }
}

/**
 * @handler GET /api/clan/manage/[clanId]/esports
 * @description Mengambil daftar tim E-Sports untuk klan (akan diimplementasikan nanti
 * jika diperlukan, saat ini 'EsportsTabContent' menggunakan onSnapshot sisi klien).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clanId: string } }
) {
  // Implementasi GET bisa ditambahkan di sini jika diperlukan
  // Untuk saat ini, onSnapshot di klien sudah menangani pengambilan data.
  return NextResponse.json(
    {
      message:
        'Endpoint ini saat ini hanya mendukung POST. Gunakan listener onSnapshot di klien untuk GET.',
    },
    { status: 405 } // 405 Method Not Allowed
  );
}