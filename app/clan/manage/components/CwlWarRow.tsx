'use client';

import React, { useState, Fragment } from 'react';
import Image from 'next/image';
import { CocWarLog, CocWarClanInfo } from '@/lib/clashub.types';
import { StarIcon, ShieldIcon, SwordsIcon } from '@/app/components/icons';
import CwlWarPlayerRow from './CwlWarPlayerRow';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CwlWarRowProps {
  round: CocWarLog;
  ourClanTag: string;
  roundNumber: number;
}

const CwlWarRow: React.FC<CwlWarRowProps> = ({
  round,
  ourClanTag,
  roundNumber,
}) => {
  const { t } = useLanguage();
  const [isRowOpen, setIsRowOpen] = useState(false);

  let ourClanInfo: CocWarClanInfo | undefined;
  let opponentClanInfo: CocWarClanInfo | undefined;

  if (!round.clan || !round.opponent) {
    return (
      <tr className="bg-white/5">
        <td className="px-4 py-3 text-center text-gray-500 font-mono">
          {roundNumber}
        </td>
        <td colSpan={4} className="px-4 py-3 text-left text-gray-500 italic">
          {t.common.error} (Missing data)
        </td>
      </tr>
    );
  }

  if (round.clan.tag === ourClanTag) {
    ourClanInfo = round.clan;
    opponentClanInfo = round.opponent;
  } else {
    ourClanInfo = round.opponent;
    opponentClanInfo = round.clan;
  }

  let resultText = t.clanWar.resultDraw;
  let resultColor = 'text-gray-400';
  let resultBadge = 'bg-gray-500/10 border-gray-500/20';

  // Determine result logic (same as user provided)
  if (round.result) {
    if (round.result === 'win') {
      resultText = t.clanWar.resultWin;
      resultColor = 'text-coc-green';
      resultBadge = 'bg-coc-green/10 border-coc-green/20';
    } else if (round.result === 'lose') {
      resultText = t.clanWar.resultLose;
      resultColor = 'text-coc-red';
      resultBadge = 'bg-coc-red/10 border-coc-red/20';
    } else {
        resultText = t.clanWar.resultDraw;
        resultColor = 'text-coc-gold';
        resultBadge = 'bg-coc-gold/10 border-coc-gold/20';
    }
  } else if (ourClanInfo.stars > opponentClanInfo.stars) {
    resultText = t.clanWar.resultWin;
    resultColor = 'text-coc-green';
    resultBadge = 'bg-coc-green/10 border-coc-green/20';
  } else if (ourClanInfo.stars < opponentClanInfo.stars) {
    resultText = t.clanWar.resultLose;
    resultColor = 'text-coc-red';
    resultBadge = 'bg-coc-red/10 border-coc-red/20';
  } else {
    resultText = t.clanWar.resultDraw;
    resultColor = 'text-coc-gold';
    resultBadge = 'bg-coc-gold/10 border-coc-gold/20';
  }

  const ourMembers = [...(ourClanInfo.members || [])].sort(
    (a, b) => a.mapPosition - b.mapPosition
  );
  // Unused for now but kept for completeness or future feature
  // const opponentMembers = [...(opponentClanInfo.members || [])].sort(
  //   (a, b) => a.mapPosition - b.mapPosition
  // );

  return (
    <Fragment>
      {/* Baris Ringkasan */}
      <tr
        className={`transition-all cursor-pointer group ${isRowOpen ? 'bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]/50'}`}
        onClick={() => setIsRowOpen(!isRowOpen)}
      >
        <td className="px-4 py-4 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border ${isRowOpen ? 'bg-coc-blue text-black border-coc-blue' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {roundNumber}
            </div>
        </td>
        
        <td className="px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                src={opponentClanInfo.badgeUrls?.small || '/images/clan-badge-placeholder.png'}
                alt={opponentClanInfo.name}
                width={40}
                height={40}
                className="drop-shadow-md object-contain"
                />
            </div>
            <div>
                <p className="font-clash text-white tracking-wide text-sm group-hover:text-coc-gold transition-colors">{opponentClanInfo.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-mono bg-black/30 px-1.5 rounded">Lvl {opponentClanInfo.clanLevel}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{opponentClanInfo.tag}</span>
                </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-center">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${resultBadge} ${resultColor}`}>
                {resultText}
            </span>
        </td>

        <td className="px-4 py-4 text-center hidden md:table-cell">
          <div className="flex items-center justify-center gap-3 font-mono text-sm bg-black/20 py-1.5 px-3 rounded-lg border border-white/5">
            <span className={resultColor === 'text-coc-green' ? 'text-coc-green font-bold' : 'text-gray-300'}>
              {ourClanInfo.stars}
            </span>
            <span className="text-gray-600 text-xs">-</span>
            <span className={resultColor === 'text-coc-red' ? 'text-coc-red font-bold' : 'text-gray-300'}>
              {opponentClanInfo.stars}
            </span>
          </div>
        </td>

        <td className="px-4 py-4 text-center hidden md:table-cell">
            <div className="flex flex-col items-center gap-1">
                <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-coc-blue shadow-[0_0_5px_#2B60DE]" style={{ width: `${ourClanInfo.destructionPercentage}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{ourClanInfo.destructionPercentage.toFixed(1)}%</span>
            </div>
        </td>
      </tr>

      {/* Baris Rincian */}
      {isRowOpen && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-white/5 bg-[#0a0a0b] inset-shadow-y">
            <div className="p-4 md:p-6 animate-in slide-in-from-top-2 duration-300">
              
              <div className="bg-[#15171e]/60 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                {/* Header Inner Table */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldIcon className="h-5 w-5 text-coc-blue" />
                        <h4 className="text-sm font-clash text-white tracking-wide">
                        {ourClanInfo.name} <span className="text-gray-500 font-sans text-xs ml-1 font-normal opacity-70">(Performance)</span>
                        </h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                         <span><SwordsIcon className="w-3 h-3 inline mr-1" /> {ourClanInfo.attacks || 0} Atks</span>
                         <span><StarIcon className="w-3 h-3 inline mr-1 text-coc-gold" /> {ourClanInfo.stars} Stars</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-black/40 text-gray-500 font-mono uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">#</th>
                        <th className="px-4 py-3 text-left">{t.clanMembers.colPlayer}</th>
                        <th className="px-4 py-3 text-center">{t.clanWar.colAttacks} / Def</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ourMembers.map((member) => (
                        <CwlWarPlayerRow
                          key={member.tag}
                          member={member}
                          isCwl={true}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};

export default CwlWarRow;