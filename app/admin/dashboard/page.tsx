'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  UsersIcon, 
  ShieldIcon, 
  TrophyIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  GlobeIcon
} from '@/app/components/icons';
import { 
  collection, 
  getCountFromServer, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase'; // Client SDK

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    clans: 0,
    tournaments: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [health, setHealth] = useState({
    cocSync: { status: 'checking' as 'operational' | 'warning' | 'error' | 'checking', lastRun: 'Checking...' },
    youtubeSync: { status: 'checking' as 'operational' | 'warning' | 'error' | 'checking', lastRun: 'Checking...' }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // --- 1. Fetch Statistik Dasar (Parallel Count) ---
        const usersColl = collection(db, 'users');
        const clansColl = collection(db, 'managedClans');
        const tournamentsColl = collection(db, 'tournaments');
        
        // Query untuk turnamen yang sedang "hidup"
        const activeTourneyQuery = query(
          tournamentsColl, 
          where('status', 'in', ['scheduled', 'registration_open', 'registration_closed', 'ongoing'])
        );

        // Menjalankan count secara paralel agar cepat
        const [usersSnap, clansSnap, tourneySnap] = await Promise.all([
          getCountFromServer(usersColl),
          getCountFromServer(clansColl),
          getCountFromServer(activeTourneyQuery)
        ]);

        setStats({
          users: usersSnap.data().count,
          clans: clansSnap.data().count,
          tournaments: tourneySnap.data().count
        });

        // --- 2. Cek Kesehatan Sistem (Health Check) ---
        
        // A. Cek CoC Sync (Berdasarkan klan yang paling baru di-update)
        const lastSyncedClanQuery = query(clansColl, orderBy('lastSyncedBasic', 'desc'), limit(1));
        const clanSnap = await getDocs(lastSyncedClanQuery);
        
        if (!clanSnap.empty) {
          const data = clanSnap.docs[0].data();
          // lastSyncedBasic bisa berupa Firestore Timestamp
          const lastSync = data.lastSyncedBasic instanceof Timestamp 
            ? data.lastSyncedBasic.toDate() 
            : new Date(data.lastSyncedBasic || 0);

          if (lastSync.getTime() > 0) {
             const diffMins = (Date.now() - lastSync.getTime()) / (1000 * 60);
             let status: 'operational' | 'warning' | 'error' = 'operational';
             
             // Logika Status:
             // > 60 menit: Warning (Mungkin cron telat)
             // > 24 jam: Error (Cron mati total)
             if (diffMins > 60) status = 'warning';
             if (diffMins > 1440) status = 'error';
             
             setHealth(prev => ({
               ...prev,
               cocSync: { 
                 status, 
                 lastRun: diffMins < 1 ? 'Just now' : diffMins < 60 ? `${Math.floor(diffMins)} mins ago` : `${Math.floor(diffMins/60)} hours ago` 
               }
             }));
          } else {
             setHealth(prev => ({ ...prev, cocSync: { status: 'warning', lastRun: 'Never' } }));
          }
        } else {
             setHealth(prev => ({ ...prev, cocSync: { status: 'warning', lastRun: 'No Clans' } }));
        }

        // B. Cek YouTube Sync (Berdasarkan video terbaru di DB)
        const videosColl = collection(db, 'videos');
        const lastVideoQuery = query(videosColl, orderBy('publishedAt', 'desc'), limit(1));
        const videoSnap = await getDocs(lastVideoQuery);

        if (!videoSnap.empty) {
           const vidData = videoSnap.docs[0].data();
           const pubDate = vidData.publishedAt instanceof Timestamp 
             ? vidData.publishedAt.toDate() 
             : new Date(vidData.publishedAt);
           
           // Karena Supercell tidak upload video tiap hari, kita anggap Operational
           // asalkan ada video di database. Tanggal hanya sebagai info.
           const diffDays = Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
           
           setHealth(prev => ({
             ...prev,
             youtubeSync: { 
               status: 'operational', 
               lastRun: diffDays === 0 ? 'Today' : `${diffDays} days ago` 
             }
           }));
        } else {
           setHealth(prev => ({ ...prev, youtubeSync: { status: 'error', lastRun: 'No videos found' } }));
        }

      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Selamat datang kembali, Master Admin. Berikut data <span className="text-coc-gold font-bold">Realtime</span> dari sistem Clashub.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Stats */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-coc-blue/10 rounded-full blur-[40px] -z-10 group-hover:bg-coc-blue/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <UsersIcon className="h-6 w-6 text-coc-blue" />
              </div>
            </div>
            <h3 className="text-3xl font-clash text-white mb-1">
              {loading ? '...' : stats.users}
            </h3>
            <p className="text-sm text-gray-400">Total Pengguna</p>
        </div>

        {/* Clan Stats */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-coc-gold/10 rounded-full blur-[40px] -z-10 group-hover:bg-coc-gold/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <ShieldIcon className="h-6 w-6 text-coc-gold" />
              </div>
            </div>
            <h3 className="text-3xl font-clash text-white mb-1">
              {loading ? '...' : stats.clans}
            </h3>
            <p className="text-sm text-gray-400">Klan Terdaftar</p>
        </div>

        {/* Tournament Stats */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-[40px] -z-10 group-hover:bg-purple-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <TrophyIcon className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-3xl font-clash text-white mb-1">
              {loading ? '...' : stats.tournaments}
            </h3>
            <p className="text-sm text-gray-400">Turnamen Aktif</p>
        </div>

      </div>

      {/* System Health Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cron Job Status */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-clash text-white mb-6 flex items-center gap-2">
            <RefreshCwIcon className="h-5 w-5 text-coc-green" /> System Health Monitor
          </h3>
          
          <div className="space-y-4">
            <HealthItem 
              label="CoC Clan Sync" 
              status={health.cocSync.status} 
              lastRun={health.cocSync.lastRun} 
            />
            <HealthItem 
              label="YouTube Content Sync" 
              status={health.youtubeSync.status} 
              lastRun={health.youtubeSync.lastRun} 
            />
            <HealthItem 
              label="Firestore Database" 
              status="operational" 
              lastRun="Connected" 
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
          {health.youtubeSync.status === 'error' ? (
             <>
                <div className="bg-coc-red/10 p-4 rounded-full mb-4 animate-pulse">
                    <AlertTriangleIcon className="h-8 w-8 text-coc-red" />
                </div>
                <h3 className="text-lg font-clash text-white mb-2">Video Tidak Ditemukan</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">
                    Database video kosong. Harap jalankan sinkronisasi manual untuk mengisi konten Knowledge Hub.
                </p>
             </>
          ) : (
             <>
                <div className="bg-coc-blue/10 p-4 rounded-full mb-4">
                    <GlobeIcon className="h-8 w-8 text-coc-blue" />
                </div>
                <h3 className="text-lg font-clash text-white mb-2">Kelola Konten</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">
                    Cek log sinkronisasi YouTube atau hapus video lama yang tidak relevan.
                </p>
             </>
          )}
          
          <Link 
            href="/admin/youtube" 
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all hover:scale-105"
          >
            Buka YouTube Manager
          </Link>
        </div>

      </div>
    </div>
  );
}

// Helper Component untuk Status Bar
const HealthItem = ({ label, status, lastRun }: { label: string, status: 'operational' | 'warning' | 'error' | 'checking', lastRun: string }) => {
  const statusColors = {
    operational: 'bg-coc-green shadow-[0_0_8px_rgba(0,255,0,0.5)]',
    warning: 'bg-coc-gold shadow-[0_0_8px_rgba(255,215,0,0.5)]',
    error: 'bg-coc-red shadow-[0_0_8px_rgba(255,0,0,0.5)]',
    checking: 'bg-gray-500 animate-pulse'
  };

  const statusLabel = {
    operational: 'Operational',
    warning: 'Delayed',
    error: 'Error/Offline',
    checking: 'Checking...'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}></div>
        <span className="text-sm font-medium text-gray-200">{label}</span>
      </div>
      <div className="text-right">
        <p className={`text-xs font-bold uppercase mb-0.5 ${status === 'operational' ? 'text-coc-green' : status === 'error' ? 'text-coc-red' : 'text-gray-400'}`}>
            {statusLabel[status]}
        </p>
        <p className="text-[10px] font-mono text-gray-500">
            {lastRun}
        </p>
      </div>
    </div>
  );
};