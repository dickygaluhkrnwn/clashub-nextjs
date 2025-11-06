'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  collection,
  query,
  onSnapshot,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import {
  TrophyIcon,
  PlusIcon,
  XIcon,
  Loader2Icon,
  UsersIcon,
  UserPlusIcon,
  AlertTriangleIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
} from '@/app/components/icons';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';

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
  const { userProfile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Effect untuk fetching data tim E-Sports (real-time)
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

  // Handler untuk API call (akan dibuat di TAHAP 3.3)
  const handleCreateTeam = async (
    teamName: string,
    teamLeaderUid: string,
    memberUids: string[]
  ): Promise<void> => {
    // Validasi sederhana (sebenarnya sudah divalidasi di modal)
    if (!teamName || memberUids.length !== 5) {
      throw new Error('Nama tim atau jumlah anggota tidak valid.');
    }

    // TAHAP 3.3: Panggil API Route untuk membuat tim baru
    const response = await fetch(`/api/clan/manage/${clan.id}/esports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // Filter anggota yang terverifikasi (sesuai roadmap)
  const availableMembers = useMemo(() => {
    return (clanMembers || []).filter((member) => member.isVerified);
  }, [clanMembers]);

  // Tampilan Loading
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
                team={team}
                allMembers={availableMembers}
                isManager={isManager}
                onAction={onAction}
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
          teamLeaderUid={userProfile.uid}
          availableMembers={availableMembers}
          onAction={onAction}
          onCreateTeam={handleCreateTeam}
          allTeams={esportsTeams} // Kirim daftar tim untuk validasi
        />
      )}
    </div>
  );
};

// =========================================================================
// KOMPONEN KARTU TIM: TeamCard (Internal)
// =========================================================================
interface TeamCardProps {
  team: FirestoreDocument<EsportsTeam>;
  allMembers: UserProfile[];
  isManager: boolean;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  allMembers,
  isManager,
  onAction,
}) => {
  // Cari profil lengkap anggota tim
  const teamMembers = useMemo(() => {
    return team.memberUids
      .map((uid) => allMembers.find((m) => m.uid === uid))
      .filter((m): m is UserProfile => !!m);
  }, [team.memberUids, allMembers]);

  const teamLeader = useMemo(() => {
    return allMembers.find((m) => m.uid === team.teamLeaderUid);
  }, [team.teamLeaderUid, allMembers]);

  // TODO: Tambahkan handler untuk Edit & Delete (TAHAP 3.3)
  const handleEdit = () => {
    onAction('Fitur Edit belum tersedia.', 'info');
  };
  const handleDelete = () => {
    onAction('Fitur Delete belum tersedia.', 'info');
  };

  return (
    <div className="bg-coc-stone/40 p-4 rounded-lg shadow-md border border-coc-gold-dark/30">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-clash text-coc-gold">{team.teamName}</h3>
          <p className="text-xs text-gray-400 font-sans">
            Leader: {teamLeader?.displayName || 'N/A'}
          </p>
        </div>
        {isManager && (
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <TrashIcon className="h-4 w-4 text-coc-red/70 hover:text-coc-red" />
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
            (Beberapa anggota mungkin belum terverifikasi atau telah keluar)
          </p>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// KOMPONEN MODAL: CreateTeamModal (Internal)
// =========================================================================
interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  teamLeaderUid: string;
  availableMembers: UserProfile[];
  onAction: (message: string, type: NotificationProps['type']) => void;
  onCreateTeam: (
    teamName: string,
    teamLeaderUid: string,
    memberUids: string[]
  ) => Promise<void>;
  allTeams: FirestoreDocument<EsportsTeam>[];
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  clanId,
  teamLeaderUid,
  availableMembers,
  onAction,
  onCreateTeam,
  allTeams,
}) => {
  const [teamName, setTeamName] = useState('');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buat Set (HashSet) untuk mengecek UID anggota yang sudah ada di tim lain
  const membersInOtherTeams = useMemo(() => {
    const uids = new Set<string>();
    allTeams.forEach((team) => {
      team.memberUids.forEach((uid) => uids.add(uid));
    });
    return uids;
  }, [allTeams]);

  // Handler untuk memilih/membatalkan anggota
  const handleMemberToggle = (uid: string) => {
    setSelectedUids((prev) => {
      if (prev.includes(uid)) {
        // Batalkan pilihan
        return prev.filter((id) => id !== uid);
      } else {
        // Tambah pilihan
        if (prev.length >= 5) {
          onAction('Anda hanya dapat memilih 5 anggota.', 'error');
          return prev;
        }
        return [...prev, uid];
      }
    });
  };

  // Handler untuk submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() === '') {
      onAction('Nama tim tidak boleh kosong.', 'error');
      return;
    }
    if (selectedUids.length !== 5) {
      onAction('Anda harus memilih tepat 5 anggota.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Ubah array 5 string menjadi tuple [string, string, string, string, string]
      const memberUidsTuple: [string, string, string, string, string] = [
        selectedUids[0],
        selectedUids[1],
        selectedUids[2],
        selectedUids[3],
        selectedUids[4],
      ];

      await onCreateTeam(teamName, teamLeaderUid, memberUidsTuple);
      onAction('Tim E-Sports berhasil dibuat!', 'success');
      onClose(); // Tutup modal setelah sukses
    } catch (error) {
      console.error('Error creating team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl card-stone shadow-xl border-2 border-coc-gold/50">
        <form onSubmit={handleSubmit}>
          {/* Header Modal */}
          <div className="flex justify-between items-center p-4 border-b border-coc-gold-dark/30">
            <h3 className="text-xl font-clash text-coc-gold flex items-center">
              <UserPlusIcon className="h-6 w-6 mr-3" />
              Buat Tim E-Sports Baru
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!p-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Body Modal */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Input Nama Tim */}
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-300 font-sans mb-1"
              >
                Nama Tim
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Misal: Tim Elit War"
                className="input-base" // Kelas dari globals.css
                disabled={isSubmitting}
              />
            </div>

            {/* Pemilih Anggota */}
            <div>
              <label className="block text-sm font-medium text-gray-300 font-sans mb-1">
                Pilih Anggota ({selectedUids.length}/5)
              </label>
              <p className="text-xs text-gray-400 font-sans mb-2">
                Pilih 5 anggota terverifikasi. Anggota yang sudah ada di tim
                lain akan dinonaktifkan.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 rounded-lg bg-coc-stone-dark/30 p-3">
                {availableMembers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Tidak ada anggota terverifikasi yang tersedia.
                  </p>
                ) : (
                  availableMembers.map((member) => {
                    const isSelected = selectedUids.includes(member.uid);
                    const isInOtherTeam = membersInOtherTeams.has(member.uid);
                    const isDisabled = (isInOtherTeam && !isSelected) || (selectedUids.length >= 5 && !isSelected) || isSubmitting;

                    return (
                      <button
                        type="button"
                        key={member.uid}
                        onClick={() => handleMemberToggle(member.uid)}
                        disabled={isDisabled}
                        className={`w-full flex items-center space-x-3 p-2 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-coc-gold/20 border border-coc-gold'
                            : 'bg-coc-dark/50 hover:bg-coc-dark/80'
                        } ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'bg-coc-gold border-coc-gold'
                              : 'border-gray-400'
                          } ${
                            isInOtherTeam && !isSelected
                              ? 'bg-gray-600 border-gray-500'
                              : ''
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="h-4 w-4 text-coc-dark" />
                          )}
                          {isInOtherTeam && !isSelected && (
                            <XIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <Image
                          src={getThImage(member.thLevel)}
                          alt={`TH${member.thLevel}`}
                          width={28}
                          height={28}
                          className="h-7 w-auto"
                        />
                        <div className="text-left">
                          <p
                            className={`font-sans font-medium ${
                              isSelected ? 'text-white' : 'text-gray-200'
                            }`}
                          >
                            {member.displayName}
                          </p>
                          {isInOtherTeam && (
                             <p className="text-xs text-coc-yellow/80">
                              (Sudah di tim lain)
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="flex justify-end gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                isSubmitting ||
                teamName.trim() === '' ||
                selectedUids.length !== 5
              }
            >
              {isSubmitting ? (
                <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <PlusIcon className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tim'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EsportsTabContent;