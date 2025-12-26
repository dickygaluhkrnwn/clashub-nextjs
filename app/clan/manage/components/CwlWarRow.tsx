'use client';

import React, { useState, Fragment } from 'react';
import Image from 'next/image';
import { CocWarLog, CocWarClanInfo } from '@/lib/clashub.types';
import { StarIcon, ChevronDownIcon, ChevronUpIcon, ShieldIcon } from '@/app/components/icons';
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
  const opponentMembers = [...(opponentClanInfo.members || [])].sort(
    (a, b) => a.mapPosition - b.mapPosition
  );

  return (
    <Fragment>
      {/* Baris Ringkasan */}
      <tr
        className={`transition-colors cursor-pointer group ${isRowOpen ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
        onClick={() => setIsRowOpen(!isRowOpen)}
      >
        <td className="px-4 py-4 text-center">
            <span className="font-mono text-gray-500 group-hover:text-white transition-colors">#{roundNumber}</span>
        </td>
        
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                src={opponentClanInfo.badgeUrls?.small || '/images/clan-badge-placeholder.png'}
                alt={opponentClanInfo.name}
                width={32}
                height={32}
                className="drop-shadow-md"
                />
            </div>
            <div>
                <p className="font-clash text-white tracking-wide">{opponentClanInfo.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">Lvl {opponentClanInfo.clanLevel}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-4 text-center">
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${resultBadge} ${resultColor}`}>
                {resultText}
            </span>
        </td>

        <td className="px-4 py-4 text-center hidden md:table-cell">
          <div className="flex items-center justify-center gap-2 font-mono text-sm">
            <span className={resultColor === 'text-coc-green' ? 'text-coc-green font-bold' : 'text-gray-300'}>
              {ourClanInfo.stars}
            </span>
            <span className="text-gray-600 text-xs">vs</span>
            <span className={resultColor === 'text-coc-red' ? 'text-coc-red font-bold' : 'text-gray-300'}>
              {opponentClanInfo.stars}
            </span>
          </div>
        </td>

        <td className="px-4 py-4 text-center hidden md:table-cell">
            <div className="flex flex-col items-center gap-1">
                <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-coc-blue" style={{ width: `${ourClanInfo.destructionPercentage}%` }} />
                </div>
                <span className="text-[10px] text-gray-500">{ourClanInfo.destructionPercentage.toFixed(1)}%</span>
            </div>
        </td>
      </tr>

      {/* Baris Rincian */}
      {isRowOpen && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-white/5 bg-black/20 inset-shadow-y">
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
              {/* Tabel Klan Kita */}
              <div className="bg-[#151515] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-coc-blue" />
                    <h4 className="text-sm font-clash text-white tracking-wide">
                    {ourClanInfo.name} <span className="text-gray-500 font-sans text-xs ml-1">(Us)</span>
                    </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-black/40 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-center w-8">#</th>
                        <th className="px-3 py-2 text-left">{t.clanMembers.colPlayer}</th>
                        <th className="px-3 py-2 text-center">{t.clanWar.colAttacks} / Def</th>
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

              {/* Tabel Klan Lawan */}
              <div className="bg-[#151515] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <ShieldIcon className="h-4 w-4 text-coc-red" />
                    <h4 className="text-sm font-clash text-white tracking-wide">
                    {opponentClanInfo.name} <span className="text-gray-500 font-sans text-xs ml-1">(Enemy)</span>
                    </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-black/40 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-center w-8">#</th>
                        <th className="px-3 py-2 text-left">{t.clanMembers.colPlayer}</th>
                        <th className="px-3 py-2 text-center">{t.clanWar.colAttacks} / Def</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {opponentMembers.map((member) => (
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