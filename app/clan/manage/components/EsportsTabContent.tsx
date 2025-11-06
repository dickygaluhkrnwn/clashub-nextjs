'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore-collections';
import {
  ManagedClan,
  EsportsTeam,
  UserProfile,
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
} from '@/app/components/icons'; // <-- Impor yang tidak perlu sudah dihapus
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import CreateTeamModal from './EsportsCreateModal'; // <-- Impor Modal
import TeamCard from './EsportsTeamCard'; // <-- Impor Kartu
import EditTeamModal from './EsportsEditModal'; // <-- [EDIT] Impor Modal Edit

// =========================================================================
// KOMPONEN UTAMA: EsportsTabContent
// =========================================================================
interface EsportsTabContentProps {
  clan: ManagedClan;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

const EsportsTabContent: React.FC<EsportsTabContentProps> = ({
  clan,
  onAction,
}) => {
  const { userProfile, currentUser } = useAuth(); // <-- currentUser sudah ada di sini
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // <-- [EDIT] State untuk modal edit
  const [
    teamToEdit,
    setTeamToEdit,
  ] = useState<FirestoreDocument<EsportsTeam> | null>(null); // <-- [EDIT] State untuk tim yang akan diedit
  const [esportsTeams, setEsportsTeams] = useState<
    FirestoreDocument<EsportsTeam>[]
  >([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  // Cek apakah user adalah manager (Leader/Co-Leader)
  const isManager =
    userProfile?.role === 'Leader' || userProfile?.role === 'Co-Leader';

  // Ambil data anggota (UserProfiles) klan ini
  const {
    membersData: clanMembers,
    isLoading: isLoadingMembers,
    isError: isMembersError,
  } = useManagedClanMembers(clan.id);

  // ... (useEffect for fetching data tim E-Sports) ...
  useEffect(() => {
    setIsLoadingTeams(true);
    // Path: /managedClans/{clanId}/esportsTeams
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
            ...(doc.data() as EsportsTeam), // Spread data dulu
            id: doc.id, // Timpa ID dengan ID dokumen yang benar (setelah spread)
          });
        });
        setEsportsTeams(teams);
        setIsLoadingTeams(false);
      },
      (error) => {
        console.error('Gagal mengambil data E-Sports:', error);
        onAction('Gagal mengambil daftar tim E-Sports.', 'error');
        setIsLoadingTeams(false);
      }
    );

    // Cleanup listener saat komponen unmount
    return () => unsubscribe();
  }, [clan.id, onAction]);

  // ... (handleCreateTeam function) ...
  const handleCreateTeam = async (
    teamName: string,
    teamLeaderUid: string,
    memberUids: string[]
  ): Promise<void> => {
    // [PERBAIKAN] Cek currentUser untuk mendapatkan token
    if (!currentUser) {
      throw new Error('Gagal mendapatkan token, silakan login ulang.');
    }

    // Validasi sederhana (sebenarnya sudah divalidasi di modal)
    if (!teamName || memberUids.length !== 5) {
      throw new Error('Nama tim atau jumlah anggota tidak valid.');
    }

    // [PERBAIKAN] Ambil token
    const token = await currentUser.getIdToken();

    // TAHAP 3.3: Panggil API Route untuk membuat tim baru
    const response = await fetch(`/api/clan/manage/${clan.id}/esports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // <-- [PERBAIKAN] Tambahkan header otentikasi
      },
      body: JSON.stringify({
        teamName,
        teamLeaderUid,
        memberUids,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal membuat tim.');
    }
    // Jika sukses, onSnapshot akan otomatis memperbarui UI.
  };

  // [EDIT] Handler untuk membuka modal edit
  const handleOpenEditModal = (team: FirestoreDocument<EsportsTeam>) => {
    setTeamToEdit(team);
    setIsEditModalOpen(true);
  };

  // Filter anggota yang terverifikasi (sesuai roadmap)
  const availableMembers = useMemo(() => {
    return (clanMembers || []).filter((member) => member.isVerified);
  }, [clanMembers]);

  // ... (Tampilan Loading) ...
  if (isLoadingTeams || isLoadingMembers) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin" />
        <p className="ml-3 text-lg font-clash text-gray-300">
          Memuat data tim & anggota...
        </p>
      </div>
    );
  }

  // Tampilan Error
  if (isMembersError) {
    return (
      <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-xl font-clash text-coc-red">Gagal Memuat Anggota</p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Tidak dapat mengambil daftar anggota klan. Silakan coba lagi nanti.
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
            Manajemen Tim E-Sports
          </h2>
        </div>
        {isManager && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Buat Tim
          </Button>
        )}
      </div>

      <p className="text-gray-300 font-sans text-sm">
        Kelola tim internal klan (5v5) untuk turnamen dan acara E-Sports. Hanya
        anggota terverifikasi yang dapat ditambahkan ke tim.
      </p>

      {/* Daftar Tim yang Ada */}
      <div className="space-y-4">
        {esportsTeams.length === 0 ? (
          <div className="p-8 text-center bg-coc-stone/30 rounded-lg min-h-[200px] flex flex-col justify-center items-center">
            <UsersIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
            <p className="text-lg font-clash text-white">Belum Ada Tim</p>
            <p className="text-sm text-gray-400 font-sans mt-1">
              {isManager
                ? 'Gunakan tombol "Buat Tim" untuk mendaftarkan tim pertama Anda.'
                : 'Belum ada tim E-Sports yang terdaftar di klan ini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {esportsTeams.map((team) => (
              <TeamCard
                key={team.id}
                clanId={clan.id} // <-- [EDIT] Kirim clanId
                currentUser={currentUser} // <-- [EDIT] Kirim currentUser untuk token
                team={team}
                allMembers={availableMembers}
                isManager={isManager}
                onAction={onAction}
                onEdit={handleOpenEditModal} // <-- [EDIT] Kirim handler edit ke kartu
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
          allTeams={esportsTeams} // Kirim daftar tim untuk validasi
        />
      )}

      {/* [EDIT] Render Modal Edit Tim */}
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

// =========================================================================
// KODE TEAMCARD (70 baris) SUDAH DIHAPUS DARI SINI
// =========================================================================

export default EsportsTabContent;