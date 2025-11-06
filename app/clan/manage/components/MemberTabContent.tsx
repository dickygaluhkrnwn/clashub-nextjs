'use client';

import React, { useState } from 'react';
import {
  ManagedClan,
  ClanApiCache,
  UserProfile,
  ClanRole,
  ManagerRole,
  StandardMemberRole,
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  UsersIcon,
  XIcon, // <-- [BARU] Ditambahkan untuk modal
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import {
  useManagedClanCache,
  useManagedClanMembers,
} from '@/lib/hooks/useManagedClan';

// --- [REFACTOR] Impor komponen & tipe baru ---
import { MemberTable } from './MemberTable';
import { RosterMember } from './MemberTableRow'; // Tipe RosterMember sekarang diimpor

interface MemberTabContentProps {
  clan: ManagedClan;
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
  isManager: boolean;
}

/**
 * Komponen konten utama untuk Tab Anggota (Member Roster).
 * SEKARANG FOKUS PADA LOGIKA (DATA FETCHING & HANDLERS).
 * Tampilan tabel didelegasikan ke <MemberTable />.
 */
const MemberTabContent: React.FC<MemberTabContentProps> = ({
  clan,
  userProfile,
  onAction,
  isManager,
}) => {
  // --- SWR Hooks (Tidak berubah) ---
  const {
    clanCache,
    isLoading: isLoadingBasic,
    isError: isErrorBasic,
    mutateCache: mutateBasic,
  } = useManagedClanCache(clan.id);

  const {
    membersData,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    mutateMembers,
  } = useManagedClanMembers(clan.id);

  // --- Ambil data SWR (Tidak berubah) ---
  const isLeader = userProfile.role === 'Leader';
  const rosterMembers = clanCache?.members || [];
  const members = membersData || [];

  // --- State (Lokal untuk Konten Tab) ---
  const [isSyncingMembers, setIsSyncingMembers] = useState(false);

  // --- [BARU: TAHAP 2.3] State untuk Modal Kick ---
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<RosterMember | null>(null);
  const [isKicking, setIsKicking] = useState(false); // Loading state untuk API kick

  /**
   * @function handleSyncMembers
   * (TAHAP 1.2) Memanggil API untuk rekonsiliasi anggota.
   * (Tidak berubah)
   */
  const handleSyncMembers = async () => {
    if (!isManager) {
      onAction('Akses Ditolak.', 'error');
      return;
    }
    setIsSyncingMembers(true);
    onAction('Mensinkronkan anggota dengan server CoC...', 'info');
    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/sync/members`,
        {
          method: 'POST',
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal sinkronisasi anggota.');
      }
      const summary = result.summary;
      onAction(
        `Sinkronisasi sukses: ${summary.joiners} bergabung, ${summary.leavers} keluar, ${summary.roleChanges} berubah role.`,
        'success'
      );
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsSyncingMembers(false);
    }
  };

  /**
   * @function mapClashubRoleToCocRole
   * (Tidak berubah)
   */
  const mapClashubRoleToCocRole = (
    clashubRole: UserProfile['role']
  ): ClanRole => {
    switch (clashubRole) {
      case 'Leader':
        return ClanRole.LEADER;
      case 'Co-Leader':
        return ClanRole.CO_LEADER;
      case 'Elder':
        return ClanRole.ELDER;
      case 'Member':
      case 'Free Agent':
      default:
        return ClanRole.MEMBER;
    }
  };

  /**
   * @function handleRoleChange
   * Mengubah peran anggota (Memanggil API PUT).
   * (Tidak berubah)
   */
  const handleRoleChange = async (
    memberUid: string,
    newClashubRole: UserProfile['role']
  ) => {
    if (!isManager) {
      onAction(
        'Akses Ditolak: Anda tidak memiliki izin untuk mengubah peran.',
        'error'
      );
      return;
    }
    const targetProfile = members.find((m) => m.uid === memberUid);
    if (!targetProfile) {
      onAction('Gagal: Profil anggota tidak ditemukan.', 'error');
      return;
    }
    const oldRoleCoC = mapClashubRoleToCocRole(targetProfile.role);
    const newRoleCoC = mapClashubRoleToCocRole(newClashubRole);

    onAction(
      `Mengubah peran ${targetProfile.displayName} ke ${newClashubRole}...`,
      'info'
    );
    try {
      const response = await fetch(
        `/api/clan/manage/member/${memberUid}/role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newClashubRole,
            clanId: clan.id,
            oldRoleCoC,
            newRoleCoC,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Gagal mengubah peran.');

      onAction(result.message, 'success');
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    }
  };

  /**
   * @function handleOpenKickModal
   * [MODIFIKASI: TAHAP 2.3] Fungsi ini dipanggil oleh tombol Kick di MemberTableRow.
   * Tugasnya HANYA membuka modal konfirmasi.
   */
  const handleOpenKickModal = (memberUid: string) => {
    if (!isManager) {
      onAction('Akses Ditolak.', 'error');
      return;
    }
    // Cari data member lengkap dari roster
    const targetMember = combinedRoster.find((m) => m.uid === memberUid);
    if (targetMember) {
      setMemberToKick(targetMember);
      setIsKickModalOpen(true);
    } else {
      onAction('Gagal menemukan data anggota untuk di-kick.', 'error');
    }
  };

  /**
   * @function handleConfirmKick
   * [BARU: TAHAP 2.3] Fungsi ini dipanggil oleh tombol "Ya, Keluarkan" di modal.
   * Tugasnya adalah memanggil API DELETE.
   */
  const handleConfirmKick = async () => {
    if (!memberToKick || !memberToKick.uid) {
      onAction('Error: Anggota target tidak valid.', 'error');
      return;
    }

    const memberUid = memberToKick.uid;
    const memberName = memberToKick.name;

    setIsKicking(true); // Mulai loading
    onAction(`Memproses kick untuk ${memberName}...`, 'info');

    try {
      const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Gagal mengeluarkan anggota.');

      onAction(result.message, 'success'); // Pesan sukses dari API
      mutateBasic(); // Refresh data CoC (anggota hilang)
      mutateMembers(); // Refresh data UserProfile (anggota hilang)
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsKicking(false); // Selesai loading
      setIsKickModalOpen(false); // Tutup modal
      setMemberToKick(null); // Bersihkan state
    }
  };

  // List of roles (Tidak berubah)
  const availableClashubRoles: UserProfile['role'][] = isLeader
    ? ['Co-Leader', 'Elder', 'Member']
    : ['Elder', 'Member'];

  // --- Loading dan Error State (Tidak berubah) ---
  const isLoading = isLoadingBasic || isLoadingMembers;
  const isError = isErrorBasic || isErrorMembers;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin" />
        <p className="ml-3 text-lg font-clash text-gray-300">
          Memuat Roster Anggota...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-coc-red">
          Gagal Memuat Data Anggota
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {isErrorBasic?.message || isErrorMembers?.message || 'Terjadi kesalahan'}
        </p>
      </div>
    );
  }

  if (!clanCache?.members || clanCache.members.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">
          Tidak Ada Data Anggota di Cache
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Silakan lakukan **Sinkronisasi Manual** di Tab Ringkasan untuk memuat
          data partisipasi klan.
        </p>
      </div>
    );
  }

  // --- Logika Penggabungan Data (Tidak berubah) ---
  const combinedRoster: RosterMember[] = rosterMembers
    .map((cacheMember: ClanApiCache['members'][number]) => {
      const profileData = members.find((p) => p.playerTag === cacheMember.tag);

      return {
        ...cacheMember,
        uid: profileData?.uid,
        clashubRole: profileData?.role || 'Free Agent',
        isVerified: profileData?.isVerified || false,
        warSuccessCount: cacheMember.warSuccessCount,
        warFailCount: cacheMember.warFailCount,
        cwlSuccessCount: cacheMember.cwlSuccessCount,
        cwlFailCount: cacheMember.cwlFailCount,
        participationStatus: cacheMember.participationStatus,
        statusKeterangan: cacheMember.statusKeterangan || 'N/A',
        expLevel: cacheMember.expLevel,
        donations: cacheMember.donations,
        donationsReceived: cacheMember.donationsReceived,
      } as RosterMember;
    })
    .sort((a: RosterMember, b: RosterMember) => {
      if (b.townHallLevel !== a.townHallLevel) {
        return b.townHallLevel - a.townHallLevel;
      }
      return a.clanRank - b.clanRank;
    });

  // --- [RENDER] ---
  return (
    <div className="min-h-[400px]">
      {/* --- Tombol Sinkronisasi Anggota (Tidak berubah) --- */}
      {isManager && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleSyncMembers}
            disabled={isSyncingMembers || isLoading}
            variant="secondary"
            className="bg-coc-blue/20 text-coc-blue-light hover:bg-coc-blue/30 border border-coc-blue/30"
          >
            {isSyncingMembers ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UsersIcon className="h-4 w-4 mr-2" />
            )}
            {isSyncingMembers
              ? 'Mensinkronkan...'
              : 'Sinkronkan Anggota (CoC)'}
          </Button>
        </div>
      )}

      {/* --- [REFACTOR] Gunakan Komponen MemberTable --- */}
      <MemberTable
        combinedRoster={combinedRoster}
        userProfile={userProfile}
        isManager={isManager}
        isLeader={isLeader}
        onRoleChange={handleRoleChange}
        onKick={handleOpenKickModal} // <-- Kirim handler pembuka modal
        availableClashubRoles={availableClashubRoles}
      />

      {/* --- [BARU: TAHAP 2.3] JSX untuk Kick Confirmation Modal --- */}
      {isKickModalOpen && memberToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-xl card-stone shadow-xl border-2 border-coc-red/50">
            {/* Tombol Close Modal */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setIsKickModalOpen(false)}
              disabled={isKicking}
            >
              <XIcon className="h-5 w-5" />
            </Button>

            <div className="flex flex-col items-center p-6 pt-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-coc-red/20 border-2 border-coc-red">
                <AlertTriangleIcon
                  className="h-10 w-10 text-coc-red"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-clash text-white">
                  Keluarkan Anggota
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Anda akan mengeluarkan{' '}
                    <strong className="font-bold text-white">
                      {memberToKick.name}
                    </strong>{' '}
                    dari klan Clashub.
                  </p>
                  <p className="mt-3 text-base font-bold text-coc-yellow/80">
                    PENTING:
                  </p>
                  <p className="text-sm text-gray-300 bg-coc-stone-dark/30 p-3 rounded-md">
                    Ini HANYA menghapus mereka dari website Clashub. Anda
                    harus mengeluarkan mereka{' '}
                    <strong className="text-white">MANUAL DARI DALAM GAME CoC</strong>{' '}
                    juga.
                  </p>
                </div>
              </div>
            </div>
            {/* Tombol Aksi Modal */}
            <div className="flex justify-between gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setIsKickModalOpen(false)}
                disabled={isKicking}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger" // Asumsi 'danger' ada di Button.tsx (merah)
                className="w-full"
                onClick={handleConfirmKick}
                disabled={isKicking}
              >
                {isKicking ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                {isKicking ? 'Memproses...' : 'Ya, Keluarkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --- [AKHIR BARU] --- */}
    </div>
  );
};

export default MemberTabContent;