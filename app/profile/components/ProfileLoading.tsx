'use client';

import React from 'react';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

/**
 * Komponen untuk menampilkan UI loading saat sesi pengguna sedang diverifikasi.
 */
export const ProfileLoading = () => {
  const { t } = useLanguage(); // [BARU]

  return (
    <div className="flex justify-center items-center min-h-screen">
      <h1 className="text-3xl text-coc-gold font-clash animate-pulse">
        {/* [TERJEMAHAN] */}
        {t.profileLoading.message}
      </h1>
    </div>
  );
};