'use client';

import React from 'react';
import { UserProfile } from '@/lib/clashub.types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { MemberTableRow, RosterMember } from './MemberTableRow';
import Image from 'next/image';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { ChevronDownIcon, TrashIcon } from '@/app/components/icons';

interface MemberTableProps {
  combinedRoster: RosterMember[];
  userProfile: UserProfile;
  isManager: boolean;
  isLeader: boolean;
  onRoleChange: (memberUid: string, newClashubRole: UserProfile['role']) => void;
  onKick: (memberUid: string) => void;
  availableClashubRoles: UserProfile['role'][];
}

export const MemberTable: React.FC<MemberTableProps> = ({
  combinedRoster,
  userProfile,
  isManager,
  isLeader,
  onRoleChange,
  onKick,
  availableClashubRoles,
}) => {
  const { t } = useLanguage();

  // --- Mobile Card View Render Helper ---
  const renderMobileCard = (member: RosterMember) => {
    const thImageUrl = getThImage(member.townHallLevel);
    
    return (
      <div key={member.tag} className="p-4 border-b border-white/5 last:border-0 bg-white/5 hover:bg-white/10 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={thImageUrl}
                alt={`TH ${member.townHallLevel}`}
                width={40}
                height={40}
                className="drop-shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-black/80 text-[10px] text-white px-1 rounded border border-white/10">
                {member.townHallLevel}
              </div>
            </div>
            <div>
              <p className="font-clash text-white text-sm">{member.name}</p>
              <p className="text-coc-gold/80 text-xs font-mono">{member.role}</p>
            </div>
          </div>
          <div className="text-right">
             <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                member.participationStatus === 'Promosi' ? 'text-coc-green border-coc-green/30 bg-coc-green/10' :
                member.participationStatus === 'Demosi' ? 'text-coc-red border-coc-red/30 bg-coc-red/10' :
                'text-gray-400 border-white/10 bg-black/20'
             }`}>
               {member.participationStatus}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
           <div className="bg-black/20 rounded p-1.5">
              <p className="text-[10px] text-gray-500">Donations</p>
              <p className="text-xs text-white font-mono">{formatNumber(member.donations)}</p>
           </div>
           <div className="bg-black/20 rounded p-1.5">
              <p className="text-[10px] text-gray-500">War (S/F)</p>
              <p className="text-xs text-white font-mono">
                 <span className="text-green-400">{member.warSuccessCount}</span>/<span className="text-red-400">{member.warFailCount}</span>
              </p>
           </div>
           <div className="bg-black/20 rounded p-1.5">
              <p className="text-[10px] text-gray-500">Role</p>
              <p className={`text-xs font-mono ${member.isVerified ? 'text-coc-gold' : 'text-gray-400'}`}>
                 {member.clashubRole}
              </p>
           </div>
        </div>

        {/* Mobile Actions */}
        {isManager && member.uid && member.clashubRole !== 'Leader' && member.uid !== userProfile.uid && (
           <div className="mt-3 flex gap-2">
              {/* Simplified Action for Mobile: Just a Kick button for now, expandable later */}
              <Button 
                size="sm" 
                variant="danger" 
                className="w-full h-8 text-xs"
                onClick={() => onKick(member.uid!)}
              >
                 <TrashIcon className="w-3 h-3 mr-1" /> Kick
              </Button>
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* --- Desktop View (Table) --- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5 text-xs">
          <thead className="bg-black/40 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-clash text-coc-gold uppercase tracking-wider w-[250px]">
                {t.clanMembers.colPlayer}
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider">
                {t.clanMembers.colDonations}
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider">
                {t.clanPublicProfile.table.trophies}
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider">
                CW Stats
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider">
                CWL Stats
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center font-clash text-coc-gold uppercase tracking-wider w-[180px]">
                {isManager ? t.clanMembers.colActions : t.clanHub.role}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {combinedRoster.map((member) => (
              <MemberTableRow
                key={member.tag}
                member={member}
                userProfile={userProfile}
                isManager={isManager}
                isLeader={isLeader}
                onRoleChange={onRoleChange}
                onKick={onKick}
                availableClashubRoles={availableClashubRoles}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile View (Card List) --- */}
      <div className="md:hidden flex flex-col">
         {combinedRoster.length > 0 ? (
            combinedRoster.map(renderMobileCard)
         ) : (
            <div className="p-8 text-center text-gray-500">No members found</div>
         )}
      </div>
    </>
  );
};