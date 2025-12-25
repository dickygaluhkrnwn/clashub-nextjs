'use client';

import React from 'react';
import { useLanguage } from '@/lib/hooks/useLanguage';

/**
 * Komponen Loading Screen.
 * Desain: Minimalist Pulse Text.
 */
export const ProfileLoading = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
      {/* Custom Spinner / Logo Pulse */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 bg-coc-gold/20 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-coc-dark border-2 border-coc-gold rounded-full w-16 h-16 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.3)]">
           {/* Bisa diganti logo app kecil */}
           <div className="w-2 h-2 bg-coc-gold rounded-full animate-pulse" />
        </div>
      </div>
      
      <h1 className="text-xl md:text-2xl text-white font-clash font-medium tracking-wide animate-pulse">
        {t.profileLoading.message}
      </h1>
    </div>
  );
};