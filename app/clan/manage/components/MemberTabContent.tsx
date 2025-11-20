'use client';

import React, { useState } from 'react';
import {
  ManagedClan,
  ClanApiCache,
  UserProfile,
  ClanRole,
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  UsersIcon,
  XIcon,
  TrashIcon,
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import {
  useManagedClanCache,
  useManagedClanMembers,
} from '@/lib/hooks/useManagedClan';
import { useLanguage } from '@/lib/hooks/useLanguage';

import { MemberTable } from './MemberTable';
import { RosterMember } from './MemberTableRow';

interface MemberTabContentProps {
  clan: ManagedClan;
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
  isManager: boolean;
}

/**
 * Komponen konten utama untuk Tab Anggota (Member Roster).
 * Fokus pada logika (Data Fetching & Handlers) dan i18n.
 */
const MemberTabContent: React.FC<MemberTabContentProps> = ({
  clan,
  userProfile,
  onAction,
  isManager,
}) => {
  // --- Init Language Hook ---
  const { t } = useLanguage();

  // --- SWR Hooks ---
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

  const isLeader = userProfile.role === 'Leader';
  const rosterMembers = clanCache?.members || [];
  const members = membersData || [];

  // --- State ---
  const [isSyncingMembers, setIsSyncingMembers] = useState(false);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<RosterMember | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  /**
   * @function handleSyncMembers
   * Memanggil API untuk rekonsiliasi anggota.
   */
  const handleSyncMembers = async () => {
    if (!isManager) {
      onAction(t.clanManage.accessDenied, 'error');
      return;
    }
    setIsSyncingMembers(true);
    onAction(t.clanManage.syncing, 'info');
    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/sync/members`,
        {
          method: 'POST',
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.clanManage.msgSyncError);
      }
      // Menggunakan pesan sukses generik agar aman multi-bahasa
      onAction(t.clanManage.msgSyncSuccess, 'success');
      
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
   * Mengubah peran anggota.
   */
  const handleRoleChange = async (
    memberUid: string,
    newClashubRole: UserProfile['role']
  ) => {
    if (!isManager) {
      onAction(t.clanManage.msgOnlyManager, 'error');
      return;
    }
    const targetProfile = members.find((m) => m.uid === memberUid);
    if (!targetProfile) {
      onAction(`${t.common.error} (Profile not found)`, 'error');
      return;
    }
    const oldRoleCoC = mapClashubRoleToCocRole(targetProfile.role);
    const newRoleCoC = mapClashubRoleToCocRole(newClashubRole);

    // [FIX] Menggunakan t.clanManage.processing karena t.common.processing tidak ada
    onAction(`${t.clanManage.processing} (${targetProfile.displayName} -> ${newClashubRole})`, 'info');
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
        throw new Error(result.message || t.clanMembers.toastError);

      onAction(t.clanMembers.toastSuccess, 'success');
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    }
  };

  /**
   * @function handleOpenKickModal
   */
  const handleOpenKickModal = (memberUid: string) => {
    if (!isManager) {
      onAction(t.clanManage.accessDenied, 'error');
      return;
    }
    const targetMember = combinedRoster.find((m) => m.uid === memberUid);
    if (targetMember) {
      setMemberToKick(targetMember);
      setIsKickModalOpen(true);
    } else {
      onAction(t.common.error, 'error');
    }
  };

  /**
   * @function handleConfirmKick
   */
  const handleConfirmKick = async () => {
    if (!memberToKick || !memberToKick.uid) {
      onAction(t.common.error, 'error');
      return;
    }

    const memberUid = memberToKick.uid;

    setIsKicking(true);
    // [FIX] Menggunakan t.clanManage.processing
    onAction(t.clanManage.processing, 'info');

    try {
      const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || t.clanMembers.toastError);

      onAction(result.message || t.common.success, 'success');
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsKicking(false);
      setIsKickModalOpen(false);
      setMemberToKick(null);
    }
  };

  // List of roles
  const availableClashubRoles: UserProfile['role'][] = isLeader
    ? ['Co-Leader', 'Elder', 'Member']
    : ['Elder', 'Member'];

  const isLoading = isLoadingBasic || isLoadingMembers;
  const isError = isErrorBasic || isErrorMembers;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin" />
        <p className="ml-3 text-lg font-clash text-gray-300">
          {t.common.loading}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-coc-red">
          {t.common.error}
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {isErrorBasic?.message || isErrorMembers?.message || t.common.error}
        </p>
      </div>
    );
  }

  if (!clanCache?.members || clanCache.members.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">
          {t.common.noData}
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
           {t.clanPublicProfile.memberListEmpty}
        </p>
      </div>
    );
  }

  // --- Logika Penggabungan Data ---
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

  return (
    <div className="min-h-[400px]">
      {/* --- Tombol Sinkronisasi Anggota --- */}
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
              ? t.clanManage.syncing
              : t.clanManage.syncManualNow}
          </Button>
        </div>
      )}

      {/* --- MemberTable --- */}
      <MemberTable
        combinedRoster={combinedRoster}
        userProfile={userProfile}
        isManager={isManager}
        isLeader={isLeader}
        onRoleChange={handleRoleChange}
        onKick={handleOpenKickModal}
        availableClashubRoles={availableClashubRoles}
      />

      {/* --- Kick Confirmation Modal --- */}
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
                  {t.clanMembers.modalKickTitle}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    {t.clanMembers.modalKickConfirm}{' '}
                    <strong className="font-bold text-white">
                      {memberToKick.name}
                    </strong>{' '}
                    ?
                  </p>
                  <p className="mt-3 text-base font-bold text-coc-yellow/80">
                    {t.clanManage.leaveImportant}
                  </p>
                  <p className="text-sm text-gray-300 bg-coc-stone-dark/30 p-3 rounded-md">
                    {t.clanManage.leaveNote}
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
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={handleConfirmKick}
                disabled={isKicking}
              >
                {isKicking ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                {/* [FIX] Menggunakan t.clanManage.processing */}
                {isKicking ? t.clanManage.processing : t.clanMembers.actionKick}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTabContent;