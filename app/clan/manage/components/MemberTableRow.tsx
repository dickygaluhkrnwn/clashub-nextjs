'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ClanApiCache, UserProfile } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { TrashIcon, ChevronDownIcon } from '@/app/components/icons';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

export type RosterMember = ClanApiCache['members'][number] & {
  uid?: string;
  clashubRole: UserProfile['role'];
  isVerified: boolean;
};

interface MemberTableRowProps {
  member: RosterMember;
  userProfile: UserProfile;
  isManager: boolean;
  isLeader: boolean;
  onRoleChange: (memberUid: string, newClashubRole: UserProfile['role']) => void;
  onKick: (memberUid: string) => void;
  availableClashubRoles: UserProfile['role'][];
}

const getParticipationStatusClass = (status: ClanApiCache['members'][number]['participationStatus']) => {
  switch (status) {
    case 'Promosi':
      return 'text-coc-green bg-coc-green/5 border-coc-green/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]';
    case 'Demosi':
      return 'text-coc-red bg-coc-red/5 border-coc-red/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]';
    case 'Leader/Co-Leader':
      return 'text-coc-gold bg-coc-gold/5 border-coc-gold/20';
    default:
      return 'text-gray-500 bg-white/5 border-white/10';
  }
};

export const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  userProfile,
  isManager,
  isLeader,
  onRoleChange,
  onKick,
  availableClashubRoles,
}) => {
  const { t } = useLanguage();
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  const canModify = member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
  const isCoLeaderModifyingCoLeader = userProfile.role === 'Co-Leader' && member.clashubRole === 'Co-Leader';
  const isActionDisabled = !isManager || !canModify || isCoLeaderModifyingCoLeader || !member.uid;

  const thImageUrl = getThImage(member.townHallLevel);

  return (
    <tr className="group hover:bg-[#1f222b] transition-colors duration-200">
      
      {/* Player Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Image
              src={thImageUrl}
              alt={`TH ${member.townHallLevel}`}
              width={40}
              height={40}
              className="drop-shadow-md object-contain"
            />
            <div className="absolute -bottom-1 -right-1 bg-black/90 text-[9px] font-bold text-coc-gold px-1.5 py-0.5 rounded border border-coc-gold/20 shadow-sm backdrop-blur-sm">
               {member.townHallLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-clash text-white text-sm tracking-wide group-hover:text-coc-gold transition-colors">{member.name}</span>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider">{member.tag}</span>
            <span className="text-[9px] text-coc-blue/80 uppercase font-bold tracking-widest mt-0.5">{member.role}</span>
          </div>
        </div>
      </td>

      {/* Donations */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="flex flex-col items-center">
           <span className="text-white font-mono text-sm group-hover:text-coc-green transition-colors">{formatNumber(member.donations)}</span>
           <span className="text-[10px] text-gray-500">Rec: {formatNumber(member.donationsReceived)}</span>
        </div>
      </td>

      {/* Trophies */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="inline-flex items-center justify-center gap-1.5 bg-[#0a0a0b]/40 px-3 py-1 rounded-full border border-white/5 group-hover:border-coc-gold/20 transition-colors">
           <span className="text-coc-gold text-sm font-medium font-mono">{formatNumber(member.trophies || 0)}</span>
           <span className="text-xs">🏆</span>
        </div>
      </td>

      {/* CW Stats */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1 bg-[#0a0a0b]/40 px-3 py-1.5 rounded-lg border border-white/5">
           <span className="text-coc-green font-bold text-xs font-mono">{member.warSuccessCount}</span>
           <span className="text-gray-600 text-[10px]">/</span>
           <span className="text-coc-red font-bold text-xs font-mono">{member.warFailCount}</span>
        </div>
      </td>

      {/* CWL Stats */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1 bg-[#0a0a0b]/40 px-3 py-1.5 rounded-lg border border-white/5">
           <span className="text-blue-400 font-bold text-xs font-mono">{member.cwlSuccessCount}</span>
           <span className="text-gray-600 text-[10px]">/</span>
           <span className="text-red-400 font-bold text-xs font-mono">{member.cwlFailCount}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="flex flex-col items-center gap-1">
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${getParticipationStatusClass(member.participationStatus)}`}>
              {member.participationStatus === 'Leader/Co-Leader' ? 'Staff' : member.participationStatus}
            </div>
            {member.statusKeterangan && member.statusKeterangan !== 'N/A' && (
               <span className="text-[9px] text-gray-500 max-w-[100px] truncate" title={member.statusKeterangan}>
                  {member.statusKeterangan}
               </span>
            )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="flex flex-col items-center gap-2">
           <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${member.isVerified ? 'text-black bg-coc-blue shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'text-gray-500 bg-white/5 border border-white/5'}`}>
              {member.isVerified ? 'Linked' : 'Unlinked'}
           </span>

           {isManager && member.uid ? (
              <div className="flex items-center gap-2 relative mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                 {/* Role Dropdown */}
                 <div className="relative">
                    <Button
                       size="sm"
                       variant="ghost"
                       className="h-8 text-xs px-3 min-w-[100px] justify-between bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-gray-300"
                       disabled={isActionDisabled}
                       onClick={() => setOpenRoleDropdown(openRoleDropdown === member.uid ? null : member.uid!)}
                    >
                       <span className="truncate max-w-[70px]">{member.clashubRole}</span>
                       <ChevronDownIcon className="w-3 h-3 ml-1 opacity-50" />
                    </Button>

                    {openRoleDropdown === member.uid && (
                       <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5">
                          <div className="py-1">
                              {availableClashubRoles.map(role => (
                                 <button
                                    key={role}
                                    onClick={() => {
                                       onRoleChange(member.uid!, role);
                                       setOpenRoleDropdown(null);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center justify-between ${member.clashubRole === role ? 'text-coc-gold font-bold bg-coc-gold/5' : 'text-gray-300'}`}
                                 >
                                    {role}
                                    {member.clashubRole === role && <div className="w-1.5 h-1.5 rounded-full bg-coc-gold shadow-[0_0_5px_#FFD700]" />}
                                 </button>
                              ))}
                          </div>
                       </div>
                    )}
                 </div>

                 <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-coc-red hover:bg-coc-red/10 border border-transparent hover:border-coc-red/20 transition-all rounded-lg"
                    disabled={isActionDisabled}
                    onClick={() => onKick(member.uid!)}
                    title="Kick Member"
                 >
                    <TrashIcon className="w-4 h-4" />
                 </Button>
              </div>
           ) : (
              <span className="text-gray-600 text-[10px] italic mt-1 font-mono">
                 {member.uid ? '' : 'No Account'}
              </span>
           )}
        </div>
      </td>
    </tr>
  );
};