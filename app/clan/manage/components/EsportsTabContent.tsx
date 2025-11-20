'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  ManagedClan,
  EsportsTeam,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { useAuth } from '@/app/context/AuthContext';
import { useManagedClanMembers } from '@/lib/hooks/useManagedClan';
import { Button } from '@/app/components/ui/Button';
import {
  TrophyIcon,
  PlusIcon,
  Loader2Icon,
  UsersIcon,
  AlertTriangleIcon,
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import CreateTeamModal from './EsportsCreateModal';
import TeamCard from './EsportsTeamCard';
import EditTeamModal from './EsportsEditModal';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

interface EsportsTabContentProps {
  clan: ManagedClan;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

const EsportsTabContent: React.FC<EsportsTabContentProps> = ({
  clan,
  onAction,
}) => {
  const { t } = useLanguage(); // [BARU]
  const { userProfile, currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<FirestoreDocument<EsportsTeam> | null>(null);
  const [esportsTeams, setEsportsTeams] = useState<FirestoreDocument<EsportsTeam>[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const isManager = userProfile?.role === 'Leader' || userProfile?.role === 'Co-Leader';

  const {
    membersData: clanMembers,
    isLoading: isLoadingMembers,
    isError: isMembersError,
  } = useManagedClanMembers(clan.id);

  useEffect(() => {
    setIsLoadingTeams(true);
    const teamsCollectionRef = collection(
      db,
      COLLECTIONS.MANAGED_CLANS,
      clan.id,
      COLLECTIONS.ESPORTS_TEAMS
    );
    const q = query(teamsCollectionRef);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const teams: FirestoreDocument<EsportsTeam>[] = [];
        querySnapshot.forEach((doc) => {
          teams.push({
            ...(doc.data() as EsportsTeam),
            id: doc.id,
          });
        });
        setEsportsTeams(teams);
        setIsLoadingTeams(false);
      },
      (error) => {
        console.error('Gagal mengambil data E-Sports:', error);
        onAction(t.clanEsports.toastFetchError, 'error'); // [i18n]
        setIsLoadingTeams(false);
      }
    );

    return () => unsubscribe();
  }, [clan.id, onAction, t]);

  const handleCreateTeam = async (
    teamName: string,
    teamLeaderUid: string,
    memberUids: string[]
  ): Promise<void> => {
    if (!currentUser) {
      throw new Error('Authentication required.');
    }

    if (!teamName || memberUids.length !== 5) {
      throw new Error(t.clanEsports.valNameEmpty); // [i18n] reuse or simple check
    }

    const token = await currentUser.getIdToken();

    const response = await fetch(`/api/clan/manage/${clan.id}/esports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        teamName,
        teamLeaderUid,
        memberUids,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || t.common.error);
    }
  };

  const handleOpenEditModal = (team: FirestoreDocument<EsportsTeam>) => {
    setTeamToEdit(team);
    setIsEditModalOpen(true);
  };

  const availableMembers = useMemo(() => {
    return (clanMembers || []).filter((member) => member.isVerified);
  }, [clanMembers]);

  if (isLoadingTeams || isLoadingMembers) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin" />
        <p className="ml-3 text-lg font-clash text-gray-300">
          {t.clanEsports.loadingTeams} {/* [i18n] */}
        </p>
      </div>
    );
  }

  if (isMembersError) {
    return (
      <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-xl font-clash text-coc-red">{t.clanEsports.errorMembersTitle}</p> {/* [i18n] */}
        <p className="text-sm text-gray-400 font-sans mt-1">
          {t.clanEsports.errorMembersDesc} {/* [i18n] */}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <TrophyIcon className="h-8 w-8 text-coc-gold" />
          <h2 className="text-2xl font-clash text-white">
            {t.clanEsports.tabTitle} {/* [i18n] */}
          </h2>
        </div>
        {isManager && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t.clanEsports.createTeam} {/* [i18n] */}
          </Button>
        )}
      </div>

      <p className="text-gray-300 font-sans text-sm">
        {t.clanEsports.tabDesc} {/* [i18n] */}
      </p>

      {/* Daftar Tim yang Ada */}
      <div className="space-y-4">
        {esportsTeams.length === 0 ? (
          <div className="p-8 text-center bg-coc-stone/30 rounded-lg min-h-[200px] flex flex-col justify-center items-center">
            <UsersIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
            <p className="text-lg font-clash text-white">{t.clanEsports.noTeamsTitle}</p> {/* [i18n] */}
            <p className="text-sm text-gray-400 font-sans mt-1">
              {isManager
                ? t.clanEsports.noTeamsDescManager // [i18n]
                : t.clanEsports.noTeamsDescMember} // [i18n]
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {esportsTeams.map((team) => (
              <TeamCard
                key={team.id}
                clanId={clan.id}
                currentUser={currentUser}
                team={team}
                allMembers={availableMembers}
                isManager={isManager}
                onAction={onAction}
                onEdit={handleOpenEditModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Buat Tim */}
      {isModalOpen && userProfile && (
        <CreateTeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clanId={clan.id}
          availableMembers={availableMembers}
          onAction={onAction}
          onCreateTeam={handleCreateTeam}
          allTeams={esportsTeams}
        />
      )}

      {/* Render Modal Edit Tim */}
      {isEditModalOpen && teamToEdit && currentUser && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          clanId={clan.id}
          currentUser={currentUser}
          availableMembers={availableMembers}
          onAction={onAction}
          allTeams={esportsTeams}
          teamToEdit={teamToEdit}
        />
      )}
    </div>
  );
};

export default EsportsTabContent;