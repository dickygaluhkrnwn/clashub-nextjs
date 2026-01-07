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
  UsersCogIcon,
  UserIcon
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pt-6 border-t border-white/10">
      <Notification notification={notification ?? undefined} />

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
            <h3 className="font-clash text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                   <UsersCogIcon className="h-6 w-6 text-coc-gold" />
                </div>
                {t.tournamentManage.staff.listTitle}
            </h3>
            <p className="text-gray-400 text-sm mt-2 font-sans max-w-md">Kelola tim panitia yang akan membantu menjalankan turnamen ini.</p>
        </div>
      </div>

      {/* Bagian 1: Form Undangan (Hanya untuk Organizer) */}
      {isOrganizer && (
        <div className="bg-[#15171e]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-1 h-full bg-coc-gold opacity-50" />
           
           <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                 <h4 className="text-lg font-bold text-white mb-2 font-clash">{t.tournamentManage.staff.inviteTitle}</h4>
                 <p className="text-sm text-gray-400">{t.tournamentManage.staff.inviteDesc}</p>
                 
                 <form onSubmit={handleInvite} className="mt-4 flex gap-3">
                    <div className="flex-grow relative">
                       <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          <UserPlusIcon className="h-4 w-4" />
                       </div>
                       <Input
                          type="email"
                          placeholder={t.tournamentManage.staff.inputPlaceholder}
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          disabled={isInviting}
                          className="pl-10 bg-[#0a0a0b] border-white/10 h-10 text-sm focus:ring-coc-gold/50"
                        />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isInviting || !inviteEmail}
                      className="h-10 px-6 shadow-lg font-bold"
                    >
                      {isInviting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : t.tournamentManage.staff.btnInvite}
                    </Button>
                 </form>
              </div>
              
              <div className="hidden md:flex flex-col items-center justify-center p-4 bg-[#0a0a0b] rounded-2xl border border-white/5 w-48 text-center">
                 <UsersCogIcon className="h-8 w-8 text-coc-gold mb-2 opacity-80" />
                 <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total Staff</p>
                 <p className="text-2xl font-clash text-white">{staffProfiles.length}</p>
              </div>
           </div>
        </div>
      )}

      {/* Bagian 2: Daftar Staf Saat Ini */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 bg-[#15171e]/50 rounded-3xl border border-white/5">
            <div className="text-center">
               <Loader2Icon className="h-8 w-8 animate-spin text-coc-gold mx-auto mb-2 opacity-50" />
               <p className="text-sm text-gray-500 font-clash tracking-widest uppercase">Loading Staff...</p>
            </div>
          </div>
        ) : staffProfiles.length === 0 ? (
          <div className="bg-red-900/10 p-10 text-center rounded-3xl border border-red-500/20 border-dashed">
             <AlertTriangleIcon className="h-10 w-10 text-coc-red/70 mx-auto mb-3" />
             <p className="text-gray-400 mb-4 font-bold">{t.tournamentManage.staff.listError}</p>
             <Button variant="secondary" size="sm" onClick={fetchStaffProfiles}>
                {t.tournamentManage.staff.listRetry}
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffProfiles.map((staff) => {
              const isOrg = staff.uid === tournament.organizerUid;
              const isSelf = staff.uid === currentUser?.uid;

              return (
                <div
                  key={staff.uid}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                     isOrg 
                       ? 'bg-gradient-to-r from-coc-gold/10 to-[#15171e] border-coc-gold/30' 
                       : 'bg-[#15171e] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full p-0.5 ${isOrg ? 'bg-gradient-to-b from-coc-gold to-yellow-600' : 'bg-white/10'}`}>
                         <Image
                           src={staff.avatarUrl || '/images/placeholder-avatar.png'}
                           alt="Avatar"
                           width={48}
                           height={48}
                           className="rounded-full object-cover w-full h-full bg-[#0a0a0b]"
                         />
                      </div>
                      {isOrg && (
                         <div className="absolute -top-1 -right-1 bg-[#0a0a0b] rounded-full p-1 border border-coc-gold shadow-lg" title="Organizer">
                            <CrownIcon className="h-3 w-3 text-coc-gold" />
                         </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                         <p className={`text-base font-bold font-clash ${isOrg ? 'text-coc-gold' : 'text-white'}`}>
                           {staff.displayName}
                         </p>
                         {isSelf && (
                           <span className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded border border-white/10 font-bold uppercase tracking-wider">
                              YOU
                           </span>
                         )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-[150px] sm:max-w-[200px]">
                        {staff.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isOrg ? (
                       <span className="text-[10px] font-bold text-coc-gold uppercase tracking-widest bg-coc-gold/10 px-3 py-1.5 rounded-lg border border-coc-gold/20">
                          {t.tournamentManage.staff.roleOrganizer}
                       </span>
                    ) : (
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-coc-blue uppercase tracking-widest bg-coc-blue/10 px-3 py-1.5 rounded-lg border border-coc-blue/20">
                             Staff
                          </span>
                          
                          {/* Tombol Hapus */}
                          {isOrganizer && (
                             <button
                               onClick={() => handleRemove(staff.uid)}
                               disabled={isRemoving === staff.uid}
                               className="h-8 w-8 flex items-center justify-center rounded-lg bg-coc-red/10 text-coc-red hover:bg-coc-red hover:text-white border border-coc-red/30 transition-all shadow-sm"
                               title="Remove Staff"
                             >
                                {isRemoving === staff.uid ? (
                                   <Loader2Icon className="h-4 w-4 animate-spin" />
                                ) : (
                                   <TrashIcon className="h-4 w-4" />
                                )}
                             </button>
                          )}
                       </div>
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