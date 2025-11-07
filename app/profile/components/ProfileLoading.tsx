// File: app/profile/components/ProfileLoading.tsx

import React from 'react';

/**
 * Komponen untuk menampilkan UI loading saat sesi pengguna sedang diverifikasi.
 */
export const ProfileLoading = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <h1 className="text-3xl text-coc-gold font-clash animate-pulse">
        Memuat Sesi Pengguna...
      </h1>
    </div>
  );
};