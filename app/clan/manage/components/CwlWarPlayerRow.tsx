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
      ? 'text-coc-red bg-coc-red/10 border-coc-red/30 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
      : defenseStars > 0
      ? 'text-coc-gold bg-coc-gold/10 border-coc-gold/30'
      : 'text-gray-500 bg-white/5 border-white/10';

  // Tampilkan bintang serangan
  const attacksDisplay =
    member.attacks?.map((att, index) => (
        <div key={index} className="flex flex-col items-center justify-center bg-black/40 rounded px-2 py-1 border border-white/5">
            <div className="flex items-center gap-0.5">
                <span className={`font-bold text-sm ${att.stars === 3 ? 'text-coc-green' : att.stars === 2 ? 'text-coc-gold' : 'text-gray-400'}`}>
                    {att.stars}
                </span>
                <StarIcon className={`w-3 h-3 ${att.stars === 3 ? 'fill-coc-green text-coc-green' : att.stars === 2 ? 'fill-coc-gold text-coc-gold' : 'fill-gray-400 text-gray-400'}`} />
            </div>
            <span className="text-[9px] text-gray-500 font-mono">{att.destructionPercentage}%</span>
        </div>
    )) || <span className="text-gray-600 text-[10px] italic">No Atk</span>;

  const thImageUrl = getThImage(member.townhallLevel);

  return (
    <tr className="hover:bg-[#1f222b] transition-colors group border-b border-white/5 last:border-0">
      {/* Posisi Peta */}
      <td className="px-4 py-3 text-center text-xs font-mono text-gray-500 group-hover:text-coc-gold transition-colors">
        #{member.mapPosition}
      </td>
      
      {/* Pemain */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-110">
            <Image
              src={thImageUrl}
              alt={`TH ${member.townhallLevel}`}
              width={32}
              height={32}
              className="drop-shadow-md object-contain"
            />
            <div className="absolute -bottom-1 -right-1 bg-black/90 text-[8px] font-bold text-white px-1 py-px rounded border border-white/20">
                {member.townhallLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-xs md:text-sm text-gray-200 group-hover:text-white truncate max-w-[120px] font-clash tracking-wide">
              {member.name}
            </span>
            <span className="text-[9px] text-gray-500 font-mono">{member.tag}</span>
          </div>
        </div>
      </td>

      {/* Serangan / Pertahanan Info */}
      <td className="px-4 py-3 text-center">
         <div className="flex items-center justify-center gap-4">
            {/* Attack Info */}
            <div className="flex gap-1">{attacksDisplay}</div>
            
            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Defense Info (Tiny pill) */}
            <div className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${starColorClass}`}>
                <StarIcon className="w-2.5 h-2.5" />
                <span>{defenseStars}</span>
            </div>
         </div>
      </td>
    </tr>
  );
};

export default CwlWarPlayerRow;