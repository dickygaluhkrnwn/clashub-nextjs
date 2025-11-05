import React, { useState } from 'react';
import {
  ManagedClan,
  ClanApiCache,
  UserProfile,
  ClanRole,
  ManagerRole,
  StandardMemberRole, // Import tipe baru
} from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  ShieldIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  UsersIcon, // <-- [BARU] Ditambahkan untuk tombol sync
} from '@/app/components/icons';
import { getThImage, formatNumber } from '@/lib/th-utils';
import Image from 'next/image';
import { NotificationProps } from '@/app/components/ui/Notification';
// --- [REFAKTOR] Impor SWR Hooks ---
import {
  useManagedClanCache, // <-- [PERBAIKAN 1] Ganti nama hook
  useManagedClanMembers,
} from '@/lib/hooks/useManagedClan';

// Definisikan tipe gabungan untuk Roster
type RosterMember = ClanApiCache['members'][number] & {
  uid?: string;
  clashubRole: ManagerRole | StandardMemberRole; // Gunakan tipe yang lebih spesifik
  isVerified: boolean;
};

// --- [REFAKTOR] Props Disederhanakan ---
interface MemberTabContentProps {
  clan: ManagedClan;
  // HAPUS: cache: ClanApiCache | null;
  // HAPUS: members: UserProfile[];
  userProfile: UserProfile; // Profil Leader/Co-Leader yang sedang login
  onAction: (message: string, type: NotificationProps['type']) => void;
  // HAPUS: onRefresh: () => void;
  isManager: boolean; // Prop isManager untuk mengontrol fitur manajemen
}

/**
 * Komponen konten utama untuk Tab Anggota (Member Roster).
 * Menampilkan data partisipasi agregat, dan kontrol manajemen peran/kick.
 */
