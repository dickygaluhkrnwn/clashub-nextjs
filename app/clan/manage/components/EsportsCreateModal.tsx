'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  UsersIcon,
  TrophyIcon
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

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-sans">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
            onClick={onClose} 
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-2xl bg-[#15171e] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[calc(100vh-40px)] animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-white/5">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
          
          <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-coc-gold/10 rounded-2xl border border-coc-gold/20 shadow-lg shadow-coc-gold/5">
                    <TrophyIcon className="h-6 w-6 text-coc-gold" />
                 </div>
                 <div>
                    <h3 className="text-xl font-clash text-white tracking-wide">
                        {t.clanEsports.createModalTitle}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">Setup your roster</p>
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

            {/* Body */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {/* Team Name */}
              <div className="space-y-3">
                <label htmlFor="teamName" className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                  {t.clanEsports.labelTeamName}
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={t.clanEsports.placeholderTeamName}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-coc-gold/50 focus:ring-1 focus:ring-coc-gold/50 transition-all font-clash tracking-wide text-lg"
                  disabled={isSubmitting}
                />
              </div>

              {/* Member Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider">
                    {t.clanEsports.labelSelectMembers.replace('{count}', selectedUids.length.toString())}
                    </label>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${selectedUids.length === 5 ? 'bg-coc-green/10 text-coc-green border-coc-green/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {selectedUids.length}/5 Selected
                    </span>
                </div>
                
                <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                  {availableMembers.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center">
                        <UsersIcon className="h-10 w-10 text-gray-700 mb-3" />
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
                            className={`w-full flex items-center justify-between p-4 transition-all ${
                                isSelected ? 'bg-coc-gold/10' : 'hover:bg-white/5'
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
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-coc-gold flex items-center justify-center border-2 border-[#15171e] shadow-md">
                                            <CheckIcon className="w-3 h-3 text-black stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className={`text-sm font-bold font-clash tracking-wide ${isSelected ? 'text-white' : 'text-gray-200'}`}>
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
                  {t.clanEsports.labelSelectLeader}
                </label>
                <div className="relative">
                    <select
                    id="teamLeader"
                    value={selectedLeaderUid}
                    onChange={(e) => setSelectedLeaderUid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-coc-gold/50 cursor-pointer disabled:opacity-50 font-sans"
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <UsersIcon className="h-4 w-4" />
                    </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
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
                className="shadow-lg shadow-coc-gold/10 px-8 font-bold tracking-wide"
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