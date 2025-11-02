import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
// --- PERUBAHAN (TAHAP 1.1) ---
// Impor dari file management.ts dan users.ts yang baru
import {
  logRoleChange,
  verifyUserClanRole, // <-- Impor fungsi keamanan baru
} from '@/lib/firestore-admin/management';
import {
  getUserProfileAdmin,
  updateMemberRole, // <-- PERBAIKAN: Impor 'updateMemberRole' dari 'users.ts'
} from '@/lib/firestore-admin/users'; // <-- Gunakan Admin SDK
// --- AKHIR PERUBAHAN ---
import { ClanRole, UserProfile } from '@/lib/types';

/**
 * Endpoint PUT untuk Mengubah Role Internal Clashub Anggota Klan.
 * PATH: /api/clan/manage/member/[memberUid]/role
 * Diakses oleh Leader/Co-Leader dari ManagedClan.
 */
export async function PUT(
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
    const {
      newClashubRole, // Role Clashub Baru: 'Leader', 'Co-Leader', 'Elder', 'Member', 'Free Agent'
      clanId,
      oldRoleCoC, // Role CoC LAMA (dari cache/profile target)
      newRoleCoC, // Role CoC BARU (yang disarankan/diminta)
    } = body as {
      newClashubRole: UserProfile['role'];
      clanId: string;
      oldRoleCoC: ClanRole;
      newRoleCoC: ClanRole;
    };

    if (!newClashubRole || !clanId || !oldRoleCoC || !newRoleCoC) {
      return NextResponse.json(
        { message: 'Data (role, clanId, oldRoleCoC, newRoleCoC) wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. VERIFIKASI KEAMANAN (TAHAP 1.1)
    // Mengganti blok validasi manual dengan fungsi 'verifyUserClanRole'
    const { isAuthorized, userProfile: changerProfile } =
      await verifyUserClanRole(changerUid, clanId);

    if (!isAuthorized || !changerProfile) {
      // changerProfile juga dicek untuk memastikan tidak null
      return NextResponse.json(
        {
          message:
            'Anda tidak memiliki izin (Leader/Co-Leader) untuk mengelola klan ini.',
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

    // 4. Validasi Aturan Bisnis (Business Logic)
    const changerRole = changerProfile.role;
    const targetRole = memberProfile.role;

    // a. Cek apakah target adalah anggota klan yang sama
    if (memberProfile.clanId !== clanId) {
      return NextResponse.json(
        { message: 'Pemain target bukan anggota klan ini.' },
        { status: 403 }
      );
    }

    // b. Aturan Bisnis Kunci: Leader vs Co-Leader
    // (Logika ini tetap relevan dan harus dipertahankan)
    if (changerRole === 'Co-Leader' && targetRole === 'Leader') {
      return NextResponse.json(
        { message: 'Co-Leader tidak dapat mengubah peran Leader.' },
        { status: 403 }
      );
    }
    // Co-Leader TIDAK boleh mengubah Co-Leader (Kecuali dirinya sendiri, yang tidak diizinkan oleh UI)
    if (
      changerRole === 'Co-Leader' &&
      targetRole === 'Co-Leader' &&
      changerUid !== memberUid
    ) {
      return NextResponse.json(
        { message: 'Co-Leader hanya dapat mengubah peran Elder atau Member.' },
        { status: 403 }
      );
    }

    // c. Leader TIDAK boleh mengubah dirinya sendiri menjadi non-Leader (kecuali transfer kepemilikan, yang merupakan endpoint terpisah)
    if (
      changerUid === memberUid &&
      targetRole === 'Leader' &&
      newClashubRole !== 'Leader'
    ) {
      return NextResponse.json(
        {
          message:
            'Peran Leader hanya dapat diubah melalui fitur Transfer Kepemilikan.',
        },
        { status: 403 }
      );
    }

    // 5. Update Role di UserProfile (Clashub Role)
    await updateMemberRole(
      memberUid,
      clanId,
      memberProfile.clanName || 'Nama Klan', // Pertahankan nama klan internal
      newClashubRole
    );

    // 6. Catat Log Perubahan Role (CoC Role)
    // Log ini mencatat perubahan Role CoC (Leader, Co-Leader, Elder, Member)
    // yang relevan untuk logika Aggregators.js (reset penalti).
    const roleLogData = {
      playerTag: memberProfile.playerTag || 'N/A',
      playerName: memberProfile.inGameName || memberProfile.displayName,
      memberUid: memberUid,
      oldRoleCoC: oldRoleCoC,
      newRoleCoC: newRoleCoC,
      changedByUid: changerUid,
    };
    await logRoleChange(clanId, roleLogData);

    return NextResponse.json(
      {
        message: `Peran ${memberProfile.displayName} berhasil diubah menjadi ${newClashubRole}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error /clan/manage/member/[memberUid]/role:', error);
    return NextResponse.json(
      {
        message:
          'Gagal mengubah peran anggota: ' +
          (error instanceof Error ? error.message : 'Kesalahan server'),
      },
      { status: 500 }
    );
  }
}

