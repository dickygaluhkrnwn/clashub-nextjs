'use client';

import React from 'react';
// Impor tipe UserProfile (dibutuhkan untuk props)
import { UserProfile } from '@/lib/types';
// Impor komponen Baris dan tipe datanya dari file yang baru kita buat
import { MemberTableRow, RosterMember } from './MemberTableRow';

/**
 * @interface MemberTableProps
 * Props yang dibutuhkan oleh komponen MemberTable.
 * Sebagian besar props ini akan diteruskan (passed down) ke MemberTableRow.
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
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
        {/* Header Tabel */}
        <thead className="bg-coc-stone/70 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">
              Pemain (TH / Role CoC)
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              XP / D+ / D-
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              Trophies
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              Partisipasi CW
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              Partisipasi CWL
            </th>
            <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">
              Status Partisipasi
            </th>
            {/* Kolom Aksi hanya terlihat oleh Manager */}
            {isManager && (
              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[150px]">
                Role Clashub / Aksi
              </th>
            )}
            {!isManager && (
              <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider w-[120px]">
                Role Clashub
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