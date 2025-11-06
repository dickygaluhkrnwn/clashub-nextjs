'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ClanApiCache,
  UserProfile,
  ClanRole,
  ManagerRole,
  StandardMemberRole,
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@/app/components/icons';
import { getThImage, formatNumber } from '@/lib/th-utils';

// Tipe RosterMember didefinisikan di sini agar komponen ini mandiri.
// Ini adalah salinan dari tipe yang ada di MemberTabContent
export type RosterMember = ClanApiCache['members'][number] & {
  uid?: string;
  clashubRole: ManagerRole | StandardMemberRole;
  isVerified: boolean;
};

interface MemberTableRowProps {
  member: RosterMember;
  userProfile: UserProfile; // Profil user yang sedang login
  isManager: boolean;
  isLeader: boolean;
  // Handler diteruskan dari parent (MemberTabContent)
  onRoleChange: (
    memberUid: string,
    newClashubRole: UserProfile['role']
  ) => void;
  onKick: (memberUid: string) => void;
  availableClashubRoles: UserProfile['role'][];
}

/**
 * Helper function visual untuk status partisipasi
 */
const getParticipationStatusClass = (
  status: ClanApiCache['members'][number]['participationStatus']
) => {
  switch (status) {
    case 'Promosi':
      return 'text-coc-gold bg-coc-gold/20 font-bold border-coc-gold';
    case 'Demosi':
      return 'text-coc-red bg-coc-red/20 font-bold border-coc-red';
    case 'Leader/Co-Leader':
      return 'text-coc-blue bg-coc-blue/20 border-coc-blue';
    case 'Aman':
    default:
      return 'text-coc-green bg-coc-green/20 border-coc-green';
  }
};

/**
 * @component MemberTableRow
 * Komponen ini me-render satu baris (<tr>) untuk tabel anggota.
 * Logika state untuk dropdown role di-handle secara lokal.
 */
export const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  userProfile,
  isManager,
  isLeader,
  onRoleChange,
  onKick,
  availableClashubRoles,
}) => {
  // State untuk dropdown role sekarang lokal di setiap baris
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  // --- Logika Otorisasi (Sama seperti di file asli) ---
  const canModify =
    member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
  // Co-Leader tidak bisa mengubah Co-Leader lain
  const isCoLeaderModifyingCoLeader =
    userProfile.role === 'Co-Leader' && member.clashubRole === 'Co-Leader';

  const isActionDisabled =
    !isManager || !canModify || isCoLeaderModifyingCoLeader || !member.uid;

  const thImageUrl = getThImage(member.townHallLevel);

  return (
    <tr className="hover:bg-coc-stone/20 transition-colors">
      {/* Kolom 1: Pemain */}
      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={thImageUrl}
              alt={`TH ${member.townHallLevel}`}
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
          <div>
            <p className="font-clash text-base truncate max-w-[150px]">
              {member.name}
            </p>
            <p className="text-gray-500 block text-xs font-mono">
              {member.tag}
            </p>
            <p className="text-gray-400 block text-xs font-sans capitalize">
              {member.role} CoC
            </p>
          </div>
        </div>
      </td>

      {/* Kolom 2: XP / Donasi */}
      <td className="px-3 py-3 whitespace-nowrap text-center text-gray-300">
        <p>
          XP:{' '}
          <span className="font-bold text-white">
            {formatNumber(member.expLevel)}
          </span>
        </p>
        <p className="text-xs">
          D+: {formatNumber(member.donations)} | D-:{' '}
          {formatNumber(member.donationsReceived)}
        </p>
      </td>

      {/* Kolom 3: Trofi */}
      <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-300 font-semibold">
        {formatNumber(member.trophies || 0)} 🏆
      </td>

      {/* Kolom 4: Partisipasi CW */}
      <td className="px-3 py-3 text-center text-gray-300 text-xs font-semibold">
        <span className="text-coc-green">S-{member.warSuccessCount}</span> /{' '}
        <span className="text-coc-red">F-{member.warFailCount}</span>
      </td>

      {/* Kolom 5: Partisipasi CWL */}
      <td className="px-3 py-3 text-center text-gray-300 text-xs font-semibold">
        <span className="text-coc-green">S-{member.cwlSuccessCount}</span> /{' '}
        <span className="text-coc-red">F-{member.cwlFailCount}</span>
      </td>

      {/* Kolom 6: Status Partisipasi */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <div
          className={`inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-xs border ${getParticipationStatusClass(
            member.participationStatus
          )}`}
        >
          <span className="font-bold">{member.participationStatus}</span>
          <span
            className="text-[10px] opacity-80 mt-0.5 max-w-[100px] truncate"
            title={member.statusKeterangan || 'N/A'}
          >
            {member.statusKeterangan}
          </span>
        </div>
      </td>

      {/* Kolom 7: Role Clashub / Aksi */}
      <td className="px-3 py-3 whitespace-nowrap text-center space-y-1 w-[180px]">
        <span
          className={
            member.isVerified
              ? 'text-coc-green block mb-1 font-mono'
              : 'text-coc-red block mb-1 font-mono'
          }
          title={
            member.isVerified
              ? 'Akun Clashub Terverifikasi'
              : 'Akun Clashub Belum Terverifikasi'
          }
        >
          {member.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
        </span>

        {member.uid ? (
          <div className="flex flex-col space-y-1 items-center">
            {isManager ? ( // TAMPILAN MANAGER (Aksi penuh)
              <>
                {/* Dropdown Role */}
                <div className="relative inline-block text-left w-full">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setOpenRoleDropdown(
                        openRoleDropdown === member.uid ? null : member.uid!
                      )
                    }
                    disabled={isActionDisabled}
                    className="w-full justify-center text-sm font-semibold"
                  >
                    {member.clashubRole}
                    {openRoleDropdown === member.uid ? (
                      <ChevronUpIcon className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-3 w-3 ml-1" />
                    )}
                  </Button>

                  {openRoleDropdown === member.uid && (
                    <div className="absolute right-0 z-10 w-32 mt-1 origin-top-right rounded-md bg-coc-stone/90 shadow-lg ring-1 ring-coc-gold-dark/50 focus:outline-none">
                      <div className="py-1">
                        {availableClashubRoles.map((role) => (
                          <a
                            key={role}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onRoleChange(member.uid!, role);
                              setOpenRoleDropdown(null); // Tutup setelah klik
                            }}
                            className={`block px-4 py-2 text-xs text-white hover:bg-coc-gold-dark/30 ${
                              member.clashubRole === role
                                ? 'bg-coc-gold-dark/50 font-bold'
                                : ''
                            }`}
                            title={`Ubah role menjadi ${role}`}
                          >
                            {role}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Kick */}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  // Gunakan handler prop 'onKick'
                  onClick={() => onKick(member.uid!)}
                  disabled={isActionDisabled}
                  className="w-full justify-center bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30"
                >
                  <TrashIcon className="h-3 w-3 mr-1" /> Kick
                </Button>
              </>
            ) : (
              // TAMPILAN ANGGOTA BIASA (Hanya menampilkan role)
              <span className="text-sm font-semibold text-coc-gold-light p-2 bg-coc-stone/30 rounded w-full">
                {member.clashubRole}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-600 italic text-xs">
            No Clashub Account
          </span>
        )}
      </td>
    </tr>
  );
};