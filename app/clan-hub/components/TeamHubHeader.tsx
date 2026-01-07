import React from 'react';
import { ShieldIcon } from '@/app/components/icons';

// [PERUBAHAN] Tidak lagi menerima props 'promotions'
export const TeamHubHeader = () => {
  return (
    <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-[#15171e]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110 opacity-40"
        style={{ backgroundImage: "url('/images/banner-teamhub.png')" }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 flex flex-col items-start justify-center min-h-[250px] md:min-h-[300px]">
        <div className="flex items-center gap-3 mb-4 animate-in slide-in-from-left-4 duration-700">
           <div className="p-2 bg-coc-blue/10 rounded-lg border border-coc-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ShieldIcon className="h-6 w-6 text-coc-blue drop-shadow-md" />
           </div>
           <span className="text-xs font-bold text-coc-blue uppercase tracking-[0.2em]">Recruitment Center</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-clash font-bold text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight max-w-3xl animate-in slide-in-from-bottom-4 duration-700 delay-100">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-coc-gold to-yellow-200">Perfect Clan</span>
        </h1>
        
        <p className="text-gray-300 text-sm md:text-lg max-w-xl font-sans leading-relaxed drop-shadow-md animate-in slide-in-from-bottom-4 duration-700 delay-200">
          Temukan klan kompetitif, rekrut pemain berbakat, atau cari rumah baru untuk berkembang bersama komunitas Clashub.
        </p>
      </div>
    </section>
  );
};