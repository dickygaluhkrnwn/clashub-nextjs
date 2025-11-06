// File: app/api/clan/manage/leave/route.ts
// Deskripsi: TAHAP 2.3 - API Endpoint untuk anggota keluar (leave) dari klan.
//            Ini akan mengubah status user menjadi 'Free Agent' dan memicu notifikasi ulasan.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getUserProfileAdmin,
  updateMemberRole,
} from '@/lib/firestore-admin/users';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { createNotification } from '@/lib/firestore-admin/notifications';
import { UserProfile } from '@/lib/types';

/**
 * @handler POST
 * Endpoint untuk Anggota keluar (Leave) dari Klan yang Dikelola.
 * PATH: /api/clan/manage/leave
 * Diakses oleh anggota klan yang sedang login.
 */
export async function POST(request: NextRequest) {
  // 1. Dapatkan Sesi Pengguna (User yang akan keluar)
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ message: 'Tidak Terotentikasi.' }, { status: 401 });
  }
  const leaverUid = sessionUser.uid;

  try {
    // 2. Dapatkan clanId dari body
    // User harus mengirimkan ID klan yang ingin mereka tinggalkan
    const body = await request.json();
    const { clanId } = body as { clanId: string };

    if (!clanId) {
      return NextResponse.json(
        { message: 'ID Klan (clanId) wajib disertakan.' },
        { status: 400 }
      );
    }

    // 3. Dapatkan Profil Target (Leaver) dan Data Klan (Gunakan Admin SDK)
    const [leaverProfile, managedClan] = await Promise.all([
      getUserProfileAdmin(leaverUid),
      getManagedClanDataAdmin(clanId),
    ]);

    if (!leaverProfile) {
      return NextResponse.json(
        { message: 'Profil pengguna Anda tidak ditemukan.' },
        { status: 404 }
      );
    }
    if (!managedClan) {
      return NextResponse.json(
        { message: 'Data klan yang dikelola tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 4. Validasi Keamanan
    // a. Cek apakah user adalah anggota klan yang sama
    if (leaverProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Anda bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // b. Aturan Bisnis Kunci: Leader tidak bisa keluar
    if (leaverProfile.role === 'Leader') {
      return NextResponse.json(
        {
          message:
            'Leader tidak bisa keluar. Anda harus mentransfer kepemilikan klan terlebih dahulu.',
        },
        { status: 403 }
      );
    }

    // 5. Update Role di UserProfile untuk Keluar (Leave)
    // Menetapkan clanId dan clanName menjadi null, dan role menjadi 'Free Agent'
    await updateMemberRole(
      leaverUid,
      null, // clanId = null (Kick/Keluar)
      null, // clanName = null
      'Free Agent'
    );

    console.log(
      `[Leave Clan] User ${leaverUid} telah keluar dari Clan ${clanId}.`
    );

    // --- [IMPLEMENTASI TAHAP 2.3] ---
    // a. Kirim notifikasi ke user yang baru saja keluar untuk meminta ulasan
    const notifMessage = `Anda telah keluar dari ${managedClan.name}. Silakan berikan ulasan Anda tentang klan.`;
    // URL ini akan kita buat di TAHAP 2.4
    const notifUrl = `/reviews/new?type=clan&targetId=${clanId}&targetName=${encodeURIComponent(
      managedClan.name
    )}`;

    await createNotification(
      leaverUid,
      notifMessage,
      notifUrl,
      'review_request'
    );

    // b. TODO (TAHAP 4.2): Catat di ClanHistory
    // await logClanHistory(
    //   leaverUid,
    //   clanId,
    //   'left',
    //   `Keluar dari klan atas kemauan sendiri.`
    // );
    // --- [AKHIR IMPLEMENTASI TAHAP 2.3] ---

    return NextResponse.json(
      {
        message: `Anda berhasil keluar dari ${managedClan.name} dan kini berstatus Free Agent.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error /api/clan/manage/leave (POST):', error);
    return NextResponse.json(
      {
        message:
          'Gagal keluar klan: ' +
          (error instanceof Error ? error.message : 'Kesalahan server'),
      },
      { status: 500 }
    );
  }
}