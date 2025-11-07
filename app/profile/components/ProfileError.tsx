// File: app/profile/components/ProfileError.tsx

'use client';

import React from 'react';
// [FIX] Hapus useRouter, logic retry akan di-pass dari parent
// import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import {
  InfoIcon,
  XIcon,
  AlertTriangleIcon,
} from '@/app/components/icons';

interface ProfileErrorProps {
  error: string | null; // [FIX] Izinkan error jadi null
  isMissingProfile: boolean;
  onRetry?: () => void; // [FIX] Tambahkan prop onRetry opsional
}

/**
 * Komponen untuk menampilkan pesan error di halaman profil.
 * Menangani 2 kasus: 'Profil Belum Lengkap' dan 'Error Fatal'.
 */
export const ProfileError = ({
  error,
  isMissingProfile,
  onRetry, // [FIX] Terima prop onRetry
}: ProfileErrorProps) => {
  // [FIX] Hapus const router = useRouter();

  // 1. Kasus Error: Profil belum lengkap (Missing Profile)
  if (isMissingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card-stone p-8 max-w-md text-center rounded-lg">
          <InfoIcon className="h-12 w-12 text-coc-gold mx-auto mb-4" />
          <h2 className="text-2xl text-coc-gold font-clash mb-4">
            Profil Belum Lengkap
          </h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button href="/profile/edit" variant="primary">
            <XIcon className="inline h-5 w-5 mr-2" /> Mulai Edit CV
          </Button>
        </div>
      </div>
    );
  }

  // 2. Kasus Error: Error fatal lainnya
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="card-stone p-8 max-w-md text-center rounded-lg">
        <AlertTriangleIcon className="h-12 w-12 text-coc-red mx-auto mb-4" />
        <h2 className="text-2xl text-coc-red font-clash mb-4">
          Error Memuat Profil
        </h2>
        <p className="text-gray-400 mb-6">{error}</p>
        {/* [FIX] Gunakan prop onRetry yang di-pass dari parent */}
        <Button onClick={onRetry} variant="primary">
          Coba Lagi
        </Button>
      </div>
    </div>
  );
};