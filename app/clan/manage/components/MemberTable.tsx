'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]
import { MemberTableRow, RosterMember } from './MemberTableRow';

/**
 * @interface MemberTableProps
 * Props yang dibutuhkan oleh komponen MemberTable.
 */
interface MemberTableProps {
  combinedRoster: RosterMember[];
  userProfile: UserProfile;
  isManager: boolean;
  isLeader: boolean;
  onRoleChange: (memberUid: string, newClashubRole: UserProfile['role']) => void;
  onKick: (memberUid: string) => void;
  availableClashubRoles: UserProfile['role'][];
}

/**
 * @component MemberTable
 * Komponen ini me-render struktur tabel (<table>) dan me-looping data,
 * mendelegasikan render baris ke MemberTableRow.
 */
export const MemberTable: React.FC<MemberTableProps> = ({
  combinedRoster,
  userProfile,
  isManager,
  isLeader,
  onRoleChange,
  onKick,
  availableClashubRoles,
}) => {
  const { t } = useLanguage(); // [BARU] Hook i18n

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
        {/* Header Tabel */}
        <thead className="bg-coc-stone/70 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
              {/* Pemain */}
              {t.clanMembers.colPlayer}
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              {/* XP / Donasi */}
              {t.clanMembers.colDonations}
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              {/* Trophies - Menggunakan key dari module lain yang relevan */}
              {t.clanPublicProfile.table.trophies}
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              {/* Hardcoded sementara karena spesifik, atau gunakan kombinasi */}
              CW {t.clanHub.filterVisionLabel.split(' ')[0] || 'Stats'}
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              CWL {t.clanHub.filterVisionLabel.split(' ')[0] || 'Stats'}
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              Status
            </th>
            {/* Kolom Aksi hanya terlihat oleh Manager */}
            {isManager && (
              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[150px]">
                {t.clanMembers.colActions}
              </th>
            )}
            {!isManager && (
              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">
                {t.clanHub.role}
              </th>
            )}
          </tr>
        </thead>

        {/* Body Tabel */}
        <tbody className="divide-y divide-coc-gold-dark/10">
          {combinedRoster.map((member) => (
            // Panggil komponen Baris untuk setiap anggota
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
  );
};