const MemberTabContent: React.FC<MemberTabContentProps> = ({
  clan,
  userProfile,
  onAction,
  isManager,
}) => {
  // --- [REFAKTOR] Panggil SWR Hooks ---
  // [PERBAIKAN 1] Ganti 'useManagedClanBasic' ke 'useManagedClanCache'
  // dan rename 'mutateCache' ke 'mutateBasic'
  const {
    clanCache,
    isLoading: isLoadingBasic,
    isError: isErrorBasic,
    mutateCache: mutateBasic, // <-- [FIX] Ambil 'mutateCache', rename ke 'mutateBasic'
  } = useManagedClanCache(clan.id); // <-- [FIX] Ganti nama hook

  // Hook ini sudah benar (mengambil 'mutateMembers' dan menggunakannya)
  const {
    membersData, // Ini adalah UserProfile[]
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    mutateMembers,
  } = useManagedClanMembers(clan.id);

  // --- [REFAKTOR] Ambil data dari SWR hooks ---
  // (Ganti 'cache' dan 'members' dari props)
  const isLeader = userProfile.role === 'Leader';
  const rosterMembers = clanCache?.members || [];
  const members = membersData || []; // <-- Ini adalah UserProfile[] dari API baru

  // State untuk mengontrol dropdown role yang terbuka
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);
  // --- [BARU: TAHAP 1.2] State untuk loading tombol sync anggota ---
  const [isSyncingMembers, setIsSyncingMembers] = useState(false);

  /**
   * @function handleSyncMembers
   * (TAHAP 1.2) Memanggil API untuk rekonsiliasi anggota.
   */
  const handleSyncMembers = async () => {
    if (!isManager) {
      onAction('Akses Ditolak.', 'error');
      return;
    }

    setIsSyncingMembers(true);
    onAction('Mensinkronkan anggota dengan server CoC...', 'info');

    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/sync/members`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal sinkronisasi anggota.');
      }

      const summary = result.summary;
      onAction(
        `Sinkronisasi sukses: ${summary.joiners} bergabung, ${summary.leavers} keluar, ${summary.roleChanges} berubah role.`,
        'success'
      );

      // Refresh data SWR
      mutateBasic();
      mutateMembers();
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsSyncingMembers(false);
    }
  };

  /**
   * @function getParticipationStatusClass
   * (Tidak berubah)
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
   * @function mapClashubRoleToCocRole
   * (Tidak berubah)
   */
  const mapClashubRoleToCocRole = (
    clashubRole: UserProfile['role']
  ): ClanRole => {
    // Menggunakan tipe ManagerRole/StandardMemberRole
    switch (clashubRole) {
      case 'Leader':
        return ClanRole.LEADER;
      case 'Co-Leader':
        return ClanRole.CO_LEADER;
      case 'Elder':
        return ClanRole.ELDER;
      case 'Member':
      case 'Free Agent':
      default:
        return ClanRole.MEMBER;
    }
  };

  /**
   * @function handleRoleChange
   * Mengubah peran anggota (Memanggil API PUT).
   */
  const handleRoleChange = async (
    memberUid: string,
    newClashubRole: UserProfile['role']
  ) => {
    if (!isManager) {
      onAction(
        'Akses Ditolak: Anda tidak memiliki izin untuk mengubah peran.',
        'error'
      );
      return;
    }

    // REFAKTOR: Gunakan 'members' dari state SWR
    const targetProfile = members.find((m) => m.uid === memberUid);

    if (!targetProfile) {
      onAction('Gagal: Profil anggota tidak ditemukan.', 'error');
      return;
    }

    const oldRoleCoC = mapClashubRoleToCocRole(targetProfile.role);
    const newRoleCoC = mapClashubRoleToCocRole(newClashubRole);

    setOpenRoleDropdown(null); // Tutup dropdown
    onAction(
      `Mengubah peran ${targetProfile.displayName} ke ${newClashubRole}...`,
      'info'
    );

    try {
      const response = await fetch(
        `/api/clan/manage/member/${memberUid}/role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newClashubRole,
            clanId: clan.id,
            oldRoleCoC, // Untuk logging di backend
            newRoleCoC, // Untuk logging di backend
          }),
        }
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Gagal mengubah peran.');

      onAction(result.message, 'success');
      // REFAKTOR: Ganti onRefresh() dengan mutate SWR
      mutateBasic(); // Refresh data CoC (role in-game mungkin berubah)
      mutateMembers(); // Refresh data UserProfile (clashubRole berubah)
    } catch (err) {
      onAction((err as Error).message, 'error');
    }
  };

  /**
   * @function handleKick
   * Mengeluarkan anggota dari klan Clashub (Memanggil API DELETE).
   */
  const handleKick = async (memberUid: string) => {
    if (!isManager) {
      onAction(
        'Akses Ditolak: Anda tidak memiliki izin untuk mengeluarkan anggota.',
        'error'
      );
      return;
    }

    // REFAKTOR: Gunakan 'members' dari state SWR
    const targetProfile = members.find((m) => m.uid === memberUid);
    if (!targetProfile) return;

    onAction(
      `[KONFIRMASI MANUAL] Meminta server mengeluarkan ${targetProfile.displayName}...`,
      'info'
    );

    try {
      const response = await fetch(`/api/clan/manage/member/${memberUid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: clan.id }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Gagal mengeluarkan anggota.');

      onAction(`Berhasil mengeluarkan ${targetProfile.displayName}.`, 'success');
      // REFAKTOR: Ganti onRefresh() dengan mutate SWR
      mutateBasic(); // Refresh data CoC (anggota hilang)
      mutateMembers(); // Refresh data UserProfile (anggota hilang)
    } catch (err) {
      onAction((err as Error).message, 'error');
    }
  };

  // List of roles (Tidak berubah)
  const availableClashubRoles: UserProfile['role'][] = isLeader
    ? ['Co-Leader', 'Elder', 'Member'] // Leader bisa set Co-Leader, Elder, Member
    : ['Elder', 'Member']; // Co-Leader hanya bisa set Elder dan Member

  // --- [REFAKTOR] Loading dan Error State ---
  const isLoading = isLoadingBasic || isLoadingMembers;
  const isError = isErrorBasic || isErrorMembers;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin" />
        <p className="ml-3 text-lg font-clash text-gray-300">
          Memuat Roster Anggota...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-coc-red/10 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
        <p className="text-lg font-clash text-coc-red">
          Gagal Memuat Data Anggota
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          {/* PERBAIKAN: Tampilkan pesan error yang benar */}
          {isErrorBasic?.message || isErrorMembers?.message || 'Terjadi kesalahan'}
        </p>
      </div>
    );
  }

  if (!clanCache?.members || clanCache.members.length === 0) {
    return (
      <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
        <AlertTriangleIcon className="h-12 w-12 text-coc-gold/50 mb-3" />
        <p className="text-lg font-clash text-white">
          Tidak Ada Data Anggota di Cache
        </p>
        <p className="text-sm text-gray-400 font-sans mt-1">
          Silakan lakukan **Sinkronisasi Manual** di Tab Ringkasan untuk memuat
          data partisipasi klan.
        </p>
      </div>
    );
  }

  // --- [REFAKTOR] Logika Penggabungan Data ---
  // (Logika ini tidak berubah, hanya sumber datanya yang berubah ke state SWR)
  const combinedRoster: RosterMember[] = rosterMembers
    .map((cacheMember: ClanApiCache['members'][number]) => { // <-- [PERBAIKAN 2] Tipe eksplisit
      const profileData = members.find((p) => p.playerTag === cacheMember.tag);

      return {
        ...cacheMember,
        uid: profileData?.uid,
        clashubRole: profileData?.role || 'Free Agent',
        isVerified: profileData?.isVerified || false,
        warSuccessCount: cacheMember.warSuccessCount,
        warFailCount: cacheMember.warFailCount,
        cwlSuccessCount: cacheMember.cwlSuccessCount,
        cwlFailCount: cacheMember.cwlFailCount,
        participationStatus: cacheMember.participationStatus,
        statusKeterangan: cacheMember.statusKeterangan || 'N/A',
        expLevel: cacheMember.expLevel,
        donations: cacheMember.donations,
        donationsReceived: cacheMember.donationsReceived,
      } as RosterMember;
    })
    .sort((a: RosterMember, b: RosterMember) => { // <-- [PERBAIKAN 3] Tipe eksplisit
      // Urutkan berdasarkan Town Hall Level (descending) lalu Clan Rank (ascending)
      if (b.townHallLevel !== a.townHallLevel) {
        return b.townHallLevel - a.townHallLevel;
      }
      return a.clanRank - b.clanRank;
    });

  // --- [RENDER TABEL] (Tidak ada perubahan signifikan di JSX) ---
  return (
    // [EDIT] Pindahkan min-h ke div terluar
    <div className="min-h-[400px]">
      {/* --- [BARU: TAHAP 1.2] Tombol Sinkronisasi Anggota --- */}
      {isManager && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleSyncMembers}
            disabled={isSyncingMembers || isLoading} // Disable jika sedang sync ATAU data SWR sedang loading
            variant="secondary"
            className="bg-coc-blue/20 text-coc-blue-light hover:bg-coc-blue/30 border border-coc-blue/30"
          >
            {isSyncingMembers ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UsersIcon className="h-4 w-4 mr-2" />
            )}
            {isSyncingMembers
              ? 'Mensinkronkan...'
              : 'Sinkronkan Anggota (CoC)'}
          </Button>
        </div>
      )}
      {/* --- [AKHIR BARU] --- */}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-coc-gold-dark/20 text-xs">
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
          <tbody className="divide-y divide-coc-gold-dark/10">
            {combinedRoster.map((member) => {
              // --- LOGIKA OTORISASI BARU ---
              const canModify =
                member.clashubRole !== 'Leader' && member.uid !== userProfile.uid;
              // Co-Leader tidak bisa mengubah Co-Leader lain
              const isCoLeaderModifyingCoLeader =
                userProfile.role === 'Co-Leader' &&
                member.clashubRole === 'Co-Leader';

              const isActionDisabled =
                !isManager ||
                !canModify ||
                isCoLeaderModifyingCoLeader ||
                !member.uid;

              const thImageUrl = getThImage(member.townHallLevel);

              return (
                <tr
                  key={member.tag}
                  className="hover:bg-coc-stone/20 transition-colors"
                >
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
                    <span className="text-coc-green">
                      S-{member.warSuccessCount}
                    </span>{' '}
                    / <span className="text-coc-red">F-{member.warFailCount}</span>
                  </td>

                  {/* Kolom 5: Partisipasi CWL */}
                  <td className="px-3 py-3 text-center text-gray-300 text-xs font-semibold">
                    <span className="text-coc-green">
                      S-{member.cwlSuccessCount}
                    </span>{' '}
                    / <span className="text-coc-red">F-{member.cwlFailCount}</span>
                  </td>

                  {/* Kolom 6: Status Partisipasi */}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <div
                      className={`inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-xs border ${getParticipationStatusClass(
                        member.participationStatus
                      )}`}
                    >
                      <span className="font-bold">
                        {member.participationStatus}
                      </span>
                      <span
                        className="text-[10px] opacity-80 mt-0.5 max-w-[100px] truncate"
                        title={member.statusKeterangan || 'N/A'}
                      >
                        {member.statusKeterangan}
                      </span>
                    </div>
                  </td>

                  {/* Kolom 7: Role Clashub / Aksi (Gaya Kolom Disempurnakan) */}
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
                                    openRoleDropdown === member.uid
                                      ? null
                                      : member.uid!
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
                                          handleRoleChange(member.uid!, role);
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
                              onClick={() => member.uid && handleKick(member.uid)}
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTabContent;