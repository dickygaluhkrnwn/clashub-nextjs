import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
// --- PERUBAHAN (TAHAP 1.1) ---
// Impor fungsi keamanan baru dari management.ts
import { verifyUserClanRole } from '@/lib/firestore-admin/management';
// Impor fungsi user dari users.ts
import {
  getUserProfileAdmin,
  updateMemberRole,
} from '@/lib/firestore-admin/users';
// --- AKHIR PERUBAHAN ---
import { UserProfile } from '@/lib/types';

/**
 * Endpoint DELETE untuk Mengeluarkan (Kick) Anggota dari Klan yang Dikelola.
 * PATH: /api/clan/manage/member/[memberUid]
 * Diakses oleh Leader/Co-Leader dari ManagedClan.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { memberUid: string } }
) {
  const { memberUid } = params;

  // 1. Dapatkan Sesi Pengguna (Changer)
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: 'Tidak Terotentikasi.' }, { status: 401 });
  }
  const changerUid = sessionUser.uid;

  try {
    const body = await request.json();
    const { clanId } = body as { clanId: string }; // clanId diperlukan untuk validasi otorisasi

    if (!clanId) {
      return NextResponse.json(
        { message: 'ID Klan (clanId) wajib disertakan.' },
        { status: 400 }
      );
    }

    // 2. VERIFIKASI KEAMANAN (TAHAP 1.1)
    // Ganti validasi manual dengan fungsi terpusat
    const { isAuthorized, userProfile: changerProfile } =
      await verifyUserClanRole(changerUid, clanId);

    if (!isAuthorized || !changerProfile) {
      return NextResponse.json(
        {
          message:
            'Anda tidak memiliki izin (Leader/Co-Leader) untuk melakukan aksi ini.',
        },
        { status: 403 }
      );
    }

    // 3. Dapatkan Profil Target (Member) - Gunakan Admin SDK
    const memberProfile = await getUserProfileAdmin(memberUid);

    if (!memberProfile) {
      return NextResponse.json(
        { message: 'Profil pengguna target tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 4. Validasi Otorisasi dan Integritas Klan
    const changerRole = changerProfile.role;
    const targetRole = memberProfile.role;

    // a. Cek apakah target adalah anggota klan yang sama
    if (memberProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Pemain target bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // b. Aturan Bisnis Kunci: Larang Kick Diri Sendiri atau Leader
    if (changerUid === memberUid) {
      return NextResponse.json(
        {
          message:
            'Anda tidak dapat mengeluarkan diri Anda sendiri. Gunakan fitur keluar klan jika tersedia.',
        },
        { status: 403 }
      );
    }
    if (targetRole === 'Leader') {
      return NextResponse.json(
        {
          message:
            'Leader tidak dapat dikeluarkan melalui fitur ini. Harus melalui Transfer Kepemilikan.',
        },
        { status: 403 }
      );
    }
    // Co-Leader TIDAK boleh kick Co-Leader lain
    if (changerRole === 'Co-Leader' && targetRole === 'Co-Leader') {
      return NextResponse.json(
        { message: 'Co-Leader hanya dapat mengeluarkan Elder atau Member.' },
        { status: 403 }
      );
    }

    // 5. Update Role di UserProfile untuk Kick
    // Menetapkan clanId dan clanName menjadi null, dan role menjadi 'Free Agent'
    await updateMemberRole(
      memberUid,
      null, // clanId = null (Kick/Keluar)
      null, // clanName = null
      'Free Agent'
    );

    // TODO: Implementasikan notifikasi ke anggota yang dikeluarkan (optional)
    console.log(
      `[Kick Member] User ${memberUid} dikeluarkan dari Clan ${clanId} oleh ${changerUid}.`
    );

    return NextResponse.json(
      {
        message: `${memberProfile.displayName} berhasil dikeluarkan dari klan dan kini berstatus Free Agent.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error /clan/manage/member/[memberUid] (DELETE):', error);
    return NextResponse.json(
      {
        message:
          'Gagal mengeluarkan anggota: ' +
          (error instanceof Error ? error.message : 'Kesalahan server'),
      },
      { status: 500 }
    );
  }
}
