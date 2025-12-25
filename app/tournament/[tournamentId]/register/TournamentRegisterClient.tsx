'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  UserPlusIcon,
  CrownIcon,
  PlusIcon,
  XIcon,
  TrophyIcon,
  ArrowLeftIcon,
  UsersIcon
} from '@/app/components/icons';
import { getThImage, validateTeamThRequirements } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface TournamentRegisterClientProps {
  tournament: Tournament;
}

export default function TournamentRegisterClient({
  tournament,
}: TournamentRegisterClientProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  
  const { userProfile } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<CocMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

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
      badgeUrl: clanData?.logoUrl || '/images/clan-badge-placeholder.png',
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
        message: t.clanEsports.valMaxCount,
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

    if (!teamName.trim()) {
      setNotification({
        message: t.clanEsports.valNameEmpty,
        type: 'error',
        onClose: () => setNotification(null),
      });
      setIsLoading(false);
      return;
    }

    if (selectedMembers.length !== tournament.teamSize) {
      setNotification({
        message: t.clanEsports.valCountError,
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

    const thValidation = validateTeamThRequirements(
      teamToValidate,
      tournament.thRequirement,
    );

    if (!thValidation.isValid) {
      setNotification({
        message: thValidation.message,
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
          headers: { 'Content-Type': 'application/json' },
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
        message: t.clanEsports.toastCreateSuccess,
        type: 'success',
        onClose: () => setNotification(null),
      });
      
      setTimeout(() => {
         router.push(`/tournament/${tournament.id}`);
      }, 2000);
      
    } catch (err: any) {
      setNotification({
        message: err.message || t.common.error,
        type: 'error',
        onClose: () => setNotification(null),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render UI ---

  // Loading State
  if (isLoadingClan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-black/40 backdrop-blur-md rounded-3xl border border-white/5">
        <Loader2Icon className="w-12 h-12 animate-spin text-coc-gold mb-4" />
        <p className="text-gray-400 animate-pulse">{t.clanManage.loadingUserData}</p>
      </div>
    );
  }

  // Access Denied State (Not Verified / No Clan)
  if (!userProfile || !managedClan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-black/40 backdrop-blur-md rounded-3xl border border-red-500/30 p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
           <AlertTriangleIcon className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-clash text-white mb-2">{t.clanManage.accessDenied}</h3>
        <p className="text-gray-400 max-w-md mx-auto mb-6">{t.clanManage.accessDeniedDesc}</p>
        <Button href="/profile/edit" variant="outline">Verifikasi Profil</Button>
      </div>
    );
  }

  // Tournament Status Checks
  if (tournament.status !== 'registration_open') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 text-center">
           <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
           <h3 className="text-2xl font-clash text-white mb-2">Pendaftaran Ditutup</h3>
           <Button href={`/tournament/${tournament.id}`} variant="secondary" className="mt-4">
              Kembali ke Detail
           </Button>
        </div>
     );
  }

  // Member Check
  if (availableMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 text-center">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">{t.clanEsports.errorMembersTitle}</h3>
        <p className="text-gray-400 mb-6">{t.clanEsports.noVerifiedMembers}</p>
        <Button href="/clan/manage" variant="primary">Kelola Anggota</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      
      {notification && <Notification notification={notification} />}

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-8">
           {/* Tombol kembali dihapus di sini */}
           <h1 className="text-3xl md:text-4xl font-clash text-white mb-2 flex items-center gap-3">
              <TrophyIcon className="h-8 w-8 text-coc-gold" />
              Registrasi Tim
           </h1>
           <p className="text-gray-400">
              Daftarkan tim Anda untuk <span className="text-coc-gold font-bold">{tournament.title}</span>
           </p>
        </header>

        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
           
           {/* Section 1: Team Info */}
           <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                 <CrownIcon className="h-5 w-5 text-coc-gold" /> Info Tim
              </h3>
              
              <div>
                 <label htmlFor="teamName" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {t.clanEsports.labelTeamName}
                 </label>
                 <input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={t.clanEsports.placeholderTeamName}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold transition-all"
                    maxLength={30}
                 />
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-coc-blue/10 border border-coc-blue/20 rounded-xl">
                 <div className="relative w-10 h-10">
                    <Image 
                       src={managedClan.badgeUrl} 
                       alt={managedClan.name} 
                       fill 
                       className="object-contain"
                    />
                 </div>
                 <div>
                    <p className="text-xs text-coc-blue font-bold uppercase">Mewakili Klan</p>
                    <p className="text-white font-bold">{managedClan.name}</p>
                 </div>
              </div>
           </div>

           {/* Section 2: Roster Selection */}
           <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                 <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-coc-gold" /> Roster
                 </h3>
                 <span className={`text-sm font-bold ${selectedMembers.length === tournament.teamSize ? 'text-coc-green' : 'text-gray-400'}`}>
                    {selectedMembers.length} / {tournament.teamSize} Pemain
                 </span>
              </div>

              {/* Selected Members (Chips) */}
              <div className="min-h-[60px] p-4 bg-white/5 rounded-xl border border-white/5 border-dashed flex flex-wrap gap-2">
                 {selectedMembers.length === 0 ? (
                    <p className="text-gray-500 text-sm w-full text-center py-2 italic">
                       {t.clanEsports.helperSelectMembers}
                    </p>
                 ) : (
                    selectedMembers.map((member) => (
                       <div 
                         key={member.tag} 
                         className="flex items-center gap-2 bg-coc-gold/10 border border-coc-gold/30 text-white pl-2 pr-1 py-1 rounded-lg animate-in zoom-in-95 duration-200"
                       >
                          <div className="w-5 h-5 relative">
                             <Image 
                               src={getThImage(member.townHallLevel)} 
                               alt={`TH${member.townHallLevel}`} 
                               fill 
                               className="object-contain" 
                             />
                          </div>
                          <span className="text-sm font-bold">{member.name}</span>
                          <button 
                             onClick={() => handleMemberDeselect(member.tag)}
                             className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                          >
                             <XIcon className="w-3 h-3" />
                          </button>
                       </div>
                    ))
                 )}
              </div>

              {/* Available Members List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 <p className="text-xs font-bold text-gray-500 uppercase mb-2 sticky top-0 bg-coc-dark z-10 py-1">
                    Anggota Tersedia
                 </p>
                 {availableMembers.map((member) => {
                    const isSelected = selectedMembers.some(m => m.tag === member.tag);
                    const isFull = selectedMembers.length >= tournament.teamSize;
                    
                    return (
                       <button
                          key={member.tag}
                          onClick={() => !isSelected && !isFull && handleMemberSelect(member)}
                          disabled={isSelected || (isFull && !isSelected)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group text-left ${
                             isSelected 
                               ? 'bg-coc-gold/5 border-coc-gold/30 opacity-50 cursor-default'
                               : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                          }`}
                       >
                          <div className="flex items-center gap-3">
                             <div className="relative w-8 h-8">
                                <Image src={getThImage(member.townHallLevel)} alt={`TH${member.townHallLevel}`} fill className="object-contain" />
                             </div>
                             <div>
                                <p className={`font-bold text-sm ${isSelected ? 'text-coc-gold' : 'text-white'}`}>
                                   {member.name}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                   {member.role} • TH {member.townHallLevel}
                                </p>
                             </div>
                          </div>
                          <div>
                             {isSelected ? (
                                <CheckIcon className="w-5 h-5 text-coc-gold" />
                             ) : (
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-coc-green/20 transition-colors">
                                   <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-coc-green" />
                                </div>
                             )}
                          </div>
                       </button>
                    );
                 })}
              </div>
           </div>

           {/* Submit Action */}
           <div className="pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="w-auto px-6" // Hapus w-full, buat auto
                onClick={() => router.back()}
                disabled={isLoading}
              >
                 Batal
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-auto px-8 shadow-lg shadow-coc-gold/10 font-bold tracking-wide" // Hapus w-full, buat auto
                onClick={handleRegister}
                disabled={isLoading || selectedMembers.length !== tournament.teamSize || !teamName.trim()}
              >
                 {isLoading ? (
                    <div className="flex items-center gap-2">
                       <Loader2Icon className="w-5 h-5 animate-spin" />
                       <span>Mendaftarkan...</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                       <UserPlusIcon className="w-5 h-5" />
                       <span>Daftarkan Tim</span>
                    </div>
                 )}
              </Button>
           </div>

        </div>
      </div>
    </div>
  );
}