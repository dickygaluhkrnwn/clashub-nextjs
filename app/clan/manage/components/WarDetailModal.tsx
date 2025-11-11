import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  XIcon,
  StarIcon,
  AlertTriangleIcon,
  TrophyIcon,
  ShieldIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@/app/components/icons';
// --- [MODIFIKASI] Impor ManagedClan, Hapus tipe/fungsi Firestore client-side ---
import {
  WarArchive,
  CocWarMember,
  CocWarAttack,
  ManagedClan,
} from '@/lib/types';
// Hapus: doc, getDoc, Timestamp, firestore, COLLECTIONS
// --- [AKHIR MODIFIKASI] ---
import Image from 'next/image';
import { getThImage } from '@/lib/th-utils';
import { Button } from '@/app/components/ui/Button';

// --- [MODIFIKASI] Interface Props diubah ---
interface WarDetailModalProps {
  clan: ManagedClan; // Menerima objek ManagedClan lengkap (untuk konsistensi)
  warData: WarArchive | null; // Menerima data arsip lengkap, bukan ID
  onClose: () => void;
}
// --- [AKHIR MODIFIKASI] ---

// =========================================================================
// HELPER: Tampilan Detail Serangan (Nested Row)
// (Tidak ada perubahan, komponen ini sudah siap)
// =========================================================================

interface AttackRowProps {
  attack: CocWarAttack;
  defenderDetails: { thLevel: number; mapPosition: number; name: string } | null;
}

const AttackRow: React.FC<AttackRowProps> = ({ attack, defenderDetails }) => {
  const starColor =
    attack.stars === 3
      ? 'text-coc-green'
      : attack.stars === 2
      ? 'text-coc-yellow'
      : 'text-coc-red';

  const thLevel = defenderDetails?.thLevel || 1;
  const mapPosition = defenderDetails?.mapPosition || 'N/A';
  const defenderName = defenderDetails?.name || 'Target Tidak Dikenal';
  const duration = attack.duration || 0;

  return (
    <div className="flex items-center text-xs p-2 border-b border-coc-stone-light/10 last:border-b-0 transition-all hover:bg-coc-stone-light/10">
      {/* Target & TH Level */}
      <div className="w-1/4 flex items-center gap-2 font-semibold text-white/90">
        <Image
          src={getThImage(thLevel)}
          alt={`TH ${thLevel}`}
          width={20}
          height={20}
          className="rounded-full flex-shrink-0"
        />
        <span className="hidden sm:inline">Map {mapPosition}</span> ({defenderName}
        )
      </div>

      {/* Hasil Serangan */}
      <div className="w-1/4 text-center">
        <div
          className={`flex items-center justify-center font-bold ${starColor} gap-1`}
        >
          {attack.stars}{' '}
          <StarIcon
            className={`w-3 h-3 ${
              starColor === 'text-coc-green'
                ? 'fill-coc-green'
                : starColor === 'text-coc-yellow'
                ? 'fill-coc-yellow'
                : 'fill-coc-red'
            }`}
          />
        </div>
      </div>

      {/* Persen Kerusakan */}
      <div className="w-1/4 text-center text-gray-300 font-mono">
        {attack.destructionPercentage}%
      </div>

      {/* Durasi */}
      <div className="w-1/4 text-right text-gray-400">
        {Math.floor(duration / 60)}m {duration % 60}s
      </div>
    </div>
  );
};

// =========================================================================
// HELPER: Tampilan Baris Pemain War
// (Tidak ada perubahan, komponen ini sudah siap)
// =========================================================================

