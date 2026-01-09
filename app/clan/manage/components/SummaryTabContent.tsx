'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ManagedClan, CocCurrentWar, CocRaidLog } from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import {
  RefreshCwIcon,
  ClockIcon,
  SwordsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CoinsIcon,
  TrophyIcon,
  HomeIcon,
  StarIcon,
  ShieldIcon,
  ArrowRightIcon,
  AlertTriangleIcon
} from '@/app/components/icons';
import TopPerformersCard from './TopPerformersCard';
import { formatNumber } from '@/lib/th-utils';
import {
  useManagedClanCache,
  useManagedClanWar,
  useManagedClanRaid,
  useManagedClanWarLog,
  useManagedClanCWL,
} from '@/lib/hooks/useManagedClan';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface SummaryTabContentProps {
  clan: ManagedClan;
  isManager: boolean;
  onAction: (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info'
  ) => void;
}

// ======================================================================================================
// Helper Component: War Status Display (Glass Style)
// ======================================================================================================

interface WarStatusProps {
  // [FIX] Allow null or undefined to prevent crashes on new clans
  war: CocCurrentWar | null | undefined;
  clanTag: string;
  t: any;
}

const WarStatusDisplay: React.FC<WarStatusProps> = ({ war, clanTag, t }) => {
  // [FIX] Defensive Check: Jika war data kosong atau strukturnya tidak lengkap
  if (!war || !war.clan || !war.opponent) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center p-4">
        <ShieldIcon className="h-10 w-10 text-gray-600 mb-3 opacity-50" />
        <p className="text-gray-400 font-medium">{t.clanManage.warNotInActive}</p>
      </div>
    );
  }

  // Cek state 'notInWar' secara eksplisit
  if (war.state === 'notInWar') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center p-4">
        <ShieldIcon className="h-10 w-10 text-gray-600 mb-3 opacity-50" />
        <p className="text-gray-400 font-medium">{t.clanManage.warNotInActive}</p>
      </div>
    );
  }

  const ourClan = war.clan.tag === clanTag ? war.clan : war.opponent;
  const enemyClan = war.opponent.tag !== clanTag ? war.opponent : war.clan;

  // Defensive check lagi untuk memastikan properti clan valid
  if (!ourClan || !enemyClan) {
     return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center p-4">
        <AlertTriangleIcon className="h-10 w-10 text-yellow-600 mb-3 opacity-50" />
        <p className="text-gray-400 font-medium">Data perang tidak lengkap.</p>
      </div>
    );
  }

  const attacksUsed = ourClan.attacks || 0;
  const totalMembers = war.teamSize || ourClan.members?.length || 0;
  const totalAttacks = totalMembers * (war.attacksPerMember || 1);
  const progress = totalAttacks > 0 ? (attacksUsed / totalAttacks) * 100 : 0;

  let stateText = '';
  let stateColor = 'text-gray-400';
  let badgeColor = 'bg-gray-500/20 text-gray-300 border-gray-500/30';

  switch (war.state) {
    case 'inWar':
      stateText = t.clanManage.warInProgress;
      stateColor = 'text-coc-red';
      badgeColor = 'bg-coc-red/20 text-coc-red border-coc-red/30 animate-pulse';
      break;
    case 'preparation':
      stateText = t.clanManage.warPreparation;
      stateColor = 'text-coc-blue';
      badgeColor = 'bg-coc-blue/20 text-coc-blue border-coc-blue/30';
      break;
    case 'warEnded':
      let result = war.result;
      if (!result) {
        if (ourClan.stars > enemyClan.stars) result = 'win';
        else if (ourClan.stars < enemyClan.stars) result = 'lose';
        else result = 'tie';
      }
      
      let resultLabel = '';
      if (result === 'win') resultLabel = t.clanWar.resultWin;
      else if (result === 'lose') resultLabel = t.clanWar.resultLose;
      else resultLabel = t.clanWar.resultDraw;

      stateText = `${t.clanManage.warEnded} (${resultLabel})`;
      stateColor = result === 'win' ? 'text-coc-green' : result === 'lose' ? 'text-coc-red' : 'text-coc-gold';
      badgeColor = result === 'win' ? 'bg-coc-green/20 text-coc-green border-coc-green/30' : 'bg-white/10 text-gray-300 border-white/20';
      break;
  }

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className={`px-2 py-1 rounded text-xs font-bold border uppercase tracking-wider ${badgeColor}`}>
          {stateText}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {war.teamSize} vs {war.teamSize}
        </div>
      </div>

      {/* VS Section */}
      <div className="flex items-center justify-between gap-2 mb-4 relative">
        {/* Our Clan */}
        <div className="flex-1 text-center bg-black/20 rounded-lg p-2 border border-coc-green/20 shadow-[0_0_15px_rgba(74,222,128,0.05)]">
          <p className="text-xs text-coc-green font-bold truncate mb-1">{ourClan.name}</p>
          <div className="flex items-center justify-center gap-1">
            <StarIcon className="h-4 w-4 text-coc-gold" />
            <span className="text-lg font-clash text-white">{ourClan.stars}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            {ourClan.destructionPercentage.toFixed(1)}%
          </p>
        </div>

        <div className="font-clash text-white/20 text-lg px-1 italic">VS</div>

        {/* Enemy Clan */}
        <div className="flex-1 text-center bg-black/20 rounded-lg p-2 border border-coc-red/20 shadow-[0_0_15px_rgba(248,113,113,0.05)]">
          <p className="text-xs text-coc-red font-bold truncate mb-1">{enemyClan.name}</p>
          <div className="flex items-center justify-center gap-1">
            <StarIcon className="h-4 w-4 text-coc-gold" />
            <span className="text-lg font-clash text-white">{enemyClan.stars}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            {enemyClan.destructionPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Attack Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
          <span>{t.clanManage.attacks}</span>
          <span>{attacksUsed} / {totalAttacks}</span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div 
            className="bg-coc-gold h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#FFD700]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <Button
        href="/clan/manage?tab=active-war"
        variant="outline"
        size="sm"
        className="w-full text-xs hover:bg-white/5 border-white/10"
      >
        {t.clanManage.viewWarDetails} <ArrowRightIcon className="w-3 h-3 ml-2" />
      </Button>
    </div>
  );
};

