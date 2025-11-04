// File: app/clan/manage/components/CwlWarPlayerRow.tsx
// Komponen ini menampilkan rincian satu pemain di dalam tabel
// riwayat perang CWL yang bisa di-expand.

'use client';

import React from 'react';
import Image from 'next/image';
import { CocWarMember } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';
import { StarIcon } from '@/app/components/icons';

interface CwlWarPlayerRowProps {
  member: CocWarMember;
  isCwl: boolean;
}

const CwlWarPlayerRow: React.FC<CwlWarPlayerRowProps> = ({ member, isCwl }) => {
  const bestAttackReceived = member.bestOpponentAttack;
  const attacksDone = member.attacks?.length || 0;
  const maxAttacks = isCwl ? 1 : 2; // CWL selalu 1
  let defenseStars = 0;
  let defenseDestruction = 0;

  if (bestAttackReceived) {
    defenseStars = bestAttackReceived.stars;
    defenseDestruction = bestAttackReceived.destructionPercentage;
  }

  const starColorClass =
    defenseStars === 3
      ? 'text-coc-red'
      : defenseStars > 0
      ? 'text-coc-gold'
      : 'text-gray-500';

  // Tampilkan bintang serangan
  const attacksDisplay =
    member.attacks?.map((att, index) => (
      <span
        key={index}
        className={`font-bold ${
          att.stars === 3 ? 'text-coc-gold' : 'text-white'
        }`}
      >
        {att.stars}★
      </span>
    )) || <span className="text-gray-500">-</span>;

  return (
    <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
      {/* Posisi Peta */}
      <td className="px-2 py-2 text-center text-xs font-clash text-white">
        {member.mapPosition}
      </td>
      {/* Pemain */}
      <td className="px-2 py-2 whitespace-nowrap text-xs">
        <div className="flex items-center space-x-2">
          <Image
            src={getThImage(member.townhallLevel)}
            alt={`TH ${member.townhallLevel}`}
            width={24}
            height={24}
            className="rounded-full"
          />
          <div>
            <p className="font-clash text-sm truncate max-w-[120px] text-white">
              {member.name}
            </p>
          </div>
        </div>
      </td>
      {/* Serangan Dilakukan */}
      <td className="px-2 py-2 text-center text-xs text-gray-300">
        <div className="flex items-center justify-center gap-1.5">
          {attacksDisplay}
        </div>
      </td>
      {/* Pertahanan */}
      <td className="px-2 py-2 text-center text-xs">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${starColorClass} border-current`}
        >
          <StarIcon className="w-2.5 h-2.5" />
          <span>
            {defenseStars}★ ({defenseDestruction.toFixed(0)}%)
          </span>
        </div>
      </td>
    </tr>
  );
};

export default CwlWarPlayerRow;
