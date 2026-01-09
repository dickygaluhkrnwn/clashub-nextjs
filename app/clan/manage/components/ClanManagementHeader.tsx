'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import Image dari next/image
// Gunakan ManagedClan dan UserProfile dari clashub.types agar konsisten dengan ManageClanClient
import { ManagedClan, UserProfile } from '@/lib/clashub.types';
import {
  CogsIcon,
  RefreshCwIcon,
  TrophyIcon,
  UserIcon,
  ShieldIcon,
  HashIcon,
  ClockIcon
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

  // [LOGIKA LOGO CLAN BARU - MENGGUNAKAN LOGIKA DARI PlayerClanCard]
  // Prioritas: 1. API Badge (Medium) -> 2. API Badge (Small) -> 3. Logo URL (Manual) -> 4. Placeholder
  const clanBadgeUrl = 
    clan.badgeUrls?.medium || 
    clan.badgeUrls?.small || 
    clan.logoUrl || 
    '/images/clan-badge-placeholder.png';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#15171e]/80 backdrop-blur-xl shadow-2xl transition-all hover:border-white/20 group/card ring-1 ring-white/5">
      {/* Efek Glow Background */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-coc-gold/10 rounded-full blur-[100px] pointer-events-none opacity-60 group-hover/card:opacity-100 transition-opacity duration-700" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-coc-blue/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">

        {/* --- Bagian Kiri: Info Clan --- */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          
          {/* Badge & Level */}
          <div className="relative group shrink-0">
            {/* Glow effect belakang badge */}
            <div className="absolute inset-0 bg-coc-blue/20 rounded-full blur-2xl group-hover:bg-coc-blue/30 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            
            <div className="relative h-24 w-24 md:h-28 md:w-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
               
               {/* Container Badge - Menggunakan Next Image dengan unoptimized */}
               <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                   <Image 
                       src={clanBadgeUrl} 
                       alt={`${clan.name} Badge`}
                       fill
                       className="object-contain"
                       sizes="(max-width: 768px) 96px, 112px"
                       priority
                       unoptimized // Agar bisa memuat gambar eksternal tanpa konfigurasi domain next.config.js yang rumit saat dev
                   />
               </div>
               
               {/* Level Chip (Absolute Positioned) */}
               {clanLevel !== '?' && (
                 <div className="absolute -bottom-2 -right-2 bg-black/90 text-coc-gold text-sm font-bold font-mono px-2.5 py-1 rounded-lg border border-coc-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.2)] backdrop-blur-md flex items-center gap-1 z-20">
                     <span className="text-[10px] text-gray-400 uppercase tracking-wider">Lvl</span>
                     {clanLevel}
                 </div>
               )}
            </div>
          </div>

          {/* Nama & Tag */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-clash text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {clan.name}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-5 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-coc-gold/90 bg-coc-gold/5 border border-coc-gold/10 tracking-wider">
                    <HashIcon className="w-3 h-3 mr-1 opacity-50" />
                    {clan.tag.replace('#', '')}
                </span>
                {clan.warLeague && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-blue-400 bg-blue-500/5 border border-blue-500/10 uppercase tracking-wider">
                        {clan.warLeague.name}
                    </span>
                )}
            </div>

            {/* Statistik Mini (Glass Badges) */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="group flex items-center px-3 py-1.5 rounded-lg bg-[#0a0a0b]/60 border border-white/5 hover:border-coc-blue/30 hover:bg-coc-blue/5 transition-all duration-300">
                    <UserIcon className="h-4 w-4 mr-2 text-coc-blue group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all" />
                    <span className="text-sm text-gray-300 font-mono group-hover:text-white">{memberCount}</span>
                    <span className="text-xs text-gray-500 ml-1.5 uppercase tracking-wide">Members</span>
                </div>
                
                {clanPoints > 0 && (
                  <div className="group flex items-center px-3 py-1.5 rounded-lg bg-[#0a0a0b]/60 border border-white/5 hover:border-coc-gold/30 hover:bg-coc-gold/5 transition-all duration-300">
                      <TrophyIcon className="h-4 w-4 mr-2 text-coc-gold group-hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] transition-all" />
                      <span className="text-sm text-gray-300 font-mono group-hover:text-white">{clanPoints.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1.5 uppercase tracking-wide">Pts</span>
                  </div>
                )}

                <div className="group flex items-center px-3 py-1.5 rounded-lg bg-coc-gold/5 border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.05)]">
                    <ShieldIcon className="h-4 w-4 mr-2 text-coc-gold" />
                    <span className="text-xs text-coc-gold font-bold uppercase tracking-widest">{profile.role}</span>
                </div>
            </div>
          </div>
        </div>

        {/* --- Bagian Kanan: Aksi & Status --- */}
        <div className="flex flex-col items-center md:items-end gap-4 mt-2 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
            
            {/* Tombol ini sekarang hanya me-refresh tampilan data dari DB */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full md:w-auto backdrop-blur-md border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all group min-w-[160px] h-10 shadow-lg hover:shadow-coc-gold/10 hover:border-coc-gold/20"
            >
                <RefreshCwIcon className={`h-4 w-4 mr-2 group-hover:text-coc-gold transition-colors ${isRefreshing ? 'animate-spin text-coc-gold' : ''}`} />
                {isRefreshing ? t.clanManage.processing : 'Refresh View'}
            </Button>

            <div className="text-center md:text-right space-y-1">
                <div className={`inline-flex items-center justify-center md:justify-end gap-2 px-3 py-1 rounded-full border ${isCacheStale ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${isCacheStale ? 'bg-red-500' : 'bg-green-500'} animate-pulse shadow-[0_0_8px_currentColor]`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{isCacheStale ? t.clanManage.syncNeeded : t.clanManage.dataFresh}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-end text-xs text-gray-500 group cursor-default">
                    <ClockIcon className="w-3 h-3 mr-1.5 opacity-50 group-hover:text-coc-blue transition-colors" />
                    {t.clanManage.lastSynced}: <span className="font-mono text-gray-400 ml-1 group-hover:text-white transition-colors">{lastSyncTime}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ClanManagementHeader;