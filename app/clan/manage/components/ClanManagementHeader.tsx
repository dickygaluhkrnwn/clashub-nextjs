import React from 'react';
// REFAKTOR: Hapus impor 'ClanApiCache'
import { ManagedClan, UserProfile } from '@/lib/types';
import { CogsIcon, ClockIcon } from '@/app/components/icons';

interface ClanManagementHeaderProps {
  clan: ManagedClan;
  // REFAKTOR: Hapus 'cache' dari props
  // cache: ClanApiCache | null;
  profile: UserProfile;
}

/**
 * Komponen untuk menampilkan header utama halaman Manajemen Klan.
 * Berisi informasi klan dasar dan status sinkronisasi.
 */
// REFAKTOR: Hapus 'cache' dari props function
const ClanManagementHeader: React.FC<ClanManagementHeaderProps> = ({
  clan,
  profile,
}) => {
  // REFAKTOR: Logika status sinkronisasi sekarang menggunakan 'clan.lastSynced'
  // (diasumsikan 'clan.lastSynced' selalu ada)
  const lastSyncedDate =
    clan.lastSynced instanceof Date
      ? clan.lastSynced
      : new Date(clan.lastSynced);

  // Asumsi cache stale jika lebih dari 1 jam (3600000 ms)
  const isCacheStale =
    !clan.lastSynced || lastSyncedDate.getTime() < Date.now() - 3600000;
  const syncStatusClass = isCacheStale ? 'text-coc-red' : 'text-coc-green';
  const syncMessage = isCacheStale ? 'Perlu Sinkronisasi' : 'Data Fresh';

  // REFAKTOR: Gunakan 'clan.lastSynced'
  const lastSyncTime = clan.lastSynced
    ? new Date(clan.lastSynced).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      })
    : 'Belum Pernah';

  return (
    <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-4">
        <CogsIcon className="h-10 w-10 text-coc-gold flex-shrink-0" />
        <div>
          <h1 className="text-3xl font-clash text-white">
            Dashboard Manajemen
          </h1>
          <p className="text-sm text-gray-400 font-sans">
            Kelola **{clan.name}** ({clan.tag}) | Role Clashub Anda:{' '}
            **{profile.role}**
          </p>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex flex-col items-end">
        <div
          className={`flex items-center gap-2 font-bold text-sm ${syncStatusClass}`}
        >
          <ClockIcon className="h-4 w-4" />
          {syncMessage}
        </div>
        <p className="text-xs text-gray-500">
          Terakhir disinkronisasi: {lastSyncTime}
        </p>
      </div>
    </div>
  );
};

export default ClanManagementHeader;