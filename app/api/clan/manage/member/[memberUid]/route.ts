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
// --- [PENAMBAHAN BARU: TAHAP 2.3] ---
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { createNotification } from '@/lib/firestore-admin/notifications';
// --- AKHIR PENAMBAHAN ---
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

    // 3. Dapatkan Profil Target (Member) dan Data Klan (Gunakan Admin SDK)
    //    [PERUBAHAN TAHAP 2.3] Ambil data klan untuk nama klan (notifikasi)
    const [memberProfile, managedClan] = await Promise.all([
      getUserProfileAdmin(memberUid),
      getManagedClanDataAdmin(clanId),
    ]);

    if (!memberProfile) {
      return NextResponse.json(
        { message: 'Profil pengguna target tidak ditemukan.' },
        { status: 404 }
      );
    }
    // [PENAMBAHAN BARU TAHAP 2.3]
    if (!managedClan) {
      return NextResponse.json(
        { message: 'Data klan yang dikelola tidak ditemukan.' },
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

    console.log(
      `[Kick Member] User ${memberUid} dikeluarkan dari Clan ${clanId} oleh ${changerUid}.`
    );

    // --- [IMPLEMENTASI TAHAP 2.3] ---
    // a. Kirim notifikasi ke anggota yang dikeluarkan untuk meminta ulasan
    const notifMessage = `Anda telah dikeluarkan dari ${managedClan.name}. Silakan berikan ulasan Anda tentang klan.`;
    // URL ini akan kita buat di TAHAP 2.4
    const notifUrl = `/reviews/new?type=clan&targetId=${clanId}&targetName=${encodeURIComponent(
      managedClan.name
    )}`;

    await createNotification(memberUid, notifMessage, notifUrl, 'review_request');

    // b. TODO (TAHAP 4.2): Catat di ClanHistory
    // await logClanHistory(
    //   memberUid,
    //   clanId,
    //   'kicked',
    //   `Dikeluarkan oleh ${changerProfile.displayName}`
    // );
    // --- [AKHIR IMPLEMENTASI TAHAP 2.3] ---

    return NextResponse.json(
      {
        message: `${memberProfile.displayName} berhasil dikeluarkan dari klan dan kini berstatus Free Agent. Notifikasi ulasan terkirim.`,
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