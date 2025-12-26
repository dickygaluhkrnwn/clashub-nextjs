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
import { useLanguage } from '@/lib/hooks/useLanguage';

interface EsportsTabContentProps {
  clan: ManagedClan;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

const EsportsTabContent: React.FC<EsportsTabContentProps> = ({
  clan,
  onAction,
}) => {
  const { t } = useLanguage();
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
        onAction(t.clanEsports.toastFetchError, 'error');
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
      throw new Error(t.clanEsports.valNameEmpty);
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
      <div className="flex flex-col justify-center items-center h-[400px]">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">
          {t.clanEsports.loadingTeams}
        </p>
      </div>
    );
  }

  if (isMembersError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-coc-red/5 border border-coc-red/20 rounded-2xl backdrop-blur-sm">
        <div className="bg-coc-red/10 p-4 rounded-full mb-4">
            <AlertTriangleIcon className="h-10 w-10 text-coc-red" />
        </div>
        <p className="text-xl font-clash text-white mb-2">{t.clanEsports.errorMembersTitle}</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {t.clanEsports.errorMembersDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-coc-gold/10 to-transparent p-6 rounded-2xl border border-coc-gold/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-coc-gold/20 rounded-lg border border-coc-gold/30">
                <TrophyIcon className="h-6 w-6 text-coc-gold" />
            </div>
            <h2 className="text-2xl font-clash text-white tracking-wide">
                {t.clanEsports.tabTitle}
            </h2>
          </div>
          <p className="text-gray-400 font-medium text-sm ml-1 max-w-lg">
            {t.clanEsports.tabDesc}
          </p>
        </div>

        {isManager && (
            <div className="relative z-10">
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                    className="shadow-lg shadow-coc-gold/10 hover:shadow-coc-gold/20"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t.clanEsports.createTeam}
                </Button>
            </div>
        )}
      </div>

      {/* Daftar Tim yang Ada */}
      <div>
        {esportsTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm border-dashed">
            <div className="bg-white/5 p-6 rounded-full mb-6">
                <UsersIcon className="h-12 w-12 text-gray-500 opacity-50" />
            </div>
            <h3 className="text-xl font-clash text-white mb-2">{t.clanEsports.noTeamsTitle}</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {isManager
                ? t.clanEsports.noTeamsDescManager
                : t.clanEsports.noTeamsDescMember}
            </p>
            {isManager && (
                <Button
                    variant="secondary"
                    className="mt-6 bg-white/5 border border-white/10 hover:bg-white/10"
                    onClick={() => setIsModalOpen(true)}
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Team
                </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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