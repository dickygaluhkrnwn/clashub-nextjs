'use client';

import React from 'react';
import { useLanguage } from '@/lib/hooks/useLanguage';

/**
 * Komponen Loading Screen.
 * Desain: Gaming Loader dengan efek Pulse & Glow.
 */
export const ProfileLoading = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-8">
      {/* Container Spinner */}
      <div className="relative w-24 h-24">
        {/* Outer Ring Glow */}
        <div className="absolute inset-0 bg-coc-gold/20 rounded-full blur-xl animate-pulse" />
        
        {/* Spinning Outer Border */}
        <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-coc-gold/50 animate-spin" style={{ animationDuration: '1.5s' }} />
        
        {/* Spinning Inner Border (Reverse) */}
        <div className="absolute inset-3 rounded-full border-b-2 border-r-2 border-coc-blue/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
        
        {/* Center Core */}
        <div className="absolute inset-0 m-auto w-4 h-4 bg-coc-gold rounded-full shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-ping" />
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl text-white font-clash font-bold tracking-[0.2em] animate-pulse drop-shadow-md">
          {t.profileLoading.message}
        </h1>
        <div className="flex gap-1 justify-center">
            <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-2 h-2 bg-coc-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
};