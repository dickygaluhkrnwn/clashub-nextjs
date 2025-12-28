'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Gunakan ManagedClan dan UserProfile dari clashub.types agar konsisten dengan ManageClanClient
import { ManagedClan, UserProfile } from '@/lib/clashub.types';
import {
  CogsIcon,
  RefreshCwIcon,
  TrophyIcon,
  UserIcon,
  ShieldIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ClanManagementHeaderProps {
  clan: ManagedClan;
  profile: UserProfile;
}

const ClanManagementHeader: React.FC<ClanManagementHeaderProps> = ({
  clan,
  profile,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  
  // State untuk Loading
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Parsing Tanggal Sinkronisasi
  const lastSyncedDate =
    clan.lastSynced instanceof Date
      ? clan.lastSynced
      : new Date(clan.lastSynced || Date.now());

  // Indikator Cache Stale (1 Jam)
  const isCacheStale =
    !clan.lastSynced || lastSyncedDate.getTime() < Date.now() - 3600000;

  // Format Waktu
  const lastSyncTime = clan.lastSynced
    ? new Date(clan.lastSynced).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
    : t.clanManage.never;

  // --- HANDLER REFRESH UI (SOFT REFRESH) ---
  // Hanya mengambil data terbaru dari Database Firestore, TIDAK memanggil API CoC.
  // Gunakan tombol di tab "Ringkasan" untuk sinkronisasi penuh ke API CoC.
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh(); // Reload server components
    
    // Delay visual agar user merasakan feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Helper untuk Level/Points/Members (Fallback aman)
  const clanAny = clan as any;
  const clanLevel = clanAny.clanLevel || clanAny.level || '?';
  const clanPoints = clanAny.clanPoints || clanAny.points || 0;
  const memberCount = clanAny.memberCount || (Array.isArray(clanAny.members) ? clanAny.members.length : 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 backdrop-blur-md shadow-xl transition-all hover:border-white/20 group/card">
      {/* Efek Glow Background */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover/card:opacity-100 transition-opacity duration-700" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">

        {/* --- Bagian Kiri: Info Clan --- */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          
          {/* Badge & Level */}
          <div className="relative group">
            <div className="absolute inset-0 bg-coc-gold/10 rounded-full blur-xl group-hover:bg-coc-gold/20 transition-all duration-500" />
            
            <div className="relative h-20 w-20 md:h-24 md:w-24 flex items-center justify-center">
               {/* Container Badge */}
               <div className="h-full w-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                   {/* Fallback Icon jika tidak ada image badge */}
                   <CogsIcon className="h-10 w-10 md:h-12 md:w-12 text-coc-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
               </div>
               
               {/* Level Chip */}
               {clanLevel !== '?' && (
                 <div className="absolute -bottom-1 -right-1 bg-black/90 text-coc-gold text-xs font-bold px-2 py-0.5 rounded border border-coc-gold/30 shadow-lg backdrop-blur-sm">
                     Lvl {clanLevel}
                 </div>
               )}
            </div>
          </div>

          {/* Nama & Tag */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-clash text-white tracking-wide drop-shadow-md">
              {clan.name}
            </h1>
            <p className="text-coc-gold/80 font-sans font-medium text-sm md:text-base tracking-wider mb-4 uppercase">
              {clan.tag}
            </p>

            {/* Statistik Mini (Glass Badges) */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <div className="flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <UserIcon className="h-3.5 w-3.5 mr-2 text-coc-blue" />
                    <span className="text-xs text-gray-300 font-medium">{memberCount} Member</span>
                </div>
                
                {clanPoints > 0 && (
                  <div className="flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <TrophyIcon className="h-3.5 w-3.5 mr-2 text-coc-gold" />
                      <span className="text-xs text-gray-300 font-medium">{clanPoints} Pts</span>
                  </div>
                )}

                <div className="flex items-center px-3 py-1.5 rounded-full bg-coc-gold/10 border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                    <ShieldIcon className="h-3.5 w-3.5 mr-2 text-coc-gold" />
                    <span className="text-xs text-coc-gold font-bold uppercase">{profile.role}</span>
                </div>
            </div>
          </div>
        </div>

        {/* --- Bagian Kanan: Aksi & Status --- */}
        <div className="flex flex-col items-center md:items-end gap-4 mt-2 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
            
            {/* Tombol ini sekarang hanya me-refresh tampilan data dari DB */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full md:w-auto backdrop-blur-sm border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all group min-w-[140px]"
            >
                <RefreshCwIcon className={`h-4 w-4 mr-2 group-hover:text-coc-gold transition-colors ${isRefreshing ? 'animate-spin text-coc-gold' : ''}`} />
                {isRefreshing ? t.clanManage.processing : 'Refresh View'}
            </Button>

            <div className="text-center md:text-right">
                <div className={`flex items-center justify-center md:justify-end gap-2 text-sm font-bold ${isCacheStale ? 'text-red-400' : 'text-green-400'}`}>
                    <div className={`h-2 w-2 rounded-full ${isCacheStale ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                    {isCacheStale ? t.clanManage.syncNeeded : t.clanManage.dataFresh}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {t.clanManage.lastSynced}: <span className="font-mono text-gray-400">{lastSyncTime}</span>
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ClanManagementHeader;