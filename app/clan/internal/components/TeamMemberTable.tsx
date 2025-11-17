// [FASE 2.3] File ini dimodifikasi untuk memenuhi permintaan:

// 1. Menggunakan tipe data RosterMember (dari `page.tsx` yang baru).

// 2. Menghapus kolom Partisipasi CW, CWL, dan Status.

// 3. Memecah kolom XP / D+ / D- menjadi 3 kolom terpisah.

'use server'; // Tetap server component



import Link from 'next/link';

import Image from 'next/image'; // [FASE 2.3] Impor Image untuk TH

import { UserIcon } from '@/app/components/icons';

import {

  // [FASE 2.3] Tipe-tipe ini tidak lagi dibutuhkan di sini

  // ClanApiCache,

  // UserProfile,

  // ClanRole,

} from '@/lib/types';

// [FASE 2.3] Impor tipe RosterMember yang kita dapat dari `page.tsx`

import { RosterMember } from '@/app/clan/manage/components/MemberTableRow';

// [FASE 2.3] Impor utilitas yang kita butuhkan

import { getThImage, formatNumber } from '@/lib/th-utils';



// --- [FASE 2.3] Helper getParticipationStatusClass DIHAPUS ---

// --- [FASE 2.3] Tipe EnrichedMember DIHAPUS ---



// [FASE 2.3] Definisikan props untuk komponen ini (menggunakan RosterMember)

interface TeamMemberTableProps {

  rosterMembers: RosterMember[];

}



/**

 * @component TeamMemberTable

 * Komponen (Server) untuk menampilkan tabel anggota tim di halaman profil internal klan.

 */

export const TeamMemberTable = ({ rosterMembers }: TeamMemberTableProps) => {

  // [FASE 2.3] Gunakan prop 'rosterMembers' dan urutkan berdasarkan townHallLevel

  const sortedMembers = [...rosterMembers].sort(

    (a, b) => b.townHallLevel - a.townHallLevel,

  );



  return (

    <div className="card-stone p-6 space-y-6 rounded-lg">

      <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">

        <UserIcon className="h-6 w-6 text-coc-gold" /> Anggota Tim (

        {sortedMembers.length}/50)

      </h2>

      {sortedMembers.length === 0 ? (

        <p className="text-gray-400 text-center py-4">

          Tim ini belum memiliki anggota yang terdaftar di Clashub.

        </p>

      ) : (

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">

            {/* [FASE 2.3] Header Tabel Dimodifikasi */}

            <thead className="bg-coc-stone/50 sticky top-0">

              <tr>

                <th className="px-3 py-2 text-left font-clash text-coc-gold uppercase tracking-wider">

                  Pemain (TH / Role CoC)

                </th>

                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">

                  Role Clashub

                </th>

                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">

                  XP

                </th>

                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">

                  Donasi Diberikan

                </th>

                <th className="px-3 py-2 text-center font-clash text-coc-gold uppercase tracking-wider">

                  Donasi Diterima

                </th>

              </tr>

            </thead>

            {/* [FASE 2.3] Body Tabel Dimodifikasi */}

            <tbody className="divide-y divide-coc-gold-dark/10">

              {sortedMembers.map((member) => (

                <tr

                  key={member.tag} // Gunakan tag sebagai key unik

                  className="hover:bg-coc-stone/20 transition-colors"

                >

                  {/* Kolom 1: Pemain (TH / Role CoC) */}

                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white">

                    <div className="flex items-center space-x-3">

                      <div className="relative w-8 h-8 flex-shrink-0">

                        <Image

                          src={getThImage(member.townHallLevel)}

                          alt={`TH ${member.townHallLevel}`}

                          width={32}

                          height={32}

                          className="rounded-full"

                        />

                      </div>

                      <div>

                        {/* Tampilkan link hanya jika member terverifikasi (punya UID) */}

                        {member.isVerified && member.uid ? (

                          <Link

                            href={`/player/${member.uid}`}

                            className="font-clash text-base hover:text-coc-gold-light transition-colors max-w-[150px] truncate"

                          >

                            {member.name}

                          </Link>

                        ) : (

                          <p className="font-clash text-base text-white max-w-[150px] truncate">

                            {member.name}

                          </p>

                        )}

                        <span className="text-gray-500 block text-xs font-mono">

                          {member.tag}

                        </span>

                        {/* Tambahkan Role CoC */}

                        <span className="text-gray-400 block text-xs font-sans capitalize">

                          {member.role} CoC

                        </span>

                      </div>

                    </div>

                  </td>

                  {/* Kolom 2: Role Clashub */}

                  <td className="px-3 py-3 whitespace-nowrap text-center text-xs uppercase font-medium text-coc-blue">

                    {/* Tampilkan 'Member' jika tidak terverifikasi, atau role-nya */}

                    {member.clashubRole || 'Member'}

                  </td>

                  {/* Kolom 3: XP */}

                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-white font-bold">

                    {formatNumber(member.expLevel)}

                  </td>

                  {/* Kolom 4: Donasi Diberikan (D+) */}

                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-green font-bold">

                    {formatNumber(member.donations)}

                  </td>

                  {/* Kolom 5: Donasi Diterima (D-) */}

                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-coc-red font-bold">

                    {formatNumber(member.donationsReceived)}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

};