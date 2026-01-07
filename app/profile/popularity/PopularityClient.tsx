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
  AlertTriangleIcon
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
        <div className="bg-[#15171e]/90 backdrop-blur-md border border-red-500/30 p-8 rounded-2xl text-center max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse-slow" />
          <h1 className="text-2xl font-clash text-coc-red mb-3 uppercase tracking-wider relative z-10">Access Denied</h1>
          <p className="text-gray-300 relative z-10">
            Gagal memuat profil pengguna. Silakan coba login kembali.
          </p>
          <Link href="/auth" className="mt-6 inline-flex items-center px-6 py-2 bg-coc-red/10 border border-coc-red/30 text-coc-red rounded-lg hover:bg-coc-red/20 transition-all font-bold relative z-10">
            KE HALAMAN LOGIN
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
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
      {/* Global Background Ambience */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-coc-gold/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-coc-blue/5 via-transparent to-transparent pointer-events-none z-0" />

      <main className="container mx-auto p-4 md:p-8 mt-6 relative z-10 max-w-5xl">
        
        {/* Navigation Back */}
        <Link
          href="/profile"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors group mb-8 px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-wide text-sm">BACK TO PROFILE</span>
        </Link>

        {/* Hero Section: Rank & Points */}
        <div className="bg-[#15171e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden mb-8 group/hero">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-coc-gold/30 to-transparent opacity-50" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            
            {/* Rank Badge Visualization */}
            <div className="relative flex-shrink-0">
               {/* Rank Glow */}
               <div className={`absolute inset-0 blur-[60px] opacity-40 rounded-full animate-pulse-slow ${currentTier.colorClass.replace('text-', 'bg-')}`} />
               
               <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center">
                  {/* Hexagon/Shield Background (CSS Shape or just container) */}
                  <div className={`absolute inset-0 bg-gradient-to-b from-[#1a1d26] to-[#0a0a0b] border-2 ${currentTier.colorClass.replace('text-', 'border-')} rounded-full opacity-80 shadow-2xl`} />
                  <TrophyIcon className={`h-24 w-24 md:h-32 md:w-32 relative z-10 ${currentTier.colorClass} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`} fill="currentColor" />
               </div>
               
               <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0a0a0b] px-6 py-1.5 rounded-full border border-white/10 shadow-xl whitespace-nowrap">
                  <span className={`text-lg md:text-xl font-bold uppercase tracking-widest ${currentTier.colorClass}`}>
                    {currentTier.name}
                  </span>
               </div>
            </div>

            {/* Points & Progress */}
            <div className="flex-1 w-full text-center md:text-left">
               <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-wide drop-shadow-md">
                 Popularity <span className="text-coc-gold">Points</span>
               </h1>
               <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg mb-8">
                 Tingkatkan reputasi Anda di komunitas Clashub. Raih poin, naikkan pangkat, dan jadilah legenda!
               </p>

               <div className="bg-[#0f1115] rounded-2xl p-6 border border-white/5 relative overflow-hidden group/stats">
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Points</p>
                        <p className="text-4xl md:text-5xl font-clash text-white drop-shadow-md">{currentPoints}</p>
                     </div>
                     {nextTier && (
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Next Rank</p>
                           <p className={`text-xl font-bold ${nextTier.colorClass}`}>{nextTier.name}</p>
                        </div>
                     )}
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden mt-4">
                     <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${currentTier.colorClass.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`}
                        style={{ width: `${nextTier ? progressPercent : 100}%` }}
                     />
                  </div>
                  {nextTier ? (
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {nextTier.minPoints - currentPoints} points to level up
                    </p>
                  ) : (
                    <p className="text-xs text-coc-gold mt-2 text-right font-bold flex items-center justify-end gap-1">
                      <StarIcon className="h-3 w-3" /> MAX RANK ACHIEVED
                    </p>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Tier List Grid */}
        <section className="mb-12">
           <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-white/10 flex-grow" />
              <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Rank Hierarchy</h2>
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
                      relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center
                      ${isCurrent 
                        ? 'bg-gradient-to-b from-[#1a1d26] to-[#0f1115] border-coc-gold/50 shadow-[0_0_30px_rgba(255,215,0,0.1)] scale-105 z-10' 
                        : isUnlocked 
                          ? 'bg-[#0f1115] border-white/10 opacity-100 hover:border-white/20' 
                          : 'bg-[#0a0a0b] border-white/5 opacity-40 grayscale'
                      }
                    `}
                  >
                    {isCurrent && (
                        <div className="absolute -top-3 px-3 py-1 bg-coc-gold text-black text-[10px] font-bold rounded-full shadow-lg border border-yellow-300">
                           CURRENT
                        </div>
                    )}
                    
                    <div className="mb-4 p-3 bg-white/5 rounded-full border border-white/5">
                       <TrophyIcon className={`h-8 w-8 ${tier.colorClass}`} fill="currentColor" />
                    </div>
                    
                    <h3 className={`font-clash text-lg font-bold mb-1 uppercase tracking-wide ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                      {tier.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                      {tier.minPoints}+ Pts
                    </p>
                  </div>
                );
              })}
           </div>
        </section>

        {/* "How to Earn" Quest Board */}
        <section className="bg-[#15171e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-coc-blue" />
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-coc-blue/10 rounded-xl border border-coc-blue/20">
                 <InfoIcon className="h-6 w-6 text-coc-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                 How to Earn Points
              </h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quest Item 1 */}
              <div className="group flex items-center gap-4 p-4 bg-[#0a0a0b] border border-white/5 rounded-2xl hover:border-coc-green/30 transition-all duration-300 hover:bg-[#0f1115]">
                 <div className="w-12 h-12 rounded-xl bg-coc-green/10 flex items-center justify-center text-coc-green border border-coc-green/20 group-hover:scale-110 transition-transform">
                    <EditIcon className="h-6 w-6" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Create Post</h3>
                    <p className="text-xs text-gray-400">Bagikan strategi atau base layout.</p>
                 </div>
                 <div className="px-3 py-1 bg-coc-green/10 text-coc-green text-xs font-bold rounded-lg border border-coc-green/20">
                    +5 PTS
                 </div>
              </div>

              {/* Quest Item 2 */}
              <div className="group flex items-center gap-4 p-4 bg-[#0a0a0b] border border-white/5 rounded-2xl hover:border-coc-gold/30 transition-all duration-300 hover:bg-[#0f1115]">
                 <div className="w-12 h-12 rounded-xl bg-coc-gold/10 flex items-center justify-center text-coc-gold border border-coc-gold/20 group-hover:scale-110 transition-transform">
                    <ThumbsUpIcon className="h-6 w-6" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Receive Likes</h3>
                    <p className="text-xs text-gray-400">Dapatkan apresiasi komunitas.</p>
                 </div>
                 <div className="px-3 py-1 bg-coc-gold/10 text-coc-gold text-xs font-bold rounded-lg border border-coc-gold/20">
                    +1 PTS
                 </div>
              </div>

              {/* Quest Item 3 */}
              <div className="group flex items-center gap-4 p-4 bg-[#0a0a0b] border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all duration-300 hover:bg-[#0f1115]">
                 <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <MessageSquareIcon className="h-6 w-6" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Review Player</h3>
                    <p className="text-xs text-gray-400">Berikan ulasan konstruktif (Soon).</p>
                 </div>
                 <div className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20">
                    +2 PTS
                 </div>
              </div>

              {/* Penalty Item */}
              <div className="group flex items-center gap-4 p-4 bg-coc-red/5 border border-coc-red/10 rounded-2xl hover:border-coc-red/30 transition-all duration-300">
                 <div className="w-12 h-12 rounded-xl bg-coc-red/10 flex items-center justify-center text-coc-red border border-coc-red/20 group-hover:scale-110 transition-transform">
                    <AlertTriangleIcon className="h-6 w-6" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">Spamming</h3>
                    <p className="text-xs text-gray-400">Hapus post dalam 24 jam.</p>
                 </div>
                 <div className="px-3 py-1 bg-coc-red/10 text-coc-red text-xs font-bold rounded-lg border border-coc-red/20">
                    -5 PTS
                 </div>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
};

export default PopularityClient;