interface MemberRowProps {
  member: CocWarMember;
  isClanMember: boolean;
  opponentMembersMap: Map<string, CocWarMember>;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  isClanMember,
  opponentMembersMap,
}) => {
  const totalStars =
    member.attacks?.reduce((sum, attack) => sum + (attack.stars || 0), 0) || 0;
  const totalAttacks = member.attacks?.length || 0;
  const thLevelImage = getThImage(member.townhallLevel);

  const textColor = isClanMember ? 'text-white' : 'text-coc-yellow-light';
  const bgClass = isClanMember
    ? 'bg-coc-stone/30 hover:bg-coc-stone/40'
    : 'bg-coc-stone-dark/30 hover:bg-coc-stone-dark/40';

  const [isExpanded, setIsExpanded] = useState(false);

  const renderAttackRows = () =>
    member.attacks!.map((attack, index) => {
      const defender = opponentMembersMap.get(attack.defenderTag || '');
      const defenderDetails = defender
        ? {
            thLevel: defender.townhallLevel,
            mapPosition: defender.mapPosition,
            name: defender.name,
          }
        : null;

      return (
        <AttackRow
          key={index}
          attack={attack}
          defenderDetails={defenderDetails}
        />
      );
    });

  return (
    <div
      className={`border-b border-coc-gold-dark/10 ${bgClass} transition-colors`}
    >
      {/* Baris Utama Pemain */}
      <div
        className={`flex items-center p-3 cursor-pointer ${
          totalAttacks > 0 ? 'hover:bg-coc-gold/5' : ''
        } ${isExpanded ? 'border-b border-coc-gold-dark/20' : ''}`}
        onClick={() => totalAttacks > 0 && setIsExpanded(!isExpanded)}
      >
        {/* Posisi Peta / ID */}
        <div className="w-1/12 text-center text-sm font-bold text-coc-gold/80 hidden sm:block">
          {member.mapPosition}
        </div>

        {/* TH Level & Nama */}
        <div className="w-4/12 flex items-center gap-2 flex-grow">
          <Image
            src={thLevelImage}
            alt={`TH ${member.townhallLevel}`}
            width={28}
            height={28}
            className="rounded-full flex-shrink-0"
          />
          <div className="flex flex-col text-left">
            <span className={`font-semibold text-sm ${textColor}`}>
              {member.name}
            </span>
            <span className="text-xs text-gray-500">{member.tag}</span>
          </div>
        </div>

        {/* Total Bintang */}
        <div className="w-2/12 text-center text-sm font-bold flex items-center justify-center gap-1">
          <StarIcon className="w-4 h-4 fill-coc-gold" /> {totalStars}
        </div>

        {/* Total Serangan */}
        <div className="w-2/12 text-center text-sm text-gray-300">
          {totalAttacks} {totalAttacks === 1 ? 'Serangan' : 'Serangan'}
        </div>

        {/* Tanda Detail (Panah) */}
        <div className="w-1/12 text-center text-gray-400">
          {totalAttacks > 0 &&
            (isExpanded ? (
              <ArrowUpIcon className="h-4 w-4 mx-auto" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mx-auto" />
            ))}
        </div>
      </div>

      {/* Detail Serangan (Expanded Content) */}
      {totalAttacks > 0 && isExpanded && (
        <div className="p-2 pt-0 sm:p-4 sm:pt-0">
          <div className="border border-coc-gold-dark/20 rounded-lg overflow-hidden bg-coc-stone-dark">
            {renderAttackRows()}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// KOMPONEN UTAMA: WarDetailModal (MODIFIED)
// =========================================================================

const WarDetailModal: React.FC<WarDetailModalProps> = ({
  clan, // [MODIFIKASI] Menerima prop 'clan' (ManagedClan)
  warData, // [MODIFIKASI] Menerima prop 'warData' (WarArchive)
  onClose,
}) => {
  // --- [MODIFIKASI] Hapus semua state fetching (isLoading, error, setWarData) ---
  // const [warData, setWarData] = useState<WarArchive | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // --- [MODIFIKASI] 'isOpen' sekarang dikontrol oleh 'warData' dari props ---
  const isOpen = !!warData;

  // --- [MODIFIKASI] Hapus seluruh 'useEffect' untuk fetching data ---
  // useEffect(() => { ... fetchWarDetail ... }, [clanId, warId]);
  // (Seluruh blok useEffect dihapus)

  // [PERBAIKAN] Buat Map untuk lookup defender details yang cepat
  // [MODIFIKASI] Logika ini tetap, tetapi sekarang menggunakan 'warData' dari PROPS
  const opponentMembersMap = useMemo(() => {
    const map = new Map<string, CocWarMember>();
    if (warData?.opponent.members) {
      (warData.opponent.members as CocWarMember[])
        .sort((a, b) => a.mapPosition - b.mapPosition)
        .forEach((member) => {
          if (member.tag) {
            map.set(member.tag, member);
          }
        });
    }
    return map;
  }, [warData]); // Dependensi diubah ke warData (prop)

  // [MODIFIKASI] Logika ini tetap, tetapi sekarang menggunakan 'warData' dari PROPS
  const ourMembers = useMemo(
    () =>
      warData?.clan.members?.sort(
        (a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition
      ) || [],
    [warData] // Dependensi diubah ke warData (prop)
  );
  const opponentMembers = useMemo(
    () =>
      warData?.opponent.members?.sort(
        (a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition
      ) || [],
    [warData] // Dependensi diubah ke warData (prop)
  );

  if (!isOpen) return null;

  // Pastikan warEndTime adalah objek Date (seharusnya sudah dikonversi oleh archives.ts)
  const warEndTimeDate =
    warData.warEndTime instanceof Date
      ? warData.warEndTime
      : new Date(warData.warEndTime);

  return (
    // Modal Container (fixed position)
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
      onClick={onClose}
    >
      {/* Konten Modal (Centered) */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Panel Modal */}
        <div
          className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-coc-stone p-6 text-left align-middle shadow-xl transition-all duration-300 border border-coc-gold-dark/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            {/* Header Modal */}
            <h3 className="text-2xl font-clash font-bold leading-6 text-white border-b border-coc-gold-dark/30 pb-3 mb-4 flex justify-between items-center">
              Rincian War Classic: {warData?.clan.name || '...'} vs{' '}
              {warData?.opponent.name || '...'}
              <Button
                size="sm"
                variant="tertiary"
                className="inline-flex justify-center rounded-full text-white bg-coc-stone-light p-2 hover:bg-coc-red/70 focus:outline-none"
                onClick={onClose}
              >
                <XIcon className="h-5 w-5" aria-hidden="true" />
              </Button>
            </h3>

            {/* --- [MODIFIKASI] Hapus Blok isLoading dan error --- */}
            {/* {isLoading && ( ... )} */}
            {/* {error && ( ... )} */}

            {/* --- [MODIFIKASI] Tampilkan konten jika 'warData' ada (sudah dicek oleh 'isOpen') --- */}
            {warData && (
              <div className="space-y-6">
                {/* War Summary Card */}
                <div className="bg-coc-stone-dark/50 p-4 rounded-lg border border-coc-gold-dark/30">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <p className="text-gray-400 font-clash">
                      UKURAN: {warData.teamSize}v{warData.teamSize}
                    </p>
                    <p className="text-gray-400 font-clash">
                      HASIL:{' '}
                      <span
                        className={`font-bold ${
                          warData.result === 'win'
                            ? 'text-coc-green'
                            : warData.result === 'lose'
                            ? 'text-coc-red'
                            : 'text-coc-blue'
                        }`}
                      >
                        {warData.result?.toUpperCase() || 'N/A'}
                      </span>
                    </p>
                  </div>

                  {/* Scoreboard */}
                  <div className="flex text-center border border-coc-gold-dark/50 rounded-lg divide-x divide-coc-gold-dark/50 overflow-hidden">
                    {/* Klan Kita */}
                    <div className="w-1/2 p-4 bg-coc-stone-light">
                      <TrophyIcon className="h-6 w-6 text-coc-gold mx-auto mb-2" />
                      <p className="text-white font-bold text-lg mb-1">
                        {warData.clan.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Stars:{' '}
                        <span className="text-coc-gold">
                          {warData.clan.stars}
                        </span>{' '}
                        | Destruction:{' '}
                        <span className="text-white font-mono">
                          {warData.clan.destructionPercentage.toFixed(2)}%
                        </span>
                      </p>
                    </div>

                    {/* Klan Lawan */}
                    <div className="w-1/2 p-4 bg-coc-stone-dark">
                      <ShieldIcon className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                      <p className="text-white font-bold text-lg mb-1">
                        {warData.opponent.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Stars:{' '}
                        <span className="text-coc-red">
                          {warData.opponent.stars}
                        </span>{' '}
                        | Destruction:{' '}
                        <span className="text-white font-mono">
                          {warData.opponent.destructionPercentage.toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-center text-gray-500">
                    Selesai:{' '}
                    {/* [MODIFIKASI] Gunakan warEndTimeDate yang sudah pasti Date */}
                    {warEndTimeDate.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Player Detail Comparison */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Tim Kita */}
                  <div className="lg:w-1/2 w-full border border-coc-gold/20 rounded-lg overflow-hidden bg-coc-stone-dark shadow-xl">
                    <h4 className="font-clash text-lg text-white p-3 bg-coc-gold/10 flex items-center justify-center gap-2">
                      <ArrowLeftIcon className="h-4 w-4" /> Tim{' '}
                      {warData.clan.name}
                    </h4>
                    <div className="divide-y divide-coc-gold-dark/10 max-h-[60vh] overflow-y-auto">
                      {ourMembers.map((member: CocWarMember) => (
                        <MemberRow
                          key={member.tag}
                          member={member}
                          isClanMember={true}
                          opponentMembersMap={opponentMembersMap}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tim Lawan */}
                  <div className="lg:w-1/2 w-full border border-coc-red/20 rounded-lg overflow-hidden bg-coc-stone-dark shadow-xl">
                    <h4 className="font-clash text-lg text-white p-3 bg-coc-red/10 flex items-center justify-center gap-2">
                      Tim {warData.opponent.name}{' '}
                      <ArrowRightIcon className="h-4 w-4" />
                    </h4>
                    <div className="divide-y divide-coc-gold-dark/10 max-h-[60vh] overflow-y-auto">
                      {opponentMembers.map((member: CocWarMember) => (
                        <MemberRow
                          key={member.tag}
                          member={member}
                          isClanMember={false}
                          opponentMembersMap={opponentMembersMap}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarDetailModal;