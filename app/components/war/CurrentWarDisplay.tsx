'use client';

// File: app/components/war/CurrentWarDisplay.tsx
// Deskripsi: [BARU - FASE 6] Komponen UI reuseable untuk menampilkan data live war.
// Diadaptasi dari ActiveWarTabContent.tsx, tapi menerima data via props.

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CocWarLog,
  CocWarMember,
  CocWarAttack,
  CocCurrentWar,
} from '@/lib/types';
import {
  SwordsIcon,
  AlertTriangleIcon,
  TrophyIcon,
  ShieldIcon,
  StarIcon,
  ClockIcon,
  ArrowRightIcon,
  BookOpenIcon,
  Loader2Icon,
} from '@/app/components/icons';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';

/**
 * @function formatWarTime
 * Helper untuk format sisa waktu (Diambil dari ActiveWarTabContent.tsx)
 */
const formatWarTime = (
  war: CocWarLog | CocCurrentWar,
): { text: string; isEnded: boolean } => {
  const endTimeStr = war.endTime;
  const endTime = endTimeStr
    ? typeof endTimeStr === 'string'
      ? new Date(
          endTimeStr.replace(
            /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/,
            '$1-$2-$3T$4:$5:$6Z',
          ),
        )
      : new Date(endTimeStr)
    : null;

  if (!endTime || isNaN(endTime.getTime())) {
    return { text: 'Waktu Tidak Tersedia', isEnded: false };
  }

  const timeRemainingMs = endTime.getTime() - Date.now();

  if (timeRemainingMs <= 0) {
    return { text: 'War Selesai', isEnded: true };
  }

  const totalSeconds = Math.floor(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    text: `Sisa Waktu: ${hours}j ${minutes}m ${seconds}d`,
    isEnded: false,
  };
};

// ======================================================================================================
// Helper: War Member Row
// (Diambil dari ActiveWarTabContent.tsx)
// ======================================================================================================

interface WarMemberRowProps {
  member: CocWarMember;
  isOurClan: boolean;
  // clanTag: string; // Tidak diperlukan lagi untuk aksi
  isCwl: boolean;
}

const WarMemberRow: React.FC<WarMemberRowProps> = ({
  member,
  isOurClan,
  isCwl,
}) => {
  const bestAttackReceived = member.bestOpponentAttack;
  const attacksDone = member.attacks?.length || 0;
  const maxAttacks = isCwl ? 1 : 2;
  let defenseStatus = 'Belum Diserang';
  let defenseStars = 0;
  let defenseDestruction = 0;

  if (bestAttackReceived) {
    defenseStars = bestAttackReceived.stars;
    defenseDestruction = bestAttackReceived.destructionPercentage;
    if (defenseStars === 3) {
      defenseStatus = 'Hancur (3 Bintang)';
    } else {
      defenseStatus = `${defenseStars} Bintang Diterima`;
    }
  }

  let attackSummary = '-';
  if (isOurClan && attacksDone > 0) {
    attackSummary = `${attacksDone} / ${maxAttacks} Serangan`;
  } else if (!isOurClan && bestAttackReceived) {
    attackSummary = `Diserang: ${bestAttackReceived.stars}⭐ (${bestAttackReceived.destructionPercentage.toFixed(
      2,
    )}%)`;
  }

  const starColorClass =
    defenseStars === 3
      ? 'text-coc-red'
      : defenseStars > 0
        ? 'text-coc-gold'
        : 'text-gray-500';

  return (
    <tr key={member.tag} className="hover:bg-coc-stone/20 transition-colors">
      {/* Posisi Peta */}
      <td className="px-3 py-2 text-center text-sm font-clash text-white">
        {member.mapPosition}
      </td>

      {/* Pemain */}
      <td className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-white">
        <div className="flex items-center space-x-3">
          <Image
            src={getThImage(member.townhallLevel)}
            alt={`TH ${member.townhallLevel}`}
            width={28}
            height={28}
            className="rounded-full"
          />
          <div>
            <p className="font-clash text-base truncate max-w-[150px]">
              {member.name}
            </p>
            <p className="text-gray-500 text-xs font-mono">{member.tag}</p>
          </div>
        </div>
      </td>

      {/* Serangan Dilakukan */}
      <td className="px-3 py-2 text-center text-sm text-gray-300">
        {isOurClan ? attackSummary : '-'}
      </td>

      {/* Pertahanan */}
      <td className="px-3 py-2 text-center text-sm">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border ${starColorClass} border-current`}
        >
          <StarIcon className="w-3 h-3" />
          <span>{defenseStars} ⭐</span>
        </div>
      </td>

      {/* Detail Pertahanan */}
      <td className="px-3 py-2 text-center text-xs text-gray-400">
        {defenseDestruction.toFixed(2)}%
      </td>

      {/* Aksi (Disederhanakan untuk tampilan publik) */}
      <td className="px-3 py-2 text-center w-[120px]">
        {isOurClan && member.attacks && member.attacks.length > 0 ? (
          <span className="text-xs text-gray-400">
            {member.attacks.length} serangan
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>
    </tr>
  );
};

// ======================================================================================================
// Main Component: CurrentWarDisplay
// ======================================================================================================

interface CurrentWarDisplayProps {
  currentWar: CocCurrentWar;
  ourClanTag: string; // Tag klan "kita" (Tim 1) untuk menentukan sisi
}

const CurrentWarDisplay: React.FC<CurrentWarDisplayProps> = ({
  currentWar,
  ourClanTag,
}) => {
  const [timeInfo, setTimeInfo] = useState({ text: 'N/A', isEnded: true });
  const isCwl = !!currentWar?.warTag;

  // --- Effect untuk update waktu tersisa ---
  useEffect(() => {
    if (!currentWar) {
      setTimeInfo({ text: 'N/A', isEnded: true });
      return;
    }
    setTimeInfo(formatWarTime(currentWar));
    const timer = setInterval(() => {
      if (currentWar) {
        setTimeInfo(formatWarTime(currentWar));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentWar]);

  // --- TAMPILAN JIKA WAR DITEMUKAN ---
  // Tentukan mana 'ourClan' dan 'opponentClan' berdasarkan ourClanTag
  const ourClan =
    currentWar.clan.tag === ourClanTag
      ? currentWar.clan
      : currentWar.opponent;
  const opponentClan =
    currentWar.opponent.tag === ourClanTag
      ? currentWar.opponent
      : currentWar.clan;

  let headerClass = '';
  let statusText = '';
  let borderClass = 'border-coc-red/50 bg-coc-red/10';

  if (currentWar.state === 'preparation') {
    statusText = 'Masa Persiapan';
    headerClass = 'text-coc-blue';
    borderClass = 'border-coc-blue/50 bg-coc-blue/10';
  } else if (currentWar.state === 'inWar') {
    statusText = 'Sedang Berperang';
    headerClass = 'text-coc-red';
    borderClass = 'border-coc-red/50 bg-coc-red/10';
  } else if (currentWar.state === 'warEnded') {
    statusText = 'Perang Selesai';
    headerClass = 'text-gray-400';
    borderClass = 'border-gray-600/50 bg-gray-600/10';
  }

  return (
    <div className="space-y-6">
      {/* War Header Info */}
      <div className={`card-stone p-6 border-4 ${borderClass} rounded-lg`}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2
              className={`text-3xl font-clash ${headerClass} flex items-center gap-3`}
            >
              <SwordsIcon className="h-8 w-8" />
              {ourClan.name} vs {opponentClan.name}
            </h2>

            <p className="text-gray-300 mt-1">
              Status:{' '}
              <span className={`font-semibold capitalize ${headerClass}`}>
                {statusText}
              </span>{' '}
              | Tipe: {isCwl ? 'CWL' : 'Classic War'} (
              {ourClan.members.length} vs {opponentClan.members.length})
            </p>
          </div>

          <div className="text-right flex flex-col gap-2">
            <p
              className={`text-lg font-clash ${
                timeInfo.isEnded ? headerClass : 'text-white'
              }`}
            >
              {timeInfo.text}
            </p>
            {/* Tombol Refresh Dihapus, ditangani oleh parent */}
          </div>
        </div>

        {/* Skor Ringkasan */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t border-coc-gold/30 pt-4">
          {/* Skor Kita */}
          <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-gold/30">
            <p className="text-xs text-gray-400 font-clash uppercase">
              Bintang {ourClan.name}
            </p>
            <p className="text-3xl font-bold text-coc-gold flex items-center justify-center gap-1 mt-1">
              <StarIcon className="h-7 w-7 text-coc-gold" /> {ourClan.stars}
              <span className="text-lg text-gray-300 ml-2">
                ({ourClan.destructionPercentage.toFixed(2)}%)
              </span>
            </p>
          </div>
          {/* Skor Lawan */}
          <div className="p-3 rounded-lg bg-coc-stone/20 border border-coc-red/30">
            <p className="text-xs text-gray-400 font-clash uppercase">
              Bintang {opponentClan.name}
            </p>
            <p className="text-3xl font-bold text-coc-red flex items-center justify-center gap-1 mt-1">
              <StarIcon className="h-7 w-7 text-coc-red" /> {opponentClan.stars}
              <span className="text-lg text-gray-300 ml-2">
                ({opponentClan.destructionPercentage.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Detail Anggota War */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Klan Kita */}
        <div className="space-y-4">
          <h3 className="text-xl font-clash text-white border-b border-coc-gold-dark/50 pb-2 flex items-center gap-2">
            <ShieldIcon className="h-6 w-6 text-coc-gold" /> Daftar{' '}
            {ourClan.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
              <thead className="bg-coc-stone/70 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                    Pemain
                  </th>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                    Serangan
                  </th>
                  <th
                    className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider"
                    colSpan={2}
                  >
                    Pertahanan Terbaik
                  </th>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coc-gold-dark/10">
                {ourClan.members.map((member: CocWarMember) => (
                  <WarMemberRow
                    key={member.tag}
                    member={member}
                    isOurClan={true}
                    isCwl={isCwl}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Klan Lawan */}
        <div className="space-y-4">
          <h3 className="text-xl font-clash text-white border-b border-coc-red/50 pb-2 flex items-center gap-2">
            <TrophyIcon className="h-6 w-6 text-coc-red" /> Daftar{' '}
            {opponentClan.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-coc-red/20 text-xs">
              <thead className="bg-coc-stone/70 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-10">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
                    Pemain
                  </th>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
                    Diserang
                  </th>
                  <th
                    className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider"
                    colSpan={2}
                  >
                    Bintang Terbaik
                  </th>
                  <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coc-red/10">
                {opponentClan.members.map((member: CocWarMember) => (
                  <WarMemberRow
                    key={member.tag}
                    member={member}
                    isOurClan={false}
                    isCwl={isCwl}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Akhir Detail Anggota War */}
    </div>
  );
};

export default CurrentWarDisplay;