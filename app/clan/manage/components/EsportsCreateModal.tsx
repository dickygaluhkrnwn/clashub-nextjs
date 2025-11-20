'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

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
  const { t } = useLanguage(); // [BARU]
  const [teamName, setTeamName] = useState('');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [selectedLeaderUid, setSelectedLeaderUid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ title: '', message: '' });

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
        onAction(t.clanEsports.valMaxCount, 'error'); // [i18n]
        return;
      }
      newSelectedUids.push(uid);
    }
    setSelectedUids(newSelectedUids);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() === '') {
      onAction(t.clanEsports.valNameEmpty, 'error'); // [i18n]
      return;
    }
    if (selectedUids.length !== 5) {
      onAction(t.clanEsports.valCountError, 'error'); // [i18n]
      return;
    }
    if (selectedLeaderUid === '') {
      onAction(t.clanEsports.valLeaderEmpty, 'error'); // [i18n]
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
        title: t.clanEsports.alertCreateTitle, // [i18n]
        message: t.clanEsports.alertCreateMessage, // [i18n]
      });
      setIsAlertOpen(true);
    } catch (error) {
      console.error('Error creating team:', error);
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

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="relative w-full max-w-lg rounded-xl card-stone shadow-xl border-2 border-coc-gold/50">
          <form onSubmit={handleSubmit}>
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b border-coc-gold-dark/30">
              <h3 className="text-xl font-clash text-coc-gold flex items-center">
                <UserPlusIcon className="h-6 w-6 mr-3" />
                {t.clanEsports.createModalTitle} {/* [i18n] */}
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
                  {t.clanEsports.labelTeamName} {/* [i18n] */}
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={t.clanEsports.placeholderTeamName} // [i18n]
                  className="input-base"
                  disabled={isSubmitting}
                />
              </div>

              {/* Pemilih Anggota */}
              <div>
                <label className="block text-sm font-medium text-gray-300 font-sans mb-1">
                  {t.clanEsports.labelSelectMembers.replace('{count}', selectedUids.length.toString())} {/* [i18n] */}
                </label>
                <p className="text-xs text-gray-400 font-sans mb-2">
                  {t.clanEsports.helperSelectMembers} {/* [i18n] */}
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 rounded-lg bg-coc-stone-dark/30 p-3">
                  {availableMembers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      {t.clanEsports.noVerifiedMembers} {/* [i18n] */}
                    </p>
                  ) : (
                    availableMembers.map((member) => {
                      const isSelected = selectedUids.includes(member.uid);
                      const isInOtherTeam = membersInOtherTeams.has(member.uid);
                      const isDisabled =
                        (isInOtherTeam && !isSelected) ||
                        (selectedUids.length >= 5 && !isSelected) ||
                        isSubmitting;

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
                                {t.clanEsports.alreadyInTeam} {/* [i18n] */}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pemilih Leader Tim */}
              <div>
                <label
                  htmlFor="teamLeader"
                  className="block text-sm font-medium text-gray-300 font-sans mb-1"
                >
                  <CrownIcon className="h-4 w-4 mr-1.5 inline-block" />
                  {t.clanEsports.labelSelectLeader} {/* [i18n] */}
                </label>
                <select
                  id="teamLeader"
                  value={selectedLeaderUid}
                  onChange={(e) => setSelectedLeaderUid(e.target.value)}
                  className="input-base"
                  disabled={isSubmitting || selectedUids.length !== 5}
                >
                  <option value="" disabled>
                    {selectedUids.length !== 5
                      ? t.clanEsports.optionSelect5First // [i18n]
                      : t.clanEsports.placeholderSelectLeader} // [i18n]
                  </option>
                  {selectedMembers.map((member) => (
                    <option key={member.uid} value={member.uid}>
                      {member.displayName} (TH{member.thLevel})
                    </option>
                  ))}
                </select>
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
                {t.common.cancel} {/* [i18n] */}
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
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <PlusIcon className="h-5 w-5 mr-2" />
                )}
                {isSubmitting ? t.clanEsports.btnSaving : t.clanEsports.btnSave} {/* [i18n] */}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTeamModal;