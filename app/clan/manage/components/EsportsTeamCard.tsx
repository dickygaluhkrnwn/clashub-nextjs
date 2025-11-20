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
import { TrashIcon, EditIcon, Loader2Icon } from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

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
  const { t } = useLanguage(); // [BARU]
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
    // Confirmation before delete
    if (!window.confirm(t.clanEsports.deleteConfirm)) return; // [i18n]

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

      onAction(t.clanEsports.toastDeleteSuccess.replace('{name}', team.teamName), 'success'); // [i18n]
    } catch (error) {
      console.error('Error deleting team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-coc-stone/40 p-4 rounded-lg shadow-md border border-coc-gold-dark/30">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-clash text-coc-gold">{team.teamName}</h3>
          <p className="text-xs text-gray-400 font-sans">
            {t.clanEsports.leaderLabel} {teamLeader?.displayName || 'N/A'} {/* [i18n] */}
          </p>
        </div>
        {isManager && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              disabled={isDeleting}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2Icon className="h-4 w-4 animate-spin text-coc-red" />
              ) : (
                <TrashIcon className="h-4 w-4 text-coc-red/70 hover:text-coc-red" />
              )}
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {teamMembers.map((member) => (
          <div key={member.uid} className="flex items-center space-x-2">
            <Image
              src={getThImage(member.thLevel)}
              alt={`TH${member.thLevel}`}
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm text-gray-200 font-sans">
              {member.displayName}
            </span>
          </div>
        ))}
        {teamMembers.length < 5 && (
          <p className="text-xs text-coc-yellow/80">
            {t.clanEsports.incompleteTeam} {/* [i18n] */}
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamCard;