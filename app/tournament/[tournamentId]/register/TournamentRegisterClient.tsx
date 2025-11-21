'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Tournament,
  TournamentTeamMember,
} from '@/lib/clashub.types';
import { CocMember } from '@/lib/coc.types';
import { ClanRole } from '@/lib/enums';
import { useAuth } from '@/app/context/AuthContext';
import { useManagedClanCache } from '@/lib/hooks/useManagedClan';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  Loader2Icon,
  AlertTriangleIcon,
  CheckIcon,
} from '@/app/components/icons/ui-feedback';
import {
  UserPlusIcon,
  CrownIcon,
} from '@/app/components/icons/ui-user';
import { PlusIcon } from '@/app/components/icons/ui-actions';
import { XIcon, ClockIcon } from '@/app/components/icons/ui-general';
import { getThImage, validateTeamThRequirements } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook i18n

interface TournamentRegisterClientProps {
  tournament: Tournament;
}

export default function TournamentRegisterClient({
  tournament,
}: TournamentRegisterClientProps) {
  const { t, language } = useLanguage(); // [BARU] Init Hook
  const locale = language === 'id' ? 'id-ID' : 'en-US';

  const { userProfile } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<CocMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  // [i18n] Helper format tanggal dinamis
  const formatTanggal = (dateInput: Date | string): string => {
    const date = new Date(dateInput);
    return date.toLocaleString(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  const {
    clanData,
    clanCache,
    isLoading: isLoadingClan,
  } = useManagedClanCache(userProfile?.clanId || '');

  const managedClan = useMemo(() => {
    if (!userProfile || !userProfile.clanId) return null;
    return {
      id: userProfile.clanId,
      tag: userProfile.clanTag!,
      name: userProfile.clanName!,
      badgeUrl:
        clanData?.logoUrl || '/images/clan-badge-placeholder.png',
    };
  }, [userProfile, clanData]);

  const isUserLeaderOrCo =
    userProfile?.clanRole === ClanRole.LEADER ||
    userProfile?.clanRole === ClanRole.CO_LEADER;

  const availableMembers = useMemo(() => {
    const allMembers = clanCache?.members || [];

    if (isUserLeaderOrCo) {
      return allMembers;
    }

    if (userProfile?.playerTag) {
      const self = allMembers.find((m) => m.tag === userProfile.playerTag);
      return self ? [self] : [];
    }

    return [];
  }, [clanCache?.members, userProfile?.playerTag, isUserLeaderOrCo]);

  const handleMemberSelect = (member: CocMember) => {
    if (selectedMembers.find((m) => m.tag === member.tag)) return;

    if (selectedMembers.length >= tournament.teamSize) {
      setNotification({
        message: t.clanEsports.valMaxCount, // [i18n]
        type: 'warning',
        onClose: () => setNotification(null),
      });
      return;
    }

    setSelectedMembers((prev) => [...prev, member]);
  };

  const handleMemberDeselect = (memberTag: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.tag !== memberTag));
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setNotification(null);

    // 1. Validasi Nama Tim
    if (!teamName.trim()) {
      setNotification({
        message: t.clanEsports.valNameEmpty, // [i18n]
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    // 2. Validasi Jumlah Pemain
    if (selectedMembers.length !== tournament.teamSize) {
      setNotification({
        message: t.clanEsports.valCountError, // [i18n]
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    const teamToValidate: TournamentTeamMember[] = selectedMembers.map(
      (member) => ({
        playerTag: member.tag,
        playerName: member.name,
        townHallLevel: member.townHallLevel,
      }),
    );

    // 4. Validasi Aturan TH
    const thValidation = validateTeamThRequirements(
      teamToValidate,
      tournament.thRequirement,
    );

    if (!thValidation.isValid) {
      setNotification({
        message: thValidation.message, // Pesan ini biasanya teknis, bisa dibiarkan atau di-i18n kan di utility th-utils nanti
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamName: teamName.trim(),
            members: teamToValidate,
            originClanTag: managedClan?.tag,
            originClanBadgeUrl: managedClan?.badgeUrl,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      setNotification({
        message: t.clanEsports.toastCreateSuccess, // [i18n] Gunakan pesan sukses create team
        type: 'success',
        onClose: () => setNotification(null),
      });
      
      setTeamName('');
      setSelectedMembers([]);
    } catch (err: any) {
      console.error('Error mendaftar turnamen:', err);
      setNotification({
        message: err.message || t.common.error,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Kondisi Loading dan Error ---

  if (isLoadingClan) {
    return (
      <div className="card-stone p-6 text-center flex items-center justify-center gap-2">
        <Loader2Icon className="w-6 h-6 animate-spin" />
        <span className="text-muted-foreground">{t.clanManage.loadingUserData}</span>
      </div>
    );
  }

  if (!userProfile || !managedClan) {
    return (
      <div className="card-stone p-6 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          {t.clanManage.accessDenied}
        </h3>
        <p className="text-muted-foreground">
          {t.clanManage.accessDeniedDesc}
        </p>
      </div>
    );
  }

  // [i18n] Render Kondisi Status Turnamen
  switch (tournament.status) {
    case 'scheduled':
      return (
        <div className="card-stone p-6 text-center">
          <ClockIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold clash-font mb-2">
            {t.tournament.detail.regNotOpenBtn}
          </h3>
          <p className="text-muted-foreground">
            {t.tournament.detail.infoRegStart}:
          </p>
          <p className="text-white font-semibold mt-1">
            {formatTanggal(tournament.registrationStartsAt)}
          </p>
        </div>
      );
    case 'registration_closed':
    case 'ongoing':
    case 'completed':
      return (
        <div className="card-stone p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold clash-font mb-2">
            {t.tournament.detail.regClosedBtn}
          </h3>
          <p className="text-muted-foreground">
             {t.tournament.detail.bracketEmptyDesc}
          </p>
        </div>
      );
    case 'cancelled':
      return (
        <div className="card-stone p-6 text-center">
          <XIcon className="w-12 h-12 text-coc-red mx-auto mb-4" />
          <h3 className="text-xl font-semibold clash-font mb-2">
            {t.tournament.cardStatusCancelled}
          </h3>
          <p className="text-muted-foreground">
             -
          </p>
        </div>
      );
    case 'draft':
      return (
        <div className="card-stone p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold clash-font mb-2">
            {t.tournament.cardStatusDraft}
          </h3>
        </div>
      );
    case 'registration_open':
      // Status OK
      break;
    default:
      return (
        <div className="card-stone p-6 text-center">
          <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold clash-font mb-2">
            Invalid Status
          </h3>
        </div>
      );
  }

  if (availableMembers.length === 0) {
    return (
      <div className="card-stone p-6 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold clash-font mb-2">
          {t.clanEsports.errorMembersTitle}
        </h3>
        <p className="text-muted-foreground">
          {t.clanEsports.noVerifiedMembers}
        </p>
      </div>
    );
  }

  return (
    <>
        {notification && <Notification notification={notification} />}

        <div className="card-stone p-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-coc-gold-dark/20 pb-2 clash-font">
            {/* [i18n] Daftarkan Tim Baru */}
            {t.clanEsports.createTeam} ({managedClan.name})
          </h3>

          {/* Step 1: Input Nama Tim */}
          <div className="mb-4">
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-coc-font-secondary mb-1"
            >
              {t.clanEsports.labelTeamName}
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={t.clanEsports.placeholderTeamName}
              className="input-base"
              maxLength={30}
            />
          </div>

          {/* Step 2: Pilih Member */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-coc-font-secondary mb-2">
              {/* [i18n] Pilih Anggota (x/5) */}
              {t.clanEsports.labelSelectMembers.replace('{count}', selectedMembers.length.toString())}
            </label>

            {/* Container untuk member yang dipilih */}
            <div className="mb-4 rounded-lg bg-coc-dark-blue/30 p-3 min-h-[60px]">
              {selectedMembers.length === 0 ? (
                <p className="text-sm text-center text-coc-font-secondary/50 py-2">
                  {t.clanEsports.helperSelectMembers}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.tag}
                      className="flex items-center gap-2 bg-coc-primary-light/20 text-coc-primary-light py-1 px-3 rounded-full text-sm font-medium"
                    >
                      <Image
                        src={getThImage(member.townHallLevel)}
                        alt={`TH${member.townHallLevel}`}
                        width={20}
                        height={20}
                      />
                      <span>{member.name}</span>
                      <button
                        onClick={() => handleMemberDeselect(member.tag)}
                        className="text-coc-primary-light/70 hover:text-white"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daftar member yang tersedia */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {availableMembers.map((member) => {
                const isSelected = selectedMembers.some(
                  (m) => m.tag === member.tag,
                );
                const isFull =
                  selectedMembers.length >= tournament.teamSize;
                const isLeaderOrCo =
                  member.role === 'leader' || member.role === 'coLeader';

                return (
                  <div
                    key={member.tag}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-coc-dark-blue/80 border-coc-primary-light'
                        : 'bg-coc-dark-blue/30 border-coc-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={getThImage(member.townHallLevel)}
                        alt={`TH${member.townHallLevel}`}
                        width={32}
                        height={32}
                      />
                      <div>
                        <span
                          className={`font-semibold ${
                            isSelected
                              ? 'text-coc-font-primary'
                              : 'text-coc-font-secondary'
                          }`}
                        >
                          {member.name}
                        </span>
                        <p className="text-xs text-coc-font-secondary/70 flex items-center gap-1">
                          {isLeaderOrCo && (
                            <CrownIcon className="w-3 h-3 text-coc-gold" />
                          )}
                          <span>{member.role}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMemberSelect(member)}
                      disabled={isSelected || (isFull && !isSelected)}
                      className="px-2 py-1"
                    >
                      {isSelected ? (
                        <CheckIcon className="w-5 h-5 text-coc-green" />
                      ) : (
                        <PlusIcon className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Tombol Aksi */}
          <Button
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleRegister}
            disabled={
              isLoading ||
              selectedMembers.length !== tournament.teamSize ||
              !teamName.trim()
            }
          >
            {isLoading ? (
              <>
                <Loader2Icon className="w-5 h-5 animate-spin" />
                <span>{t.clanBanners.btnSubmitting}</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="w-5 h-5" />
                <span>{t.tournament.detail.registerBtn}</span>
              </>
            )}
          </Button>
        </div>
    </>
  );
}