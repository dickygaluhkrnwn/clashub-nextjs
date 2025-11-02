import React, { useState } from 'react';
// REFAKTOR: Impor tipe yang relevan
import { ManagedClan, CocWarLog, CocRaidLog, CocCurrentWar } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import {
  RefreshCwIcon,
  ClockIcon,
  InfoIcon,
  SwordsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CoinsIcon,
  TrophyIcon,
  HomeIcon,
  StarIcon,
  ShieldIcon,
  UserIcon,
  ArrowRightIcon,
} from '@/app/components/icons';
import TopPerformersCard from './TopPerformersCard';
import { formatNumber } from '@/lib/th-utils';
// REFAKTOR: Impor SWR hooks
import {
  useManagedClanBasic,
  useManagedClanWar,
  useManagedClanRaid,
  useManagedClanWarLog,
  useManagedClanCWL,
} from '@/lib/hooks/useManagedClan';

// REFAKTOR: Perbarui Props
interface SummaryTabContentProps {
  clan: ManagedClan;
  isManager: boolean;
  // PERBAIKAN: Tambahkan 'onAction' yang kemarin saya hapus
  onAction: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  // HAPUS: cache, isSyncing, onSync, onRefresh
}

// ======================================================================================================
// Helper Component: War Status Display
// ======================================================================================================

// [PERBAIKAN TIPE]
// Tipe 'war' diubah dari CocWarLog menjadi CocCurrentWar agar cocok dengan hook
interface WarStatusProps {
  war: CocCurrentWar; // Menggunakan tipe dari hook
  clanTag: string;
}

