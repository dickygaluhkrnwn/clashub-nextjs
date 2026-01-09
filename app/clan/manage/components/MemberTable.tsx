'use client';

import React from 'react';
import { UserProfile } from '@/lib/clashub.types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { MemberTableRow, RosterMember } from './MemberTableRow';
import Image from 'next/image';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';
import { TrashIcon } from '@/app/components/icons';

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
      <div key={member.tag} className="group relative p-5 mb-4 rounded-xl border border-white/5 bg-[#15171e]/60 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-coc-gold/30 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:-translate-y-1">
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-coc-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={thImageUrl}
                alt={`TH ${member.townHallLevel}`}
                width={48}
                height={48}
                className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute -bottom-1 -right-1 bg-black/90 text-[10px] font-bold text-coc-gold px-1.5 py-0.5 rounded border border-coc-gold/30 shadow-sm backdrop-blur-sm">
                {member.townHallLevel}
              </div>
            </div>
            <div>
              <p className="font-clash text-white text-base tracking-wide group-hover:text-coc-gold transition-colors">{member.name}</p>
              <p className="text-gray-400 text-xs font-mono tracking-wider">{member.tag}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                member.participationStatus === 'Promosi' ? 'text-coc-green border-coc-green/30 bg-coc-green/10 shadow-[0_0_10px_rgba(74,222,128,0.1)]' :
                member.participationStatus === 'Demosi' ? 'text-coc-red border-coc-red/30 bg-coc-red/10 shadow-[0_0_10px_rgba(248,113,113,0.1)]' :
                member.participationStatus === 'Leader/Co-Leader' ? 'text-coc-gold border-coc-gold/30 bg-coc-gold/10' :
                'text-gray-500 border-white/5 bg-white/5'
              }`}>
                {member.participationStatus === 'Leader/Co-Leader' ? 'Staff' : member.participationStatus}
              </span>
              <span className={`text-[10px] font-mono ${member.isVerified ? 'text-coc-blue' : 'text-gray-600'}`}>
                  {member.clashubRole}
              </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
           <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-lg p-2 text-center group-hover:border-white/10 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Donations</p>
              <p className="text-sm text-white font-mono">{formatNumber(member.donations)}</p>
           </div>
           <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-lg p-2 text-center group-hover:border-white/10 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">War (S/F)</p>
              <p className="text-sm font-mono">
                 <span className="text-coc-green">{member.warSuccessCount}</span>
                 <span className="text-gray-600 mx-1">/</span>
                 <span className="text-coc-red">{member.warFailCount}</span>
              </p>
           </div>
           <div className="bg-[#0a0a0b]/60 border border-white/5 rounded-lg p-2 text-center group-hover:border-white/10 transition-colors">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">CWL</p>
              <p className="text-sm font-mono">
                 <span className="text-blue-400">{member.cwlSuccessCount}</span>
                 <span className="text-gray-600 mx-1">/</span>
                 <span className="text-red-400">{member.cwlFailCount}</span>
              </p>
           </div>
        </div>

        {/* Mobile Actions */}
        {isManager && member.uid && member.clashubRole !== 'Leader' && member.uid !== userProfile.uid && (
           <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 relative z-10">
              <Button 
                size="sm" 
                variant="danger" 
                className="w-full h-9 text-xs shadow-lg shadow-coc-red/10"
                onClick={() => onKick(member.uid!)}
              >
                 <TrashIcon className="w-3 h-3 mr-2" /> Kick Member
              </Button>
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* --- Desktop View (Table) --- */}
      <div className="hidden md:block overflow-x-auto rounded-xl">
        <table className="min-w-full divide-y divide-white/5 text-xs text-left">
          <thead className="bg-[#0a0a0b]/95 backdrop-blur-xl sticky top-0 z-20 shadow-md">
            <tr>
              <th className="px-6 py-4 font-clash text-coc-gold uppercase tracking-widest text-xs w-[300px]">
                {t.clanMembers.colPlayer}
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs">
                {t.clanMembers.colDonations}
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs">
                {t.clanPublicProfile.table.trophies}
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs">
                War Stats
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs">
                CWL Stats
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs">
                Status
              </th>
              <th className="px-4 py-4 text-center font-clash text-coc-gold uppercase tracking-widest text-xs w-[180px]">
                {isManager ? t.clanMembers.colActions : t.clanHub.role}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#15171e]/20">
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
      <div className="md:hidden flex flex-col space-y-2">
         {combinedRoster.length > 0 ? (
           combinedRoster.map(renderMobileCard)
         ) : (
           <div className="p-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-gray-500 font-clash tracking-wide">No members found</p>
           </div>
         )}
      </div>
    </>
  );
};