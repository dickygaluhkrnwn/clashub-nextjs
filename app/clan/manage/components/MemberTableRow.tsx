'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ClanApiCache, UserProfile } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@/app/components/icons';
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
      return 'text-coc-green bg-coc-green/10 border-coc-green/30';
    case 'Demosi':
      return 'text-coc-red bg-coc-red/10 border-coc-red/30';
    case 'Leader/Co-Leader':
      return 'text-coc-gold bg-coc-gold/10 border-coc-gold/30';
    default:
      return 'text-gray-400 bg-white/5 border-white/10';
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
    <tr className="hover:bg-white/5 transition-colors group">
      
      {/* Player Info */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0 transition-transform group-hover:scale-110">
            <Image
              src={thImageUrl}
              alt={`TH ${member.townHallLevel}`}
              width={36}
              height={36}
              className="drop-shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 bg-black/90 text-[9px] text-white px-1 rounded border border-white/20">
               {member.townHallLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-white text-sm tracking-wide">{member.name}</span>
            <span className="text-[10px] text-gray-500 font-mono">{member.tag}</span>
            <span className="text-[10px] text-coc-gold/70 uppercase font-bold">{member.role}</span>
          </div>
        </div>
      </td>

      {/* Donations */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="flex flex-col items-center">
           <span className="text-white font-mono text-xs">{formatNumber(member.donations)}</span>
           <span className="text-[10px] text-gray-500">Rec: {formatNumber(member.donationsReceived)}</span>
        </div>
      </td>

      {/* Trophies */}
      <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-coc-gold font-medium">
        {formatNumber(member.trophies || 0)} 🏆
      </td>

      {/* CW Stats */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1 bg-black/30 px-2 py-1 rounded border border-white/5">
           <span className="text-coc-green font-bold text-xs">{member.warSuccessCount}</span>
           <span className="text-gray-600 text-[10px]">/</span>
           <span className="text-coc-red font-bold text-xs">{member.warFailCount}</span>
        </div>
      </td>

      {/* CWL Stats */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1 bg-black/30 px-2 py-1 rounded border border-white/5">
           <span className="text-blue-400 font-bold text-xs">{member.cwlSuccessCount}</span>
           <span className="text-gray-600 text-[10px]">/</span>
           <span className="text-red-400 font-bold text-xs">{member.cwlFailCount}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getParticipationStatusClass(member.participationStatus)}`}>
          {member.participationStatus}
        </div>
        {member.statusKeterangan && (
           <p className="text-[9px] text-gray-500 mt-1 max-w-[100px] truncate mx-auto" title={member.statusKeterangan}>
              {member.statusKeterangan}
           </p>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <div className="flex flex-col items-center gap-1">
           <span className={`text-[9px] uppercase font-bold tracking-wider mb-1 ${member.isVerified ? 'text-coc-green' : 'text-gray-600'}`}>
              {member.isVerified ? 'Verified' : 'Unverified'}
           </span>

           {isManager && member.uid ? (
              <div className="flex items-center gap-2 relative">
                 {/* Role Dropdown */}
                 <div className="relative">
                    <Button
                       size="sm"
                       variant="secondary"
                       className="h-7 text-xs px-2 min-w-[90px] justify-between bg-white/5 border border-white/10 hover:bg-white/10"
                       disabled={isActionDisabled}
                       onClick={() => setOpenRoleDropdown(openRoleDropdown === member.uid ? null : member.uid!)}
                    >
                       <span className="truncate max-w-[60px]">{member.clashubRole}</span>
                       <ChevronDownIcon className="w-3 h-3 ml-1 opacity-50" />
                    </Button>

                    {openRoleDropdown === member.uid && (
                       <div className="absolute right-0 top-8 z-50 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {availableClashubRoles.map(role => (
                             <button
                                key={role}
                                onClick={() => {
                                   onRoleChange(member.uid!, role);
                                   setOpenRoleDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${member.clashubRole === role ? 'text-coc-gold font-bold bg-white/5' : 'text-gray-300'}`}
                             >
                                {role}
                             </button>
                          ))}
                       </div>
                    )}
                 </div>

                 <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-500 hover:text-coc-red hover:bg-coc-red/10"
                    disabled={isActionDisabled}
                    onClick={() => onKick(member.uid!)}
                 >
                    <TrashIcon className="w-4 h-4" />
                 </Button>
              </div>
           ) : (
              <span className="text-gray-500 text-xs italic opacity-50">
                 {member.uid ? member.clashubRole : 'No Account'}
              </span>
           )}
        </div>
      </td>
    </tr>
  );
};