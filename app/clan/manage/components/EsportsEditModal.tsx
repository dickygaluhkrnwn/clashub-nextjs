'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  UsersIcon,
  SaveIcon
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

  // Add mounted state for portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
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

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
            onClick={onClose} 
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-lg bg-[#15171e] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[calc(100vh-40px)] animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-white/5">
            
          <div className="absolute top-0 right-0 w-64 h-64 bg-coc-blue/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

          <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
            {/* Header Modal */}
            <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-coc-blue/10 rounded-2xl border border-coc-blue/20 shadow-lg shadow-coc-blue/5">
                    <EditIcon className="h-6 w-6 text-coc-blue" />
                 </div>
                 <div>
                    <h3 className="text-xl font-clash text-white tracking-wide">
                        Edit Tim
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Update team details</p>
                 </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white rounded-full h-10 w-10 p-0"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <XIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {/* Input Nama Tim */}
              <div className="space-y-3">
                <label htmlFor="teamName" className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Nama Tim
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Misal: Tim Elit War"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-coc-blue/50 focus:ring-1 focus:ring-coc-blue/50 transition-all font-clash tracking-wide text-lg"
                  disabled={isSubmitting}
                />
              </div>

              {/* Pemilih Anggota */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Pilih Anggota ({selectedUids.length}/5)
                    </label>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${selectedUids.length === 5 ? 'bg-coc-green/10 text-coc-green border-coc-green/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {selectedUids.length}/5 Selected
                    </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Anggota di tim lain akan dinonaktifkan.
                </p>
                
                <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                  {availableMembers.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center">
                        <UsersIcon className="h-10 w-10 text-gray-700 mb-3" />
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
                            className={`w-full flex items-center justify-between p-4 transition-all ${
                                isSelected ? 'bg-coc-blue/10' : 'hover:bg-white/5'
                            } ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                            >
                            <div className="flex items-center gap-4">
                                <div className="relative flex-shrink-0">
                                    <Image 
                                        src={getThImage(member.thLevel)} 
                                        alt={`TH${member.thLevel}`} 
                                        width={40} 
                                        height={40} 
                                        className="drop-shadow-md"
                                    />
                                    {isSelected && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-coc-blue flex items-center justify-center border-2 border-[#15171e] shadow-md">
                                            <CheckIcon className="w-3 h-3 text-white stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className={`text-sm font-bold font-clash tracking-wide ${isSelected ? 'text-coc-blue' : 'text-gray-200'}`}>
                                        {member.displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">TH {member.thLevel}</p>
                                </div>
                            </div>
                            
                            {isInOtherTeam && !isSelected && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 font-bold uppercase tracking-wider">
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

              {/* Leader Selection */}
              <div className="space-y-3">
                <label htmlFor="teamLeader" className="block text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <CrownIcon className="h-4 w-4 text-coc-gold" />
                  Pilih Leader Tim
                </label>
                <div className="relative">
                    <select
                    id="teamLeader"
                    value={selectedLeaderUid}
                    onChange={(e) => setSelectedLeaderUid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-coc-blue/50 cursor-pointer disabled:opacity-50 font-sans"
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <UsersIcon className="h-4 w-4" />
                    </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex-shrink-0 p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
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
                className="shadow-lg shadow-coc-blue/10 px-8 font-bold tracking-wide bg-coc-blue hover:bg-coc-blue/80 border-coc-blue/50 text-white"
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default EditTeamModal;