'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserIcon } from '@/app/components/icons';
import { RosterMember } from '@/app/clan/manage/components/MemberTableRow';
import { getThImage, formatNumber } from '@/lib/th-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { Button } from '@/app/components/ui/Button'; // Import Button

interface TeamMemberTableProps {
  rosterMembers: RosterMember[];
}

/**
 * @component TeamMemberTable
 * Komponen responsif: Tabel di Desktop, Card List di Mobile (dengan Load More).
 */
export const TeamMemberTable = ({ rosterMembers }: TeamMemberTableProps) => {
  const { t } = useLanguage();
  // State untuk pagination di mobile
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10);

  const sortedMembers = [...rosterMembers].sort(
    (a, b) => b.townHallLevel - a.townHallLevel,
  );

  // Data yang ditampilkan di mobile (dipotong)
  const mobileMembers = sortedMembers.slice(0, mobileVisibleCount);
  const hasMoreMobile = mobileVisibleCount < sortedMembers.length;

  if (sortedMembers.length === 0) {
    return (
      <div className="card-stone p-8 rounded-2xl text-center border border-white/5 border-dashed">
        <UserIcon className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-50" />
        <p className="text-gray-400">{t.teamMemberTable.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View: Card List (Visible < md) */}
      <div className="block md:hidden space-y-3">
        {mobileMembers.map((member) => (
          <div key={member.tag} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src={getThImage(member.townHallLevel)}
                  alt={`TH ${member.townHallLevel}`}
                  width={40}
                  height={40}
                  className="rounded-lg shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 bg-black/80 text-[8px] px-1 rounded text-white border border-white/20">
                    {member.townHallLevel}
                </div>
              </div>
              <div>
                {member.isVerified && member.uid ? (
                  <Link href={`/player/${member.uid}`} className="font-bold text-white text-sm hover:text-coc-gold transition-colors block leading-tight">
                    {member.name}
                  </Link>
                ) : (
                  <span className="font-bold text-white text-sm block leading-tight">{member.name}</span>
                )}
                <span className="text-[10px] text-gray-500 font-mono block">{member.tag}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wide ${
                    member.role === 'leader' ? 'text-coc-gold' : 
                    member.role === 'coLeader' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                    {member.role}
                </span>
              </div>
            </div>
            
            {/* Quick Stats Column */}
            <div className="text-right text-xs space-y-1">
                <div className="text-coc-green font-mono font-bold">
                    ▲ {formatNumber(member.donations)}
                </div>
                <div className="text-coc-red font-mono font-bold">
                    ▼ {formatNumber(member.donationsReceived)}
                </div>
            </div>
          </div>
        ))}

        {/* Load More Button (Mobile Only) */}
        {hasMoreMobile && (
            <div className="pt-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setMobileVisibleCount(prev => prev + 10)}
                    className="w-full py-3 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-coc-gold/30 hover:bg-white/5"
                >
                    {t.common?.loadMore || "Muat Lebih Banyak"} ({sortedMembers.length - mobileVisibleCount})
                </Button>
            </div>
        )}
      </div>

      {/* Desktop View: Table (Visible >= md) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 shadow-xl bg-[#1a1a1a]">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t.teamMemberTable.colPlayer}
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t.teamMemberTable.colRole}
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t.teamMemberTable.colXp}
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-coc-green/80 uppercase tracking-wider">
                {t.teamMemberTable.colDonationGiven}
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-coc-red/80 uppercase tracking-wider">
                {t.teamMemberTable.colDonationReceived}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-transparent">
            {sortedMembers.map((member) => (
              <tr key={member.tag} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-9 h-9 flex-shrink-0">
                      <Image
                        src={getThImage(member.townHallLevel)}
                        alt={`TH ${member.townHallLevel}`}
                        width={36}
                        height={36}
                        className="rounded-lg shadow-sm group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div>
                      {member.isVerified && member.uid ? (
                        <Link
                          href={`/player/${member.uid}`}
                          className="font-clash text-sm text-white hover:text-coc-gold transition-colors block"
                        >
                          {member.name}
                        </Link>
                      ) : (
                        <span className="font-clash text-sm text-white block">
                          {member.name}
                        </span>
                      )}
                      <span className="text-gray-500 text-[10px] font-mono block">{member.tag}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      member.role === 'leader' ? 'bg-coc-gold/10 text-coc-gold border border-coc-gold/20' :
                      member.role === 'coLeader' ? 'bg-white/10 text-gray-200 border border-white/10' :
                      'text-gray-500'
                  }`}>
                    {member.role === 'coLeader' ? 'Co-Leader' : member.role}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-mono text-blue-300">
                  {formatNumber(member.expLevel)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-mono text-coc-green font-bold">
                  {formatNumber(member.donations)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-mono text-coc-red font-bold">
                  {formatNumber(member.donationsReceived)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};