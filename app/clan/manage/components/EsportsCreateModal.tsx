'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom'; // [PERBAIKAN UTAMA] Import createPortal
import Image from 'next/image';
import { UserProfile, FirestoreDocument, EsportsTeam } from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import {
  UserPlusIcon,
  XIcon,
  Loader2Icon,
  PlusIcon,
  CheckIcon,
  CrownIcon,
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import AlertDialog from '@/app/components/ui/AlertDialog';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
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
  availableMembers,
  onAction,
  onCreateTeam,
  allTeams,
}) => {
  const { t } = useLanguage();
  const [teamName, setTeamName] = useState('');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [selectedLeaderUid, setSelectedLeaderUid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '' });

  // [PERBAIKAN] State untuk mendeteksi apakah komponen sudah mounted (Client-side only)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTeamName('');
      setSelectedUids([]);
      setSelectedLeaderUid('');
      setIsSubmitting(false);
      setIsAlertOpen(false);
      setAlertInfo({ title: '', message: '' });
    }
  }, [isOpen]);

  const membersInOtherTeams = useMemo(() => {
    const uids = new Set<string>();
    allTeams.forEach((team) => {
      team.memberUids.forEach((uid) => uids.add(uid));
    });
    return uids;
  }, [allTeams]);

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
        onAction(t.clanEsports.valMaxCount, 'error');
        return;
      }
      newSelectedUids.push(uid);
    }
    setSelectedUids(newSelectedUids);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() === '') {
      onAction(t.clanEsports.valNameEmpty, 'error');
      return;
    }
    if (selectedUids.length !== 5) {
      onAction(t.clanEsports.valCountError, 'error');
      return;
    }
    if (selectedLeaderUid === '') {
      onAction(t.clanEsports.valLeaderEmpty, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const memberUidsTuple: [string, string, string, string, string] = [
        selectedUids[0],
        selectedUids[1],
        selectedUids[2],
        selectedUids[3],
        selectedUids[4],
      ];

      await onCreateTeam(teamName, selectedLeaderUid, memberUidsTuple);

      setAlertInfo({
        title: t.clanEsports.alertCreateTitle,
        message: t.clanEsports.alertCreateMessage,
      });
      setIsAlertOpen(true);
    } catch (error) {
      console.error('Error creating team:', error);
      onAction((error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jangan render apa pun jika belum mounted atau tidak open
  if (!isOpen || !mounted) return null;

  // [PERBAIKAN] Konten Modal dipisahkan ke variabel
  const modalContent = (
    <>
      {/* Alert Dialog (Jika AlertDialog bawaan belum pakai Portal, ini juga akan ikut ter-portal sekarang) */}
      <AlertDialog
        isOpen={isAlertOpen}
        onClose={() => {
          setIsAlertOpen(false);
          onClose();
        }}
        title={alertInfo.title}
        message={alertInfo.message}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-sans">
        {/* Backdrop dengan blur */}
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
            onClick={onClose} 
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-40px)] animate-in zoom-in-95 duration-200">
          
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Header Modal - Fixed at top */}
            <div className="flex-shrink-0 flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-clash text-white flex items-center gap-3">
                <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
                    <UserPlusIcon className="h-5 w-5 text-coc-gold" />
                </div>
                {t.clanEsports.createModalTitle}
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

            {/* Body Modal (Scrollable Content) */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Input Nama Tim */}
              <div className="space-y-2">
                <label htmlFor="teamName" className="block text-sm font-bold text-gray-300">
                  {t.clanEsports.labelTeamName}
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={t.clanEsports.placeholderTeamName}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-coc-gold/50 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Pemilih Anggota */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-gray-300">
                    {t.clanEsports.labelSelectMembers.replace('{count}', selectedUids.length.toString())}
                    </label>
                    <span className="text-xs text-coc-gold/70">Max 5</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {t.clanEsports.helperSelectMembers}
                </p>
                
                <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                  {availableMembers.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">{t.clanEsports.noVerifiedMembers}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                        {availableMembers.map((member) => {
                        const isSelected = selectedUids.includes(member.uid);
                        const isInOtherTeam = membersInOtherTeams.has(member.uid);
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
                                <div className="relative flex-shrink-0">
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
                                <div className="text-left min-w-0">
                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {member.displayName}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">TH {member.thLevel}</p>
                                </div>
                            </div>
                            
                            {isInOtherTeam && !isSelected && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 whitespace-nowrap ml-2">
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
                  {t.clanEsports.labelSelectLeader}
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
                        ? t.clanEsports.optionSelect5First
                        : t.clanEsports.placeholderSelectLeader}
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

            {/* Footer Modal - Fixed at bottom */}
            <div className="flex-shrink-0 p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
              >
                {t.common.cancel}
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
                  <PlusIcon className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? t.clanEsports.btnSaving : t.clanEsports.btnSave}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // [PERBAIKAN UTAMA] Render Modal ke document.body menggunakan Portal
  return createPortal(modalContent, document.body);
};

export default CreateTeamModal;