// ======================================================================================================
// Helper Component: Raid Summary Display (Glass Style)
// ======================================================================================================

interface RaidSummaryProps {
  raid: CocRaidLog;
  t: any;
  locale: string;
}

const RaidSummaryDisplay: React.FC<RaidSummaryProps> = ({ raid, t, locale }) => {
  const startDate = new Date(raid.startTime).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const endDate = new Date(raid.endTime).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <CoinsIcon className="h-4 w-4 text-purple-400" />
          Raid Weekend
        </h4>
        <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {startDate} - {endDate}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0a0b]/40 p-3 rounded-xl border border-white/5 text-center group-hover:border-white/10 transition-colors">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t.clanManage.raidTotalLoot}</p>
          <p className="text-lg font-clash text-coc-gold drop-shadow-sm">{formatNumber(raid.capitalTotalLoot)}</p>
        </div>
        <div className="bg-[#0a0a0b]/40 p-3 rounded-xl border border-white/5 text-center group-hover:border-white/10 transition-colors">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t.clanManage.raidMedals}</p>
          <p className="text-lg font-clash text-purple-400 drop-shadow-sm">~{formatNumber(raid.offensiveReward || 0)}</p>
        </div>
        <div className="bg-[#0a0a0b]/40 p-3 rounded-xl border border-white/5 text-center group-hover:border-white/10 transition-colors">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t.clanManage.raidAttacks}</p>
          <p className="text-lg font-clash text-white">{raid.totalAttacks}</p>
        </div>
        <div className="bg-[#0a0a0b]/40 p-3 rounded-xl border border-white/5 text-center group-hover:border-white/10 transition-colors">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t.clanManage.raidDestroyed}</p>
          <p className="text-lg font-clash text-coc-red">{raid.enemyDistrictsDestroyed || 0}</p>
        </div>
      </div>

      <Button
        href="/clan/manage?tab=raid"
        variant="outline"
        size="sm"
        className="w-full text-xs hover:bg-white/5 border-white/10"
      >
        {t.clanManage.viewRaidHistory} <ArrowRightIcon className="w-3 h-3 ml-2" />
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
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const router = useRouter();

  const {
    clanCache,
    isLoading: isLoadingBasic,
    mutateCache: mutateBasic,
  } = useManagedClanCache(clan.id);
  const {
    warData,
    isLoading: isLoadingWar,
    mutateWar: mutateWar,
  } = useManagedClanWar(clan.id);
  const {
    currentRaid,
    isLoading: isLoadingRaid,
    mutateRaid: mutateRaid,
  } = useManagedClanRaid(clan.id);

  const { mutateWarLog } = useManagedClanWarLog(clan.id);
  const { mutateCWL } = useManagedClanCWL(clan.id);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefreshUI = () => {
    onAction(t.clanManage.msgReloading, 'info');
    Promise.all([mutateBasic(), mutateWar(), mutateRaid(), mutateWarLog(), mutateCWL()]).then(() => {
        router.refresh();
    });
  };

  // --- HANDLER SYNC MANUAL YANG DIOPTIMASI (SEQUENTIAL) ---
  const handleSyncManual = async () => {
    if (!isManager) {
      onAction(t.clanManage.msgOnlyManager, 'warning');
      return;
    }
    setIsSyncing(true);
    // Tampilkan notifikasi mulai
    onAction(t.clanManage.msgStartSync.replace('{name}', clan.name), 'info');

    try {
      // 1. Sync Basic Info & Members (Prioritas)
      const basicRes = await fetch(`/api/clan/manage/${clan.id}/sync/basic`, { method: 'POST' });
      if (!basicRes.ok) throw new Error('Failed to sync basic info');
      const basicData = await basicRes.json();

      // 2. Sync War Data (Current & Log) - Dijalankan berurutan agar aman
      const warRes = await fetch(`/api/clan/manage/${clan.id}/sync/war`, { method: 'POST' });
      if (!warRes.ok) throw new Error('Failed to sync war data');
      
      const logRes = await fetch(`/api/clan/manage/${clan.id}/sync/warlog`, { method: 'POST' });
      if (!logRes.ok) throw new Error('Failed to sync war log');

      // 3. Sync Raid & CWL (Sisanya) - Bisa paralel karena independen
      await Promise.all([
        fetch(`/api/clan/manage/${clan.id}/sync/raid`, { method: 'POST' }),
        fetch(`/api/clan/manage/${clan.id}/sync/cwl`, { method: 'POST' }),
      ]);

      onAction(t.clanManage.msgBackendDone, 'info');
      
      // Update data di UI (client-side SWR mutation)
      await Promise.all([
        mutateBasic(),
        mutateWar(),
        mutateRaid(),
        mutateWarLog(),
        mutateCWL(),
      ]);

      if (basicData.data?.ownerUpdated) {
        onAction(t.clanManage.msgOwnerUpdated, 'success');
        router.refresh();
      } else {
        onAction(t.clanManage.msgSyncSuccess, 'success');
        router.refresh(); // Refresh Server Components
      }

    } catch (err) {
      console.error("Sync Error:", err);
      const errorMessage = (err as Error).message || t.clanManage.msgSyncError;
      onAction(errorMessage, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading Skeleton sederhana jika data belum ada sama sekali
  const isLoading = isLoadingBasic || isLoadingWar || isLoadingRaid;
  
  // Data processing
  const lastSyncedDate = clanCache?.lastUpdated ? new Date(clanCache.lastUpdated) : new Date(0);
  const isCacheStale = !clanCache || lastSyncedDate.getTime() < Date.now() - 3600000;
  const lastSyncTime = clanCache?.lastUpdated ? new Date(clanCache.lastUpdated).toLocaleString(locale) : t.clanManage.never;

  const topPerformers = clanCache?.topPerformers;
  const currentWar = warData;
  const isWarActive = currentWar && currentWar.state !== 'notInWar' && currentWar.state !== 'warEnded';
  const isRaidDataAvailable = !!currentRaid && currentRaid.state === 'ended';

  const PROMOTION_LIMIT = 3;
  const DEMOTION_LIMIT = 3;
  const promotions = topPerformers?.promotions || [];
  const demotions = topPerformers?.demotions || [];
  const topDonatorData = topPerformers?.topDonator;
  const topRaidLooterData = topPerformers?.topRaidLooter;
  const donatorValue = (topDonatorData?.value as number) || 0;
  const looterValue = (topRaidLooterData?.value as number) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* --- DASHBOARD GRID UTAMA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Sync & Control Center */}
        <div className="bg-[#15171e]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col justify-between group hover:border-white/10 transition-colors">
          <div>
            <h3 className="text-lg font-clash text-white border-b border-white/5 pb-3 mb-3 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-coc-gold" /> 
              {t.clanManage.syncControlTitle}
            </h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              {t.clanManage.syncControlDesc}
              <br />
              <span className="text-white/60 text-xs mt-2 block font-mono">
                {t.clanPublicProfile.lastUpdated}: <span className="text-coc-blue">{lastSyncTime}</span>
              </span>
            </p>
          </div>

          <div className="space-y-3">
            {isManager ? (
              <Button
                onClick={handleSyncManual}
                variant={isCacheStale ? 'primary' : 'secondary'}
                disabled={isSyncing}
                className="w-full justify-center shadow-lg shadow-black/20"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t.clanManage.syncing : isCacheStale ? t.clanManage.syncManualStale : t.clanManage.syncManualNow}
              </Button>
            ) : (
              <Button
                onClick={handleRefreshUI}
                variant="tertiary"
                disabled={isSyncing}
                className="w-full justify-center"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {t.clanManage.reloadCache}
              </Button>
            )}
            
            <div className="text-[10px] text-gray-600 bg-black/20 p-2 rounded text-center border border-white/5 font-mono select-all">
              ID: {clan.id}
            </div>
          </div>
        </div>

        {/* Card 2: War Status */}
        <div className="bg-[#15171e]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-coc-red/10 rounded-full blur-[60px] -z-10 group-hover:bg-coc-red/20 transition-all duration-500 pointer-events-none" />
          
          <h3 className="text-lg font-clash text-white border-b border-white/5 pb-3 mb-3 flex items-center gap-2">
            <SwordsIcon className="h-5 w-5 text-coc-red" /> {t.clanManage.activeWarTitle}
          </h3>
          
          {isLoadingWar ? (
             <div className="h-40 flex items-center justify-center">
               <RefreshCwIcon className="animate-spin h-6 w-6 text-gray-500" />
             </div>
          ) : (
             // [FIX] Gunakan variabel currentWar apa adanya (tanpa !)
             <WarStatusDisplay war={currentWar} clanTag={clan.tag} t={t} />
          )}
        </div>

        {/* Card 3: Raid Summary */}
        <div className="bg-[#15171e]/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] -z-10 group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none" />

          <h3 className="text-lg font-clash text-white border-b border-white/5 pb-3 mb-3 flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-purple-400" /> {t.clanManage.raidTitle}
          </h3>

          {isLoadingRaid ? (
             <div className="h-40 flex items-center justify-center">
               <RefreshCwIcon className="animate-spin h-6 w-6 text-gray-500" />
             </div>
          ) : isRaidDataAvailable && currentRaid ? (
            <RaidSummaryDisplay raid={currentRaid} t={t} locale={locale} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <HomeIcon className="h-10 w-10 text-gray-600 mb-3 opacity-50" />
              <p className="text-sm text-gray-400 mb-4">{t.clanManage.raidNoData}</p>
              <Button href="/clan/manage?tab=raid" variant="secondary" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
                {t.clanManage.viewRaidArchive}
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* --- SECTION 2: TOP PERFORMERS --- */}
      <div>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3 pl-1">
          <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <TrophyIcon className="h-6 w-6 text-coc-gold" />
          </div>
          {t.clanManage.performanceTitle}
        </h2>

        {isLoadingBasic ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : topPerformers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Promosi (Green Theme) */}
            <TopPerformersCard
              title={t.clanManage.promotionsTitle}
              icon={<ArrowUpIcon className="h-5 w-5 text-coc-green" />}
              className="bg-coc-green/5 border-coc-green/20 text-white hover:border-coc-green/40 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]"
              value={promotions.length}
              description={t.clanManage.promotionsDesc.replace('{count}', PROMOTION_LIMIT.toString())}
              isPlayerList={true}
              players={promotions}
            />

            {/* Demosi (Red Theme) */}
            <TopPerformersCard
              title={t.clanManage.demotionsTitle}
              icon={<ArrowDownIcon className="h-5 w-5 text-coc-red" />}
              className="bg-coc-red/5 border-coc-red/20 text-white hover:border-coc-red/40 hover:shadow-[0_0_20px_rgba(248,113,113,0.1)]"
              value={demotions.length}
              description={t.clanManage.demotionsDesc.replace('{count}', DEMOTION_LIMIT.toString())}
              isPlayerList={true}
              players={demotions}
            />

            {/* Top Donator (Gold Theme) */}
            <TopPerformersCard
              title={t.clanManage.topDonator}
              icon={<CoinsIcon className="h-5 w-5 text-coc-gold" />}
              className="bg-coc-gold/5 border-coc-gold/20 text-white hover:border-coc-gold/40 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)]"
              value={topDonatorData?.name || 'N/A'}
              description={`${t.clanManage.totalDonations}: ${formatNumber(donatorValue)}`}
              isPlayerList={false}
              players={topDonatorData ? [topDonatorData] : []}
            />

            {/* Top Looter (Blue Theme) */}
            <TopPerformersCard
              title={t.clanManage.topLooter}
              icon={<HomeIcon className="h-5 w-5 text-coc-blue" />}
              className="bg-coc-blue/5 border-coc-blue/20 text-white hover:border-coc-blue/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              value={topRaidLooterData?.name || 'N/A'}
              description={`${t.clanManage.totalLoot}: ${formatNumber(looterValue)}`}
              isPlayerList={false}
              players={topRaidLooterData ? [topRaidLooterData] : []}
            />
          </div>
        ) : (
          <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <AlertTriangleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 font-clash tracking-wide text-lg">{t.clanManage.noPerformanceData}</p>
            <p className="text-sm text-gray-500 mt-2">Data will be available after the next synchronization.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryTabContent;