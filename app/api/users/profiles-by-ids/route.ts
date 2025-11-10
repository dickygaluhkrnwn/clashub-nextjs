// File: app/api/users/profiles-by-ids/route.ts
// Deskripsi: [FIXED] API route untuk mengambil data profil
// beberapa user berdasarkan array UID. Dibutuhkan oleh StaffManager.tsx.

import { NextResponse } from 'next/server';
// [PERBAIKAN] Ganti 'verifyCookie' dengan 'getSessionUser' sesuai lib/server-auth.ts
import { getSessionUser } from '@/lib/server-auth';
import { getUserProfilesByIdsAdmin } from '@/lib/firestore-admin/users';
import { UserProfile } from '@/lib/types'; // Impor tipe UserProfile

export async function POST(request: Request) {
  // 1. Verifikasi Autentikasi Pengguna
  // [PERBAIKAN] Panggil getSessionUser() dan simpan hasilnya di 'user'
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Akses tidak diizinkan. Silakan login.' },
      { status: 401 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error('[API /api/users/profiles-by-ids] Body JSON tidak valid:', error);
    return NextResponse.json({ error: 'Body JSON tidak valid.' }, { status: 400 });
  }

  const { uids } = body;

  // 2. Validasi Input
  if (!Array.isArray(uids) || uids.length === 0) {
    return NextResponse.json(
      { error: 'UIDs harus berupa array dan tidak boleh kosong.' },
      { status: 400 },
    );
  }

  try {
    // 3. Panggil fungsi Firestore Admin yang baru kita buat
    const profilesData = await getUserProfilesByIdsAdmin(uids as string[]);

    // 4. Filter data (kirim hanya yang diperlukan oleh StaffManager.tsx)
    // Ini sesuai dengan tipe 'StaffProfile' di StaffManager.tsx
    const profiles = profilesData.map((p: UserProfile) => ({
      uid: p.uid,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      email: p.email,
    }));

    // 5. Kembalikan data sebagai JSON
    return NextResponse.json({ profiles });
  } catch (error: any) {
    console.error(
      '[API /api/users/profiles-by-ids] Gagal mengambil profil:',
      error,
    );
    return NextResponse.json(
      { error: 'Gagal mengambil data profil staf: ' + error.message },
      { status: 500 },
    );
  }
}