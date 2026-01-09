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
    <div className="group relative overflow-hidden rounded-3xl bg-[#15171e]/80 backdrop-blur-xl border border-white/5 p-6 shadow-2xl transition-all duration-300 hover:border-coc-gold/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:-translate-y-1">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-gold/10 transition-colors duration-500 -translate-y-1/2 translate-x-1/2" />

      {/* Header: Team Name & Actions */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 rounded-xl bg-coc-gold/10 border border-coc-gold/20 shadow-lg shadow-coc-gold/5 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="h-5 w-5 text-coc-gold" />
             </div>
             <div>
                <h3 className="text-xl font-clash text-white tracking-wide group-hover:text-coc-gold transition-colors duration-300 truncate max-w-[200px]">
                    {team.teamName}
                </h3>
                {/* Leader Info */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <CrownIcon className="h-3 w-3 text-coc-gold" />
                    <span className="font-mono uppercase tracking-wider opacity-70">Leader:</span>
                    <span className="text-white font-medium truncate max-w-[120px]">{teamLeader?.displayName || 'Unknown'}</span>
                </div>
             </div>
          </div>
        </div>

        {isManager && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              disabled={isDeleting}
              className="h-9 w-9 p-0 bg-white/5 hover:bg-white/10 border-white/10 rounded-xl transition-all hover:scale-105"
            >
              <EditIcon className="h-4 w-4 text-gray-300 group-hover:text-white" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 w-9 p-0 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400 rounded-xl transition-all hover:scale-105 shadow-none hover:shadow-lg hover:shadow-red-500/10"
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
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest font-mono">Roster</span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${isFullTeam ? 'text-coc-green bg-coc-green/10 border-coc-green/20' : 'text-coc-yellow bg-coc-yellow/10 border-coc-yellow/20'}`}>
                {teamMembers.length}/5 Ready
            </span>
        </div>

        <div className="bg-[#0a0a0b]/60 rounded-2xl p-1.5 border border-white/5 space-y-1 shadow-inner">
            {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group/member cursor-default">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative flex-shrink-0">
                                <Image
                                    src={getThImage(member.thLevel)}
                                    alt={`TH${member.thLevel}`}
                                    width={32}
                                    height={32}
                                    className="drop-shadow-md w-8 h-8 object-contain transition-transform group-hover/member:scale-110 duration-300"
                                />
                                {/* Leader Badge on Avatar */}
                                {member.uid === team.teamLeaderUid && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-[#15171e] rounded-full p-0.5 border border-coc-gold/50 shadow-sm z-10">
                                        <CrownIcon className="w-2.5 h-2.5 text-coc-gold" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm text-gray-200 font-medium group-hover/member:text-white transition-colors truncate font-sans tracking-wide">
                                    {member.displayName}
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono group-hover/member:text-gray-500 transition-colors">TH {member.thLevel}</span>
                            </div>
                        </div>
                        
                        {/* Verified Badge */}
                        {member.isVerified && (
                             <div className="w-1.5 h-1.5 rounded-full bg-coc-blue shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse flex-shrink-0 mr-1"></div>
                        )}
                    </div>
                ))
            ) : (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-gray-600 italic">No members added yet</p>
                </div>
            )}
        </div>

        {!isFullTeam && (
          <div className="mt-4 flex items-center gap-3 text-xs text-coc-yellow/90 bg-coc-yellow/5 p-3 rounded-xl border border-coc-yellow/10 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-coc-yellow/10 p-1.5 rounded-full">
                <AlertTriangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
            </div>
            <span className="leading-tight font-medium">{t.clanEsports.incompleteTeam}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;