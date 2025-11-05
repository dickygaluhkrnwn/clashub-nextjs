// File: app/api/clan/manage/[clanId]/sync/members/route.ts
// Deskripsi: TAHAP 1.1 - API Endpoint untuk sinkronisasi (rekonsiliasi) anggota klan.
//            Membandingkan data CoC API (real-time) dengan data Firestore (database kita).

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getUserProfileAdmin,
  getTeamMembersAdmin,
  updateMemberRole,
} from '@/lib/firestore-admin/users';
import { getManagedClanDataAdmin } from '@/lib/firestore-admin/clans';
import { getClanData } from '@/lib/coc-api';
import { CocClan, CocMember } from '@/lib/coc.types';
import { UserProfile } from '@/lib/clashub.types';
import { ClanRole } from '@/lib/enums';
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

/**
 * Helper function untuk memetakan role dari CoC API ke role internal Clashub
 */
function mapCocRoleToClashubRole(
  cocRole: 'leader' | 'coLeader' | 'admin' | 'member'
): UserProfile['role'] {
  switch (cocRole) {
    case 'leader':
      return 'Leader';
    case 'coLeader':
      return 'Co-Leader';
    case 'admin':
      return 'Elder';
    case 'member':
    default:
      return 'Member';
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { clanId: string } }
) {
  const { clanId } = params;
  if (!clanId) {
    return NextResponse.json({ error: 'Clan ID tidak ditemukan' }, { status: 400 });
  }

  try {
    // 1. Otentikasi & Otorisasi: Pastikan user adalah Leader/Co-Leader klan ini
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getUserProfileAdmin(sessionUser.uid);
    if (
      !userProfile ||
      userProfile.clanId !== clanId ||
      (userProfile.role !== 'Leader' && userProfile.role !== 'Co-Leader')
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak punya akses untuk melakukan ini' },
        { status: 403 }
      );
    }

    // 2. Dapatkan data klan (terutama clanTag)
    const managedClan = await getManagedClanDataAdmin(clanId);
    if (!managedClan || !managedClan.tag) {
      return NextResponse.json(
        { error: 'Klan yang dikelola tidak ditemukan' },
        { status: 404 }
      );
    }
    const clanTag = managedClan.tag;
    const clanName = managedClan.name;
    const encodedClanTag = encodeURIComponent(clanTag);

    console.log(`[Sync ${clanTag}] Memulai sinkronisasi anggota...`);

    // 3. Ambil Data dari CoC API (Real-time) dan Firestore (Database)
    const [cocClanResponse, firestoreMembers] = await Promise.all([
      getClanData(encodedClanTag),
      getTeamMembersAdmin(clanId),
    ]);

    // List A: Data Real-time dari CoC API
    const cocMembers: CocMember[] = cocClanResponse.memberList || [];
    const cocMemberTags = new Set(cocMembers.map((m) => m.tag));

    // List B: Data dari Database kita
    const firestoreMemberMap = new Map(
      firestoreMembers.map((m) => [m.playerTag, m])
    );

    const updatePromises: Promise<any>[] = [];
    let leaversProcessed = 0;
    let joinersProcessed = 0;
    let roleChangesProcessed = 0;
    let updatesSkipped = 0;

    // 4. Deteksi Leavers (Ada di Firestore, tapi TIDAK ada di CoC API)
    for (const firestoreMember of firestoreMembers) {
      if (!cocMemberTags.has(firestoreMember.playerTag)) {
        // --- LEAVER DETECTED ---
        console.log(
          `[Sync ${clanTag}] LEAVER: ${firestoreMember.displayName} (${firestoreMember.playerTag}) tidak lagi di klan.`
        );
        updatePromises.push(
          updateMemberRole(firestoreMember.uid, null, null, 'Free Agent')
        );
        leaversProcessed++;

        // TODO (TAHAP 1.4/2): Picu Notifikasi Ulasan di sini
        // (Membutuhkan lib/firestore-admin/notifications.ts)

        // TODO (TAHAP 4): Catat di ClanHistory di sini
        // (Membutuhkan lib/firestore-collections.ts -> CLAN_HISTORY)
      }
    }

    // 5. Deteksi Joiners & Perubahan Role (Ada di CoC API)
    for (const cocMember of cocMembers) {
      const firestoreUser = firestoreMemberMap.get(cocMember.tag);
      const newClashubRole = mapCocRoleToClashubRole(cocMember.role);

      if (firestoreUser) {
        // --- ANGGOTA YANG MASIH ADA ---
        // Cek jika role mereka di game berubah
        if (firestoreUser.role !== newClashubRole) {
          console.log(
            `[Sync ${clanTag}] ROLE CHANGE: ${firestoreUser.displayName} sekarang ${newClashubRole}.`
          );
          updatePromises.push(
            updateMemberRole(
              firestoreUser.uid,
              clanId,
              clanName,
              newClashubRole
            )
          );
          roleChangesProcessed++;
        } else {
          updatesSkipped++;
        }
      } else {
        // --- JOINER DETECTED ---
        // User ada di CoC API, tapi tidak ada di 'firestoreMemberMap' (List B)
        // Kita harus cari di koleksi 'users' utama berdasarkan 'playerTag'
        const userQuery = await adminFirestore
          .collection(COLLECTIONS.USERS)
          .where('playerTag', '==', cocMember.tag)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          // User ini terverifikasi di Clashub, kita update role-nya
          const existingUserDoc = userQuery.docs[0];
          const existingUserProfile = existingUserDoc.data() as UserProfile;

          console.log(
            `[Sync ${clanTag}] JOINER: ${existingUserProfile.displayName} (${cocMember.tag}) bergabung atau join ulang.`
          );

          updatePromises.push(
            updateMemberRole(
              existingUserProfile.uid,
              clanId,
              clanName,
              newClashubRole
            )
          );
          joinersProcessed++;

          // TODO (TAHAP 4): Catat di ClanHistory di sini
        } else {
          // User ini join klan, TAPI tidak terverifikasi di Clashub.
          console.warn(
            `[Sync ${clanTag}] SKIP: ${cocMember.name} (${cocMember.tag}) join klan, tapi tidak punya akun Clashub terverifikasi.`
          );
        }
      }
    }

    // 6. Jalankan semua update database
    await Promise.all(updatePromises);

    console.log(`[Sync ${clanTag}] Sinkronisasi selesai. Leavers: ${leaversProcessed}, Joiners: ${joinersProcessed}, Role Changes: ${roleChangesProcessed}, Skipped: ${updatesSkipped}.`);

    return NextResponse.json(
      {
        message: 'Sinkronisasi anggota selesai.',
        summary: {
          leavers: leaversProcessed,
          joiners: joinersProcessed,
          roleChanges: roleChangesProcessed,
          skipped: updatesSkipped,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Sync Members API Error]`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}