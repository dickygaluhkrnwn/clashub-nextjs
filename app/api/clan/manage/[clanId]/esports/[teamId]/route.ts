import { NextResponse, NextRequest } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';
import { verifyUserClanRole } from '@/lib/firestore-admin/management';
// [EDIT] Impor helper baru
import { updateUserClashubRole } from '@/lib/firestore-admin/users';
// [PERBAIKAN] Hapus 'ClanRole' dari impor ini, dan tambahkan 'FirestoreDocument'
import { EsportsTeam, FirestoreDocument } from '@/lib/clashub.types';
import { ClanRole as ClanRoleEnum } from '@/lib/enums'; // Impor Enum sebagai 'ClanRoleEnum' untuk menghindari konflik nama

/**
 * @function getTeamDocRef
 * @description Helper untuk mendapatkan referensi dokumen tim E-Sports.
 */
function getTeamDocRef(clanId: string, teamId: string) {
  return adminFirestore
    .collection(COLLECTIONS.MANAGED_CLANS)
    .doc(clanId)
    .collection(COLLECTIONS.ESPORTS_TEAMS)
    .doc(teamId);
}

/**
 * @function authorizeManager
 * @description Helper gabungan untuk Otentikasi (Token) dan Otorisasi (Peran Manajer).
 */
async function authorizeManager(request: NextRequest, clanId: string) {
  let uid: string;
  // 1. Otentikasi (AuthN) - Verifikasi Token
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        error: NextResponse.json(
          { message: 'Token otentikasi tidak ditemukan.' },
          { status: 401 }
        ),
        uid: null,
      };
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (error) {
    console.error('Error verifikasi token:', error);
    return {
      error: NextResponse.json(
        { message: 'Otentikasi gagal. Token tidak valid.' },
        { status: 401 }
      ),
      uid: null,
    };
  }

  // 2. Otorisasi (AuthZ) - Verifikasi Peran Manajer
  try {
    const { isAuthorized } = await verifyUserClanRole(uid, clanId, [
      ClanRoleEnum.LEADER,
      ClanRoleEnum.CO_LEADER,
    ]);

    if (!isAuthorized) {
      return {
        error: NextResponse.json(
          {
            message:
              'Akses ditolak. Anda harus menjadi Leader atau Co-Leader klan ini.',
          },
          { status: 403 }
        ),
        uid: null,
      };
    }
    // Sukses
    return { uid: uid, error: null };
  } catch (error) {
    console.error('Error verifikasi peran:', error);
    return {
      error: NextResponse.json(
        { message: 'Gagal memverifikasi peran pengguna.' },
        { status: 500 }
      ),
      uid: null,
    };
  }
}

/**
 * @handler GET /api/clan/manage/[clanId]/esports/[teamId]
 * @description Mengambil detail satu tim E-Sports (Hanya Manajer).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clanId: string; teamId: string } }
) {
  const { clanId, teamId } = params;

  // 1. Autentikasi & Otorisasi
  const { error } = await authorizeManager(request, clanId);
  if (error) return error;

  try {
    // 2. Ambil Dokumen
    const docRef = getTeamDocRef(clanId, teamId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: 'Tim E-Sports tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. Kembalikan Data
    const teamData = {
      id: docSnap.id,
      ...docSnap.data(),
    } as FirestoreDocument<EsportsTeam>; // <-- Error TS2304 (Cannot find name) sekarang beres
    return NextResponse.json(teamData, { status: 200 });
  } catch (error) {
    console.error(`Error (GET /esports/${teamId}):`, error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    );
  }
}

/**
 * @handler PUT /api/clan/manage/[clanId]/esports/[teamId]
 * @description Memperbarui data tim E-Sports (Nama, Leader, atau Anggota).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { clanId: string; teamId: string } }
) {
  const { clanId, teamId } = params;

  // 1. Autentikasi & Otorisasi
  const { error } = await authorizeManager(request, clanId);
  if (error) return error;

  try {
    // 2. Ambil Dokumen & Cek Keberadaan
    const docRef = getTeamDocRef(clanId, teamId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: 'Tim E-Sports tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. Validasi Body Request
    const body = await request.json();
    const {
      teamName,
      teamLeaderUid, // <-- [EDIT] Tambahkan teamLeaderUid
      memberUids,
    }: {
      teamName: string;
      teamLeaderUid: string; // <-- [EDIT] Tambahkan teamLeaderUid
      memberUids: string[]; // Di frontend ini adalah tuple, di sini kita terima sebagai array
    } = body;

    if (!teamName || !teamName.trim()) {
      return NextResponse.json(
        { message: 'Nama tim tidak boleh kosong.' },
        { status: 400 }
      );
    }
    // [EDIT] Tambahkan validasi untuk teamLeaderUid
    if (!teamLeaderUid) {
      return NextResponse.json(
        { message: 'Team leader UID tidak boleh kosong.' },
        { status: 400 }
      );
    }
    if (!Array.isArray(memberUids) || memberUids.length !== 5) {
      return NextResponse.json(
        { message: 'Tim harus terdiri dari 5 anggota.' },
        { status: 400 }
      );
    }
    if (memberUids.some((uid) => typeof uid !== 'string')) {
      return NextResponse.json(
        { message: 'Format memberUids tidak valid.' },
        { status: 400 }
      );
    }

    // 4. Buat Payload Update (Partial, hanya field yang diizinkan)
    const updatePayload: Partial<Omit<EsportsTeam, 'id' | 'clanId'>> = {
      teamName: teamName.trim(),
      teamLeaderUid: teamLeaderUid, // <-- [EDIT] Tambahkan teamLeaderUid
      memberUids: [
        // Konversi ke tuple
        memberUids[0],
        memberUids[1],
        memberUids[2],
        memberUids[3],
        memberUids[4],
      ],
    };

    // 5. Update Dokumen
    await docRef.update(updatePayload);

    // [BARU] TAHAP 6: Promosikan Leader Tim ke Co-Leader (sesuai permintaan)
    try {
      await updateUserClashubRole(teamLeaderUid, 'Co-Leader');

      // Jika KEDUANYA sukses (Update Tim & Promosi Role)
      return NextResponse.json(
        {
          message:
            'Tim E-Sports berhasil diperbarui! Leader tim telah dipromosikan ke Co-Leader.',
        },
        { status: 200 }
      );
    } catch (roleError) {
      // Jika Update Tim SUKSES, tapi Promosi GAGAL
      console.error(
        `[PUT /esports/${teamId}] Gagal mempromosikan role untuk UID: ${teamLeaderUid}`,
        roleError
      );
      // Kembalikan 200 (karena tim TETAP diupdate), tapi dengan pesan peringatan
      return NextResponse.json(
        {
          message:
            'Tim berhasil diperbarui, TAPI gagal mempromosikan leader tim. Harap update role secara manual.',
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error(`Error (PUT /esports/${teamId}):`, error);
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
 * @handler DELETE /api/clan/manage/[clanId]/esports/[teamId]
 * @description Menghapus tim E-Sports.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clanId: string; teamId: string } }
) {
  const { clanId, teamId } = params;

  // 1. Autentikasi & Otorisasi
  const { error } = await authorizeManager(request, clanId);
  if (error) return error;

  try {
    // 2. Ambil Dokumen & Cek Keberadaan
    const docRef = getTeamDocRef(clanId, teamId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: 'Tim E-Sports tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 3. Hapus Dokumen
    await docRef.delete();

    return NextResponse.json(
      { message: 'Tim E-Sports berhasil dihapus.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error (DELETE /esports/${teamId}):`, error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    );
  }
}