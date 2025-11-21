'use client';

import React, { useState, useEffect } from 'react';
import {
  FirestoreDocument,
  Tournament,
  UserProfile,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  UserPlusIcon,
  TrashIcon,
  Loader2Icon,
  CrownIcon,
  AlertTriangleIcon,
} from '@/app/components/icons';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

interface StaffManagerProps {
  tournament: FirestoreDocument<Tournament>;
  isOrganizer: boolean;
}

type StaffProfile = Pick<
  UserProfile,
  'uid' | 'displayName' | 'avatarUrl' | 'email'
>;

const StaffManager: React.FC<StaffManagerProps> = ({
  tournament,
  isOrganizer,
}) => {
  const { t } = useLanguage(); // [BARU] Init Hook
  const { currentUser } = useAuth(); 
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const [notification, setNotification] =
    useState<NotificationProps | null>(null);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const fetchStaffProfiles = async () => {
    setIsLoading(true);
    const uidsToFetch = [
      tournament.organizerUid,
      ...tournament.committeeUids,
    ];

    try {
      const response = await fetch('/api/users/profiles-by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uids: uidsToFetch }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.tournamentManage.staff.listError); // [i18n]
      }

      setStaffProfiles(result.profiles || []);
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.organizerUid, tournament.committeeUids]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !isOrganizer) return;

    setIsInviting(true);
    showNotification(t.tournamentManage.staff.toastInviting, 'info'); // [i18n]

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      showNotification(result.message || t.common.success, 'success');
      setInviteEmail('');
      fetchStaffProfiles();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (uidToRemove: string) => {
    if (!isOrganizer || uidToRemove === tournament.organizerUid) return;

    setIsRemoving(uidToRemove);
    showNotification(t.tournamentManage.staff.toastRemoving, 'info'); // [i18n]

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/manage/remove`,
        {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uidToRemove: uidToRemove }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t.common.error);
      }

      showNotification(t.tournamentManage.staff.toastRemoveSuccess, 'success'); // [i18n]
      fetchStaffProfiles();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-8">
      <Notification notification={notification ?? undefined} />

      {/* Bagian 1: Form Undangan (Hanya untuk Organizer) */}
      {isOrganizer && (
        <div className="card-stone p-5 rounded-lg border border-coc-gold-dark/30">
          <h3 className="font-clash text-xl text-white mb-4">
            {t.tournamentManage.staff.inviteTitle} {/* [i18n] */}
          </h3>
          <p className="text-sm text-gray-400 mb-4 font-sans">
            {t.tournamentManage.staff.inviteDesc} {/* [i18n] */}
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder={t.tournamentManage.staff.inputPlaceholder} // [i18n]
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              className="flex-grow"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isInviting || !inviteEmail}
              className="w-full sm:w-auto"
            >
              {isInviting ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlusIcon className="h-5 w-5" />
              )}
              <span className="ml-2">{isInviting ? t.tournamentManage.staff.btnInviting : t.tournamentManage.staff.btnInvite}</span> {/* [i18n] */}
            </Button>
          </form>
        </div>
      )}

      {/* Bagian 2: Daftar Staf Saat Ini */}
      <div>
        <h3 className="font-clash text-xl text-white mb-4">
          {t.tournamentManage.staff.listTitle} {/* [i18n] */}
        </h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold" />
          </div>
        ) : staffProfiles.length === 0 ? (
          <div className="card-stone p-8 text-center rounded-lg border border-coc-gold-dark/20">
             <AlertTriangleIcon className="h-10 w-10 text-coc-yellow/70 mx-auto mb-3" />
            <p className="text-gray-400">{t.tournamentManage.staff.listError}</p> {/* [i18n] */}
            <Button variant="secondary" size="sm" onClick={fetchStaffProfiles} className="mt-3">{t.tournamentManage.staff.listRetry}</Button> {/* [i18n] */}
          </div>
        ) : (
          <div className="card-stone rounded-lg overflow-hidden border border-coc-gold-dark/30">
            <ul className="divide-y divide-coc-gold-dark/30">
              {staffProfiles.map((staff) => {
                const isOrg = staff.uid === tournament.organizerUid;
                const isSelf = staff.uid === currentUser?.uid;

                return (
                  <li
                    key={staff.uid}
                    className="flex items-center justify-between p-4 bg-coc-dark/40 hover:bg-coc-dark/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={
                          staff.avatarUrl || '/images/placeholder-avatar.png'
                        }
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <p className="text-base font-semibold text-white">
                          {staff.displayName}{' '}
                          {isSelf && (
                            <span className="text-xs text-coc-gold/80">{t.tournamentManage.staff.labelYou}</span> // [i18n]
                          )}
                        </p>
                        <p className="text-sm text-gray-400 font-mono">
                          {staff.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOrg && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-coc-gold/10 text-coc-gold text-xs font-bold">
                          <CrownIcon className="h-4 w-4" />
                          <span>{t.tournamentManage.staff.roleOrganizer}</span> {/* [i18n] */}
                        </div>
                      )}
                      
                      {/* Tombol Hapus */}
                      {isOrganizer && !isOrg && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemove(staff.uid)}
                          disabled={isRemoving === staff.uid}
                          className="px-2 py-1 h-8 w-8"
                        >
                          {isRemoving === staff.uid ? (
                             <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                             <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;