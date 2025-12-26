'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import {
  EsportsTeam,
  UserProfile,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { TrashIcon, EditIcon, Loader2Icon, CrownIcon, UsersIcon, AlertTriangleIcon } from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface TeamCardProps {
  clanId: string;
  currentUser: User | null;
  team: FirestoreDocument<EsportsTeam>;
  allMembers: UserProfile[];
  isManager: boolean;
  onAction: (message: string, type: NotificationProps['type']) => void;
  onEdit: (team: FirestoreDocument<EsportsTeam>) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  clanId,
  currentUser,
  team,
  allMembers,
  isManager,
  onAction,
  onEdit,
}) => {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const teamMembers = useMemo(() => {
    return team.memberUids
      .map((uid) => allMembers.find((m) => m.uid === uid))
      .filter((m): m is UserProfile => !!m);
  }, [team.memberUids, allMembers]);

  const teamLeader = useMemo(() => {
    return allMembers.find((m) => m.uid === team.teamLeaderUid);
  }, [team.teamLeaderUid, allMembers]);

  const handleEdit = () => {
    onEdit(team);
  };

  const handleDelete = async () => {
    if (!window.confirm(t.clanEsports.deleteConfirm)) return;

    setIsDeleting(true);
    try {
      if (!currentUser) {
        throw new Error('Anda tidak terautentikasi.');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch(
        `/api/clan/manage/${clanId}/esports/${team.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus tim.');
      }

      onAction(t.clanEsports.toastDeleteSuccess.replace('{name}', team.teamName), 'success');
    } catch (error) {
      console.error('Error deleting team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFullTeam = teamMembers.length === 5;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 shadow-lg transition-all hover:border-coc-gold/30 hover:bg-[#202020] hover:-translate-y-1">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-coc-gold/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-coc-gold/10 transition-colors" />

      {/* Header: Team Name & Actions */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 rounded-lg bg-coc-gold/10 border border-coc-gold/20">
                <UsersIcon className="h-4 w-4 text-coc-gold" />
             </div>
             <h3 className="text-lg font-clash text-white tracking-wide group-hover:text-coc-gold transition-colors">
                {team.teamName}
             </h3>
          </div>
          
          {/* Leader Info */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 pl-1">
             <CrownIcon className="h-3 w-3 text-coc-gold" />
             <span>Leader:</span>
             <span className="text-white font-medium">{teamLeader?.displayName || 'Unknown'}</span>
          </div>
        </div>

        {isManager && (
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              disabled={isDeleting}
              className="h-8 w-8 p-0 bg-white/5 hover:bg-white/10 border-white/10"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 bg-white/5 hover:bg-red-500/10 border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400"
            >
              {isDeleting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Team Members Visualization */}
      <div className="relative z-10 mt-2">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Roster</span>
            <span className={`text-[10px] font-mono ${isFullTeam ? 'text-coc-green' : 'text-coc-yellow'}`}>
                {teamMembers.length}/5
            </span>
        </div>

        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            {teamMembers.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {teamMembers.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between group/member">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Image
                                        src={getThImage(member.thLevel)}
                                        alt={`TH${member.thLevel}`}
                                        width={24}
                                        height={24}
                                        className="drop-shadow-md w-6 h-6 object-contain"
                                    />
                                    {/* Leader Badge on Avatar */}
                                    {member.uid === team.teamLeaderUid && (
                                        <div className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5 border border-coc-gold/50">
                                            <CrownIcon className="w-2 h-2 text-coc-gold" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-300 font-sans group-hover/member:text-white transition-colors">
                                    {member.displayName}
                                </span>
                            </div>
                            <span className="text-[9px] text-gray-600 font-mono">TH{member.thLevel}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-xs text-gray-500 py-2 italic">
                    No members added yet
                </p>
            )}
        </div>

        {!isFullTeam && (
          <div className="mt-3 flex items-center gap-2 text-xs text-coc-yellow/70 bg-coc-yellow/5 p-2 rounded border border-coc-yellow/10">
            <AlertTriangleIcon className="h-3 w-3" />
            <span>{t.clanEsports.incompleteTeam}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;