'use client';

import React from 'react';
import Image from 'next/image';
import { CocWarMember } from '@/lib/clashub.types';
import { getThImage } from '@/lib/th-utils';
import { StarIcon } from '@/app/components/icons';

interface CwlWarPlayerRowProps {
  member: CocWarMember;
  isCwl: boolean;
}

const CwlWarPlayerRow: React.FC<CwlWarPlayerRowProps> = ({ member, isCwl }) => {
  const bestAttackReceived = member.bestOpponentAttack;
  let defenseStars = 0;
  // let defenseDestruction = 0; // Unused for now

  if (bestAttackReceived) {
    defenseStars = bestAttackReceived.stars;
    // defenseDestruction = bestAttackReceived.destructionPercentage;
  }

  const starColorClass =
    defenseStars === 3
      ? 'text-coc-red border-coc-red/30 bg-coc-red/10'
      : defenseStars > 0
      ? 'text-coc-gold border-coc-gold/30 bg-coc-gold/10'
      : 'text-gray-500 border-white/10 bg-white/5';

  // Tampilkan bintang serangan
  const attacksDisplay =
    member.attacks?.map((att, index) => (
        <div key={index} className="flex flex-col items-center">
            <span className={`font-bold text-sm ${att.stars === 3 ? 'text-coc-green' : att.stars === 2 ? 'text-coc-gold' : 'text-gray-400'}`}>
                {att.stars}★
            </span>
            <span className="text-[9px] text-gray-500">{att.destructionPercentage}%</span>
        </div>
    )) || <span className="text-gray-600 text-[10px] italic">No Atk</span>;

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      {/* Posisi Peta */}
      <td className="px-3 py-3 text-center text-xs font-mono text-gray-500 group-hover:text-gray-300">
        #{member.mapPosition}
      </td>
      
      {/* Pemain */}
      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="relative w-7 h-7 flex-shrink-0">
            <Image
              src={getThImage(member.townhallLevel)}
              alt={`TH ${member.townhallLevel}`}
              width={28}
              height={28}
              className="drop-shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 bg-black/90 text-[8px] text-white px-1 rounded border border-white/20">
                {member.townhallLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-xs md:text-sm text-gray-200 group-hover:text-white truncate max-w-[100px] md:max-w-[140px]">
              {member.name}
            </span>
            <span className="text-[9px] text-gray-500 font-mono">{member.tag}</span>
          </div>
        </div>
      </td>

      {/* Serangan / Pertahanan Info */}
      <td className="px-3 py-3 text-center">
         <div className="flex items-center justify-center gap-3">
            {/* Attack Info */}
            <div>{attacksDisplay}</div>
            
            {/* Defense Info (Tiny pill) */}
            <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-0.5 ${starColorClass}`}>
                <StarIcon className="w-2 h-2" />
                <span>{defenseStars}</span>
            </div>
         </div>
      </td>
    </tr>
  );
};

export default CwlWarPlayerRow;