const WarStatusDisplay: React.FC<WarStatusProps> = ({ war, clanTag }) => {
  // Menentukan klan kita dan lawan
  const ourClan = war.clan.tag === clanTag ? war.clan : war.opponent;
  const enemyClan = war.opponent.tag !== clanTag ? war.opponent : war.clan;

  if (!ourClan || !enemyClan || war.state === 'notInWar') {
    return (
      <p className="text-gray-400 mt-3">
        Saat ini klan tidak sedang dalam War Aktif.
      </p>
    );
  }

  const attacksUsed = ourClan.attacks || 0;
  // Gunakan teamSize, fallback ke jumlah members
  const totalMembers = war.teamSize || ourClan.members?.length || 0;
  // Gunakan attacksPerMember jika ada (untuk CWL), fallback ke 2 (Classic War)
  const totalAttacks = totalMembers * (war.attacksPerMember || 2);

  // War status text and class
  let stateText = '';
  let stateClass = '';

  switch (war.state) {
    case 'inWar':
      stateText = 'SEDANG BERJALAN';
      stateClass = 'text-coc-red';
      break;
    case 'preparation':
      stateText = 'PERSIAPAN';
      stateClass = 'text-coc-blue';
      break;
    case 'warEnded':
      // Tentukan result berdasarkan bintang jika 'result' tidak ada (fallback)
      let result = war.result;
      if (!result) {
        if (ourClan.stars > enemyClan.stars) result = 'win';
        else if (ourClan.stars < enemyClan.stars) result = 'lose';
        else result = 'tie';
      }
      stateText = `SELESAI (${result?.toUpperCase() || 'N/A'})`;
      stateClass =
        result === 'win'
          ? 'text-coc-green'
          : result === 'lose'
          ? 'text-coc-red'
          : 'text-coc-gold';
      break;
    default:
      stateText = 'N/A';
      stateClass = 'text-gray-400';
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-coc-gold/30 pb-2">
        <h4 className="text-lg font-clash text-white flex items-center gap-2">
          <SwordsIcon className={`h-5 w-5 ${stateClass}`} /> {enemyClan.name}
        </h4>
        <span className={`text-sm font-semibold ${stateClass} uppercase`}>
          {stateText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        {/* Klan Kita */}
        <div className="bg-coc-stone/20 p-3 rounded-lg border border-coc-gold/30">
          <p className="text-md font-clash text-coc-green">{ourClan.name}</p>
          <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
            <StarIcon className="h-5 w-5 text-coc-gold" /> {ourClan.stars}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {ourClan.destructionPercentage.toFixed(2)}% | {attacksUsed}/
            {totalAttacks} Serangan
          </p>
        </div>

        {/* Klan Lawan */}
        <div className="bg-coc-stone/20 p-3 rounded-lg border border-coc-red/30">
          <p className="text-md font-clash text-coc-red">{enemyClan.name}</p>
          <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
            <StarIcon className="h-5 w-5 text-coc-gold" /> {enemyClan.stars}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {enemyClan.destructionPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Navigasi ini seharusnya diubah untuk memanggil setActiveTab,
          tapi untuk saat ini kita biarkan link hardcode.
       */}
      <Button
        href="/clan/manage?tab=active-war"
        variant="secondary"
        size="sm"
        className="w-full mt-2"
      >
        Lihat Detail Perang <ArrowRightIcon className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

// ======================================================================================================
// Helper Component: Raid Summary Display (Tidak Berubah)
// ======================================================================================================

interface RaidSummaryProps {
  raid: CocRaidLog;
}

const RaidSummaryDisplay: React.FC<RaidSummaryProps> = ({ raid }) => {
  // Format tanggal
  const startDate = new Date(raid.startTime).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  const endDate = new Date(raid.endTime).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="card-stone p-6 space-y-4 border border-coc-gold/30">
      <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
        <HomeIcon className="h-5 w-5 text-coc-blue" /> Ringkasan Raid Terbaru
      </h3>

      <p className="text-sm text-gray-300 font-sans">
        Periode: <span className="font-semibold">{startDate} - {endDate}</span>
      </p>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-coc-stone/20 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Total Loot Capital</p>
          <p className="text-xl font-bold text-coc-gold mt-1">
            {formatNumber(raid.capitalTotalLoot)}
          </p>
        </div>
        <div className="bg-coc-stone/20 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Medali Raid</p>
          <p className="text-xl font-bold text-coc-gold mt-1">
            {formatNumber(raid.offensiveReward || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-coc-stone/20 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Serangan Total</p>
          <p className="text-xl font-bold text-white mt-1">{raid.totalAttacks}</p>
        </div>
        <div className="bg-coc-stone/20 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Distrik Hancur</p>
          <p className="text-xl font-bold text-white mt-1">
            {raid.enemyDistrictsDestroyed || 0}
          </p>
        </div>
      </div>

      <Button
        href="/clan/manage?tab=raid"
        variant="secondary"
        size="sm"
        className="w-full mt-2"
      >
        Lihat Riwayat Raid <ArrowRightIcon className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

// ======================================================================================================
// Main Component: SummaryTabContent
// ======================================================================================================

const SummaryTabContent: React.FC<SummaryTabContentProps> = ({
  clan,
  isManager,
  onAction,
}) => {
  // REFAKTOR: Panggil SWR hooks
  // PERBAIKAN: Destructuring 'mutateBasic', 'mutateWar', 'mutateRaid'
  const {
    clanCache, // Tipe ClanApiCache
    isLoading: isLoadingBasic,
    mutateBasic, // Ini adalah fungsi mutate
  } = useManagedClanBasic(clan.id);
  const {
    warData, // Tipe CocCurrentWar
    isLoading: isLoadingWar,
    mutateWar, // Ini adalah fungsi mutate
  } = useManagedClanWar(clan.id);
  const {
    raidLogData, // Tipe CocRaidLog[]
    isLoading: isLoadingRaid,
    mutateRaid, // Ini adalah fungsi mutate
  } = useManagedClanRaid(clan.id);

  // Kita juga butuh mutator untuk sync manual
  // PERBAIKAN: Destructuring 'mutateWarLog' dan 'mutateCWL'
  const { mutateWarLog } = useManagedClanWarLog(clan.id);
  const { mutateCWL } = useManagedClanCWL(clan.id);

  // REFAKTOR: State sinkronisasi sekarang lokal
  const [isSyncing, setIsSyncing] = useState(false);

  // REFAKTOR: Fungsi Refresh UI (untuk Anggota)
  const handleRefreshUI = () => {
    onAction('Memuat ulang data cache...', 'info');
    // Mutate semua data yang relevan di tab ini
    mutateBasic();
    mutateWar();
    mutateRaid();
    // Kita juga refresh data lain jika-jika diperlukan di tab lain
    mutateWarLog();
    mutateCWL();
  };

  // REFAKTOR: Fungsi Sync Manual (untuk Manager)
  const handleSyncManual = async () => {
    if (!isManager) {
      onAction(
        'Hanya Leader/Co-Leader yang dapat melakukan sinkronisasi.',
        'warning'
      );
      return;
    }
    setIsSyncing(true);
    onAction(`Memulai sinkronisasi granular untuk ${clan.name}...`, 'info');

    try {
      // 1. Trigger semua API sinkronisasi granular
      // Kita tidak peduli responsnya, hanya menunggu selesai
      await fetch(`/api/clan/manage/${clan.id}/sync/basic`);
      await fetch(`/api/clan/manage/${clan.id}/sync/war`);
      await fetch(`/api/clan/manage/${clan.id}/sync/raid`);
      await fetch(`/api/clan/manage/${clan.id}/sync/warlog`);
      await fetch(`/api/clan/manage/${clan.id}/sync/cwl`);

      // 2. Setelah backend sync, panggil mutate SWR untuk mengambil data baru
      onAction(
        'Sinkronisasi backend selesai. Memuat data baru ke UI...',
        'info'
      );
      await Promise.all([
        mutateBasic(),
        mutateWar(),
        mutateRaid(),
        mutateWarLog(),
        mutateCWL(),
      ]);

      onAction('Data berhasil disinkronisasi!', 'success');
    } catch (err) {
      const errorMessage =
        (err as Error).message || 'Terjadi kesalahan saat sinkronisasi.';
      onAction(errorMessage, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // REFAKTOR: Tampilkan loading state
  const isLoading = isLoadingBasic || isLoadingWar || isLoadingRaid;
  if (isLoading && !isSyncing) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <RefreshCwIcon className="h-10 w-10 text-coc-gold animate-spin" />
      </div>
    );
  }

  // REFAKTOR: Ambil data dari SWR hooks
  // PERBAIKAN: Ganti 'clanData' menjadi 'clanCache'
  const lastSyncedDate = clanCache?.lastUpdated
    ? new Date(clanCache.lastUpdated)
    : new Date(0);
  const isCacheStale =
    !clanCache || lastSyncedDate.getTime() < Date.now() - 3600000;
  const lastSyncTime = clanCache?.lastUpdated
    ? new Date(clanCache.lastUpdated).toLocaleString('id-ID')
    : 'N/A';

  const topPerformers = clanCache?.topPerformers;
  const currentWar = warData; // Langsung dari useManagedClanWar
  const currentRaid = raidLogData?.[0]; // Ambil raid terbaru dari array

  const isWarActive =
    currentWar &&
    currentWar.state !== 'notInWar' &&
    currentWar.state !== 'warEnded';
  const isRaidDataAvailable = !!currentRaid && currentRaid.state === 'ended';

  // Konstanta
  const PROMOTION_LIMIT = 3;
  const DEMOTION_LIMIT = 3;
  const promotions = topPerformers?.promotions || [];
  const demotions = topPerformers?.demotions || [];
  const topDonatorData = topPerformers?.topDonator;
  const topRaidLooterData = topPerformers?.topRaidLooter;
  const donatorValue = (topDonatorData?.value as number) || 0;
  const looterValue = (topRaidLooterData?.value as number) || 0;

  return (
    <div className="space-y-8">
      {/* Bagian 1: Kontrol Sinkronisasi, Info Internal & War/Raid Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Sinkronisasi & Info Internal */}
        <div className="card-stone p-6 space-y-4 border border-coc-gold/30">
          <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
            <ClockIcon className="h-5 w-5" /> Kontrol Sinkronisasi
          </h3>
          <p className="text-sm text-gray-300 font-sans">
            Sinkronisasi menarik data Anggota, War Log, CWL Archive, dan Raid
            Log terbaru. Data terakhir diperbarui: {lastSyncTime}.
          </p>
          {isManager ? ( // Tombol untuk Manager
            <Button
              onClick={handleSyncManual} // REFAKTOR: Panggil fungsi lokal
              variant={isCacheStale ? 'primary' : 'secondary'}
              disabled={isSyncing}
              className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
            >
              <RefreshCwIcon
                className={`inline h-5 w-5 mr-2 ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              />
              {isSyncing
                ? 'Sedang Sinkronisasi...'
                : isCacheStale
                ? 'Sinkronisasi Manual (Data Basi)'
                : 'Sinkronisasi Manual Sekarang'}
            </Button>
          ) : (
            // Tombol untuk Anggota
            <Button
              onClick={handleRefreshUI} // REFAKTOR: Panggil fungsi lokal
              variant="tertiary"
              disabled={isSyncing}
              className={`w-full ${isSyncing ? 'animate-pulse' : ''}`}
            >
              <RefreshCwIcon
                className={`inline h-5 w-5 mr-2 ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              />
              Muat Ulang Data
            </Button>
          )}
          <p className="text-sm text-gray-400 pt-2">
            <span className="font-bold">ID Internal:</span> {clan.id}
          </p>
          <p className="text-sm text-gray-400">
            <span className="font-bold">UID Owner:</span> {clan.ownerUid}
          </p>
        </div>

        {/* Kolom 2: War Aktif */}
        <div className="card-stone p-6 space-y-4 border border-coc-gold/30">
          <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
            <SwordsIcon className="h-5 w-5 text-coc-red" /> War Aktif
          </h3>
          {/* REFAKTOR: Gunakan 'currentWar' dari SWR */}
          {isWarActive && currentWar ? (
            <WarStatusDisplay war={currentWar} clanTag={clan.tag} />
          ) : (
            <div className="text-center p-4 bg-coc-stone/20 rounded-lg">
              <ShieldIcon className="h-8 w-8 text-coc-green/50 mx-auto" />
              <p className="text-white font-clash mt-2">Klan Sedang Aman</p>
              <p className="text-xs text-gray-400">
                Tidak ada War Klasik atau CWL aktif.
              </p>
            </div>
          )}
        </div>

        {/* Kolom 3: Raid Terbaru */}
        {/* REFAKTOR: Gunakan 'currentRaid' dari SWR */}
        {isRaidDataAvailable && currentRaid ? (
          <RaidSummaryDisplay raid={currentRaid} />
        ) : (
          <div className="card-stone p-6 space-y-4 border border-coc-gold/30 flex flex-col justify-center items-center">
            <HomeIcon className="h-8 w-8 text-coc-blue/50" />
            <h3 className="text-xl font-clash text-coc-gold-dark">
              Raid Capital
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Data Raid Capital terbaru belum tersedia, atau sedang berlangsung.
            </p>
            <Button href="/clan/manage?tab=raid" variant="tertiary" size="sm">
              Lihat Arsip Raid
            </Button>
          </div>
        )}
      </div>

      {/* Bagian 2: Top Performers (Berupa kartu) */}
      <h2 className="text-2xl font-clash text-white border-b border-coc-gold-dark/50 pb-2 flex items-center gap-3">
        <TrophyIcon className="h-6 w-6 text-coc-gold" /> Performa Terbaik (Dari
        Agregator)
      </h2>

      {/* REFAKTOR: Tampilkan loading atau data untuk Top Performers */}
      {isLoadingBasic ? (
        <p className="text-sm text-gray-400">Memuat data performa...</p>
      ) : topPerformers ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Kartu 1: Promosi */}
          <TopPerformersCard
            title="Kandidat Promosi"
            icon={<ArrowUpIcon className="h-6 w-6 text-coc-green" />}
            className="bg-coc-green/10 border border-coc-green/30 text-coc-green"
            value={promotions.length}
            description={`Member yang siap dipromosikan (Min ${PROMOTION_LIMIT} Sukses)`}
            isPlayerList={true}
            players={promotions}
          />

          {/* Kartu 2: Demosi */}
          <TopPerformersCard
            title="Risiko Demosi"
            icon={<ArrowDownIcon className="h-6 w-6 text-coc-red" />}
            className="bg-coc-red/10 border border-coc-red/30 text-coc-red"
            value={demotions.length}
            description={`Elder yang berisiko didemosi (Min ${DEMOTION_LIMIT} Penalti)`}
            isPlayerList={true}
            players={demotions}
          />

          {/* Kartu 3: Top Donator */}
          <TopPerformersCard
            title="Top Donator"
            icon={<CoinsIcon className="h-6 w-6 text-coc-gold" />}
            className="bg-coc-gold/10 border border-coc-gold/30 text-coc-gold"
            value={topDonatorData?.name || 'N/A'}
            description={`Total Donasi: ${formatNumber(donatorValue)}`}
            isPlayerList={false}
            players={topDonatorData ? [topDonatorData] : []}
          />

          {/* Kartu 4: Top Raid Looter */}
          <TopPerformersCard
            title="Top Raid Looter"
            icon={<HomeIcon className="h-6 w-6 text-coc-blue" />}
            className="bg-coc-blue/10 border border-coc-blue/30 text-coc-blue"
            value={topRaidLooterData?.name || 'N/A'}
            description={`Total Loot Raid: ${formatNumber(looterValue)}`}
            isPlayerList={false}
            players={topRaidLooterData ? [topRaidLooterData] : []}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400">Data performa tidak tersedia.</p>
      )}
    </div>
  );
};

export default SummaryTabContent;