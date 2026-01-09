'use client';

import React, { useState } from 'react';
import {
  ManagedClan,
  ClanApiCache,
  UserProfile,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  UsersIcon,
  XIcon,
  TrashIcon,
  SearchIcon,
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import {
  useManagedClanCache,
  useManagedClanMembers,
} from '@/lib/hooks/useManagedClan';
import { useLanguage } from '@/lib/hooks/useLanguage';

import { MemberTable } from './MemberTable';
import { RosterMember } from './MemberTableRow';

// Definisi Enum Lokal untuk CoC Role jika tidak di-export dari barrel file
enum ClanRole {
  LEADER = 'leader',
  CO_LEADER = 'coLeader',
  ELDER = 'admin',
  MEMBER = 'member'
}

interface MemberTabContentProps {
  clan: ManagedClan;
  userProfile: UserProfile;
  onAction: (message: string, type: NotificationProps['type']) => void;
  isManager: boolean;
}

const MemberTabContent: React.FC<MemberTabContentProps> = ({
  clan,
  userProfile,
  onAction,
  isManager,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

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

  // --- Handlers ---

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
        { method: 'POST' }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.clanManage.msgSyncError);
      }
      onAction(t.clanManage.msgSyncSuccess, 'success');
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsSyncingMembers(false);
    }
  };

  const mapClashubRoleToCocRole = (clashubRole: UserProfile['role']): ClanRole => {
    switch (clashubRole) {
      case 'Leader': return ClanRole.LEADER;
      case 'Co-Leader': return ClanRole.CO_LEADER;
      case 'Elder': return ClanRole.ELDER;
      case 'Member':
      case 'Free Agent':
      default: return ClanRole.MEMBER;
    }
  };

  const handleRoleChange = async (memberUid: string, newClashubRole: UserProfile['role']) => {
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
      if (!response.ok) throw new Error(result.message || t.clanMembers.toastError);

      onAction(t.clanMembers.toastSuccess, 'success');
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    }
  };

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

  const handleConfirmKick = async () => {
    if (!memberToKick || !memberToKick.uid) {
      onAction(t.common.error, 'error');
      return;
    }

    const memberUid = memberToKick.uid;
    setIsKicking(true);
    onAction(t.clanManage.processing, 'info');

    try {
      const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t.clanMembers.toastError);

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

  // --- Data Processing ---
  const availableClashubRoles: UserProfile['role'][] = isLeader
    ? ['Co-Leader', 'Elder', 'Member']
    : ['Elder', 'Member'];

  const isLoading = isLoadingBasic || isLoadingMembers;
  const isError = isErrorBasic || isErrorMembers;

  const combinedRoster: RosterMember[] = rosterMembers
    .map((cacheMember) => {
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
      } as RosterMember;
    })
    .filter((member) => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.tag.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (b.townHallLevel !== a.townHallLevel) {
        return b.townHallLevel - a.townHallLevel;
      }
      return a.clanRank - b.clanRank;
    });

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px]">
        <div className="relative">
            <div className="absolute inset-0 bg-coc-gold/20 blur-xl rounded-full animate-pulse"></div>
            <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin relative z-10" />
        </div>
        <p className="mt-6 text-sm font-medium text-gray-400 animate-pulse font-mono uppercase tracking-widest">
          {t.common.loading}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white tracking-wide mb-2">{t.common.error}</p>
        <p className="text-sm text-gray-400 max-w-md">
          {isErrorBasic?.message || isErrorMembers?.message || t.common.error}
        </p>
      </div>
    );
  }

  if (!clanCache?.members || clanCache.members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <div className="bg-white/5 p-4 rounded-full mb-4">
            <UsersIcon className="h-10 w-10 text-gray-500" />
        </div>
        <p className="text-xl font-clash text-white tracking-wide mb-2">{t.common.noData}</p>
        <p className="text-sm text-gray-400 max-w-sm">
           {t.clanPublicProfile.memberListEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- Filter & Action Bar --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#15171e]/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative w-full md:w-72 group">
          <Input 
            placeholder={t.common.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-coc-gold/30 focus:ring-coc-gold/20 transition-all rounded-lg h-11"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-coc-gold transition-colors" />
        </div>

        {isManager && (
          <Button
            onClick={handleSyncMembers}
            disabled={isSyncingMembers || isLoading}
            variant="ghost"
            className="w-full md:w-auto bg-coc-blue/10 border border-coc-blue/20 hover:bg-coc-blue/20 text-coc-blue hover:text-white transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]"
          >
            {isSyncingMembers ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 mr-2" />
            )}
            {isSyncingMembers ? t.clanManage.syncing : t.clanManage.syncManualNow}
          </Button>
        )}
      </div>

      {/* --- Member List / Table --- */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#15171e]/60 backdrop-blur-md shadow-2xl relative">
        {/* Glow Effect Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-coc-gold/30 to-transparent opacity-50"></div>
        
        <MemberTable
          combinedRoster={combinedRoster}
          userProfile={userProfile}
          isManager={isManager}
          isLeader={isLeader}
          onRoleChange={handleRoleChange}
          onKick={handleOpenKickModal}
          availableClashubRoles={availableClashubRoles}
        />
      </div>

      <div className="flex justify-end px-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
            Total Members: <span className="text-white ml-2 font-bold">{combinedRoster.length}</span>
        </span>
      </div>

      {/* --- Kick Confirmation Modal --- */}
      {isKickModalOpen && memberToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#15171e] border border-coc-red/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.1)] overflow-hidden ring-1 ring-white/5">
            {/* Red Danger Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-coc-red to-transparent"></div>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 text-gray-500 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 p-0 flex items-center justify-center"
              onClick={() => setIsKickModalOpen(false)}
              disabled={isKicking}
            >
              <XIcon className="h-5 w-5" />
            </Button>

            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-coc-red/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-coc-red/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                <TrashIcon className="h-9 w-9 text-coc-red drop-shadow-md" />
              </div>
              
              <h3 className="text-2xl font-clash text-white mb-2 tracking-wide">
                {t.clanMembers.modalKickTitle}
              </h3>
              
              <p className="text-gray-400 text-sm mb-8 leading-relaxed font-sans">
                {t.clanMembers.modalKickConfirm} <span className="text-white font-bold text-base">{memberToKick.name}</span>?
                <br />
                <span className="text-coc-red/90 mt-3 inline-block font-medium bg-coc-red/5 px-3 py-1 rounded-lg border border-coc-red/10 text-xs uppercase tracking-wider">
                    <AlertTriangleIcon className="inline w-3 h-3 mr-1 -mt-0.5" />
                    {t.clanManage.leaveImportant}
                </span>
              </p>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border-white/10"
                  onClick={() => setIsKickModalOpen(false)}
                  disabled={isKicking}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 py-2.5 shadow-lg shadow-coc-red/20 hover:shadow-coc-red/40 transition-all"
                  onClick={handleConfirmKick}
                  disabled={isKicking}
                >
                  {isKicking ? <RefreshCwIcon className="animate-spin h-4 w-4" /> : (
                      <span className="flex items-center justify-center">
                          <TrashIcon className="h-4 w-4 mr-2" />
                          {t.clanMembers.actionKick}
                      </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTabContent;