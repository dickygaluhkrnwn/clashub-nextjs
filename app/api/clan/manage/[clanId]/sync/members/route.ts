// File: app/api/clan/manage/[clanId]/sync/members/route.ts
// Deskripsi: TAHAP FINAL - API Endpoint untuk sinkronisasi (rekonsiliasi) anggota klan.
//            Memicu notifikasi ulasan dan mencatat riwayat klan.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server-auth';
import {
  getUserProfileAdmin,
  getTeamMembersAdmin, // [Update] Digunakan untuk notifikasi ke anggota yang tinggal
  updateMemberRole,
  // [BARU: Fase 1 & 3] Impor helper yang kita buat
  getUserProfileByPlayerTagAdmin,
  recordPlayerClanLeave,
  recordPlayerClanJoin,
} from '@/lib/firestore-admin/users';
import {
  getManagedClanDataAdmin,
  // [BARU: Fase 1] Impor helper snapshot
  updateManagedClanMemberList,
} from '@/lib/firestore-admin/clans';
// [BARU: Fase 3] Impor helper notifikasi
import { createNotification } from '@/lib/firestore-admin/notifications';
import { getClanData } from '@/lib/coc-api';
import { CocMember } from '@/lib/coc.types';
import { UserProfile } from '@/lib/clashub.types';
import { ManagerRole, StandardMemberRole } from '@/lib/enums';
// [BARU: Fase 2.2] Impor admin untuk query (meskipun helper sudah ada)
import { adminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore-collections';

/**
 * Helper function untuk memetakan role dari CoC API ke role internal Clashub
 */
function mapCocRoleToClashubRole(
  cocRole: 'leader' | 'coLeader' | 'admin' | 'member',
): ManagerRole | StandardMemberRole {
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
  { params }: { params: { clanId: string } },
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
        { status: 403 },
      );
    }

    // 2. Dapatkan data klan (terutama clanTag dan snapshot memberList)
    const managedClan = await getManagedClanDataAdmin(clanId);
    if (!managedClan || !managedClan.tag) {
      return NextResponse.json(
        { error: 'Klan yang dikelola tidak ditemukan' },
        { status: 404 },
      );
    }
    const clanTag = managedClan.tag;
    const clanName = managedClan.name;
    const encodedClanTag = encodeURIComponent(clanTag);

    console.log(`[Sync ${clanTag}] Memulai sinkronisasi anggota...`);

    // 3. Ambil Data
    // List A: Data Real-time dari CoC API
    // List B: Snapshot lama dari database kita (ManagedClan)
    // List C: Daftar profil user Clashub yang *saat ini* ada di klan (untuk notifikasi)
    const [cocClanResponse, remainingMemberProfiles] = await Promise.all([
      getClanData(encodedClanTag),
      getTeamMembersAdmin(clanId), // List C
    ]);

    // List A (Real-time API)
    const cocMembers: CocMember[] = cocClanResponse.memberList || [];
    const cocMemberTags = new Set(cocMembers.map((m) => m.tag));

    // List B (Snapshot Lama)
    // [PERBAIKAN LOGIKA] Gunakan field 'memberList' dari 'managedClan'
    const oldSnapshotList = managedClan.memberList || [];
    const oldSnapshotTags = new Set(oldSnapshotList.map((m) => m.tag));
    // [PERBAIKAN LOGIKA] Map lama tidak diperlukan, kita bandingkan array
    // const firestoreMemberMap = new Map(
    //   firestoreMembers.map((m) => [m.playerTag, m])
    // );

    const updatePromises: Promise<any>[] = [];
    let leaversProcessed = 0;
    let joinersProcessed = 0;
    let roleChangesProcessed = 0;

    // 4. Deteksi Leavers (Ada di Snapshot Lama, tapi TIDAK ada di CoC API)
    // (List B - List A)
    const leavers = oldSnapshotList.filter(
      (oldMember) => !cocMemberTags.has(oldMember.tag),
    );

    for (const leaver of leavers) {
      console.log(
        `[Sync ${clanTag}] LEAVER: ${leaver.name} (${leaver.tag}) tidak lagi di klan.`,
      );

      // Cari profil Clashub leaver ini
      const leaverProfile = await getUserProfileByPlayerTagAdmin(leaver.tag);

      if (leaverProfile) {
        const leaverUid = leaverProfile.uid;
        const leaverName = leaverProfile.displayName;

        // Aksi 1: Update role mereka ke Free Agent
        updatePromises.push(
          updateMemberRole(leaverUid, null, null, 'Free Agent'),
        );

        // Aksi 2: Catat riwayat keluarnya (Fase 1.2)
        updatePromises.push(recordPlayerClanLeave(leaverUid, clanTag));

        // Aksi 3: Kirim notifikasi ke LEAVER (Fase 3.1)
        // (Meminta untuk mengulas klan yang ditinggalkan)
        updatePromises.push(
          createNotification(
            leaverUid,
            `Anda telah keluar dari ${clanName}. Berikan ulasan Anda tentang klan tersebut.`,
            `/reviews/new?type=clan&id=${clanId}&name=${encodeURIComponent(
              clanName,
            )}`,
            'review_request',
          ),
        );

        // Aksi 4: Kirim notifikasi ke SEMUA ANGGOTA YANG TINGGAL (List C) (Fase 3.1)
        // (Meminta untuk mengulas player yang keluar)
        for (const remainingMember of remainingMemberProfiles) {
          // Jangan kirim notifikasi ke diri sendiri (leaver)
          if (remainingMember.uid === leaverUid) continue;

          updatePromises.push(
            createNotification(
              remainingMember.uid,
              `${leaverName} telah keluar dari klan. Berikan ulasan Anda tentang dia.`,
              // [PERBAIKAN KRUSIAL v2] Kirim UID, Name, dan clanId
              `/reviews/new?type=player&id=${leaverUid}&name=${encodeURIComponent(
                leaverName,
              )}&clanId=${clanId}`,
              'review_request',
            ),
          );
        }
        leaversProcessed++;
      }
      // Jika leaverProfile tidak ada (player tidak terverifikasi),
      // kita tidak bisa mengirim notifikasi atau mencatat riwayat.
    }

    // 5. Deteksi Joiners & Perubahan Role (Ada di CoC API)
    for (const cocMember of cocMembers) {
      const newClashubRole = mapCocRoleToClashubRole(cocMember.role);

      if (!oldSnapshotTags.has(cocMember.tag)) {
        // --- JOINER DETECTED (List A - List B) ---
        // Cari profil Clashub joiner ini
        // [PERBAIKAN LOGIKA] Ganti query manual dengan helper
        const joinerProfile = await getUserProfileByPlayerTagAdmin(
          cocMember.tag,
        );

        if (joinerProfile) {
          console.log(
            `[Sync ${clanTag}] JOINER: ${joinerProfile.displayName} (${cocMember.tag}) bergabung atau join ulang.`,
          );

          // Aksi 1: Update role, clanId, clanName
          updatePromises.push(
            updateMemberRole(
              joinerProfile.uid,
              clanId,
              clanName,
              newClashubRole,
            ),
          );
          // Aksi 2: Catat riwayat bergabung (Fase 1.2)
          updatePromises.push(
            recordPlayerClanJoin(joinerProfile.uid, clanTag, clanName),
          );
          joinersProcessed++;
        } else {
          // User ini join klan, TAPI tidak terverifikasi di Clashub.
          console.warn(
            `[Sync ${clanTag}] SKIP JOINER: ${cocMember.name} (${cocMember.tag}) join klan, tapi tidak punya akun Clashub terverifikasi.`,
          );
        }
      } else {
        // --- ANGGOTA YANG MASIH ADA (Cek Perubahan Role) ---
        // (Ada di List A dan List B)
        // Kita perlu mencari profilnya (dari List C) untuk cek role
        const currentMemberProfile = remainingMemberProfiles.find(
          (p) => p.playerTag === cocMember.tag,
        );

        if (
          currentMemberProfile &&
          currentMemberProfile.role !== newClashubRole
        ) {
          // Role di CoC API berbeda dengan role di DB kita
          console.log(
            `[Sync ${clanTag}] ROLE CHANGE: ${currentMemberProfile.displayName} sekarang ${newClashubRole}.`,
          );
          updatePromises.push(
            updateMemberRole(
              currentMemberProfile.uid,
              clanId,
              clanName,
              newClashubRole,
            ),
          );
          roleChangesProcessed++;
        }
      }
    }

    // 6. Buat Snapshot Baru dan Jalankan semua update database
    // [BARU: Fase 1.3] Simpan snapshot memberList baru untuk sync berikutnya
    const newSnapshotMemberList = cocMembers.map((m) => ({
      tag: m.tag,
      name: m.name,
    }));
    updatePromises.push(
      updateManagedClanMemberList(clanId, newSnapshotMemberList),
    );

    await Promise.all(updatePromises);

    console.log(
      `[Sync ${clanTag}] Sinkronisasi selesai. Leavers: ${leaversProcessed}, Joiners: ${joinersProcessed}, Role Changes: ${roleChangesProcessed}.`,
    );

    return NextResponse.json(
      {
        message: 'Sinkronisasi anggota selesai.',
        summary: {
          leavers: leaversProcessed,
          joiners: joinersProcessed,
          roleChanges: roleChangesProcessed,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[Sync Members API Error]`, error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}