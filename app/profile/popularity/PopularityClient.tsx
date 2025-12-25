'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { 
  TrophyIcon, 
  ChevronLeftIcon, 
  InfoIcon, 
  StarIcon, 
  EditIcon, 
  MessageSquareIcon,
  ThumbsUpIcon,
  AlertTriangleIcon // [FIX] Ditambahkan
} from '@/app/components/icons';
import { ProfileLoading } from '../components/ProfileLoading';
import { TIERS, getTierForPoints } from '@/lib/popularity-utils';

const PopularityClient = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <ProfileLoading />;
  }

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 p-8 rounded-2xl text-center max-w-md">
          <h1 className="text-2xl font-clash text-coc-red mb-2">Akses Ditolak</h1>
          <p className="text-gray-300">
            Gagal memuat profil pengguna. Silakan coba login kembali.
          </p>
          <Link href="/auth" className="mt-4 inline-block text-coc-gold hover:underline">
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  const currentPoints = userProfile.popularityPoints || 0;
  const currentTier = getTierForPoints(currentPoints);

  // Helper untuk menghitung progress ke tier berikutnya
  const nextTierIndex = TIERS.findIndex(t => t.name === currentTier.name) + 1;
  const nextTier = TIERS[nextTierIndex];
  let progressPercent = 100;
  
  if (nextTier) {
    const currentTierMin = currentTier.minPoints;
    const nextTierMin = nextTier.minPoints;
    const range = nextTierMin - currentTierMin;
    const progress = currentPoints - currentTierMin;
    progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tombol Kembali */}
      <Link
        href="/profile"
        className="inline-flex items-center text-gray-400 hover:text-white transition-colors group mb-2"
      >
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 mr-3 transition-colors">
           <ChevronLeftIcon className="h-5 w-5" />
        </div>
        <span className="font-medium">Kembali ke Profil</span>
      </Link>

      {/* Main Container */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-coc-gold/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        {/* Header Section */}
        <div className="relative z-10 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-clash text-white mb-3 tracking-wide">
            Poin <span className="text-coc-gold">Popularitas</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Tingkatkan reputasi Anda di komunitas Clashub dengan aktif berkontribusi. 
            Semakin tinggi poin, semakin prestisius Badge yang Anda dapatkan!
          </p>
        </div>

        {/* Current Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-12">
          {/* Card: Poin */}
          <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-coc-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Poin Anda</p>
            <div className="flex items-center justify-center gap-2">
               <span className="text-6xl md:text-7xl font-clash text-white group-hover:scale-110 transition-transform duration-300 inline-block">
                 {currentPoints}
               </span>
            </div>
            <div className="mt-4 w-full bg-white/10 h-2 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-coc-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]" 
                 style={{ width: `${nextTier ? progressPercent : 100}%` }}
               />
            </div>
            {nextTier && (
              <p className="text-xs text-gray-400 mt-2">
                {nextTier.minPoints - currentPoints} poin lagi menuju <span className={`${nextTier.colorClass} font-bold`}>{nextTier.name}</span>
              </p>
            )}
          </div>

          {/* Card: Tier */}
          <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 text-center relative group overflow-hidden flex flex-col items-center justify-center">
             <div className={`absolute inset-0 opacity-10 bg-current transition-colors duration-500 ${currentTier.colorClass.replace('text-', 'bg-')}`} />
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Pangkat Saat Ini</p>
             <div className="relative">
                <div className={`absolute inset-0 blur-2xl opacity-40 ${currentTier.colorClass.replace('text-', 'bg-')}`} />
                <TrophyIcon className={`h-24 w-24 md:h-28 md:w-28 relative z-10 ${currentTier.colorClass} drop-shadow-2xl`} fill="currentColor" />
             </div>
             <h2 className={`text-3xl md:text-4xl font-clash mt-4 ${currentTier.colorClass}`}>
               {currentTier.name}
             </h2>
          </div>
        </section>

        {/* Tier List Section */}
        <section className="relative z-10 mb-12">
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px bg-white/10 flex-grow" />
             <h2 className="text-xl font-clash text-white uppercase tracking-wider">Jenjang Pangkat</h2>
             <div className="h-px bg-white/10 flex-grow" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier) => {
              const isCurrent = tier.name === currentTier.name;
              const isUnlocked = currentPoints >= tier.minPoints;
              
              return (
                <div 
                  key={tier.name}
                  className={`
                    relative p-5 rounded-xl border transition-all duration-300
                    ${isCurrent 
                      ? 'bg-white/10 border-coc-gold shadow-[0_0_20px_rgba(255,215,0,0.15)] scale-105 z-10' 
                      : isUnlocked 
                        ? 'bg-white/5 border-white/10 opacity-80 hover:opacity-100' 
                        : 'bg-black/20 border-white/5 opacity-40 grayscale'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <TrophyIcon className={`h-8 w-8 ${tier.colorClass}`} fill="currentColor" />
                    {isCurrent && (
                      <span className="bg-coc-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                        SAAT INI
                      </span>
                    )}
                  </div>
                  <h3 className={`font-clash text-lg font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {tier.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {tier.minPoints}+ Poin
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How to Earn Points Section */}
        <section className="relative z-10">
          <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/5">
            <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
              <InfoIcon className="h-6 w-6 text-coc-blue" />
              Cara Mendapatkan Poin
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="p-3 bg-coc-green/10 rounded-lg text-coc-green">
                  <EditIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Buat Postingan</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Bagikan strategi atau base layout di Knowledge Hub.
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-coc-green bg-coc-green/10 px-2 py-1 rounded">
                    +5 Poin
                  </span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="p-3 bg-coc-gold/10 rounded-lg text-coc-gold">
                  <ThumbsUpIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Terima Like (Soon)</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Dapatkan apresiasi dari komunitas untuk konten Anda.
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-coc-gold bg-coc-gold/10 px-2 py-1 rounded">
                    +1 Poin / Like
                  </span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                  <MessageSquareIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Review Player (Soon)</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Berikan ulasan konstruktif kepada pemain lain.
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                    +2 Poin
                  </span>
                </div>
              </div>

              {/* Penalty Info */}
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-coc-red/10 bg-coc-red/5">
                <div className="p-3 bg-coc-red/10 rounded-lg text-coc-red">
                  <AlertTriangleIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Penalti</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Menghapus postingan dalam waktu 24 jam.
                  </p>
                  <span className="inline-block mt-2 text-xs font-bold text-coc-red bg-coc-red/10 px-2 py-1 rounded">
                    -5 Poin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PopularityClient;