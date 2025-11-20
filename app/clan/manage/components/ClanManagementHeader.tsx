'use client';

import React from 'react';
import { ManagedClan, UserProfile } from '@/lib/types';
import { CogsIcon, ClockIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface ClanManagementHeaderProps {
  clan: ManagedClan;
  profile: UserProfile;
}

/**
 * Komponen untuk menampilkan header utama halaman Manajemen Klan.
 * Berisi informasi klan dasar dan status sinkronisasi.
 */
const ClanManagementHeader: React.FC<ClanManagementHeaderProps> = ({
  clan,
  profile,
}) => {
  const { t } = useLanguage(); // [BARU]
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
  
  // [TERJEMAHAN]
  const syncMessage = isCacheStale ? t.clanManage.syncNeeded : t.clanManage.dataFresh;

  // REFAKTOR: Gunakan 'clan.lastSynced'
  const lastSyncTime = clan.lastSynced
    ? new Date(clan.lastSynced).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      })
    : t.clanManage.never; // [TERJEMAHAN]

  return (
    <div className="card-stone p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-4">
        <CogsIcon className="h-10 w-10 text-coc-gold flex-shrink-0" />
        <div>
          <h1 className="text-3xl font-clash text-white">
            {t.clanManage.dashboardTitle} {/* [TERJEMAHAN] */}
          </h1>
          <p className="text-sm text-gray-400 font-sans">
            {t.clanManage.manageLabel} **{clan.name}** ({clan.tag}) | {t.clanManage.roleLabel}:{' '}
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
          {t.clanManage.lastSynced}: {lastSyncTime} {/* [TERJEMAHAN] */}
        </p>
      </div>
    </div>
  );
};

export default ClanManagementHeader;