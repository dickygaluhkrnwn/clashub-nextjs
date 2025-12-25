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
  UsersCogIcon
} from '@/app/components/icons';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';

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
  const { t } = useLanguage();
  const { currentUser } = useAuth(); 
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const [notification, setNotification] = useState<NotificationProps | null>(null);

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
        throw new Error(result.error || t.tournamentManage.staff.listError);
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
    showNotification(t.tournamentManage.staff.toastInviting, 'info');

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
    showNotification(t.tournamentManage.staff.toastRemoving, 'info');

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

      showNotification(t.tournamentManage.staff.toastRemoveSuccess, 'success');
      fetchStaffProfiles();
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <Notification notification={notification ?? undefined} />

      {/* Bagian 1: Form Undangan (Hanya untuk Organizer) */}
      {isOrganizer && (
        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-coc-gold/10 rounded-lg">
                <UserPlusIcon className="h-6 w-6 text-coc-gold" />
             </div>
             <div>
                <h3 className="font-clash text-xl text-white">
                  {t.tournamentManage.staff.inviteTitle}
                </h3>
                <p className="text-sm text-gray-400 font-sans">
                  {t.tournamentManage.staff.inviteDesc}
                </p>
             </div>
          </div>
          
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-grow">
               <Input
                type="email"
                placeholder={t.tournamentManage.staff.inputPlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                className="bg-black/20 border-white/10 h-[46px]" // Custom height match button
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isInviting || !inviteEmail}
              className="w-full sm:w-auto h-[46px] shadow-lg shadow-coc-gold/10"
            >
              {isInviting ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlusIcon className="h-5 w-5" />
              )}
              <span className="ml-2">{isInviting ? t.tournamentManage.staff.btnInviting : t.tournamentManage.staff.btnInvite}</span>
            </Button>
          </form>
        </div>
      )}

      {/* Bagian 2: Daftar Staf Saat Ini */}
      <div>
        <h3 className="font-clash text-xl text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
          <UsersCogIcon className="h-6 w-6 text-coc-blue" />
          {t.tournamentManage.staff.listTitle}
        </h3>

        {isLoading ? (
          <div className="flex justify-center items-center h-40 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-center">
               <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold mx-auto mb-2" />
               <p className="text-sm text-gray-400">Memuat data staf...</p>
            </div>
          </div>
        ) : staffProfiles.length === 0 ? (
          <div className="bg-red-500/5 p-8 text-center rounded-2xl border border-red-500/20">
             <AlertTriangleIcon className="h-10 w-10 text-coc-red/70 mx-auto mb-3" />
             <p className="text-gray-400 mb-4">{t.tournamentManage.staff.listError}</p>
             <Button variant="secondary" size="sm" onClick={fetchStaffProfiles}>
                {t.tournamentManage.staff.listRetry}
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {staffProfiles.map((staff) => {
              const isOrg = staff.uid === tournament.organizerUid;
              const isSelf = staff.uid === currentUser?.uid;

              return (
                <div
                  key={staff.uid}
                  className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={staff.avatarUrl || '/images/placeholder-avatar.png'}
                        alt="Avatar"
                        width={48}
                        height={48}
                        className={`rounded-full object-cover border-2 ${isOrg ? 'border-coc-gold' : 'border-white/10'}`}
                      />
                      {isOrg && (
                         <div className="absolute -top-1 -right-1 bg-coc-dark rounded-full p-0.5 border border-coc-gold/50">
                            <CrownIcon className="h-3 w-3 text-coc-gold" />
                         </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-base font-bold text-white flex items-center gap-2">
                        {staff.displayName}
                        {isSelf && (
                          <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                             {t.tournamentManage.staff.labelYou}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {staff.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isOrg ? (
                      <span className="text-xs font-bold text-coc-gold bg-coc-gold/10 px-3 py-1.5 rounded-full border border-coc-gold/20 flex items-center gap-1.5 shadow-sm">
                        <CrownIcon className="h-3.5 w-3.5" />
                        {t.tournamentManage.staff.roleOrganizer}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-coc-blue bg-coc-blue/10 px-3 py-1.5 rounded-full border border-coc-blue/20">
                        Staff
                      </span>
                    )}
                    
                    {/* Tombol Hapus */}
                    {isOrganizer && !isOrg && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemove(staff.uid)}
                        disabled={isRemoving === staff.uid}
                        className="h-8 w-8 p-0 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30"
                        title="Remove Staff"
                      >
                        {isRemoving === staff.uid ? (
                           <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                           <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;