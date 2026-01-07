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
  UsersIcon,
  ShieldIcon
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0a0a0b] text-white">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-coc-gold/20 rounded-full blur-xl animate-pulse" />
            <Loader2Icon className="w-20 h-20 animate-spin text-coc-gold relative z-10" />
        </div>
        <p className="text-gray-400 font-clash tracking-widest uppercase mt-4 animate-pulse">{t.clanManage.loadingUserData}</p>
      </div>
    );
  }

  // Access Denied State (Not Verified / No Clan)
  if (!userProfile || !managedClan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0a0a0b] p-4">
        <div className="bg-[#15171e] backdrop-blur-md rounded-3xl border border-red-500/30 p-10 text-center max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 mx-auto">
             <AlertTriangleIcon className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-clash text-white mb-3 uppercase tracking-wide">{t.clanManage.accessDenied}</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed font-sans">{t.clanManage.accessDeniedDesc}</p>
          <Button href="/profile/edit" variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">Verifikasi Profil</Button>
        </div>
      </div>
    );
  }

  // Tournament Status Checks
  if (tournament.status !== 'registration_open') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0a0a0b] p-4">
           <div className="bg-[#15171e] backdrop-blur-md rounded-3xl border border-yellow-500/30 p-10 text-center max-w-md shadow-2xl">
              <AlertTriangleIcon className="w-16 h-16 text-yellow-500 mb-6 mx-auto opacity-80" />
              <h3 className="text-2xl font-clash text-white mb-2 uppercase">Registration Closed</h3>
              <p className="text-gray-400 mb-8">Pendaftaran untuk turnamen ini telah ditutup atau belum dibuka.</p>
              <Button href={`/tournament/${tournament.id}`} variant="secondary" className="w-full">
                 Kembali ke Detail
              </Button>
           </div>
        </div>
     );
  }

  // Member Check
  if (availableMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0a0a0b] p-4">
        <div className="bg-[#15171e] backdrop-blur-md rounded-3xl border border-white/10 p-10 text-center max-w-md shadow-2xl">
           <UsersIcon className="w-16 h-16 text-gray-600 mb-6 mx-auto opacity-50" />
           <h3 className="text-xl font-clash text-white mb-3 uppercase tracking-wide">{t.clanEsports.errorMembersTitle}</h3>
           <p className="text-gray-400 mb-8 text-sm">{t.clanEsports.noVerifiedMembers}</p>
           <Button href="/clan/manage" variant="primary" className="w-full">Kelola Anggota</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white font-clash overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-coc-gold/5 blur-[120px] pointer-events-none z-0" />

      {notification && <Notification notification={notification} />}

      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 mt-6">
        
        {/* Header */}
        <header className="mb-8 text-center md:text-left">
           <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-coc-gold/10 border border-coc-gold/20 text-coc-gold text-xs font-bold uppercase tracking-widest">
              <TrophyIcon className="h-3 w-3" /> Registration Phase
           </div>
           <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 uppercase tracking-wide drop-shadow-md">
              Squad <span className="text-coc-blue">Builder</span>
           </h1>
           <p className="text-gray-400 font-sans text-sm md:text-base">
              Susun tim terbaikmu untuk menaklukkan <span className="text-white font-bold">{tournament.title}</span>
           </p>
        </header>

        <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-10 relative overflow-hidden">
           {/* Top Accent */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-coc-gold to-coc-blue opacity-50" />
           
           {/* Section 1: Team Identity */}
           <div className="space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] border-b border-white/10 pb-3 flex items-center gap-2">
                 <CrownIcon className="h-4 w-4 text-coc-gold" /> Team Identity
              </h3>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label htmlFor="teamName" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                       {t.clanEsports.labelTeamName}
                    </label>
                    <input
                       id="teamName"
                       type="text"
                       value={teamName}
                       onChange={(e) => setTeamName(e.target.value)}
                       placeholder={t.clanEsports.placeholderTeamName}
                       className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-coc-gold focus:border-coc-gold transition-all font-sans text-lg shadow-inner"
                       maxLength={30}
                    />
                 </div>
                 
                 {/* Representing Clan Card */}
                 <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-coc-blue/10 to-transparent border border-coc-blue/20 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-coc-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-12 h-12 flex-shrink-0 drop-shadow-md">
                       <Image 
                          src={managedClan.badgeUrl} 
                          alt={managedClan.name} 
                          fill 
                          className="object-contain"
                       />
                    </div>
                    <div>
                       <p className="text-[10px] text-coc-blue font-bold uppercase tracking-widest mb-0.5">Representing Clan</p>
                       <p className="text-xl font-bold text-white leading-none">{managedClan.name}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Section 2: Roster Management */}
           <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-3">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-coc-blue" /> Roster Selection
                 </h3>
                 <div className={`px-3 py-1 rounded-lg border text-xs font-bold font-mono ${selectedMembers.length === tournament.teamSize ? 'bg-coc-green/10 text-coc-green border-coc-green/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                    {selectedMembers.length} / {tournament.teamSize} Selected
                 </div>
              </div>

              {/* Selected Members Area (Slot Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                 {/* Render Selected Members */}
                 {selectedMembers.map((member) => (
                    <div 
                       key={member.tag} 
                       className="relative bg-[#0a0a0b] border border-coc-gold/30 rounded-xl p-3 flex flex-col items-center justify-center group animate-in zoom-in-90 duration-300"
                    >
                       <button 
                          onClick={() => handleMemberDeselect(member.tag)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-10 hover:scale-110"
                       >
                          <XIcon className="w-3 h-3" />
                       </button>
                       <div className="w-10 h-10 relative mb-2">
                          <Image 
                             src={getThImage(member.townHallLevel)} 
                             alt={`TH${member.townHallLevel}`} 
                             fill 
                             className="object-contain drop-shadow-md" 
                          />
                       </div>
                       <p className="text-xs font-bold text-white truncate w-full text-center">{member.name}</p>
                       <p className="text-[10px] text-gray-500 font-mono">TH {member.townHallLevel}</p>
                    </div>
                 ))}

                 {/* Render Empty Slots */}
                 {[...Array(Math.max(0, tournament.teamSize - selectedMembers.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white/5 border border-white/5 border-dashed rounded-xl p-3 flex flex-col items-center justify-center min-h-[100px] opacity-50">
                       <UserPlusIcon className="w-6 h-6 text-gray-600 mb-1" />
                       <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">Empty Slot</span>
                    </div>
                 ))}
              </div>

              {/* Available Members List */}
              <div className="bg-[#0a0a0b] rounded-2xl border border-white/5 overflow-hidden">
                 <div className="bg-[#15171e] px-4 py-2 border-b border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Members ({availableMembers.length})</p>
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
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
                                   ? 'bg-coc-gold/5 border-coc-gold/20 opacity-50 cursor-default'
                                   : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                             }`}
                          >
                             <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 flex-shrink-0">
                                   <Image src={getThImage(member.townHallLevel)} alt={`TH${member.townHallLevel}`} fill className="object-contain" />
                                </div>
                                <div className="min-w-0">
                                   <p className={`font-bold text-sm truncate ${isSelected ? 'text-coc-gold' : 'text-white'}`}>
                                      {member.name}
                                   </p>
                                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider truncate">
                                      {member.role} • TH {member.townHallLevel}
                                   </p>
                                </div>
                             </div>
                             
                             <div className="flex-shrink-0">
                                {isSelected ? (
                                   <div className="bg-coc-gold/20 p-1 rounded-full">
                                      <CheckIcon className="w-4 h-4 text-coc-gold" />
                                   </div>
                                ) : (
                                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-coc-green/20 transition-colors border border-white/5 group-hover:border-coc-green/30">
                                      <PlusIcon className="w-4 h-4 text-gray-500 group-hover:text-coc-green" />
                                   </div>
                                )}
                             </div>
                          </button>
                       );
                    })}
                 </div>
              </div>
           </div>

           {/* Submit Action */}
           <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-end gap-4">
              <Button
                 variant="outline"
                 size="lg"
                 className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:text-white" 
                 onClick={() => router.back()}
                 disabled={isLoading}
              >
                 {t.common.cancel}
              </Button>
              <Button 
                 variant="primary" 
                 size="lg" 
                 className="w-full sm:w-auto shadow-[0_0_20px_rgba(74,222,128,0.2)] hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] bg-gradient-to-b from-coc-green to-green-700 border-green-800 font-bold tracking-wide"
                 onClick={handleRegister}
                 disabled={isLoading || selectedMembers.length !== tournament.teamSize || !teamName.trim()}
              >
                 {isLoading ? (
                    <div className="flex items-center gap-2">
                       <Loader2Icon className="w-5 h-5 animate-spin" />
                       <span>PROCESSING...</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                       <TrophyIcon className="w-5 h-5" />
                       <span>CONFIRM SQUAD</span>
                    </div>
                 )}
              </Button>
           </div>

        </div>
      </div>
    </div>
  );
}