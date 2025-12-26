'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'firebase/auth';
import {
  UserProfile,
  FirestoreDocument,
  EsportsTeam,
} from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import {
  EditIcon,
  XIcon,
  Loader2Icon,
  CheckIcon,
  CrownIcon,
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import AlertDialog from '@/app/components/ui/AlertDialog';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  currentUser: User | null;
  availableMembers: UserProfile[];
  onAction: (message: string, type: NotificationProps['type']) => void;
  allTeams: FirestoreDocument<EsportsTeam>[];
  teamToEdit: FirestoreDocument<EsportsTeam>;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  clanId,
  currentUser,
  availableMembers,
  onAction,
  allTeams,
  teamToEdit,
}) => {
  const [teamName, setTeamName] = useState(teamToEdit.teamName);
  const [selectedUids, setSelectedUids] = useState<string[]>([
    ...teamToEdit.memberUids,
  ]);
  const [selectedLeaderUid, setSelectedLeaderUid] = useState<string>(
    teamToEdit.teamLeaderUid
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      setTeamName(teamToEdit.teamName);
      setSelectedUids([...teamToEdit.memberUids]);
      setSelectedLeaderUid(teamToEdit.teamLeaderUid);
      setIsSubmitting(false);
      setIsAlertOpen(false);
      setAlertInfo({ title: '', message: '' });
    }
  }, [isOpen, teamToEdit]);

  const membersInOtherTeams = useMemo(() => {
    const uids = new Set<string>();
    allTeams.forEach((team) => {
      if (team.id !== teamToEdit.id) {
        team.memberUids.forEach((uid) => uids.add(uid));
      }
    });
    return uids;
  }, [allTeams, teamToEdit.id]);

  const selectedMembers = useMemo(() => {
    return availableMembers.filter((m) => selectedUids.includes(m.uid));
  }, [selectedUids, availableMembers]);

  const handleMemberToggle = (uid: string) => {
    let newSelectedUids = [...selectedUids];

    if (newSelectedUids.includes(uid)) {
      newSelectedUids = newSelectedUids.filter((id) => id !== uid);
      if (uid === selectedLeaderUid) {
        setSelectedLeaderUid('');
      }
    } else {
      if (newSelectedUids.length >= 5) {
        onAction('Anda hanya dapat memilih 5 anggota.', 'error');
        return;
      }
      newSelectedUids.push(uid);
    }
    setSelectedUids(newSelectedUids);
  };

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
    if (selectedLeaderUid === '') {
      onAction('Anda harus memilih seorang Leader Tim.', 'error');
      return;
    }
    if (!currentUser) {
      onAction('Autentikasi gagal. Silakan login ulang.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await currentUser.getIdToken();

      const response = await fetch(
        `/api/clan/manage/${clanId}/esports/${teamToEdit.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            teamName: teamName.trim(),
            teamLeaderUid: selectedLeaderUid,
            memberUids: selectedUids,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal memperbarui tim.');
      }

      setAlertInfo({
        title: 'Tim Berhasil Diperbarui!',
        message:
          (result.message || 'Tim E-Sports berhasil diperbarui!') +
          '\n\nPERHATIAN: Jika Anda mengubah Leader Tim, harap promosikan leader baru menjadi Co-Leader di dalam game.',
      });
      setIsAlertOpen(true);
    } catch (error) {
      console.error('Error updating team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => {
          setIsAlertOpen(false);
          onClose();
        }}
        title={alertInfo.title}
        message={alertInfo.message}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Header Modal */}
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-clash text-white flex items-center gap-3">
                <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
                    <EditIcon className="h-5 w-5 text-coc-gold" />
                </div>
                Edit Tim E-Sports
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <XIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
              
              {/* Input Nama Tim */}
              <div className="space-y-2">
                <label htmlFor="teamName" className="block text-sm font-bold text-gray-300">
                  Nama Tim
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Misal: Tim Elit War"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-coc-gold/50 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Pemilih Anggota */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-gray-300">
                    Pilih Anggota ({selectedUids.length}/5)
                    </label>
                    <span className="text-xs text-coc-gold/70">Max 5</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Pilih 5 anggota terverifikasi. Anggota di tim lain dinonaktifkan.
                </p>
                
                <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                  {availableMembers.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">Tidak ada anggota terverifikasi.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                        {availableMembers.map((member) => {
                        const isSelected = selectedUids.includes(member.uid);
                        const isInOtherTeam = membersInOtherTeams.has(member.uid) && !teamToEdit.memberUids.includes(member.uid);
                        const isDisabled = (isInOtherTeam && !isSelected) || (selectedUids.length >= 5 && !isSelected) || isSubmitting;

                        return (
                            <button
                            type="button"
                            key={member.uid}
                            onClick={() => handleMemberToggle(member.uid)}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-between p-3 transition-all ${
                                isSelected ? 'bg-coc-gold/10' : 'hover:bg-white/5'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Image 
                                        src={getThImage(member.thLevel)} 
                                        alt={`TH${member.thLevel}`} 
                                        width={32} 
                                        height={32} 
                                        className="drop-shadow-md"
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center ${isSelected ? 'bg-coc-gold' : 'bg-gray-600'}`}>
                                        {isSelected && <CheckIcon className="w-2.5 h-2.5 text-black" />}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {member.displayName}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">TH {member.thLevel}</p>
                                </div>
                            </div>
                            
                            {isInOtherTeam && !isSelected && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                    In Team
                                </span>
                            )}
                            </button>
                        );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pemilih Leader Tim */}
              <div className="space-y-2">
                <label htmlFor="teamLeader" className="block text-sm font-bold text-gray-300 flex items-center gap-2">
                  <CrownIcon className="h-4 w-4 text-coc-gold" />
                  Pilih Leader Tim
                </label>
                <div className="relative">
                    <select
                    id="teamLeader"
                    value={selectedLeaderUid}
                    onChange={(e) => setSelectedLeaderUid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-coc-gold/50 cursor-pointer disabled:opacity-50"
                    disabled={isSubmitting || selectedUids.length !== 5}
                    >
                    <option value="" disabled>
                        {selectedUids.length !== 5
                        ? 'Pilih 5 anggota dulu'
                        : 'Pilih seorang leader...'}
                    </option>
                    {selectedMembers.map((member) => (
                        <option key={member.uid} value={member.uid} className="bg-[#1a1a1a]">
                        {member.displayName} (TH{member.thLevel})
                        </option>
                    ))}
                    </select>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  isSubmitting ||
                  teamName.trim() === '' ||
                  selectedUids.length !== 5 ||
                  selectedLeaderUid === ''
                }
                className="shadow-lg shadow-coc-gold/10"
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditTeamModal;