// File: app/clan/manage/components/CwlWarRow.tsx
// Komponen ini menampilkan SATU BARIS ronde perang di tabel Riwayat CWL.
// Komponen ini bisa di-expand untuk menampilkan rincian pemain.

'use client';

import React, { useState, Fragment } from 'react';
import Image from 'next/image';
import { CocWarLog, CocWarClanInfo, CocWarMember } from '@/lib/types';
import { getThImage } from '@/lib/th-utils';
import { StarIcon, ChevronDownIcon, ChevronUpIcon } from '@/app/components/icons';
import CwlWarPlayerRow from './CwlWarPlayerRow'; // Impor dari file di Canvas

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
  // State untuk mengontrol expand/collapse rincian
  const [isRowOpen, setIsRowOpen] = useState(false);

  // Tentukan siapa kita dan siapa lawan
  let ourClanInfo: CocWarClanInfo | undefined;
  let opponentClanInfo: CocWarClanInfo | undefined;

  // Cek null safety (jika data ronde korup/tidak lengkap)
  if (!round.clan || !round.opponent) {
    return (
      <tr className="bg-coc-stone/10">
        <td className="px-3 py-3 text-center text-sm text-gray-400 font-clash">
          {roundNumber}
        </td>
        <td colSpan={4} className="px-3 py-3 text-left text-sm text-gray-500 italic">
          Data ronde tidak lengkap (missing clan/opponent info).
        </td>
      </tr>
    );
  }

  // Logika untuk menentukan siapa 'kita' dan siapa 'lawan'
  // Ini aman karena skrip sync (di Canvas) sudah memfilter perang yang tidak relevan
  if (round.clan.tag === ourClanTag) {
    ourClanInfo = round.clan;
    opponentClanInfo = round.opponent;
  } else {
    ourClanInfo = round.opponent;
    opponentClanInfo = round.clan;
  }

  // Tentukan hasil perang
  let resultText = 'Seri';
  let resultColor = 'text-coc-gold';

  if (round.result) {
    if (round.result === 'win') {
      resultText = 'Menang';
      resultColor = 'text-coc-green';
    } else if (round.result === 'lose') {
      resultText = 'Kalah';
      resultColor = 'text-coc-red';
    }
  } else if (ourClanInfo.stars > opponentClanInfo.stars) {
    resultText = 'Menang';
    resultColor = 'text-coc-green';
  } else if (ourClanInfo.stars < opponentClanInfo.stars) {
    resultText = 'Kalah';
    resultColor = 'text-coc-red';
  }

  // Urutkan anggota di kedua klan berdasarkan posisi peta
  const ourMembers = [...(ourClanInfo.members || [])].sort(
    (a, b) => a.mapPosition - b.mapPosition
  );
  const opponentMembers = [...(opponentClanInfo.members || [])].sort(
    (a, b) => a.mapPosition - b.mapPosition
  );

  return (
    <Fragment>
      {/* Baris Ringkasan (Summary Row) yang bisa diklik */}
      <tr
        className="hover:bg-coc-stone/20 transition-colors cursor-pointer"
        onClick={() => setIsRowOpen(!isRowOpen)}
      >
        <td className="px-3 py-3 text-center text-sm text-white font-clash">
          <div className="flex items-center justify-center gap-1">
            {isRowOpen ? (
              <ChevronUpIcon className="h-3 w-3" />
            ) : (
              <ChevronDownIcon className="h-3 w-3" />
            )}
            {roundNumber}
          </div>
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-sm">
          <div className="flex items-center gap-2">
            <Image
              src={opponentClanInfo.badgeUrls.small}
              alt={opponentClanInfo.name}
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-white font-semibold">{opponentClanInfo.name}</span>
          </div>
        </td>
        <td className={`px-3 py-3 text-center text-sm font-semibold ${resultColor}`}>
          {resultText}
        </td>
        <td className="px-3 py-3 text-center text-sm text-white font-clash">
          <div className="flex items-center justify-center gap-4">
            <span className="text-coc-green">
              {ourClanInfo.stars} <StarIcon className="inline h-4 w-4" />
            </span>
            <span>vs</span>
            <span className="text-coc-red">
              {opponentClanInfo.stars} <StarIcon className="inline h-4 w-4" />
            </span>
          </div>
        </td>
        <td className="px-3 py-3 text-center text-xs text-gray-400">
          {ourClanInfo.destructionPercentage.toFixed(2)}% vs{' '}
          {opponentClanInfo.destructionPercentage.toFixed(2)}%
        </td>
      </tr>

      {/* Baris Rincian (Detail Row) yang bisa dibuka */}
      {isRowOpen && (
        <tr className="bg-coc-dark/30">
          <td colSpan={5} className="p-0">
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tabel Klan Kita */}
              <div>
                <h4 className="text-sm font-clash text-white mb-2">
                  {ourClanInfo.name}
                </h4>
                <div className="overflow-hidden rounded-md border border-coc-gold-dark/20">
                  <table className="min-w-full text-xs">
                    <thead className="bg-coc-stone/50">
                      <tr>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          #
                        </th>
                        <th className="px-2 py-1 text-left font-clash text-coc-gold uppercase">
                          Pemain
                        </th>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          Serangan
                        </th>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          Defend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coc-gold-dark/10">
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
              <div>
                <h4 className="text-sm font-clash text-white mb-2">
                  {opponentClanInfo.name}
                </h4>
                <div className="overflow-hidden rounded-md border border-coc-gold-dark/20">
                  <table className="min-w-full text-xs">
                    <thead className="bg-coc-stone/50">
                      <tr>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          #
                        </th>
                        <th className="px-2 py-1 text-left font-clash text-coc-gold uppercase">
                          Pemain
                        </th>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          Serangan
                        </th>
                        <th className="px-2 py-1 text-center font-clash text-coc-gold uppercase">
                          Defend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-coc-gold-dark/10">
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
